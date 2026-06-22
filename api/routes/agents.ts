import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';

export const agentsRouter = Router();
agentsRouter.use(authMiddleware);

agentsRouter.get('/', async (req, res) => {
  const agents = await prisma.agent.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ agents });
});

agentsRouter.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const agent = await prisma.agent.findFirst({
    where: { id, userId: req.user!.id },
  });
  if (!agent) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.json({ agent });
});

agentsRouter.post('/', async (req, res) => {
  const {
    name,
    avatar,
    persona,
    greeting,
    modelProvider,
    modelName,
    apiEndpoint,
    temperature,
    maxTokens,
    apiKey,
  } = req.body;

  try {
    const agent = await prisma.agent.create({
      data: {
        userId: req.user!.id,
        name,
        avatar: avatar ?? null,
        persona: persona ?? '',
        greeting: greeting ?? '',
        modelProvider: modelProvider ?? 'deepseek',
        modelName: modelName ?? 'deepseek-chat',
        apiEndpoint: apiEndpoint ?? '',
        temperature: temperature ?? 0.7,
        maxTokens: maxTokens ?? 4096,
        apiKey: apiKey ?? '',
      },
    });

    res.status(201).json({ agent });
  } catch (error) {
    console.error('Create agent error:', error);
    res.status(500).json({ error: '创建智能体失败' });
  }
});

agentsRouter.patch('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const existing = await prisma.agent.findFirst({
    where: { id, userId: req.user!.id },
  });
  if (!existing) {
    res.status(404).json({ error: 'Not found' });
    return;
  }

  try {
    const agent = await prisma.agent.update({
      where: { id },
      data: req.body,
    });
    res.json({ agent });
  } catch (error) {
    console.error('Update agent error:', error);
    res.status(500).json({ error: '更新智能体失败' });
  }
});

agentsRouter.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const existing = await prisma.agent.findFirst({
    where: { id, userId: req.user!.id },
  });
  if (!existing) {
    res.status(404).json({ error: 'Not found' });
    return;
  }

  try {
    await prisma.agent.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete agent error:', error);
    res.status(500).json({ error: '删除智能体失败' });
  }
});
