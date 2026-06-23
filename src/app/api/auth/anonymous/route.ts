import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateToken } from '@/lib/utils';

export async function POST() {
  const token = generateToken();
  const nickname = '匿名用户' + Math.floor(Math.random() * 10000);

  const user = await prisma.user.create({
    data: {
      token,
      nickname,
    },
    select: {
      id: true,
      token: true,
      nickname: true,
      avatar: true,
      persona: true,
      theme: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ user, token });
}
