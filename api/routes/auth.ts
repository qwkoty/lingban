import { Router } from 'express';
import crypto from 'node:crypto';
import { prisma } from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';

export const authRouter = Router();

authRouter.post('/anonymous', async (_req, res) => {
  const count = await prisma.user.count();
  const id = count + 1;
  const token = crypto.randomUUID();

  const user = await prisma.user.create({
    data: {
      id,
      token,
      nickname: `用户${id}`,
    },
  });

  res.json({
    token: user.token,
    user: {
      id: user.id,
      nickname: user.nickname,
      avatar: user.avatar,
      createdAt: user.createdAt.toISOString(),
    },
  });
});

authRouter.get('/me', authMiddleware, async (req, res) => {
  const user = req.user!;
  res.json({
    user: {
      id: user.id,
      nickname: user.nickname,
      avatar: user.avatar,
      createdAt: user.createdAt.toISOString(),
    },
  });
});

authRouter.patch('/me', authMiddleware, async (req, res) => {
  const { nickname, avatar } = req.body;
  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data: {
      ...(nickname !== undefined && { nickname }),
      ...(avatar !== undefined && { avatar }),
    },
  });

  res.json({
    user: {
      id: user.id,
      nickname: user.nickname,
      avatar: user.avatar,
      createdAt: user.createdAt.toISOString(),
    },
  });
});
