import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { typeDefs } from "./schema";
import { resolvers } from "./resolvers";
import { db } from "./server";

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

async function startServer() {
  const { url } = await startStandaloneServer(server, {
    listen: { port: 4000 },
    context: async () => ({ db }),
  });

  console.log(`GraphQL Server ready at: ${url}`);
}

void startServer();