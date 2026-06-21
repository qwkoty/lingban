import { PrismaClient } from '../../src/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const { Pool } = pg;

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is not set');
  }
  return url;
}

function buildPoolConfig(): pg.PoolConfig {
  const connectionString = getDatabaseUrl();
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    connectionString,
    ssl: isProduction ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    max: 10,
  };
}

const pool = new Pool(buildPoolConfig());

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err);
});

const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'production' ? ['error', 'warn'] : ['error', 'warn', 'info'],
});

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  await pool.end();
}
