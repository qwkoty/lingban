import { defineConfig } from 'prisma/config';
import path from 'node:path';

const databaseUrl = process.env.DATABASE_URL || 'postgresql://localhost:5432/lingban?schema=public';

export default defineConfig({
  earlyAccess: true,
  schema: path.join(__dirname, 'prisma', 'schema.prisma'),
  migrations: {
    path: path.join(__dirname, 'prisma', 'migrations'),
  },
  datasource: {
    url: databaseUrl,
  },
});
