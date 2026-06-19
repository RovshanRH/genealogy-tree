import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.ts";
import dotenv from 'dotenv';
import { dbConfig } from "../dbConfig.ts";
// dotenv.config({path: '../../.env'})
const adapter = new PrismaPg({ connectionString: dbConfig.DATABASE_URL });
export const prisma = new PrismaClient({ adapter });

