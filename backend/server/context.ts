// server/context.ts
import type { CreateFastifyContextOptions } from '@trpc/server/adapters/fastify';
import { prisma } from '../lib/prisma.ts';

// Определяем тип контекста
export const createContext = ({ req, res }: CreateFastifyContextOptions) => {
  return {
    req,      // Fastify request объект
    res,      // Fastify response объект
    prisma,   // Prisma клиент
  };
};

// Экспортируем тип для использования в других местах
export type Context = Awaited<ReturnType<typeof createContext>>;