import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import type { RequestHandler } from 'express';
import path from 'path';
import fs from 'fs';
import usersRouter from './routes/users';
import agentsRouter from './routes/agents';
import { prisma } from './lib/prisma';

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

const allowedOrigins = (process.env.ALLOWED_ORIGINS ||
  'http://localhost:5173,http://localhost:3000,http://localhost:3001')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '2mb' }));

// 全局 API 速率限制：每 IP 15 分钟最多 100 次
app.use(
  '/api',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    handler(_req, res) {
      res.status(429).json({ success: false, error: 'Too many requests, please try again later.' });
    },
  }) as unknown as RequestHandler
);

// 聊天接口更严格：每 IP 1 分钟最多 30 次
app.use(
  '/api/agents/:id/chat',
  rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    handler(_req, res) {
      res.status(429).json({ success: false, error: 'Chat rate limit exceeded, please slow down.' });
    },
  }) as unknown as RequestHandler
);

app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', db: 'connected', time: new Date().toISOString() });
  } catch (e) {
    res.status(503).json({
      status: 'error',
      db: 'error',
      error: e instanceof Error ? e.message : String(e),
      time: new Date().toISOString(),
    });
  }
});

app.use('/api/users', usersRouter);
app.use('/api/agents', agentsRouter);

// 代理拉取 NVIDIA 可用模型列表（避免前端 CORS）
interface NvidiaModelItem {
  id?: string;
}

interface NvidiaModelsResponse {
  data?: NvidiaModelItem[];
}

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
    const data = (await resp.json()) as NvidiaModelsResponse;
    const models = (data.data || [])
      .map((m) => m.id)
      .filter((id): id is string => typeof id === 'string');
    res.json({ success: true, models });
  } catch (e) {
    res.status(500).json({ success: false, error: e instanceof Error ? e.message : 'Failed to fetch models' });
  }
});

// 静态文件服务：web 前端构建产物
const possiblePublicPaths = [
  path.join(__dirname, '../public'), // dist/../public (production)
  path.join(__dirname, '../../public'), // dist/src/../../public (alt)
  path.join(__dirname, 'public'), // dev fallback
  path.join(process.cwd(), 'apps/server/public'),
  path.join(process.cwd(), 'public'),
];

let publicPath: string | null = null;
for (const p of possiblePublicPaths) {
  const indexHtml = path.join(p, 'index.html');
  if (fs.existsSync(indexHtml)) {
    publicPath = p;
    console.log(`[static] serving from ${p}`);
    break;
  }
}
if (!publicPath) {
  console.warn('[static] no public directory found, web UI will be unavailable');
  publicPath = possiblePublicPaths[0]; // 兜底
}

app.use(express.static(publicPath));

// SPA 路由回退：所有非 API 请求返回 index.html
app.get(/^(?!\/api).*/, (_req, res) => {
  const indexHtml = path.join(publicPath!, 'index.html');
  if (fs.existsSync(indexHtml)) {
    res.sendFile(indexHtml);
  } else {
    res
      .status(503)
      .type('html')
      .send(
        `<!doctype html><html><body style="background:#0a0a0f;color:#f0f0f5;font-family:sans-serif;padding:40px"><h1>灵伴 Web 端尚未构建</h1><p>请稍后重试，或检查 Render 构建日志。</p></body></html>`
      );
  }
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
