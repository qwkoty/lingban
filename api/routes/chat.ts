import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { streamChat, buildSystemPrompt, type LLMMessage } from '../lib/llm';
import type { Agent, ChatMessage } from '../../src/generated/prisma/client';

const router = Router();

router.use(authMiddleware);

// 最近会话列表：按最后互动时间排序的智能体 + 最后一条消息
router.get('/sessions', async (req, res, next) => {
  try {
    const agents = await prisma.agent.findMany({
      where: { userId: req.userId! },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    const sessions = agents.map((agent: Agent & { messages: ChatMessage[] }) => ({
      id: agent.id,
      name: agent.name,
      avatar: agent.avatar,
      updatedAt: agent.updatedAt,
      lastMessage: agent.messages[0]?.content || agent.greeting || '',
    }));

    res.json({ sessions });
  } catch (err) {
    next(err);
  }
});

// 某智能体的历史消息
router.get('/sessions/:agentId', async (req, res, next) => {
  try {
    const agentId = Number(req.params.agentId);
    const agent = await prisma.agent.findFirst({
      where: { id: agentId, userId: req.userId! },
    });
    if (!agent) {
      res.status(404).json({ error: '智能体不存在' });
      return;
    }

    const messages = await prisma.chatMessage.findMany({
      where: { agentId },
      orderBy: { createdAt: 'asc' },
    });

    res.json({ agent, messages });
  } catch (err) {
    next(err);
  }
});

// 流式发送消息
router.post('/:agentId', async (req, res, next) => {
  try {
    const agentId = Number(req.params.agentId);
    const { message } = req.body as { message?: string };

    const agent = await prisma.agent.findFirst({
      where: { id: agentId, userId: req.userId! },
    });
    if (!agent) {
      res.status(404).json({ error: '智能体不存在' });
      return;
    }

    if (!message || !message.trim()) {
      res.status(400).json({ error: '消息不能为空' });
      return;
    }

    // 保存用户消息
    await prisma.chatMessage.create({
      data: {
        agentId,
        userId: req.userId!,
        role: 'user',
        content: message.trim(),
      },
    });

    // 获取历史消息
    const history = await prisma.chatMessage.findMany({
      where: { agentId },
      orderBy: { createdAt: 'asc' },
      take: 20,
    });

    // 获取用户人设
    const user = await prisma.user.findUnique({ where: { id: req.userId! } });

    // 构建消息列表
    const systemPrompt = buildSystemPrompt(agent, user?.persona || '');
    const llmMessages: LLMMessage[] = [
      { role: 'system', content: systemPrompt },
      ...history.map((m: ChatMessage) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ];

    // 设置 SSE 响应头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    let fullText = '';

    try {
      fullText = await streamChat({
        agent,
        messages: llmMessages,
        onChunk: (chunk) => {
          res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`);
        },
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '生成回复失败';
      res.write(`data: ${JSON.stringify({ type: 'error', error: errorMessage })}\n\n`);
      res.end();
      return;
    }

    // 保存 assistant 回复
    if (fullText.trim()) {
      const saved = await prisma.chatMessage.create({
        data: {
          agentId,
          userId: req.userId!,
          role: 'assistant',
          content: fullText,
        },
      });
      res.write(`data: ${JSON.stringify({ type: 'done', messageId: saved.id, content: fullText })}\n\n`);
    } else {
      res.write(`data: ${JSON.stringify({ type: 'done', content: '' })}\n\n`);
    }

    res.end();
  } catch (err) {
    next(err);
  }
});

// 清空某智能体的历史消息
router.delete('/:agentId', async (req, res, next) => {
  try {
    const agentId = Number(req.params.agentId);
    const agent = await prisma.agent.findFirst({
      where: { id: agentId, userId: req.userId! },
    });
    if (!agent) {
      res.status(404).json({ error: '智能体不存在' });
      return;
    }

    await prisma.chatMessage.deleteMany({ where: { agentId } });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
