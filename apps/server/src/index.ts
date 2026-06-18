import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import usersRouter from './routes/users';
import agentsRouter from './routes/agents';
import { prisma } from './lib/prisma';

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', db: 'connected', time: new Date().toISOString() });
  } catch (e) {
    res.status(500).json({
      status: 'ok',
      db: 'error',
      error: e instanceof Error ? e.message : String(e),
      time: new Date().toISOString(),
    });
  }
});

app.use('/api/users', usersRouter);
app.use('/api/agents', agentsRouter);

// 代理拉取 NVIDIA 可用模型列表（避免移动端 CORS）
app.get('/api/models/nvidia', async (req, res) => {
  const apiKey = req.headers.authorization?.replace('Bearer ', '');
  if (!apiKey) {
    res.status(401).json({ success: false, error: 'Missing API key' });
    return;
  }
  try {
    const resp = await fetch('https://integrate.api.nvidia.com/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!resp.ok) {
      const text = await resp.text();
      res.status(resp.status).json({ success: false, error: text });
      return;
    }
    const data: any = await resp.json();
    const models = (data.data || [])
      .map((m: any) => m.id)
      .filter((id: string) => typeof id === 'string');
    res.json({ success: true, models });
  } catch (e) {
    res.status(500).json({ success: false, error: e instanceof Error ? e.message : 'Failed to fetch models' });
  }
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
