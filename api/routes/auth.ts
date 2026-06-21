import { Router } from 'express';
import crypto from 'node:crypto';
import { prisma } from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';
import type { User } from '@prisma/client';

export const authRouter = Router();

function serializeUser(user: User) {
  return {
    id: user.id,
    nickname: user.nickname,
    avatar: user.avatar,
    persona: user.persona,
    theme: user.theme,
    createdAt: user.createdAt.toISOString(),
  };
}

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
    user: serializeUser(user),
  });
});

authRouter.get('/me', authMiddleware, async (req, res) => {
  res.json({ user: serializeUser(req.user!) });
});

authRouter.patch('/me', authMiddleware, async (req, res) => {
  const { nickname, avatar, persona, theme } = req.body;
  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data: {
      ...(nickname !== undefined && { nickname }),
      ...(avatar !== undefined && { avatar }),
      ...(persona !== undefined && { persona }),
      ...(theme !== undefined && { theme }),
    },
  });

  res.json({ user: serializeUser(user) });
});
