import pkg from "pg";
import { dbConfig } from "./dbConfig";
// import {nanoid} from "nanoid"
// const bcrypt = require('bcrypt');
import bcrypt from "bcrypt";
const { Pool } = pkg;

const pool = new Pool({
  user: dbConfig.user,
  password: dbConfig.password,
  host: dbConfig.host,
  port: dbConfig.port,
  database: dbConfig.database_name,
});

// password hashing
async function hashPassword(plainPassword: string) {

    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);
    return hashedPassword;
}

async function verifyPassword(plainPassword: string, hashedPasswordFromDB: string) {
    const isValid = await bcrypt.compare(plainPassword, hashedPasswordFromDB);
    return isValid;
}

export const db = {
    findUserByID: async (id: Number) => {
        const result = await pool.query(`SELECT * FROM Users where id=$1 and role=1`, [id]);
        return result.rows[0];
    },
    // findAdminByID: async (id: Number) => {
    //     const result = await pool.query(`SELECT * FROM Users where id=$1 and role=2`, [id]);
    //     return result.rows[0];
    // },
    createUser: async (username: String, email: String, password: string, role: Number, is_blocked: Boolean) => {
        const hash_password = hashPassword(password);
        await pool.query(`INSERT INTO Users (username, email, password_hash, role_id, is_blocked) VALUES
            (
                $1,
                $2,
                $3,
                $4,
                $5
            );

            `,
        [
            username,
            email,
            hashPassword,
            role,
            is_blocked
        ]
        )
    },
    findUsers: async () => {
        const result = await pool.query(`SELECT * from Users`);
        return result.rows;
    }

}
