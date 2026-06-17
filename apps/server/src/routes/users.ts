import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

const createAnonymousSchema = z.object({
  deviceId: z.string().min(1).max(128),
});

router.post('/anonymous', async (req, res) => {
  const parse = createAnonymousSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ success: false, error: 'Invalid deviceId' });
    return;
  }

  const { deviceId } = parse.data;

  try {
    let user = await prisma.user.findUnique({ where: { deviceId } });

    if (!user) {
      user = await prisma.user.create({ data: { deviceId } });
    }

    res.json({
      success: true,
      user: { id: user.id, deviceId: user.deviceId, token: user.token },
    });
  } catch (error) {
    console.error('Create anonymous user error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.get('/me', authMiddleware, async (req: AuthRequest, res) => {
  res.json({
    success: true,
    user: { id: req.user!.id, deviceId: req.user!.deviceId },
  });
});

export default router;
