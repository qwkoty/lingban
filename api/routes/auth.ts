import { Router } from 'express';
import crypto from 'node:crypto';
import { prisma } from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';
import type { User } from '../../src/generated/prisma/client.js';

export const authRouter = Router();

function serializeUser(user: User) {
  return {
    id: user.id,
    nickname: user.nickname,
    avatar: user.avatar,
    persona: user.persona,
    theme: user.theme,
    memorySnapshot: user.memorySnapshot,
    createdAt: user.createdAt.toISOString(),
  };
}

authRouter.post('/anonymous', async (_req, res) => {
  try {
    const count = await prisma.user.count();
    const user = await prisma.user.create({
      data: {
        token: crypto.randomUUID(),
        nickname: `用户${count + 1}`,
      },
    });

    res.json({ token: user.token, user: serializeUser(user) });
  } catch (error) {
    console.error('Anonymous login error:', error);
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({
      error: '创建用户失败',
      detail: process.env.NODE_ENV === 'production' ? message : message,
    });
  }
});

authRouter.get('/me', authMiddleware, async (req, res) => {
  res.json({ user: serializeUser(req.user!) });
});

authRouter.patch('/me', authMiddleware, async (req, res) => {
  const { nickname, avatar, persona, theme, memorySnapshot } = req.body;

  try {
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        ...(nickname !== undefined && { nickname }),
        ...(avatar !== undefined && { avatar }),
        ...(persona !== undefined && { persona }),
        ...(theme !== undefined && { theme }),
        ...(memorySnapshot !== undefined && { memorySnapshot }),
      },
    });

    res.json({ user: serializeUser(user) });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: '更新用户失败' });
  }
});
