import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';

export const chatRouter = Router();

chatRouter.use(authMiddleware);

chatRouter.get('/sessions', async (req, res) => {
  const messages = await prisma.chatMessage.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: 'desc' },
    distinct: ['agentId'],
    include: { agent: true },
  });

  const sessions = messages.map((m) => ({
    agentId: m.agentId,
    agent: m.agent,
    lastMessageAt: m.createdAt.toISOString(),
  }));

  res.json({ sessions });
});

chatRouter.get('/sessions/:agentId', async (req, res) => {
  const agentId = Number(req.params.agentId);
  const messages = await prisma.chatMessage.findMany({
    where: { agentId, userId: req.user!.id },
    orderBy: { createdAt: 'asc' },
  });
  res.json({ messages });
});

chatRouter.post('/:agentId', async (req, res) => {
  const agentId = Number(req.params.agentId);
  const { message } = req.body;

  const agent = await prisma.agent.findFirst({
    where: { id: agentId, userId: req.user!.id },
  });
  if (!agent) {
    res.status(404).json({ error: 'Not found' });
    return;
  }

  await prisma.chatMessage.create({
    data: {
      agentId,
      userId: req.user!.id,
      role: 'user',
      content: message,
    },
  });

  const history = await prisma.chatMessage.findMany({
    where: { agentId, userId: req.user!.id },
    orderBy: { createdAt: 'asc' },
  });

  const messagesPayload = history.map((m) => ({
    role: m.role as 'system' | 'user' | 'assistant',
    content: m.content,
  }));

  if (agent.persona) {
    messagesPayload.unshift({ role: 'system', content: agent.persona });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  if (!agent.apiKey) {
    res.write(`data: ${JSON.stringify({ error: '该智能体未配置 API Key' })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
    return;
  }

  try {
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${agent.apiKey}`,
      },
      body: JSON.stringify({
        model: agent.modelName,
        messages: messagesPayload,
        temperature: agent.temperature,
        max_tokens: agent.maxTokens,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      res.write(`data: ${JSON.stringify({ error: `LLM 请求失败: ${response.status}` })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
      console.error('LLM error:', errorText);
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      res.write(`data: ${JSON.stringify({ error: '无法读取流响应' })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
      return;
    }

    let fullContent = '';
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;

        const data = trimmed.slice(5).trim();
        if (data === '[DONE]') continue;

        try {
          const parsed = JSON.parse(data);
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) {
            fullContent += delta;
            res.write(`data: ${JSON.stringify({ content: delta })}\n\n`);
          }
        } catch {
          // ignore malformed JSON
        }
      }
    }

    await prisma.chatMessage.create({
      data: {
        agentId,
        userId: req.user!.id,
        role: 'assistant',
        content: fullContent,
      },
    });

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('Chat error:', error);
    res.write(`data: ${JSON.stringify({ error: '对话请求失败' })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  }
});
