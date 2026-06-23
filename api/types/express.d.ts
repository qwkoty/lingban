import type { AuthedRequest } from '../middleware/auth';

declare global {
  namespace Express {
    interface Request {
      userId?: number;
    }
  }
}

export type { AuthedRequest };
