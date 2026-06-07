import dotenv from 'dotenv';
// dotenv.config();
dotenv.config({path: '../.env'})

export const dbConfig= {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    database_name: process.env.DB_NAME,
    port: Number(process.env.DB_PORT),
    database_url: process.env.DATABASE_URL
}