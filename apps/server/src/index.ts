import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import usersRouter from './routes/users';
import agentsRouter from './routes/agents';
import { prisma } from './lib/prisma';

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/health', async (_req, res) => {
  let migrateLog = 'no migrate log';
  try {
    migrateLog = fs.readFileSync('/tmp/migrate.log', 'utf8');
  } catch {
    migrateLog = 'migrate.log not found';
  }
  try {
    await prisma.$queryRaw`SELECT 1`;
    let migrations: unknown = null;
    let tableCheck: unknown = null;
    try {
      migrations = await prisma.$queryRaw`SELECT migration_name, finished_at FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 5`;
    } catch (e) {
      migrations = `migrations table error: ${e instanceof Error ? e.message : String(e)}`;
    }
    try {
      tableCheck = await prisma.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('users', 'agents', 'conversations')`;
    } catch (e) {
      tableCheck = `table check error: ${e instanceof Error ? e.message : String(e)}`;
    }
    res.json({ status: 'ok', db: 'connected', migrations, tables: tableCheck, migrateLog, time: new Date().toISOString() });
  } catch (e) {
    res.status(500).json({
      status: 'ok',
      db: 'error',
      error: e instanceof Error ? e.message : String(e),
      migrateLog,
      time: new Date().toISOString(),
    });
  }
});

app.use('/api/users', usersRouter);
app.use('/api/agents', agentsRouter);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
