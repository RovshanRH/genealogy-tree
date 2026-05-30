import { initTRPC, TRPCError } from '@trpc/server';
import { prisma } from '../lib/prisma.ts';
import { CompactEncrypt, SignJWT, jwtVerify } from "jose";
import stringToCryptoKey from "../utils/secretEncoder.ts";
import type { Context } from "../server/context.ts";
import dotenv from 'dotenv';
import superjson from 'superjson'


dotenv.config({path: '../.env'})

console.log(process.env.JWT_SECRET);
const secret: CryptoKey = await stringToCryptoKey(process.env.JWT_SECRET!);

// import {prisma}
/**
 * Initialization of tRPC backend
 * Should be done only once per backend!
 */
const t = initTRPC.context<Context>().create({
    transformer: superjson,
});
 
/**
 * Export reusable router and procedure helpers
 * that can be used throughout the router
 */
// middleware

async function getUserFromToken(token?: string) {
  // Если токена нет - сразу возвращаем null
  if (!token) return null;
  
  try {
    // Верифицируем JWT токен
    const decoded = jwtVerify(token, secret) as any;
    
    const user = await prisma?.users.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    });
    
    return user;
  } catch (error) {
    return null;
  }
}

const authMiddleware = t.middleware(async ({ ctx, next }) => {
  // Предполагаем, что токен приходит в заголовке Authorization
  const token = ctx.req?.headers?.authorization?.split(' ')[1];
  const user = await getUserFromToken(token);
  
  if (!user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to access this resource'
    });
  }
  
  return next({
    ctx: {
      ...ctx,
      user
    }
  });
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(authMiddleware);
