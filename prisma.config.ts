import 'dotenv/config';
import path from 'node:path';
import { defineConfig } from 'prisma/config';

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  const isGenerate = process.argv.some(
    (arg) => arg === 'generate' || arg.endsWith('/prisma') || arg.endsWith('\\prisma')
  );

  if (!url) {
    if (isGenerate) {
      return 'postgresql://localhost:5432/lingban';
    }
    throw new Error('DATABASE_URL is not set');
  }

  if (process.env.NODE_ENV !== 'production') {
    return url;
  }

  const parsed = new URL(url);
  const params = parsed.searchParams;
  if (!params.has('sslmode')) {
    params.set('sslmode', 'no-verify');
  }
  return parsed.toString();
}

export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  datasource: {
    url: getDatabaseUrl(),
  },
});
