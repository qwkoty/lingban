import { pool } from '../api/lib/prisma.js';

async function resetDatabase() {
  console.log('Dropping public schema to reset migrations and data...');
  await pool.query('DROP SCHEMA IF EXISTS public CASCADE');
  await pool.query('CREATE SCHEMA public');
  await pool.query('GRANT ALL ON SCHEMA public TO public');
  await pool.end();
  console.log('Public schema reset complete.');
}

resetDatabase().catch((err) => {
  console.error('Failed to reset database:', err);
  process.exit(1);
});
