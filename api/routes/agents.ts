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
    modelProvider,
    modelName,
    temperature,
    maxTokens,
    apiKey,
  } = req.body;

  const agent = await prisma.agent.create({
    data: {
      userId: req.user!.id,
      name,
      avatar: avatar ?? null,
      persona: persona ?? '',
      modelProvider: modelProvider ?? 'openai',
      modelName: modelName ?? 'gpt-4o-mini',
      temperature: temperature ?? 0.7,
      maxTokens: maxTokens ?? 4096,
      apiKey: apiKey ?? '',
    },
  });

  res.status(201).json({ agent });
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

  const agent = await prisma.agent.update({
    where: { id },
    data: req.body,
  });

  res.json({ agent });
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

  await prisma.agent.delete({ where: { id } });
  res.json({ success: true });
});
