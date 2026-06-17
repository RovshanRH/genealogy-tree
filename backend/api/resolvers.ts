// TODO: рефакторинг мутаций. Добавить валидацию. Рефакторинг БД: везде по create_at и uodate_at. Поменять связи (место жительства и персонаж)

import { id } from "zod/locales";
import { prisma } from "../lib/prisma.ts";
import { z } from "zod";
// import { publicProcedure } from "../api_auth/trpc.ts";
// import { publicProcedure } from '../api_auth/trpc';
// import { occupation, relations } from '../generated/prisma/browser';
import type {
  personCreateInput,
  personFindFirstArgs,
  personUpdateInput,
  personUncheckedCreateInput,
  personUncheckedUpdateInput,
} from "../generated/prisma/models/person";

import { personDataBuilder } from "../utils/CreatePersonHelpers.ts";

import type {
  genealogy_treeCreateInput,
  genealogy_treeUpdateInput,
} from "../generated/prisma/models/genealogy_tree.ts";

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
  Mutation: {
    // CRUD персонажей
    createPerson: async (
      _parent: unknown,
      args: {
        input: personCreateInput;
        mother_input: personUncheckedCreateInput | null;
        father_input: personUncheckedCreateInput | null;
        spouse_input: personUncheckedCreateInput | null;
      },
      // context: { prisma: PrismaClient },
    ) => {
      try {
        const personBuilder = new personDataBuilder();

        const transactionCreatePerson = await prisma.$transaction(
          async (tx) => {
            console.log("🚀 [TRANSACTION] START");

            const data = await personBuilder.buildData(tx, args.input);

            // Проверяем, что обязательные поля есть
            if (!data.firstname) {
              throw new Error("Firstname is required");
            }

            console.log("📊 [TRANSACTION] Creating person with data:", {
              firstname: data.firstname,
              hasSurname: !!data.surname,
              hasBirthPlace: !!data.birth_place,
              hasDeathPlace: !!data.death_place,
            });

            const newPerson = await tx.person.create({
              data,
            });

            console.log("✅ [TRANSACTION] Person created:", newPerson.id);
            return newPerson;
          },
        );

        return transactionCreatePerson;
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
        // const { input } = args;
        // const { prisma } = context;
        const updated_at = new Date();
        const selectedPerson = await prisma.person.findUnique({
          where: { id: args.id },
        });
        if (!selectedPerson) {
          throw new Error("Person not found");
        }

        const updatedPerson = prisma.person.update({
          where: { id: selectedPerson.id },
          data: {
            ...args.input,
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
