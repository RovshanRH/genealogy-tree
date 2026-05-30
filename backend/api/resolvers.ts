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
// import { apartment } from '../generated/prisma/browser';


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
        input: personCreateInput;
        apartment_input: apartmentCreateWithoutPersonInput;
        house_input: houseCreateWithoutApartmentInput;
        street_input: streetCreateWithoutHouseInput;
        city_input: cityCreateWithoutStreetInput;
        region_input: regionCreateWithoutCityInput;
        country_input: countryCreateWithoutRegionInput;
        city_where: cityCreateOrConnectWithoutRegionInput;
      },
      context: { prisma: PrismaClient },
    ) => {
      try {
        const { input } = args;
        const { prisma } = context;

        const newPerson = prisma?.person.create({
          data: {
            first_name: input.first_name,
            patronymic: input.patronymic,
            gender: input.gender,
            birth_date: input.birth_date,
            birth_date_approx: input.birth_date_approx,
            death_date: input.death_date,
            death_date_approx: input.death_date_approx,
            bio: input.bio,
            source_info: input.source_info,
            is_person_contacted: input.is_person_contacted,
            created_at: new Date(),
            updated_at: new Date(),
            // связанные строки
            // apartment: {
            //   create: {
            //     name: args.apartment_input.name,
            //     created_at: new Date(),
            //     house: {
            //       create: {
            //         created_at: new Date(),
            //         name: args.house_input.name,
            //         street: {
            //           create: {
            //             created_at: new Date(),
            //             name: args.street_input.name,
            //             city: {
            //               created_at: new Date(),
            //               name: args.city_input.name,
            //               region: {
            //                 create: {
            //                   created_at: new Date(),
            //                   name: args.region_input.name,
            //                   country: {
            //                     create: {
            //                       created_at: new Date(),
            //                       name: args.country_input.name,
            //                     },
            //                   },
            //                 },
            //               },
            //             },
            //           },
            //         },
            //       },
            //     },
            //   },
            // },
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
      args: { input: personUpdateInput },
    ) => {
      try {
        const { input } = args;
      } catch (error: any) {
        console.error("Error creating person:", error);
        throw new Error(`Failed to create person: ${error.message}`);
      }
    },
  },
};
