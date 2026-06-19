import Fastify from "fastify";
import websocket from '@fastify/websocket';
import { appRouter } from "../api_auth/appRouter.ts";
import { fastifyTRPCPlugin } from "@trpc/server/adapters/fastify";
import { timeStamp } from "node:console";

const server = Fastify({
  logger: true
})

server.register(websocket);

server.register(fastifyTRPCPlugin, {
    prefix: `/trpc`,
    useWSS: true,
    trpcOptions: {
        router: appRouter
    },
})

server.get('/health', async () => {
    return {message: "it's fine", timeStamp: new Date().toISOString()};
});

server.listen({port: 4000}, (err, address) => {
    if (err) {
        console.log(`server exited with ${err}`)
        server.close
    }
    console.log(`server launched on ${address}`);
})
