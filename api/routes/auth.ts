import { Router, type Request, type Response } from 'express'
import crypto from 'crypto'
import prisma from '../lib/prisma.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

// 匿名登录:创建新用户,返回 token
router.post('/anonymous', async (req: Request, res: Response): Promise<void> => {
  try {
    const token = crypto.randomBytes(32).toString('hex')
    const user = await prisma.user.create({
      data: {
        token,
        nickname: '',
      },
    })
    // 设置默认昵称
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { nickname: `用户${user.id}` },
    })
    res.json({
      token: updatedUser.token,
      user: {
        id: updatedUser.id,
        nickname: updatedUser.nickname,
        avatar: updatedUser.avatar,
        createdAt: updatedUser.createdAt,
      },
    })
  } catch (error) {
    console.error('匿名登录失败:', error)
    res.status(500).json({ success: false, error: '创建用户失败' })
  }
})

// 获取当前用户信息
router.get('/me', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId! } })
    if (!user) {
      res.status(404).json({ success: false, error: '用户不存在' })
      return
    }
    res.json({
      user: {
        id: user.id,
        nickname: user.nickname,
        avatar: user.avatar,
        createdAt: user.createdAt,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

// 更新用户信息
router.patch('/me', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { nickname, avatar } = req.body
    const user = await prisma.user.update({
      where: { id: req.userId! },
      data: {
        ...(nickname !== undefined && { nickname }),
        ...(avatar !== undefined && { avatar }),
      },
    })
    res.json({
      user: {
        id: user.id,
        nickname: user.nickname,
        avatar: user.avatar,
        createdAt: user.createdAt,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '更新失败' })
  }
})

export default router
