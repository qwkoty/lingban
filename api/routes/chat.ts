import { Router, type Request, type Response } from 'express'
import prisma from '../lib/prisma.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

// 获取用户的对话会话列表(按智能体分组)
router.get('/sessions', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const agents = await prisma.agent.findMany({
      where: { userId: req.userId! },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
    })
    const sessions = agents
      .filter((a) => a.messages.length > 0)
      .map((a) => ({
        agentId: a.id,
        agentName: a.name,
        agentAvatar: a.avatar,
        lastMessage: a.messages[0]?.content || '',
        lastMessageAt: a.messages[0]?.createdAt || a.updatedAt,
      }))
    res.json({ sessions })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取会话失败' })
  }
})

// 获取与某智能体的对话历史
router.get('/sessions/:agentId', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const agentId = Number(req.params.agentId)
    const agent = await prisma.agent.findFirst({
      where: { id: agentId, userId: req.userId! },
    })
    if (!agent) {
      res.status(404).json({ success: false, error: '智能体不存在' })
      return
    }
    const messages = await prisma.chatMessage.findMany({
      where: { agentId, userId: req.userId! },
      orderBy: { createdAt: 'asc' },
    })
    res.json({
      agent: {
        id: agent.id,
        name: agent.name,
        avatar: agent.avatar,
        persona: agent.persona,
      },
      messages,
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取消息失败' })
  }
})

// 发送消息并获取流式回复 (SSE)
router.post('/:agentId', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const agentId = Number(req.params.agentId)
    const { message } = req.body

    if (!message || !message.trim()) {
      res.status(400).json({ success: false, error: '消息不能为空' })
      return
    }

    const agent = await prisma.agent.findFirst({
      where: { id: agentId, userId: req.userId! },
    })
    if (!agent) {
      res.status(404).json({ success: false, error: '智能体不存在' })
      return
    }

    // 保存用户消息
    await prisma.chatMessage.create({
      data: {
        agentId,
        userId: req.userId!,
        role: 'user',
        content: message.trim(),
      },
    })

    // 获取历史消息(最近 20 条)
    const history = await prisma.chatMessage.findMany({
      where: { agentId, userId: req.userId! },
      orderBy: { createdAt: 'asc' },
      take: 20,
    })

    // 构建 LLM 请求消息
    const messages = []
    if (agent.persona) {
      messages.push({ role: 'system', content: agent.persona })
    }
    for (const msg of history) {
      messages.push({ role: msg.role, content: msg.content })
    }

    // 设置 SSE
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')

    // 调用 LLM API (OpenAI 兼容格式)
    const baseUrl = agent.apiBaseUrl.replace(/\/$/, '')
    const llmResponse = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${agent.apiKey}`,
      },
      body: JSON.stringify({
        model: agent.modelName,
        messages,
        temperature: agent.temperature,
        max_tokens: agent.maxTokens,
        stream: true,
      }),
    })

    if (!llmResponse.ok) {
      const errText = await llmResponse.text()
      res.write(`data: ${JSON.stringify({ error: `LLM API 错误: ${llmResponse.status} ${errText}` })}\n\n`)
      res.end()
      return
    }

    if (!llmResponse.body) {
      res.write(`data: ${JSON.stringify({ error: 'LLM API 无响应体' })}\n\n`)
      res.end()
      return
    }

    // 流式读取并转发
    const reader = llmResponse.body.getReader()
    const decoder = new TextDecoder()
    let fullContent = ''
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || !trimmed.startsWith('data: ')) continue
        const data = trimmed.slice(6)
        if (data === '[DONE]') continue

        try {
          const parsed = JSON.parse(data)
          const delta = parsed.choices?.[0]?.delta?.content
          if (delta) {
            fullContent += delta
            res.write(`data: ${JSON.stringify({ content: delta })}\n\n`)
          }
        } catch {
          // 忽略解析错误
        }
      }
    }

    // 保存助手回复
    if (fullContent) {
      await prisma.chatMessage.create({
        data: {
          agentId,
          userId: req.userId!,
          role: 'assistant',
          content: fullContent,
        },
      })
    }

    res.write('data: [DONE]\n\n')
    res.end()
  } catch (error) {
    console.error('对话失败:', error)
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: '对话失败' })
    } else {
      res.write(`data: ${JSON.stringify({ error: '服务器错误' })}\n\n`)
      res.end()
    }
  }
})

export default router
