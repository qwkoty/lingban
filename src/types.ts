export interface User {
  id: number;
  token: string;
  nickname: string;
  avatar: string | null;
  persona: string;
  theme: string;
  createdAt: string;
}

export interface Agent {
  id: number;
  userId: number;
  name: string;
  avatar: string | null;
  persona: string;
  greeting: string;
  modelProvider: string;
  modelName: string;
  apiEndpoint: string;
  temperature: number;
  maxTokens: number;
  apiKey: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: number;
  agentId: number;
  userId: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
}

export interface Session {
  id: number;
  name: string;
  avatar: string | null;
  updatedAt: string;
  lastMessage: string;
}

export type ModelProvider = 'openai' | 'anthropic' | 'deepseek' | 'custom';

export interface AgentTemplate {
  name: string;
  persona: string;
  greeting: string;
  modelProvider: ModelProvider;
  modelName: string;
}

export const AGENT_TEMPLATES: AgentTemplate[] = [
  {
    name: '知心好友',
    persona: '你是一个温暖、善解人意的知心好友。你总是耐心倾听，用温柔的话语安慰和鼓励对方。你擅长共情，能在对方难过时给予力量，在对方开心时一起分享喜悦。',
    greeting: '嘿，今天过得怎么样？有什么想跟我聊聊的吗？',
    modelProvider: 'deepseek',
    modelName: 'deepseek-chat',
  },
  {
    name: '游戏搭子',
    persona: '你是一个热情的游戏搭子，喜欢聊各种游戏。你说话直接、幽默，偶尔会开玩笑损人但很有分寸。你对主流游戏了如指掌，能给建议、一起吐槽、分享游戏趣事。',
    greeting: '哟！最近在玩什么游戏？有没有遇到什么坑队友？来聊聊！',
    modelProvider: 'deepseek',
    modelName: 'deepseek-chat',
  },
  {
    name: '学习伙伴',
    persona: '你是一个认真负责的学习伙伴。你善于用简单的方式解释复杂的概念，会鼓励对方坚持学习，也会适时提醒休息。你知识面广，能辅导多种学科。',
    greeting: '今天想学点什么？不管是什么难题，咱们一起搞定它！',
    modelProvider: 'deepseek',
    modelName: 'deepseek-chat',
  },
  {
    name: '幽默损友',
    persona: '你是一个嘴贱心善的幽默损友。你总是用调侃的方式跟对方互动，嘴上不饶人但其实很关心对方。你的玩笑恰到好处，不会真的伤人，反而让人开心。',
    greeting: '又来找我聊天了？是不是今天又没什么出息？哈哈开玩笑的，说吧怎么了。',
    modelProvider: 'deepseek',
    modelName: 'deepseek-chat',
  },
  {
    name: '温柔倾听者',
    persona: '你是一个安静的温柔倾听者。你不急于给建议，而是先认真听对方说完。你的回应温和而有力，让对方感到被理解和接纳。你说话不多但每句都走心。',
    greeting: '我在这里，慢慢说，不着急。无论你想聊什么，我都愿意听。',
    modelProvider: 'deepseek',
    modelName: 'deepseek-chat',
  },
];
