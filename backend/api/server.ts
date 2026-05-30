import pkg from "pg";
import { dbConfig } from "../dbConfig";
// import {nanoid} from "nanoid"
// const bcrypt = require('bcrypt');
// import bcrypt from "bcrypt";
import { prisma } from '../lib/prisma.ts';
// const { Pool } = pkg;

// type person = prisma.person;

// async function createPerson(input: prisma.person) : prisma.person => {
//   return await 0;
// }
  
async function name(params:string) {
  
}

export const db = {
  // createPerson: async () => {
  //     prisma?.person.create
  // }
  findPersonById: async (id: string) => {
    prisma?.person.findFirst(
      {
        where: {
          id: id
        }
      }
    )
  },
  findTreeById: async (id:string) => {
      prisma?.geneology_tree.findFirst({
        where: {
          id: id
        }
      })
  }
}


