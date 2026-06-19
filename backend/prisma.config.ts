import "dotenv/config";
import { defineConfig, env } from "prisma/config";
import path from 'path';

// Явно указываем путь к .env в корне проекта
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../.env') }); // поднимаемся на уровень выше из backend/

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});