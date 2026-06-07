
// TODO протестировать апишку

import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { readFileSync } from 'fs';
import { resolvers } from "./resolvers.ts";
// import { db } from "./server";
// import {PrismaClient} from '../generated/prisma/client.ts'

import { prisma } from "../lib/prisma.ts";

const typeDefs = readFileSync('api/schema.graphql', { encoding: 'utf-8' });

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

async function startServer() {
  const { url } = await startStandaloneServer(server, {
    listen: { port: 4000 },
    context: async () => ({
      prisma,
    }),
  });

  console.log(`GraphQL Server ready at: ${url}`);
}

void startServer();