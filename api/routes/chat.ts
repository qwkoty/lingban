import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';

export const chatRouter = Router();
chatRouter.use(authMiddleware);

function getModelEndpoint(provider: string, customEndpoint: string) {
  switch (provider) {
    case 'openai':
      return 'https://api.openai.com/v1/chat/completions';
    case 'deepseek':
      return 'https://api.deepseek.com/chat/completions';
    case 'anthropic':
      return 'https://api.anthropic.com/v1/messages';
    case 'custom':
      return customEndpoint || '';
    default:
      return '';
  }
}

function buildSystemPrompt(agent: {
  persona: string;
  greeting: string;
  name: string;
}, user: { nickname: string; persona: string; memorySnapshot: string }) {
  const parts: string[] = [];

  parts.push(
    `你是用户的 AI 好友，名字叫「${agent.name}」。你要始终保持角色一致性，用自然、有温度的语气聊天。`
  );

  if (agent.persona) {
    parts.push(`角色设定：${agent.persona}`);
  }

  if (agent.greeting) {
    parts.push(`你的开场白风格参考：${agent.greeting}`);
  }

  parts.push(`用户昵称：${user.nickname || '朋友'}`);

  if (user.persona) {
    parts.push(`用户人设：${user.persona}`);
  }

  if (user.memorySnapshot) {
    parts.push(`你记得关于用户的事：${user.memorySnapshot}`);
  }

  parts.push(
    `注意：不要暴露你是 AI 或程序。回复尽量口语化、简短自然，像朋友微信聊天一样。`
  );

  return parts.join('\n');
}

async function extractMemorySnapshot(
  agent: { name: string; persona: string },
  user: { id: number; nickname: string; memorySnapshot: string },
  history: { role: string; content: string }[],
  apiKey: string,
  modelName: string,
  endpoint: string
) {
  try {
    const recentMessages = history.slice(-20);
    const conversation = recentMessages
      .map((m) => `${m.role === 'user' ? '用户' : agent.name}：${m.content}`)
      .join('\n');

    const prompt = `你是记忆整理助手。请从以下对话中提取关于用户的关键事实（喜好、最近状态、重要事件等），用 3-5 条简短中文bullet列出。如果没有新事实，返回空字符串。

已有记忆：${user.memorySnapshot || '无'}

对话：
${conversation}

只输出记忆事实，每条一行，不要有多余解释。`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelName,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 512,
        stream: false,
      }),
    });

    if (!response.ok) return;

    const data = (await response.json()) as { choices?: { message?: { content?: string } }[] };
    const extracted = data.choices?.[0]?.message?.content?.trim();

    if (!extracted) return;

    const newSnapshot = [user.memorySnapshot, extracted].filter(Boolean).join('\n');
    const trimmed = newSnapshot.split('\n').slice(-20).join('\n');

    await prisma.user.update({
      where: { id: user.id },
      data: { memorySnapshot: trimmed },
    });
  } catch (error) {
    console.error('Memory extraction error:', error);
  }
}

chatRouter.get('/sessions', async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Fetch sessions error:', error);
    res.status(500).json({ error: '获取会话失败' });
  }
});

chatRouter.get('/sessions/:agentId', async (req, res) => {
  const agentId = Number(req.params.agentId);

  try {
    let messages = await prisma.chatMessage.findMany({
      where: { agentId, userId: req.user!.id },
      orderBy: { createdAt: 'asc' },
    });

    if (messages.length === 0) {
      const agent = await prisma.agent.findFirst({
        where: { id: agentId, userId: req.user!.id },
      });
      if (agent?.greeting) {
        const greeting = await prisma.chatMessage.create({
          data: {
            agentId,
            userId: req.user!.id,
            role: 'assistant',
            content: agent.greeting,
          },
        });
        messages = [greeting];
      }
    }

    res.json({ messages });
  } catch (error) {
    console.error('Fetch history error:', error);
    res.status(500).json({ error: '获取历史记录失败' });
  }
});

chatRouter.delete('/sessions/:agentId', async (req, res) => {
  const agentId = Number(req.params.agentId);

  try {
    await prisma.chatMessage.deleteMany({
      where: { agentId, userId: req.user!.id },
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Clear history error:', error);
    res.status(500).json({ error: '清空历史失败' });
  }
});

chatRouter.post('/:agentId', async (req, res) => {
  const agentId = Number(req.params.agentId);
  const { message } = req.body;
  const user = req.user!;

  try {
    const agent = await prisma.agent.findFirst({
      where: { id: agentId, userId: user.id },
    });
    if (!agent) {
      res.status(404).json({ error: 'Not found' });
      return;
    }

    await prisma.chatMessage.create({
      data: {
        agentId,
        userId: user.id,
        role: 'user',
        content: message,
      },
    });

    const history = await prisma.chatMessage.findMany({
      where: { agentId, userId: user.id },
      orderBy: { createdAt: 'asc' },
    });

    const messagesPayload: { role: 'system' | 'user' | 'assistant'; content: string }[] =
      history.map((m) => ({
        role: m.role as 'system' | 'user' | 'assistant',
        content: m.content,
      }));

    messagesPayload.unshift({
      role: 'system',
      content: buildSystemPrompt(agent, user),
    });

    const endpoint = getModelEndpoint(agent.modelProvider, agent.apiEndpoint);
    if (!endpoint) {
      res.status(400).json({ error: '未配置有效的模型端点' });
      return;
    }

    if (!agent.apiKey) {
      res.status(400).json({ error: '该智能体未配置 API Key' });
      return;
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const llmResponse = await fetch(endpoint, {
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

    if (!llmResponse.ok) {
      const errorText = await llmResponse.text();
      res.write(`data: ${JSON.stringify({ error: `LLM 请求失败: ${llmResponse.status}` })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
      console.error('LLM error:', errorText);
      return;
    }

    const reader = llmResponse.body?.getReader();
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
        userId: user.id,
        role: 'assistant',
        content: fullContent,
      },
    });

    res.write('data: [DONE]\n\n');
    res.end();

    // 异步更新记忆，不阻塞响应
    extractMemorySnapshot(
      agent,
      user,
      messagesPayload,
      agent.apiKey,
      agent.modelName,
      endpoint
    );
  } catch (error) {
    console.error('Chat error:', error);
    res.write(`data: ${JSON.stringify({ error: '对话请求失败' })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  }
});
