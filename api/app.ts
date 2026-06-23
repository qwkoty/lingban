import express from 'express';
import cors from 'cors';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import authRoutes from './routes/auth';
import agentRoutes from './routes/agents';
import chatRoutes from './routes/chat';
import uploadRoutes from './routes/upload';

const app = express();

app.use(cors());
app.use(express.json());

// 静态资源：上传的文件
app.use('/uploads', express.static(join(process.cwd(), 'uploads')));

// 健康检查
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 业务路由
app.use('/api/auth', authRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/upload', uploadRoutes);

// 生产环境：托管前端构建产物
const distDir = join(process.cwd(), 'dist');
if (existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get('*', (_req, res) => {
    res.sendFile(join(distDir, 'index.html'));
  });
}

// 全局错误处理
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[error]', err.message);
  const status = (err as { status?: number }).status || 500;
  res.status(status).json({ error: err.message || '服务器内部错误' });
});

export default app;
