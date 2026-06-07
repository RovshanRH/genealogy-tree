import dotenv from 'dotenv';
// dotenv.config();
dotenv.config({path: '../.env'})

export const dbConfig= {
    DB_USER: process.env.DB_USER,
    DB_PASSWORD: process.env.DB_PASSWORD,
    DB_HOST: process.env.DB_HOST,
    DB_NAME: process.env.DB_NAME,
    DB_PORT: Number(process.env.DB_PORT),
    DATABASE_URL: process.env.DATABASE_URL
}