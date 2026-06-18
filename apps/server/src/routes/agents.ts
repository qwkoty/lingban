import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { chatWithLLM } from '../services/llm';
import { decryptApiKey, encryptApiKey, getEncryptionSecret } from '../lib/crypto';

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

type AgentResponse = Omit<
  Awaited<ReturnType<typeof prisma.agent.findFirst>>,
  'apiKey'
>;

// 递归处理 Prisma 返回的 BigInt 与 Date，使其可安全 JSON 序列化
function serializeResponse<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (obj instanceof Date) return obj.toISOString() as unknown as T;
  if (typeof obj === 'bigint') return Number(obj) as unknown as T;
  if (Array.isArray(obj)) return obj.map(serializeResponse) as unknown as T;
  if (typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, serializeResponse(v)])
    ) as unknown as T;
  }
  return obj;
}

function stripApiKey<T extends { apiKey?: string | null }>(agent: T | null): Omit<T, 'apiKey'> | null {
  if (!agent) return null;
  const { apiKey: _unused, ...rest } = agent;
  void _unused;
  return rest as Omit<T, 'apiKey'>;
}

// 安全解析 BigInt，无效时返回 null
function parseBigInt(s: string): bigint | null {
  try {
    return BigInt(s);
  } catch {
    return null;
  }
}

function requireUser(req: AuthRequest, res: ResponseForAuth): bigint | null {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return null;
  }
  return req.user.id;
}

type ResponseForAuth = import('express').Response;

router.use(authMiddleware);

router.post('/', async (req: AuthRequest, res) => {
  const userId = requireUser(req, res);
  if (userId === null) return;

  const parse = agentSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ success: false, error: parse.error.message });
    return;
  }

  try {
    const secret = getEncryptionSecret();
    const encryptedKey = encryptApiKey(parse.data.apiKey, secret);
    const agent = await prisma.agent.create({
      data: { ...parse.data, apiKey: encryptedKey, userId },
    });
    res.json({ success: true, agent: serializeResponse(stripApiKey(agent)) });
  } catch (error) {
    console.error('Create agent error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.get('/', async (req: AuthRequest, res) => {
  const userId = requireUser(req, res);
  if (userId === null) return;

  try {
    const agents = await prisma.agent.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json({
      success: true,
      agents: serializeResponse(agents.map(stripApiKey)),
    });
  } catch (error) {
    console.error('List agents error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.get('/:id', async (req: AuthRequest, res) => {
  const userId = requireUser(req, res);
  if (userId === null) return;

  const id = parseBigInt(req.params.id);
  if (id === null) {
    res.status(400).json({ success: false, error: 'Invalid agent id' });
    return;
  }

  try {
    const agent = await prisma.agent.findFirst({
      where: { id, userId },
    });
    if (!agent) {
      res.status(404).json({ success: false, error: 'Agent not found' });
      return;
    }
    res.json({ success: true, agent: serializeResponse(stripApiKey(agent)) });
  } catch (error) {
    console.error('Get agent error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.put('/:id', async (req: AuthRequest, res) => {
  const userId = requireUser(req, res);
  if (userId === null) return;

  const id = parseBigInt(req.params.id);
  if (id === null) {
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
      where: { id, userId },
    });
    if (!existing) {
      res.status(404).json({ success: false, error: 'Agent not found' });
      return;
    }

    const updateData = { ...parse.data, updatedAt: new Date() };
    if (updateData.apiKey) {
      const secret = getEncryptionSecret();
      updateData.apiKey = encryptApiKey(updateData.apiKey, secret);
    }

    const agent = await prisma.agent.update({
      where: { id },
      data: updateData,
    });
    res.json({ success: true, agent: serializeResponse(stripApiKey(agent)) });
  } catch (error) {
    console.error('Update agent error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.delete('/:id', async (req: AuthRequest, res) => {
  const userId = requireUser(req, res);
  if (userId === null) return;

  const id = parseBigInt(req.params.id);
  if (id === null) {
    res.status(400).json({ success: false, error: 'Invalid agent id' });
    return;
  }

  try {
    const existing = await prisma.agent.findFirst({
      where: { id, userId },
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
  const userId = requireUser(req, res);
  if (userId === null) return;

  const id = parseBigInt(req.params.id);
  if (id === null) {
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
      where: { id, userId },
    });
    if (!agent) {
      res.status(404).json({ success: false, error: 'Agent not found' });
      return;
    }

    if (!agent.apiKey) {
      res.status(400).json({ success: false, error: 'Agent missing API key' });
      return;
    }

    const secret = getEncryptionSecret();
    const decryptedApiKey = decryptApiKey(agent.apiKey, secret);

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
      apiKey: decryptedApiKey,
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
  const userId = requireUser(req, res);
  if (userId === null) return;

  const id = parseBigInt(req.params.id);
  const sessionId = (req.query.sessionId as string) || 'default';

  if (id === null) {
    res.status(400).json({ success: false, error: 'Invalid agent id' });
    return;
  }

  try {
    const agent = await prisma.agent.findFirst({
      where: { id, userId },
    });
    if (!agent) {
      res.status(404).json({ success: false, error: 'Agent not found' });
      return;
    }

    const conversations = await prisma.conversation.findMany({
      where: { agentId: agent.id, sessionId },
      orderBy: { createdAt: 'asc' },
    });

    res.json({ success: true, conversations: serializeResponse(conversations) });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
