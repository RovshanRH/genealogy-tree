// Триггерные функции перенесены из SQL в TypeScript:
// 1. setAliveStatus       — isalive выставляется автоматически по наличию death_place
// 2. checkMaritalStatus   — валидация совместимости spouse и marital_status
// 3. autoFillingRows      — fullname, fulladdress, cityaddress считаются на лету
// 4. relationCRUD         — запись в таблицу relations при INSERT / UPDATE / DELETE
// 5. countCharacters      — счётчики в genealogy_tree
//
// НЕ перенесено: update_updated_at_column (остаётся на уровне БД)

import { prisma } from "../lib/prisma.ts";

import type {
  personCreateInput,
  personUpdateInput,
} from "../generated/prisma/models/person";

import type {
  genealogy_treeCreateInput,
  genealogy_treeUpdateInput,
} from "../generated/prisma/models/genealogy_tree.ts";

import { personDataBuilder } from "../utils/CreatePersonHelpers.ts";

// ---------------------------------------------------------------------------
// Типы
// ---------------------------------------------------------------------------

type MaritalStatus = "single" | "divorced" | "married" | "widowed";
type Gender = "male" | "female";

interface PersonSnapshot {
  id: string;
  isalive: boolean | null;
  gender: Gender;
  mother: string | null;
  father: string | null;
  genealogy_tree_id: string | null;
}

// ---------------------------------------------------------------------------
// Вспомогательные функции (бывшие триггеры)
// ---------------------------------------------------------------------------

/**
 * [setAliveStatus]
 * Аналог SQL-триггера: если есть death_place — человек НЕ жив, иначе — жив.
 * (Логика в оригинальном SQL была инвертирована — здесь исправлено.)
 */
function computeIsAlive(deathPlaceId: string | null | undefined): boolean {
  return deathPlaceId == null;
}

/**
 * [checkMaritalStatus]
 * Аналог SQL-триггера: проверяет совместимость spouse и marital_status.
 * Бросает ошибку, если данные противоречивы.
 */
function checkMaritalStatus(
  spouseId: string | null | undefined,
  maritalStatus: MaritalStatus,
): void {
  if (
    spouseId != null &&
    (maritalStatus === "single" || maritalStatus === "divorced")
  ) {
    throw new Error(
      `Супруг указан, но семейный статус "${maritalStatus}" несовместим с наличием супруга`,
    );
  }
  if (
    spouseId == null &&
    (maritalStatus === "married" || maritalStatus === "widowed")
  ) {
    throw new Error(
      `Супруг не указан, но семейный статус "${maritalStatus}" требует наличия супруга`,
    );
  }
}

/**
 * [fullNameCreater]
 * Аналог SQL-функции: собирает полное имя из частей.
 */
function buildFullName(
  firstName: string,
  surname: string | null | undefined,
  patronymic: string | null | undefined,
): string {
  return [surname, firstName, patronymic].filter(Boolean).join(" ");
}

/**
 * [fullAddressCreater / autoFillingRows]
 * Аналог SQL-триггера: строит fulladdress и cityaddress по residence_id.
 * Возвращает [fullAddress, cityAddress].
 */
async function buildAddressStrings(
  tx: any,
  residenceId: string,
): Promise<[string, string]> {
  const res = await tx.residence.findUnique({
    where: { id: residenceId },
    include: {
      country_residence_countryTocountry: true,
      city_residence_cityTocity: {
        include: { region: true },
      },
      street_residence_streetTostreet: true,
      house_residence_houseTohouse: true,
      apartment_residence_apartmentToapartment: true,
    },
  });

  if (!res) return ["", ""];

  const parts = {
    country: res.country_residence_countryTocountry?.name ?? null,
    region: res.city_residence_cityTocity?.region?.name ?? null,
    city: res.city_residence_cityTocity?.name ?? null,
    street: res.street_residence_streetTostreet?.name ?? null,
    house: res.house_residence_houseTohouse?.name ?? null,
    apartment: res.apartment_residence_apartmentToapartment?.name ?? null,
  };

  const fullAddress = [
    parts.country ? `Страна: ${parts.country}` : null,
    parts.region ? `Регион: ${parts.region}` : null,
    parts.city ? `г. ${parts.city}` : null,
    parts.street ? `ул. ${parts.street}` : null,
    parts.house,
    parts.apartment,
  ]
    .filter(Boolean)
    .join(", ");

  const cityAddress = [
    parts.city ? `г. ${parts.city}` : null,
    parts.street ? `ул. ${parts.street}` : null,
    parts.house,
    parts.apartment,
  ]
    .filter(Boolean)
    .join(", ");

  return [fullAddress, cityAddress];
}

/**
 * [autoFillingRows]
 * Собирает fullname, fulladdress[], cityaddress[] для персонажа.
 */
async function buildAutoFilledFields(
  tx: any,
  personId: string,
  firstName: string,
  surnameId: string | null | undefined,
  patronymic: string | null | undefined,
): Promise<{
  fullname: string;
  fulladdress: string[];
  cityaddress: string[];
}> {
  // Получаем фамилию
  let surnameName: string | null = null;
  if (surnameId) {
    const surnameRecord = await tx.surname.findUnique({
      where: { id: surnameId },
    });
    surnameName = surnameRecord?.name ?? null;
  }

  const fullname = buildFullName(firstName, surnameName, patronymic);

  // Собираем адреса из person_residentials
  const residentials = await tx.person_residentials.findMany({
    where: { person_id: personId },
    select: { residence_id: true },
  });

  const fulladdress: string[] = [];
  const cityaddress: string[] = [];

  for (const { residence_id } of residentials) {
    if (!residence_id) continue;
    const [full, city] = await buildAddressStrings(tx, residence_id);
    if (full) fulladdress.push(full);
    if (city) cityaddress.push(city);
  }

  return { fullname, fulladdress, cityaddress };
}

/**
 * [relationCRUD] — INSERT
 * Создаёт запись в таблице relations при добавлении персонажа.
 */
/**
 * [relationCRUD] — INSERT / UPDATE
 * Безопасная версия без upsert с null в composite unique key.
 */
async function insertRelation(
  tx: any,
  personId: string,
  fatherId: string | null | undefined,
  motherId: string | null | undefined,
  spouseId: string | null | undefined,
): Promise<void> {
  const fatherid = fatherId ?? null;
  const motherid = motherId ?? null;
  const spouseid = spouseId ?? null;

  // Ищем существующую запись
  const existing = await tx.relations.findFirst({
    where: {
      personid: personId,
      fatherid,
      motherid,
      spouseid,
    },
  });

  const data = {
    fatherid,
    motherid,
    personid: personId,
    spouseid,
  };

  if (existing) {
    // Обновляем
    await tx.relations.update({
      where: { id: existing.id },
      data,
    });
  } else {
    // Создаём
    await tx.relations.create({ data });
  }
}

/**
 * [relationCRUD] — DELETE
 * Удаляет запись из relations при удалении персонажа.
 */
async function deleteRelation(tx: any, personId: string): Promise<void> {
  await tx.relations.deleteMany({
    where: { personid: personId },
  });
}

/**
 * [countCharacters] — INCREMENT при INSERT
 * Обновляет счётчики дерева при добавлении персонажа.
 */
async function incrementTreeCounters(
  tx: any,
  person: PersonSnapshot,
): Promise<void> {
  if (!person.genealogy_tree_id) return;

  await tx.genealogy_tree.update({
    where: { id: person.genealogy_tree_id },
    data: {
      count_all_characters: { increment: 1 },
      ...(person.isalive
        ? { count_all_characters_alive: { increment: 1 } }
        : { count_all_characters_dead: { increment: 1 } }),
      ...(person.gender === "male"
        ? { count_all_characters_male: { increment: 1 } }
        : { count_all_characters_female: { increment: 1 } }),
      ...(person.mother != null
        ? { count_all_characters_parents: { increment: 1 } }
        : {}),
      ...(person.father != null
        ? { count_all_characters_parents: { increment: 1 } }
        : {}),
      ...(person.mother != null && person.father != null
        ? { count_all_characters_kids: { increment: 1 } }
        : {}),
    },
  });
}

/**
 * [countCharacters] — DECREMENT при DELETE
 * Обновляет счётчики дерева при удалении персонажа.
 */
async function decrementTreeCounters(
  tx: any,
  person: PersonSnapshot,
): Promise<void> {
  if (!person.genealogy_tree_id) return;

  await tx.genealogy_tree.update({
    where: { id: person.genealogy_tree_id },
    data: {
      count_all_characters: { decrement: 1 },
      ...(person.isalive
        ? { count_all_characters_alive: { decrement: 1 } }
        : { count_all_characters_dead: { decrement: 1 } }),
      ...(person.gender === "male"
        ? { count_all_characters_male: { decrement: 1 } }
        : { count_all_characters_female: { decrement: 1 } }),
      ...(person.mother != null
        ? { count_all_characters_parents: { decrement: 1 } }
        : {}),
      ...(person.father != null
        ? { count_all_characters_parents: { decrement: 1 } }
        : {}),
      ...(person.mother != null && person.father != null
        ? { count_all_characters_kids: { decrement: 1 } }
        : {}),
    },
  });
}

/**
 * [countCharacters] — UPDATE
 * Пересчитывает счётчики дерева при обновлении персонажа (old → new).
 */
async function updateTreeCounters(
  tx: any,
  oldPerson: PersonSnapshot,
  newPerson: PersonSnapshot,
): Promise<void> {
  const treeId = newPerson.genealogy_tree_id ?? oldPerson.genealogy_tree_id;
  if (!treeId) return;

  const delta: Record<string, number> = {};

  // isAlive
  if (oldPerson.isalive === true && newPerson.isalive === false) {
    delta.count_all_characters_alive = -1;
    delta.count_all_characters_dead = 1;
  } else if (oldPerson.isalive === false && newPerson.isalive === true) {
    delta.count_all_characters_alive = 1;
    delta.count_all_characters_dead = -1;
  }

  // gender
  if (oldPerson.gender === "male" && newPerson.gender === "female") {
    delta.count_all_characters_male = -1;
    delta.count_all_characters_female = 1;
  } else if (oldPerson.gender === "female" && newPerson.gender === "male") {
    delta.count_all_characters_male = 1;
    delta.count_all_characters_female = -1;
  }

  // parents
  if (oldPerson.mother == null && newPerson.mother != null)
    delta.count_all_characters_parents =
      (delta.count_all_characters_parents ?? 0) + 1;
  if (oldPerson.father == null && newPerson.father != null)
    delta.count_all_characters_parents =
      (delta.count_all_characters_parents ?? 0) + 1;
  if (oldPerson.mother != null && newPerson.mother == null)
    delta.count_all_characters_parents =
      (delta.count_all_characters_parents ?? 0) - 1;
  if (oldPerson.father != null && newPerson.father == null)
    delta.count_all_characters_parents =
      (delta.count_all_characters_parents ?? 0) - 1;

  // kids
  const wasKid = oldPerson.mother != null && oldPerson.father != null;
  const isKid = newPerson.mother != null && newPerson.father != null;
  if (!wasKid && isKid) delta.count_all_characters_kids = 1;
  if (wasKid && !isKid) delta.count_all_characters_kids = -1;

  if (Object.keys(delta).length === 0) return;

  // Prisma не поддерживает динамические increment/decrement в одном вызове,
  // поэтому обновляем через $executeRaw или через отдельные вызовы.
  // Безопаснее — читаем текущие значения и пишем новые.
  const tree = await tx.genealogy_tree.findUnique({ where: { id: treeId } });
  if (!tree) return;

  await tx.genealogy_tree.update({
    where: { id: treeId },
    data: {
      count_all_characters_alive: Math.max(
        0,
        (tree.count_all_characters_alive ?? 0) +
          (delta.count_all_characters_alive ?? 0),
      ),
      count_all_characters_dead: Math.max(
        0,
        (tree.count_all_characters_dead ?? 0) +
          (delta.count_all_characters_dead ?? 0),
      ),
      count_all_characters_male: Math.max(
        0,
        (tree.count_all_characters_male ?? 0) +
          (delta.count_all_characters_male ?? 0),
      ),
      count_all_characters_female: Math.max(
        0,
        (tree.count_all_characters_female ?? 0) +
          (delta.count_all_characters_female ?? 0),
      ),
      count_all_characters_parents: Math.max(
        0,
        (tree.count_all_characters_parents ?? 0) +
          (delta.count_all_characters_parents ?? 0),
      ),
      count_all_characters_kids: Math.max(
        0,
        (tree.count_all_characters_kids ?? 0) +
          (delta.count_all_characters_kids ?? 0),
      ),
    },
  });
}

// ---------------------------------------------------------------------------
// Запрос JSON со всеми связями персонажа
// ---------------------------------------------------------------------------

/**
 * Возвращает полный объект персонажа со всеми связями:
 * - родители / супруг (вложенные объекты person)
 * - профессии, образование, места жительства
 * - место рождения / смерти с вложенной географией
 * - запись в таблице relations
 */
async function getPersonWithRelations(personId: string) {
  return prisma.person.findUnique({
    where: { id: personId },
    include: {
      // Фамилия / девичья фамилия
      surname_person_surnameTosurname: true,
      maiden_surname: true,
      // Национальность / соц. статус
      nationality_person_nationalityTonationality: true,
      social_status: true,
      // Родители
      person_person_motherToperson: {
        include: {
          surname_person_surnameTosurname: true,
        },
      },
      person_person_fatherToperson: {
        include: {
          surname_person_surnameTosurname: true,
        },
      },
      // Супруг
      person_person_spouseToperson: {
        include: {
          surname_person_surnameTosurname: true,
        },
      },
      // Дети (те, у кого этот человек — мать или отец)
      other_person_person_motherToperson: {
        include: { surname_person_surnameTosurname: true },
      },
      other_person_person_fatherToperson: {
        include: { surname_person_surnameTosurname: true },
      },
      // Место рождения (с полной географией)
      birth_place_person_birth_placeTobirth_place: {
        include: {
          country: true,
          city: true,
          street: true,
          house: true,
          apartment: true,
        },
      },
      // Место смерти
      death_place_person_death_placeTodeath_place: {
        include: {
          country: true,
          city: true,
        },
      },
      // Дерево
      genealogy_tree: true,
    },
  });
}

// ---------------------------------------------------------------------------
// Резольверы
// ---------------------------------------------------------------------------

export const resolvers = {
  Query: {
    // --- Деревья ---
    trees: async () => {
      try {
        return await prisma.genealogy_tree.findMany();
      } catch (error: any) {
        console.error("Error finding trees", error);
        throw new Error(`Failed to find trees: ${error.message}`);
      }
    },
    tree: async (_: unknown, args: { id: string }) => {
      try {
        return await prisma.genealogy_tree.findFirst({
          where: { id: args.id },
        });
      } catch (error: any) {
        console.error("Error finding tree", error);
        throw new Error(`Failed to find tree: ${error.message}`);
      }
    },

    // --- Персонажи ---
    persons: async () => {
      try {
        return await prisma.person.findMany();
      } catch (error: any) {
        console.error("Error finding persons", error);
        throw new Error(`Failed to find persons: ${error.message}`);
      }
    },
    person: async (_: unknown, args: { id: string }) => {
      try {
        return await prisma.person.findFirst({ where: { id: args.id } });
      } catch (error: any) {
        console.error("Error finding person", error);
        throw new Error(`Failed to find person: ${error.message}`);
      }
    },
    // Возвращает персонажа со ВСЕМИ связями в виде JSON
    personWithRelations: async (_: unknown, args: { id: string }) => {
      try {
        return await getPersonWithRelations(args.id);
      } catch (error: any) {
        console.error("Error finding person with relations", error);
        throw new Error(
          `Failed to find person with relations: ${error.message}`,
        );
      }
    },

    // --- Профессии ---
    occupation: async (_: unknown, args: { id: string }) => {
      try {
        return await prisma.occupation.findFirst({ where: { id: args.id } });
      } catch (error: any) {
        console.error("Error finding occupation", error);
        throw new Error(`Failed to find occupation: ${error.message}`);
      }
    },
    occupations: async () => {
      try {
        return await prisma.occupation.findMany();
      } catch (error: any) {
        console.error("Error finding occupations", error);
        throw new Error(`Failed to find occupations: ${error.message}`);
      }
    },
    person_occupations: async (_: unknown, args: { personId: string }) => {
      try {
        return await prisma.person_occupations.findMany({
          where: { person_id: args.personId },
          // include: { occupation: true },
        });
      } catch (error: any) {
        console.error("Error finding person occupations", error);
        throw new Error(`Failed to find person occupations: ${error.message}`);
      }
    },

    // --- Образование ---
    education: async (_: unknown, args: { id: string }) => {
      try {
        return await prisma.education.findFirst({ where: { id: args.id } });
      } catch (error: any) {
        console.error("Error finding education", error);
        throw new Error(`Failed to find education: ${error.message}`);
      }
    },
    educations: async () => {
      try {
        return await prisma.education.findMany();
      } catch (error: any) {
        console.error("Error finding educations", error);
        throw new Error(`Failed to find educations: ${error.message}`);
      }
    },
    person_educations: async (_: unknown, args: { personId: string }) => {
      try {
        return await prisma.person_educations.findMany({
          where: { person_id: args.personId },
          // include: { education: true },
        });
      } catch (error: any) {
        console.error("Error finding person educations", error);
        throw new Error(`Failed to find person educations: ${error.message}`);
      }
    },

    // --- Места жительства ---
    residence: async (_: unknown, args: { id: string }) => {
      try {
        return await prisma.residence.findFirst({ where: { id: args.id } });
      } catch (error: any) {
        console.error("Error finding residence", error);
        throw new Error(`Failed to find residence: ${error.message}`);
      }
    },
    residentials: async () => {
      try {
        return await prisma.residence.findMany();
      } catch (error: any) {
        console.error("Error finding residentials", error);
        throw new Error(`Failed to find residentials: ${error.message}`);
      }
    },
    person_residentials: async (_: unknown, args: { personId: string }) => {
      try {
        return await prisma.person_residentials.findMany({
          where: { person_id: args.personId },
          // include: { residence: true },
        });
      } catch (error: any) {
        console.error("Error finding person residentials", error);
        throw new Error(`Failed to find person residentials: ${error.message}`);
      }
    },

    // --- Отношения ---
    relations: async () => {
      try {
        return await prisma.relations.findMany();
      } catch (error: any) {
        console.error("Error finding relations", error);
        throw new Error(`Failed to find relations: ${error.message}`);
      }
    },
  },

  Mutation: {
    // -------------------------------------------------------------------------
    // createPerson
    // -------------------------------------------------------------------------
    createPerson: async (
      _: unknown,
      args: {
        input: personCreateInput;
        // Опциональные: передавать ID уже существующих записей
        motherId?: string | null;
        fatherId?: string | null;
        spouseId?: string | null;
        genealogyTreeId?: string | null;
      },
    ) => {
      try {
        const personBuilder = new personDataBuilder();

        const newPerson = await prisma.$transaction(async (tx) => {
          console.log("🚀 [createPerson] transaction START");

          // 1. Собираем данные через builder (surname, nationality, birth_place и т.д.)
          const data = await personBuilder.buildData(tx, args.input);

          if (!data.firstname) throw new Error("Firstname is required");

          // 2. Подставляем связи с деревом, родителями, супругом
          if (args.genealogyTreeId)
            data.genealogy_tree_id = args.genealogyTreeId;
          if (args.motherId) data.mother = args.motherId;
          if (args.fatherId) data.father = args.fatherId;
          if (args.spouseId) data.spouse = args.spouseId;

          // 3. [checkMaritalStatus] — валидация до записи
          checkMaritalStatus(
            data.spouse ?? null,
            (data.marital_status ?? "single") as MaritalStatus,
          );

          // 4. [setAliveStatus] — вычисляем isalive
          data.isalive = computeIsAlive(data.death_place ?? null);

          // 5. Создаём персонажа
          const created = await tx.person.create({ data });
          console.log("✅ [createPerson] person created:", created.id);

          // 6. [autoFillingRows] — fullname, адреса
          const autoFields = await buildAutoFilledFields(
            tx,
            created.id,
            created.firstname,
            created.surname ?? null,
            created.patronymic ?? null,
          );
          const withAutoFields = await tx.person.update({
            where: { id: created.id },
            data: autoFields,
          });

          // 7. [relationCRUD INSERT] — создаём запись в relations
          await insertRelation(
            tx,
            withAutoFields.id,
            withAutoFields.father,
            withAutoFields.mother,
            withAutoFields.spouse,
          );

          // 8. [countCharacters INSERT] — обновляем счётчики дерева
          await incrementTreeCounters(tx, {
            id: withAutoFields.id,
            isalive: withAutoFields.isalive,
            gender: withAutoFields.gender as Gender,
            mother: withAutoFields.mother,
            father: withAutoFields.father,
            genealogy_tree_id: withAutoFields.genealogy_tree_id,
          });

          // 9. Возвращаем полный объект со всеми связями (JSON)
          const fullPerson = await tx.person.findUnique({
            where: { id: withAutoFields.id },
            include: {
              surname_person_surnameTosurname: true,
              maiden_surname: true,
              nationality_person_nationalityTonationality: true,
              social_status: true,
              person_person_motherToperson: true,
              person_person_fatherToperson: true,
              person_person_spouseToperson: true,
              birth_place_person_birth_placeTobirth_place: {
                include: {
                  country: true,
                  city: true,
                  street: true,
                  house: true,
                  apartment: true,
                },
              },
              death_place_person_death_placeTodeath_place: {
                include: { country: true, city: true },
              },
              genealogy_tree: true,
            },
          });

          console.log("🏁 [createPerson] transaction END");
          return fullPerson;
        });

        return newPerson;
      } catch (error: any) {
        console.error("Error creating person:", error);
        throw new Error(`Failed to create person: ${error.message}`);
      }
    },

    // -------------------------------------------------------------------------
    // updatePerson
    // -------------------------------------------------------------------------
    updatePerson: async (
      _: unknown,
      args: {
        id: string;
        input: personUpdateInput;
        motherId?: string | null;
        fatherId?: string | null;
        spouseId?: string | null;
      },
    ) => {
      try {
        const updatedPerson = await prisma.$transaction(async (tx) => {
          const oldPerson = await tx.person.findUnique({
            where: { id: args.id },
          });
          if (!oldPerson) throw new Error("Person not found");

          // [checkMaritalStatus]
          const newSpouseId =
            args.spouseId !== undefined ? args.spouseId : oldPerson.spouse;
          const newMaritalStatus =
            (args.input as any).marital_status ?? oldPerson.marital_status;
          checkMaritalStatus(
            newSpouseId ?? null,
            newMaritalStatus as MaritalStatus,
          );

          // [setAliveStatus]
          const newDeathPlace =
            (args.input as any).death_place !== undefined
              ? (args.input as any).death_place
              : oldPerson.death_place;
          const isalive = computeIsAlive(newDeathPlace);

          // Собираем данные обновления
          const updateData: any = {
            ...args.input,
            isalive,
          };
          if (args.motherId !== undefined) updateData.mother = args.motherId;
          if (args.fatherId !== undefined) updateData.father = args.fatherId;
          if (args.spouseId !== undefined) updateData.spouse = args.spouseId;

          const updated = await tx.person.update({
            where: { id: args.id },
            data: updateData,
          });

          // [autoFillingRows]
          const autoFields = await buildAutoFilledFields(
            tx,
            updated.id,
            updated.firstname,
            updated.surname ?? null,
            updated.patronymic ?? null,
          );
          const withAutoFields = await tx.person.update({
            where: { id: updated.id },
            data: autoFields,
          });

          // [relationCRUD UPDATE]
          await insertRelation(
            tx,
            withAutoFields.id,
            withAutoFields.father,
            withAutoFields.mother,
            withAutoFields.spouse,
          );

          // [countCharacters UPDATE]
          await updateTreeCounters(
            tx,
            {
              id: oldPerson.id,
              isalive: oldPerson.isalive,
              gender: oldPerson.gender as Gender,
              mother: oldPerson.mother,
              father: oldPerson.father,
              genealogy_tree_id: oldPerson.genealogy_tree_id,
            },
            {
              id: withAutoFields.id,
              isalive: withAutoFields.isalive,
              gender: withAutoFields.gender as Gender,
              mother: withAutoFields.mother,
              father: withAutoFields.father,
              genealogy_tree_id: withAutoFields.genealogy_tree_id,
            },
          );

          // Возвращаем полный объект со связями
          return tx.person.findUnique({
            where: { id: withAutoFields.id },
            include: {
              surname_person_surnameTosurname: true,
              maiden_surname: true,
              nationality_person_nationalityTonationality: true,
              social_status: true,
              person_person_motherToperson: true,
              person_person_fatherToperson: true,
              person_person_spouseToperson: true,
              birth_place_person_birth_placeTobirth_place: {
                include: {
                  country: true,
                  city: true,
                  street: true,
                  house: true,
                  apartment: true,
                },
              },
              death_place_person_death_placeTodeath_place: {
                include: { country: true, city: true },
              },
              genealogy_tree: true,
            },
          });
        });

        return updatedPerson;
      } catch (error: any) {
        console.error("Error updating person:", error);
        throw new Error(`Failed to update person: ${error.message}`);
      }
    },

    // -------------------------------------------------------------------------
    // deletePerson
    // -------------------------------------------------------------------------
    deletePerson: async (_: unknown, args: { id: string }) => {
      try {
        return await prisma.$transaction(async (tx) => {
          const person = await tx.person.findUnique({ where: { id: args.id } });
          if (!person) throw new Error("Person not found");

          // [relationCRUD DELETE]
          await deleteRelation(tx, person.id);

          const deleted = await tx.person.delete({ where: { id: args.id } });

          // [countCharacters DELETE]
          await decrementTreeCounters(tx, {
            id: deleted.id,
            isalive: deleted.isalive,
            gender: deleted.gender as Gender,
            mother: deleted.mother,
            father: deleted.father,
            genealogy_tree_id: deleted.genealogy_tree_id,
          });

          return deleted;
        });
      } catch (error: any) {
        console.error("Error deleting person:", error);
        throw new Error(`Failed to delete person: ${error.message}`);
      }
    },

    // -------------------------------------------------------------------------
    // CRUD деревьев
    // -------------------------------------------------------------------------
    createTree: async (
      _: unknown,
      args: { input: genealogy_treeCreateInput },
    ) => {
      try {
        return await prisma.genealogy_tree.create({
          data: { name: args.input.name },
        });
      } catch (error: any) {
        console.error("Error creating tree", error);
        throw new Error(`Failed to create tree: ${error.message}`);
      }
    },
    updateTree: async (
      _: unknown,
      args: { id: string; input: genealogy_treeUpdateInput },
    ) => {
      try {
        return await prisma.genealogy_tree.update({
          where: { id: args.id },
          data: { ...args.input },
        });
      } catch (error: any) {
        console.error("Error updating tree:", error);
        throw new Error(`Failed to update tree: ${error.message}`);
      }
    },
    deleteTree: async (_: unknown, args: { id: string }) => {
      try {
        const deleted = await prisma.genealogy_tree.delete({
          where: { id: args.id },
        });
        return deleted !== null;
      } catch (error: any) {
        console.error("Error deleting tree", error);
        throw new Error(`Failed to delete tree: ${error.message}`);
      }
    },
  },
};
