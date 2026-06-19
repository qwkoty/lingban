import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const token = header.slice(7);
  const user = await prisma.user.findUnique({ where: { token } });
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  req.user = user;
  next();
};
