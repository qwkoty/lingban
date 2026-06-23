import { NextRequest } from 'next/server';
import { authenticate } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { buildSystemPrompt, streamChat, type LLMMessage } from '@/lib/llm';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  const { user, error } = await authenticate(request);
  if (error) {
    return new Response(JSON.stringify({ error }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { agentId } = await params;

  const agent = await prisma.agent.findFirst({
    where: { id: agentId, userId: user!.id },
  });

  if (!agent) {
    return new Response(JSON.stringify({ error: '智能体不存在' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 找到最后一条用户消息和对应的 assistant 消息
  const lastMessages = await prisma.chatMessage.findMany({
    where: { agentId, userId: user!.id },
    orderBy: { createdAt: 'desc' },
    take: 2,
  });

  // 删除最后一条 assistant 消息
  if (lastMessages.length > 0 && lastMessages[0].role === 'assistant') {
    await prisma.chatMessage.delete({ where: { id: lastMessages[0].id } });
  }

  // 获取历史消息
  const historyMessages = await prisma.chatMessage.findMany({
    where: { agentId, userId: user!.id },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  const messages: LLMMessage[] = [
    {
      role: 'system',
      content: buildSystemPrompt(agent, user!.persona),
    },
    ...historyMessages
      .reverse()
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
  ];

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let fullContent = '';

      try {
        fullContent = await streamChat({
          agent,
          messages,
          onChunk: (chunk) => {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`));
          },
        });

        await prisma.chatMessage.create({
          data: {
            agentId,
            userId: user!.id,
            role: 'assistant',
            content: fullContent,
          },
        });

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done', content: fullContent })}\n\n`));
      } catch (err) {
        const message = err instanceof Error ? err.message : '未知错误';
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', error: message })}\n\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
