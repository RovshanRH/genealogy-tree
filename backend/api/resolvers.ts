// TODO: рефакторинг мутаций. Добавить валидацию. Рефакторинг БД: везде по create_at и uodate_at. Поменять связи (место жительства и персонаж)

import { id } from "zod/locales";
import { prisma } from "../lib/prisma.ts";
import { z } from "zod";
import { publicProcedure } from "../api_auth/trpc.ts";
// import { publicProcedure } from '../api_auth/trpc';
import type {
  personCreateInput,
  personFindFirstArgs,
  personUpdateInput,
  personUncheckedCreateInput,
  personCreateManyGeneology_treeInputEnvelope,
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
// import { prisma } from '../lib/prisma';
// import { Context } from '../server/context';
import type { PrismaClient } from "@prisma/client/extension";
// import { apartment, maiden_surname, geneology_tree } from '../generated/prisma/browser';
import type { occupationCreateWithoutPerson_person_occupationTooccupationInput } from "../generated/prisma/models/occupation.ts";
import type { educationCreateWithoutPerson_person_educationToeducationInput } from "../generated/prisma/models/education.ts";
import type { nationalityCreateWithoutPersonInput } from "../generated/prisma/models/nationality.ts";
import type { social_statusCreateWithoutPersonInput } from "../generated/prisma/models/social_status.ts";
import type { residenceCreateInput } from "../generated/prisma/models/residence.ts";
import type {
  geneology_treeCreateInput,
  geneology_treeUpdateInput,
} from "../generated/prisma/models/geneology_tree.ts";
import { create } from "domain";
import { error } from "node:console";
// import { geneology_tree } from '../generated/prisma/models/geneology_tree';

export const resolvers = {
  Query: {
    trees: async () => {
      try {
        const geneology_trees = await prisma?.geneology_tree.findMany();
        return geneology_trees;
      } catch (error: any) {
        console.error("Error finding trees", error);
      }
    },
    tree: async (_parent: unknown, args: { id: string }) => {
      try {
        const geneology_tree =
        await prisma?.geneology_tree.findFirst({
          where: { id: args.id },
        });
        return geneology_tree
      } catch (error: any) {
        console.error("Error finding tree", error);
      }
    },
    persons: async () => {
      try {
        const people = 
        await prisma?.person.findMany();
        return people
      } catch (error: any) {
        console.error("Error finding people", error);
      }
    },
    person: async (_parent: unknown, args: { id: string }) => {
      try {
        const person =
        await prisma?.person.findFirst({
        where: { id: args.id },
        });
        return person;
      } catch (error: any) {
        console.error("Error finding person", error);
      }
    },
  },
  Mutation: {
    // CRUD персонажей
    createPerson: async (
      _parent: unknown,
      args: {
        person_input: personUncheckedCreateInput;
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
        const { prisma } = context;
        const newPerson = prisma?.person.create({
          data: {
            first_name: args.person_input.first_name,
            patronymic: args.person_input.patronymic,
            gender: args.person_input.gender,
            birth_date: args.person_input.birth_date,
            birth_date_approx: args.person_input.birth_date_approx,
            death_date: args.person_input.death_date,
            death_date_approx: args.person_input.death_date_approx,
            bio: args.person_input.bio,
            source_info: args.person_input.source_info,
            is_person_contacted: args.person_input.is_person_contacted,

            geneology_tree_id: args.person_input.geneology_tree_id,
            mother_id: args.person_input.mother_id,
            father_id: args.person_input.father_id,
            surname: {
              create: args.person_input.surname,
            },
            maiden_surname: {
              create: args.person_input.maiden_surname,
            },
            occupation: {
              create: {
                title: args.occupation_input.title,
                organization: args.occupation_input.organization,
                start_year: args.occupation_input.start_year,
                end_year: args.occupation_input.end_year,
              },
            },
            education: {
              create: {
                institution: args.education_input.institution,
                degree: args.education_input.degree,
                start_year: args.education_input.year_start,
                end_year: args.education_input.year_end,
              },
            },
            nationality: {
              create: {
                name: args.nationality_input.name,
              },
            },
            social_status: {
              create: {
                name: args.social_status_input.name,
                description: args.social_status_input.description,
              },
            },

            residence: {
              create: {
                start_date: args.residence_input.start_date,
                end_date: args.residence_input.end_date,
                start_date_approx: args.residence_input.start_date_approx,
                end_date_approx: args.residence_input.end_date_approx,
                country: {
                  create: {
                    name: args.country_input.name,
                  },
                },
                city: {
                  create: {
                    name: args.city_input.name,
                  },
                },
                street: {
                  create: {
                    name: args.street_input.name,
                  },
                },
                house: {
                  create: {
                    name: args.house_input.name,
                  },
                },
                apartment: {
                  create: {
                    name: args.apartment_input.name,
                  },
                },
              },
            },

            birth_place_country_id: args.person_input.birth_place_country_id,
            birth_place_city_id: args.person_input.birth_place_city_id,
            birth_place_street: args.person_input.birth_place_street,
            birth_place_house: args.person_input.birth_place_house,
            birth_place_apartment: args.person_input.birth_place_apartment,

            death_place_country_id: args.person_input.death_place_country_id,
            death_place_city_id: args.person_input.death_place_city_id,
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
      context: { prisma: PrismaClient },
    ) => {
      try {
        const { person_input } = args;
        const { prisma } = context;
        const updated_at = new Date();
        const selectedPerson = await prisma.person.findUnique({
          where: { id: person_input.id },
        });
        if (!selectedPerson) {
          throw new Error("Person not found");
        }

        const updatedPerson = prisma.person.update({
          where: { id: selectedPerson.id },
          data: {
            ...person_input,
            updated_at,
          },
        });

        return updatedPerson;
      } catch (error: any) {
        console.error("Error updating person:", error);
        throw new Error(`Failed to update person: ${error.message}`);
      }
    },
    deletePerson: async (
      _parent: unknown,
      args: { id: string },
      context: { prisma: PrismaClient },
    ) => {
      try {
        const { prisma } = context;
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
      args: { input: geneology_treeCreateInput },
      // context: { prisma: PrismaClient }
    ) => {
      try {
        // const { prisma } = context;
        const { input } = args;
        const newTree = await prisma.geneology_tree.create({
          data: {
            name: input.name
          }
        });
        return newTree;
      } catch (error: any) {
        console.error("Error creating Tree", error);
        throw new Error(`Failed to create tree: ${error.message}`);
      }
    },
    updateTree: async (
      _parent: unknown,
      args: { input: geneology_treeUpdateInput, id: string },
      context: { prisma: PrismaClient },
    ) => {
      try {
        const { prisma } = context;
        // const { input } = args;
        const updated_at = new Date();
        const updatedTree = await prisma.geneology_tree.update({
          where: { id: args.id },
          data: {
            ...args.input,
            updated_at,
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
      context: { prisma: PrismaClient },
    ) => {
      try {
        const { prisma } = context;
        const deletedTree = await prisma.geneology_tree.delete({
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
