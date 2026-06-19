import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import authRoutes from './routes/auth.js'
import agentRoutes from './routes/agents.js'
import chatRoutes from './routes/chat.js'
import uploadRoutes from './routes/upload.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const app: express.Application = express()
const isProduction = process.env.NODE_ENV === 'production'

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// 静态文件服务 (上传的图片)
app.use('/uploads', express.static(path.join(__dirname, '..', 'public', 'uploads')))

// API 路由
app.use('/api/auth', authRoutes)
app.use('/api/agents', agentRoutes)
app.use('/api/chat', chatRoutes)
app.use('/api/upload', uploadRoutes)

// 健康检查
app.get('/api/health', (_req: Request, res: Response): void => {
  res.status(200).json({ success: true, message: 'ok' })
})

// 生产环境: 服务前端静态文件
if (isProduction) {
  const distPath = path.join(__dirname, '..', 'dist')
  app.use(express.static(distPath))
  // SPA 回退: 所有非 API 路由返回 index.html
  app.use((req: Request, res: Response, next: NextFunction): void => {
    if (req.path.startsWith('/api')) {
      next()
      return
    }
    res.sendFile(path.join(distPath, 'index.html'))
  })
}

// API 404 (放在所有路由之后)
app.use('/api', (_req: Request, res: Response): void => {
  res.status(404).json({ success: false, error: 'API 不存在' })
})

// 错误处理
app.use((error: Error, _req: Request, res: Response, _next: NextFunction): void => {
  console.error('服务器错误:', error)
  res.status(500).json({ success: false, error: '服务器内部错误' })
})

export default app
