import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

// 智能体列表
router.get('/', async (req, res, next) => {
  try {
    const agents = await prisma.agent.findMany({
      where: { userId: req.userId! },
      orderBy: { updatedAt: 'desc' },
    });
    res.json({ agents });
  } catch (err) {
    next(err);
  }
});

// 单个智能体
router.get('/:id', async (req, res, next) => {
  try {
    const agent = await prisma.agent.findFirst({
      where: { id: Number(req.params.id), userId: req.userId! },
    });
    if (!agent) {
      res.status(404).json({ error: '智能体不存在' });
      return;
    }
    res.json({ agent });
  } catch (err) {
    next(err);
  }
});

// 创建智能体
router.post('/', async (req, res, next) => {
  try {
    const { name, avatar, persona, greeting, modelProvider, modelName, apiEndpoint, temperature, maxTokens, apiKey } = req.body;

    if (!name || !name.trim()) {
      res.status(400).json({ error: '请填写智能体名称' });
      return;
    }

    const agent = await prisma.agent.create({
      data: {
        userId: req.userId!,
        name: name.trim(),
        avatar: avatar || null,
        persona: persona || '',
        greeting: greeting || '',
        modelProvider: modelProvider || 'deepseek',
        modelName: modelName || 'deepseek-chat',
        apiEndpoint: apiEndpoint || '',
        temperature: temperature ?? 0.7,
        maxTokens: maxTokens ?? 4096,
        apiKey: apiKey || '',
      },
    });
    res.json({ agent });
  } catch (err) {
    next(err);
  }
});

// 更新智能体
router.patch('/:id', async (req, res, next) => {
  try {
    const { name, avatar, persona, greeting, modelProvider, modelName, apiEndpoint, temperature, maxTokens, apiKey } = req.body;

    const existing = await prisma.agent.findFirst({
      where: { id: Number(req.params.id), userId: req.userId! },
    });
    if (!existing) {
      res.status(404).json({ error: '智能体不存在' });
      return;
    }

    const agent = await prisma.agent.update({
      where: { id: existing.id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(avatar !== undefined && { avatar }),
        ...(persona !== undefined && { persona }),
        ...(greeting !== undefined && { greeting }),
        ...(modelProvider !== undefined && { modelProvider }),
        ...(modelName !== undefined && { modelName }),
        ...(apiEndpoint !== undefined && { apiEndpoint }),
        ...(temperature !== undefined && { temperature }),
        ...(maxTokens !== undefined && { maxTokens }),
        ...(apiKey !== undefined && { apiKey }),
      },
    });
    res.json({ agent });
  } catch (err) {
    next(err);
  }
});

// 删除智能体
router.delete('/:id', async (req, res, next) => {
  try {
    const existing = await prisma.agent.findFirst({
      where: { id: Number(req.params.id), userId: req.userId! },
    });
    if (!existing) {
      res.status(404).json({ error: '智能体不存在' });
      return;
    }
    await prisma.agent.delete({ where: { id: existing.id } });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
