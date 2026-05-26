import { router, publicProcedure } from './trpc.ts';
import { userRouter } from "../routers/user.ts";

export const appRouter = router({
    user: userRouter,
    streamData: publicProcedure.query(async function* () {
    for (let i = 0; i < 5; i++) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      yield { message: `Шаг ${i}` }; // Данные отправляются частями
    }
  }),
}) 

export type appRouter = typeof appRouter;
