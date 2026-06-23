import { NextRequest, NextResponse } from 'next/server';
import { authenticate, errorResponse } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const { user, error } = await authenticate(request);
  if (error) return errorResponse(error, 401);

  const agents = await prisma.agent.findMany({
    where: { userId: user!.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      userId: true,
      name: true,
      avatar: true,
      persona: true,
      greeting: true,
      modelProvider: true,
      modelName: true,
      apiEndpoint: true,
      temperature: true,
      maxTokens: true,
      apiKey: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json(agents);
}

export async function POST(request: NextRequest) {
  const { user, error } = await authenticate(request);
  if (error) return errorResponse(error, 401);

  const body = await request.json();
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

  if (!name || !name.trim()) {
    return errorResponse('智能体名称不能为空');
  }

  const agent = await prisma.agent.create({
    data: {
      userId: user!.id,
      name: name.trim(),
      avatar: avatar || null,
      persona: persona || '',
      greeting: greeting || '',
      modelProvider: modelProvider || 'deepseek',
      modelName: modelName || 'deepseek-chat',
      apiEndpoint: apiEndpoint || '',
      temperature: temperature ?? 0.7,
      maxTokens: maxTokens ?? 4096,
      apiKey: apiKey || '',
    },
  });

  return NextResponse.json(agent);
}
