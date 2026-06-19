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
async function getFullPersonWithNiceFields(tx: any, personId: string) {
  const raw = await tx.person.findUnique({
    where: { id: personId },
    include: {
      surname_person_surnameTosurname: true,
      maiden_surname: true,
      nationality_person_nationalityTonationality: true,
      social_status: true,

      person_person_motherToperson: {
        include: { surname_person_surnameTosurname: true },
      },
      person_person_fatherToperson: {
        include: { surname_person_surnameTosurname: true },
      },
      person_person_spouseToperson: {
        include: { surname_person_surnameTosurname: true },
      },

      birth_place_person_birth_placeTobirth_place: {
        include: {
          country: true,
          city: { include: { region: true } },
          street: true,
          house: true,
          apartment: { include: { house: true } },
        },
      },

      death_place_person_death_placeTodeath_place: {
        include: {
          country: true,
          city: true,
        },
      },

      genealogy_tree: true,
    },
  });

  if (!raw) return null;

  return {
    ...raw,
    surname_obj: raw.surname_person_surnameTosurname,
    maidensurname_obj: raw.maiden_surname,
    nationality_obj: raw.nationality_person_nationalityTonationality,
    social_status_obj: raw.social_status,

    mother_obj: raw.person_person_motherToperson,
    father_obj: raw.person_person_fatherToperson,
    spouse_obj: raw.person_person_spouseToperson,

    birth_place_obj: raw.birth_place_person_birth_placeTobirth_place,
    death_place_obj: raw.death_place_person_death_placeTodeath_place,

    // Убираем длинные Prisma-имена
    surname_person_surnameTosurname: undefined,
    maiden_surname: undefined,
    nationality_person_nationalityTonationality: undefined,
    social_status: undefined,
    person_person_motherToperson: undefined,
    person_person_fatherToperson: undefined,
    person_person_spouseToperson: undefined,
    birth_place_person_birth_placeTobirth_place: undefined,
    death_place_person_death_placeTodeath_place: undefined,
  };
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
      return prisma.occupation.findUnique({
        where: { id: args.id },
        include: { person_occupations: true },
      });
    },
    occupations: async () =>
      prisma.occupation.findMany({ include: { person_occupations: true } }),
    person_occupations: async (_: unknown, args: { person_id: string }) => {
      return prisma.person_occupations.findMany({
        where: { person_id: args.person_id },
        include: { occupation: true, person: true },
      });
    },

    // --- Образование ---
    education: async (_: unknown, args: { id: string }) => {
      return prisma.education.findUnique({
        where: { id: args.id },
        include: { person_educations: true },
      });
    },
    educations: async () =>
      prisma.education.findMany({ include: { person_educations: true } }),
    person_educations: async (_: unknown, args: { person_id: string }) => {
      return prisma.person_educations.findMany({
        where: { person_id: args.person_id },
        include: { education: true, person: true },
      });
    },

    // --- Места жительства ---
    residence: async (_: unknown, args: { id: string }) => {
      try {
        return await prisma.residence.findUnique({
          where: { id: args.id },
          include: {
            country_residence_countryTocountry: true,
            city_residence_cityTocity: { 
              include: { region: { include: { country: true } } } 
            },
            street_residence_streetTostreet: true,
            house_residence_houseTohouse: true,
            apartment_residence_apartmentToapartment: true,
          },
        });
      } catch (error: any) {
        console.error("Error finding residence", error);
        throw new Error(`Failed to find residence: ${error.message}`);
      }
    },

    residentials: async () => {
      try {
        return await prisma.residence.findMany({
          include: {
            country_residence_countryTocountry: true,
            city_residence_cityTocity: { 
              include: { region: { include: { country: true } } } 
            },
            street_residence_streetTostreet: true,
            house_residence_houseTohouse: true,
            apartment_residence_apartmentToapartment: true,
          },
        });
      } catch (error: any) {
        console.error("Error finding residentials", error);
        throw new Error(`Failed to find residentials: ${error.message}`);
      }
    },

    person_residentials: async (_: unknown, args: { person_id: string }) => {
      try {
        return await prisma.person_residentials.findMany({
          where: { person_id: args.person_id },
          include: {
            person: true,
            residence: {
              include: {
                country_residence_countryTocountry: true,
                city_residence_cityTocity: { 
                  include: { region: { include: { country: true } } } 
                },
                street_residence_streetTostreet: true,
                house_residence_houseTohouse: true,
                apartment_residence_apartmentToapartment: true,
              },
            },
          },
        });
      } catch (error: any) {
        console.error("Error finding person_residentials", error);
        throw new Error(`Failed to find person residentials: ${error.message}`);
      }
    },

    // Residence: {
    //   country: (parent: any) => parent.country_residence_countryTocountry,
    //   city: (parent: any) => parent.city_residence_cityTocity,
    //   street: (parent: any) => parent.street_residence_streetTostreet,
    //   house: (parent: any) => parent.house_residence_houseTohouse,
    //   apartment: (parent: any) =>
    //     parent.apartment_residence_apartmentToapartment,
    // },

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
          // return fullPerson;
          return getFullPersonWithNiceFields(tx, withAutoFields.id);
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

          // ←←← ИСПРАВЛЕНИЕ: используем красивый вывод
          return await getFullPersonWithNiceFields(tx, withAutoFields.id);
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
    // ====================== OCCUPATION ======================
    createOccupation: async (_: unknown, args: { input: any }) => {
      try {
        return await prisma.occupation.create({
          data: {
            title: args.input.title,
            organization: args.input.organization,
            // personId не нужен здесь — это справочник
          },
          include: { person_occupations: true },
        });
      } catch (error: any) {
        throw new Error(`Failed to create occupation: ${error.message}`);
      }
    },

    updateOccupation: async (_: unknown, args: { id: string; input: any }) => {
      try {
        return await prisma.occupation.update({
          where: { id: args.id },
          data: {
            title: args.input.title,
            organization: args.input.organization,
          },
        });
      } catch (error: any) {
        throw new Error(`Failed to update occupation: ${error.message}`);
      }
    },

    deleteOccupation: async (_: unknown, args: { id: string }) => {
      try {
        return await prisma.occupation.delete({ where: { id: args.id } });
      } catch (error: any) {
        throw new Error(`Failed to delete occupation: ${error.message}`);
      }
    },

    // Привязка профессии к человеку
    addPersonOccupation: async (_: unknown, args: { input: any }) => {
      try {
        return await prisma.person_occupations.create({
          data: {
            person_id: args.input.personId,
            occupation_id: args.input.occupationId,
            start_date: args.input.startDate
              ? new Date(args.input.startDate)
              : null,
            end_date: args.input.endDate ? new Date(args.input.endDate) : null,
            is_primary: args.input.isPrimary ?? false,
          },
          include: {
            person: true,
            occupation: true,
          },
        });
      } catch (error: any) {
        throw new Error(`Failed to add person occupation: ${error.message}`);
      }
    },

    removePersonOccupation: async (_: unknown, args: { id: string }) => {
      try {
        return await prisma.person_occupations.delete({
          where: { id: args.id },
          include: { person: true, occupation: true },
        });
      } catch (error: any) {
        throw new Error(`Failed to remove person occupation: ${error.message}`);
      }
    },

    // ====================== EDUCATION ======================
    createEducation: async (_: unknown, args: { input: any }) => {
      try {
        return await prisma.education.create({
          data: {
            institution: args.input.institution,
            degree: args.input.degree,
            specialty: args.input.specialty,
          },
        });
      } catch (error: any) {
        throw new Error(`Failed to create education: ${error.message}`);
      }
    },

    updateEducation: async (_: unknown, args: { id: string; input: any }) => {
      try {
        return await prisma.education.update({
          where: { id: args.id },
          data: {
            institution: args.input.institution,
            degree: args.input.degree,
            specialty: args.input.specialty,
          },
        });
      } catch (error: any) {
        throw new Error(`Failed to update education: ${error.message}`);
      }
    },

    deleteEducation: async (_: unknown, args: { id: string }) => {
      try {
        return await prisma.education.delete({ where: { id: args.id } });
      } catch (error: any) {
        throw new Error(`Failed to delete education: ${error.message}`);
      }
    },

    addPersonEducation: async (_: unknown, args: { input: any }) => {
      try {
        return await prisma.person_educations.create({
          data: {
            person_id: args.input.personId,
            education_id: args.input.educationId,
            entry_year: args.input.entryYear,
            graduation_year: args.input.graduationYear,
          },
          include: {
            person: true,
            education: true,
          },
        });
      } catch (error: any) {
        throw new Error(`Failed to add person education: ${error.message}`);
      }
    },

    removePersonEducation: async (_: unknown, args: { id: string }) => {
      try {
        return await prisma.person_educations.delete({
          where: { id: args.id },
          include: { person: true, education: true },
        });
      } catch (error: any) {
        throw new Error(`Failed to remove person education: ${error.message}`);
      }
    },

    // ====================== RESIDENCE ======================

    // Создание самого места жительства (справочник)
    createResidence: async (_: unknown, args: { input: any }) => {
      try {
        const residence = await prisma.$transaction(async (tx) => {
          const input = args.input || {};
          console.log("[createResidence] START", input);

          const builder = new personDataBuilder();

          // 1. Создаём/находим гео-объекты
          const geo = await builder.createOrFindResidenceGeo(tx, input);

          // 2. Создаём residence через relation connect (Prisma-friendly способ)
          const newResidence = await tx.residence.create({
            data: {
              ...(geo.country
                ? {
                    country_residence_countryTocountry: {
                      connect: { id: geo.country.id },
                    },
                  }
                : {}),
              ...(geo.city
                ? {
                    city_residence_cityTocity: { connect: { id: geo.city.id } },
                  }
                : {}),
              ...(geo.street
                ? {
                    street_residence_streetTostreet: {
                      connect: { id: geo.street.id },
                    },
                  }
                : {}),
              ...(geo.house
                ? {
                    house_residence_houseTohouse: {
                      connect: { id: geo.house.id },
                    },
                  }
                : {}),
              ...(geo.apartment
                ? {
                    apartment_residence_apartmentToapartment: {
                      connect: { id: geo.apartment.id },
                    },
                  }
                : {}),

              // start_date: input.start_date ? new Date(input.start_date) : null,
              // end_date: input.end_date ? new Date(input.end_date) : null,
              // start_date_approx: input.start_date_approx ?? false,
              // end_date_approx: input.end_date_approx ?? false,
            },
          });

          // 3. Получаем полный объект
          const fullResidence = await tx.residence.findUnique({
            where: { id: newResidence.id },
            include: {
              country_residence_countryTocountry: true,
              city_residence_cityTocity: {
                include: { region: { include: { country: true } } },
              },
              street_residence_streetTostreet: true,
              house_residence_houseTohouse: true,
              apartment_residence_apartmentToapartment: {
                include: { house: true },
              },
            },
          });

          console.log("[createResidence] SUCCESS", { id: fullResidence?.id });
          return fullResidence;
        });

        return residence;
      } catch (error: any) {
        console.error("[createResidence] ERROR:", error);
        throw new Error(`Failed to create residence: ${error.message}`);
      }
    },

    // Привязка места жительства к человеку (junction)
    addPersonResidence: async (_: unknown, args: { input: any }) => {
      try {
        return await prisma.person_residentials.create({
          data: {
            person_id: args.input.personId,
            residence_id: args.input.residenceId,
            start_date: args.input.startDate
              ? new Date(args.input.startDate)
              : null,
            end_date: args.input.endDate ? new Date(args.input.endDate) : null,
            start_date_approx: args.input.startDateApprox ?? false,
            end_date_approx: args.input.endDateApprox ?? false,
            is_current: args.input.isCurrent ?? false,
          },
          include: {
            person: true,
            residence: {
              include: {
                country_residence_countryTocountry: true,
                city_residence_cityTocity: { include: { region: true } },
                street_residence_streetTostreet: true,
                house_residence_houseTohouse: true,
                apartment_residence_apartmentToapartment: true,
              },
            },
          },
        });
      } catch (error: any) {
        throw new Error(`Failed to add person residence: ${error.message}`);
      }
    },

    // Удаление привязки места жительства у человека
    removePersonResidence: async (_: unknown, args: { id: string }) => {
      try {
        return await prisma.person_residentials.delete({
          where: { id: args.id },
          include: {
            person: true,
            residence: {
              include: {
                country_residence_countryTocountry: true,
                city_residence_cityTocity: { include: { region: true } },
              },
            },
          },
        });
      } catch (error: any) {
        throw new Error(`Failed to remove person residence: ${error.message}`);
      }
    },

    // Обновление записи residence
    updateResidence: async (_: unknown, args: { id: string; input: any }) => {
      try {
        return await prisma.residence.update({
          where: { id: args.id },
          data: {
            country: args.input.country,
            city: args.input.city,
            street: args.input.street,
            house: args.input.house,
            apartment: args.input.apartment,
            start_date: args.input.start_date
              ? new Date(args.input.start_date)
              : undefined,
            end_date: args.input.end_date
              ? new Date(args.input.end_date)
              : undefined,
            start_date_approx: args.input.start_date_approx,
            end_date_approx: args.input.end_date_approx,
          },
          include: {
            country_residence_countryTocountry: true,
            city_residence_cityTocity: { include: { region: true } },
            street_residence_streetTostreet: true,
            house_residence_houseTohouse: true,
            apartment_residence_apartmentToapartment: true,
          },
        });
      } catch (error: any) {
        throw new Error(`Failed to update residence: ${error.message}`);
      }
    },

    // Удаление записи residence
    deleteResidence: async (_: unknown, args: { id: string }) => {
      try {
        return await prisma.residence.delete({
          where: { id: args.id },
        });
      } catch (error: any) {
        throw new Error(`Failed to delete residence: ${error.message}`);
      }
    },
  },
  Residence: {
    country: (parent: any) => parent.country_residence_countryTocountry,
    city: (parent: any) => parent.city_residence_cityTocity,
    street: (parent: any) => parent.street_residence_streetTostreet,
    house: (parent: any) => parent.house_residence_houseTohouse,
    apartment: (parent: any) => parent.apartment_residence_apartmentToapartment,
  },
};
