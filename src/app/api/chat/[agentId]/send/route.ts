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

  const body = await request.json();
  const { content } = body;

  if (!content || !content.trim()) {
    return new Response(JSON.stringify({ error: '消息内容不能为空' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 保存用户消息
  await prisma.chatMessage.create({
    data: {
      agentId,
      userId: user!.id,
      role: 'user',
      content: content.trim(),
    },
  });

  // 获取历史消息（最近 20 条）
  const historyMessages = await prisma.chatMessage.findMany({
    where: { agentId, userId: user!.id },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  // 构建消息列表（系统提示 + 历史 + 当前用户消息）
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

  // 创建 SSE 响应
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

        // 保存 AI 回复
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
