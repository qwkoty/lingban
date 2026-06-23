import { prisma } from './prisma';
import type { NextRequest } from 'next/server';

export interface AuthResult {
  user: {
    id: string;
    token: string;
    nickname: string;
    avatar: string | null;
    persona: string;
    theme: string;
  } | null;
  error: string | null;
}

export async function authenticate(request: NextRequest): Promise<AuthResult> {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { user: null, error: '缺少认证令牌' };
  }

  const token = authHeader.slice(7);

  if (!token) {
    return { user: null, error: '认证令牌无效' };
  }

  const user = await prisma.user.findUnique({
    where: { token },
    select: {
      id: true,
      token: true,
      nickname: true,
      avatar: true,
      persona: true,
      theme: true,
    },
  });

  if (!user) {
    return { user: null, error: '用户不存在或令牌已失效' };
  }

  return { user, error: null };
}

export function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

export function errorResponse(message: string, status = 400) {
  return jsonResponse({ error: message }, status);
}
