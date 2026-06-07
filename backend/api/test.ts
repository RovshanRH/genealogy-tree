import dotenv from 'dotenv';
import path from 'path';

dotenv.config({path: '../../.env'})

console.log('DATABASE_URL:', process.env.DATABASE_URL);