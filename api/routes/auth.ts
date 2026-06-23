import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// 匿名登录：首次访问创建用户，返回 token
router.post('/anonymous', async (_req, res, next) => {
  try {
    const token = randomUUID();
    const user = await prisma.user.create({
      data: {
        token,
        nickname: `旅人${Math.floor(Math.random() * 10000)}`,
      },
    });
    res.json({ token, user });
  } catch (err) {
    next(err);
  }
});

// 获取当前用户
router.get('/me', authMiddleware, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId! } });
    if (!user) {
      res.status(404).json({ error: '用户不存在' });
      return;
    }
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

// 更新用户资料
router.patch('/me', authMiddleware, async (req, res, next) => {
  try {
    const { nickname, avatar, persona, theme } = req.body;
    const user = await prisma.user.update({
      where: { id: req.userId! },
      data: {
        ...(nickname !== undefined && { nickname }),
        ...(avatar !== undefined && { avatar }),
        ...(persona !== undefined && { persona }),
        ...(theme !== undefined && { theme }),
      },
    });
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

export default router;
