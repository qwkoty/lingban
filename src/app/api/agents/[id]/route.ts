import { NextRequest, NextResponse } from 'next/server';
import { authenticate, errorResponse } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await authenticate(request);
  if (error) return errorResponse(error, 401);

  const { id } = await params;

  const agent = await prisma.agent.findFirst({
    where: { id, userId: user!.id },
  });

  if (!agent) {
    return errorResponse('智能体不存在', 404);
  }

  return NextResponse.json(agent);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await authenticate(request);
  if (error) return errorResponse(error, 401);

  const { id } = await params;
  const body = await request.json();

  const existing = await prisma.agent.findFirst({
    where: { id, userId: user!.id },
  });

  if (!existing) {
    return errorResponse('智能体不存在', 404);
  }

  const {
    name,
    avatar,
    persona,
    greeting,
    modelProvider,
    modelName,
    apiEndpoint,
    temperature,
    maxTokens,
    apiKey,
  } = body;

  const agent = await prisma.agent.update({
    where: { id },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(avatar !== undefined && { avatar: avatar || null }),
      ...(persona !== undefined && { persona }),
      ...(greeting !== undefined && { greeting }),
      ...(modelProvider !== undefined && { modelProvider }),
      ...(modelName !== undefined && { modelName }),
      ...(apiEndpoint !== undefined && { apiEndpoint }),
      ...(temperature !== undefined && { temperature }),
      ...(maxTokens !== undefined && { maxTokens }),
      ...(apiKey !== undefined && { apiKey }),
    },
  });

  return NextResponse.json(agent);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await authenticate(request);
  if (error) return errorResponse(error, 401);

  const { id } = await params;

  const existing = await prisma.agent.findFirst({
    where: { id, userId: user!.id },
  });

  if (!existing) {
    return errorResponse('智能体不存在', 404);
  }

  await prisma.agent.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
