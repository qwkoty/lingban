import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { chatWithLLM } from '../services/llm';

const router = Router();

const agentSchema = z.object({
  name: z.string().min(1).max(64),
  provider: z.enum(['deepseek', 'nvidia', 'qwen', 'custom']),
  model: z.string().min(1).max(128),
  apiKey: z.string().min(1).max(512),
  apiUrl: z.string().max(512).optional(),
  systemPrompt: z.string().max(8000).optional(),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().int().min(1).max(32000).default(2048),
  avatarUrl: z.string().max(512).optional(),
});

const chatSchema = z.object({
  message: z.string().min(1).max(4000),
  sessionId: z.string().max(64).default('default'),
});

router.use(authMiddleware);

router.post('/', async (req: AuthRequest, res) => {
  const parse = agentSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ success: false, error: parse.error.message });
    return;
  }

  try {
    const agent = await prisma.agent.create({
      data: { ...parse.data, userId: req.user!.id },
    });
    res.json({ success: true, agent });
  } catch (error) {
    console.error('Create agent error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.get('/', async (req: AuthRequest, res) => {
  try {
    const agents = await prisma.agent.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, agents });
  } catch (error) {
    console.error('List agents error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.get('/:id', async (req: AuthRequest, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ success: false, error: 'Invalid agent id' });
    return;
  }

  try {
    const agent = await prisma.agent.findFirst({
      where: { id, userId: req.user!.id },
    });
    if (!agent) {
      res.status(404).json({ success: false, error: 'Agent not found' });
      return;
    }
    res.json({ success: true, agent });
  } catch (error) {
    console.error('Get agent error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.put('/:id', async (req: AuthRequest, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ success: false, error: 'Invalid agent id' });
    return;
  }

  const parse = agentSchema.partial().safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ success: false, error: parse.error.message });
    return;
  }

  try {
    const existing = await prisma.agent.findFirst({
      where: { id, userId: req.user!.id },
    });
    if (!existing) {
      res.status(404).json({ success: false, error: 'Agent not found' });
      return;
    }

    const agent = await prisma.agent.update({
      where: { id },
      data: { ...parse.data, updatedAt: new Date() },
    });
    res.json({ success: true, agent });
  } catch (error) {
    console.error('Update agent error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.delete('/:id', async (req: AuthRequest, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ success: false, error: 'Invalid agent id' });
    return;
  }

  try {
    const existing = await prisma.agent.findFirst({
      where: { id, userId: req.user!.id },
    });
    if (!existing) {
      res.status(404).json({ success: false, error: 'Agent not found' });
      return;
    }

    await prisma.agent.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete agent error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.post('/:id/chat', async (req: AuthRequest, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ success: false, error: 'Invalid agent id' });
    return;
  }

  const parse = chatSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ success: false, error: parse.error.message });
    return;
  }

  const { message, sessionId } = parse.data;

  try {
    const agent = await prisma.agent.findFirst({
      where: { id, userId: req.user!.id },
    });
    if (!agent) {
      res.status(404).json({ success: false, error: 'Agent not found' });
      return;
    }

    if (!agent.apiKey) {
      res.status(400).json({ success: false, error: 'Agent missing API key' });
      return;
    }

    const history = await prisma.conversation.findMany({
      where: { agentId: agent.id, sessionId },
      orderBy: { createdAt: 'asc' },
      take: 20,
    });

    const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [];
    if (agent.systemPrompt) {
      messages.push({ role: 'system', content: agent.systemPrompt });
    }
    for (const h of history) {
      messages.push({ role: h.role as 'user' | 'assistant', content: h.content });
    }
    messages.push({ role: 'user', content: message });

    await prisma.conversation.create({
      data: { agentId: agent.id, sessionId, role: 'user', content: message },
    });

    const result = await chatWithLLM({
      provider: agent.provider,
      model: agent.model,
      apiKey: agent.apiKey,
      apiUrl: agent.apiUrl,
      messages,
      temperature: agent.temperature,
      maxTokens: agent.maxTokens,
    });

    await prisma.conversation.create({
      data: { agentId: agent.id, sessionId, role: 'assistant', content: result.reply },
    });

    res.json({ success: true, reply: result.reply, usage: result.usage });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Chat failed',
    });
  }
});

router.get('/:id/conversations', async (req: AuthRequest, res) => {
  const id = parseInt(req.params.id, 10);
  const sessionId = (req.query.sessionId as string) || 'default';

  if (isNaN(id)) {
    res.status(400).json({ success: false, error: 'Invalid agent id' });
    return;
  }

  try {
    const agent = await prisma.agent.findFirst({
      where: { id, userId: req.user!.id },
    });
    if (!agent) {
      res.status(404).json({ success: false, error: 'Agent not found' });
      return;
    }

    const conversations = await prisma.conversation.findMany({
      where: { agentId: agent.id, sessionId },
      orderBy: { createdAt: 'asc' },
    });

    res.json({ success: true, conversations });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
