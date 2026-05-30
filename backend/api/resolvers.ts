import { id } from "zod/locales";
import { prisma } from "../lib/prisma.ts";
import { z } from "zod";
import { publicProcedure } from "../api_auth/trpc.ts";
// import { publicProcedure } from '../api_auth/trpc';
import { db } from "./server.ts";
import type { personFindFirstArgs } from "../generated/prisma/models/person";
import { AnyNull } from "../generated/prisma/internal/prismaNamespace";
// import { prisma } from '../lib/prisma';

export const resolvers = {
  Query: {
    trees: async () => await prisma?.geneology_tree.findMany(),
    tree: async (_parent: unknown, _args: { id: string }) =>
      await prisma?.geneology_tree.findFirst({
        where: { id: _args.id },
      }),
    persons: async () => await prisma?.person.findMany(),
    person: async (_parent: unknown, _args: { id: string }) =>
      await prisma?.person.findFirst({
        where: { id: _args.id },
      }),

  },
  Mutation: {},
};
