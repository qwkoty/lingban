import path from 'node:path';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  // @ts-expect-error migrate.adapter is supported at runtime but not yet in type definitions
  migrate: {
    async adapter(env: Record<string, string | undefined>) {
      const { PrismaPg } = await import('@prisma/adapter-pg');
      const { Pool } = await import('pg');
      const connectionString = env.DATABASE_URL;
      if (!connectionString) {
        throw new Error('DATABASE_URL is not set');
      }
      const pool = new Pool({
        connectionString,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      });
      return new PrismaPg(pool);
    },
  },
});
