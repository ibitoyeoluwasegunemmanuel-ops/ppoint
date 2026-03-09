import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const schemaPath = path.resolve(__dirname, '../../../database/schema.sql');

export const initDatabase = async () => {
  const schemaSql = await fs.readFile(schemaPath, 'utf8');
  await pool.query(schemaSql);
  console.log('Database schema initialized');
};

const isExecutedDirectly = process.argv[1] && path.resolve(process.argv[1]) === __filename;

if (isExecutedDirectly) {
  initDatabase()
    .then(async () => {
      await pool.end();
    })
    .catch(async (error) => {
      console.error('Database initialization failed', error);
      await pool.end().catch(() => undefined);
      process.exit(1);
    });
}