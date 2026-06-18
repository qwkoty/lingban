import { Router, type Request, type Response } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const router = Router()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const uploadDir = path.join(__dirname, '..', '..', 'public', 'uploads')

// 确保上传目录存在
function ensureUploadDir() {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true })
  }
}

// 上传头像 (base64 方式)
router.post('/avatar', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { image } = req.body
    if (!image || !image.startsWith('data:image/')) {
      res.status(400).json({ success: false, error: '无效的图片数据' })
      return
    }

    // 解析 base64
    const matches = image.match(/^data:image\/(\w+);base64,(.+)$/)
    if (!matches) {
      res.status(400).json({ success: false, error: '图片格式错误' })
      return
    }

    const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1]
    const base64Data = matches[2]
    const buffer = Buffer.from(base64Data, 'base64')

    // 限制大小 5MB
    if (buffer.length > 5 * 1024 * 1024) {
      res.status(400).json({ success: false, error: '图片大小不能超过 5MB' })
      return
    }

    ensureUploadDir()
    const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}.${ext}`
    const filepath = path.join(uploadDir, filename)
    fs.writeFileSync(filepath, buffer)

    res.json({ url: `/uploads/${filename}` })
  } catch (error) {
    console.error('上传失败:', error)
    res.status(500).json({ success: false, error: '上传失败' })
  }
})

export default router
