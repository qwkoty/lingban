import { NextRequest, NextResponse } from 'next/server';
import { authenticate, errorResponse } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const { user, error } = await authenticate(request);
  if (error) return errorResponse(error, 401);
  return NextResponse.json(user);
}

export async function PATCH(request: NextRequest) {
  const { user, error } = await authenticate(request);
  if (error) return errorResponse(error, 401);

  const body = await request.json();
  const { nickname, avatar, persona, theme } = body;

  const { prisma } = await import('@/lib/prisma');

  const updatedUser = await prisma.user.update({
    where: { id: user!.id },
    data: {
      ...(nickname !== undefined && { nickname }),
      ...(avatar !== undefined && { avatar }),
      ...(persona !== undefined && { persona }),
      ...(theme !== undefined && { theme }),
    },
    select: {
      id: true,
      token: true,
      nickname: true,
      avatar: true,
      persona: true,
      theme: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json(updatedUser);
}
