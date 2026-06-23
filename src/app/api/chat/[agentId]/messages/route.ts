import { NextRequest, NextResponse } from 'next/server';
import { authenticate, errorResponse } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  const { user, error } = await authenticate(request);
  if (error) return errorResponse(error, 401);

  const { agentId } = await params;

  const agent = await prisma.agent.findFirst({
    where: { id: agentId, userId: user!.id },
  });

  if (!agent) {
    return errorResponse('智能体不存在', 404);
  }

  const messages = await prisma.chatMessage.findMany({
    where: { agentId, userId: user!.id },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json(messages);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  const { user, error } = await authenticate(request);
  if (error) return errorResponse(error, 401);

  const { agentId } = await params;

  const agent = await prisma.agent.findFirst({
    where: { id: agentId, userId: user!.id },
  });

  if (!agent) {
    return errorResponse('智能体不存在', 404);
  }

  await prisma.chatMessage.deleteMany({
    where: { agentId, userId: user!.id },
  });

  return NextResponse.json({ success: true });
}
