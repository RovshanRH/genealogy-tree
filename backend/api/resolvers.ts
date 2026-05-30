import { id } from "zod/locales";
import { prisma } from "../lib/prisma.ts";
import { z } from "zod";
import { publicProcedure } from "../api_auth/trpc.ts";
// import { publicProcedure } from '../api_auth/trpc';
import { db } from "./server.ts";
import type {
  personCreateInput,
  personFindFirstArgs,
  personUpdateInput,
  personUncheckedCreateInput
} from "../generated/prisma/models/person";
import type { apartmentCreateWithoutPersonInput } from "../generated/prisma/models/apartment.ts";
import type { houseCreateWithoutApartmentInput } from "../generated/prisma/models/house.ts";
import type { streetCreateWithoutHouseInput } from "../generated/prisma/models/street.ts";
import type {
  cityCreateWithoutStreetInput,
  cityCreateOrConnectWithoutRegionInput,
} from "../generated/prisma/models/city.ts";
import type { regionCreateWithoutCityInput } from "../generated/prisma/models/region.ts";
import type { countryCreateWithoutRegionInput } from "../generated/prisma/models/country.ts";
import { AnyNull } from "../generated/prisma/internal/prismaNamespace";
// import { prisma } from '../lib/prisma';
// import { Context } from '../server/context';
import type { PrismaClient } from "@prisma/client/extension";
// import { apartment, maiden_surname } from '../generated/prisma/browser';
import type {occupationCreateWithoutPerson_person_occupationTooccupationInput} from "../generated/prisma/models/occupation.ts"
import type {educationCreateWithoutPerson_person_educationToeducationInput} from "../generated/prisma/models/education.ts"
import type {nationalityCreateWithoutPersonInput} from "../generated/prisma/models/nationality.ts"
import type {social_statusCreateWithoutPersonInput} from "../generated/prisma/models/social_status.ts"
import type {residenceCreateInput} from "../generated/prisma/models/residence.ts"

export const resolvers = {
  Query: {
    trees: async () => await prisma?.geneology_tree.findMany(),
    tree: async (_parent: unknown, args: { id: string }) =>
      await prisma?.geneology_tree.findFirst({
        where: { id: args.id },
      }),
    persons: async () => await prisma?.person.findMany(),
    person: async (_parent: unknown, args: { id: string }) =>
      await prisma?.person.findFirst({
        where: { id: args.id },
      }),
  },
  // resolvers.ts
  Mutation: {
    createPerson: async (
      _parent: unknown,
      args: {
        person_input: any;
        apartment_input: apartmentCreateWithoutPersonInput;
        house_input: houseCreateWithoutApartmentInput;
        street_input: streetCreateWithoutHouseInput;
        city_input: cityCreateWithoutStreetInput;
        region_input: regionCreateWithoutCityInput;
        country_input: countryCreateWithoutRegionInput;
        city_where: cityCreateOrConnectWithoutRegionInput;
        occupation_input: occupationCreateWithoutPerson_person_occupationTooccupationInput;
        education_input: educationCreateWithoutPerson_person_educationToeducationInput;
        nationality_input: nationalityCreateWithoutPersonInput;
        social_status_input: social_statusCreateWithoutPersonInput;
        residence_input: residenceCreateInput;
      },
      context: { prisma: PrismaClient },
    ) => {
      try {
        const { person_input } = args;
        const { prisma } = context;
        const created_at = new Date();
        const updated_at = new Date();
        const newPerson = prisma?.person.create({
          data: {
            first_name: person_input.first_name,
            patronymic: person_input.patronymic,
            gender: person_input.gender,
            birth_date: person_input.birth_date,
            birth_date_approx: person_input.birth_date_approx,
            death_date: person_input.death_date,
            death_date_approx: person_input.death_date_approx,
            bio: person_input.bio,
            source_info: person_input.source_info,
            is_person_contacted: person_input.is_person_contacted,
            created_at: created_at,
            updated_at: updated_at,

            geneology_tree_id: person_input.geneology_tree_id,
            mother_id: person_input.mother_id,
            father_id: person_input.father_id,
            surname: {
                create: person_input.surname
            },
            maiden_surname: {
                create: person_input.maiden_surname
            },
            occupation: {
                create: {
                    title: args.occupation_input.title,
                    organization: args.occupation_input.organization,
                    start_year: args.occupation_input.start_year,
                    end_year: args.occupation_input.end_year
                }
            },
            education: {
                create: {
                    institution: args.education_input.institution,
                    degree: args.education_input.degree,
                    start_year: args.education_input.year_start,
                    end_year: args.education_input.year_end
                }
            },
            nationality: {
                create: {
                    name: args.nationality_input.name,
                    updated_at: updated_at
                }
            },
            social_status: {
                create: {
                    name: args.social_status_input.name,
                    description: args.social_status_input.description,
                    created_at: created_at
                }
            },

            residence : {
                create: {
                    start_date: args.residence_input.start_date,
                    end_date: args.residence_input.end_date,
                    start_date_approx: args.residence_input.start_date_approx,
                    end_date_approx: args.residence_input.end_date_approx,
                    country: {
                        create: {
                            name: args.country_input.name,
                            created_at: created_at
                        }
                    },
                    city: {
                        create: {
                            name: args.city_input.name,
                            created_at: created_at
                        }
                    },
                    street: {
                        create: {
                            name: args.street_input.name,
                            created_at: created_at
                        }
                    },
                    house: {
                        create: {
                            name: args.house_input.name,
                            created_at: created_at
                        }
                    },
                    apartment: {
                        create: {
                            name: args.apartment_input.name,
                            created_at: created_at
                        }
                    }

                }
            },

            birth_place_country_id: person_input.birth_place_country_id,
            birth_place_city_id: person_input.birth_place_city_id,
            birth_place_street: person_input.birth_place_street_id,
            birth_place_house: person_input.birth_place_house_id,
            birth_place_apartment: person_input.birth_place_apartment,

            death_place_country_id: person_input.death_place_country_id,
            death_place_city_id: person_input.death_place_city_id,
            death_place_street: person_input.death_place_street_id,
            death_place_house: person_input.death_place_house_id,
            death_place_apartment: person_input.death_place_apartment

          },
        });
        return newPerson;
      } catch (error: any) {
        console.error("Error creating person:", error);
        throw new Error(`Failed to create person: ${error.message}`);
      }
    },
    updatePerson: async (
      _parent: unknown,
      args: { person_input: personUpdateInput },
    ) => {
      try {
        const { person_input } = args;
      } catch (error: any) {
        console.error("Error creating person:", error);
        throw new Error(`Failed to create person: ${error.message}`);
      }
    },
  },
};
