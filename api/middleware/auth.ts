import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

export interface AuthedRequest extends Request {
  userId?: number;
}

export async function authMiddleware(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      res.status(401).json({ error: '未登录' });
      return;
    }

    const token = header.slice(7);
    const user = await prisma.user.findUnique({ where: { token } });

    if (!user) {
      res.status(401).json({ error: '用户不存在，请重新登录' });
      return;
    }

    req.userId = user.id;
    next();
  } catch (err) {
    next(err);
  }
}
