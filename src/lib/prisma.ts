import { PrismaClient } from '../generated/prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
}

let prismaInstance: PrismaClient | null = null;

export function getPrisma(): PrismaClient {
  if (!prismaInstance) {
    prismaInstance = globalForPrisma.prisma ?? createPrismaClient();
    if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prismaInstance;
  }
  return prismaInstance;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    return Reflect.get(getPrisma(), prop);
  },
});
