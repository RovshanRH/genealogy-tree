// TODO: рефакторинг мутаций. Добавить валидацию. Рефакторинг БД: везде по create_at и uodate_at. Поменять связи (место жительства и персонаж)

import { prisma } from "../lib/prisma.ts";
import type {
  personCreateInput,
  personFindFirstArgs,
  personUpdateInput,
  personUncheckedCreateInput,
  personUncheckedUpdateInput,
} from "../generated/prisma/models/person.ts";

import type { surnameCreateInput } from "../generated/prisma/models/surname.ts";

import type {
  genealogy_treeCreateInput,
  genealogy_treeUpdateInput,
} from "../generated/prisma/models/genealogy_tree.ts";

type LookupInput = {
  value?: string | null;
  name?: string | null;
  description?: string | null;
  birthDate?: string | null;
  birthDateApprox?: boolean | null;
  deathDate?: string | null;
  deathDateApprox?: boolean | null;
  country?: LookupInput | null;
  region?: LookupInput | null;
  city?: LookupInput | null;
  street?: LookupInput | null;
  house?: LookupInput | null;
  apartment?: LookupInput | null;
};

type CreatePersonArgsInput = {
  surname?: LookupInput | null;
  maidenSurname?: LookupInput | null;
  firstname?: string | null;
  patronymic?: string | null;
  gender?: "male" | "female" | null;
  age?: number | null;
  marital_status?: string | null;
  birthPlace?: LookupInput | null;
  deathPlace?: LookupInput | null;
  nationality?: LookupInput | null;
  socialStatus?: LookupInput | null;
  bio?: string | null;
  sourceInfo?: string | null;
  isPersonContacted?: boolean | null;
  isAlive?: boolean | null;
};

const normalizeText = (value?: string | null) => {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
};

const findOrCreateByName = async (
  findExisting: () => Promise<any>,
  createRecord: () => Promise<any>,
) => {
  const existingRecord = await findExisting();
  return existingRecord ?? createRecord();
};

const findOrCreateSurname = async (tx: any, input?: LookupInput | null) => {
  const name = normalizeText(input?.value ?? input?.name);
  if (!name) {
    return null;
  }

  return findOrCreateByName(
    () => tx.surname.findFirst({ where: { name } }),
    () => tx.surname.create({ data: { name } }),
  );
};

const findOrCreateMaidenSurname = async (
  tx: any,
  input?: LookupInput | null,
) => {
  const name = normalizeText(input?.value ?? input?.name);
  if (!name) {
    return null;
  }

  return findOrCreateByName(
    () => tx.maiden_surname.findFirst({ where: { name } }),
    () => tx.maiden_surname.create({ data: { name } }),
  );
};

const findOrCreateNationality = async (tx: any, input?: LookupInput | null) => {
  const name = normalizeText(input?.value ?? input?.name);
  if (!name) {
    return null;
  }

  return findOrCreateByName(
    () => tx.nationality.findFirst({ where: { name } }),
    () => tx.nationality.create({ data: { name } }),
  );
};

const findOrCreateSocialStatus = async (
  tx: any,
  input?: LookupInput | null,
) => {
  const name = normalizeText(input?.value ?? input?.name);
  if (!name) {
    return null;
  }

  const description = normalizeText(input?.description);

  return findOrCreateByName(
    () => tx.social_status.findFirst({ where: { name } }),
    () =>
      tx.social_status.create({
        data: {
          name,
          description,
        },
      }),
  );
};

const findOrCreateCountry = async (tx: any, input?: LookupInput | null) => {
  const name = normalizeText(input?.name ?? input?.name);
  if (!name) {
    return null;
  }

  return findOrCreateByName(
    () => tx.country.findFirst({ where: { name } }),
    () => tx.country.create({ data: { name } }),
  );
};

const findOrCreateRegion = async (
  tx: any,
  input?: LookupInput | null,
  fallbackCountry?: LookupInput | null,
) => {
  const name = normalizeText(input?.name ?? input?.name);
  if (!name) {
    return null;
  }

  const country = await findOrCreateCountry(
    tx,
    input?.country ?? fallbackCountry,
  );

  return findOrCreateByName(
    () =>
      tx.region.findFirst({
        where: {
          name,
          country_id: country?.id ?? null,
        },
      }),
    () =>
      tx.region.create({
        data: {
          name,
          ...(country ? { country: { connect: { id: country.id } } } : {}),
        },
      }),
  );
};

const findOrCreateCity = async (
  tx: any,
  input?: LookupInput | null,
  fallbackRegion?: LookupInput | null,
  fallbackCountry?: LookupInput | null,
) => {
  const name = normalizeText(input?.name ?? input?.name);
  if (!name) {
    return null;
  }

  const region = await findOrCreateRegion(
    tx,
    input?.region ?? fallbackRegion,
    fallbackCountry,
  );

  return findOrCreateByName(
    () =>
      tx.city.findFirst({
        where: {
          name,
          region_id: region?.id ?? null,
        },
      }),
    () =>
      tx.city.create({
        data: {
          name,
          ...(region ? { region: { connect: { id: region.id } } } : {}),
        },
      }),
  );
};

const findOrCreateStreet = async (
  tx: any,
  input?: LookupInput | null,
  fallbackCity?: LookupInput | null,
) => {
  const name = normalizeText(input?.name ?? input?.name);
  if (!name) {
    return null;
  }

  const city = await findOrCreateCity(tx, input?.city ?? fallbackCity);

  return findOrCreateByName(
    () =>
      tx.street.findFirst({
        where: {
          name,
          city_id: city?.id ?? null,
        },
      }),
    () =>
      tx.street.create({
        data: {
          name,
          ...(city ? { city: { connect: { id: city.id } } } : {}),
        },
      }),
  );
};

const findOrCreateHouse = async (
  tx: any,
  input?: LookupInput | null,
  fallbackStreet?: LookupInput | null,
) => {
  const name = normalizeText(input?.name ?? input?.name);
  if (!name) {
    return null;
  }

  const street = await findOrCreateStreet(tx, input?.street ?? fallbackStreet);

  return findOrCreateByName(
    () =>
      tx.house.findFirst({
        where: {
          name,
          street_id: street?.id ?? null,
        },
      }),
    () =>
      tx.house.create({
        data: {
          name,
          ...(street ? { street: { connect: { id: street.id } } } : {}),
        },
      }),
  );
};

const findOrCreateApartment = async (
  tx: any,
  input?: LookupInput | null,
  fallbackHouse?: LookupInput | null,
) => {
  const name = normalizeText(input?.name ?? input?.name);
  if (!name) {
    return null;
  }

  const house = await findOrCreateHouse(tx, input?.house ?? fallbackHouse);

  return findOrCreateByName(
    () =>
      tx.apartment.findFirst({
        where: {
          name,
          house_id: house?.id ?? null,
        },
      }),
    () =>
      tx.apartment.create({
        data: {
          name,
          ...(house ? { house: { connect: { id: house.id } } } : {}),
        },
      }),
  );
};

const findOrCreateBirthPlace = async (tx: any, input?: LookupInput | null) => {
  if (!input) {
    return null;
  }

  const country = await findOrCreateCountry(tx, input.country);
  const city = await findOrCreateCity(
    tx,
    input.city,
    input.region,
    input.country,
  );
  const street = await findOrCreateStreet(tx, input.street, input.city);
  const house = await findOrCreateHouse(tx, input.house, input.street);
  const apartment = await findOrCreateApartment(
    tx,
    input.apartment,
    input.house,
  );
  const birthDate = input.birthDate ? new Date(input.birthDate) : null;
  const birthDateApprox = input.birthDateApprox ?? false;

  return findOrCreateByName(
    () =>
      tx.birth_place.findFirst({
        where: {
          birth_date: birthDate,
          birth_date_approx: birthDateApprox,
          birth_place_country_id: country?.id ?? null,
          birth_place_city_id: city?.id ?? null,
          birth_place_street: street?.id ?? null,
          birth_place_house: house?.id ?? null,
          birth_place_apartment: apartment?.id ?? null,
        },
      }),
    () =>
      tx.birth_place.create({
        data: {
          birth_date: birthDate ?? undefined,
          birth_date_approx: birthDateApprox,
          ...(country ? { country: { connect: { id: country.id } } } : {}),
          ...(city ? { city: { connect: { id: city.id } } } : {}),
          ...(street ? { street: { connect: { id: street.id } } } : {}),
          ...(house ? { house: { connect: { id: house.id } } } : {}),
          ...(apartment
            ? { apartment: { connect: { id: apartment.id } } }
            : {}),
        },
      }),
  );
};

const findOrCreateDeathPlace = async (tx: any, input?: LookupInput | null) => {
  if (!input) {
    return null;
  }

  const country = await findOrCreateCountry(tx, input.country);
  const city = await findOrCreateCity(
    tx,
    input.city,
    input.region,
    input.country,
  );
  const deathDate = input.deathDate ? new Date(input.deathDate) : null;
  const deathDateApprox = input.deathDateApprox ?? false;

  return findOrCreateByName(
    () =>
      tx.death_place.findFirst({
        where: {
          death_date: deathDate,
          death_date_approx: deathDateApprox,
          death_place_country_id: country?.id ?? null,
          death_place_city_id: city?.id ?? null,
        },
      }),
    () =>
      tx.death_place.create({
        data: {
          death_date: deathDate ?? undefined,
          death_date_approx: deathDateApprox,
          ...(country ? { country: { connect: { id: country.id } } } : {}),
          ...(city ? { city: { connect: { id: city.id } } } : {}),
        },
      }),
  );
};

const buildPersonData = async (
  tx: any,
  input: any,
  options: { includeDefaults: boolean },
): Promise<any> => {
  const surname = await findOrCreateSurname(tx, input.surname);
  const maidenSurname = await findOrCreateMaidenSurname(
    tx,
    input.maidenSurname,
  );
  const nationality = await findOrCreateNationality(tx, input.nationality);
  const socialStatus = await findOrCreateSocialStatus(tx, input.socialStatus);
  const birthPlace = await findOrCreateBirthPlace(tx, input.birthPlace);
  const deathPlace = await findOrCreateDeathPlace(tx, input.deathPlace);

  return {
    ...(options.includeDefaults
      ? { fulladdress: [] as any, cityaddress: [] as any }
      : {}),
    ...(input.marital_status !== undefined || options.includeDefaults
      ? { marital_status: (input.marital_status ?? "single") as any }
      : {}),
    ...(input.firstname !== undefined || options.includeDefaults
      ? { firstname: input.firstname ?? "unknown" }
      : {}),
    ...(input.age !== undefined || options.includeDefaults
      ? { age: input.age ?? 0 }
      : {}),
    ...(input.patronymic !== undefined || options.includeDefaults
      ? { patronymic: input.patronymic ?? "unknown" }
      : {}),
    ...(input.gender !== undefined || options.includeDefaults
      ? { gender: (input.gender ?? "male") as any }
      : {}),
    ...(input.bio !== undefined || options.includeDefaults
      ? { bio: input.bio ?? null }
      : {}),
    ...(input.sourceInfo !== undefined || options.includeDefaults
      ? { source_info: input.sourceInfo ?? null }
      : {}),
    ...(input.isPersonContacted !== undefined || options.includeDefaults
      ? { ispersoncontacted: input.isPersonContacted ?? false }
      : {}),
    ...(input.isAlive !== undefined || options.includeDefaults
      ? { isalive: input.isAlive ?? true }
      : {}),
    ...(surname
      ? { surname_person_surnameTosurname: { connect: { id: surname.id } } }
      : {}),
    ...(maidenSurname
      ? { maiden_surname: { connect: { id: maidenSurname.id } } }
      : {}),
    ...(nationality
      ? {
          nationality_person_nationalityTonationality: {
            connect: { id: nationality.id },
          },
        }
      : {}),
    ...(socialStatus
      ? { social_status: { connect: { id: socialStatus.id } } }
      : {}),
    ...(birthPlace
      ? {
          birth_place_person_birth_placeTobirth_place: {
            connect: { id: birthPlace.id },
          },
        }
      : {}),
    ...(deathPlace
      ? {
          death_place_person_death_placeTodeath_place: {
            connect: { id: deathPlace.id },
          },
        }
      : {}),
  } as any;
};

export const resolvers = {
  Query: {
    trees: async () => {
      try {
        const genealogy_trees = await prisma?.genealogy_tree.findMany();
        return genealogy_trees;
      } catch (error: any) {
        console.error("Error finding trees", error);
      }
    },
    tree: async (_parent: unknown, args: { id: string }) => {
      try {
        const genealogy_tree = await prisma?.genealogy_tree.findFirst({
          where: { id: args.id },
        });
        return genealogy_tree;
      } catch (error: any) {
        console.error("Error finding tree", error);
      }
    },
    persons: async () => {
      try {
        const people = await prisma?.person.findMany();
        return people;
      } catch (error: any) {
        console.error("Error finding people", error);
      }
    },
    person: async (_parent: unknown, args: { id: string }) => {
      try {
        const person = await prisma?.person.findFirst({
          where: { id: args.id },
        });
        return person;
      } catch (error: any) {
        console.error("Error finding person", error);
      }
    },
    // occupation
    occupation: async (_parent: unknown, args: { id: string }) => {
      try {
        const occupation = await prisma.occupation.findFirst({
          where: { id: args.id },
        });
        return occupation;
      } catch (error: any) {
        console.error("Error finding occupation by id", error);
      }
    },
    person_occupations: async (
      _parent: unknown,
      args: { personId: string },
    ) => {
      try {
        const occupations = await prisma.person_occupations.findMany({
          where: {
            person_id: args.personId,
          },
        });
        return occupations;
      } catch (error: any) {
        console.error(
          `Error finding occupations for person ${args.personId}`,
          error,
        );
      }
    },
    occupations: async () => {
      try {
        const occupations = await prisma.occupation.findMany();
        return occupations;
      } catch (error: any) {
        console.error("Error finding all occupations", error);
      }
    },
    // education
    education: async (_parent: unknown, args: { id: string }) => {
      try {
        const education = await prisma.education.findFirst({
          where: { id: args.id },
        });
        return education;
      } catch (error: any) {
        console.error("Error finding education by id", error);
      }
    },
    person_educations: async (_parent: unknown, args: { personId: string }) => {
      try {
        const educations = await prisma.person_educations.findMany({
          where: {
            person_id: args.personId,
          },
        });
        return educations;
      } catch (error: any) {
        console.error(
          `Error finding educations for person ${args.personId}`,
          error,
        );
      }
    },
    educations: async () => {
      try {
        const educations = await prisma.education.findMany();
        return educations;
      } catch (error: any) {
        console.error("Error finding all educations", error);
      }
    },
    // residence
    residence: async (_parent: unknown, args: { id: string }) => {
      try {
        const residence = await prisma.residence.findFirst({
          where: { id: args.id },
        });
        return residence;
      } catch (error: any) {
        console.error("Error finding residence by id", error);
      }
    },
    person_residentials: async (
      _parent: unknown,
      args: { personId: string },
    ) => {
      try {
        const residences = await prisma.person_residentials.findMany({
          where: {
            person_id: args.personId,
          },
        });
        return residences;
      } catch (error: any) {
        console.error(
          `Error finding residences for person ${args.personId}`,
          error,
        );
      }
    },
    residentials: async () => {
      try {
        const residences = await prisma.residence.findMany();
        return residences;
      } catch (error: any) {
        console.error("Error finding all residences", error);
      }
    },
    relations: async () => {
      try {
        const relations = await prisma.relations.findMany();
        return relations;
      } catch (error: any) {
        console.error("Error finding all relationships", error);
      }
    },
  },
  Person: {
    surname: async (parent: { surname?: string | null }) => {
      if (!parent?.surname) {
        return null;
      }

      return prisma.surname.findFirst({
        where: { id: parent.surname },
      });
    },
  },
  Surname: {
    value: (parent: { name?: string | null }) => parent.name,
    name: (parent: { name?: string | null }) => parent.name,
  },
  Mutation: {
    // CRUD персонажей
    createPerson: async (
      _parent: unknown,
      args: {
        input: CreatePersonArgsInput;
      },
    ) => {
      try {
        return prisma.$transaction(async (tx) => {
          const data = await buildPersonData(tx, args.input, {
            includeDefaults: true,
          });

          return tx.person.create({
            data,
          });
        });
      } catch (error: any) {
        console.error("Error creating person:", error);
        throw new Error(`Failed to create person: ${error.message}`);
      }
    },
    updatePerson: async (
      _parent: unknown,
      args: { input: personUpdateInput; id: string },
      // context: { prisma: PrismaClient },
    ) => {
      try {
        return prisma.$transaction(async (tx) => {
          const selectedPerson = await tx.person.findUnique({
            where: { id: args.id },
          });

          if (!selectedPerson) {
            throw new Error("Person not found");
          }

          const data = await buildPersonData(tx, args.input as any, {
            includeDefaults: false,
          });

          return tx.person.update({
            where: { id: selectedPerson.id },
            data: {
              ...data,
              updated_at: new Date(),
            },
          });
        });
      } catch (error: any) {
        console.error("Error updating person:", error);
        throw new Error(`Failed to update person: ${error.message}`);
      }
    },
    deletePerson: async (
      _parent: unknown,
      args: { id: string },
      // context: { prisma: PrismaClient },
    ) => {
      try {
        // const { prisma } = context;
        const deletedPerson = await prisma.person.delete({
          where: { id: args.id },
        });
        return deletedPerson;
      } catch (error: any) {
        console.error("Error updating person:", error);
        throw new Error(`Failed to delete person: ${error.message}`);
      }
    },
    // CRUD деревьев
    createTree: async (
      _parent: unknown,
      args: { input: genealogy_treeCreateInput },
      // context: { prisma: PrismaClient }
    ) => {
      try {
        // const { prisma } = context;
        const { input } = args;
        const newTree = await prisma.genealogy_tree.create({
          data: {
            name: input.name,
          },
        });
        return newTree;
      } catch (error: any) {
        console.error("Error creating Tree", error);
        throw new Error(`Failed to create tree: ${error.message}`);
      }
    },
    updateTree: async (
      _parent: unknown,
      args: { input: genealogy_treeUpdateInput; id: string },
      // context: { prisma: PrismaClient },
    ) => {
      try {
        // const { prisma } = context;
        // const { input } = args;
        // const updated_at = new Date();
        const updatedTree = await prisma.genealogy_tree.update({
          where: { id: args.id },
          data: {
            ...args.input,
            // updated_at,
          },
        });
        return updatedTree;
      } catch (error: any) {
        console.error("Error updating Tree:", error);
        throw new Error(`Failed to update Tree: ${error.message}`);
      }
    },
    deleteTree: async (
      _parent: unknown,
      args: { id: string },
      // context: { prisma: PrismaClient },
    ) => {
      try {
        // const { prisma } = context;
        const deletedTree = await prisma.genealogy_tree.delete({
          where: { id: args.id },
        });
        return deletedTree !== null;
      } catch (error: any) {
        console.error("Error deleting Tree", error);
        throw new Error(`Failed to delete Tree: ${error.message}`);
      }
    },
  },
};
