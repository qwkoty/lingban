import { Router, type Request, type Response } from 'express'
import prisma from '../lib/prisma.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

// 获取当前用户的所有智能体
router.get('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const agents = await prisma.agent.findMany({
      where: { userId: req.userId! },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ agents })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取智能体失败' })
  }
})

// 获取单个智能体
router.get('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const agent = await prisma.agent.findFirst({
      where: { id: Number(req.params.id), userId: req.userId! },
    })
    if (!agent) {
      res.status(404).json({ success: false, error: '智能体不存在' })
      return
    }
    res.json({ agent })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

// 创建智能体
router.post('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, avatar, persona, modelProvider, apiBaseUrl, modelName, temperature, maxTokens, apiKey } = req.body
    if (!name || !name.trim()) {
      res.status(400).json({ success: false, error: '名称不能为空' })
      return
    }
    const agent = await prisma.agent.create({
      data: {
        userId: req.userId!,
        name: name.trim(),
        avatar: avatar || null,
        persona: persona || '',
        modelProvider: modelProvider || 'openai',
        apiBaseUrl: apiBaseUrl || 'https://api.openai.com/v1',
        modelName: modelName || 'gpt-4o-mini',
        temperature: temperature !== undefined ? Number(temperature) : 0.7,
        maxTokens: maxTokens !== undefined ? Number(maxTokens) : 4096,
        apiKey: apiKey || '',
      },
    })
    res.json({ agent })
  } catch (error) {
    console.error('创建智能体失败:', error)
    res.status(500).json({ success: false, error: '创建失败' })
  }
})

// 更新智能体
router.patch('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const existing = await prisma.agent.findFirst({
      where: { id: Number(req.params.id), userId: req.userId! },
    })
    if (!existing) {
      res.status(404).json({ success: false, error: '智能体不存在' })
      return
    }
    const { name, avatar, persona, modelProvider, apiBaseUrl, modelName, temperature, maxTokens, apiKey } = req.body
    const agent = await prisma.agent.update({
      where: { id: existing.id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(avatar !== undefined && { avatar }),
        ...(persona !== undefined && { persona }),
        ...(modelProvider !== undefined && { modelProvider }),
        ...(apiBaseUrl !== undefined && { apiBaseUrl }),
        ...(modelName !== undefined && { modelName }),
        ...(temperature !== undefined && { temperature: Number(temperature) }),
        ...(maxTokens !== undefined && { maxTokens: Number(maxTokens) }),
        ...(apiKey !== undefined && { apiKey }),
      },
    })
    res.json({ agent })
  } catch (error) {
    res.status(500).json({ success: false, error: '更新失败' })
  }
})

// 删除智能体
router.delete('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const existing = await prisma.agent.findFirst({
      where: { id: Number(req.params.id), userId: req.userId! },
    })
    if (!existing) {
      res.status(404).json({ success: false, error: '智能体不存在' })
      return
    }
    await prisma.agent.delete({ where: { id: existing.id } })
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ success: false, error: '删除失败' })
  }
})

export default router
