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
app.use('/api/health', (_req: Request, res: Response): void => {
  res.status(200).json({ success: true, message: 'ok' })
})

// 错误处理
app.use((error: Error, _req: Request, res: Response, _next: NextFunction): void => {
  console.error('服务器错误:', error)
  res.status(500).json({ success: false, error: '服务器内部错误' })
})

// 404
app.use((_req: Request, res: Response): void => {
  res.status(404).json({ success: false, error: 'API 不存在' })
})

export default app
