import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../src/generated/prisma/client.js';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set');
}

// Render 等平台的 PostgreSQL 默认需要 SSL
const ssl = databaseUrl.includes('sslmode=require') ? { rejectUnauthorized: false } : undefined;

export const pool = new Pool({
  connectionString: databaseUrl,
  ssl,
});

const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});
