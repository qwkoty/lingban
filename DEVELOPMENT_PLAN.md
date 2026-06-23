# 灵伴 AI 好友 - 三阶段开发文档

> 版本：v1.0（从零重写版）
> 部署目标：Render
> 分支策略：main 为默认分支，所有代码变更直接推送到 main

---

## 0. 文档说明

本文档为「灵伴 AI 好友」项目的**从零重写**开发规划，按三个阶段递进式实施：

- **第一阶段**：工程骨架 + 核心对话链路——跑通「创建 AI 好友 → 聊天」主流程，可部署到 Render。
- **第二阶段**：AI 好友感深化 + 体验打磨——长期记忆、主动开口、角色一致性、UI 顺滑。
- **第三阶段**：多端扩展——接入微信公众号 / 小程序，跨端历史与记忆互通。

**每个阶段结束时**：代码合并到 main 分支 → 自动部署到 Render → 通过验收标准。

---

## 1. 项目总览

### 1.1 产品定位

「灵伴」是一款 **AI 好友 / 角色陪伴** 应用（对标 Character.AI）。每个智能体都是用户的一位虚拟朋友：有鲜明性格、背景、说话方式，会主动关心用户、找话题聊天，而不是被动回答问题。

### 1.2 核心特性

- 匿名使用，无需注册
- 创建多个不同性格的 AI 好友
- 智能体有鲜明人设，能保持角色一致性
- 长期记忆，越聊越懂用户
- 主动开口，延续陪伴感
- 移动端优先设计
- 网页端 + 微信端双入口

### 1.3 技术栈

| 层级 | 选型 | 说明 |
|---|---|---|
| 前端框架 | Next.js 15（App Router）+ TypeScript | 全栈框架，SSR/SSG，部署简单 |
| UI | Tailwind CSS + shadcn/ui | 原子化 CSS + 高质量组件库 |
| 状态管理 | Zustand | 轻量客户端状态 |
| 后端 | Next.js Route Handlers（Node.js Runtime） | 同仓全栈，减少运维成本 |
| 数据库 | PostgreSQL + Prisma ORM v7 | 类型安全的数据库访问 |
| LLM | OpenAI 兼容格式统一适配 | 支持 OpenAI / DeepSeek / Anthropic / 自定义端点 |
| 流式响应 | SSE（Server-Sent Events） | 对话流式输出 |
| 部署 | Render（Web Service + PostgreSQL） | Blueprint 一键部署 |
| 包管理 | pnpm | |

### 1.4 重写原则

1. **先可用、再好用、再扩展**：每阶段都有可部署的可用版本。
2. **全栈同仓、类型共享**：前后端共用类型定义，减少割裂。
3. **移动端优先**：按手机视口设计验收，再向上兼容。
4. **角色一致性是核心**：智能体人设、记忆、开场白从第一阶段就是一等公民。
5. **统一 OpenAI 兼容格式**：多模型通过适配层归一。
6. **错误与状态反馈贯穿始终**：所有异步操作有 loading / 错误 / 成功反馈。

---

## 2. 总体路线图

| 阶段 | 核心目标 | 产出标准 |
|---|---|---|
| **第一阶段** | 工程骨架 + 核心对话链路 | 能创建 AI 好友、能流式聊天、能部署到 Render |
| **第二阶段** | AI 好友感 + 体验打磨 | 长期记忆、主动开口、角色一致、UI 顺滑 |
| **第三阶段** | 接入微信 | 微信内可多轮对话，跨端历史与记忆互通 |

---

## 3. 第一阶段：工程骨架与核心对话链路

### 3.1 目标

从零搭建一个干净、可维护的全栈工程，让「匿名登录 → 创建 AI 好友 → 流式聊天」主链路完整跑通，并成功部署到 Render。

### 3.2 关键任务

#### 3.2.1 工程初始化

- 使用 `create-next-app` 初始化 Next.js 15 项目（TypeScript + ESLint + Tailwind CSS + App Router）。
- 配置 `pnpm` 为包管理器，设置 `packageManager` 字段。
- 配置路径别名 `@/` 指向 `src/`。
- 安装核心依赖：`@prisma/client`、`prisma`、`zustand`、`clsx`、`tailwind-merge`、`lucide-react`。
- 配置 `.env.example`：`DATABASE_URL`、`NODE_ENV`。

#### 3.2.2 数据库与 Prisma

- 设计核心数据模型（见 3.3）。
- 初始化 Prisma Schema，创建初始迁移。
- 封装 Prisma Client 单例（避免开发环境热更新重复实例化）。
- 提供数据库重置脚本。

#### 3.2.3 鉴权系统（匿名登录）

- 基于 Token 的匿名用户机制。
- 首次访问自动创建匿名用户，Token 存 localStorage。
- 服务端中间件校验 `Authorization: Bearer <token>`。
- 用户资料：昵称、头像、人设、主题偏好。

#### 3.2.4 AI 智能体管理

- 智能体 CRUD（增删改查）。
- 智能体配置：名称、头像、人设、开场白、模型提供商、模型名、API Key、API 端点、温度、Max Tokens。
- 预设模板：知心好友、游戏搭子、学习伙伴、幽默损友、温柔倾听者，一键填充。
- 头像上传（本地存储，Render 生产环境可后续替换为对象存储）。

#### 3.2.5 对话系统（核心）

- **LLM 适配层**：统一封装 OpenAI 兼容格式，支持流式调用。
  - 模型提供商映射：`openai` / `deepseek` / `anthropic` / `custom`。
  - 各提供商默认端点配置。
  - 统一错误处理：Key 无效、余额不足、网络超时等。
- **系统提示构建**：注入智能体人设 + 用户人设 + 行为准则。
- **流式对话接口**：SSE 实时返回 token。
- **消息存储**：每轮对话持久化到数据库。
- **对话历史**：按智能体分组的历史消息查询。
- **基础交互**：发送消息、重新生成、清空对话、复制消息、停止生成。

#### 3.2.6 前端页面与组件

- **布局**：移动端优先，底部导航栏，适配安全区。
- **智能体列表页**（首页）：卡片列表、空状态、新建入口。
- **智能体编辑页**：创建 / 编辑表单，模板选择，模型配置。
- **聊天页**：消息流、流式渲染、自适应输入框（Enter 发送 / Shift+Enter 换行）。
- **个人中心页**：用户资料编辑、主题切换。
- **通用组件**：Avatar、GlassCard（毛玻璃卡片）、Modal、Toast、EmptyState、ErrorBoundary、BottomNav。
- **主题系统**：至少 2 套主题（极光 / 暗夜），CSS 变量驱动，持久化。

#### 3.2.7 状态管理

- `auth store`：匿名登录、Token 持久化、用户资料。
- `agents store`：智能体列表与 CRUD 操作。
- `chat store`：当前对话消息、流式状态、发送 / 重生成 / 清空。
- `theme store`：主题切换与持久化。
- `toast store`：全局轻量提示。

#### 3.2.8 错误处理与状态反馈

- 全局 Toast 提示：成功 / 错误 / 加载中。
- 所有异步操作有 loading 态，防止重复提交。
- `ErrorBoundary` 捕获前端异常，友好提示 + 刷新按钮。
- API 统一错误响应格式。

#### 3.2.9 Render 部署配置

- 编写 `render.yaml` Blueprint：
  - Web Service（Node.js 运行时）
  - PostgreSQL 数据库
  - 构建命令、启动命令、环境变量
  - 健康检查路径
- 确保 `prisma generate && prisma migrate deploy` 在构建 / 启动阶段执行。
- 验证部署成功，通过健康检查。

### 3.3 数据模型（第一阶段）

```prisma
model User {
  id        String   @id @default(cuid())
  token     String   @unique
  nickname  String
  avatar    String?
  persona   String   @default("")
  theme     String   @default("aurora")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  agents   Agent[]
  messages ChatMessage[]

  @@map("users")
}

model Agent {
  id            String   @id @default(cuid())
  userId        String   @map("user_id")
  name          String
  avatar        String?
  persona       String   @default("")
  greeting      String   @default("")
  modelProvider String   @default("deepseek") @map("model_provider")
  modelName     String   @default("deepseek-chat") @map("model_name")
  apiEndpoint   String   @default("") @map("api_endpoint")
  temperature   Float    @default(0.7)
  maxTokens     Int      @default(4096) @map("max_tokens")
  apiKey        String   @default("") @map("api_key")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  user     User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  messages ChatMessage[]

  @@map("agents")
}

model ChatMessage {
  id        String   @id @default(cuid())
  agentId   String   @map("agent_id")
  userId    String   @map("user_id")
  role      String   // "user" | "assistant" | "system"
  content   String
  createdAt DateTime @default(now()) @map("created_at")

  agent Agent @relation(fields: [agentId], references: [id], onDelete: Cascade)
  user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([agentId, createdAt])
  @@map("chat_messages")
}
```

### 3.4 API 设计（第一阶段）

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/api/auth/anonymous` | 匿名登录，创建用户并返回 token |
| GET | `/api/auth/me` | 获取当前用户资料 |
| PATCH | `/api/auth/me` | 更新当前用户资料 |
| GET | `/api/agents` | 智能体列表 |
| POST | `/api/agents` | 创建智能体 |
| GET | `/api/agents/:id` | 智能体详情 |
| PATCH | `/api/agents/:id` | 更新智能体 |
| DELETE | `/api/agents/:id` | 删除智能体 |
| GET | `/api/chat/:agentId/messages` | 获取某智能体的历史消息 |
| POST | `/api/chat/:agentId/send` | 发送消息，SSE 流式返回 |
| POST | `/api/chat/:agentId/regenerate` | 重新生成最后一条回复 |
| DELETE | `/api/chat/:agentId/history` | 清空某智能体对话历史 |
| POST | `/api/upload/avatar` | 上传头像 |
| GET | `/api/health` | 健康检查 |

### 3.5 项目目录结构（第一阶段）

```
.
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx          # 根布局
│   │   ├── page.tsx            # 首页（智能体列表）
│   │   ├── agent/
│   │   │   ├── new/page.tsx    # 新建智能体
│   │   │   └── [id]/
│   │   │       ├── edit/page.tsx   # 编辑智能体
│   │   │       └── chat/page.tsx   # 聊天页
│   │   ├── profile/page.tsx    # 个人中心
│   │   └── api/                # API 路由
│   │       ├── auth/...
│   │       ├── agents/...
│   │       ├── chat/...
│   │       ├── upload/...
│   │       └── health/route.ts
│   ├── components/             # 通用组件
│   │   ├── ui/                 # shadcn/ui 组件
│   │   ├── Avatar.tsx
│   │   ├── BottomNav.tsx
│   │   ├── GlassCard.tsx
│   │   ├── Modal.tsx
│   │   ├── Toast.tsx
│   │   ├── EmptyState.tsx
│   │   └── ErrorBoundary.tsx
│   ├── lib/                    # 工具库
│   │   ├── prisma.ts           # Prisma Client 单例
│   │   ├── llm.ts              # LLM 适配层
│   │   ├── auth.ts             # 鉴权工具
│   │   ├── utils.ts            # 通用工具
│   │   └── api.ts              # 前端 API 封装
│   ├── store/                  # Zustand 状态
│   │   ├── auth.ts
│   │   ├── agents.ts
│   │   ├── chat.ts
│   │   ├── theme.ts
│   │   └── toast.ts
│   ├── types/                  # 共享类型定义
│   │   └── index.ts
│   └── styles/                 # 全局样式
│       └── globals.css
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── public/
├── uploads/                    # 头像上传目录（git ignore）
├── render.yaml                 # Render Blueprint
├── .env.example
├── .gitignore
├── package.json
├── pnpm-lock.yaml
├── next.config.ts
├── tailwind.config.ts
├── postcss.config.mjs
└── tsconfig.json
```

### 3.6 验收标准

- [ ] `pnpm install && pnpm dev` 可正常启动。
- [ ] 首次访问自动匿名登录，Token 持久化到 localStorage。
- [ ] 可创建、编辑、删除智能体，列表实时更新。
- [ ] 创建智能体时可使用预设模板一键填充。
- [ ] 选择 OpenAI / DeepSeek / 自定义 API 后，聊天能正常收到流式回复。
- [ ] 对话页支持重新生成、清空对话、复制消息、停止生成。
- [ ] 输入框自适应高度，Enter 发送、Shift+Enter 换行。
- [ ] 所有异步操作有 loading / 错误反馈，无白屏或卡死。
- [ ] 至少 2 套主题可切换，持久化生效。
- [ ] 移动端（iOS Safari、Chrome Android）可正常聊天。
- [ ] `pnpm lint`、`pnpm build` 无错误。
- [ ] 成功部署到 Render，`/api/health` 返回正常。

---

## 4. 第二阶段：AI 好友感与体验打磨

### 4.1 目标

在链路可用的基础上，把「AI 好友」感做深：让智能体更像一个持续陪伴、越来越懂用户的朋友。引入长期记忆、主动开口、角色一致性、对话与 UI 体验打磨。

### 4.2 关键任务

#### 4.2.1 角色一致性强化

- **结构化性格卡**：将 `persona` 扩展为结构化字段（背景故事、语气风格、口头禅、与用户的关系、喜好与禁忌）。
- **示例对话**：智能体设置中可添加 3~5 条示例问答，帮助 LLM 对齐说话风格。
- **系统提示优化**：性格卡 + 示例对话 + 用户人设 + 记忆摘要 分层注入，确保角色不出戏。
- **回复长度控制**：根据性格设定调整回复长度（话痨型 / 简洁型）。

#### 4.2.2 长期记忆系统

- 新增 `Memory` 表，记录用户关键事实（名字、喜好、重要事件、生日、重要关系等）。
- **记忆提取**：每轮对话结束后，异步调用 LLM 从本次对话中提取值得记住的事实，存入记忆库。
- **记忆注入**：每次对话前，检索最近 N 条记忆 + 记忆摘要，注入系统提示。
- **记忆管理**：
  - 用户可在智能体设置中查看、编辑、删除记忆。
  - 记忆去重与合并机制（避免重复记录相同事实）。
- **记忆摘要**：定期生成全局记忆摘要，用于 Token 有限时快速注入。

#### 4.2.3 主动开口与关系感

- **开场白**：进入聊天页时，若历史为空或当天首次对话，智能体主动发送符合性格的问候 / 找话题。
- **每日主动问候**：用户每天第一次打开应用时，智能体根据记忆主动发起对话（如「早上好，今天的面试准备得怎么样了？」）。
- **关系进度展示**：
  - 「认识第 N 天」
  - 「聊过 N 句话」
  - 「亲密度」可视化进度条
- **角色心情状态**：简单的心情系统（开心 / 平静 / 想念 / 困倦），根据互动频率与时间变化，影响回复语气和头像旁的小状态图标。

#### 4.2.4 对话体验升级

- **Markdown 渲染**：assistant 消息支持 Markdown（代码块、列表、加粗、链接），代码块可一键复制。
- **消息引用与回复**：长按消息可引用，被引用内容进入下一轮上下文。
- **编辑并重发**：支持修改已发送的用户消息并重新触发回复（分支历史，简单起见可只保留最新分支）。
- **长文本折叠**：超长回复自动折叠，点击展开。
- **消息时间分组**：按日期分组显示消息，显示时间戳。
- **输入状态指示**：对方「正在输入…」提示。
- **快捷短语**：输入框上方提供常用快捷回复 / 话题引导。

#### 4.2.5 视觉与动效

- **页面切换过渡**：路由切换淡入 / 滑入动画。
- **消息入场动画**：新消息淡入 + 轻微上移。
- **卡片列表动画**：智能体列表加载、删除、新增的 stagger 动效。
- **按压反馈**：按钮、卡片增加 `active:scale` 按压态。
- **更多主题**：增加「七彩」「清晨」「深夜」等主题，共 4+ 套。
- **主题一致性检查**：所有页面、组件、弹窗使用 CSS 变量，无硬编码颜色。
- **空状态插画**：不同场景的专属空状态插画与文案。

#### 4.2.6 触控与无障碍

- 触控目标最小 44×44px。
- 发送 / 接收消息时轻微震动反馈（`navigator.vibrate`）。
- 关键按钮添加 `aria-label`。
- 支持键盘导航（Tab、Enter、Esc）。
- 尊重 `prefers-reduced-motion`，关闭非必要动画。

#### 4.2.7 性能优化

- **长列表虚拟滚动**：聊天记录超过 200 条时启用虚拟滚动，确保流畅。
- **消息分页加载**：向上滚动加载历史消息（无限滚动）。
- **图片懒加载与压缩**：头像上传前压缩，懒加载展示。
- **减少重渲染**：合理使用 memo、useMemo、useCallback。
- **API 超时与重试**：前端请求添加超时和失败重试机制。

#### 4.2.8 语音消息（可选，视进度）

- 支持用户发送语音消息，后端调用 ASR 转文字后进入 LLM。
- assistant 回复可选择 TTS 合成语音播放。

### 4.3 数据模型（第二阶段新增 / 修改）

```prisma
model User {
  // ... 第一阶段字段
  memorySnapshot String   @default("") @map("memory_snapshot")
  lastActiveAt   DateTime? @map("last_active_at")

  memories Memory[]
}

model Agent {
  // ... 第一阶段字段
  background     String   @default("")   // 背景故事
  speechStyle    String   @default("")   // 语气风格
  catchphrases   String   @default("")   // 口头禅（JSON 数组字符串）
  relationship   String   @default("")   // 与用户的关系
  exampleDialogs String   @default("")   // 示例对话（JSON 数组字符串）
  replyLength    String   @default("medium") @map("reply_length") // short / medium / long

  mood           String   @default("neutral") // 心情状态
  intimacy       Int      @default(0)         // 亲密度 0-100
  chatCount      Int      @default(0)         // 聊天总轮数

  memories AgentMemory[]
}

model Memory {
  id         String   @id @default(cuid())
  userId     String   @map("user_id")
  content    String   // 记忆内容
  importance Int      @default(5) // 重要程度 1-10
  source     String   @default("auto") // auto / manual
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, importance])
  @@map("memories")
}

model AgentMemory {
  id        String   @id @default(cuid())
  agentId   String   @map("agent_id")
  userId    String   @map("user_id")
  content   String
  importance Int     @default(5)
  createdAt DateTime @default(now()) @map("created_at")

  agent Agent @relation(fields: [agentId], references: [id], onDelete: Cascade)
  user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([agentId, importance])
  @@map("agent_memories")
}
```

### 4.4 新增 API（第二阶段）

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/memories` | 获取用户全局记忆列表 |
| POST | `/api/memories` | 手动添加记忆 |
| PATCH | `/api/memories/:id` | 更新记忆 |
| DELETE | `/api/memories/:id` | 删除记忆 |
| GET | `/api/agents/:id/memories` | 获取某智能体专属记忆 |
| GET | `/api/agents/:id/stats` | 获取智能体互动统计（认识天数、聊天轮数、亲密度） |
| POST | `/api/chat/:agentId/voice` | 发送语音消息（可选） |

### 4.5 验收标准

- [ ] 智能体能在对话中维持一致的性格与语气，不「出戏」。
- [ ] 进入聊天页时智能体主动发送符合性格的开场白。
- [ ] 长期记忆正常生效：用户提到的重要信息会被记住，后续对话能引用。
- [ ] 用户可查看、编辑、删除记忆。
- [ ] 每天首次打开应用时，智能体根据记忆主动发起问候。
- [ ] 智能体详情页显示「认识第 N 天」「聊过 N 句」「亲密度」。
- [ ] Markdown / 代码块正常渲染，代码块可复制。
- [ ] 支持消息引用、编辑并重发。
- [ ] 至少 4 套主题，切换即时生效且全站一致。
- [ ] 长聊天记录（1000 条）滚动流畅，无显著掉帧。
- [ ] 支持键盘完整操作主要流程。
- [ ] 页面切换与消息发送有流畅动画，不卡顿。
- [ ] Render 生产环境首屏加载 < 2s。

---

## 5. 第三阶段：接入微信

### 5.1 目标

让用户无需打开网页，即可在微信内与 AI 好友进行多轮对话；微信端与网页端历史记录、长期记忆完全互通，智能体在微信里同样能主动问候、找话题，延续陪伴感。

### 5.2 关键任务

#### 5.2.1 微信服务端接入

- **公众号 / 小程序服务器配置**：提供 URL、Token、EncodingAESKey 配置页面（管理员后台）。
- **签名验证**：实现微信服务器签名验证接口（`signature` + `timestamp` + `nonce`）。
- **消息加解密**：支持明文 / 兼容 / 安全三种模式，AES 解密微信消息、加密回复。
- **新增微信 API 路由**：
  - GET：服务器配置验证
  - POST：接收微信推送的消息与事件

#### 5.2.2 用户映射与绑定

- 使用微信用户 `OpenID` 作为唯一标识。
- **首次微信访问**：自动创建对应用户，建立 `wechatOpenId` 关联。
- **网页端绑定微信**：已登录用户可扫码绑定微信，实现多端历史互通。
- **默认智能体**：每个微信用户可设置一个默认对话智能体。
- **智能体切换**：通过关键词（如「切换 xxx」「列表」）切换当前对话的智能体。

#### 5.2.3 消息接收与回复

- 解析微信 XML 消息：
  - 文本消息（`MsgType=text`）
  - 语音消息（`MsgType=voice`）—— 调用微信语音识别或自行 ASR
  - 图片消息（`MsgType=image`）—— 描述图片内容（视觉模型）或暂存
  - 事件推送（`MsgType=event`）—— 关注 / 取关 / 点击菜单 / 扫码
- **回复模式**：
  - **快速回复**：简单消息 5 秒内直接返回微信 XML 响应。
  - **异步回复**：复杂消息先返回空响应，再通过「客服消息」接口异步推送结果。
- 复用 LLM 对话逻辑与记忆系统，微信消息统一存入 `chat_messages`。

#### 5.2.4 智能体路由与入口

- 每个智能体可生成独立微信入口：
  - 带参二维码（扫码直接进入该智能体对话）
  - 菜单关键词触发
- **智能体管理菜单**：
  - 发送「列表」查看所有智能体
  - 发送「切换 + 名字」切换智能体
  - 发送「设置」进入设置菜单
- 网页端可设置哪些智能体对微信用户可见 / 开放。

#### 5.2.5 微信特色能力

- **关注欢迎语**：新用户关注公众号时，发送欢迎语 + AI 好友列表 + 使用指引。
- **自定义菜单**：公众号底部菜单直达常用智能体、个人中心、帮助。
- **主动推送（客服消息）**：
  - 获得用户许可后，智能体可在特定时间主动问候（早上好、晚安、生日祝福）。
  - 问候内容基于长期记忆生成，更有温度。
  - 定时任务调度（可使用 Render Cron Jobs 或简单的 setInterval）。
- **语音消息**：支持语音输入（微信自带识别或 ASR），回复可选语音（TTS）。
- **图文消息**：智能体列表、帮助文档等用图文消息展示。

#### 5.2.6 安全与稳定性

- **签名验证**：所有微信请求必须验证签名，防止伪造。
- **消息去重**：按 `MsgId` 去重，避免重复处理。
- **超时降级**：LLM 响应超时时，回复固定提示语「我正在想，稍等一下～」，稍后通过客服消息补发。
- **限流保护**：单用户消息频率限制，防止打爆后端。
- **错误告警**：关键错误（微信 API 失败、数据库异常）记录日志并告警。

#### 5.2.7 后台管理（轻量）

- 管理员可查看微信用户数、消息量、智能体使用统计。
- 配置微信公众号参数（AppID、Token、EncodingAESKey、AppSecret）。
- 配置主动推送策略（时间段、频率）。

### 5.3 数据模型（第三阶段新增）

```prisma
model WechatUser {
  id            String   @id @default(cuid())
  openId        String   @unique @map("open_id")
  userId        String   @unique @map("user_id")
  unionId       String?  @unique @map("union_id")
  defaultAgentId String?  @map("default_agent_id")
  nickname      String?
  avatar        String?
  subscribed    Boolean  @default(true)
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("wechat_users")
}

model WechatConfig {
  id             String  @id @default(cuid())
  appId          String  @map("app_id")
  appSecret      String  @map("app_secret")
  token          String
  encodingAesKey String  @map("encoding_aes_key")
  updatedAt      DateTime @updatedAt

  @@map("wechat_config")
}

model ScheduledMessage {
  id        String   @id @default(cuid())
  userId    String   @map("user_id")
  agentId   String   @map("agent_id")
  channel   String   // "wechat" | "web"
  type      String   // "greeting" | "reminder" | "custom"
  scheduledAt DateTime @map("scheduled_at")
  sent      Boolean  @default(false)
  content   String?
  createdAt DateTime @default(now()) @map("created_at")

  user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)
  agent Agent @relation(fields: [agentId], references: [id], onDelete: Cascade)

  @@index([scheduledAt, sent])
  @@map("scheduled_messages")
}
```

### 5.4 新增 API（第三阶段）

| 方法 | 路径 | 说明 |
|---|---|---|
| GET / POST | `/api/wechat` | 微信服务器验证与消息接收 |
| POST | `/api/wechat/bind` | 网页端用户绑定微信（生成绑定码 / 扫码） |
| GET | `/api/admin/wechat/config` | 获取微信配置（管理员） |
| PUT | `/api/admin/wechat/config` | 更新微信配置（管理员） |
| GET | `/api/admin/stats` | 运营数据统计（管理员） |

### 5.5 验收标准

- [ ] 微信公众号服务器配置验证通过，Render 域名可正常接收微信推送。
- [ ] 用户在微信内发送文字，5 秒内收到符合角色性格的回复。
- [ ] 多轮对话上下文连续，长期记忆在微信与网页端互通。
- [ ] 关注公众号时收到欢迎语与智能体列表。
- [ ] 可通过关键词切换智能体、查看列表。
- [ ] 微信端与网页端历史消息互通，同一账号两边同步。
- [ ] 智能体可通过客服消息主动发送问候 / 找话题。
- [ ] 微信请求签名验证、消息去重、超时降级均生效。
- [ ] 生产环境能稳定处理并发消息（100 QPS 无明显延迟）。
- [ ] 管理员可配置微信参数、查看运营数据。

---

## 6. Render 部署指南

### 6.1 部署架构

```
Render Platform
├── Web Service (Node.js)
│   ├── 构建：pnpm install && pnpm build
│   ├── 启动：pnpm start（含 prisma migrate deploy）
│   └── 端口：由 Render 注入 $PORT
└── PostgreSQL Database
    └── 连接串：DATABASE_URL（自动注入）
```

### 6.2 render.yaml 配置要点

```yaml
services:
  - type: web
    name: lingban
    runtime: node
    plan: starter
    region: singapore
    buildCommand: pnpm install --no-frozen-lockfile && pnpm run build
    startCommand: pnpm run start
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        fromDatabase:
          name: lingban-db
          property: connectionString
    healthCheckPath: /api/health

databases:
  - name: lingban-db
    plan: starter
    region: singapore
    databaseName: lingban
    user: lingban
```

### 6.3 部署步骤

1. **准备 GitHub 仓库**：将代码推送到 GitHub 仓库的 main 分支。
2. **创建 Blueprint**：
   - 登录 Render Dashboard
   - 进入 **Blueprints** → **New Blueprint Instance**
   - 选择 GitHub 仓库，Render 自动读取 `render.yaml`
   - 确认服务与数据库配置，点击 **Apply**
3. **等待部署**：Render 自动创建 Web Service 和 PostgreSQL，执行构建与迁移。
4. **验证**：部署完成后访问分配的域名，确认：
   - 首页可正常加载
   - `/api/health` 返回 `{"status":"ok",...}`
   - 可创建智能体并发消息测试

### 6.4 自动部署

- Render 默认监听 `main` 分支，每次 push 到 main 自动触发部署。
- 构建失败不会影响正在运行的服务。
- 可在 Render Dashboard 查看部署日志与状态。

### 6.5 环境变量

| 变量 | 说明 | 第一阶段 | 第二阶段 | 第三阶段 |
|---|---|---|---|---|
| `DATABASE_URL` | PostgreSQL 连接串 | ✅（Render 自动注入） | ✅ | ✅ |
| `NODE_ENV` | 运行环境 | ✅ | ✅ | ✅ |
| `WECHAT_APP_ID` | 微信公众号 AppID | - | - | ✅ |
| `WECHAT_APP_SECRET` | 微信公众号 AppSecret | - | - | ✅ |
| `WECHAT_TOKEN` | 微信服务器 Token | - | - | ✅ |
| `WECHAT_AES_KEY` | 微信消息加密密钥 | - | - | ✅ |

---

## 7. Git 工作流与分支策略

### 7.1 核心原则

- **main 分支是唯一的长期分支**，也是默认分支和生产部署分支。
- 所有代码变更直接推送到 main 分支。
- Render 自动部署 main 分支最新代码。
- 保持提交粒度小、提交信息清晰。

### 7.2 提交规范

使用 Conventional Commits 格式：

```
<type>(<scope>): <description>

[optional body]
```

**Type 类型**：
- `feat`：新功能
- `fix`：修复 bug
- `refactor`：代码重构（不影响功能）
- `style`：代码格式调整
- `docs`：文档更新
- `test`：测试相关
- `chore`：构建 / 工具 / 依赖更新

**示例**：
```
feat(chat): add message regeneration support
fix(api): handle LLM streaming errors gracefully
docs: update phase 2 requirements
chore: upgrade prisma to v7.8.0
```

### 7.3 开发流程

```
开始任务
    ↓
在本地 main 分支开发
    ↓
完成编码与自测
    ↓
运行 lint / type check / build
    ↓
提交代码（符合提交规范）
    ↓
推送到 origin/main
    ↓
Render 自动部署
    ↓
验证线上功能
```

### 7.4 注意事项

1. **推送前自测**：确保本地 `pnpm build` 通过，核心功能正常。
2. **小步提交**：每个功能点拆分成多个小提交，便于回滚和排查。
3. **数据库迁移**：Prisma migration 文件随代码一起提交，部署时自动执行。
4. **环境变量**：敏感信息不提交到代码库，通过 Render 环境变量配置。
5. **回滚**：如线上出现问题，使用 `git revert` 回滚对应提交，再 push 到 main 触发重新部署。

---

## 8. 里程碑与时间建议

| 阶段 | 里程碑 | 交付物 | Render 状态 |
|---|---|---|---|
| **第一阶段** | 核心链路跑通 | 可创建 AI 好友、流式聊天、部署成功 | ✅ 可访问 |
| **第二阶段** | AI 好友感达标 | 长期记忆、主动开口、UI 顺滑 | ✅ 生产可用 |
| **第三阶段** | 微信接入完成 | 微信内可对话、跨端互通 | ✅ 多端上线 |

> 每个阶段结束后，都应在 Render 上有一个稳定可访问的版本。

---

## 9. 风险与应对

| 风险 | 影响 | 应对策略 |
|---|---|---|
| 微信公众号审核周期长 | 第三阶段延期 | 提前申请公众号，使用微信测试号先行开发调试 |
| LLM API 各家差异大 | 多模型适配困难 | 统一 OpenAI 兼容格式，特殊字段在适配层处理 |
| API Key 由用户自填 | 易出现余额 / 权限问题 | 错误提示具体明确，引导用户检查 Key 与余额 |
| 长聊天记录性能问题 | 第二阶段体验下降 | 提前规划分页加载 + 虚拟滚动 |
| 微信消息并发与超时 | 用户体验差 | 引入异步客服消息 + 降级提示 + 限流 |
| Render 冷启动延迟 | 首访响应慢 | 选择合适套餐，或配置健康检查定时唤醒 |
| 数据库迁移出错 | 部署失败 | 迁移前备份，本地充分测试，迁移脚本幂等 |

---

## 10. 常用命令速查

```bash
# 安装依赖
pnpm install

# 本地开发
pnpm dev

# 代码检查
pnpm lint
pnpm typecheck

# 生产构建
pnpm build

# 生产启动
pnpm start

# Prisma 相关
pnpm prisma generate    # 生成 Prisma Client
pnpm prisma migrate dev # 创建并应用迁移（开发）
pnpm prisma migrate deploy # 部署迁移（生产）
pnpm prisma studio      # 可视化数据库

# Git 提交
git add .
git commit -m "feat(scope): description"
git push origin main
```

---

## 11. 结语

本开发文档以「先可用、再好用、再扩展」为节奏，将「灵伴 AI 好友」从零逐步打造为有陪伴感的产品。三个阶段各有明确的目标、任务与验收标准，每阶段结束都在 Render 上产出可部署的版本。

main 分支作为唯一的长期分支与部署分支，所有变更直接推送，Render 自动部署，确保开发与发布流程简洁高效。
