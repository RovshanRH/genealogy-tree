import { z } from "zod";
import { publicProcedure, router, protectedProcedure } from "../api_auth/trpc.ts";
import { prisma } from "../lib/prisma.ts";
import { error } from "node:console";
import { TRPCError } from "@trpc/server";
import bcrypt from "bcrypt";
// import { bc } from "bcrypt";
import type { Users } from "../generated/prisma/browser";
import { CompactEncrypt, SignJWT, jwtVerify } from "jose";

import stringToCryptoKey from "../utils/secretEncoder.ts";
const secret: CryptoKey = await stringToCryptoKey(process.env.JWT_SECRET!);
// юзер Роутер с валидацией
export const userRouter = router({

  register: publicProcedure
    .input(
      z.object({
        email: z.string(),
        username: z.string(),
        password: z.string().min(6),
      }),
    )
    .mutation(async ({ input }) => {
      const saltRounds = 10;

      const salt = await bcrypt.genSalt(saltRounds);
      const hashedPassword: string = await bcrypt.hash(input.password, salt);

      const user = await prisma?.users.create({
        data: {
          id: "",
          email: input.email,
          username: input.username,
          password_hash: hashedPassword,
          role_id: 1,
        },
      });

      const token = new SignJWT({
        userEmail: user?.email,
      })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("2h")
        .sign(secret);

      //   const { password_hash, ...userWithoutPassword } = user;
      return { user: hashedPassword, token };
    }),

  login: publicProcedure
    .input(
      z.object({
        email: z.string(),
        password: z.string().min(6),
      }),
    )
    .query(async ({ input }) => {
      const user = await prisma?.users.findUnique({
        where: { email: input.email },
      });
      if (!user) {
        throw new TRPCError({
          code: `NOT_FOUND`,
          message: `User not found`,
          cause: `Incorrect email or user with this email doesn't exists in database`,
        });
      }
      const isValid = await bcrypt.compare(input.password, user.password_hash);
      if (!isValid) {
        throw new TRPCError({
          code: `BAD_REQUEST`,
          message: `Incorrect Password`,
        });
      }
      const token = new SignJWT({
        userEmail: user?.email,
      })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("2h");

      return { user: user.password_hash, token };
    }),

  refreshToken: publicProcedure
    .input(
      z.object({
        token: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const decoded = (await jwtVerify(input.token, secret)) as any;
      const user = await prisma?.users.findFirst({
        where: {
          id: decoded.id,
        },
      });
      if (!user) {
        throw new TRPCError({
          code: `NOT_FOUND`,
          message: `User not found`,
          cause: `Incorrect email or user with this email doesn't exists in database`,
        });
      }
      const newToken = new SignJWT({
        userEmail: user?.email,
      })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("2h");

      return {token: newToken}
    }),

    logout: protectedProcedure
    .mutation(
        async () => {
            // Удаление сессии
        }
    )
    
});
