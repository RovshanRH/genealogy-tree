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

interface Geneology_tree {
  id: string,
  name: string;
}

interface Person {
  id: string,
  geneology_tree_id: string;
  // surname: string,
  // maiden_surname: string,
  first_name: string;
  patronymic: string;
  gender: "male" | "female";
  // birth_date: string,
  // birth_date_approx: boolean,
  // birth_place_country_id: string,
  // birth_place_city_id: string,
  // birth_place_street: string,
  // birth_place_house: string,
  // birth_place_apartment: string,
  bio: string;
  source_info: string;
  is_person_contacted: boolean;
}


// password hashing
async function hashPassword(plainPassword: string) {
  const saltRounds = 12;
  const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);
  return hashedPassword;
}

async function verifyPassword(
  plainPassword: string,
  hashedPasswordFromDB: string,
) {
  const isValid = await bcrypt.compare(plainPassword, hashedPasswordFromDB);
  return isValid;
}

export const db = {
  // User methods
  findUserByID: async (id: string) => {
    const result = await pool.query(
      `SELECT * FROM Users where id=$1 and role=1;`,
      [id],
    );
    return result.rows[0];
  },
  // findAdminByID: async (id: Number) => {
  //     const result = await pool.query(`SELECT * FROM Users where id=$1 and role=2`, [id]);
  //     return result.rows[0];
  // },
  createUser: async (
    username: string,
    email: string,
    password: string,
    role: Number,
    is_blocked: Boolean,
  ) => {
    const hash_password = hashPassword(password);
    await pool.query(
      `INSERT INTO Users (username, email, password_hash, role_id, is_blocked) VALUES
            (
                $1,
                $2,
                $3,
                $4,
                $5
            );

            `,
      [username, email, hashPassword, role, is_blocked],
    );
  },
  findUsers: async () => {
    const result = await pool.query(`SELECT * from Users;`);
    return result.rows;
  },
  // Tree methods

  findTreeByID: async (id: string) => {
    const result = await pool.query(
      `SELECT * from geneology_tree where id=$1;`,
      [id],
    );
    return result.rows[0];
  },
  findTrees: async () => {
    const result = await pool.query(`SELECT * from geneology_tree;`);
    return result.rows;
  },

  createGeneologyTree: async (input: Geneology_tree) => {
    await pool.query(
      `INSERT INTO geneology_tree name VALUES
            (
                $1
            );
            `,
      [
        // input.id,
        input.name,
      ],
    );
  },
  updateGeneologyTree: async (input: Geneology_tree, id: string) => {
    await pool.query(`UPDATE geneology_tree SET name=$1 where id=$2;`,
        [input.name , id]
    )
  },
  deleteGeneologyTree: async (id: string) => {
    const result = await pool.query(`DELETE FROM geneology_tree where id=$1;`, [id]);
    return result.rows.length > 0;
  },

  // person methods

  findPersonByID: async (id: string) => {
    const result = await pool.query(`SELECT * from person WHERE id=$1;`, [id]);
    return result.rows[0];
  },

  findPersons: async () => {
    const result = await pool.query(`SELECT * FROM person;`);
    return result.rows;
  },

  createPerson: async (person: Person) => {
    await pool.query(
      `INSERT INTO person VALUES
            (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6,
                $7,


            )
                where id=$8;
            `,
      [
        person.geneology_tree_id,
        person.first_name,
        person.patronymic,
        person.gender,
        person.bio,
        person.source_info,
        person.is_person_contacted,
        person.id
      ],
    );
  },
  updatePerson: async (person: Person) => {
    await pool.query(
      `UPDATE person SET
            
        geneology_tree_id=$1,
        first_name=$2,
        patronymic=$3,
        gender=$4,
        bio=$5,
        source_info=$6,
        is_person_contacted=$7

        where id=$8;


            
            `,
      [
        person.geneology_tree_id,
        person.first_name,
        person.patronymic,
        person.gender,
        person.bio,
        person.source_info,
        person.is_person_contacted,
        person.id
      ],
    );
  },
  deletePerson: async (id: string) => {
    const result = await pool.query(`DELETE FROM geneology_tree where id=$1;`,
      [id]
    );
    return result.rows.length > 0;
  }
  

};
