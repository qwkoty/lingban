import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

export interface AuthRequest extends Request {
  user?: { id: bigint; deviceId: string; token: string };
}

export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Missing or invalid authorization header' });
    return;
  }

  const token = authHeader.slice(7);

  try {
    const user = await prisma.user.findUnique({ where: { token } });
    if (!user) {
      res.status(401).json({ success: false, error: 'Invalid token' });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
