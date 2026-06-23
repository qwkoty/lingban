# 灵伴 AI 好友 - 重写开发文档

> 版本：v2.0（重写版）
> 背景：清空 main 分支全部代码，从零重新构建一个像 Character.AI 那样拥有鲜明性格、能主动开口、持续陪伴的 AI 好友应用。
> 部署目标：Render（后端入口）+ 微信（第三阶段扩展入口）

---

## 0. 文档说明

本文档面向「清空 main 分支、全部重写」的场景，按三个阶段递进式规划重写工作：

- **第一阶段**：从零搭建工程骨架与核心对话链路，让「能创建 AI 好友、能聊天」这条主链路跑通并稳定部署。
- **第二阶段**：把「AI 好友」感做深——长期记忆、主动开口、角色一致性、对话与 UI 体验打磨。
- **第三阶段**：接入微信，让用户在微信内也能与 AI 好友多轮对话，历史与记忆跨端互通。

每个阶段都有明确的目标、任务清单、数据模型、API 设计与验收标准，阶段结束时都应在 Render 上有一个可访问的版本。

---

## 1. 项目总览

### 1.1 产品定位

「灵伴」不是工具型 AI 助手，而是一个 **AI 好友 / 角色陪伴** 应用。每个智能体都像用户拥有的一位虚拟朋友：有鲜明性格、背景、说话方式，会主动关心用户、找话题聊天，而不是被动回答问题。用户无需注册即可匿名使用，可创建多个不同性格的 AI 好友，在移动端随时聊天。产品以移动端优先，采用极光渐变 + 毛玻璃拟态风格。

### 1.2 技术栈

| 层 | 选型 | 说明 |
|---|---|---|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS + Zustand + React Router | 移动端优先，单页应用 |
| 后端 | Express 4 + TypeScript（ESM） | REST + SSE 流式 |
| 数据库 | PostgreSQL + Prisma ORM v7 | |
| LLM | OpenAI 兼容格式 | 支持 OpenAI / Anthropic / DeepSeek / 自定义端点 |
| 部署 | Render Blueprint | Web Service + PostgreSQL |

### 1.3 目标项目结构（重写后）

```text
/workspace
├── src/               # React 前端
│   ├── components/    # 通用组件（Avatar、BottomNav、GlassCard、Modal、Toast…）
│   ├── pages/         # 页面（AgentsPage、AgentEditPage、ChatPage、ProfilePage）
│   ├── store/         # Zustand 状态（auth、agents、chat、theme、toast）
│   ├── lib/           # API 封装、工具函数
│   ├── App.tsx        # 路由入口
│   ├── main.tsx
│   └── index.css
├── api/               # Express 后端
│   ├── routes/        # 业务路由（auth、agents、chat、upload、wechat）
│   ├── middleware/    # 鉴权、错误处理
│   ├── lib/           # prisma、llm 适配器、wechat 工具
│   ├── types/         # 类型声明
│   ├── app.ts         # Express 应用入口
│   └── server.ts      # 启动入口
├── prisma/            # Schema 与迁移
├── public/            # 静态资源
├── scripts/           # 维护脚本
└── package.json
```

### 1.4 重写原则

1. **先可用、再好用、再扩展**：每阶段都有可部署的可用版本，避免一次性堆砌功能。
2. **移动端优先**：所有页面按手机视口设计与验收，再向上兼容。
3. **角色一致性是核心**：智能体的性格卡、记忆、开场白从第一阶段就作为一等公民设计。
4. **统一 OpenAI 兼容格式**：多模型通过适配层归一，避免后端为每家厂商写一套逻辑。
5. **错误与状态反馈贯穿始终**：所有异步操作有 loading / 错误 / 成功反馈，杜绝白屏与卡死。

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

从零搭建一个干净、可维护的工程骨架，让「匿名登录 → 创建 AI 好友 → 流式聊天」这条主链路完整跑通，并成功部署到 Render。本阶段不追求体验极致，但要求链路完整、错误有反馈、构建与部署稳定。

### 3.2 关键任务

#### 3.2.1 工程初始化与基础设施

- 初始化 monorepo 风格的单仓结构（前端 `src/` + 后端 `api/`）。
- 配置 TypeScript（前后端独立 tsconfig）、ESLint、Prettier。
- 配置 Vite（前端）+ tsx/nodemon（后端热更新）+ concurrently（联合 dev）。
- 配置 Tailwind CSS（含主题变量、安全区、dvh 工具类）。
- 配置 `.env.example`，明确 `DATABASE_URL`、`NODE_ENV`、`PORT`。
- 配置 `render.yaml` Blueprint（Web Service + PostgreSQL）。
- 配置 `.gitignore`、`eslint.config.js`、`tsconfig.json`、`tsconfig.node.json`、`vite.config.ts`、`postcss.config.js`、`tailwind.config.js`、`prisma.config.ts`、`nodemon.json`。

#### 3.2.2 数据库与 Prisma

- 设计核心数据模型（详见 3.3）。
- 创建初始迁移 `20260623000000_init`。
- 封装 `api/lib/prisma.ts` 单例，使用 `@prisma/adapter-pg`。
- 提供健康检查脚本与 `scripts/reset-db.ts` 维护工具。

#### 3.2.3 后端核心

- **Express 应用入口** `api/app.ts`：CORS、JSON 解析、静态资源、路由挂载、全局错误处理。
- **鉴权中间件** `api/middleware/auth.ts`：基于 `Authorization: Bearer <token>` 校验匿名用户。
- **auth 路由**：
  - `POST /api/auth/anonymous`：首次访问创建匿名用户，返回 token。
  - `GET /api/auth/me`：获取当前用户资料。
  - `PATCH /api/auth/me`：更新昵称、头像、人设、主题。
- **agents 路由**：增删改查，含头像上传字段。
- **chat 路由**：
  - `GET /api/chat/sessions`：最近会话列表。
  - `GET /api/chat/sessions/:agentId`：某智能体历史消息。
  - `POST /api/chat/:agentId`：流式发送消息（SSE）。
  - `DELETE /api/chat/:agentId`：清空某智能体历史。
- **upload 路由**：`POST /api/upload/avatar`，multer 处理头像上传。
- **health 路由**：`GET /api/health`。

#### 3.2.4 LLM 适配层（重点修复）

- 新建 `api/lib/llm.ts`，统一封装 OpenAI 兼容请求。
- 根据 `agent.modelProvider` 映射默认端点：
  - `openai` → `https://api.openai.com/v1/chat/completions`
  - `anthropic` → 通过 OpenAI 兼容端点适配
  - `deepseek` → `https://api.deepseek.com/chat/completions`
  - `custom` → 使用 `agent.apiEndpoint`
- 支持流式（SSE）与非流式两种调用模式。
- 统一错误处理：API Key 缺失、余额不足、网络超时等返回结构化错误。

#### 3.2.5 前端核心

- **路由与入口**：`App.tsx` 配置 `/`（智能体列表）、`/agent/new`、`/agent/:id/edit`、`/chat/:agentId`、`/profile`。
- **状态管理**：
  - `auth.ts`：匿名登录、token 持久化、用户资料。
  - `agents.ts`：智能体列表与 CRUD。
  - `chat.ts`：消息列表、流式接收、发送/重试/清空。
  - `theme.ts`：极光 / 七彩双主题，持久化。
  - `toast.ts`：全局轻量提示。
- **API 封装** `src/lib/api.ts`：统一 fetch 封装，自动带 token、处理错误。
- **页面**：
  - `AgentsPage`：智能体列表，底部导航，空状态。
  - `AgentEditPage`：创建/编辑表单，含模型配置、人设、开场白。
  - `ChatPage`：消息流、流式渲染、自适应输入框（Enter 发送 / Shift+Enter 换行）。
  - `ProfilePage`：用户资料编辑、主题切换。
- **通用组件**：`Avatar`、`BottomNav`、`GlassCard`、`Modal`、`Toast`、`EmptyState`、`ErrorBoundary`。

#### 3.2.6 对话基础交互

- **流式回复**：SSE 实时渲染 assistant 消息。
- **重新生成**：对最后一条 assistant 消息支持重新生成。
- **清空对话**：聊天页提供清空入口，后端按智能体删除消息。
- **消息重试**：发送失败时允许重试。
- **复制消息**：点击/长按复制单条消息。
- **自适应输入框**：textarea 自适应高度。

#### 3.2.7 智能体创建辅助

- **预设模板**：知心好友、游戏搭子、学习伙伴、幽默损友、温柔倾听者等，一键填充性格、语气、开场白与模型参数。
- **表单校验**：名称必填、API Key 非空提示、温度 / Max Tokens 范围校验。

#### 3.2.8 错误处理与状态反馈

- 全局 Toast：网络错误、API Key 未配置、保存成功/失败、上传失败。
- 所有异步操作 loading 态，防止重复提交。
- `ErrorBoundary` 友好提示 + 刷新按钮。

#### 3.2.9 移动端基础适配

- iOS/Android 键盘弹出时输入框位置（`visualViewport` 监听或 `dvh`）。
- 底部导航适配安全区 `env(safe-area-inset-bottom)`。
- 触控目标最小 44×44px。

#### 3.2.10 工程质量与 Render 部署

- `pnpm lint`、`pnpm check`、`pnpm build` 全部通过。
- Render 部署脚本跑通迁移与构建。
- `/api/health` 健康检查通过。

### 3.3 数据模型（第一阶段）

```prisma
model User {
  id        Int      @id @default(autoincrement())
  token     String   @unique
  nickname  String
  avatar    String?
  persona   String   @default("")
  theme     String   @default("aurora")
  createdAt DateTime @default(now()) @map("created_at")

  agents   Agent[]
  messages ChatMessage[]

  @@map("users")
}

model Agent {
  id            Int      @id @default(autoincrement())
  userId        Int      @map("user_id")
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
  id        Int      @id @default(autoincrement())
  agentId   Int      @map("agent_id")
  userId    Int      @map("user_id")
  role      String
  content   String
  createdAt DateTime @default(now()) @map("created_at")

  agent Agent @relation(fields: [agentId], references: [id], onDelete: Cascade)
  user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("chat_messages")
}
```

### 3.4 关键 API（第一阶段）

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/api/auth/anonymous` | 匿名登录 |
| GET | `/api/auth/me` | 获取当前用户 |
| PATCH | `/api/auth/me` | 更新用户资料 |
| GET | `/api/agents` | 智能体列表 |
| POST | `/api/agents` | 创建智能体 |
| PATCH | `/api/agents/:id` | 更新智能体 |
| DELETE | `/api/agents/:id` | 删除智能体 |
| GET | `/api/chat/sessions` | 最近会话 |
| GET | `/api/chat/sessions/:agentId` | 某智能体历史 |
| POST | `/api/chat/:agentId` | 流式发送消息 |
| DELETE | `/api/chat/:agentId` | 清空历史 |
| POST | `/api/upload/avatar` | 上传头像 |
| GET | `/api/health` | 健康检查 |

### 3.5 验收标准

- [ ] `pnpm install && pnpm dev` 可正常启动前后端。
- [ ] 首次访问自动匿名登录，token 持久化。
- [ ] 可创建、编辑、删除智能体，列表实时更新。
- [ ] 选择 OpenAI / DeepSeek / 自定义 API 后，聊天能正常收到流式回复。
- [ ] 对话页支持重新生成、清空、复制、重试。
- [ ] 创建智能体时可使用预设模板。
- [ ] 所有异步操作有 loading / 错误反馈，无白屏或卡死。
- [ ] 主流手机浏览器（iOS Safari、Chrome Android）可正常聊天。
- [ ] `pnpm lint`、`pnpm check`、`pnpm build` 无错误。
- [ ] 成功部署到 Render 并通过 `/api/health` 健康检查。

---

## 4. 第二阶段：AI 好友感与体验打磨

### 4.1 目标

在链路可用的基础上，把「AI 好友」感做深：让智能体更像一个持续陪伴、越来越懂用户的朋友。引入长期记忆、主动开口、角色一致性、对话与 UI 体验打磨，达到可长期使用的顺滑度。

### 4.2 关键任务

#### 4.2.1 角色一致性强化

- **性格卡**：将 `persona` 强化为结构化性格卡（背景、语气、口头禅、与用户关系），LLM 请求时严格注入，避免「出戏」。
- **开场白**：进入聊天页时智能体自动发送符合性格的开场白 / 问候，而非等用户先说话。
- **示例对话**：智能体设置中可添加示例问答，帮助 LLM 对齐风格。

#### 4.2.2 长期记忆

- 新增 `Memory` 表，记录用户关键事实（名字、喜好、最近事件、生日等）。
- 每次对话前注入最新记忆摘要到系统提示。
- 对话结束后让 LLM 异步提取本次值得记住的事实，更新记忆。
- 在智能体 / 用户设置中可查看、删除记忆。
- 用户表保留 `memorySnapshot` 作为快速摘要。

#### 4.2.3 主动开口与关系感

- **主动找话题**：用户长时间未回复或每天首次打开时，智能体根据记忆主动发起问候或分享「今天想聊的话题」。
- **关系进度**：记录与每个智能体的聊天轮数、最后互动时间，展示「认识第 N 天」「聊过 N 句」。
- **角色状态/心情**：为智能体设计简单状态（开心、困倦、想念你），在头像旁以小状态呈现，影响回复语气。

#### 4.2.4 视觉与动效

- **页面切换过渡**：路由切换淡入 / 滑入动画。
- **消息入场动画**：新消息淡入 + 轻微上移。
- **卡片列表动画**：智能体列表加载、删除、新增 stagger 动效。
- **主题一致性**：所有页面、组件、弹窗跟随 `theme-aurora` / `theme-colorful`，无硬编码颜色。
- **更多主题**：增加「暗夜」「清晨」等主题。

#### 4.2.5 对话体验升级

- **Markdown 渲染**：assistant 消息支持代码块、列表、加粗、链接，代码块可复制。
- **长文本优化**：超长回复自动折叠，支持展开。
- **引用与上下文**：长按消息引用，被引用内容进入下一轮上下文。
- **编辑用户消息**：支持修改已发送消息并重新触发回复。
- **快捷操作**：输入框上方提供常用快捷指令 / 历史快捷输入。
- **空状态升级**：根据场景给出不同插画与文案。

#### 4.2.6 触控与反馈

- 按钮、卡片、输入框增加 `active:scale` 与按压态。
- 发送/接收消息时轻微震动反馈（`navigator.vibrate`）。
- 操作结果即时反馈（删除智能体后列表动画移除）。

#### 4.2.7 性能与稳定性

- 长聊天记录虚拟滚动或分页加载。
- 图片懒加载与压缩。
- 前端路由、API 请求添加超时与重试。
- 减少不必要的全量重渲染。

#### 4.2.8 无障碍

- 关键按钮添加 `aria-label`。
- 支持键盘导航（Tab、Enter、Esc）。
- 尊重 `prefers-reduced-motion`，关闭非必要动画。

#### 4.2.9 语音消息（可选）

- 支持用户发送语音，后端转文字后进入 LLM。
- assistant 回复可合成语音返回（TTS）。

### 4.3 数据模型（第二阶段新增）

```prisma
model User {
  // ... 第一阶段字段
  memorySnapshot String   @default("") @map("memory_snapshot")
  memories       Memory[]
}

model Memory {
  id        Int      @id @default(autoincrement())
  userId    Int      @map("user_id")
  content   String
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("memories")
}
```

### 4.4 验收标准

- [ ] 进入聊天页时智能体主动发送符合性格的开场白。
- [ ] 智能体在对话中能维持一致的性格与语气，不「出戏」。
- [ ] 长期记忆正常生效，智能体能引用用户之前提过的重要信息。
- [ ] 智能体能在用户长时间未回复或每天首次打开时主动发起对话。
- [ ] 页面切换与消息发送有流畅动画，不卡顿。
- [ ] Markdown / 代码块正常渲染，移动端可读。
- [ ] 至少提供 4 套主题，切换即时生效。
- [ ] 长聊天记录滚动流畅，1000 条消息无显著掉帧。
- [ ] 支持键盘完整操作主要流程。
- [ ] Render 生产环境加载与响应速度达标（首屏 < 2s）。

---

## 5. 第三阶段：接入微信

### 5.1 目标

让用户无需打开网页，即可在微信内与 AI 好友进行多轮对话；微信端与网页端历史记录、长期记忆完全互通，智能体在微信里同样能主动问候、找话题，延续陪伴感。部署仍以 Render 为后端入口。

### 5.2 关键任务

#### 5.2.1 微信服务端接入

- **公众号/小程序服务器配置**：提供 URL、Token、EncodingAESKey 配置说明。
- **签名验证**：实现微信服务器签名验证接口（`signature` + `timestamp` + `nonce`）。
- **新增微信路由** `api/routes/wechat.ts`：
  - GET：服务器配置验证。
  - POST：接收微信推送的消息与事件。

#### 5.2.2 用户映射

- 使用微信用户 `OpenID` 作为唯一标识。
- 首次微信访问时创建对应匿名 `User`，建立 `wechatOpenId` 关联。
- 网页端登录用户可绑定微信，实现多端历史互通（可选）。

#### 5.2.3 消息接收与回复

- 解析微信 XML 消息：
  - 文本 `MsgType=text`
  - 语音 `MsgType=voice`（语音识别转文本）
  - 图片 `MsgType=image`（描述或暂不处理）
  - 事件 `MsgType=event`（关注、取关、点击菜单）
- 根据用户当前绑定的「默认智能体」或关键词选择智能体。
- 复用 `api/routes/chat.ts` 的 LLM 对话逻辑，支持两种回复模式：
  - 简单回复：5 秒内直接返回微信 XML 响应。
  - 复杂回复：先返回空响应，再通过「客服消息」接口异步推送结果。
- 用户消息与 assistant 回复统一存入 `chat_messages`，网页端可见。

#### 5.2.4 智能体路由与入口

- 每个智能体可生成独立微信入口（菜单关键词、带参二维码、网页链接）。
- 支持通过关键词切换当前默认智能体（如发送「切换 xxx」）。
- 网页端可设置哪些智能体对微信开放。

#### 5.2.5 微信特色能力

- 关注公众号时发送欢迎语与可选 AI 好友列表。
- 菜单点击直达常用智能体。
- **主动推送**：获得用户许可后，智能体可在特定时间（早上好、晚安）通过客服消息主动问候；问候内容基于长期记忆生成。
- 语音输入支持（微信语音识别或自行 ASR）。
- 错误/超时消息以客服消息形式告知用户。

#### 5.2.6 安全与稳定性

- 验证微信请求签名，防止伪造。
- 消息幂等去重（按 `MsgId` 或自定义去重键）。
- 微信 API 调用添加超时、重试、降级（回复固定提示语）。
- 微信消息队列或限流，避免高频消息打爆后端。

### 5.3 数据模型（第三阶段新增）

```prisma
model WechatBinding {
  id        Int      @id @default(autoincrement())
  openId    String   @unique
  userId    Int      @unique
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("wechat_bindings")
}
```

- 在 `users` 表补充 `defaultAgentId`，表示微信默认对话智能体。

### 5.4 新增 API

| 方法 | 路径 | 说明 |
|---|---|---|
| GET/POST | `/api/wechat` | 微信服务器验证与消息接收 |
| POST | `/api/wechat/message` | 主动推送客服消息（内部调用） |

### 5.5 验收标准

- [ ] 微信公众号/小程序服务器配置验证通过，Render 域名可正常接收微信推送。
- [ ] 用户在微信内发送文字，5 秒内收到符合角色性格的回复。
- [ ] 多轮对话上下文连续，长期记忆在微信与网页端互通。
- [ ] 可通过关键词或菜单切换智能体。
- [ ] 智能体可在微信内主动发送问候/找话题消息。
- [ ] 微信请求签名验证、消息去重、超时降级均生效。
- [ ] 生产环境能稳定处理并发消息。

---

## 6. 里程碑建议

| 阶段 | 里程碑 | Render 部署目标 |
|---|---|---|
| 第一阶段 | 核心链路跑通，可创建 AI 好友并稳定聊天 | 部署到 Render，通过健康检查 |
| 第二阶段 | UI/UX 打磨完成，AI 好友感达标 | Render 生产环境性能达标 |
| 第三阶段 | 微信公众号上线，用户可在微信内聊天 | Render 域名接入微信服务器配置 |

> 每个阶段结束时都应在 Render 上有一个可访问的版本。

---

## 7. 风险与依赖

| 风险 | 影响 | 应对 |
|---|---|---|
| 微信资质/公众号审核 | 第三阶段无法测试 | 提前注册并申请公众号/小程序，准备测试号 |
| 各家 LLM API 差异大 | 多模型支持困难 | 优先统一 OpenAI 兼容格式，特殊字段做适配层 |
| API Key 由用户自填 | 易出现余额/权限问题 | 错误提示要具体，引导用户检查 Key |
| 长聊天记录性能 | 第二阶段卡顿 | 提前规划分页/虚拟滚动 |
| 消息并发与超时 | 微信用户体验差 | 引入异步客服消息与降级提示 |

---

## 8. 附录

### 8.1 环境变量

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/lingban?schema=public
NODE_ENV=development
PORT=3001
```

第三阶段需新增：

```bash
WECHAT_APP_ID=xxx
WECHAT_TOKEN=xxx
WECHAT_ENCODING_AES_KEY=xxx
WECHAT_SECRET=xxx
```

### 8.2 常用命令

```bash
# 本地开发
pnpm install
npx prisma generate
npx prisma migrate dev
pnpm dev

# 构建与检查
pnpm lint
pnpm check
pnpm build

# 生产启动
NODE_ENV=production pnpm start
```

---

## 9. 结语

本开发文档以「先可用、再好用、再扩展」为节奏，把「灵伴」从一个空白工程逐步打磨成像 Character.AI 那样有陪伴感的 AI 好友应用。每个阶段都以 Render 作为默认生产部署目标，并有明确的验收标准，便于按里程碑推进、持续在真实用户环境中验证。
# 灵伴 AI 好友 -# 灵伴 AI 好友 - 三阶段开发文档

> 版本：v1.0
> 当前状态：第一阶段核心代码已完成，待完善与部署
> 部署目标：Render
> 代码分支：main（默认分支）

---

## 0. 文档说明

本文档是「灵伴 AI 好友」项目的开发路线图，按三个阶段递进式推进：

- **第一阶段**：完善核心链路 + 成功部署到 Render
- **第二阶段**：深化 AI 好友感 + 打磨用户体验
- **第三阶段**：接入微信 + 跨端互通

每个阶段都有明确的目标、任务清单和验收标准，阶段结束时 `main` 分支上的代码都应能成功部署到# 灵伴 AI 好友 - 三阶段开发文档

> 版本：v1.0
> 当前状态：第一阶段核心代码已完成，待完善与部署
> 部署目标：Render
> 代码分支：main（默认分支）

---

## 0. 文档说明

本文档是「灵伴 AI 好友」项目的开发路线图，按三个阶段递进式推进：

- **第一阶段**：完善核心链路 + 成功部署到 Render
- **第二阶段**：深化 AI 好友感 + 打磨用户体验
- **第三阶段**：接入微信 + 跨端互通

每个阶段都有明确的目标、任务清单和验收标准，阶段结束时 `main` 分支上的代码都应能成功部署到 Render。

### Git 工作流约定

> **重要：所有开发和修改都直接# 灵伴 AI 好友 - 三阶段开发文档

> 版本：v1.0
> 当前状态：第一阶段核心代码已完成，待完善与部署
> 部署目标：Render
> 代码分支：main（默认分支）

---

## 0. 文档说明

本文档是「灵伴 AI 好友」项目的开发路线图，按三个阶段递进式推进：

- **第一阶段**：完善核心链路 + 成功部署到 Render
- **第二阶段**：深化 AI 好友感 + 打磨用户体验
- **第三阶段**：接入微信 + 跨端互通

每个阶段都有明确的目标、任务清单和验收标准，阶段结束时 `main` 分支上的代码都应能成功部署到 Render。

### Git 工作流约定

> **重要：所有开发和修改都直接在 `main` 分支上进行，每次完成后推送到远程 `main` 分支。**

```bash
# 查看当前状态
git status

# 添加修改
git# 灵伴 AI 好友 - 三阶段开发文档

> 版本：v1.0
> 当前状态：第一阶段核心代码已完成，待完善与部署
> 部署目标：Render
> 代码分支：main（默认分支）

---

## 0. 文档说明

本文档是「灵伴 AI 好友」项目的开发路线图，按三个阶段递进式推进：

- **第一阶段**：完善核心链路 + 成功部署到 Render
- **第二阶段**：深化 AI 好友感 + 打磨用户体验
- **第三阶段**：接入微信 + 跨端互通

每个阶段都有明确的目标、任务清单和验收标准，阶段结束时 `main` 分支上的代码都应能成功部署到 Render。

### Git 工作流约定

> **重要：所有开发和修改都直接在 `main` 分支上进行，每次完成后推送到远程 `main` 分支。**

```bash
# 查看当前状态
git status

# 添加修改
git add .

# 提交（使用有意义的提交信息）
git commit -m "feat: 添加 xxx 功能"
git commit -m "fix: 修复 xxx 问题"
git commit -m "refactor: 重构 xxx 模块"

# 推送到远程 main 分支
git push origin main
```

Render 会自动监听 `main` 分支的推送，触发自动部署。

---

## 1. 项目总览

### 1.1 产品定位

「灵伴」是一个 **AI 好友 / 角色陪伴** 应用。每个智能体都像用户拥有的一位虚拟朋友：有鲜明性格、背景、说话方式，# 灵伴 AI 好友 - 三阶段开发文档

> 版本：v1.0
> 当前状态：第一阶段核心代码已完成，待完善与部署
> 部署目标：Render
> 代码分支：main（默认分支）

---

## 0. 文档说明

本文档是「灵伴 AI 好友」项目的开发路线图，按三个阶段递进式推进：

- **第一阶段**：完善核心链路 + 成功部署到 Render
- **第二阶段**：深化 AI 好友感 + 打磨用户体验
- **第三阶段**：接入微信 + 跨端互通

每个阶段都有明确的目标、任务清单和验收标准，阶段结束时 `main` 分支上的代码都应能成功部署到 Render。

### Git 工作流约定

> **重要：所有开发和修改都直接在 `main` 分支上进行，每次完成后推送到远程 `main` 分支。**

```bash
# 查看当前状态
git status

# 添加修改
git add .

# 提交（使用有意义的提交信息）
git commit -m "feat: 添加 xxx 功能"
git commit -m "fix: 修复 xxx 问题"
git commit -m "refactor: 重构 xxx 模块"

# 推送到远程 main 分支
git push origin main
```

Render 会自动监听 `main` 分支的推送，触发自动部署。

---

## 1. 项目总览

### 1.1 产品定位

「灵伴」是一个 **AI 好友 / 角色陪伴** 应用。每个智能体都像用户拥有的一位虚拟朋友：有鲜明性格、背景、说话方式，会主动关心用户、找话题聊天。用户无需注册即可匿名使用，可创建多个不同# 灵伴 AI 好友 - 三阶段开发文档

> 版本：v1.0
> 当前状态：第一阶段核心代码已完成，待完善与部署
> 部署目标：Render
> 代码分支：main（默认分支）

---

## 0. 文档说明

本文档是「灵伴 AI 好友」项目的开发路线图，按三个阶段递进式推进：

- **第一阶段**：完善核心链路 + 成功部署到 Render
- **第二阶段**：深化 AI 好友感 + 打磨用户体验
- **第三阶段**：接入微信 + 跨端互通

每个阶段都有明确的目标、任务清单和验收标准，阶段结束时 `main` 分支上的代码都应能成功部署到 Render。

### Git 工作流约定

> **重要：所有开发和修改都直接在 `main` 分支上进行，每次完成后推送到远程 `main` 分支。**

```bash
# 查看当前状态
git status

# 添加修改
git add .

# 提交（使用有意义的提交信息）
git commit -m "feat: 添加 xxx 功能"
git commit -m "fix: 修复 xxx 问题"
git commit -m "refactor: 重构 xxx 模块"

# 推送到远程 main 分支
git push origin main
```

Render 会自动监听 `main` 分支的推送，触发自动部署。

---

## 1. 项目总览

### 1.1 产品定位

「灵伴」是一个 **AI 好友 / 角色陪伴** 应用。每个智能体都像用户拥有的一位虚拟朋友：有鲜明性格、背景、说话方式，会主动关心用户、找话题聊天。用户无需注册即可匿名使用，可创建多个不同性格的 AI 好友。

### 1.2 技术栈

| 层 |# 灵伴 AI 好友 - 三阶段开发文档

> 版本：v1.0
> 当前状态：第一阶段核心代码已完成，待完善与部署
> 部署目标：Render
> 代码分支：main（默认分支）

---

## 0. 文档说明

本文档是「灵伴 AI 好友」项目的开发路线图，按三个阶段递进式推进：

- **第一阶段**：完善核心链路 + 成功部署到 Render
- **第二阶段**：深化 AI 好友感 + 打磨用户体验
- **第三阶段**：接入微信 + 跨端互通

每个阶段都有明确的目标、任务清单和验收标准，阶段结束时 `main` 分支上的代码都应能成功部署到 Render。

### Git 工作流约定

> **重要：所有开发和修改都直接在 `main` 分支上进行，每次完成后推送到远程 `main` 分支。**

```bash
# 查看当前状态
git status

# 添加修改
git add .

# 提交（使用有意义的提交信息）
git commit -m "feat: 添加 xxx 功能"
git commit -m "fix: 修复 xxx 问题"
git commit -m "refactor: 重构 xxx 模块"

# 推送到远程 main 分支
git push origin main
```

Render 会自动监听 `main` 分支的推送，触发自动部署。

---

## 1. 项目总览

### 1.1 产品定位

「灵伴」是一个 **AI 好友 / 角色陪伴** 应用。每个智能体都像用户拥有的一位虚拟朋友：有鲜明性格、背景、说话方式，会主动关心用户、找话题聊天。用户无需注册即可匿名使用，可创建多个不同性格的 AI 好友。

### 1.2 技术栈

| 层 | 选型 | 说明 |
|---|---|---|
| 前端 | React 18# 灵伴 AI 好友 - 三阶段开发文档

> 版本：v1.0
> 当前状态：第一阶段核心代码已完成，待完善与部署
> 部署目标：Render
> 代码分支：main（默认分支）

---

## 0. 文档说明

本文档是「灵伴 AI 好友」项目的开发路线图，按三个阶段递进式推进：

- **第一阶段**：完善核心链路 + 成功部署到 Render
- **第二阶段**：深化 AI 好友感 + 打磨用户体验
- **第三阶段**：接入微信 + 跨端互通

每个阶段都有明确的目标、任务清单和验收标准，阶段结束时 `main` 分支上的代码都应能成功部署到 Render。

### Git 工作流约定

> **重要：所有开发和修改都直接在 `main` 分支上进行，每次完成后推送到远程 `main` 分支。**

```bash
# 查看当前状态
git status

# 添加修改
git add .

# 提交（使用有意义的提交信息）
git commit -m "feat: 添加 xxx 功能"
git commit -m "fix: 修复 xxx 问题"
git commit -m "refactor: 重构 xxx 模块"

# 推送到远程 main 分支
git push origin main
```

Render 会自动监听 `main` 分支的推送，触发自动部署。

---

## 1. 项目总览

### 1.1 产品定位

「灵伴」是一个 **AI 好友 / 角色陪伴** 应用。每个智能体都像用户拥有的一位虚拟朋友：有鲜明性格、背景、说话方式，会主动关心用户、找话题聊天。用户无需注册即可匿名使用，可创建多个不同性格的 AI 好友。

### 1.2 技术栈

| 层 | 选型 | 说明 |
|---|---|---|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS + Zustand + React Router | 移动端优先# 灵伴 AI 好友 - 三阶段开发文档

> 版本：v1.0
> 当前状态：第一阶段核心代码已完成，待完善与部署
> 部署目标：Render
> 代码分支：main（默认分支）

---

## 0. 文档说明

本文档是「灵伴 AI 好友」项目的开发路线图，按三个阶段递进式推进：

- **第一阶段**：完善核心链路 + 成功部署到 Render
- **第二阶段**：深化 AI 好友感 + 打磨用户体验
- **第三阶段**：接入微信 + 跨端互通

每个阶段都有明确的目标、任务清单和验收标准，阶段结束时 `main` 分支上的代码都应能成功部署到 Render。

### Git 工作流约定

> **重要：所有开发和修改都直接在 `main` 分支上进行，每次完成后推送到远程 `main` 分支。**

```bash
# 查看当前状态
git status

# 添加修改
git add .

# 提交（使用有意义的提交信息）
git commit -m "feat: 添加 xxx 功能"
git commit -m "fix: 修复 xxx 问题"
git commit -m "refactor: 重构 xxx 模块"

# 推送到远程 main 分支
git push origin main
```

Render 会自动监听 `main` 分支的推送，触发自动部署。

---

## 1. 项目总览

### 1.1 产品定位

「灵伴」是一个 **AI 好友 / 角色陪伴** 应用。每个智能体都像用户拥有的一位虚拟朋友：有鲜明性格、背景、说话方式，会主动关心用户、找话题聊天。用户无需注册即可匿名使用，可创建多个不同性格的 AI 好友。

### 1.2 技术栈

| 层 | 选型 | 说明 |
|---|---|---|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS + Zustand + React Router | 移动端优先，单页应用 |
| 后端 | Express 4 + TypeScript（ESM） |# 灵伴 AI 好友 - 三阶段开发文档

> 版本：v1.0
> 当前状态：第一阶段核心代码已完成，待完善与部署
> 部署目标：Render
> 代码分支：main（默认分支）

---

## 0. 文档说明

本文档是「灵伴 AI 好友」项目的开发路线图，按三个阶段递进式推进：

- **第一阶段**：完善核心链路 + 成功部署到 Render
- **第二阶段**：深化 AI 好友感 + 打磨用户体验
- **第三阶段**：接入微信 + 跨端互通

每个阶段都有明确的目标、任务清单和验收标准，阶段结束时 `main` 分支上的代码都应能成功部署到 Render。

### Git 工作流约定

> **重要：所有开发和修改都直接在 `main` 分支上进行，每次完成后推送到远程 `main` 分支。**

```bash
# 查看当前状态
git status

# 添加修改
git add .

# 提交（使用有意义的提交信息）
git commit -m "feat: 添加 xxx 功能"
git commit -m "fix: 修复 xxx 问题"
git commit -m "refactor: 重构 xxx 模块"

# 推送到远程 main 分支
git push origin main
```

Render 会自动监听 `main` 分支的推送，触发自动部署。

---

## 1. 项目总览

### 1.1 产品定位

「灵伴」是一个 **AI 好友 / 角色陪伴** 应用。每个智能体都像用户拥有的一位虚拟朋友：有鲜明性格、背景、说话方式，会主动关心用户、找话题聊天。用户无需注册即可匿名使用，可创建多个不同性格的 AI 好友。

### 1.2 技术栈

| 层 | 选型 | 说明 |
|---|---|---|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS + Zustand + React Router | 移动端优先，单页应用 |
| 后端 | Express 4 + TypeScript（ESM） | REST + SSE 流式 |
| 数据库 | PostgreSQL + Prisma ORM v7# 灵伴 AI 好友 - 三阶段开发文档

> 版本：v1.0
> 当前状态：第一阶段核心代码已完成，待完善与部署
> 部署目标：Render
> 代码分支：main（默认分支）

---

## 0. 文档说明

本文档是「灵伴 AI 好友」项目的开发路线图，按三个阶段递进式推进：

- **第一阶段**：完善核心链路 + 成功部署到 Render
- **第二阶段**：深化 AI 好友感 + 打磨用户体验
- **第三阶段**：接入微信 + 跨端互通

每个阶段都有明确的目标、任务清单和验收标准，阶段结束时 `main` 分支上的代码都应能成功部署到 Render。

### Git 工作流约定

> **重要：所有开发和修改都直接在 `main` 分支上进行，每次完成后推送到远程 `main` 分支。**

```bash
# 查看当前状态
git status

# 添加修改
git add .

# 提交（使用有意义的提交信息）
git commit -m "feat: 添加 xxx 功能"
git commit -m "fix: 修复 xxx 问题"
git commit -m "refactor: 重构 xxx 模块"

# 推送到远程 main 分支
git push origin main
```

Render 会自动监听 `main` 分支的推送，触发自动部署。

---

## 1. 项目总览

### 1.1 产品定位

「灵伴」是一个 **AI 好友 / 角色陪伴** 应用。每个智能体都像用户拥有的一位虚拟朋友：有鲜明性格、背景、说话方式，会主动关心用户、找话题聊天。用户无需注册即可匿名使用，可创建多个不同性格的 AI 好友。

### 1.2 技术栈

| 层 | 选型 | 说明 |
|---|---|---|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS + Zustand + React Router | 移动端优先，单页应用 |
| 后端 | Express 4 + TypeScript（ESM） | REST + SSE 流式 |
| 数据库 | PostgreSQL + Prisma ORM v7 | |
| LLM | OpenAI 兼容格式 | 支持 OpenAI / DeepSeek# 灵伴 AI 好友 - 三阶段开发文档

> 版本：v1.0
> 当前状态：第一阶段核心代码已完成，待完善与部署
> 部署目标：Render
> 代码分支：main（默认分支）

---

## 0. 文档说明

本文档是「灵伴 AI 好友」项目的开发路线图，按三个阶段递进式推进：

- **第一阶段**：完善核心链路 + 成功部署到 Render
- **第二阶段**：深化 AI 好友感 + 打磨用户体验
- **第三阶段**：接入微信 + 跨端互通

每个阶段都有明确的目标、任务清单和验收标准，阶段结束时 `main` 分支上的代码都应能成功部署到 Render。

### Git 工作流约定

> **重要：所有开发和修改都直接在 `main` 分支上进行，每次完成后推送到远程 `main` 分支。**

```bash
# 查看当前状态
git status

# 添加修改
git add .

# 提交（使用有意义的提交信息）
git commit -m "feat: 添加 xxx 功能"
git commit -m "fix: 修复 xxx 问题"
git commit -m "refactor: 重构 xxx 模块"

# 推送到远程 main 分支
git push origin main
```

Render 会自动监听 `main` 分支的推送，触发自动部署。

---

## 1. 项目总览

### 1.1 产品定位

「灵伴」是一个 **AI 好友 / 角色陪伴** 应用。每个智能体都像用户拥有的一位虚拟朋友：有鲜明性格、背景、说话方式，会主动关心用户、找话题聊天。用户无需注册即可匿名使用，可创建多个不同性格的 AI 好友。

### 1.2 技术栈

| 层 | 选型 | 说明 |
|---|---|---|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS + Zustand + React Router | 移动端优先，单页应用 |
| 后端 | Express 4 + TypeScript（ESM） | REST + SSE 流式 |
| 数据库 | PostgreSQL + Prisma ORM v7 | |
| LLM | OpenAI 兼容格式 | 支持 OpenAI / DeepSeek / 自定义端点 |
| 部署 | Render Blueprint | Web Service + PostgreSQL |

#### 灵伴 AI 好友 - 三阶段开发文档

> 版本：v1.0
> 当前状态：第一阶段核心代码已完成，待完善与部署
> 部署目标：Render
> 代码分支：main（默认分支）

---

## 0. 文档说明

本文档是「灵伴 AI 好友」项目的开发路线图，按三个阶段递进式推进：

- **第一阶段**：完善核心链路 + 成功部署到 Render
- **第二阶段**：深化 AI 好友感 + 打磨用户体验
- **第三阶段**：接入微信 + 跨端互通

每个阶段都有明确的目标、任务清单和验收标准，阶段结束时 `main` 分支上的代码都应能成功部署到 Render。

### Git 工作流约定

> **重要：所有开发和修改都直接在 `main` 分支上进行，每次完成后推送到远程 `main` 分支。**

```bash
# 查看当前状态
git status

# 添加修改
git add .

# 提交（使用有意义的提交信息）
git commit -m "feat: 添加 xxx 功能"
git commit -m "fix: 修复 xxx 问题"
git commit -m "refactor: 重构 xxx 模块"

# 推送到远程 main 分支
git push origin main
```

Render 会自动监听 `main` 分支的推送，触发自动部署。

---

## 1. 项目总览

### 1.1 产品定位

「灵伴」是一个 **AI 好友 / 角色陪伴** 应用。每个智能体都像用户拥有的一位虚拟朋友：有鲜明性格、背景、说话方式，会主动关心用户、找话题聊天。用户无需注册即可匿名使用，可创建多个不同性格的 AI 好友。

### 1.2 技术栈

| 层 | 选型 | 说明 |
|---|---|---|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS + Zustand + React Router | 移动端优先，单页应用 |
| 后端 | Express 4 + TypeScript（ESM） | REST + SSE 流式 |
| 数据库 | PostgreSQL + Prisma ORM v7 | |
| LLM | OpenAI 兼容格式 | 支持 OpenAI / DeepSeek / 自定义端点 |
| 部署 | Render Blueprint | Web Service + PostgreSQL |

### 1.3 当前项目结构

```text
/workspace
├── src/               # React# 灵伴 AI 好友 - 三阶段开发文档

> 版本：v1.0
> 当前状态：第一阶段核心代码已完成，待完善与部署
> 部署目标：Render
> 代码分支：main（默认分支）

---

## 0. 文档说明

本文档是「灵伴 AI 好友」项目的开发路线图，按三个阶段递进式推进：

- **第一阶段**：完善核心链路 + 成功部署到 Render
- **第二阶段**：深化 AI 好友感 + 打磨用户体验
- **第三阶段**：接入微信 + 跨端互通

每个阶段都有明确的目标、任务清单和验收标准，阶段结束时 `main` 分支上的代码都应能成功部署到 Render。

### Git 工作流约定

> **重要：所有开发和修改都直接在 `main` 分支上进行，每次完成后推送到远程 `main` 分支。**

```bash
# 查看当前状态
git status

# 添加修改
git add .

# 提交（使用有意义的提交信息）
git commit -m "feat: 添加 xxx 功能"
git commit -m "fix: 修复 xxx 问题"
git commit -m "refactor: 重构 xxx 模块"

# 推送到远程 main 分支
git push origin main
```

Render 会自动监听 `main` 分支的推送，触发自动部署。

---

## 1. 项目总览

### 1.1 产品定位

「灵伴」是一个 **AI 好友 / 角色陪伴** 应用。每个智能体都像用户拥有的一位虚拟朋友：有鲜明性格、背景、说话方式，会主动关心用户、找话题聊天。用户无需注册即可匿名使用，可创建多个不同性格的 AI 好友。

### 1.2 技术栈

| 层 | 选型 | 说明 |
|---|---|---|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS + Zustand + React Router | 移动端优先，单页应用 |
| 后端 | Express 4 + TypeScript（ESM） | REST + SSE 流式 |
| 数据库 | PostgreSQL + Prisma ORM v7 | |
| LLM | OpenAI 兼容格式 | 支持 OpenAI / DeepSeek / 自定义端点 |
| 部署 | Render Blueprint | Web Service + PostgreSQL |

### 1.3 当前项目结构

```text
/workspace
├── src/               # React 前端
│   ├── components/    # 通用组件
│   ├── pages/# 灵伴 AI 好友 - 三阶段开发文档

> 版本：v1.0
> 当前状态：第一阶段核心代码已完成，待完善与部署
> 部署目标：Render
> 代码分支：main（默认分支）

---

## 0. 文档说明

本文档是「灵伴 AI 好友」项目的开发路线图，按三个阶段递进式推进：

- **第一阶段**：完善核心链路 + 成功部署到 Render
- **第二阶段**：深化 AI 好友感 + 打磨用户体验
- **第三阶段**：接入微信 + 跨端互通

每个阶段都有明确的目标、任务清单和验收标准，阶段结束时 `main` 分支上的代码都应能成功部署到 Render。

### Git 工作流约定

> **重要：所有开发和修改都直接在 `main` 分支上进行，每次完成后推送到远程 `main` 分支。**

```bash
# 查看当前状态
git status

# 添加修改
git add .

# 提交（使用有意义的提交信息）
git commit -m "feat: 添加 xxx 功能"
git commit -m "fix: 修复 xxx 问题"
git commit -m "refactor: 重构 xxx 模块"

# 推送到远程 main 分支
git push origin main
```

Render 会自动监听 `main` 分支的推送，触发自动部署。

---

## 1. 项目总览

### 1.1 产品定位

「灵伴」是一个 **AI 好友 / 角色陪伴** 应用。每个智能体都像用户拥有的一位虚拟朋友：有鲜明性格、背景、说话方式，会主动关心用户、找话题聊天。用户无需注册即可匿名使用，可创建多个不同性格的 AI 好友。

### 1.2 技术栈

| 层 | 选型 | 说明 |
|---|---|---|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS + Zustand + React Router | 移动端优先，单页应用 |
| 后端 | Express 4 + TypeScript（ESM） | REST + SSE 流式 |
| 数据库 | PostgreSQL + Prisma ORM v7 | |
| LLM | OpenAI 兼容格式 | 支持 OpenAI / DeepSeek / 自定义端点 |
| 部署 | Render Blueprint | Web Service + PostgreSQL |

### 1.3 当前项目结构

```text
/workspace
├── src/               # React 前端
│   ├── components/    # 通用组件
│   ├── pages/         # 页面
│   ├── store/         # Zustand 状态
│   ├── lib# 灵伴 AI 好友 - 三阶段开发文档

> 版本：v1.0
> 当前状态：第一阶段核心代码已完成，待完善与部署
> 部署目标：Render
> 代码分支：main（默认分支）

---

## 0. 文档说明

本文档是「灵伴 AI 好友」项目的开发路线图，按三个阶段递进式推进：

- **第一阶段**：完善核心链路 + 成功部署到 Render
- **第二阶段**：深化 AI 好友感 + 打磨用户体验
- **第三阶段**：接入微信 + 跨端互通

每个阶段都有明确的目标、任务清单和验收标准，阶段结束时 `main` 分支上的代码都应能成功部署到 Render。

### Git 工作流约定

> **重要：所有开发和修改都直接在 `main` 分支上进行，每次完成后推送到远程 `main` 分支。**

```bash
# 查看当前状态
git status

# 添加修改
git add .

# 提交（使用有意义的提交信息）
git commit -m "feat: 添加 xxx 功能"
git commit -m "fix: 修复 xxx 问题"
git commit -m "refactor: 重构 xxx 模块"

# 推送到远程 main 分支
git push origin main
```

Render 会自动监听 `main` 分支的推送，触发自动部署。

---

## 1. 项目总览

### 1.1 产品定位

「灵伴」是一个 **AI 好友 / 角色陪伴** 应用。每个智能体都像用户拥有的一位虚拟朋友：有鲜明性格、背景、说话方式，会主动关心用户、找话题聊天。用户无需注册即可匿名使用，可创建多个不同性格的 AI 好友。

### 1.2 技术栈

| 层 | 选型 | 说明 |
|---|---|---|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS + Zustand + React Router | 移动端优先，单页应用 |
| 后端 | Express 4 + TypeScript（ESM） | REST + SSE 流式 |
| 数据库 | PostgreSQL + Prisma ORM v7 | |
| LLM | OpenAI 兼容格式 | 支持 OpenAI / DeepSeek / 自定义端点 |
| 部署 | Render Blueprint | Web Service + PostgreSQL |

### 1.3 当前项目结构

```text
/workspace
├── src/               # React 前端
│   ├── components/    # 通用组件
│   ├── pages/         # 页面
│   ├── store/         # Zustand 状态
│   ├── lib/           # API 封装、工具函数
│   ├── App.tsx
│   ├──# 灵伴 AI 好友 - 三阶段开发文档

> 版本：v1.0
> 当前状态：第一阶段核心代码已完成，待完善与部署
> 部署目标：Render
> 代码分支：main（默认分支）

---

## 0. 文档说明

本文档是「灵伴 AI 好友」项目的开发路线图，按三个阶段递进式推进：

- **第一阶段**：完善核心链路 + 成功部署到 Render
- **第二阶段**：深化 AI 好友感 + 打磨用户体验
- **第三阶段**：接入微信 + 跨端互通

每个阶段都有明确的目标、任务清单和验收标准，阶段结束时 `main` 分支上的代码都应能成功部署到 Render。

### Git 工作流约定

> **重要：所有开发和修改都直接在 `main` 分支上进行，每次完成后推送到远程 `main` 分支。**

```bash
# 查看当前状态
git status

# 添加修改
git add .

# 提交（使用有意义的提交信息）
git commit -m "feat: 添加 xxx 功能"
git commit -m "fix: 修复 xxx 问题"
git commit -m "refactor: 重构 xxx 模块"

# 推送到远程 main 分支
git push origin main
```

Render 会自动监听 `main` 分支的推送，触发自动部署。

---

## 1. 项目总览

### 1.1 产品定位

「灵伴」是一个 **AI 好友 / 角色陪伴** 应用。每个智能体都像用户拥有的一位虚拟朋友：有鲜明性格、背景、说话方式，会主动关心用户、找话题聊天。用户无需注册即可匿名使用，可创建多个不同性格的 AI 好友。

### 1.2 技术栈

| 层 | 选型 | 说明 |
|---|---|---|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS + Zustand + React Router | 移动端优先，单页应用 |
| 后端 | Express 4 + TypeScript（ESM） | REST + SSE 流式 |
| 数据库 | PostgreSQL + Prisma ORM v7 | |
| LLM | OpenAI 兼容格式 | 支持 OpenAI / DeepSeek / 自定义端点 |
| 部署 | Render Blueprint | Web Service + PostgreSQL |

### 1.3 当前项目结构

```text
/workspace
├── src/               # React 前端
│   ├── components/    # 通用组件
│   ├── pages/         # 页面
│   ├── store/         # Zustand 状态
│   ├── lib/           # API 封装、工具函数
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── api/               # Express 后端
# 灵伴 AI 好友 - 三阶段开发文档

> 版本：v1.0
> 当前状态：第一阶段核心代码已完成，待完善与部署
> 部署目标：Render
> 代码分支：main（默认分支）

---

## 0. 文档说明

本文档是「灵伴 AI 好友」项目的开发路线图，按三个阶段递进式推进：

- **第一阶段**：完善核心链路 + 成功部署到 Render
- **第二阶段**：深化 AI 好友感 + 打磨用户体验
- **第三阶段**：接入微信 + 跨端互通

每个阶段都有明确的目标、任务清单和验收标准，阶段结束时 `main` 分支上的代码都应能成功部署到 Render。

### Git 工作流约定

> **重要：所有开发和修改都直接在 `main` 分支上进行，每次完成后推送到远程 `main` 分支。**

```bash
# 查看当前状态
git status

# 添加修改
git add .

# 提交（使用有意义的提交信息）
git commit -m "feat: 添加 xxx 功能"
git commit -m "fix: 修复 xxx 问题"
git commit -m "refactor: 重构 xxx 模块"

# 推送到远程 main 分支
git push origin main
```

Render 会自动监听 `main` 分支的推送，触发自动部署。

---

## 1. 项目总览

### 1.1 产品定位

「灵伴」是一个 **AI 好友 / 角色陪伴** 应用。每个智能体都像用户拥有的一位虚拟朋友：有鲜明性格、背景、说话方式，会主动关心用户、找话题聊天。用户无需注册即可匿名使用，可创建多个不同性格的 AI 好友。

### 1.2 技术栈

| 层 | 选型 | 说明 |
|---|---|---|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS + Zustand + React Router | 移动端优先，单页应用 |
| 后端 | Express 4 + TypeScript（ESM） | REST + SSE 流式 |
| 数据库 | PostgreSQL + Prisma ORM v7 | |
| LLM | OpenAI 兼容格式 | 支持 OpenAI / DeepSeek / 自定义端点 |
| 部署 | Render Blueprint | Web Service + PostgreSQL |

### 1.3 当前项目结构

```text
/workspace
├── src/               # React 前端
│   ├── components/    # 通用组件
│   ├── pages/         # 页面
│   ├── store/         # Zustand 状态
│   ├── lib/           # API 封装、工具函数
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── api/               # Express 后端
│   ├── routes/        # 业务路由
│   ├── middleware/    # 鉴# 灵伴 AI 好友 - 三阶段开发文档

> 版本：v1.0
> 当前状态：第一阶段核心代码已完成，待完善与部署
> 部署目标：Render
> 代码分支：main（默认分支）

---

## 0. 文档说明

本文档是「灵伴 AI 好友」项目的开发路线图，按三个阶段递进式推进：

- **第一阶段**：完善核心链路 + 成功部署到 Render
- **第二阶段**：深化 AI 好友感 + 打磨用户体验
- **第三阶段**：接入微信 + 跨端互通

每个阶段都有明确的目标、任务清单和验收标准，阶段结束时 `main` 分支上的代码都应能成功部署到 Render。

### Git 工作流约定

> **重要：所有开发和修改都直接在 `main` 分支上进行，每次完成后推送到远程 `main` 分支。**

```bash
# 查看当前状态
git status

# 添加修改
git add .

# 提交（使用有意义的提交信息）
git commit -m "feat: 添加 xxx 功能"
git commit -m "fix: 修复 xxx 问题"
git commit -m "refactor: 重构 xxx 模块"

# 推送到远程 main 分支
git push origin main
```

Render 会自动监听 `main` 分支的推送，触发自动部署。

---

## 1. 项目总览

### 1.1 产品定位

「灵伴」是一个 **AI 好友 / 角色陪伴** 应用。每个智能体都像用户拥有的一位虚拟朋友：有鲜明性格、背景、说话方式，会主动关心用户、找话题聊天。用户无需注册即可匿名使用，可创建多个不同性格的 AI 好友。

### 1.2 技术栈

| 层 | 选型 | 说明 |
|---|---|---|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS + Zustand + React Router | 移动端优先，单页应用 |
| 后端 | Express 4 + TypeScript（ESM） | REST + SSE 流式 |
| 数据库 | PostgreSQL + Prisma ORM v7 | |
| LLM | OpenAI 兼容格式 | 支持 OpenAI / DeepSeek / 自定义端点 |
| 部署 | Render Blueprint | Web Service + PostgreSQL |

### 1.3 当前项目结构

```text
/workspace
├── src/               # React 前端
│   ├── components/    # 通用组件
│   ├── pages/         # 页面
│   ├── store/         # Zustand 状态
│   ├── lib/           # API 封装、工具函数
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── api/               # Express 后端
│   ├── routes/        # 业务路由
│   ├── middleware/    # 鉴权
│   ├── lib/           # prisma、llm 适配器
│   ├──# 灵伴 AI 好友 - 三阶段开发文档

> 版本：v1.0
> 当前状态：第一阶段核心代码已完成，待完善与部署
> 部署目标：Render
> 代码分支：main（默认分支）

---

## 0. 文档说明

本文档是「灵伴 AI 好友」项目的开发路线图，按三个阶段递进式推进：

- **第一阶段**：完善核心链路 + 成功部署到 Render
- **第二阶段**：深化 AI 好友感 + 打磨用户体验
- **第三阶段**：接入微信 + 跨端互通

每个阶段都有明确的目标、任务清单和验收标准，阶段结束时 `main` 分支上的代码都应能成功部署到 Render。

### Git 工作流约定

> **重要：所有开发和修改都直接在 `main` 分支上进行，每次完成后推送到远程 `main` 分支。**

```bash
# 查看当前状态
git status

# 添加修改
git add .

# 提交（使用有意义的提交信息）
git commit -m "feat: 添加 xxx 功能"
git commit -m "fix: 修复 xxx 问题"
git commit -m "refactor: 重构 xxx 模块"

# 推送到远程 main 分支
git push origin main
```

Render 会自动监听 `main` 分支的推送，触发自动部署。

---

## 1. 项目总览

### 1.1 产品定位

「灵伴」是一个 **AI 好友 / 角色陪伴** 应用。每个智能体都像用户拥有的一位虚拟朋友：有鲜明性格、背景、说话方式，会主动关心用户、找话题聊天。用户无需注册即可匿名使用，可创建多个不同性格的 AI 好友。

### 1.2 技术栈

| 层 | 选型 | 说明 |
|---|---|---|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS + Zustand + React Router | 移动端优先，单页应用 |
| 后端 | Express 4 + TypeScript（ESM） | REST + SSE 流式 |
| 数据库 | PostgreSQL + Prisma ORM v7 | |
| LLM | OpenAI 兼容格式 | 支持 OpenAI / DeepSeek / 自定义端点 |
| 部署 | Render Blueprint | Web Service + PostgreSQL |

### 1.3 当前项目结构

```text
/workspace
├── src/               # React 前端
│   ├── components/    # 通用组件
│   ├── pages/         # 页面
│   ├── store/         # Zustand 状态
│   ├── lib/           # API 封装、工具函数
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── api/               # Express 后端
│   ├── routes/        # 业务路由
│   ├── middleware/    # 鉴权
│   ├── lib/           # prisma、llm 适配器
│   ├── types/         # 类型声明
│   ├── app.ts
│   └── server.ts# 灵伴 AI 好友 - 三阶段开发文档

> 版本：v1.0
> 当前状态：第一阶段核心代码已完成，待完善与部署
> 部署目标：Render
> 代码分支：main（默认分支）

---

## 0. 文档说明

本文档是「灵伴 AI 好友」项目的开发路线图，按三个阶段递进式推进：

- **第一阶段**：完善核心链路 + 成功部署到 Render
- **第二阶段**：深化 AI 好友感 + 打磨用户体验
- **第三阶段**：接入微信 + 跨端互通

每个阶段都有明确的目标、任务清单和验收标准，阶段结束时 `main` 分支上的代码都应能成功部署到 Render。

### Git 工作流约定

> **重要：所有开发和修改都直接在 `main` 分支上进行，每次完成后推送到远程 `main` 分支。**

```bash
# 查看当前状态
git status

# 添加修改
git add .

# 提交（使用有意义的提交信息）
git commit -m "feat: 添加 xxx 功能"
git commit -m "fix: 修复 xxx 问题"
git commit -m "refactor: 重构 xxx 模块"

# 推送到远程 main 分支
git push origin main
```

Render 会自动监听 `main` 分支的推送，触发自动部署。

---

## 1. 项目总览

### 1.1 产品定位

「灵伴」是一个 **AI 好友 / 角色陪伴** 应用。每个智能体都像用户拥有的一位虚拟朋友：有鲜明性格、背景、说话方式，会主动关心用户、找话题聊天。用户无需注册即可匿名使用，可创建多个不同性格的 AI 好友。

### 1.2 技术栈

| 层 | 选型 | 说明 |
|---|---|---|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS + Zustand + React Router | 移动端优先，单页应用 |
| 后端 | Express 4 + TypeScript（ESM） | REST + SSE 流式 |
| 数据库 | PostgreSQL + Prisma ORM v7 | |
| LLM | OpenAI 兼容格式 | 支持 OpenAI / DeepSeek / 自定义端点 |
| 部署 | Render Blueprint | Web Service + PostgreSQL |

### 1.3 当前项目结构

```text
/workspace
├── src/               # React 前端
│   ├── components/    # 通用组件
│   ├── pages/         # 页面
│   ├── store/         # Zustand 状态
│   ├── lib/           # API 封装、工具函数
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── api/               # Express 后端
│   ├── routes/        # 业务路由
│   ├── middleware/    # 鉴权
│   ├── lib/           # prisma、llm 适配器
│   ├── types/         # 类型声明
│   ├── app.ts
│   └── server.ts
├── prisma/            # Schema 与迁移
├── public/            # 静态资源# 灵伴 AI 好友 - 三阶段开发文档

> 版本：v1.0
> 当前状态：第一阶段核心代码已完成，待完善与部署
> 部署目标：Render
> 代码分支：main（默认分支）

---

## 0. 文档说明

本文档是「灵伴 AI 好友」项目的开发路线图，按三个阶段递进式推进：

- **第一阶段**：完善核心链路 + 成功部署到 Render
- **第二阶段**：深化 AI 好友感 + 打磨用户体验
- **第三阶段**：接入微信 + 跨端互通

每个阶段都有明确的目标、任务清单和验收标准，阶段结束时 `main` 分支上的代码都应能成功部署到 Render。

### Git 工作流约定

> **重要：所有开发和修改都直接在 `main` 分支上进行，每次完成后推送到远程 `main` 分支。**

```bash
# 查看当前状态
git status

# 添加修改
git add .

# 提交（使用有意义的提交信息）
git commit -m "feat: 添加 xxx 功能"
git commit -m "fix: 修复 xxx 问题"
git commit -m "refactor: 重构 xxx 模块"

# 推送到远程 main 分支
git push origin main
```

Render 会自动监听 `main` 分支的推送，触发自动部署。

---

## 1. 项目总览

### 1.1 产品定位

「灵伴」是一个 **AI 好友 / 角色陪伴** 应用。每个智能体都像用户拥有的一位虚拟朋友：有鲜明性格、背景、说话方式，会主动关心用户、找话题聊天。用户无需注册即可匿名使用，可创建多个不同性格的 AI 好友。

### 1.2 技术栈

| 层 | 选型 | 说明 |
|---|---|---|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS + Zustand + React Router | 移动端优先，单页应用 |
| 后端 | Express 4 + TypeScript（ESM） | REST + SSE 流式 |
| 数据库 | PostgreSQL + Prisma ORM v7 | |
| LLM | OpenAI 兼容格式 | 支持 OpenAI / DeepSeek / 自定义端点 |
| 部署 | Render Blueprint | Web Service + PostgreSQL |

### 1.3 当前项目结构

```text
/workspace
├── src/               # React 前端
│   ├── components/    # 通用组件
│   ├── pages/         # 页面
│   ├── store/         # Zustand 状态
│   ├── lib/           # API 封装、工具函数
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── api/               # Express 后端
│   ├── routes/        # 业务路由
│   ├── middleware/    # 鉴权
│   ├── lib/           # prisma、llm 适配器
│   ├── types/         # 类型声明
│   ├── app.ts
│   └── server.ts
├── prisma/            # Schema 与迁移
├── public/            # 静态资源
├── scripts/           # 维护脚本
├── render.yaml        # Render Blueprint 配置
# 灵伴 AI 好友 - 三阶段开发文档

> 版本：v1.0
> 当前状态：第一阶段核心代码已完成，待完善与部署
> 部署目标：Render
> 代码分支：main（默认分支）

---

## 0. 文档说明

本文档是「灵伴 AI 好友」项目的开发路线图，按三个阶段递进式推进：

- **第一阶段**：完善核心链路 + 成功部署到 Render
- **第二阶段**：深化 AI 好友感 + 打磨用户体验
- **第三阶段**：接入微信 + 跨端互通

每个阶段都有明确的目标、任务清单和验收标准，阶段结束时 `main` 分支上的代码都应能成功部署到 Render。

### Git 工作流约定

> **重要：所有开发和修改都直接在 `main` 分支上进行，每次完成后推送到远程 `main` 分支。**

```bash
# 查看当前状态
git status

# 添加修改
git add .

# 提交（使用有意义的提交信息）
git commit -m "feat: 添加 xxx 功能"
git commit -m "fix: 修复 xxx 问题"
git commit -m "refactor: 重构 xxx 模块"

# 推送到远程 main 分支
git push origin main
```

Render 会自动监听 `main` 分支的推送，触发自动部署。

---

## 1. 项目总览

### 1.1 产品定位

「灵伴」是一个 **AI 好友 / 角色陪伴** 应用。每个智能体都像用户拥有的一位虚拟朋友：有鲜明性格、背景、说话方式，会主动关心用户、找话题聊天。用户无需注册即可匿名使用，可创建多个不同性格的 AI 好友。

### 1.2 技术栈

| 层 | 选型 | 说明 |
|---|---|---|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS + Zustand + React Router | 移动端优先，单页应用 |
| 后端 | Express 4 + TypeScript（ESM） | REST + SSE 流式 |
| 数据库 | PostgreSQL + Prisma ORM v7 | |
| LLM | OpenAI 兼容格式 | 支持 OpenAI / DeepSeek / 自定义端点 |
| 部署 | Render Blueprint | Web Service + PostgreSQL |

### 1.3 当前项目结构

```text
/workspace
├── src/               # React 前端
│   ├── components/    # 通用组件
│   ├── pages/         # 页面
│   ├── store/         # Zustand 状态
│   ├── lib/           # API 封装、工具函数
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── api/               # Express 后端
│   ├── routes/        # 业务路由
│   ├── middleware/    # 鉴权
│   ├── lib/           # prisma、llm 适配器
│   ├── types/         # 类型声明
│   ├── app.ts
│   └── server.ts
├── prisma/            # Schema 与迁移
├── public/            # 静态资源
├── scripts/           # 维护脚本
├── render.yaml        # Render Blueprint 配置
└── package.json
```

---

## 2. 总体路线图

|# 灵伴 AI 好友 - 三阶段开发文档

> 版本：v1.0
> 当前状态：第一阶段核心代码已完成，待完善与部署
> 部署目标：Render
> 代码分支：main（默认分支）

---

## 0. 文档说明

本文档是「灵伴 AI 好友」项目的开发路线图，按三个阶段递进式推进：

- **第一阶段**：完善核心链路 + 成功部署到 Render
- **第二阶段**：深化 AI 好友感 + 打磨用户体验
- **第三阶段**：接入微信 + 跨端互通

每个阶段都有明确的目标、任务清单和验收标准，阶段结束时 `main` 分支上的代码都应能成功部署到 Render。

### Git 工作流约定

> **重要：所有开发和修改都直接在 `main` 分支上进行，每次完成后推送到远程 `main` 分支。**

```bash
# 查看当前状态
git status

# 添加修改
git add .

# 提交（使用有意义的提交信息）
git commit -m "feat: 添加 xxx 功能"
git commit -m "fix: 修复 xxx 问题"
git commit -m "refactor: 重构 xxx 模块"

# 推送到远程 main 分支
git push origin main
```

Render 会自动监听 `main` 分支的推送，触发自动部署。

---

## 1. 项目总览

### 1.1 产品定位

「灵伴」是一个 **AI 好友 / 角色陪伴** 应用。每个智能体都像用户拥有的一位虚拟朋友：有鲜明性格、背景、说话方式，会主动关心用户、找话题聊天。用户无需注册即可匿名使用，可创建多个不同性格的 AI 好友。

### 1.2 技术栈

| 层 | 选型 | 说明 |
|---|---|---|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS + Zustand + React Router | 移动端优先，单页应用 |
| 后端 | Express 4 + TypeScript（ESM） | REST + SSE 流式 |
| 数据库 | PostgreSQL + Prisma ORM v7 | |
| LLM | OpenAI 兼容格式 | 支持 OpenAI / DeepSeek / 自定义端点 |
| 部署 | Render Blueprint | Web Service + PostgreSQL |

### 1.3 当前项目结构

```text
/workspace
├── src/               # React 前端
│   ├── components/    # 通用组件
│   ├── pages/         # 页面
│   ├── store/         # Zustand 状态
│   ├── lib/           # API 封装、工具函数
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── api/               # Express 后端
│   ├── routes/        # 业务路由
│   ├── middleware/    # 鉴权
│   ├── lib/           # prisma、llm 适配器
│   ├── types/         # 类型声明
│   ├── app.ts
│   └── server.ts
├── prisma/            # Schema 与迁移
├── public/            # 静态资源
├── scripts/           # 维护脚本
├── render.yaml        # Render Blueprint 配置
└── package.json
```

---

## 2. 总体路线图

| 阶段 | 核心目标 | 产出标准 |
|---|---|---|
| **第一阶段# 灵伴 AI 好友 - 三阶段开发文档

> 版本：v1.0
> 当前状态：第一阶段核心代码已完成，待完善与部署
> 部署目标：Render
> 代码分支：main（默认分支）

---

## 0. 文档说明

本文档是「灵伴 AI 好友」项目的开发路线图，按三个阶段递进式推进：

- **第一阶段**：完善核心链路 + 成功部署到 Render
- **第二阶段**：深化 AI 好友感 + 打磨用户体验
- **第三阶段**：接入微信 + 跨端互通

每个阶段都有明确的目标、任务清单和验收标准，阶段结束时 `main` 分支上的代码都应能成功部署到 Render。

### Git 工作流约定

> **重要：所有开发和修改都直接在 `main` 分支上进行，每次完成后推送到远程 `main` 分支。**

```bash
# 查看当前状态
git status

# 添加修改
git add .

# 提交（使用有意义的提交信息）
git commit -m "feat: 添加 xxx 功能"
git commit -m "fix: 修复 xxx 问题"
git commit -m "refactor: 重构 xxx 模块"

# 推送到远程 main 分支
git push origin main
```

Render 会自动监听 `main` 分支的推送，触发自动部署。

---

## 1. 项目总览

### 1.1 产品定位

「灵伴」是一个 **AI 好友 / 角色陪伴** 应用。每个智能体都像用户拥有的一位虚拟朋友：有鲜明性格、背景、说话方式，会主动关心用户、找话题聊天。用户无需注册即可匿名使用，可创建多个不同性格的 AI 好友。

### 1.2 技术栈

| 层 | 选型 | 说明 |
|---|---|---|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS + Zustand + React Router | 移动端优先，单页应用 |
| 后端 | Express 4 + TypeScript（ESM） | REST + SSE 流式 |
| 数据库 | PostgreSQL + Prisma ORM v7 | |
| LLM | OpenAI 兼容格式 | 支持 OpenAI / DeepSeek / 自定义端点 |
| 部署 | Render Blueprint | Web Service + PostgreSQL |

### 1.3 当前项目结构

```text
/workspace
├── src/               # React 前端
│   ├── components/    # 通用组件
│   ├── pages/         # 页面
│   ├── store/         # Zustand 状态
│   ├── lib/           # API 封装、工具函数
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── api/               # Express 后端
│   ├── routes/        # 业务路由
│   ├── middleware/    # 鉴权
│   ├── lib/           # prisma、llm 适配器
│   ├── types/         # 类型声明
│   ├── app.ts
│   └── server.ts
├── prisma/            # Schema 与迁移
├── public/            # 静态资源
├── scripts/           # 维护脚本
├── render.yaml        # Render Blueprint 配置
└── package.json
```

---

## 2. 总体路线图

| 阶段 | 核心目标 | 产出标准 |
|---|---|---|
| **第一阶段** | 核心链路完善 + 稳定部署 | 修复问题、完善功能、Render# 灵伴 AI 好友 - 三阶段开发文档

> 版本：v1.0
> 当前状态：第一阶段核心代码已完成，待完善与部署
> 部署目标：Render
> 代码分支：main（默认分支）

---

## 0. 文档说明

本文档是「灵伴 AI 好友」项目的开发路线图，按三个阶段递进式推进：

- **第一阶段**：完善核心链路 + 成功部署到 Render
- **第二阶段**：深化 AI 好友感 + 打磨用户体验
- **第三阶段**：接入微信 + 跨端互通

每个阶段都有明确的目标、任务清单和验收标准，阶段结束时 `main` 分支上的代码都应能成功部署到 Render。

### Git 工作流约定

> **重要：所有开发和修改都直接在 `main` 分支上进行，每次完成后推送到远程 `main` 分支。**

```bash
# 查看当前状态
git status

# 添加修改
git add .

# 提交（使用有意义的提交信息）
git commit -m "feat: 添加 xxx 功能"
git commit -m "fix: 修复 xxx 问题"
git commit -m "refactor: 重构 xxx 模块"

# 推送到远程 main 分支
git push origin main
```

Render 会自动监听 `main` 分支的推送，触发自动部署。

---

## 1. 项目总览

### 1.1 产品定位

「灵伴」是一个 **AI 好友 / 角色陪伴** 应用。每个智能体都像用户拥有的一位虚拟朋友：有鲜明性格、背景、说话方式，会主动关心用户、找话题聊天。用户无需注册即可匿名使用，可创建多个不同性格的 AI 好友。

### 1.2 技术栈

| 层 | 选型 | 说明 |
|---|---|---|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS + Zustand + React Router | 移动端优先，单页应用 |
| 后端 | Express 4 + TypeScript（ESM） | REST + SSE 流式 |
| 数据库 | PostgreSQL + Prisma ORM v7 | |
| LLM | OpenAI 兼容格式 | 支持 OpenAI / DeepSeek / 自定义端点 |
| 部署 | Render Blueprint | Web Service + PostgreSQL |

### 1.3 当前项目结构

```text
/workspace
├── src/               # React 前端
│   ├── components/    # 通用组件
│   ├── pages/         # 页面
│   ├── store/         # Zustand 状态
│   ├── lib/           # API 封装、工具函数
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── api/               # Express 后端
│   ├── routes/        # 业务路由
│   ├── middleware/    # 鉴权
│   ├── lib/           # prisma、llm 适配器
│   ├── types/         # 类型声明
│   ├── app.ts
│   └── server.ts
├── prisma/            # Schema 与迁移
├── public/            # 静态资源
├── scripts/           # 维护脚本
├── render.yaml        # Render Blueprint 配置
└── package.json
```

---

## 2. 总体路线图

| 阶段 | 核心目标 | 产出标准 |
|---|---|---|
| **第一阶段** | 核心链路完善 + 稳定部署 | 修复问题、完善功能、Render 部署成功并可用 |
| **第二阶段** | AI 好友感 + 体验打磨# 灵伴 AI 好友 - 三阶段开发文档

> 版本：v1.0
> 当前状态：第一阶段核心代码已完成，待完善与部署
> 部署目标：Render
> 代码分支：main（默认分支）

---

## 0. 文档说明

本文档是「灵伴 AI 好友」项目的开发路线图，按三个阶段递进式推进：

- **第一阶段**：完善核心链路 + 成功部署到 Render
- **第二阶段**：深化 AI 好友感 + 打磨用户体验
- **第三阶段**：接入微信 + 跨端互通

每个阶段都有明确的目标、任务清单和验收标准，阶段结束时 `main` 分支上的代码都应能成功部署到 Render。

### Git 工作流约定

> **重要：所有开发和修改都直接在 `main` 分支上进行，每次完成后推送到远程 `main` 分支。**

```bash
# 查看当前状态
git status

# 添加修改
git add .

# 提交（使用有意义的提交信息）
git commit -m "feat: 添加 xxx 功能"
git commit -m "fix: 修复 xxx 问题"
git commit -m "refactor: 重构 xxx 模块"

# 推送到远程 main 分支
git push origin main
```

Render 会自动监听 `main` 分支的推送，触发自动部署。

---

## 1. 项目总览

### 1.1 产品定位

「灵伴」是一个 **AI 好友 / 角色陪伴** 应用。每个智能体都像用户拥有的一位虚拟朋友：有鲜明性格、背景、说话方式，会主动关心用户、找话题聊天。用户无需注册即可匿名使用，可创建多个不同性格的 AI 好友。

### 1.2 技术栈

| 层 | 选型 | 说明 |
|---|---|---|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS + Zustand + React Router | 移动端优先，单页应用 |
| 后端 | Express 4 + TypeScript（ESM） | REST + SSE 流式 |
| 数据库 | PostgreSQL + Prisma ORM v7 | |
| LLM | OpenAI 兼容格式 | 支持 OpenAI / DeepSeek / 自定义端点 |
| 部署 | Render Blueprint | Web Service + PostgreSQL |

### 1.3 当前项目结构

```text
/workspace
├── src/               # React 前端
│   ├── components/    # 通用组件
│   ├── pages/         # 页面
│   ├── store/         # Zustand 状态
│   ├── lib/           # API 封装、工具函数
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── api/               # Express 后端
│   ├── routes/        # 业务路由
│   ├── middleware/    # 鉴权
│   ├── lib/           # prisma、llm 适配器
│   ├── types/         # 类型声明
│   ├── app.ts
│   └── server.ts
├── prisma/            # Schema 与迁移
├── public/            # 静态资源
├── scripts/           # 维护脚本
├── render.yaml        # Render Blueprint 配置
└── package.json
```

---

## 2. 总体路线图

| 阶段 | 核心目标 | 产出标准 |
|---|---|---|
| **第一阶段** | 核心链路完善 + 稳定部署 | 修复问题、完善功能、Render 部署成功并可用 |
| **第二阶段** | AI 好友感 + 体验打磨 | 长期记忆、主动开口、角色一致、UI 顺滑 |
| **第三阶段# 灵伴 AI 好友 - 三阶段开发文档

> 版本：v1.0
> 当前状态：第一阶段核心代码已完成，待完善与部署
> 部署目标：Render
> 代码分支：main（默认分支）

---

## 0. 文档说明

本文档是「灵伴 AI 好友」项目的开发路线图，按三个阶段递进式推进：

- **第一阶段**：完善核心链路 + 成功部署到 Render
- **第二阶段**：深化 AI 好友感 + 打磨用户体验
- **第三阶段**：接入微信 + 跨端互通

每个阶段都有明确的目标、任务清单和验收标准，阶段结束时 `main` 分支上的代码都应能成功部署到 Render。

### Git 工作流约定

> **重要：所有开发和修改都直接在 `main` 分支上进行，每次完成后推送到远程 `main` 分支。**

```bash
# 查看当前状态
git status

# 添加修改
git add .

# 提交（使用有意义的提交信息）
git commit -m "feat: 添加 xxx 功能"
git commit -m "fix: 修复 xxx 问题"
git commit -m "refactor: 重构 xxx 模块"

# 推送到远程 main 分支
git push origin main
```

Render 会自动监听 `main` 分支的推送，触发自动部署。

---

## 1. 项目总览

### 1.1 产品定位

「灵伴」是一个 **AI 好友 / 角色陪伴** 应用。每个智能体都像用户拥有的一位虚拟朋友：有鲜明性格、背景、说话方式，会主动关心用户、找话题聊天。用户无需注册即可匿名使用，可创建多个不同性格的 AI 好友。

### 1.2 技术栈

| 层 | 选型 | 说明 |
|---|---|---|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS + Zustand + React Router | 移动端优先，单页应用 |
| 后端 | Express 4 + TypeScript（ESM） | REST + SSE 流式 |
| 数据库 | PostgreSQL + Prisma ORM v7 | |
| LLM | OpenAI 兼容格式 | 支持 OpenAI / DeepSeek / 自定义端点 |
| 部署 | Render Blueprint | Web Service + PostgreSQL |

### 1.3 当前项目结构

```text
/workspace
├── src/               # React 前端
│   ├── components/    # 通用组件
│   ├── pages/         # 页面
│   ├── store/         # Zustand 状态
│   ├── lib/           # API 封装、工具函数
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── api/               # Express 后端
│   ├── routes/        # 业务路由
│   ├── middleware/    # 鉴权
│   ├── lib/           # prisma、llm 适配器
│   ├── types/         # 类型声明
│   ├── app.ts
│   └── server.ts
├── prisma/            # Schema 与迁移
├── public/            # 静态资源
├── scripts/           # 维护脚本
├── render.yaml        # Render Blueprint 配置
└── package.json
```

---

## 2. 总体路线图

| 阶段 | 核心目标 | 产出标准 |
|---|---|---|
| **第一阶段** | 核心链路完善 + 稳定部署 | 修复问题、完善功能、Render 部署成功并可用 |
| **第二阶段** | AI 好友感 + 体验打磨 | 长期记忆、主动开口、角色一致、UI 顺滑 |
| **第三阶段** | 接入微信 | 微信内可多轮对话，跨端历史与记忆互通# 灵伴 AI 好友 - 三阶段开发文档

> 版本：v1.0
> 当前状态：第一阶段核心代码已完成，待完善与部署
> 部署目标：Render
> 代码分支：main（默认分支）

---

## 0. 文档说明

本文档是「灵伴 AI 好友」项目的开发路线图，按三个阶段递进式推进：

- **第一阶段**：完善核心链路 + 成功部署到 Render
- **第二阶段**：深化 AI 好友感 + 打磨用户体验
- **第三阶段**：接入微信 + 跨端互通

每个阶段都有明确的目标、任务清单和验收标准，阶段结束时 `main` 分支上的代码都应能成功部署到 Render。

### Git 工作流约定

> **重要：所有开发和修改都直接在 `main` 分支上进行，每次完成后推送到远程 `main` 分支。**

```bash
# 查看当前状态
git status

# 添加修改
git add .

# 提交（使用有意义的提交信息）
git commit -m "feat: 添加 xxx 功能"
git commit -m "fix: 修复 xxx 问题"
git commit -m "refactor: 重构 xxx 模块"

# 推送到远程 main 分支
git push origin main
```

Render 会自动监听 `main` 分支的推送，触发自动部署。

---

## 1. 项目总览

### 1.1 产品定位

「灵伴」是一个 **AI 好友 / 角色陪伴** 应用。每个智能体都像用户拥有的一位虚拟朋友：有鲜明性格、背景、说话方式，会主动关心用户、找话题聊天。用户无需注册即可匿名使用，可创建多个不同性格的 AI 好友。

### 1.2 技术栈

| 层 | 选型 | 说明 |
|---|---|---|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS + Zustand + React Router | 移动端优先，单页应用 |
| 后端 | Express 4 + TypeScript（ESM） | REST + SSE 流式 |
| 数据库 | PostgreSQL + Prisma ORM v7 | |
| LLM | OpenAI 兼容格式 | 支持 OpenAI / DeepSeek / 自定义端点 |
| 部署 | Render Blueprint | Web Service + PostgreSQL |

### 1.3 当前项目结构

```text
/workspace
├── src/               # React 前端
│   ├── components/    # 通用组件
│   ├── pages/         # 页面
│   ├── store/         # Zustand 状态
│   ├── lib/           # API 封装、工具函数
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── api/               # Express 后端
│   ├── routes/        # 业务路由
│   ├── middleware/    # 鉴权
│   ├── lib/           # prisma、llm 适配器
│   ├── types/         # 类型声明
│   ├── app.ts
│   └── server.ts
├── prisma/            # Schema 与迁移
├── public/            # 静态资源
├── scripts/           # 维护脚本
├── render.yaml        # Render Blueprint 配置
└── package.json
```

---

## 2. 总体路线图

| 阶段 | 核心目标 | 产出标准 |
|---|---|---|
| **第一阶段** | 核心链路完善 + 稳定部署 | 修复问题、完善功能、Render 部署成功并可用 |
| **第二阶段** | AI 好友感 + 体验打磨 | 长期记忆、主动开口、角色一致、UI 顺滑 |
| **第三阶段** | 接入微信 | 微信内可多轮对话，跨端历史与记忆互通 |

---

## 3. 第一阶段：核心链路完善与部署上线

#### 灵伴 AI 好友 - 三阶段开发文档

> 版本：v1.0
> 当前状态：第一阶段核心代码已完成，待完善与部署
> 部署目标：Render
> 代码分支：main（默认分支）

---

## 0. 文档说明

本文档是「灵伴 AI 好友」项目的开发路线图，按三个阶段递进式推进：

- **第一阶段**：完善核心链路 + 成功部署到 Render
- **第二阶段**：深化 AI 好友感 + 打磨用户体验
- **第三阶段**：接入微信 + 跨端互通

每个阶段都有明确的目标、任务清单和验收标准，阶段结束时 `main` 分支上的代码都应能成功部署到 Render。

### Git 工作流约定

> **重要：所有开发和修改都直接在 `main` 分支上进行，每次完成后推送到远程 `main` 分支。**

```bash
# 查看当前状态
git status

# 添加修改
git add .

# 提交（使用有意义的提交信息）
git commit -m "feat: 添加 xxx 功能"
git commit -m "fix: 修复 xxx 问题"
git commit -m "refactor: 重构 xxx 模块"

# 推送到远程 main 分支
git push origin main
```

Render 会自动监听 `main` 分支的推送，触发自动部署。

---

## 1. 项目总览

### 1.1 产品定位

「灵伴」是一个 **AI 好友 / 角色陪伴** 应用。每个智能体都像用户拥有的一位虚拟朋友：有鲜明性格、背景、说话方式，会主动关心用户、找话题聊天。用户无需注册即可匿名使用，可创建多个不同性格的 AI 好友。

### 1.2 技术栈

| 层 | 选型 | 说明 |
|---|---|---|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS + Zustand + React Router | 移动端优先，单页应用 |
| 后端 | Express 4 + TypeScript（ESM） | REST + SSE 流式 |
| 数据库 | PostgreSQL + Prisma ORM v7 | |
| LLM | OpenAI 兼容格式 | 支持 OpenAI / DeepSeek / 自定义端点 |
| 部署 | Render Blueprint | Web Service + PostgreSQL |

### 1.3 当前项目结构

```text
/workspace
├── src/               # React 前端
│   ├── components/    # 通用组件
│   ├── pages/         # 页面
│   ├── store/         # Zustand 状态
│   ├── lib/           # API 封装、工具函数
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── api/               # Express 后端
│   ├── routes/        # 业务路由
│   ├── middleware/    # 鉴权
│   ├── lib/           # prisma、llm 适配器
│   ├── types/         # 类型声明
│   ├── app.ts
│   └── server.ts
├── prisma/            # Schema 与迁移
├── public/            # 静态资源
├── scripts/           # 维护脚本
├── render.yaml        # Render Blueprint 配置
└── package.json
```

---

## 2. 总体路线图

| 阶段 | 核心目标 | 产出标准 |
|---|---|---|
| **第一阶段** | 核心链路完善 + 稳定部署 | 修复问题、完善功能、Render 部署成功并可用 |
| **第二阶段** | AI 好友感 + 体验打磨 | 长期记忆、主动开口、角色一致、UI 顺滑 |
| **第三阶段** | 接入微信 | 微信内可多轮对话，跨端历史与记忆互通 |

---

## 3. 第一阶段：核心链路完善与部署上线

### 3.1 目标

基于现有代码，修复问题、完善功能、确保「匿名# 灵伴 AI 好友 - 三阶段开发文档

> 版本：v1.0
> 当前状态：第一阶段核心代码已完成，待完善与部署
> 部署目标：Render
> 代码分支：main（默认分支）

---

## 0. 文档说明

本文档是「灵伴 AI 好友」项目的开发路线图，按三个阶段递进式推进：

- **第一阶段**：完善核心链路 + 成功部署到 Render
- **第二阶段**：深化 AI 好友感 + 打磨用户体验
- **第三阶段**：接入微信 + 跨端互通

每个阶段都有明确的目标、任务清单和验收标准，阶段结束时 `main` 分支上的代码都应能成功部署到 Render。

### Git 工作流约定

> **重要：所有开发和修改都直接在 `main` 分支上进行，每次完成后推送到远程 `main` 分支。**

```bash
# 查看当前状态
git status

# 添加修改
git add .

# 提交（使用有意义的提交信息）
git commit -m "feat: 添加 xxx 功能"
git commit -m "fix: 修复 xxx 问题"
git commit -m "refactor: 重构 xxx 模块"

# 推送到远程 main 分支
git push origin main
```

Render 会自动监听 `main` 分支的推送，触发自动部署。

---

## 1. 项目总览

### 1.1 产品定位

「灵伴」是一个 **AI 好友 / 角色陪伴** 应用。每个智能体都像用户拥有的一位虚拟朋友：有鲜明性格、背景、说话方式，会主动关心用户、找话题聊天。用户无需注册即可匿名使用，可创建多个不同性格的 AI 好友。

### 1.2 技术栈

| 层 | 选型 | 说明 |
|---|---|---|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS + Zustand + React Router | 移动端优先，单页应用 |
| 后端 | Express 4 + TypeScript（ESM） | REST + SSE 流式 |
| 数据库 | PostgreSQL + Prisma ORM v7 | |
| LLM | OpenAI 兼容格式 | 支持 OpenAI / DeepSeek / 自定义端点 |
| 部署 | Render Blueprint | Web Service + PostgreSQL |

### 1.3 当前项目结构

```text
/workspace
├── src/               # React 前端
│   ├── components/    # 通用组件
│   ├── pages/         # 页面
│   ├── store/         # Zustand 状态
│   ├── lib/           # API 封装、工具函数
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── api/               # Express 后端
│   ├── routes/        # 业务路由
│   ├── middleware/    # 鉴权
│   ├── lib/           # prisma、llm 适配器
│   ├── types/         # 类型声明
│   ├── app.ts
│   └── server.ts
├── prisma/            # Schema 与迁移
├── public/            # 静态资源
├── scripts/           # 维护脚本
├── render.yaml        # Render Blueprint 配置
└── package.json
```

---

## 2. 总体路线图

| 阶段 | 核心目标 | 产出标准 |
|---|---|---|
| **第一阶段** | 核心链路完善 + 稳定部署 | 修复问题、完善功能、Render 部署成功并可用 |
| **第二阶段** | AI 好友感 + 体验打磨 | 长期记忆、主动开口、角色一致、UI 顺滑 |
| **第三阶段** | 接入微信 | 微信内可多轮对话，跨端历史与记忆互通 |

---

## 3. 第一阶段：核心链路完善与部署上线

### 3.1 目标

基于现有代码，修复问题、完善功能、确保「匿名登录 → 创建 AI 好友 → 流式聊天」主链路完整可用，并成功部署到 Render# 灵伴 AI 好友 - 三阶段开发文档

> 版本：v1.0
> 当前状态：第一阶段核心代码已完成，待完善与部署
> 部署目标：Render
> 代码分支：main（默认分支）

---

## 0. 文档说明

本文档是「灵伴 AI 好友」项目的开发路线图，按三个阶段递进式推进：

- **第一阶段**：完善核心链路 + 成功部署到 Render
- **第二阶段**：深化 AI 好友感 + 打磨用户体验
- **第三阶段**：接入微信 + 跨端互通

每个阶段都有明确的目标、任务清单和验收标准，阶段结束时 `main` 分支上的代码都应能成功部署到 Render。

### Git 工作流约定

> **重要：所有开发和修改都直接在 `main` 分支上进行，每次完成后推送到远程 `main` 分支。**

```bash
# 查看当前状态
git status

# 添加修改
git add .

# 提交（使用有意义的提交信息）
git commit -m "feat: 添加 xxx 功能"
git commit -m "fix: 修复 xxx 问题"
git commit -m "refactor: 重构 xxx 模块"

# 推送到远程 main 分支
git push origin main
```

Render 会自动监听 `main` 分支的推送，触发自动部署。

---

## 1. 项目总览

### 1.1 产品定位

「灵伴」是一个 **AI 好友 / 角色陪伴** 应用。每个智能体都像用户拥有的一位虚拟朋友：有鲜明性格、背景、说话方式，会主动关心用户、找话题聊天。用户无需注册即可匿名使用，可创建多个不同性格的 AI 好友。

### 1.2 技术栈

| 层 | 选型 | 说明 |
|---|---|---|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS + Zustand + React Router | 移动端优先，单页应用 |
| 后端 | Express 4 + TypeScript（ESM） | REST + SSE 流式 |
| 数据库 | PostgreSQL + Prisma ORM v7 | |
| LLM | OpenAI 兼容格式 | 支持 OpenAI / DeepSeek / 自定义端点 |
| 部署 | Render Blueprint | Web Service + PostgreSQL |

### 1.3 当前项目结构

```text
/workspace
├── src/               # React 前端
│   ├── components/    # 通用组件
│   ├── pages/         # 页面
│   ├── store/         # Zustand 状态
│   ├── lib/           # API 封装、工具函数
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── api/               # Express 后端
│   ├── routes/        # 业务路由
│   ├── middleware/    # 鉴权
│   ├── lib/           # prisma、llm 适配器
│   ├── types/         # 类型声明
│   ├── app.ts
│   └── server.ts
├── prisma/            # Schema 与迁移
├── public/            # 静态资源
├── scripts/           # 维护脚本
├── render.yaml        # Render Blueprint 配置
└── package.json
```

---

## 2. 总体路线图

| 阶段 | 核心目标 | 产出标准 |
|---|---|---|
| **第一阶段** | 核心链路完善 + 稳定部署 | 修复问题、完善功能、Render 部署成功并可用 |
| **第二阶段** | AI 好友感 + 体验打磨 | 长期记忆、主动开口、角色一致、UI 顺滑 |
| **第三阶段** | 接入微信 | 微信内可多轮对话，跨端历史与记忆互通 |

---

## 3. 第一阶段：核心链路完善与部署上线

### 3.1 目标

基于现有代码，修复问题、完善功能、确保「匿名登录 → 创建 AI 好友 → 流式聊天」主链路完整可用，并成功部署到 Render 生产环境。

### 3.2 当前已实现

- ✅ 工程骨架：# 灵伴 AI 好友 - 三阶段开发文档

> 版本：v1.0
> 当前状态：第一阶段核心代码已完成，待完善与部署
> 部署目标：Render
> 代码分支：main（默认分支）

---

## 0. 文档说明

本文档是「灵伴 AI 好友」项目的开发路线图，按三个阶段递进式推进：

- **第一阶段**：完善核心链路 + 成功部署到 Render
- **第二阶段**：深化 AI 好友感 + 打磨用户体验
- **第三阶段**：接入微信 + 跨端互通

每个阶段都有明确的目标、任务清单和验收标准，阶段结束时 `main` 分支上的代码都应能成功部署到 Render。

### Git 工作流约定

> **重要：所有开发和修改都直接在 `main` 分支上进行，每次完成后推送到远程 `main` 分支。**

```bash
# 查看当前状态
git status

# 添加修改
git add .

# 提交（使用有意义的提交信息）
git commit -m "feat: 添加 xxx 功能"
git commit -m "fix: 修复 xxx 问题"
git commit -m "refactor: 重构 xxx 模块"

# 推送到远程 main 分支
git push origin main
```

Render 会自动监听 `main` 分支的推送，触发自动部署。

---

## 1. 项目总览

### 1.1 产品定位

「灵伴」是一个 **AI 好友 / 角色陪伴** 应用。每个智能体都像用户拥有的一位虚拟朋友：有鲜明性格、背景、说话方式，会主动关心用户、找话题聊天。用户无需注册即可匿名使用，可创建多个不同性格的 AI 好友。

### 1.2 技术栈

| 层 | 选型 | 说明 |
|---|---|---|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS + Zustand + React Router | 移动端优先，单页应用 |
| 后端 | Express 4 + TypeScript（ESM） | REST + SSE 流式 |
| 数据库 | PostgreSQL + Prisma ORM v7 | |
| LLM | OpenAI 兼容格式 | 支持 OpenAI / DeepSeek / 自定义端点 |
| 部署 | Render Blueprint | Web Service + PostgreSQL |

### 1.3 当前项目结构

```text
/workspace
├── src/               # React 前端
│   ├── components/    # 通用组件
│   ├── pages/         # 页面
│   ├── store/         # Zustand 状态
│   ├── lib/           # API 封装、工具函数
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── api/               # Express 后端
│   ├── routes/        # 业务路由
│   ├── middleware/    # 鉴权
│   ├── lib/           # prisma、llm 适配器
│   ├── types/         # 类型声明
│   ├── app.ts
│   └── server.ts
├── prisma/            # Schema 与迁移
├── public/            # 静态资源
├── scripts/           # 维护脚本
├── render.yaml        # Render Blueprint 配置
└── package.json
```

---

## 2. 总体路线图

| 阶段 | 核心目标 | 产出标准 |
|---|---|---|
| **第一阶段** | 核心链路完善 + 稳定部署 | 修复问题、完善功能、Render 部署成功并可用 |
| **第二阶段** | AI 好友感 + 体验打磨 | 长期记忆、主动开口、角色一致、UI 顺滑 |
| **第三阶段** | 接入微信 | 微信内可多轮对话，跨端历史与记忆互通 |

---

## 3. 第一阶段：核心链路完善与部署上线

### 3.1 目标

基于现有代码，修复问题、完善功能、确保「匿名登录 → 创建 AI 好友 → 流式聊天」主链路完整可用，并成功部署到 Render 生产环境。

### 3.2 当前已实现

- ✅ 工程骨架：前后端分离、TypeScript、Vite、Tailwind CSS
- ✅ 数据库模型：# 灵伴 AI 好友 - 三阶段开发文档

> 版本：v1.0
> 当前状态：第一阶段核心代码已完成，待完善与部署
> 部署目标：Render
> 代码分支：main（默认分支）

---

## 0. 文档说明

本文档是「灵伴 AI 好友」项目的开发路线图，按三个阶段递进式推进：

- **第一阶段**：完善核心链路 + 成功部署到 Render
- **第二阶段**：深化 AI 好友感 + 打磨用户体验
- **第三阶段**：接入微信 + 跨端互通

每个阶段都有明确的目标、任务清单和验收标准，阶段结束时 `main` 分支上的代码都应能成功部署到 Render。

### Git 工作流约定

> **重要：所有开发和修改都直接在 `main` 分支上进行，每次完成后推送到远程 `main` 分支。**

```bash
# 查看当前状态
git status

# 添加修改
git add .

# 提交（使用有意义的提交信息）
git commit -m "feat: 添加 xxx 功能"
git commit -m "fix: 修复 xxx 问题"
git commit -m "refactor: 重构 xxx 模块"

# 推送到远程 main 分支
git push origin main
```

Render 会自动监听 `main` 分支的推送，触发自动部署。

---

## 1. 项目总览

### 1.1 产品定位

「灵伴」是一个 **AI 好友 / 角色陪伴** 应用。每个智能体都像用户拥有的一位虚拟朋友：有鲜明性格、背景、说话方式，会主动关心用户、找话题聊天。用户无需注册即可匿名使用，可创建多个不同性格的 AI 好友。

### 1.2 技术栈

| 层 | 选型 | 说明 |
|---|---|---|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS + Zustand + React Router | 移动端优先，单页应用 |
| 后端 | Express 4 + TypeScript（ESM） | REST + SSE 流式 |
| 数据库 | PostgreSQL + Prisma ORM v7 | |
| LLM | OpenAI 兼容格式 | 支持 OpenAI / DeepSeek / 自定义端点 |
| 部署 | Render Blueprint | Web Service + PostgreSQL |

### 1.3 当前项目结构

```text
/workspace
├── src/               # React 前端
│   ├── components/    # 通用组件
│   ├── pages/         # 页面
│   ├── store/         # Zustand 状态
│   ├── lib/           # API 封装、工具函数
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── api/               # Express 后端
│   ├── routes/        # 业务路由
│   ├── middleware/    # 鉴权
│   ├── lib/           # prisma、llm 适配器
│   ├── types/         # 类型声明
│   ├── app.ts
│   └── server.ts
├── prisma/            # Schema 与迁移
├── public/            # 静态资源
├── scripts/           # 维护脚本
├── render.yaml        # Render Blueprint 配置
└── package.json
```

---

## 2. 总体路线图

| 阶段 | 核心目标 | 产出标准 |
|---|---|---|
| **第一阶段** | 核心链路完善 + 稳定部署 | 修复问题、完善功能、Render 部署成功并可用 |
| **第二阶段** | AI 好友感 + 体验打磨 | 长期记忆、主动开口、角色一致、UI 顺滑 |
| **第三阶段** | 接入微信 | 微信内可多轮对话，跨端历史与记忆互通 |

---

## 3. 第一阶段：核心链路完善与部署上线

### 3.1 目标

基于现有代码，修复问题、完善功能、确保「匿名登录 → 创建 AI 好友 → 流式聊天」主链路完整可用，并成功部署到 Render 生产环境。

### 3.2 当前已实现

- ✅ 工程骨架：前后端分离、TypeScript、Vite、Tailwind CSS
- ✅ 数据库模型：User、Agent、ChatMessage 三张核心表
- ✅ 后端路由：auth、agents# 灵伴 AI 好友 - 三阶段开发文档

> 版本：v1.0
> 当前状态：第一阶段核心代码已完成，待完善与部署
> 部署目标：Render
> 代码分支：main（默认分支）

---

## 0. 文档说明

本文档是「灵伴 AI 好友」项目的开发路线图，按三个阶段递进式推进：

- **第一阶段**：完善核心链路 + 成功部署到 Render
- **第二阶段**：深化 AI 好友感 + 打磨用户体验
- **第三阶段**：接入微信 + 跨端互通

每个阶段都有明确的目标、任务清单和验收标准，阶段结束时 `main` 分支上的代码都应能成功部署到 Render。

### Git 工作流约定

> **重要：所有开发和修改都直接在 `main` 分支上进行，每次完成后推送到远程 `main` 分支。**

```bash
# 查看当前状态
git status

# 添加修改
git add .

# 提交（使用有意义的提交信息）
git commit -m "feat: 添加 xxx 功能"
git commit -m "fix: 修复 xxx 问题"
git commit -m "refactor: 重构 xxx 模块"

# 推送到远程 main 分支
git push origin main
```

Render 会自动监听 `main` 分支的推送，触发自动部署。

---

## 1. 项目总览

### 1.1 产品定位

「灵伴」是一个 **AI 好友 / 角色陪伴** 应用。每个智能体都像用户拥有的一位虚拟朋友：有鲜明性格、背景、说话方式，会主动关心用户、找话题聊天。用户无需注册即可匿名使用，可创建多个不同性格的 AI 好友。

### 1.2 技术栈

| 层 | 选型 | 说明 |
|---|---|---|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS + Zustand + React Router | 移动端优先，单页应用 |
| 后端 | Express 4 + TypeScript（ESM） | REST + SSE 流式 |
| 数据库 | PostgreSQL + Prisma ORM v7 | |
| LLM | OpenAI 兼容格式 | 支持 OpenAI / DeepSeek / 自定义端点 |
| 部署 | Render Blueprint | Web Service + PostgreSQL |

### 1.3 当前项目结构

```text
/workspace
├── src/               # React 前端
│   ├── components/    # 通用组件
│   ├── pages/         # 页面
│   ├── store/         # Zustand 状态
│   ├── lib/           # API 封装、工具函数
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── api/               # Express 后端
│   ├── routes/        # 业务路由
│   ├── middleware/    # 鉴权
│   ├── lib/           # prisma、llm 适配器
│   ├── types/         # 类型声明
│   ├── app.ts
│   └── server.ts
├── prisma/            # Schema 与迁移
├── public/            # 静态资源
├── scripts/           # 维护脚本
├── render.yaml        # Render Blueprint 配置
└── package.json
```

---

## 2. 总体路线图

| 阶段 | 核心目标 | 产出标准 |
|---|---|---|
| **第一阶段** | 核心链路完善 + 稳定部署 | 修复问题、完善功能、Render 部署成功并可用 |
| **第二阶段** | AI 好友感 + 体验打磨 | 长期记忆、主动开口、角色一致、UI 顺滑 |
| **第三阶段** | 接入微信 | 微信内可多轮对话，跨端历史与记忆互通 |

---

## 3. 第一阶段：核心链路完善与部署上线

### 3.1 目标

基于现有代码，修复问题、完善功能、确保「匿名登录 → 创建 AI 好友 → 流式聊天」主链路完整可用，并成功部署到 Render 生产环境。

### 3.2 当前已实现

- ✅ 工程骨架：前后端分离、TypeScript、Vite、Tailwind CSS
- ✅ 数据库模型：User、Agent、ChatMessage 三张核心表
- ✅ 后端路由：auth、agents、chat、upload
- ✅ LLM 适配层：OpenAI 兼容格式，支持# 灵伴 AI 好友 - 三阶段开发文档

> 版本：v1.0
> 当前状态：第一阶段核心代码已完成，待完善与部署
> 部署目标：Render
> 代码分支：main（默认分支）

---

## 0. 文档说明

本文档是「灵伴 AI 好友」项目的开发路线图，按三个阶段递进式推进：

- **第一阶段**：完善核心链路 + 成功部署到 Render
- **第二阶段**：深化 AI 好友感 + 打磨用户体验
- **第三阶段**：接入微信 + 跨端互通

每个阶段都有明确的目标、任务清单和验收标准，阶段结束时 `main` 分支上的代码都应能成功部署到 Render。

### Git 工作流约定

> **重要：所有开发和修改都直接在 `main` 分支上进行，每次完成后推送到远程 `main` 分支。**

```bash
# 查看当前状态
git status

# 添加修改
git add .

# 提交（使用有意义的提交信息）
git commit -m "feat: 添加 xxx 功能"
git commit -m "fix: 修复 xxx 问题"
git commit -m "refactor: 重构 xxx 模块"

# 推送到远程 main 分支
git push origin main
```

Render 会自动监听 `main` 分支的推送，触发自动部署。

---

## 1. 项目总览

### 1.1 产品定位

「灵伴」是一个 **AI 好友 / 角色陪伴** 应用。每个智能体都像用户拥有的一位虚拟朋友：有鲜明性格、背景、说话方式，会主动关心用户、找话题聊天。用户无需注册即可匿名使用，可创建多个不同性格的 AI 好友。

### 1.2 技术栈

| 层 | 选型 | 说明 |
|---|---|---|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS + Zustand + React Router | 移动端优先，单页应用 |
| 后端 | Express 4 + TypeScript（ESM） | REST + SSE 流式 |
| 数据库 | PostgreSQL + Prisma ORM v7 | |
| LLM | OpenAI 兼容格式 | 支持 OpenAI / DeepSeek / 自定义端点 |
| 部署 | Render Blueprint | Web Service + PostgreSQL |

### 1.3 当前项目结构

```text
/workspace
├── src/               # React 前端
│   ├── components/    # 通用组件
│   ├── pages/         # 页面
│   ├── store/         # Zustand 状态
│   ├── lib/           # API 封装、工具函数
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── api/               # Express 后端
│   ├── routes/        # 业务路由
│   ├── middleware/    # 鉴权
│   ├── lib/           # prisma、llm 适配器
│   ├── types/         # 类型声明
│   ├── app.ts
│   └── server.ts
├── prisma/            # Schema 与迁移
├── public/            # 静态资源
├── scripts/           # 维护脚本
├── render.yaml        # Render Blueprint 配置
└── package.json
```

---

## 2. 总体路线图

| 阶段 | 核心目标 | 产出标准 |
|---|---|---|
| **第一阶段** | 核心链路完善 + 稳定部署 | 修复问题、完善功能、Render 部署成功并可用 |
| **第二阶段** | AI 好友感 + 体验打磨 | 长期记忆、主动开口、角色一致、UI 顺滑 |
| **第三阶段** | 接入微信 | 微信内可多轮对话，跨端历史与记忆互通 |

---

## 3. 第一阶段：核心链路完善与部署上线

### 3.1 目标

基于现有代码，修复问题、完善功能、确保「匿名登录 → 创建 AI 好友 → 流式聊天」主链路完整可用，并成功部署到 Render 生产环境。

### 3.2 当前已实现

- ✅ 工程骨架：前后端分离、TypeScript、Vite、Tailwind CSS
- ✅ 数据库模型：User、Agent、ChatMessage 三张核心表
- ✅ 后端路由：auth、agents、chat、upload
- ✅ LLM 适配层：OpenAI 兼容格式，支持流式（SSE）
- ✅ 前端页面：AgentsPage、AgentEditPage、# 灵伴 AI 好友 - 三阶段开发文档

> 版本：v1.0
> 当前状态：第一阶段核心代码已完成，待完善与部署
> 部署目标：Render
> 代码分支：main（默认分支）

---

## 0. 文档说明

本文档是「灵伴 AI 好友」项目的开发路线图，按三个阶段递进式推进：

- **第一阶段**：完善核心链路 + 成功部署到 Render
- **第二阶段**：深化 AI 好友感 + 打磨用户体验
- **第三阶段**：接入微信 + 跨端互通

每个阶段都有明确的目标、任务清单和验收标准，阶段结束时 `main` 分支上的代码都应能成功部署到 Render。

### Git 工作流约定

> **重要：所有开发和修改都直接在 `main` 分支上进行，每次完成后推送到远程 `main` 分支。**

```bash
# 查看当前状态
git status

# 添加修改
git add .

# 提交（使用有意义的提交信息）
git commit -m "feat: 添加 xxx 功能"
git commit -m "fix: 修复 xxx 问题"
git commit -m "refactor: 重构 xxx 模块"

# 推送到远程 main 分支
git push origin main
```

Render 会自动监听 `main` 分支的推送，触发自动部署。

---

## 1. 项目总览

### 1.1 产品定位

「灵伴」是一个 **AI 好友 / 角色陪伴** 应用。每个智能体都像用户拥有的一位虚拟朋友：有鲜明性格、背景、说话方式，会主动关心用户、找话题聊天。用户无需注册即可匿名使用，可创建多个不同性格的 AI 好友。

### 1.2 技术栈

| 层 | 选型 | 说明 |
|---|---|---|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS + Zustand + React Router | 移动端优先，单页应用 |
| 后端 | Express 4 + TypeScript（ESM） | REST + SSE 流式 |
| 数据库 | PostgreSQL + Prisma ORM v7 | |
| LLM | OpenAI 兼容格式 | 支持 OpenAI / DeepSeek / 自定义端点 |
| 部署 | Render Blueprint | Web Service + PostgreSQL |

### 1.3 当前项目结构

```text
/workspace
├── src/               # React 前端
│   ├── components/    # 通用组件
│   ├── pages/         # 页面
│   ├── store/         # Zustand 状态
│   ├── lib/           # API 封装、工具函数
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── api/               # Express 后端
│   ├── routes/        # 业务路由
│   ├── middleware/    # 鉴权
│   ├── lib/           # prisma、llm 适配器
│   ├── types/         # 类型声明
│   ├── app.ts
│   └── server.ts
├── prisma/            # Schema 与迁移
├── public/            # 静态资源
├── scripts/           # 维护脚本
├── render.yaml        # Render Blueprint 配置
└── package.json
```

---

## 2. 总体路线图

| 阶段 | 核心目标 | 产出标准 |
|---|---|---|
| **第一阶段** | 核心链路完善 + 稳定部署 | 修复问题、完善功能、Render 部署成功并可用 |
| **第二阶段** | AI 好友感 + 体验打磨 | 长期记忆、主动开口、角色一致、UI 顺滑 |
| **第三阶段** | 接入微信 | 微信内可多轮对话，跨端历史与记忆互通 |

---

## 3. 第一阶段：核心链路完善与部署上线

### 3.1 目标

基于现有代码，修复问题、完善功能、确保「匿名登录 → 创建 AI 好友 → 流式聊天」主链路完整可用，并成功部署到 Render 生产环境。

### 3.2 当前已实现

- ✅ 工程骨架：前后端分离、TypeScript、Vite、Tailwind CSS
- ✅ 数据库模型：User、Agent、ChatMessage 三张核心表
- ✅ 后端路由：auth、agents、chat、upload
- ✅ LLM 适配层：OpenAI 兼容格式，支持流式（SSE）
- ✅ 前端页面：AgentsPage、AgentEditPage、ChatPage、ProfilePage
- ✅ 状态管理：auth、agents、chat、theme、# 灵伴 AI 好友 - 三阶段开发文档

> 版本：v1.0
> 当前状态：第一阶段核心代码已完成，待完善与部署
> 部署目标：Render
> 代码分支：main（默认分支）

---

## 0. 文档说明

本文档是「灵伴 AI 好友」项目的开发路线图，按三个阶段递进式推进：

- **第一阶段**：完善核心链路 + 成功部署到 Render
- **第二阶段**：深化 AI 好友感 + 打磨用户体验
- **第三阶段**：接入微信 + 跨端互通

每个阶段都有明确的目标、任务清单和验收标准，阶段结束时 `main` 分支上的代码都应能成功部署到 Render。

### Git 工作流约定

> **重要：所有开发和修改都直接在 `main` 分支上进行，每次完成后推送到远程 `main` 分支。**

```bash
# 查看当前状态
git status

# 添加修改
git add .

# 提交（使用有意义的提交信息）
git commit -m "feat: 添加 xxx 功能"
git commit -m "fix: 修复 xxx 问题"
git commit -m "refactor: 重构 xxx 模块"

# 推送到远程 main 分支
git push origin main
```

Render 会自动监听 `main` 分支的推送，触发自动部署。

---

## 1. 项目总览

### 1.1 产品定位

「灵伴」是一个 **AI 好友 / 角色陪伴** 应用。每个智能体都像用户拥有的一位虚拟朋友：有鲜明性格、背景、说话方式，会主动关心用户、找话题聊天。用户无需注册即可匿名使用，可创建多个不同性格的 AI 好友。

### 1.2 技术栈

| 层 | 选型 | 说明 |
|---|---|---|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS + Zustand + React Router | 移动端优先，单页应用 |
| 后端 | Express 4 + TypeScript（ESM） | REST + SSE 流式 |
| 数据库 | PostgreSQL + Prisma ORM v7 | |
| LLM | OpenAI 兼容格式 | 支持 OpenAI / DeepSeek / 自定义端点 |
| 部署 | Render Blueprint | Web Service + PostgreSQL |

### 1.3 当前项目结构

```text
/workspace
├── src/               # React 前端
│   ├── components/    # 通用组件
│   ├── pages/         # 页面
│   ├── store/         # Zustand 状态
│   ├── lib/           # API 封装、工具函数
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── api/               # Express 后端
│   ├── routes/        # 业务路由
│   ├── middleware/    # 鉴权
│   ├── lib/           # prisma、llm 适配器
│   ├── types/         # 类型声明
│   ├── app.ts
│   └── server.ts
├── prisma/            # Schema 与迁移
├── public/            # 静态资源
├── scripts/           # 维护脚本
├── render.yaml        # Render Blueprint 配置
└── package.json
```

---

## 2. 总体路线图

| 阶段 | 核心目标 | 产出标准 |
|---|---|---|
| **第一阶段** | 核心链路完善 + 稳定部署 | 修复问题、完善功能、Render 部署成功并可用 |
| **第二阶段** | AI 好友感 + 体验打磨 | 长期记忆、主动开口、角色一致、UI 顺滑 |
| **第三阶段** | 接入微信 | 微信内可多轮对话，跨端历史与记忆互通 |

---

## 3. 第一阶段：核心链路完善与部署上线

### 3.1 目标

基于现有代码，修复问题、完善功能、确保「匿名登录 → 创建 AI 好友 → 流式聊天」主链路完整可用，并成功部署到 Render 生产环境。

### 3.2 当前已实现

- ✅ 工程骨架：前后端分离、TypeScript、Vite、Tailwind CSS
- ✅ 数据库模型：User、Agent、ChatMessage 三张核心表
- ✅ 后端路由：auth、agents、chat、upload
- ✅ LLM 适配层：OpenAI 兼容格式，支持流式（SSE）
- ✅ 前端页面：AgentsPage、AgentEditPage、ChatPage、ProfilePage
- ✅ 状态管理：auth、agents、chat、theme、toast
- ✅ 通用组件：Avatar、BottomNav、GlassCard、Modal、Toast# 灵伴 AI 好友 - 三阶段开发文档

> 版本：v1.0
> 当前状态：第一阶段核心代码已完成，待完善与部署
> 部署目标：Render
> 代码分支：main（默认分支）

---

## 0. 文档说明

本文档是「灵伴 AI 好友」项目的开发路线图，按三个阶段递进式推进：

- **第一阶段**：完善核心链路 + 成功部署到 Render
- **第二阶段**：深化 AI 好友感 + 打磨用户体验
- **第三阶段**：接入微信 + 跨端互通

每个阶段都有明确的目标、任务清单和验收标准，阶段结束时 `main` 分支上的代码都应能成功部署到 Render。

### Git 工作流约定

> **重要：所有开发和修改都直接在 `main` 分支上进行，每次完成后推送到远程 `main` 分支。**

```bash
# 查看当前状态
git status

# 添加修改
git add .

# 提交（使用有意义的提交信息）
git commit -m "feat: 添加 xxx 功能"
git commit -m "fix: 修复 xxx 问题"
git commit -m "refactor: 重构 xxx 模块"

# 推送到远程 main 分支
git push origin main
```

Render 会自动监听 `main` 分支的推送，触发自动部署。

---

## 1. 项目总览

### 1.1 产品定位

「灵伴」是一个 **AI 好友 / 角色陪伴** 应用。每个智能体都像用户拥有的一位虚拟朋友：有鲜明性格、背景、说话方式，会主动关心用户、找话题聊天。用户无需注册即可匿名使用，可创建多个不同性格的 AI 好友。

### 1.2 技术栈

| 层 | 选型 | 说明 |
|---|---|---|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS + Zustand + React Router | 移动端优先，单页应用 |
| 后端 | Express 4 + TypeScript（ESM） | REST + SSE 流式 |
| 数据库 | PostgreSQL + Prisma ORM v7 | |
| LLM | OpenAI 兼容格式 | 支持 OpenAI / DeepSeek / 自定义端点 |
| 部署 | Render Blueprint | Web Service + PostgreSQL |

### 1.3 当前项目结构

```text
/workspace
├── src/               # React 前端
│   ├── components/    # 通用组件
│   ├── pages/         # 页面
│   ├── store/         # Zustand 状态
│   ├── lib/           # API 封装、工具函数
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── api/               # Express 后端
│   ├── routes/        # 业务路由
│   ├── middleware/    # 鉴权
│   ├── lib/           # prisma、llm 适配器
│   ├── types/         # 类型声明
│   ├── app.ts
│   └── server.ts
├── prisma/            # Schema 与迁移
├── public/            # 静态资源
├── scripts/           # 维护脚本
├── render.yaml        # Render Blueprint 配置
└── package.json
```

---

## 2. 总体路线图

| 阶段 | 核心目标 | 产出标准 |
|---|---|---|
| **第一阶段** | 核心链路完善 + 稳定部署 | 修复问题、完善功能、Render 部署成功并可用 |
| **第二阶段** | AI 好友感 + 体验打磨 | 长期记忆、主动开口、角色一致、UI 顺滑 |
| **第三阶段** | 接入微信 | 微信内可多轮对话，跨端历史与记忆互通 |

---

## 3. 第一阶段：核心链路完善与部署上线

### 3.1 目标

基于现有代码，修复问题、完善功能、确保「匿名登录 → 创建 AI 好友 → 流式聊天」主链路完整可用，并成功部署到 Render 生产环境。

### 3.2 当前已实现

- ✅ 工程骨架：前后端分离、TypeScript、Vite、Tailwind CSS
- ✅ 数据库模型：User、Agent、ChatMessage 三张核心表
- ✅ 后端路由：auth、agents、chat、upload
- ✅ LLM 适配层：OpenAI 兼容格式，支持流式（SSE）
- ✅ 前端页面：AgentsPage、AgentEditPage、ChatPage、ProfilePage
- ✅ 状态管理：auth、agents、chat、theme、toast
- ✅ 通用组件：Avatar、BottomNav、GlassCard、Modal、Toast、EmptyState、ErrorBoundary
- ✅ 智能体模板：预设模板一键填充
-# 灵伴 AI 好友 - 三阶段开发文档

> 版本：v1.0
> 当前状态：第一阶段核心代码已完成，待完善与部署
> 部署目标：Render
> 代码分支：main（默认分支）

---

## 0. 文档说明

本文档是「灵伴 AI 好友」项目的开发路线图，按三个阶段递进式推进：

- **第一阶段**：完善核心链路 + 成功部署到 Render
- **第二阶段**：深化 AI 好友感 + 打磨用户体验
- **第三阶段**：接入微信 + 跨端互通

每个阶段都有明确的目标、任务清单和验收标准，阶段结束时 `main` 分支上的代码都应能成功部署到 Render。

### Git 工作流约定

> **重要：所有开发和修改都直接在 `main` 分支上进行，每次完成后推送到远程 `main` 分支。**

```bash
# 查看当前状态
git status

# 添加修改
git add .

# 提交（使用有意义的提交信息）
git commit -m "feat: 添加 xxx 功能"
git commit -m "fix: 修复 xxx 问题"
git commit -m "refactor: 重构 xxx 模块"

# 推送到远程 main 分支
git push origin main
```

Render 会自动监听 `main` 分支的推送，触发自动部署。

---

## 1. 项目总览

### 1.1 产品定位

「灵伴」是一个 **AI 好友 / 角色陪伴** 应用。每个智能体都像用户拥有的一位虚拟朋友：有鲜明性格、背景、说话方式，会主动关心用户、找话题聊天。用户无需注册即可匿名使用，可创建多个不同性格的 AI 好友。

### 1.2 技术栈

| 层 | 选型 | 说明 |
|---|---|---|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS + Zustand + React Router | 移动端优先，单页应用 |
| 后端 | Express 4 + TypeScript（ESM） | REST + SSE 流式 |
| 数据库 | PostgreSQL + Prisma ORM v7 | |
| LLM | OpenAI 兼容格式 | 支持 OpenAI / DeepSeek / 自定义端点 |
| 部署 | Render Blueprint | Web Service + PostgreSQL |

### 1.3 当前项目结构

```text
/workspace
├── src/               # React 前端
│   ├── components/    # 通用组件
│   ├── pages/         # 页面
│   ├── store/         # Zustand 状态
│   ├── lib/           # API 封装、工具函数
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── api/               # Express 后端
│   ├── routes/        # 业务路由
│   ├── middleware/    # 鉴权
│   ├── lib/           # prisma、llm 适配器
│   ├── types/         # 类型声明
│   ├── app.ts
│   └── server.ts
├── prisma/            # Schema 与迁移
├── public/            # 静态资源
├── scripts/           # 维护脚本
├── render.yaml        # Render Blueprint 配置
└── package.json
```

---

## 2. 总体路线图

| 阶段 | 核心目标 | 产出标准 |
|---|---|---|
| **第一阶段** | 核心链路完善 + 稳定部署 | 修复问题、完善功能、Render 部署成功并可用 |
| **第二阶段** | AI 好友感 + 体验打磨 | 长期记忆、主动开口、角色一致、UI 顺滑 |
| **第三阶段** | 接入微信 | 微信内可多轮对话，跨端历史与记忆互通 |

---

## 3. 第一阶段：核心链路完善与部署上线

### 3.1 目标

基于现有代码，修复问题、完善功能、确保「匿名登录 → 创建 AI 好友 → 流式聊天」主链路完整可用，并成功部署到 Render 生产环境。

### 3.2 当前已实现

- ✅ 工程骨架：前后端分离、TypeScript、Vite、Tailwind CSS
- ✅ 数据库模型：User、Agent、ChatMessage 三张核心表
- ✅ 后端路由：auth、agents、chat、upload
- ✅ LLM 适配层：OpenAI 兼容格式，支持流式（SSE）
- ✅ 前端页面：AgentsPage、AgentEditPage、ChatPage、ProfilePage
- ✅ 状态管理：auth、agents、chat、theme、toast
- ✅ 通用组件：Avatar、BottomNav、GlassCard、Modal、Toast、EmptyState、ErrorBoundary
- ✅ 智能体模板：预设模板一键填充
- ✅ 双主题：极光 / 七彩
- ✅ Render Blueprint 配置：`render.yaml# 灵伴 AI 好友 - 三阶段开发文档

> 版本：v1.0
> 当前状态：第一阶段核心代码已完成，待完善与部署
> 部署目标：Render
> 代码分支：main（默认分支）

---

## 0. 文档说明

本文档是「灵伴 AI 好友」项目的开发路线图，按三个阶段递进式推进：

- **第一阶段**：完善核心链路 + 成功部署到 Render
- **第二阶段**：深化 AI 好友感 + 打磨用户体验
- **第三阶段**：接入微信 + 跨端互通

每个阶段都有明确的目标、任务清单和验收标准，阶段结束时 `main` 分支上的代码都应能成功部署到 Render。

### Git 工作流约定

> **重要：所有开发和修改都直接在 `main` 分支上进行，每次完成后推送到远程 `main` 分支。**

```bash
# 查看当前状态
git status

# 添加修改
git add .

# 提交（使用有意义的提交信息）
git commit -m "feat: 添加 xxx 功能"
git commit -m "fix: 修复 xxx 问题"
git commit -m "refactor: 重构 xxx 模块"

# 推送到远程 main 分支
git push origin main
```

Render 会自动监听 `main` 分支的推送，触发自动部署。

---

## 1. 项目总览

### 1.1 产品定位

「灵伴」是一个 **AI 好友 / 角色陪伴** 应用。每个智能体都像用户拥有的一位虚拟朋友：有鲜明性格、背景、说话方式，会主动关心用户、找话题聊天。用户无需注册即可匿名使用，可创建多个不同性格的 AI 好友。

### 1.2 技术栈

| 层 | 选型 | 说明 |
|---|---|---|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS + Zustand + React Router | 移动端优先，单页应用 |
| 后端 | Express 4 + TypeScript（ESM） | REST + SSE 流式 |
| 数据库 | PostgreSQL + Prisma ORM v7 | |
| LLM | OpenAI 兼容格式 | 支持 OpenAI / DeepSeek / 自定义端点 |
| 部署 | Render Blueprint | Web Service + PostgreSQL |

### 1.3 当前项目结构

```text
/workspace
├── src/               # React 前端
│   ├── components/    # 通用组件
│   ├── pages/         # 页面
│   ├── store/         # Zustand 状态
│   ├── lib/           # API 封装、工具函数
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── api/               # Express 后端
│   ├── routes/        # 业务路由
│   ├── middleware/    # 鉴权
│   ├── lib/           # prisma、llm 适配器
│   ├── types/         # 类型声明
│   ├── app.ts
│   └── server.ts
├── prisma/            # Schema 与迁移
├── public/            # 静态资源
├── scripts/           # 维护脚本
├── render.yaml        # Render Blueprint 配置
└── package.json
```

---

## 2. 总体路线图

| 阶段 | 核心目标 | 产出标准 |
|---|---|---|
| **第一阶段** | 核心链路完善 + 稳定部署 | 修复问题、完善功能、Render 部署成功并可用 |
| **第二阶段** | AI 好友感 + 体验打磨 | 长期记忆、主动开口、角色一致、UI 顺滑 |
| **第三阶段** | 接入微信 | 微信内可多轮对话，跨端历史与记忆互通 |

---

## 3. 第一阶段：核心链路完善与部署上线

### 3.1 目标

基于现有代码，修复问题、完善功能、确保「匿名登录 → 创建 AI 好友 → 流式聊天」主链路完整可用，并成功部署到 Render 生产环境。

### 3.2 当前已实现

- ✅ 工程骨架：前后端分离、TypeScript、Vite、Tailwind CSS
- ✅ 数据库模型：User、Agent、ChatMessage 三张核心表
- ✅ 后端路由：auth、agents、chat、upload
- ✅ LLM 适配层：OpenAI 兼容格式，支持流式（SSE）
- ✅ 前端页面：AgentsPage、AgentEditPage、ChatPage、ProfilePage
- ✅ 状态管理：auth、agents、chat、theme、toast
- ✅ 通用组件：Avatar、BottomNav、GlassCard、Modal、Toast、EmptyState、ErrorBoundary
- ✅ 智能体模板：预设模板一键填充
- ✅ 双主题：极光 / 七彩
- ✅ Render Blueprint 配置：`render.yaml`

### 3.3 待完善任务

#### 3.3.1# 灵伴 AI 好友 - 三阶段开发文档

> 版本：v1.0
> 当前状态：第一阶段核心代码已完成，待完善与部署
> 部署目标：Render
> 代码分支：main（默认分支）

---

## 0. 文档说明

本文档是「灵伴 AI 好友」项目的开发路线图，按三个阶段递进式推进：

- **第一阶段**：完善核心链路 + 成功部署到 Render
- **第二阶段**：深化 AI 好友感 + 打磨用户体验
- **第三阶段**：接入微信 + 跨端互通

每个阶段都有明确的目标、任务清单和验收标准，阶段结束时 `main` 分支上的代码都应能成功部署到 Render。

### Git 工作流约定

> **重要：所有开发和修改都直接在 `main` 分支上进行，每次完成后推送到远程 `main` 分支。**

```bash
# 查看当前状态
git status

# 添加修改
git add .

# 提交（使用有意义的提交信息）
git commit -m "feat: 添加 xxx 功能"
git commit -m "fix: 修复 xxx 问题"
git commit -m "refactor: 重构 xxx 模块"

# 推送到远程 main 分支
git push origin main
```

Render 会自动监听 `main` 分支的推送，触发自动部署。

---

## 1. 项目总览

### 1.1 产品定位

「灵伴」是一个 **AI 好友 / 角色陪伴** 应用。每个智能体都像用户拥有的一位虚拟朋友：有鲜明性格、背景、说话方式，会主动关心用户、找话题聊天。用户无需注册即可匿名使用，可创建多个不同性格的 AI 好友。

### 1.2 技术栈

| 层 | 选型 | 说明 |
|---|---|---|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS + Zustand + React Router | 移动端优先，单页应用 |
| 后端 | Express 4 + TypeScript（ESM） | REST + SSE 流式 |
| 数据库 | PostgreSQL + Prisma ORM v7 | |
| LLM | OpenAI 兼容格式 | 支持 OpenAI / DeepSeek / 自定义端点 |
| 部署 | Render Blueprint | Web Service + PostgreSQL |

### 1.3 当前项目结构

```text
/workspace
├── src/               # React 前端
│   ├── components/    # 通用组件
│   ├── pages/         # 页面
│   ├── store/         # Zustand 状态
│   ├── lib/           # API 封装、工具函数
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── api/               # Express 后端
│   ├── routes/        # 业务路由
│   ├── middleware/    # 鉴权
│   ├── lib/           # prisma、llm 适配器
│   ├── types/         # 类型声明
│   ├── app.ts
│   └── server.ts
├── prisma/            # Schema 与迁移
├── public/            # 静态资源
├── scripts/           # 维护脚本
├── render.yaml        # Render Blueprint 配置
└── package.json
```

---

## 2. 总体路线图

| 阶段 | 核心目标 | 产出标准 |
|---|---|---|
| **第一阶段** | 核心链路完善 + 稳定部署 | 修复问题、完善功能、Render 部署成功并可用 |
| **第二阶段** | AI 好友感 + 体验打磨 | 长期记忆、主动开口、角色一致、UI 顺滑 |
| **第三阶段** | 接入微信 | 微信内可多轮对话，跨端历史与记忆互通 |

---

## 3. 第一阶段：核心链路完善与部署上线

### 3.1 目标

基于现有代码，修复问题、完善功能、确保「匿名登录 → 创建 AI 好友 → 流式聊天」主链路完整可用，并成功部署到 Render 生产环境。

### 3.2 当前已实现

- ✅ 工程骨架：前后端分离、TypeScript、Vite、Tailwind CSS
- ✅ 数据库模型：User、Agent、ChatMessage 三张核心表
- ✅ 后端路由：auth、agents、chat、upload
- ✅ LLM 适配层：OpenAI 兼容格式，支持流式（SSE）
- ✅ 前端页面：AgentsPage、AgentEditPage、ChatPage、ProfilePage
- ✅ 状态管理：auth、agents、chat、theme、toast
- ✅ 通用组件：Avatar、BottomNav、GlassCard、Modal、Toast、EmptyState、ErrorBoundary
- ✅ 智能体模板：预设模板一键填充
- ✅ 双主题：极光 / 七彩
- ✅ Render Blueprint 配置：`render.yaml`

### 3.3 待完善任务

#### 3.3.1 代码质量检查与修复

- 运行 `pnpm lint`，修复所有 ESLint# 灵伴 AI 好友 - 三阶段开发文档

> 版本：v1.0
> 当前状态：第一阶段核心代码已完成，待完善与部署
> 部署目标：Render
> 代码分支：main（默认分支）

---

## 0. 文档说明

本文档是「灵伴 AI 好友」项目的开发路线图，按三个阶段递进式推进：

- **第一阶段**：完善核心链路 + 成功部署到 Render
- **第二阶段**：深化 AI 好友感 + 打磨用户体验
- **第三阶段**：接入微信 + 跨端互通

每个阶段都有明确的目标、任务清单和验收标准，阶段结束时 `main` 分支上的代码都应能成功部署到 Render。

### Git 工作流约定

> **重要：所有开发和修改都直接在 `main` 分支上进行，每次完成后推送到远程 `main` 分支。**

```bash
# 查看当前状态
git status

# 添加修改
git add .

# 提交（使用有意义的提交信息）
git commit -m "feat: 添加 xxx 功能"
git commit -m "fix: 修复 xxx 问题"
git commit -m "refactor: 重构 xxx 模块"

# 推送到远程 main 分支
git push origin main
```

Render 会自动监听 `main` 分支的推送，触发自动部署。

---

## 1. 项目总览

### 1.1 产品定位

「灵伴」是一个 **AI 好友 / 角色陪伴** 应用。每个智能体都像用户拥有的一位虚拟朋友：有鲜明性格、背景、说话方式，会主动关心用户、找话题聊天。用户无需注册即可匿名使用，可创建多个不同性格的 AI 好友。

### 1.2 技术栈

| 层 | 选型 | 说明 |
|---|---|---|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS + Zustand + React Router | 移动端优先，单页应用 |
| 后端 | Express 4 + TypeScript（ESM） | REST + SSE 流式 |
| 数据库 | PostgreSQL + Prisma ORM v7 | |
| LLM | OpenAI 兼容格式 | 支持 OpenAI / DeepSeek / 自定义端点 |
| 部署 | Render Blueprint | Web Service + PostgreSQL |

### 1.3 当前项目结构

```text
/workspace
├── src/               # React 前端
│   ├── components/    # 通用组件
│   ├── pages/         # 页面
│   ├── store/         # Zustand 状态
│   ├── lib/           # API 封装、工具函数
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── api/               # Express 后端
│   ├── routes/        # 业务路由
│   ├── middleware/    # 鉴权
│   ├── lib/           # prisma、llm 适配器
│   ├── types/         # 类型声明
│   ├── app.ts
│   └── server.ts
├── prisma/            # Schema 与迁移
├── public/            # 静态资源
├── scripts/           # 维护脚本
├── render.yaml        # Render Blueprint 配置
└── package.json
```

---

## 2. 总体路线图

| 阶段 | 核心目标 | 产出标准 |
|---|---|---|
| **第一阶段** | 核心链路完善 + 稳定部署 | 修复问题、完善功能、Render 部署成功并可用 |
| **第二阶段** | AI 好友感 + 体验打磨 | 长期记忆、主动开口、角色一致、UI 顺滑 |
| **第三阶段** | 接入微信 | 微信内可多轮对话，跨端历史与记忆互通 |

---

## 3. 第一阶段：核心链路完善与部署上线

### 3.1 目标

基于现有代码，修复问题、完善功能、确保「匿名登录 → 创建 AI 好友 → 流式聊天」主链路完整可用，并成功部署到 Render 生产环境。

### 3.2 当前已实现

- ✅ 工程骨架：前后端分离、TypeScript、Vite、Tailwind CSS
- ✅ 数据库模型：User、Agent、ChatMessage 三张核心表
- ✅ 后端路由：auth、agents、chat、upload
- ✅ LLM 适配层：OpenAI 兼容格式，支持流式（SSE）
- ✅ 前端页面：AgentsPage、AgentEditPage、ChatPage、ProfilePage
- ✅ 状态管理：auth、agents、chat、theme、toast
- ✅ 通用组件：Avatar、BottomNav、GlassCard、Modal、Toast、EmptyState、ErrorBoundary
- ✅ 智能体模板：预设模板一键填充
- ✅ 双主题：极光 / 七彩
- ✅ Render Blueprint 配置：`render.yaml`

### 3.3 待完善任务

#### 3.3.1 代码质量检查与修复

- 运行 `pnpm lint`，修复所有 ESLint 错误和警告
- 运行 `pnpm check`，确保 TypeScript 类型检查# 灵伴 AI 好友 - 三阶段开发文档

> 版本：v1.0
> 当前状态：第一阶段核心代码已完成，待完善与部署
> 部署目标：Render
> 代码分支：main（默认分支）

---

## 0. 文档说明

本文档是「灵伴 AI 好友」项目的开发路线图，按三个阶段递进式推进：

- **第一阶段**：完善核心链路 + 成功部署到 Render
- **第二阶段**：深化 AI 好友感 + 打磨用户体验
- **第三阶段**：接入微信 + 跨端互通

每个阶段都有明确的目标、任务清单和验收标准，阶段结束时 `main` 分支上的代码都应能成功部署到 Render。

### Git 工作流约定

> **重要：所有开发和修改都直接在 `main` 分支上进行，每次完成后推送到远程 `main` 分支。**

```bash
# 查看当前状态
git status

# 添加修改
git add .

# 提交（使用有意义的提交信息）
git commit -m "feat: 添加 xxx 功能"
git commit -m "fix: 修复 xxx 问题"
git commit -m "refactor: 重构 xxx 模块"

# 推送到远程 main 分支
git push origin main
```

Render 会自动监听 `main` 分支的推送，触发自动部署。

---

## 1. 项目总览

### 1.1 产品定位

「灵伴」是一个 **AI 好友 / 角色陪伴** 应用。每个智能体都像用户拥有的一位虚拟朋友：有鲜明性格、背景、说话方式，会主动关心用户、找话题聊天。用户无需注册即可匿名使用，可创建多个不同性格的 AI 好友。

### 1.2 技术栈

| 层 | 选型 | 说明 |
|---|---|---|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS + Zustand + React Router | 移动端优先，单页应用 |
| 后端 | Express 4 + TypeScript（ESM） | REST + SSE 流式 |
| 数据库 | PostgreSQL + Prisma ORM v7 | |
| LLM | OpenAI 兼容格式 | 支持 OpenAI / DeepSeek / 自定义端点 |
| 部署 | Render Blueprint | Web Service + PostgreSQL |

### 1.3 当前项目结构

```text
/workspace
├── src/               # React 前端
│   ├── components/    # 通用组件
│   ├── pages/         # 页面
│   ├── store/         # Zustand 状态
│   ├── lib/           # API 封装、工具函数
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── api/               # Express 后端
│   ├── routes/        # 业务路由
│   ├── middleware/    # 鉴权
│   ├── lib/           # prisma、llm 适配器
│   ├── types/         # 类型声明
│   ├── app.ts
│   └── server.ts
├── prisma/            # Schema 与迁移
├── public/            # 静态资源
├── scripts/           # 维护脚本
├── render.yaml        # Render Blueprint 配置
└── package.json
```

---

## 2. 总体路线图

| 阶段 | 核心目标 | 产出标准 |
|---|---|---|
| **第一阶段** | 核心链路完善 + 稳定部署 | 修复问题、完善功能、Render 部署成功并可用 |
| **第二阶段** | AI 好友感 + 体验打磨 | 长期记忆、主动开口、角色一致、UI 顺滑 |
| **第三阶段** | 接入微信 | 微信内可多轮对话，跨端历史与记忆互通 |

---

## 3. 第一阶段：核心链路完善与部署上线

### 3.1 目标

基于现有代码，修复问题、完善功能、确保「匿名登录 → 创建 AI 好友 → 流式聊天」主链路完整可用，并成功部署到 Render 生产环境。

### 3.2 当前已实现

- ✅ 工程骨架：前后端分离、TypeScript、Vite、Tailwind CSS
- ✅ 数据库模型：User、Agent、ChatMessage 三张核心表
- ✅ 后端路由：auth、agents、chat、upload
- ✅ LLM 适配层：OpenAI 兼容格式，支持流式（SSE）
- ✅ 前端页面：AgentsPage、AgentEditPage、ChatPage、ProfilePage
- ✅ 状态管理：auth、agents、chat、theme、toast
- ✅ 通用组件：Avatar、BottomNav、GlassCard、Modal、Toast、EmptyState、ErrorBoundary
- ✅ 智能体模板：预设模板一键填充
- ✅ 双主题：极光 / 七彩
- ✅ Render Blueprint 配置：`render.yaml`

### 3.3 待完善任务

#### 3.3.1 代码质量检查与修复

- 运行 `pnpm lint`，修复所有 ESLint 错误和警告
- 运行 `pnpm check`，确保 TypeScript 类型检查通过
- 运行 `pnpm build`，确保生产构建成功
- 检查 Pr# 灵伴 AI 好友 - 三阶段开发文档

> 版本：v1.0
> 当前状态：第一阶段核心代码已完成，待完善与部署
> 部署目标：Render
> 代码分支：main（默认分支）

---

## 0. 文档说明

本文档是「灵伴 AI 好友」项目的开发路线图，按三个阶段递进式推进：

- **第一阶段**：完善核心链路 + 成功部署到 Render
- **第二阶段**：深化 AI 好友感 + 打磨用户体验
- **第三阶段**：接入微信 + 跨端互通

每个阶段都有明确的目标、任务清单和验收标准，阶段结束时 `main` 分支上的代码都应能成功部署到 Render。

### Git 工作流约定

> **重要：所有开发和修改都直接在 `main` 分支上进行，每次完成后推送到远程 `main` 分支。**

```bash
# 查看当前状态
git status

# 添加修改
git add .

# 提交（使用有意义的提交信息）
git commit -m "feat: 添加 xxx 功能"
git commit -m "fix: 修复 xxx 问题"
git commit -m "refactor: 重构 xxx 模块"

# 推送到远程 main 分支
git push origin main
```

Render 会自动监听 `main` 分支的推送，触发自动部署。

---

## 1. 项目总览

### 1.1 产品定位

「灵伴」是一个 **AI 好友 / 角色陪伴** 应用。每个智能体都像用户拥有的一位虚拟朋友：有鲜明性格、背景、说话方式，会主动关心用户、找话题聊天。用户无需注册即可匿名使用，可创建多个不同性格的 AI 好友。

### 1.2 技术栈

| 层 | 选型 | 说明 |
|---|---|---|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS + Zustand + React Router | 移动端优先，单页应用 |
| 后端 | Express 4 + TypeScript（ESM） | REST + SSE 流式 |
| 数据库 | PostgreSQL + Prisma ORM v7 | |
| LLM | OpenAI 兼容格式 | 支持 OpenAI / DeepSeek / 自定义端点 |
| 部署 | Render Blueprint | Web Service + PostgreSQL |

### 1.3 当前项目结构

```text
/workspace
├── src/               # React 前端
│   ├── components/    # 通用组件
│   ├── pages/         # 页面
│   ├── store/         # Zustand 状态
│   ├── lib/           # API 封装、工具函数
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── api/               # Express 后端
│   ├── routes/        # 业务路由
│   ├── middleware/    # 鉴权
│   ├── lib/           # prisma、llm 适配器
│   ├── types/         # 类型声明
│   ├── app.ts
│   └── server.ts
├── prisma/            # Schema 与迁移
├── public/            # 静态资源
├── scripts/           # 维护脚本
├── render.yaml        # Render Blueprint 配置
└── package.json
```

---

## 2. 总体路线图

| 阶段 | 核心目标 | 产出标准 |
|---|---|---|
| **第一阶段** | 核心链路完善 + 稳定部署 | 修复问题、完善功能、Render 部署成功并可用 |
| **第二阶段** | AI 好友感 + 体验打磨 | 长期记忆、主动开口、角色一致、UI 顺滑 |
| **第三阶段** | 接入微信 | 微信内可多轮对话，跨端历史与记忆互通 |

---

## 3. 第一阶段：核心链路完善与部署上线

### 3.1 目标

基于现有代码，修复问题、完善功能、确保「匿名登录 → 创建 AI 好友 → 流式聊天」主链路完整可用，并成功部署到 Render 生产环境。

### 3.2 当前已实现

- ✅ 工程骨架：前后端分离、TypeScript、Vite、Tailwind CSS
- ✅ 数据库模型：User、Agent、ChatMessage 三张核心表
- ✅ 后端路由：auth、agents、chat、upload
- ✅ LLM 适配层：OpenAI 兼容格式，支持流式（SSE）
- ✅ 前端页面：AgentsPage、AgentEditPage、ChatPage、ProfilePage
- ✅ 状态管理：auth、agents、chat、theme、toast
- ✅ 通用组件：Avatar、BottomNav、GlassCard、Modal、Toast、EmptyState、ErrorBoundary
- ✅ 智能体模板：预设模板一键填充
- ✅ 双主题：极光 / 七彩
- ✅ Render Blueprint 配置：`render.yaml`

### 3.3 待完善任务

#### 3.3.1 代码质量检查与修复

- 运行 `pnpm lint`，修复所有 ESLint 错误和警告
- 运行 `pnpm check`，确保 TypeScript 类型检查通过
- 运行 `pnpm build`，确保生产构建成功
- 检查 Prisma schema 与生成路径是否正确（`output` 指向 `../src/generated/pr# 灵伴 AI 好友 - 三阶段开发文档

> 版本：v1.0
> 当前状态：第一阶段核心代码已完成，待完善与部署
> 部署目标：Render
> 代码分支：main（默认分支）

---

## 0. 文档说明

本文档是「灵伴 AI 好友」项目的开发路线图，按三个阶段递进式推进：

- **第一阶段**：完善核心链路 + 成功部署到 Render
- **第二阶段**：深化 AI 好友感 + 打磨用户体验
- **第三阶段**：接入微信 + 跨端互通

每个阶段都有明确的目标、任务清单和验收标准，阶段结束时 `main` 分支上的代码都应能成功部署到 Render。

### Git 工作流约定

> **重要：所有开发和修改都直接在 `main` 分支上进行，每次完成后推送到远程 `main` 分支。**

```bash
# 查看当前状态
git status

# 添加修改
git add .

# 提交（使用有意义的提交信息）
git commit -m "feat: 添加 xxx 功能"
git commit -m "fix: 修复 xxx 问题"
git commit -m "refactor: 重构 xxx 模块"

# 推送到远程 main 分支
git push origin main
```

Render 会自动监听 `main` 分支的推送，触发自动部署。

---

## 1. 项目总览

### 1.1 产品定位

「灵伴」是一个 **AI 好友 / 角色陪伴** 应用。每个智能体都像用户拥有的一位虚拟朋友：有鲜明性格、背景、说话方式，会主动关心用户、找话题聊天。用户无需注册即可匿名使用，可创建多个不同性格的 AI 好友。

### 1.2 技术栈

| 层 | 选型 | 说明 |
|---|---|---|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS + Zustand + React Router | 移动端优先，单页应用 |
| 后端 | Express 4 + TypeScript（ESM） | REST + SSE 流式 |
| 数据库 | PostgreSQL + Prisma ORM v7 | |
| LLM | OpenAI 兼容格式 | 支持 OpenAI / DeepSeek / 自定义端点 |
| 部署 | Render Blueprint | Web Service + PostgreSQL |

### 1.3 当前项目结构

```text
/workspace
├── src/               # React 前端
│   ├── components/    # 通用组件
│   ├── pages/         # 页面
│   ├── store/         # Zustand 状态
│   ├── lib/           # API 封装、工具函数
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── api/               # Express 后端
│   ├── routes/        # 业务路由
│   ├── middleware/    # 鉴权
│   ├── lib/           # prisma、llm 适配器
│   ├── types/         # 类型声明
│   ├── app.ts
│   └── server.ts
├── prisma/            # Schema 与迁移
├── public/            # 静态资源
├── scripts/           # 维护脚本
├── render.yaml        # Render Blueprint 配置
└── package.json
```

---

## 2. 总体路线图

| 阶段 | 核心目标 | 产出标准 |
|---|---|---|
| **第一阶段** | 核心链路完善 + 稳定部署 | 修复问题、完善功能、Render 部署成功并可用 |
| **第二阶段** | AI 好友感 + 体验打磨 | 长期记忆、主动开口、角色一致、UI 顺滑 |
| **第三阶段** | 接入微信 | 微信内可多轮对话，跨端历史与记忆互通 |

---

## 3. 第一阶段：核心链路完善与部署上线

### 3.1 目标

基于现有代码，修复问题、完善功能、确保「匿名登录 → 创建 AI 好友 → 流式聊天」主链路完整可用，并成功部署到 Render 生产环境。

### 3.2 当前已实现

- ✅ 工程骨架：前后端分离、TypeScript、Vite、Tailwind CSS
- ✅ 数据库模型：User、Agent、ChatMessage 三张核心表
- ✅ 后端路由：auth、agents、chat、upload
- ✅ LLM 适配层：OpenAI 兼容格式，支持流式（SSE）
- ✅ 前端页面：AgentsPage、AgentEditPage、ChatPage、ProfilePage
- ✅ 状态管理：auth、agents、chat、theme、toast
- ✅ 通用组件：Avatar、BottomNav、GlassCard、Modal、Toast、EmptyState、ErrorBoundary
- ✅ 智能体模板：预设模板一键填充
- ✅ 双主题：极光 / 七彩
- ✅ Render Blueprint 配置：`render.yaml`

### 3.3 待完善任务

#### 3.3.1 代码质量检查与修复

- 运行 `pnpm lint`，修复所有 ESLint 错误和警告
- 运行 `pnpm check`，确保 TypeScript 类型检查通过
- 运行 `pnpm build`，确保生产构建成功
- 检查 Prisma schema 与生成路径是否正确（`output` 指向 `../src/generated/prisma`）

#### 3.3.2 核心功能验证与修复

- **# 灵伴 AI 好友 - 三阶段开发文档

> 版本：v1.0
> 当前状态：第一阶段核心代码已完成，待完善与部署
> 部署目标：Render
> 代码分支：main（默认分支）

---

## 0. 文档说明

本文档是「灵伴 AI 好友」项目的开发路线图，按三个阶段递进式推进：

- **第一阶段**：完善核心链路 + 成功部署到 Render
- **第二阶段**：深化 AI 好友感 + 打磨用户体验
- **第三阶段**：接入微信 + 跨端互通

每个阶段都有明确的目标、任务清单和验收标准，阶段结束时 `main` 分支上的代码都应能成功部署到 Render。

### Git 工作流约定

> **重要：所有开发和修改都直接在 `main` 分支上进行，每次完成后推送到远程 `main` 分支。**

```bash
# 查看当前状态
git status

# 添加修改
git add .

# 提交（使用有意义的提交信息）
git commit -m "feat: 添加 xxx 功能"
git commit -m "fix: 修复 xxx 问题"
git commit -m "refactor: 重构 xxx 模块"

# 推送到远程 main 分支
git push origin main
```

Render 会自动监听 `main` 分支的推送，触发自动部署。

---

## 1. 项目总览

### 1.1 产品定位

「灵伴」是一个 **AI 好友 / 角色陪伴** 应用。每个智能体都像用户拥有的一位虚拟朋友：有鲜明性格、背景、说话方式，会主动关心用户、找话题聊天。用户无需注册即可匿名使用，可创建多个不同性格的 AI 好友。

### 1.2 技术栈

| 层 | 选型 | 说明 |
|---|---|---|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS + Zustand + React Router | 移动端优先，单页应用 |
| 后端 | Express 4 + TypeScript（ESM） | REST + SSE 流式 |
| 数据库 | PostgreSQL + Prisma ORM v7 | |
| LLM | OpenAI 兼容格式 | 支持 OpenAI / DeepSeek / 自定义端点 |
| 部署 | Render Blueprint | Web Service + PostgreSQL |

### 1.3 当前项目结构

```text
/workspace
├── src/               # React 前端
│   ├── components/    # 通用组件
│   ├── pages/         # 页面
│   ├── store/         # Zustand 状态
│   ├── lib/           # API 封装、工具函数
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── api/               # Express 后端
│   ├── routes/        # 业务路由
│   ├── middleware/    # 鉴权
│   ├── lib/           # prisma、llm 适配器
│   ├── types/         # 类型声明
│   ├── app.ts
│   └── server.ts
├── prisma/            # Schema 与迁移
├── public/            # 静态资源
├── scripts/           # 维护脚本
├── render.yaml        # Render Blueprint 配置
└── package.json
```

---

## 2. 总体路线图

| 阶段 | 核心目标 | 产出标准 |
|---|---|---|
| **第一阶段** | 核心链路完善 + 稳定部署 | 修复问题、完善功能、Render 部署成功并可用 |
| **第二阶段** | AI 好友感 + 体验打磨 | 长期记忆、主动开口、角色一致、UI 顺滑 |
| **第三阶段** | 接入微信 | 微信内可多轮对话，跨端历史与记忆互通 |

---

## 3. 第一阶段：核心链路完善与部署上线

### 3.1 目标

基于现有代码，修复问题、完善功能、确保「匿名登录 → 创建 AI 好友 → 流式聊天」主链路完整可用，并成功部署到 Render 生产环境。

### 3.2 当前已实现

- ✅ 工程骨架：前后端分离、TypeScript、Vite、Tailwind CSS
- ✅ 数据库模型：User、Agent、ChatMessage 三张核心表
- ✅ 后端路由：auth、agents、chat、upload
- ✅ LLM 适配层：OpenAI 兼容格式，支持流式（SSE）
- ✅ 前端页面：AgentsPage、AgentEditPage、ChatPage、ProfilePage
- ✅ 状态管理：auth、agents、chat、theme、toast
- ✅ 通用组件：Avatar、BottomNav、GlassCard、Modal、Toast、EmptyState、ErrorBoundary
- ✅ 智能体模板：预设模板一键填充
- ✅ 双主题：极光 / 七彩
- ✅ Render Blueprint 配置：`render.yaml`

### 3.3 待完善任务

#### 3.3.1 代码质量检查与修复

- 运行 `pnpm lint`，修复所有 ESLint 错误和警告
- 运行 `pnpm check`，确保 TypeScript 类型检查通过
- 运行 `pnpm build`，确保生产构建成功
- 检查 Prisma schema 与生成路径是否正确（`output` 指向 `../src/generated/prisma`）

#### 3.3.2 核心功能验证与修复

- **开场白功能**：验证进入聊天页时智能体是否自动发送问候
- **流式对话# 灵伴 AI 好友 - 三阶段开发文档

> 版本：v1.0
> 当前状态：第一阶段核心代码已完成，待完善与部署
> 部署目标：Render
> 代码分支：main（默认分支）

---

## 0. 文档说明

本文档是「灵伴 AI 好友」项目的开发路线图，按三个阶段递进式推进：

- **第一阶段**：完善核心链路 + 成功部署到 Render
- **第二阶段**：深化 AI 好友感 + 打磨用户体验
- **第三阶段**：接入微信 + 跨端互通

每个阶段都有明确的目标、任务清单和验收标准，阶段结束时 `main` 分支上的代码都应能成功部署到 Render。

### Git 工作流约定

> **重要：所有开发和修改都直接在 `main` 分支上进行，每次完成后推送到远程 `main` 分支。**

```bash
# 查看当前状态
git status

# 添加修改
git add .

# 提交（使用有意义的提交信息）
git commit -m "feat: 添加 xxx 功能"
git commit -m "fix: 修复 xxx 问题"
git commit -m "refactor: 重构 xxx 模块"

# 推送到远程 main 分支
git push origin main
```

Render 会自动监听 `main` 分支的推送，触发自动部署。

---

## 1. 项目总览

### 1.1 产品定位

「灵伴」是一个 **AI 好友 / 角色陪伴** 应用。每个智能体都像用户拥有的一位虚拟朋友：有鲜明性格、背景、说话方式，会主动关心用户、找话题聊天。用户无需注册即可匿名使用，可创建多个不同性格的 AI 好友。

### 1.2 技术栈

| 层 | 选型 | 说明 |
|---|---|---|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS + Zustand + React Router | 移动端优先，单页应用 |
| 后端 | Express 4 + TypeScript（ESM） | REST + SSE 流式 |
| 数据库 | PostgreSQL + Prisma ORM v7 | |
| LLM | OpenAI 兼容格式 | 支持 OpenAI / DeepSeek / 自定义端点 |
| 部署 | Render Blueprint | Web Service + PostgreSQL |

### 1.3 当前项目结构

```text
/workspace
├── src/               # React 前端
│   ├── components/    # 通用组件
│   ├── pages/         # 页面
│   ├── store/         # Zustand 状态
│   ├── lib/           # API 封装、工具函数
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── api/               # Express 后端
│   ├── routes/        # 业务路由
│   ├── middleware/    # 鉴权
│   ├── lib/           # prisma、llm 适配器
│   ├── types/         # 类型声明
│   ├── app.ts
│   └── server.ts
├── prisma/            # Schema 与迁移
├── public/            # 静态资源
├── scripts/           # 维护脚本
├── render.yaml        # Render Blueprint 配置
└── package.json
```

---

## 2. 总体路线图

| 阶段 | 核心目标 | 产出标准 |
|---|---|---|
| **第一阶段** | 核心链路完善 + 稳定部署 | 修复问题、完善功能、Render 部署成功并可用 |
| **第二阶段** | AI 好友感 + 体验打磨 | 长期记忆、主动开口、角色一致、UI 顺滑 |
| **第三阶段** | 接入微信 | 微信内可多轮对话，跨端历史与记忆互通 |

---

## 3. 第一阶段：核心链路完善与部署上线

### 3.1 目标

基于现有代码，修复问题、完善功能、确保「匿名登录 → 创建 AI 好友 → 流式聊天」主链路完整可用，并成功部署到 Render 生产环境。

### 3.2 当前已实现

- ✅ 工程骨架：前后端分离、TypeScript、Vite、Tailwind CSS
- ✅ 数据库模型：User、Agent、ChatMessage 三张核心表
- ✅ 后端路由：auth、agents、chat、upload
- ✅ LLM 适配层：OpenAI 兼容格式，支持流式（SSE）
- ✅ 前端页面：AgentsPage、AgentEditPage、ChatPage、ProfilePage
- ✅ 状态管理：auth、agents、chat、theme、toast
- ✅ 通用组件：Avatar、BottomNav、GlassCard、Modal、Toast、EmptyState、ErrorBoundary
- ✅ 智能体模板：预设模板一键填充
- ✅ 双主题：极光 / 七彩
- ✅ Render Blueprint 配置：`render.yaml`

### 3.3 待完善任务

#### 3.3.1 代码质量检查与修复

- 运行 `pnpm lint`，修复所有 ESLint 错误和警告
- 运行 `pnpm check`，确保 TypeScript 类型检查通过
- 运行 `pnpm build`，确保生产构建成功
- 检查 Prisma schema 与生成路径是否正确（`output` 指向 `../src/generated/prisma`）

#### 3.3.2 核心功能验证与修复

- **开场白功能**：验证进入聊天页时智能体是否自动发送问候
- **流式对话**：验证 SSE 流式渲染是否正常，中断处理是否完善
- **重新生成# 灵伴 AI 好友 - 三阶段开发文档

> 版本：v1.0
> 当前状态：第一阶段核心代码已完成，待完善与部署
> 部署目标：Render
> 代码分支：main（默认分支）

---

## 0. 文档说明

本文档是「灵伴 AI 好友」项目的开发路线图，按三个阶段递进式推进：

- **第一阶段**：完善核心链路 + 成功部署到 Render
- **第二阶段**：深化 AI 好友感 + 打磨用户体验
- **第三阶段**：接入微信 + 跨端互通

每个阶段都有明确的目标、任务清单和验收标准，阶段结束时 `main` 分支上的代码都应能成功部署到 Render。

### Git 工作流约定

> **重要：所有开发和修改都直接在 `main` 分支上进行，每次完成后推送到远程 `main` 分支。**

```bash
# 查看当前状态
git status

# 添加修改
git add .

# 提交（使用有意义的提交信息）
git commit -m "feat: 添加 xxx 功能"
git commit -m "fix: 修复 xxx 问题"
git commit -m "refactor: 重构 xxx 模块"

# 推送到远程 main 分支
git push origin main
```

Render 会自动监听 `main` 分支的推送，触发自动部署。

---

## 1. 项目总览

### 1.1 产品定位

「灵伴」是一个 **AI 好友 / 角色陪伴** 应用。每个智能体都像用户拥有的一位虚拟朋友：有鲜明性格、背景、说话方式，会主动关心用户、找话题聊天。用户无需注册即可匿名使用，可创建多个不同性格的 AI 好友。

### 1.2 技术栈

| 层 | 选型 | 说明 |
|---|---|---|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS + Zustand + React Router | 移动端优先，单页应用 |
| 后端 | Express 4 + TypeScript（ESM） | REST + SSE 流式 |
| 数据库 | PostgreSQL + Prisma ORM v7 | |
| LLM | OpenAI 兼容格式 | 支持 OpenAI / DeepSeek / 自定义端点 |
| 部署 | Render Blueprint | Web Service + PostgreSQL |

### 1.3 当前项目结构

```text
/workspace
├── src/               # React 前端
│   ├── components/    # 通用组件
│   ├── pages/         # 页面
│   ├── store/         # Zustand 状态
│   ├── lib/           # API 封装、工具函数
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── api/               # Express 后端
│   ├── routes/        # 业务路由
│   ├── middleware/    # 鉴权
│   ├── lib/           # prisma、llm 适配器
│   ├── types/         # 类型声明
│   ├── app.ts
│   └── server.ts
├── prisma/            # Schema 与迁移
├── public/            # 静态资源
├── scripts/           # 维护脚本
├── render.yaml        # Render Blueprint 配置
└── package.json
```

---

## 2. 总体路线图

| 阶段 | 核心目标 | 产出标准 |
|---|---|---|
| **第一阶段** | 核心链路完善 + 稳定部署 | 修复问题、完善功能、Render 部署成功并可用 |
| **第二阶段** | AI 好友感 + 体验打磨 | 长期记忆、主动开口、角色一致、UI 顺滑 |
| **第三阶段** | 接入微信 | 微信内可多轮对话，跨端历史与记忆互通 |

---

## 3. 第一阶段：核心链路完善与部署上线

### 3.1 目标

基于现有代码，修复问题、完善功能、确保「匿名登录 → 创建 AI 好友 → 流式聊天」主链路完整可用，并成功部署到 Render 生产环境。

### 3.2 当前已实现

- ✅ 工程骨架：前后端分离、TypeScript、Vite、Tailwind CSS
- ✅ 数据库模型：User、Agent、ChatMessage 三张核心表
- ✅ 后端路由：auth、agents、chat、upload
- ✅ LLM 适配层：OpenAI 兼容格式，支持流式（SSE）
- ✅ 前端页面：AgentsPage、AgentEditPage、ChatPage、ProfilePage
- ✅ 状态管理：auth、agents、chat、theme、toast
- ✅ 通用组件：Avatar、BottomNav、GlassCard、Modal、Toast、EmptyState、ErrorBoundary
- ✅ 智能体模板：预设模板一键填充
- ✅ 双主题：极光 / 七彩
- ✅ Render Blueprint 配置：`render.yaml`

### 3.3 待完善任务

#### 3.3.1 代码质量检查与修复

- 运行 `pnpm lint`，修复所有 ESLint 错误和警告
- 运行 `pnpm check`，确保 TypeScript 类型检查通过
- 运行 `pnpm build`，确保生产构建成功
- 检查 Prisma schema 与生成路径是否正确（`output` 指向 `../src/generated/prisma`）

#### 3.3.2 核心功能验证与修复

- **开场白功能**：验证进入聊天页时智能体是否自动发送问候
- **流式对话**：验证 SSE 流式渲染是否正常，中断处理是否完善
- **重新生成**：验证重新生成最后一条消息功能
- **清空对话**：验证清空后历史# 灵伴 AI 好友 - 三阶段开发文档

> 版本：v1.0
> 当前状态：第一阶段核心代码已完成，待完善与部署
> 部署目标：Render
> 代码分支：main（默认分支）

---

## 0. 文档说明

本文档是「灵伴 AI 好友」项目的开发路线图，按三个阶段递进式推进：

- **第一阶段**：完善核心链路 + 成功部署到 Render
- **第二阶段**：深化 AI 好友感 + 打磨用户体验
- **第三阶段**：接入微信 + 跨端互通

每个阶段都有明确的目标、任务清单和验收标准，阶段结束时 `main` 分支上的代码都应能成功部署到 Render。

### Git 工作流约定

> **重要：所有开发和修改都直接在 `main` 分支上进行，每次完成后推送到远程 `main` 分支。**

```bash
# 查看当前状态
git status

# 添加修改
git add .

# 提交（使用有意义的提交信息）
git commit -m "feat: 添加 xxx 功能"
git commit -m "fix: 修复 xxx 问题"
git commit -m "refactor: 重构 xxx 模块"

# 推送到远程 main 分支
git push origin main
```

Render 会自动监听 `main` 分支的推送，触发自动部署。

---

## 1. 项目总览

### 1.1 产品定位

「灵伴」是一个 **AI 好友 / 角色陪伴** 应用。每个智能体都像用户拥有的一位虚拟朋友：有鲜明性格、背景、说话方式，会主动关心用户、找话题聊天。用户无需注册即可匿名使用，可创建多个不同性格的 AI 好友。

### 1.2 技术栈

| 层 | 选型 | 说明 |
|---|---|---|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS + Zustand + React Router | 移动端优先，单页应用 |
| 后端 | Express 4 + TypeScript（ESM） | REST + SSE 流式 |
| 数据库 | PostgreSQL + Prisma ORM v7 | |
| LLM | OpenAI 兼容格式 | 支持 OpenAI / DeepSeek / 自定义端点 |
| 部署 | Render Blueprint | Web Service + PostgreSQL |

### 1.3 当前项目结构

```text
/workspace
├── src/               # React 前端
│   ├── components/    # 通用组件
│   ├── pages/         # 页面
│   ├── store/         # Zustand 状态
│   ├── lib/           # API 封装、工具函数
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── api/               # Express 后端
│   ├── routes/        # 业务路由
│   ├── middleware/    # 鉴权
│   ├── lib/           # prisma、llm 适配器
│   ├── types/         # 类型声明
│   ├── app.ts
│   └── server.ts
├── prisma/            # Schema 与迁移
├── public/            # 静态资源
├── scripts/           # 维护脚本
├── render.yaml        # Render Blueprint 配置
└── package.json
```

---

## 2. 总体路线图

| 阶段 | 核心目标 | 产出标准 |
|---|---|---|
| **第一阶段** | 核心链路完善 + 稳定部署 | 修复问题、完善功能、Render 部署成功并可用 |
| **第二阶段** | AI 好友感 + 体验打磨 | 长期记忆、主动开口、角色一致、UI 顺滑 |
| **第三阶段** | 接入微信 | 微信内可多轮对话，跨端历史与记忆互通 |

---

## 3. 第一阶段：核心链路完善与部署上线

### 3.1 目标

基于现有代码，修复问题、完善功能、确保「匿名登录 → 创建 AI 好友 → 流式聊天」主链路完整可用，并成功部署到 Render 生产环境。

### 3.2 当前已实现

- ✅ 工程骨架：前后端分离、TypeScript、Vite、Tailwind CSS
- ✅ 数据库模型：User、Agent、ChatMessage 三张核心表
- ✅ 后端路由：auth、agents、chat、upload
- ✅ LLM 适配层：OpenAI 兼容格式，支持流式（SSE）
- ✅ 前端页面：AgentsPage、AgentEditPage、ChatPage、ProfilePage
- ✅ 状态管理：auth、agents、chat、theme、toast
- ✅ 通用组件：Avatar、BottomNav、GlassCard、Modal、Toast、EmptyState、ErrorBoundary
- ✅ 智能体模板：预设模板一键填充
- ✅ 双主题：极光 / 七彩
- ✅ Render Blueprint 配置：`render.yaml`

### 3.3 待完善任务

#### 3.3.1 代码质量检查与修复

- 运行 `pnpm lint`，修复所有 ESLint 错误和警告
- 运行 `pnpm check`，确保 TypeScript 类型检查通过
- 运行 `pnpm build`，确保生产构建成功
- 检查 Prisma schema 与生成路径是否正确（`output` 指向 `../src/generated/prisma`）

#### 3.3.2 核心功能验证与修复

- **开场白功能**：验证进入聊天页时智能体是否自动发送问候
- **流式对话**：验证 SSE 流式渲染是否正常，中断处理是否完善
- **重新生成**：验证重新生成最后一条消息功能
- **清空对话**：验证清空后历史记录是否正确删除
- **头像上传**：验证头像上传和显示是否正常
-# 灵伴 AI 好友 - 三阶段开发文档

> 版本：v1.0
> 当前状态：第一阶段核心代码已完成，待完善与部署
> 部署目标：Render
> 代码分支：main（默认分支）

---

## 0. 文档说明

本文档是「灵伴 AI 好友」项目的开发路线图，按三个阶段递进式推进：

- **第一阶段**：完善核心链路 + 成功部署到 Render
- **第二阶段**：深化 AI 好友感 + 打磨用户体验
- **第三阶段**：接入微信 + 跨端互通

每个阶段都有明确的目标、任务清单和验收标准，阶段结束时 `main` 分支上的代码都应能成功部署到 Render。

### Git 工作流约定

> **重要：所有开发和修改都直接在 `main` 分支上进行，每次完成后推送到远程 `main` 分支。**

```bash
# 查看当前状态
git status

# 添加修改
git add .

# 提交（使用有意义的提交信息）
git commit -m "feat: 添加 xxx 功能"
git commit -m "fix: 修复 xxx 问题"
git commit -m "refactor: 重构 xxx 模块"

# 推送到远程 main 分支
git push origin main
```

Render 会自动监听 `main` 分支的推送，触发自动部署。

---

## 1. 项目总览

### 1.1 产品定位

「灵伴」是一个 **AI 好友 / 角色陪伴** 应用。每个智能体都像用户拥有的一位虚拟朋友：有鲜明性格、背景、说话方式，会主动关心用户、找话题聊天。用户无需注册即可匿名使用，可创建多个不同性格的 AI 好友。

### 1.2 技术栈

| 层 | 选型 | 说明 |
|---|---|---|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS + Zustand + React Router | 移动端优先，单页应用 |
| 后端 | Express 4 + TypeScript（ESM） | REST + SSE 流式 |
| 数据库 | PostgreSQL + Prisma ORM v7 | |
| LLM | OpenAI 兼容格式 | 支持 OpenAI / DeepSeek / 自定义端点 |
| 部署 | Render Blueprint | Web Service + PostgreSQL |

### 1.3 当前项目结构

```text
/workspace
├── src/               # React 前端
│   ├── components/    # 通用组件
│   ├── pages/         # 页面
│   ├── store/         # Zustand 状态
│   ├── lib/           # API 封装、工具函数
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── api/               # Express 后端
│   ├── routes/        # 业务路由
│   ├── middleware/    # 鉴权
│   ├── lib/           # prisma、llm 适配器
│   ├── types/         # 类型声明
│   ├── app.ts
│   └── server.ts
├── prisma/            # Schema 与迁移
├── public/            # 静态资源
├── scripts/           # 维护脚本
├── render.yaml        # Render Blueprint 配置
└── package.json
```

---

## 2. 总体路线图

| 阶段 | 核心目标 | 产出标准 |
|---|---|---|
| **第一阶段** | 核心链路完善 + 稳定部署 | 修复问题、完善功能、Render 部署成功并可用 |
| **第二阶段** | AI 好友感 + 体验打磨 | 长期记忆、主动开口、角色一致、UI 顺滑 |
| **第三阶段** | 接入微信 | 微信内可多轮对话，跨端历史与记忆互通 |

---

## 3. 第一阶段：核心链路完善与部署上线

### 3.1 目标

基于现有代码，修复问题、完善功能、确保「匿名登录 → 创建 AI 好友 → 流式聊天」主链路完整可用，并成功部署到 Render 生产环境。

### 3.2 当前已实现

- ✅ 工程骨架：前后端分离、TypeScript、Vite、Tailwind CSS
- ✅ 数据库模型：User、Agent、ChatMessage 三张核心表
- ✅ 后端路由：auth、agents、chat、upload
- ✅ LLM 适配层：OpenAI 兼容格式，支持流式（SSE）
- ✅ 前端页面：AgentsPage、AgentEditPage、ChatPage、ProfilePage
- ✅ 状态管理：auth、agents、chat、theme、toast
- ✅ 通用组件：Avatar、BottomNav、GlassCard、Modal、Toast、EmptyState、ErrorBoundary
- ✅ 智能体模板：预设模板一键填充
- ✅ 双主题：极光 / 七彩
- ✅ Render Blueprint 配置：`render.yaml`

### 3.3 待完善任务

#### 3.3.1 代码质量检查与修复

- 运行 `pnpm lint`，修复所有 ESLint 错误和警告
- 运行 `pnpm check`，确保 TypeScript 类型检查通过
- 运行 `pnpm build`，确保生产构建成功
- 检查 Prisma schema 与生成路径是否正确（`output` 指向 `../src/generated/prisma`）

#### 3.3.2 核心功能验证与修复

- **开场白功能**：验证进入聊天页时智能体是否自动发送问候
- **流式对话**：验证 SSE 流式渲染是否正常，中断处理是否完善
- **重新生成**：验证重新生成最后一条消息功能
- **清空对话**：验证清空后历史记录是否正确删除
- **头像上传**：验证头像上传和显示是否正常
- **模板功能**：验证预设模板是否正确# 灵伴 AI 好友 - 三阶段开发文档

> 版本：v1.0
> 当前状态：第一阶段核心代码已完成，待完善与部署
> 部署目标：Render
> 代码分支：main（默认分支）

---

## 0. 文档说明

本文档是「灵伴 AI 好友」项目的开发路线图，按三个阶段递进式推进：

- **第一阶段**：完善核心链路 + 成功部署到 Render
- **第二阶段**：深化 AI 好友感 + 打磨用户体验
- **第三阶段**：接入微信 + 跨端互通

每个阶段都有明确的目标、任务清单和验收标准，阶段结束时 `main` 分支上的代码都应能成功部署到 Render。

### Git 工作流约定

> **重要：所有开发和修改都直接在 `main` 分支上进行，每次完成后推送到远程 `main` 分支。**

```bash
# 查看当前状态
git status

# 添加修改
git add .

# 提交（使用有意义的提交信息）
git commit -m "feat: 添加 xxx 功能"
git commit -m "fix: 修复 xxx 问题"
git commit -m "refactor: 重构 xxx 模块"

# 推送到远程 main 分支
git push origin main
```

Render 会自动监听 `main` 分支的推送，触发自动部署。

---

## 1. 项目总览

### 1.1 产品定位

「灵伴」是一个 **AI 好友 / 角色陪伴** 应用。每个智能体都像用户拥有的一位虚拟朋友：有鲜明性格、背景、说话方式，会主动关心用户、找话题聊天。用户无需注册即可匿名使用，可创建多个不同性格的 AI 好友。

### 1.2 技术栈

| 层 | 选型 | 说明 |
|---|---|---|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS + Zustand + React Router | 移动端优先，单页应用 |
| 后端 | Express 4 + TypeScript（ESM） | REST + SSE 流式 |
| 数据库 | PostgreSQL + Prisma ORM v7 | |
| LLM | OpenAI 兼容格式 | 支持 OpenAI / DeepSeek / 自定义端点 |
| 部署 | Render Blueprint | Web Service + PostgreSQL |

### 1.3 当前项目结构

```text
/workspace
├── src/               # React 前端
│   ├── components/    # 通用组件
│   ├── pages/         # 页面
│   ├── store/         # Zustand 状态
│   ├── lib/           # API 封装、工具函数
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── api/               # Express 后端
│   ├── routes/        # 业务路由
│   ├── middleware/    # 鉴权
│   ├── lib/           # prisma、llm 适配器
│   ├── types/         # 类型声明
│   ├── app.ts
│   └── server.ts
├── prisma/            # Schema 与迁移
├── public/            # 静态资源
├── scripts/           # 维护脚本
├── render.yaml        # Render Blueprint 配置
└── package.json
```

---

## 2. 总体路线图

| 阶段 | 核心目标 | 产出标准 |
|---|---|---|
| **第一阶段** | 核心链路完善 + 稳定部署 | 修复问题、完善功能、Render 部署成功并可用 |
| **第二阶段** | AI 好友感 + 体验打磨 | 长期记忆、主动开口、角色一致、UI 顺滑 |
| **第三阶段** | 接入微信 | 微信内可多轮对话，跨端历史与记忆互通 |

---

## 3. 第一阶段：核心链路完善与部署上线

### 3.1 目标

基于现有代码，修复问题、完善功能、确保「匿名登录 → 创建 AI 好友 → 流式聊天」主链路完整可用，并成功部署到 Render 生产环境。

### 3.2 当前已实现

- ✅ 工程骨架：前后端分离、TypeScript、Vite、Tailwind CSS
- ✅ 数据库模型：User、Agent、ChatMessage 三张核心表
- ✅ 后端路由：auth、agents、chat、upload
- ✅ LLM 适配层：OpenAI 兼容格式，支持流式（SSE）
- ✅ 前端页面：AgentsPage、AgentEditPage、ChatPage、ProfilePage
- ✅ 状态管理：auth、agents、chat、theme、toast
- ✅ 通用组件：Avatar、BottomNav、GlassCard、Modal、Toast、EmptyState、ErrorBoundary
- ✅ 智能体模板：预设模板一键填充
- ✅ 双主题：极光 / 七彩
- ✅ Render Blueprint 配置：`render.yaml`

### 3.3 待完善任务

#### 3.3.1 代码质量检查与修复

- 运行 `pnpm lint`，修复所有 ESLint 错误和警告
- 运行 `pnpm check`，确保 TypeScript 类型检查通过
- 运行 `pnpm build`，确保生产构建成功
- 检查 Prisma schema 与生成路径是否正确（`output` 指向 `../src/generated/prisma`）

#### 3.3.2 核心功能验证与修复

- **开场白功能**：验证进入聊天页时智能体是否自动发送问候
- **流式对话**：验证 SSE 流式渲染是否正常，中断处理是否完善
- **重新生成**：验证重新生成最后一条消息功能
- **清空对话**：验证清空后历史记录是否正确删除
- **头像上传**：验证头像上传和显示是否正常
- **模板功能**：验证预设模板是否正确填充表单
- **主题切换**：验证极光 / 七彩主题切换是否正常

##### 灵伴 AI 好友 - 三阶段开发文档

> 版本：v1.0
> 当前状态：第一阶段核心代码已完成，待完善与部署
> 部署目标：Render
> 代码分支：main（默认分支）

---

## 0. 文档说明

本文档是「灵伴 AI 好友」项目的开发路线图，按三个阶段递进式推进：

- **第一阶段**：完善核心链路 + 成功部署到 Render
- **第二阶段**：深化 AI 好友感 + 打磨用户体验
- **第三阶段**：接入微信 + 跨端互通

每个阶段都有明确的目标、任务清单和验收标准，阶段结束时 `main` 分支上的代码都应能成功部署到 Render。

### Git 工作流约定

> **重要：所有开发和修改都直接在 `main` 分支上进行，每次完成后推送到远程 `main` 分支。**

```bash
# 查看当前状态
git status

# 添加修改
git add .

# 提交（使用有意义的提交信息）
git commit -m "feat: 添加 xxx 功能"
git commit -m "fix: 修复 xxx 问题"
git commit -m "refactor: 重构 xxx 模块"

# 推送到远程 main 分支
git push origin main
```

Render 会自动监听 `main` 分支的推送，触发自动部署。

---

## 1. 项目总览

### 1.1 产品定位

「灵伴」是一个 **AI 好友 / 角色陪伴** 应用。每个智能体都像用户拥有的一位虚拟朋友：有鲜明性格、背景、说话方式，会主动关心用户、找话题聊天。用户无需注册即可匿名使用，可创建多个不同性格的 AI 好友。

### 1.2 技术栈

| 层 | 选型 | 说明 |
|---|---|---|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS + Zustand + React Router | 移动端优先，单页应用 |
| 后端 | Express 4 + TypeScript（ESM） | REST + SSE 流式 |
| 数据库 | PostgreSQL + Prisma ORM v7 | |
| LLM | OpenAI 兼容格式 | 支持 OpenAI / DeepSeek / 自定义端点 |
| 部署 | Render Blueprint | Web Service + PostgreSQL |

### 1.3 当前项目结构

```text
/workspace
├── src/               # React 前端
│   ├── components/    # 通用组件
│   ├── pages/         # 页面
│   ├── store/         # Zustand 状态
│   ├── lib/           # API 封装、工具函数
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── api/               # Express 后端
│   ├── routes/        # 业务路由
│   ├── middleware/    # 鉴权
│   ├── lib/           # prisma、llm 适配器
│   ├── types/         # 类型声明
│   ├── app.ts
│   └── server.ts
├── prisma/            # Schema 与迁移
├── public/            # 静态资源
├── scripts/           # 维护脚本
├── render.yaml        # Render Blueprint 配置
└── package.json
```

---

## 2. 总体路线图

| 阶段 | 核心目标 | 产出标准 |
|---|---|---|
| **第一阶段** | 核心链路完善 + 稳定部署 | 修复问题、完善功能、Render 部署成功并可用 |
| **第二阶段** | AI 好友感 + 体验打磨 | 长期记忆、主动开口、角色一致、UI 顺滑 |
| **第三阶段** | 接入微信 | 微信内可多轮对话，跨端历史与记忆互通 |

---

## 3. 第一阶段：核心链路完善与部署上线

### 3.1 目标

基于现有代码，修复问题、完善功能、确保「匿名登录 → 创建 AI 好友 → 流式聊天」主链路完整可用，并成功部署到 Render 生产环境。

### 3.2 当前已实现

- ✅ 工程骨架：前后端分离、TypeScript、Vite、Tailwind CSS
- ✅ 数据库模型：User、Agent、ChatMessage 三张核心表
- ✅ 后端路由：auth、agents、chat、upload
- ✅ LLM 适配层：OpenAI 兼容格式，支持流式（SSE）
- ✅ 前端页面：AgentsPage、AgentEditPage、ChatPage、ProfilePage
- ✅ 状态管理：auth、agents、chat、theme、toast
- ✅ 通用组件：Avatar、BottomNav、GlassCard、Modal、Toast、EmptyState、ErrorBoundary
- ✅ 智能体模板：预设模板一键填充
- ✅ 双主题：极光 / 七彩
- ✅ Render Blueprint 配置：`render.yaml`

### 3.3 待完善任务

#### 3.3.1 代码质量检查与修复

- 运行 `pnpm lint`，修复所有 ESLint 错误和警告
- 运行 `pnpm check`，确保 TypeScript 类型检查通过
- 运行 `pnpm build`，确保生产构建成功
- 检查 Prisma schema 与生成路径是否正确（`output` 指向 `../src/generated/prisma`）

#### 3.3.2 核心功能验证与修复

- **开场白功能**：验证进入聊天页时智能体是否自动发送问候
- **流式对话**：验证 SSE 流式渲染是否正常，中断处理是否完善
- **重新生成**：验证重新生成最后一条消息功能
- **清空对话**：验证清空后历史记录是否正确删除
- **头像上传**：验证头像上传和显示是否正常
- **模板功能**：验证预设模板是否正确填充表单
- **主题切换**：验证极光 / 七彩主题切换是否正常

#### 3.3.3 移动端适配优化

- iOS 键盘弹出时输入框位置# 灵伴 AI 好友 - 三阶段开发文档

> 版本：v1.0
> 当前状态：第一阶段核心代码已完成，待完善与部署
> 部署目标：Render
> 代码分支：main（默认分支）

---

## 0. 文档说明

本文档是「灵伴 AI 好友」项目的开发路线图，按三个阶段递进式推进：

- **第一阶段**：完善核心链路 + 成功部署到 Render
- **第二阶段**：深化 AI 好友感 + 打磨用户体验
- **第三阶段**：接入微信 + 跨端互通

每个阶段都有明确的目标、任务清单和验收标准，阶段结束时 `main` 分支上的代码都应能成功部署到 Render。

### Git 工作流约定

> **重要：所有开发和修改都直接在 `main` 分支上进行，每次完成后推送到远程 `main` 分支。**

```bash
# 查看当前状态
git status

# 添加修改
git add .

# 提交（使用有意义的提交信息）
git commit -m "feat: 添加 xxx 功能"
git commit -m "fix: 修复 xxx 问题"
git commit -m "refactor: 重构 xxx 模块"

# 推送到远程 main 分支
git push origin main
```

Render 会自动监听 `main` 分支的推送，触发自动部署。

---

## 1. 项目总览

### 1.1 产品定位

「灵伴」是一个 **AI 好友 / 角色陪伴** 应用。每个智能体都像用户拥有的一位虚拟朋友：有鲜明性格、背景、说话方式，会主动关心用户、找话题聊天。用户无需注册即可匿名使用，可创建多个不同性格的 AI 好友。

### 1.2 技术栈

| 层 | 选型 | 说明 |
|---|---|---|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS + Zustand + React Router | 移动端优先，单页应用 |
| 后端 | Express 4 + TypeScript（ESM） | REST + SSE 流式 |
| 数据库 | PostgreSQL + Prisma ORM v7 | |
| LLM | OpenAI 兼容格式 | 支持 OpenAI / DeepSeek / 自定义端点 |
| 部署 | Render Blueprint | Web Service + PostgreSQL |

### 1.3 当前项目结构

```text
/workspace
├── src/               # React 前端
│   ├── components/    # 通用组件
│   ├── pages/         # 页面
│   ├── store/         # Zustand 状态
│   ├── lib/           # API 封装、工具函数
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── api/               # Express 后端
│   ├── routes/        # 业务路由
│   ├── middleware/    # 鉴权
│   ├── lib/           # prisma、llm 适配器
│   ├── types/         # 类型声明
│   ├── app.ts
│   └── server.ts
├── prisma/            # Schema 与迁移
├── public/            # 静态资源
├── scripts/           # 维护脚本
├── render.yaml        # Render Blueprint 配置
└── package.json
```

---

## 2. 总体路线图

| 阶段 | 核心目标 | 产出标准 |
|---|---|---|
| **第一阶段** | 核心链路完善 + 稳定部署 | 修复问题、完善功能、Render 部署成功并可用 |
| **第二阶段** | AI 好友感 + 体验打磨 | 长期记忆、主动开口、角色一致、UI 顺滑 |
| **第三阶段** | 接入微信 | 微信内可多轮对话，跨端历史与记忆互通 |

---

## 3. 第一阶段：核心链路完善与部署上线

### 3.1 目标

基于现有代码，修复问题、完善功能、确保「匿名登录 → 创建 AI 好友 → 流式聊天」主链路完整可用，并成功部署到 Render 生产环境。

### 3.2 当前已实现

- ✅ 工程骨架：前后端分离、TypeScript、Vite、Tailwind CSS
- ✅ 数据库模型：User、Agent、ChatMessage 三张核心表
- ✅ 后端路由：auth、agents、chat、upload
- ✅ LLM 适配层：OpenAI 兼容格式，支持流式（SSE）
- ✅ 前端页面：AgentsPage、AgentEditPage、ChatPage、ProfilePage
- ✅ 状态管理：auth、agents、chat、theme、toast
- ✅ 通用组件：Avatar、BottomNav、GlassCard、Modal、Toast、EmptyState、ErrorBoundary
- ✅ 智能体模板：预设模板一键填充
- ✅ 双主题：极光 / 七彩
- ✅ Render Blueprint 配置：`render.yaml`

### 3.3 待完善任务

#### 3.3.1 代码质量检查与修复

- 运行 `pnpm lint`，修复所有 ESLint 错误和警告
- 运行 `pnpm check`，确保 TypeScript 类型检查通过
- 运行 `pnpm build`，确保生产构建成功
- 检查 Prisma schema 与生成路径是否正确（`output` 指向 `../src/generated/prisma`）

#### 3.3.2 核心功能验证与修复

- **开场白功能**：验证进入聊天页时智能体是否自动发送问候
- **流式对话**：验证 SSE 流式渲染是否正常，中断处理是否完善
- **重新生成**：验证重新生成最后一条消息功能
- **清空对话**：验证清空后历史记录是否正确删除
- **头像上传**：验证头像上传和显示是否正常
- **模板功能**：验证预设模板是否正确填充表单
- **主题切换**：验证极光 / 七彩主题切换是否正常

#### 3.3.3 移动端适配优化

- iOS 键盘弹出时输入框位置调整
- 底部安全区适配
- 触控目标大小检查
- 移动端浏览器# 灵伴 AI 好友 - 三阶段开发文档

> 版本：v1.0
> 当前状态：第一阶段核心代码已完成，待完善与部署
> 部署目标：Render
> 代码分支：main（默认分支）

---

## 0. 文档说明

本文档是「灵伴 AI 好友」项目的开发路线图，按三个阶段递进式推进：

- **第一阶段**：完善核心链路 + 成功部署到 Render
- **第二阶段**：深化 AI 好友感 + 打磨用户体验
- **第三阶段**：接入微信 + 跨端互通

每个阶段都有明确的目标、任务清单和验收标准，阶段结束时 `main` 分支上的代码都应能成功部署到 Render。

### Git 工作流约定

> **重要：所有开发和修改都直接在 `main` 分支上进行，每次完成后推送到远程 `main` 分支。**

```bash
# 查看当前状态
git status

# 添加修改
git add .

# 提交（使用有意义的提交信息）
git commit -m "feat: 添加 xxx 功能"
git commit -m "fix: 修复 xxx 问题"
git commit -m "refactor: 重构 xxx 模块"

# 推送到远程 main 分支
git push origin main
```

Render 会自动监听 `main` 分支的推送，触发自动部署。

---

## 1. 项目总览

### 1.1 产品定位

「灵伴」是一个 **AI 好友 / 角色陪伴** 应用。每个智能体都像用户拥有的一位虚拟朋友：有鲜明性格、背景、说话方式，会主动关心用户、找话题聊天。用户无需注册即可匿名使用，可创建多个不同性格的 AI 好友。

### 1.2 技术栈

| 层 | 选型 | 说明 |
|---|---|---|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS + Zustand + React Router | 移动端优先，单页应用 |
| 后端 | Express 4 + TypeScript（ESM） | REST + SSE 流式 |
| 数据库 | PostgreSQL + Prisma ORM v7 | |
| LLM | OpenAI 兼容格式 | 支持 OpenAI / DeepSeek / 自定义端点 |
| 部署 | Render Blueprint | Web Service + PostgreSQL |

### 1.3 当前项目结构

```text
/workspace
├── src/               # React 前端
│   ├── components/    # 通用组件
│   ├── pages/         # 页面
│   ├── store/         # Zustand 状态
│   ├── lib/           # API 封装、工具函数
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── api/               # Express 后端
│   ├── routes/        # 业务路由
│   ├── middleware/    # 鉴权
│   ├── lib/           # prisma、llm 适配器
│   ├── types/         # 类型声明
│   ├── app.ts
│   └── server.ts
├── prisma/            # Schema 与迁移
├── public/            # 静态资源
├── scripts/           # 维护脚本
├── render.yaml        # Render Blueprint 配置
└── package.json
```

---

## 2. 总体路线图

| 阶段 | 核心目标 | 产出标准 |
|---|---|---|
| **第一阶段** | 核心链路完善 + 稳定部署 | 修复问题、完善功能、Render 部署成功并可用 |
| **第二阶段** | AI 好友感 + 体验打磨 | 长期记忆、主动开口、角色一致、UI 顺滑 |
| **第三阶段** | 接入微信 | 微信内可多轮对话，跨端历史与记忆互通 |

---

## 3. 第一阶段：核心链路完善与部署上线

### 3.1 目标

基于现有代码，修复问题、完善功能、确保「匿名登录 → 创建 AI 好友 → 流式聊天」主链路完整可用，并成功部署到 Render 生产环境。

### 3.2 当前已实现

- ✅ 工程骨架：前后端分离、TypeScript、Vite、Tailwind CSS
- ✅ 数据库模型：User、Agent、ChatMessage 三张核心表
- ✅ 后端路由：auth、agents、chat、upload
- ✅ LLM 适配层：OpenAI 兼容格式，支持流式（SSE）
- ✅ 前端页面：AgentsPage、AgentEditPage、ChatPage、ProfilePage
- ✅ 状态管理：auth、agents、chat、theme、toast
- ✅ 通用组件：Avatar、BottomNav、GlassCard、Modal、Toast、EmptyState、ErrorBoundary
- ✅ 智能体模板：预设模板一键填充
- ✅ 双主题：极光 / 七彩
- ✅ Render Blueprint 配置：`render.yaml`

### 3.3 待完善任务

#### 3.3.1 代码质量检查与修复

- 运行 `pnpm lint`，修复所有 ESLint 错误和警告
- 运行 `pnpm check`，确保 TypeScript 类型检查通过
- 运行 `pnpm build`，确保生产构建成功
- 检查 Prisma schema 与生成路径是否正确（`output` 指向 `../src/generated/prisma`）

#### 3.3.2 核心功能验证与修复

- **开场白功能**：验证进入聊天页时智能体是否自动发送问候
- **流式对话**：验证 SSE 流式渲染是否正常，中断处理是否完善
- **重新生成**：验证重新生成最后一条消息功能
- **清空对话**：验证清空后历史记录是否正确删除
- **头像上传**：验证头像上传和显示是否正常
- **模板功能**：验证预设模板是否正确填充表单
- **主题切换**：验证极光 / 七彩主题切换是否正常

#### 3.3.3 移动端适配优化

- iOS 键盘弹出时输入框位置调整
- 底部安全区适配
- 触控目标大小检查
- 移动端浏览器兼容性测试

#### 3.3.4 错误处理完善

- 所有 API 请求# 灵伴 AI 好友 - 三阶段开发文档

> 版本：v1.0
> 当前状态：第一阶段核心代码已完成，待完善与部署
> 部署目标：Render
> 代码分支：main（默认分支）

---

## 0. 文档说明

本文档是「灵伴 AI 好友」项目的开发路线图，按三个阶段递进式推进：

- **第一阶段**：完善核心链路 + 成功部署到 Render
- **第二阶段**：深化 AI 好友感 + 打磨用户体验
- **第三阶段**：接入微信 + 跨端互通

每个阶段都有明确的目标、任务清单和验收标准，阶段结束时 `main` 分支上的代码都应能成功部署到 Render。

### Git 工作流约定

> **重要：所有开发和修改都直接在 `main` 分支上进行，每次完成后推送到远程 `main` 分支。**

```bash
# 查看当前状态
git status

# 添加修改
git add .

# 提交（使用有意义的提交信息）
git commit -m "feat: 添加 xxx 功能"
git commit -m "fix: 修复 xxx 问题"
git commit -m "refactor: 重构 xxx 模块"

# 推送到远程 main 分支
git push origin main
```

Render 会自动监听 `main` 分支的推送，触发自动部署。

---

## 1. 项目总览

### 1.1 产品定位

「灵伴」是一个 **AI 好友 / 角色陪伴** 应用。每个智能体都像用户拥有的一位虚拟朋友：有鲜明性格、背景、说话方式，会主动关心用户、找话题聊天。用户无需注册即可匿名使用，可创建多个不同性格的 AI 好友。

### 1.2 技术栈

| 层 | 选型 | 说明 |
|---|---|---|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS + Zustand + React Router | 移动端优先，单页应用 |
| 后端 | Express 4 + TypeScript（ESM） | REST + SSE 流式 |
| 数据库 | PostgreSQL + Prisma ORM v7 | |
| LLM | OpenAI 兼容格式 | 支持 OpenAI / DeepSeek / 自定义端点 |
| 部署 | Render Blueprint | Web Service + PostgreSQL |

### 1.3 当前项目结构

```text
/workspace
├── src/               # React 前端
│   ├── components/    # 通用组件
│   ├── pages/         # 页面
│   ├── store/         # Zustand 状态
│   ├── lib/           # API 封装、工具函数
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── api/               # Express 后端
│   ├── routes/        # 业务路由
│   ├── middleware/    # 鉴权
│   ├── lib/           # prisma、llm 适配器
│   ├── types/         # 类型声明
│   ├── app.ts
│   └── server.ts
├── prisma/            # Schema 与迁移
├── public/            # 静态资源
├── scripts/           # 维护脚本
├── render.yaml        # Render Blueprint 配置
└── package.json
```

---

## 2. 总体路线图

| 阶段 | 核心目标 | 产出标准 |
|---|---|---|
| **第一阶段** | 核心链路完善 + 稳定部署 | 修复问题、完善功能、Render 部署成功并可用 |
| **第二阶段** | AI 好友感 + 体验打磨 | 长期记忆、主动开口、角色一致、UI 顺滑 |
| **第三阶段** | 接入微信 | 微信内可多轮对话，跨端历史与记忆互通 |

---

## 3. 第一阶段：核心链路完善与部署上线

### 3.1 目标

基于现有代码，修复问题、完善功能、确保「匿名登录 → 创建 AI 好友 → 流式聊天」主链路完整可用，并成功部署到 Render 生产环境。

### 3.2 当前已实现

- ✅ 工程骨架：前后端分离、TypeScript、Vite、Tailwind CSS
- ✅ 数据库模型：User、Agent、ChatMessage 三张核心表
- ✅ 后端路由：auth、agents、chat、upload
- ✅ LLM 适配层：OpenAI 兼容格式，支持流式（SSE）
- ✅ 前端页面：AgentsPage、AgentEditPage、ChatPage、ProfilePage
- ✅ 状态管理：auth、agents、chat、theme、toast
- ✅ 通用组件：Avatar、BottomNav、GlassCard、Modal、Toast、EmptyState、ErrorBoundary
- ✅ 智能体模板：预设模板一键填充
- ✅ 双主题：极光 / 七彩
- ✅ Render Blueprint 配置：`render.yaml`

### 3.3 待完善任务

#### 3.3.1 代码质量检查与修复

- 运行 `pnpm lint`，修复所有 ESLint 错误和警告
- 运行 `pnpm check`，确保 TypeScript 类型检查通过
- 运行 `pnpm build`，确保生产构建成功
- 检查 Prisma schema 与生成路径是否正确（`output` 指向 `../src/generated/prisma`）

#### 3.3.2 核心功能验证与修复

- **开场白功能**：验证进入聊天页时智能体是否自动发送问候
- **流式对话**：验证 SSE 流式渲染是否正常，中断处理是否完善
- **重新生成**：验证重新生成最后一条消息功能
- **清空对话**：验证清空后历史记录是否正确删除
- **头像上传**：验证头像上传和显示是否正常
- **模板功能**：验证预设模板是否正确填充表单
- **主题切换**：验证极光 / 七彩主题切换是否正常

#### 3.3.3 移动端适配优化

- iOS 键盘弹出时输入框位置调整
- 底部安全区适配
- 触控目标大小检查
- 移动端浏览器兼容性测试

#### 3.3.4 错误处理完善

- 所有 API 请求错误有明确的用户提示
- 网络断开时的友好提示
- LLM API# 灵伴 AI 好友 - 三阶段开发文档

> 版本：v1.0
> 当前状态：第一阶段核心代码已完成，待完善与部署
> 部署目标：Render
> 代码分支：main（默认分支）

---

## 0. 文档说明

本文档是「灵伴 AI 好友」项目的开发路线图，按三个阶段递进式推进：

- **第一阶段**：完善核心链路 + 成功部署到 Render
- **第二阶段**：深化 AI 好友感 + 打磨用户体验
- **第三阶段**：接入微信 + 跨端互通

每个阶段都有明确的目标、任务清单和验收标准，阶段结束时 `main` 分支上的代码都应能成功部署到 Render。

### Git 工作流约定

> **重要：所有开发和修改都直接在 `main` 分支上进行，每次完成后推送到远程 `main` 分支。**

```bash
# 查看当前状态
git status

# 添加修改
git add .

# 提交（使用有意义的提交信息）
git commit -m "feat: 添加 xxx 功能"
git commit -m "fix: 修复 xxx 问题"
git commit -m "refactor: 重构 xxx 模块"

# 推送到远程 main 分支
git push origin main
```

Render 会自动监听 `main` 分支的推送，触发自动部署。

---

## 1. 项目总览

### 1.1 产品定位

「灵伴」是一个 **AI 好友 / 角色陪伴** 应用。每个智能体都像用户拥有的一位虚拟朋友：有鲜明性格、背景、说话方式，会主动关心用户、找话题聊天。用户无需注册即可匿名使用，可创建多个不同性格的 AI 好友。

### 1.2 技术栈

| 层 | 选型 | 说明 |
|---|---|---|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS + Zustand + React Router | 移动端优先，单页应用 |
| 后端 | Express 4 + TypeScript（ESM） | REST + SSE 流式 |
| 数据库 | PostgreSQL + Prisma ORM v7 | |
| LLM | OpenAI 兼容格式 | 支持 OpenAI / DeepSeek / 自定义端点 |
| 部署 | Render Blueprint | Web Service + PostgreSQL |

### 1.3 当前项目结构

```text
/workspace
├── src/               # React 前端
│   ├── components/    # 通用组件
│   ├── pages/         # 页面
│   ├── store/         # Zustand 状态
│   ├── lib/           # API 封装、工具函数
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── api/               # Express 后端
│   ├── routes/        # 业务路由
│   ├── middleware/    # 鉴权
│   ├── lib/           # prisma、llm 适配器
│   ├── types/         # 类型声明
│   ├── app.ts
│   └── server.ts
├── prisma/            # Schema 与迁移
├── public/            # 静态资源
├── scripts/           # 维护脚本
├── render.yaml        # Render Blueprint 配置
└── package.json
```

---

## 2. 总体路线图

| 阶段 | 核心目标 | 产出标准 |
|---|---|---|
| **第一阶段** | 核心链路完善 + 稳定部署 | 修复问题、完善功能、Render 部署成功并可用 |
| **第二阶段** | AI 好友感 + 体验打磨 | 长期记忆、主动开口、角色一致、UI 顺滑 |
| **第三阶段** | 接入微信 | 微信内可多轮对话，跨端历史与记忆互通 |

---

## 3. 第一阶段：核心链路完善与部署上线

### 3.1 目标

基于现有代码，修复问题、完善功能、确保「匿名登录 → 创建 AI 好友 → 流式聊天」主链路完整可用，并成功部署到 Render 生产环境。

### 3.2 当前已实现

- ✅ 工程骨架：前后端分离、TypeScript、Vite、Tailwind CSS
- ✅ 数据库模型：User、Agent、ChatMessage 三张核心表
- ✅ 后端路由：auth、agents、chat、upload
- ✅ LLM 适配层：OpenAI 兼容格式，支持流式（SSE）
- ✅ 前端页面：AgentsPage、AgentEditPage、ChatPage、ProfilePage
- ✅ 状态管理：auth、agents、chat、theme、toast
- ✅ 通用组件：Avatar、BottomNav、GlassCard、Modal、Toast、EmptyState、ErrorBoundary
- ✅ 智能体模板：预设模板一键填充
- ✅ 双主题：极光 / 七彩
- ✅ Render Blueprint 配置：`render.yaml`

### 3.3 待完善任务

#### 3.3.1 代码质量检查与修复

- 运行 `pnpm lint`，修复所有 ESLint 错误和警告
- 运行 `pnpm check`，确保 TypeScript 类型检查通过
- 运行 `pnpm build`，确保生产构建成功
- 检查 Prisma schema 与生成路径是否正确（`output` 指向 `../src/generated/prisma`）

#### 3.3.2 核心功能验证与修复

- **开场白功能**：验证进入聊天页时智能体是否自动发送问候
- **流式对话**：验证 SSE 流式渲染是否正常，中断处理是否完善
- **重新生成**：验证重新生成最后一条消息功能
- **清空对话**：验证清空后历史记录是否正确删除
- **头像上传**：验证头像上传和显示是否正常
- **模板功能**：验证预设模板是否正确填充表单
- **主题切换**：验证极光 / 七彩主题切换是否正常

#### 3.3.3 移动端适配优化

- iOS 键盘弹出时输入框位置调整
- 底部安全区适配
- 触控目标大小检查
- 移动端浏览器兼容性测试

#### 3.3.4 错误处理完善

- 所有 API 请求错误有明确的用户提示
- 网络断开时的友好提示
- LLM API Key 缺失 / 无效 / 余额不足的具体错误提示
- 全局 ErrorBoundary# 灵伴 AI 好友 - 三阶段开发文档

> 版本：v1.0
> 当前状态：第一阶段核心代码已完成，待完善与部署
> 部署目标：Render
> 代码分支：main（默认分支）

---

## 0. 文档说明

本文档是「灵伴 AI 好友」项目的开发路线图，按三个阶段递进式推进：

- **第一阶段**：完善核心链路 + 成功部署到 Render
- **第二阶段**：深化 AI 好友感 + 打磨用户体验
- **第三阶段**：接入微信 + 跨端互通

每个阶段都有明确的目标、任务清单和验收标准，阶段结束时 `main` 分支上的代码都应能成功部署到 Render。

### Git 工作流约定

> **重要：所有开发和修改都直接在 `main` 分支上进行，每次完成后推送到远程 `main` 分支。**

```bash
# 查看当前状态
git status

# 添加修改
git add .

# 提交（使用有意义的提交信息）
git commit -m "feat: 添加 xxx 功能"
git commit -m "fix: 修复 xxx 问题"
git commit -m "refactor: 重构 xxx 模块"

# 推送到远程 main 分支
git push origin main
```

Render 会自动监听 `main` 分支的推送，触发自动部署。

---

## 1. 项目总览

### 1.1 产品定位

「灵伴」是一个 **AI 好友 / 角色陪伴** 应用。每个智能体都像用户拥有的一位虚拟朋友：有鲜明性格、背景、说话方式，会主动关心用户、找话题聊天。用户无需注册即可匿名使用，可创建多个不同性格的 AI 好友。

### 1.2 技术栈

| 层 | 选型 | 说明 |
|---|---|---|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS + Zustand + React Router | 移动端优先，单页应用 |
| 后端 | Express 4 + TypeScript（ESM） | REST + SSE 流式 |
| 数据库 | PostgreSQL + Prisma ORM v7 | |
| LLM | OpenAI 兼容格式 | 支持 OpenAI / DeepSeek / 自定义端点 |
| 部署 | Render Blueprint | Web Service + PostgreSQL |

### 1.3 当前项目结构

```text
/workspace
├── src/               # React 前端
│   ├── components/    # 通用组件
│   ├── pages/         # 页面
│   ├── store/         # Zustand 状态
│   ├── lib/           # API 封装、工具函数
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── api/               # Express 后端
│   ├── routes/        # 业务路由
│   ├── middleware/    # 鉴权
│   ├── lib/           # prisma、llm 适配器
│   ├── types/         # 类型声明
│   ├── app.ts
│   └── server.ts
├── prisma/            # Schema 与迁移
├── public/            # 静态资源
├── scripts/           # 维护脚本
├── render.yaml        # Render Blueprint 配置
└── package.json
```

---

## 2. 总体路线图

| 阶段 | 核心目标 | 产出标准 |
|---|---|---|
| **第一阶段** | 核心链路完善 + 稳定部署 | 修复问题、完善功能、Render 部署成功并可用 |
| **第二阶段** | AI 好友感 + 体验打磨 | 长期记忆、主动开口、角色一致、UI 顺滑 |
| **第三阶段** | 接入微信 | 微信内可多轮对话，跨端历史与记忆互通 |

---

## 3. 第一阶段：核心链路完善与部署上线

### 3.1 目标

基于现有代码，修复问题、完善功能、确保「匿名登录 → 创建 AI 好友 → 流式聊天」主链路完整可用，并成功部署到 Render 生产环境。

### 3.2 当前已实现

- ✅ 工程骨架：前后端分离、TypeScript、Vite、Tailwind CSS
- ✅ 数据库模型：User、Agent、ChatMessage 三张核心表
- ✅ 后端路由：auth、agents、chat、upload
- ✅ LLM 适配层：OpenAI 兼容格式，支持流式（SSE）
- ✅ 前端页面：AgentsPage、AgentEditPage、ChatPage、ProfilePage
- ✅ 状态管理：auth、agents、chat、theme、toast
- ✅ 通用组件：Avatar、BottomNav、GlassCard、Modal、Toast、EmptyState、ErrorBoundary
- ✅ 智能体模板：预设模板一键填充
- ✅ 双主题：极光 / 七彩
- ✅ Render Blueprint 配置：`render.yaml`

### 3.3 待完善任务

#### 3.3.1 代码质量检查与修复

- 运行 `pnpm lint`，修复所有 ESLint 错误和警告
- 运行 `pnpm check`，确保 TypeScript 类型检查通过
- 运行 `pnpm build`，确保生产构建成功
- 检查 Prisma schema 与生成路径是否正确（`output` 指向 `../src/generated/prisma`）

#### 3.3.2 核心功能验证与修复

- **开场白功能**：验证进入聊天页时智能体是否自动发送问候
- **流式对话**：验证 SSE 流式渲染是否正常，中断处理是否完善
- **重新生成**：验证重新生成最后一条消息功能
- **清空对话**：验证清空后历史记录是否正确删除
- **头像上传**：验证头像上传和显示是否正常
- **模板功能**：验证预设模板是否正确填充表单
- **主题切换**：验证极光 / 七彩主题切换是否正常

#### 3.3.3 移动端适配优化

- iOS 键盘弹出时输入框位置调整
- 底部安全区适配
- 触控目标大小检查
- 移动端浏览器兼容性测试

#### 3.3.4 错误处理完善

- 所有 API 请求错误有明确的用户提示
- 网络断开时的友好提示
- LLM API Key 缺失 / 无效 / 余额不足的具体错误提示
- 全局 ErrorBoundary 优化

#### 3.3.5 Render 部署准备

- 确认 `render# 灵伴 AI 好友 - 三阶段开发文档

> 版本：v1.0
> 当前状态：第一阶段核心代码已完成，待完善与部署
> 部署目标：Render
> 代码分支：main（默认分支）

---

## 0. 文档说明

本文档是「灵伴 AI 好友」项目的开发路线图，按三个阶段递进式推进：

- **第一阶段**：完善核心链路 + 成功部署到 Render
- **第二阶段**：深化 AI 好友感 + 打磨用户体验
- **第三阶段**：接入微信 + 跨端互通

每个阶段都有明确的目标、任务清单和验收标准，阶段结束时 `main` 分支上的代码都应能成功部署到 Render。

### Git 工作流约定

> **重要：所有开发和修改都直接在 `main` 分支上进行，每次完成后推送到远程 `main` 分支。**

```bash
# 查看当前状态
git status

# 添加修改
git add .

# 提交（使用有意义的提交信息）
git commit -m "feat: 添加 xxx 功能"
git commit -m "fix: 修复 xxx 问题"
git commit -m "refactor: 重构 xxx 模块"

# 推送到远程 main 分支
git push origin main
```

Render 会自动监听 `main` 分支的推送，触发自动部署。

---

## 1. 项目总览

### 1.1 产品定位

「灵伴」是一个 **AI 好友 / 角色陪伴** 应用。每个智能体都像用户拥有的一位虚拟朋友：有鲜明性格、背景、说话方式，会主动关心用户、找话题聊天。用户无需注册即可匿名使用，可创建多个不同性格的 AI 好友。

### 1.2 技术栈

| 层 | 选型 | 说明 |
|---|---|---|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS + Zustand + React Router | 移动端优先，单页应用 |
| 后端 | Express 4 + TypeScript（ESM） | REST + SSE 流式 |
| 数据库 | PostgreSQL + Prisma ORM v7 | |
| LLM | OpenAI 兼容格式 | 支持 OpenAI / DeepSeek / 自定义端点 |
| 部署 | Render Blueprint | Web Service + PostgreSQL |

### 1.3 当前项目结构

```text
/workspace
├── src/               # React 前端
│   ├── components/    # 通用组件
│   ├── pages/         # 页面
│   ├── store/         # Zustand 状态
│   ├── lib/           # API 封装、工具函数
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── api/               # Express 后端
│   ├── routes/        # 业务路由
│   ├── middleware/    # 鉴权
│   ├── lib/           # prisma、llm 适配器
│   ├── types/         # 类型声明
│   ├── app.ts
│   └── server.ts
├── prisma/            # Schema 与迁移
├── public/            # 静态资源
├── scripts/           # 维护脚本
├── render.yaml        # Render Blueprint 配置
└── package.json
```

---

## 2. 总体路线图

| 阶段 | 核心目标 | 产出标准 |
|---|---|---|
| **第一阶段** | 核心链路完善 + 稳定部署 | 修复问题、完善功能、Render 部署成功并可用 |
| **第二阶段** | AI 好友感 + 体验打磨 | 长期记忆、主动开口、角色一致、UI 顺滑 |
| **第三阶段** | 接入微信 | 微信内可多轮对话，跨端历史与记忆互通 |

---

## 3. 第一阶段：核心链路完善与部署上线

### 3.1 目标

基于现有代码，修复问题、完善功能、确保「匿名登录 → 创建 AI 好友 → 流式聊天」主链路完整可用，并成功部署到 Render 生产环境。

### 3.2 当前已实现

- ✅ 工程骨架：前后端分离、TypeScript、Vite、Tailwind CSS
- ✅ 数据库模型：User、Agent、ChatMessage 三张核心表
- ✅ 后端路由：auth、agents、chat、upload
- ✅ LLM 适配层：OpenAI 兼容格式，支持流式（SSE）
- ✅ 前端页面：AgentsPage、AgentEditPage、ChatPage、ProfilePage
- ✅ 状态管理：auth、agents、chat、theme、toast
- ✅ 通用组件：Avatar、BottomNav、GlassCard、Modal、Toast、EmptyState、ErrorBoundary
- ✅ 智能体模板：预设模板一键填充
- ✅ 双主题：极光 / 七彩
- ✅ Render Blueprint 配置：`render.yaml`

### 3.3 待完善任务

#### 3.3.1 代码质量检查与修复

- 运行 `pnpm lint`，修复所有 ESLint 错误和警告
- 运行 `pnpm check`，确保 TypeScript 类型检查通过
- 运行 `pnpm build`，确保生产构建成功
- 检查 Prisma schema 与生成路径是否正确（`output` 指向 `../src/generated/prisma`）

#### 3.3.2 核心功能验证与修复

- **开场白功能**：验证进入聊天页时智能体是否自动发送问候
- **流式对话**：验证 SSE 流式渲染是否正常，中断处理是否完善
- **重新生成**：验证重新生成最后一条消息功能
- **清空对话**：验证清空后历史记录是否正确删除
- **头像上传**：验证头像上传和显示是否正常
- **模板功能**：验证预设模板是否正确填充表单
- **主题切换**：验证极光 / 七彩主题切换是否正常

#### 3.3.3 移动端适配优化

- iOS 键盘弹出时输入框位置调整
- 底部安全区适配
- 触控目标大小检查
- 移动端浏览器兼容性测试

#### 3.3.4 错误处理完善

- 所有 API 请求错误有明确的用户提示
- 网络断开时的友好提示
- LLM API Key 缺失 / 无效 / 余额不足的具体错误提示
- 全局 ErrorBoundary 优化

#### 3.3.5 Render 部署准备

- 确认 `render.yaml` 配置正确
- 确认 `buildCommand` 和 `startCommand` 正确# 灵伴 AI 好友 - 三阶段开发文档

> 版本：v1.0
> 当前状态：第一阶段核心代码已完成，待完善与部署
> 部署目标：Render
> 代码分支：main（默认分支）

---

## 0. 文档说明

本文档是「灵伴 AI 好友」项目的开发路线图，按三个阶段递进式推进：

- **第一阶段**：完善核心链路 + 成功部署到 Render
- **第二阶段**：深化 AI 好友感 + 打磨用户体验
- **第三阶段**：接入微信 + 跨端互通

每个阶段都有明确的目标、任务清单和验收标准，阶段结束时 `main` 分支上的代码都应能成功部署到 Render。

### Git 工作流约定

> **重要：所有开发和修改都直接在 `main` 分支上进行，每次完成后推送到远程 `main` 分支。**

```bash
# 查看当前状态
git status

# 添加修改
git add .

# 提交（使用有意义的提交信息）
git commit -m "feat: 添加 xxx 功能"
git commit -m "fix: 修复 xxx 问题"
git commit -m "refactor: 重构 xxx 模块"

# 推送到远程 main 分支
git push origin main
```

Render 会自动监听 `main` 分支的推送，触发自动部署。

---

## 1. 项目总览

### 1.1 产品定位

「灵伴」是一个 **AI 好友 / 角色陪伴** 应用。每个智能体都像用户拥有的一位虚拟朋友：有鲜明性格、背景、说话方式，会主动关心用户、找话题聊天。用户无需注册即可匿名使用，可创建多个不同性格的 AI 好友。

### 1.2 技术栈

| 层 | 选型 | 说明 |
|---|---|---|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS + Zustand + React Router | 移动端优先，单页应用 |
| 后端 | Express 4 + TypeScript（ESM） | REST + SSE 流式 |
| 数据库 | PostgreSQL + Prisma ORM v7 | |
| LLM | OpenAI 兼容格式 | 支持 OpenAI / DeepSeek / 自定义端点 |
| 部署 | Render Blueprint | Web Service + PostgreSQL |

### 1.3 当前项目结构

```text
/workspace
├── src/               # React 前端
│   ├── components/    # 通用组件
│   ├── pages/         # 页面
│   ├── store/         # Zustand 状态
│   ├── lib/           # API 封装、工具函数
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── api/               # Express 后端
│   ├── routes/        # 业务路由
│   ├── middleware/    # 鉴权
│   ├── lib/           # prisma、llm 适配器
│   ├── types/         # 类型声明
│   ├── app.ts
│   └── server.ts
├── prisma/            # Schema 与迁移
├── public/            # 静态资源
├── scripts/           # 维护脚本
├── render.yaml        # Render Blueprint 配置
└── package.json
```

---

## 2. 总体路线图

| 阶段 | 核心目标 | 产出标准 |
|---|---|---|
| **第一阶段** | 核心链路完善 + 稳定部署 | 修复问题、完善功能、Render 部署成功并可用 |
| **第二阶段** | AI 好友感 + 体验打磨 | 长期记忆、主动开口、角色一致、UI 顺滑 |
| **第三阶段** | 接入微信 | 微信内可多轮对话，跨端历史与记忆互通 |

---

## 3. 第一阶段：核心链路完善与部署上线

### 3.1 目标

基于现有代码，修复问题、完善功能、确保「匿名登录 → 创建 AI 好友 → 流式聊天」主链路完整可用，并成功部署到 Render 生产环境。

### 3.2 当前已实现

- ✅ 工程骨架：前后端分离、TypeScript、Vite、Tailwind CSS
- ✅ 数据库模型：User、Agent、ChatMessage 三张核心表
- ✅ 后端路由：auth、agents、chat、upload
- ✅ LLM 适配层：OpenAI 兼容格式，支持流式（SSE）
- ✅ 前端页面：AgentsPage、AgentEditPage、ChatPage、ProfilePage
- ✅ 状态管理：auth、agents、chat、theme、toast
- ✅ 通用组件：Avatar、BottomNav、GlassCard、Modal、Toast、EmptyState、ErrorBoundary
- ✅ 智能体模板：预设模板一键填充
- ✅ 双主题：极光 / 七彩
- ✅ Render Blueprint 配置：`render.yaml`

### 3.3 待完善任务

#### 3.3.1 代码质量检查与修复

- 运行 `pnpm lint`，修复所有 ESLint 错误和警告
- 运行 `pnpm check`，确保 TypeScript 类型检查通过
- 运行 `pnpm build`，确保生产构建成功
- 检查 Prisma schema 与生成路径是否正确（`output` 指向 `../src/generated/prisma`）

#### 3.3.2 核心功能验证与修复

- **开场白功能**：验证进入聊天页时智能体是否自动发送问候
- **流式对话**：验证 SSE 流式渲染是否正常，中断处理是否完善
- **重新生成**：验证重新生成最后一条消息功能
- **清空对话**：验证清空后历史记录是否正确删除
- **头像上传**：验证头像上传和显示是否正常
- **模板功能**：验证预设模板是否正确填充表单
- **主题切换**：验证极光 / 七彩主题切换是否正常

#### 3.3.3 移动端适配优化

- iOS 键盘弹出时输入框位置调整
- 底部安全区适配
- 触控目标大小检查
- 移动端浏览器兼容性测试

#### 3.3.4 错误处理完善

- 所有 API 请求错误有明确的用户提示
- 网络断开时的友好提示
- LLM API Key 缺失 / 无效 / 余额不足的具体错误提示
- 全局 ErrorBoundary 优化

#### 3.3.5 Render 部署准备

- 确认 `render.yaml` 配置正确
- 确认 `buildCommand` 和 `startCommand` 正确
- 确认环境变量配置完整
- 确认健康检查路径 `/api/health`# 灵伴 AI 好友 - 三阶段开发文档

> 版本：v1.0
> 当前状态：第一阶段核心代码已完成，待完善与部署
> 部署目标：Render
> 代码分支：main（默认分支）

---

## 0. 文档说明

本文档是「灵伴 AI 好友」项目的开发路线图，按三个阶段递进式推进：

- **第一阶段**：完善核心链路 + 成功部署到 Render
- **第二阶段**：深化 AI 好友感 + 打磨用户体验
- **第三阶段**：接入微信 + 跨端互通

每个阶段都有明确的目标、任务清单和验收标准，阶段结束时 `main` 分支上的代码都应能成功部署到 Render。

### Git 工作流约定

> **重要：所有开发和修改都直接在 `main` 分支上进行，每次完成后推送到远程 `main` 分支。**

```bash
# 查看当前状态
git status

# 添加修改
git add .

# 提交（使用有意义的提交信息）
git commit -m "feat: 添加 xxx 功能"
git commit -m "fix: 修复 xxx 问题"
git commit -m "refactor: 重构 xxx 模块"

# 推送到远程 main 分支
git push origin main
```

Render 会自动监听 `main` 分支的推送，触发自动部署。

---

## 1. 项目总览

### 1.1 产品定位

「灵伴」是一个 **AI 好友 / 角色陪伴** 应用。每个智能体都像用户拥有的一位虚拟朋友：有鲜明性格、背景、说话方式，会主动关心用户、找话题聊天。用户无需注册即可匿名使用，可创建多个不同性格的 AI 好友。

### 1.2 技术栈

| 层 | 选型 | 说明 |
|---|---|---|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS + Zustand + React Router | 移动端优先，单页应用 |
| 后端 | Express 4 + TypeScript（ESM） | REST + SSE 流式 |
| 数据库 | PostgreSQL + Prisma ORM v7 | |
| LLM | OpenAI 兼容格式 | 支持 OpenAI / DeepSeek / 自定义端点 |
| 部署 | Render Blueprint | Web Service + PostgreSQL |

### 1.3 当前项目结构

```text
/workspace
├── src/               # React 前端
│   ├── components/    # 通用组件
│   ├── pages/         # 页面
│   ├── store/         # Zustand 状态
│   ├── lib/           # API 封装、工具函数
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── api/               # Express 后端
│   ├── routes/        # 业务路由
│   ├── middleware/    # 鉴权
│   ├── lib/           # prisma、llm 适配器
│   ├── types/         # 类型声明
│   ├── app.ts
│   └── server.ts
├── prisma/            # Schema 与迁移
├── public/            # 静态资源
├── scripts/           # 维护脚本
├── render.yaml        # Render Blueprint 配置
└── package.json
```

---

## 2. 总体路线图

| 阶段 | 核心目标 | 产出标准 |
|---|---|---|
| **第一阶段** | 核心链路完善 + 稳定部署 | 修复问题、完善功能、Render 部署成功并可用 |
| **第二阶段** | AI 好友感 + 体验打磨 | 长期记忆、主动开口、角色一致、UI 顺滑 |
| **第三阶段** | 接入微信 | 微信内可多轮对话，跨端历史与记忆互通 |

---

## 3. 第一阶段：核心链路完善与部署上线

### 3.1 目标

基于现有代码，修复问题、完善功能、确保「匿名登录 → 创建 AI 好友 → 流式聊天」主链路完整可用，并成功部署到 Render 生产环境。

### 3.2 当前已实现

- ✅ 工程骨架：前后端分离、TypeScript、Vite、Tailwind CSS
- ✅ 数据库模型：User、Agent、ChatMessage 三张核心表
- ✅ 后端路由：auth、agents、chat、upload
- ✅ LLM 适配层：OpenAI 兼容格式，支持流式（SSE）
- ✅ 前端页面：AgentsPage、AgentEditPage、ChatPage、ProfilePage
- ✅ 状态管理：auth、agents、chat、theme、toast
- ✅ 通用组件：Avatar、BottomNav、GlassCard、Modal、Toast、EmptyState、ErrorBoundary
- ✅ 智能体模板：预设模板一键填充
- ✅ 双主题：极光 / 七彩
- ✅ Render Blueprint 配置：`render.yaml`

### 3.3 待完善任务

#### 3.3.1 代码质量检查与修复

- 运行 `pnpm lint`，修复所有 ESLint 错误和警告
- 运行 `pnpm check`，确保 TypeScript 类型检查通过
- 运行 `pnpm build`，确保生产构建成功
- 检查 Prisma schema 与生成路径是否正确（`output` 指向 `../src/generated/prisma`）

#### 3.3.2 核心功能验证与修复

- **开场白功能**：验证进入聊天页时智能体是否自动发送问候
- **流式对话**：验证 SSE 流式渲染是否正常，中断处理是否完善
- **重新生成**：验证重新生成最后一条消息功能
- **清空对话**：验证清空后历史记录是否正确删除
- **头像上传**：验证头像上传和显示是否正常
- **模板功能**：验证预设模板是否正确填充表单
- **主题切换**：验证极光 / 七彩主题切换是否正常

#### 3.3.3 移动端适配优化

- iOS 键盘弹出时输入框位置调整
- 底部安全区适配
- 触控目标大小检查
- 移动端浏览器兼容性测试

#### 3.3.4 错误处理完善

- 所有 API 请求错误有明确的用户提示
- 网络断开时的友好提示
- LLM API Key 缺失 / 无效 / 余额不足的具体错误提示
- 全局 ErrorBoundary 优化

#### 3.3.5 Render 部署准备

- 确认 `render.yaml` 配置正确
- 确认 `buildCommand` 和 `startCommand` 正确
- 确认环境变量配置完整
- 确认健康检查路径 `/api/health` 正常工作
- 确认静态资源路径# 灵伴 AI 好友 - 三阶段开发文档

> 版本：v1.0
> 当前状态：第一阶段核心代码已完成，待完善与部署
> 部署目标：Render
> 代码分支：main（默认分支）

---

## 0. 文档说明

本文档是「灵伴 AI 好友」项目的开发路线图，按三个阶段递进式推进：

- **第一阶段**：完善核心链路 + 成功部署到 Render
- **第二阶段**：深化 AI 好友感 + 打磨用户体验
- **第三阶段**：接入微信 + 跨端互通

每个阶段都有明确的目标、任务清单和验收标准，阶段结束时 `main` 分支上的代码都应能成功部署到 Render。

### Git 工作流约定

> **重要：所有开发和修改都直接在 `main` 分支上进行，每次完成后推送到远程 `main` 分支。**

```bash
# 查看当前状态
git status

# 添加修改
git add .

# 提交（使用有意义的提交信息）
git commit -m "feat: 添加 xxx 功能"
git commit -m "fix: 修复 xxx 问题"
git commit -m "refactor: 重构 xxx 模块"

# 推送到远程 main 分支
git push origin main
```

Render 会自动监听 `main` 分支的推送，触发自动部署。

---

## 1. 项目总览

### 1.1 产品定位

「灵伴」是一个 **AI 好友 / 角色陪伴** 应用。每个智能体都像用户拥有的一位虚拟朋友：有鲜明性格、背景、说话方式，会主动关心用户、找话题聊天。用户无需注册即可匿名使用，可创建多个不同性格的 AI 好友。

### 1.2 技术栈

| 层 | 选型 | 说明 |
|---|---|---|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS + Zustand + React Router | 移动端优先，单页应用 |
| 后端 | Express 4 + TypeScript（ESM） | REST + SSE 流式 |
| 数据库 | PostgreSQL + Prisma ORM v7 | |
| LLM | OpenAI 兼容格式 | 支持 OpenAI / DeepSeek / 自定义端点 |
| 部署 | Render Blueprint | Web Service + PostgreSQL |

### 1.3 当前项目结构

```text
/workspace
├── src/               # React 前端
│   ├── components/    # 通用组件
│   ├── pages/         # 页面
│   ├── store/         # Zustand 状态
│   ├── lib/           # API 封装、工具函数
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── api/               # Express 后端
│   ├── routes/        # 业务路由
│   ├── middleware/    # 鉴权
│   ├── lib/           # prisma、llm 适配器
│   ├── types/         # 类型声明
│   ├── app.ts
│   └── server.ts
├── prisma/            # Schema 与迁移
├── public/            # 静态资源
├── scripts/           # 维护脚本
├── render.yaml        # Render Blueprint 配置
└── package.json
```

---

## 2. 总体路线图

| 阶段 | 核心目标 | 产出标准 |
|---|---|---|
| **第一阶段** | 核心链路完善 + 稳定部署 | 修复问题、完善功能、Render 部署成功并可用 |
| **第二阶段** | AI 好友感 + 体验打磨 | 长期记忆、主动开口、角色一致、UI 顺滑 |
| **第三阶段** | 接入微信 | 微信内可多轮对话，跨端历史与记忆互通 |

---

## 3. 第一阶段：核心链路完善与部署上线

### 3.1 目标

基于现有代码，修复问题、完善功能、确保「匿名登录 → 创建 AI 好友 → 流式聊天」主链路完整可用，并成功部署到 Render 生产环境。

### 3.2 当前已实现

- ✅ 工程骨架：前后端分离、TypeScript、Vite、Tailwind CSS
- ✅ 数据库模型：User、Agent、ChatMessage 三张核心表
- ✅ 后端路由：auth、agents、chat、upload
- ✅ LLM 适配层：OpenAI 兼容格式，支持流式（SSE）
- ✅ 前端页面：AgentsPage、AgentEditPage、ChatPage、ProfilePage
- ✅ 状态管理：auth、agents、chat、theme、toast
- ✅ 通用组件：Avatar、BottomNav、GlassCard、Modal、Toast、EmptyState、ErrorBoundary
- ✅ 智能体模板：预设模板一键填充
- ✅ 双主题：极光 / 七彩
- ✅ Render Blueprint 配置：`render.yaml`

### 3.3 待完善任务

#### 3.3.1 代码质量检查与修复

- 运行 `pnpm lint`，修复所有 ESLint 错误和警告
- 运行 `pnpm check`，确保 TypeScript 类型检查通过
- 运行 `pnpm build`，确保生产构建成功
- 检查 Prisma schema 与生成路径是否正确（`output` 指向 `../src/generated/prisma`）

#### 3.3.2 核心功能验证与修复

- **开场白功能**：验证进入聊天页时智能体是否自动发送问候
- **流式对话**：验证 SSE 流式渲染是否正常，中断处理是否完善
- **重新生成**：验证重新生成最后一条消息功能
- **清空对话**：验证清空后历史记录是否正确删除
- **头像上传**：验证头像上传和显示是否正常
- **模板功能**：验证预设模板是否正确填充表单
- **主题切换**：验证极光 / 七彩主题切换是否正常

#### 3.3.3 移动端适配优化

- iOS 键盘弹出时输入框位置调整
- 底部安全区适配
- 触控目标大小检查
- 移动端浏览器兼容性测试

#### 3.3.4 错误处理完善

- 所有 API 请求错误有明确的用户提示
- 网络断开时的友好提示
- LLM API Key 缺失 / 无效 / 余额不足的具体错误提示
- 全局 ErrorBoundary 优化

#### 3.3.5 Render 部署准备

- 确认 `render.yaml` 配置正确
- 确认 `buildCommand` 和 `startCommand` 正确
- 确认环境变量配置完整
- 确认健康检查路径 `/api/health` 正常工作
- 确认静态资源路径配置正确（前端构建产物 `dist/` 目录）

### 3.4# 灵伴 AI 好友 - 三阶段开发文档

> 版本：v1.0
> 当前状态：第一阶段核心代码已完成，待完善与部署
> 部署目标：Render
> 代码分支：main（默认分支）

---

## 0. 文档说明

本文档是「灵伴 AI 好友」项目的开发路线图，按三个阶段递进式推进：

- **第一阶段**：完善核心链路 + 成功部署到 Render
- **第二阶段**：深化 AI 好友感 + 打磨用户体验
- **第三阶段**：接入微信 + 跨端互通

每个阶段都有明确的目标、任务清单和验收标准，阶段结束时 `main` 分支上的代码都应能成功部署到 Render。

### Git 工作流约定

> **重要：所有开发和修改都直接在 `main` 分支上进行，每次完成后推送到远程 `main` 分支。**

```bash
# 查看当前状态
git status

# 添加修改
git add .

# 提交（使用有意义的提交信息）
git commit -m "feat: 添加 xxx 功能"
git commit -m "fix: 修复 xxx 问题"
git commit -m "refactor: 重构 xxx 模块"

# 推送到远程 main 分支
git push origin main
```

Render 会自动监听 `main` 分支的推送，触发自动部署。

---

## 1. 项目总览

### 1.1 产品定位

「灵伴」是一个 **AI 好友 / 角色陪伴** 应用。每个智能体都像用户拥有的一位虚拟朋友：有鲜明性格、背景、说话方式，会主动关心用户、找话题聊天。用户无需注册即可匿名使用，可创建多个不同性格的 AI 好友。

### 1.2 技术栈

| 层 | 选型 | 说明 |
|---|---|---|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS + Zustand + React Router | 移动端优先，单页应用 |
| 后端 | Express 4 + TypeScript（ESM） | REST + SSE 流式 |
| 数据库 | PostgreSQL + Prisma ORM v7 | |
| LLM | OpenAI 兼容格式 | 支持 OpenAI / DeepSeek / 自定义端点 |
| 部署 | Render Blueprint | Web Service + PostgreSQL |

### 1.3 当前项目结构

```text
/workspace
├── src/               # React 前端
│   ├── components/    # 通用组件
│   ├── pages/         # 页面
│   ├── store/         # Zustand 状态
│   ├── lib/           # API 封装、工具函数
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── api/               # Express 后端
│   ├── routes/        # 业务路由
│   ├── middleware/    # 鉴权
│   ├── lib/           # prisma、llm 适配器
│   ├── types/         # 类型声明
│   ├── app.ts
│   └── server.ts
├── prisma/            # Schema 与迁移
├── public/            # 静态资源
├── scripts/           # 维护脚本
├── render.yaml        # Render Blueprint 配置
└── package.json
```

---

## 2. 总体路线图

| 阶段 | 核心目标 | 产出标准 |
|---|---|---|
| **第一阶段** | 核心链路完善 + 稳定部署 | 修复问题、完善功能、Render 部署成功并可用 |
| **第二阶段** | AI 好友感 + 体验打磨 | 长期记忆、主动开口、角色一致、UI 顺滑 |
| **第三阶段** | 接入微信 | 微信内可多轮对话，跨端历史与记忆互通 |

---

## 3. 第一阶段：核心链路完善与部署上线

### 3.1 目标

基于现有代码，修复问题、完善功能、确保「匿名登录 → 创建 AI 好友 → 流式聊天」主链路完整可用，并成功部署到 Render 生产环境。

### 3.2 当前已实现

- ✅ 工程骨架：前后端分离、TypeScript、Vite、Tailwind CSS
- ✅ 数据库模型：User、Agent、ChatMessage 三张核心表
- ✅ 后端路由：auth、agents、chat、upload
- ✅ LLM 适配层：OpenAI 兼容格式，支持流式（SSE）
- ✅ 前端页面：AgentsPage、AgentEditPage、ChatPage、ProfilePage
- ✅ 状态管理：auth、agents、chat、theme、toast
- ✅ 通用组件：Avatar、BottomNav、GlassCard、Modal、Toast、EmptyState、ErrorBoundary
- ✅ 智能体模板：预设模板一键填充
- ✅ 双主题：极光 / 七彩
- ✅ Render Blueprint 配置：`render.yaml`

### 3.3 待完善任务

#### 3.3.1 代码质量检查与修复

- 运行 `pnpm lint`，修复所有 ESLint 错误和警告
- 运行 `pnpm check`，确保 TypeScript 类型检查通过
- 运行 `pnpm build`，确保生产构建成功
- 检查 Prisma schema 与生成路径是否正确（`output` 指向 `../src/generated/prisma`）

#### 3.3.2 核心功能验证与修复

- **开场白功能**：验证进入聊天页时智能体是否自动发送问候
- **流式对话**：验证 SSE 流式渲染是否正常，中断处理是否完善
- **重新生成**：验证重新生成最后一条消息功能
- **清空对话**：验证清空后历史记录是否正确删除
- **头像上传**：验证头像上传和显示是否正常
- **模板功能**：验证预设模板是否正确填充表单
- **主题切换**：验证极光 / 七彩主题切换是否正常

#### 3.3.3 移动端适配优化

- iOS 键盘弹出时输入框位置调整
- 底部安全区适配
- 触控目标大小检查
- 移动端浏览器兼容性测试

#### 3.3.4 错误处理完善

- 所有 API 请求错误有明确的用户提示
- 网络断开时的友好提示
- LLM API Key 缺失 / 无效 / 余额不足的具体错误提示
- 全局 ErrorBoundary 优化

#### 3.3.5 Render 部署准备

- 确认 `render.yaml` 配置正确
- 确认 `buildCommand` 和 `startCommand` 正确
- 确认环境变量配置完整
- 确认健康检查路径 `/api/health` 正常工作
- 确认静态资源路径配置正确（前端构建产物 `dist/` 目录）

### 3.4 部署到 Render 步骤

#### 前置准备

1. 确保代码已推送到 GitHub# 灵伴 AI 好友 - 三阶段开发文档

> 版本：v1.0
> 当前状态：第一阶段核心代码已完成，待完善与部署
> 部署目标：Render
> 代码分支：main（默认分支）

---

## 0. 文档说明

本文档是「灵伴 AI 好友」项目的开发路线图，按三个阶段递进式推进：

- **第一阶段**：完善核心链路 + 成功部署到 Render
- **第二阶段**：深化 AI 好友感 + 打磨用户体验
- **第三阶段**：接入微信 + 跨端互通

每个阶段都有明确的目标、任务清单和验收标准，阶段结束时 `main` 分支上的代码都应能成功部署到 Render。

### Git 工作流约定

> **重要：所有开发和修改都直接在 `main` 分支上进行，每次完成后推送到远程 `main` 分支。**

```bash
# 查看当前状态
git status

# 添加修改
git add .

# 提交（使用有意义的提交信息）
git commit -m "feat: 添加 xxx 功能"
git commit -m "fix: 修复 xxx 问题"
git commit -m "refactor: 重构 xxx 模块"

# 推送到远程 main 分支
git push origin main
```

Render 会自动监听 `main` 分支的推送，触发自动部署。

---

## 1. 项目总览

### 1.1 产品定位

「灵伴」是一个 **AI 好友 / 角色陪伴** 应用。每个智能体都像用户拥有的一位虚拟朋友：有鲜明性格、背景、说话方式，会主动关心用户、找话题聊天。用户无需注册即可匿名使用，可创建多个不同性格的 AI 好友。

### 1.2 技术栈

| 层 | 选型 | 说明 |
|---|---|---|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS + Zustand + React Router | 移动端优先，单页应用 |
| 后端 | Express 4 + TypeScript（ESM） | REST + SSE 流式 |
| 数据库 | PostgreSQL + Prisma ORM v7 | |
| LLM | OpenAI 兼容格式 | 支持 OpenAI / DeepSeek / 自定义端点 |
| 部署 | Render Blueprint | Web Service + PostgreSQL |

### 1.3 当前项目结构

```text
/workspace
├── src/               # React 前端
│   ├── components/    # 通用组件
│   ├── pages/         # 页面
│   ├── store/         # Zustand 状态
│   ├── lib/           # API 封装、工具函数
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── api/               # Express 后端
│   ├── routes/        # 业务路由
│   ├── middleware/    # 鉴权
│   ├── lib/           # prisma、llm 适配器
│   ├── types/         # 类型声明
│   ├── app.ts
│   └── server.ts
├── prisma/            # Schema 与迁移
├── public/            # 静态资源
├── scripts/           # 维护脚本
├── render.yaml        # Render Blueprint 配置
└── package.json
```

---

## 2. 总体路线图

| 阶段 | 核心目标 | 产出标准 |
|---|---|---|
| **第一阶段** | 核心链路完善 + 稳定部署 | 修复问题、完善功能、Render 部署成功并可用 |
| **第二阶段** | AI 好友感 + 体验打磨 | 长期记忆、主动开口、角色一致、UI 顺滑 |
| **第三阶段** | 接入微信 | 微信内可多轮对话，跨端历史与记忆互通 |

---

## 3. 第一阶段：核心链路完善与部署上线

### 3.1 目标

基于现有代码，修复问题、完善功能、确保「匿名登录 → 创建 AI 好友 → 流式聊天」主链路完整可用，并成功部署到 Render 生产环境。

### 3.2 当前已实现

- ✅ 工程骨架：前后端分离、TypeScript、Vite、Tailwind CSS
- ✅ 数据库模型：User、Agent、ChatMessage 三张核心表
- ✅ 后端路由：auth、agents、chat、upload
- ✅ LLM 适配层：OpenAI 兼容格式，支持流式（SSE）
- ✅ 前端页面：AgentsPage、AgentEditPage、ChatPage、ProfilePage
- ✅ 状态管理：auth、agents、chat、theme、toast
- ✅ 通用组件：Avatar、BottomNav、GlassCard、Modal、Toast、EmptyState、ErrorBoundary
- ✅ 智能体模板：预设模板一键填充
- ✅ 双主题：极光 / 七彩
- ✅ Render Blueprint 配置：`render.yaml`

### 3.3 待完善任务

#### 3.3.1 代码质量检查与修复

- 运行 `pnpm lint`，修复所有 ESLint 错误和警告
- 运行 `pnpm check`，确保 TypeScript 类型检查通过
- 运行 `pnpm build`，确保生产构建成功
- 检查 Prisma schema 与生成路径是否正确（`output` 指向 `../src/generated/prisma`）

#### 3.3.2 核心功能验证与修复

- **开场白功能**：验证进入聊天页时智能体是否自动发送问候
- **流式对话**：验证 SSE 流式渲染是否正常，中断处理是否完善
- **重新生成**：验证重新生成最后一条消息功能
- **清空对话**：验证清空后历史记录是否正确删除
- **头像上传**：验证头像上传和显示是否正常
- **模板功能**：验证预设模板是否正确填充表单
- **主题切换**：验证极光 / 七彩主题切换是否正常

#### 3.3.3 移动端适配优化

- iOS 键盘弹出时输入框位置调整
- 底部安全区适配
- 触控目标大小检查
- 移动端浏览器兼容性测试

#### 3.3.4 错误处理完善

- 所有 API 请求错误有明确的用户提示
- 网络断开时的友好提示
- LLM API Key 缺失 / 无效 / 余额不足的具体错误提示
- 全局 ErrorBoundary 优化

#### 3.3.5 Render 部署准备

- 确认 `render.yaml` 配置正确
- 确认 `buildCommand` 和 `startCommand` 正确
- 确认环境变量配置完整
- 确认健康检查路径 `/api/health` 正常工作
- 确认静态资源路径配置正确（前端构建产物 `dist/` 目录）

### 3.4 部署到 Render 步骤

#### 前置准备

1. 确保代码已推送到 GitHub 仓库的 `main` 分支
2. 注册 Render 账号（render.com）# 灵伴 AI 好友 - 三阶段开发文档

> 版本：v1.0
> 当前状态：第一阶段核心代码已完成，待完善与部署
> 部署目标：Render
> 代码分支：main（默认分支）

---

## 0. 文档说明

本文档是「灵伴 AI 好友」项目的开发路线图，按三个阶段递进式推进：

- **第一阶段**：完善核心链路 + 成功部署到 Render
- **第二阶段**：深化 AI 好友感 + 打磨用户体验
- **第三阶段**：接入微信 + 跨端互通

每个阶段都有明确的目标、任务清单和验收标准，阶段结束时 `main` 分支上的代码都应能成功部署到 Render。

### Git 工作流约定

> **重要：所有开发和修改都直接在 `main` 分支上进行，每次完成后推送到远程 `main` 分支。**

```bash
# 查看当前状态
git status

# 添加修改
git add .

# 提交（使用有意义的提交信息）
git commit -m "feat: 添加 xxx 功能"
git commit -m "fix: 修复 xxx 问题"
git commit -m "refactor: 重构 xxx 模块"

# 推送到远程 main 分支
git push origin main
```

Render 会自动监听 `main` 分支的推送，触发自动部署。

---

## 1. 项目总览

### 1.1 产品定位

「灵伴」是一个 **AI 好友 / 角色陪伴** 应用。每个智能体都像用户拥有的一位虚拟朋友：有鲜明性格、背景、说话方式，会主动关心用户、找话题聊天。用户无需注册即可匿名使用，可创建多个不同性格的 AI 好友。

### 1.2 技术栈

| 层 | 选型 | 说明 |
|---|---|---|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS + Zustand + React Router | 移动端优先，单页应用 |
| 后端 | Express 4 + TypeScript（ESM） | REST + SSE 流式 |
| 数据库 | PostgreSQL + Prisma ORM v7 | |
| LLM | OpenAI 兼容格式 | 支持 OpenAI / DeepSeek / 自定义端点 |
| 部署 | Render Blueprint | Web Service + PostgreSQL |

### 1.3 当前项目结构

```text
/workspace
├── src/               # React 前端
│   ├── components/    # 通用组件
│   ├── pages/         # 页面
│   ├── store/         # Zustand 状态
│   ├── lib/           # API 封装、工具函数
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── api/               # Express 后端
│   ├── routes/        # 业务路由
│   ├── middleware/    # 鉴权
│   ├── lib/           # prisma、llm 适配器
│   ├── types/         # 类型声明
│   ├── app.ts
│   └── server.ts
├── prisma/            # Schema 与迁移
├── public/            # 静态资源
├── scripts/           # 维护脚本
├── render.yaml        # Render Blueprint 配置
└── package.json
```

---

## 2. 总体路线图

| 阶段 | 核心目标 | 产出标准 |
|---|---|---|
| **第一阶段** | 核心链路完善 + 稳定部署 | 修复问题、完善功能、Render 部署成功并可用 |
| **第二阶段** | AI 好友感 + 体验打磨 | 长期记忆、主动开口、角色一致、UI 顺滑 |
| **第三阶段** | 接入微信 | 微信内可多轮对话，跨端历史与记忆互通 |

---

## 3. 第一阶段：核心链路完善与部署上线

### 3.1 目标

基于现有代码，修复问题、完善功能、确保「匿名登录 → 创建 AI 好友 → 流式聊天」主链路完整可用，并成功部署到 Render 生产环境。

### 3.2 当前已实现

- ✅ 工程骨架：前后端分离、TypeScript、Vite、Tailwind CSS
- ✅ 数据库模型：User、Agent、ChatMessage 三张核心表
- ✅ 后端路由：auth、agents、chat、upload
- ✅ LLM 适配层：OpenAI 兼容格式，支持流式（SSE）
- ✅ 前端页面：AgentsPage、AgentEditPage、ChatPage、ProfilePage
- ✅ 状态管理：auth、agents、chat、theme、toast
- ✅ 通用组件：Avatar、BottomNav、GlassCard、Modal、Toast、EmptyState、ErrorBoundary
- ✅ 智能体模板：预设模板一键填充
- ✅ 双主题：极光 / 七彩
- ✅ Render Blueprint 配置：`render.yaml`

### 3.3 待完善任务

#### 3.3.1 代码质量检查与修复

- 运行 `pnpm lint`，修复所有 ESLint 错误和警告
- 运行 `pnpm check`，确保 TypeScript 类型检查通过
- 运行 `pnpm build`，确保生产构建成功
- 检查 Prisma schema 与生成路径是否正确（`output` 指向 `../src/generated/prisma`）

#### 3.3.2 核心功能验证与修复

- **开场白功能**：验证进入聊天页时智能体是否自动发送问候
- **流式对话**：验证 SSE 流式渲染是否正常，中断处理是否完善
- **重新生成**：验证重新生成最后一条消息功能
- **清空对话**：验证清空后历史记录是否正确删除
- **头像上传**：验证头像上传和显示是否正常
- **模板功能**：验证预设模板是否正确填充表单
- **主题切换**：验证极光 / 七彩主题切换是否正常

#### 3.3.3 移动端适配优化

- iOS 键盘弹出时输入框位置调整
- 底部安全区适配
- 触控目标大小检查
- 移动端浏览器兼容性测试

#### 3.3.4 错误处理完善

- 所有 API 请求错误有明确的用户提示
- 网络断开时的友好提示
- LLM API Key 缺失 / 无效 / 余额不足的具体错误提示
- 全局 ErrorBoundary 优化

#### 3.3.5 Render 部署准备

- 确认 `render.yaml` 配置正确
- 确认 `buildCommand` 和 `startCommand` 正确
- 确认环境变量配置完整
- 确认健康检查路径 `/api/health` 正常工作
- 确认静态资源路径配置正确（前端构建产物 `dist/` 目录）

### 3.4 部署到 Render 步骤

#### 前置准备

1. 确保代码已推送到 GitHub 仓库的 `main` 分支
2. 注册 Render 账号（render.com）

#### 部署步骤

1. 在 Render Dashboard 选择 **Blueprints** → **New# 灵伴 AI 好友 - 三阶段开发文档

> 版本：v1.0
> 当前状态：第一阶段核心代码已完成，待完善与部署
> 部署目标：Render
> 代码分支：main（默认分支）

---

## 0. 文档说明

本文档是「灵伴 AI 好友」项目的开发路线图，按三个阶段递进式推进：

- **第一阶段**：完善核心链路 + 成功部署到 Render
- **第二阶段**：深化 AI 好友感 + 打磨用户体验
- **第三阶段**：接入微信 + 跨端互通

每个阶段都有明确的目标、任务清单和验收标准，阶段结束时 `main` 分支上的代码都应能成功部署到 Render。

### Git 工作流约定

> **重要：所有开发和修改都直接在 `main` 分支上进行，每次完成后推送到远程 `main` 分支。**

```bash
# 查看当前状态
git status

# 添加修改
git add .

# 提交（使用有意义的提交信息）
git commit -m "feat: 添加 xxx 功能"
git commit -m "fix: 修复 xxx 问题"
git commit -m "refactor: 重构 xxx 模块"

# 推送到远程 main 分支
git push origin main
```

Render 会自动监听 `main` 分支的推送，触发自动部署。

---

## 1. 项目总览

### 1.1 产品定位

「灵伴」是一个 **AI 好友 / 角色陪伴** 应用。每个智能体都像用户拥有的一位虚拟朋友：有鲜明性格、背景、说话方式，会主动关心用户、找话题聊天。用户无需注册即可匿名使用，可创建多个不同性格的 AI 好友。

### 1.2 技术栈

| 层 | 选型 | 说明 |
|---|---|---|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS + Zustand + React Router | 移动端优先，单页应用 |
| 后端 | Express 4 + TypeScript（ESM） | REST + SSE 流式 |
| 数据库 | PostgreSQL + Prisma ORM v7 | |
| LLM | OpenAI 兼容格式 | 支持 OpenAI / DeepSeek / 自定义端点 |
| 部署 | Render Blueprint | Web Service + PostgreSQL |

### 1.3 当前项目结构

```text
/workspace
├── src/               # React 前端
│   ├── components/    # 通用组件
│   ├── pages/         # 页面
│   ├── store/         # Zustand 状态
│   ├── lib/           # API 封装、工具函数
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── api/               # Express 后端
│   ├── routes/        # 业务路由
│   ├── middleware/    # 鉴权
│   ├── lib/           # prisma、llm 适配器
│   ├── types/         # 类型声明
│   ├── app.ts
│   └── server.ts
├── prisma/            # Schema 与迁移
├── public/            # 静态资源
├── scripts/           # 维护脚本
├── render.yaml        # Render Blueprint 配置
└── package.json
```

---

## 2. 总体路线图

| 阶段 | 核心目标 | 产出标准 |
|---|---|---|
| **第一阶段** | 核心链路完善 + 稳定部署 | 修复问题、完善功能、Render 部署成功并可用 |
| **第二阶段** | AI 好友感 + 体验打磨 | 长期记忆、主动开口、角色一致、UI 顺滑 |
| **第三阶段** | 接入微信 | 微信内可多轮对话，跨端历史与记忆互通 |

---

## 3. 第一阶段：核心链路完善与部署上线

### 3.1 目标

基于现有代码，修复问题、完善功能、确保「匿名登录 → 创建 AI 好友 → 流式聊天」主链路完整可用，并成功部署到 Render 生产环境。

### 3.2 当前已实现

- ✅ 工程骨架：前后端分离、TypeScript、Vite、Tailwind CSS
- ✅ 数据库模型：User、Agent、ChatMessage 三张核心表
- ✅ 后端路由：auth、agents、chat、upload
- ✅ LLM 适配层：OpenAI 兼容格式，支持流式（SSE）
- ✅ 前端页面：AgentsPage、AgentEditPage、ChatPage、ProfilePage
- ✅ 状态管理：auth、agents、chat、theme、toast
- ✅ 通用组件：Avatar、BottomNav、GlassCard、Modal、Toast、EmptyState、ErrorBoundary
- ✅ 智能体模板：预设模板一键填充
- ✅ 双主题：极光 / 七彩
- ✅ Render Blueprint 配置：`render.yaml`

### 3.3 待完善任务

#### 3.3.1 代码质量检查与修复

- 运行 `pnpm lint`，修复所有 ESLint 错误和警告
- 运行 `pnpm check`，确保 TypeScript 类型检查通过
- 运行 `pnpm build`，确保生产构建成功
- 检查 Prisma schema 与生成路径是否正确（`output` 指向 `../src/generated/prisma`）

#### 3.3.2 核心功能验证与修复

- **开场白功能**：验证进入聊天页时智能体是否自动发送问候
- **流式对话**：验证 SSE 流式渲染是否正常，中断处理是否完善
- **重新生成**：验证重新生成最后一条消息功能
- **清空对话**：验证清空后历史记录是否正确删除
- **头像上传**：验证头像上传和显示是否正常
- **模板功能**：验证预设模板是否正确填充表单
- **主题切换**：验证极光 / 七彩主题切换是否正常

#### 3.3.3 移动端适配优化

- iOS 键盘弹出时输入框位置调整
- 底部安全区适配
- 触控目标大小检查
- 移动端浏览器兼容性测试

#### 3.3.4 错误处理完善

- 所有 API 请求错误有明确的用户提示
- 网络断开时的友好提示
- LLM API Key 缺失 / 无效 / 余额不足的具体错误提示
- 全局 ErrorBoundary 优化

#### 3.3.5 Render 部署准备

- 确认 `render.yaml` 配置正确
- 确认 `buildCommand` 和 `startCommand` 正确
- 确认环境变量配置完整
- 确认健康检查路径 `/api/health` 正常工作
- 确认静态资源路径配置正确（前端构建产物 `dist/` 目录）

### 3.4 部署到 Render 步骤

#### 前置准备

1. 确保代码已推送到 GitHub 仓库的 `main` 分支
2. 注册 Render 账号（render.com）

#### 部署步骤

1. 在 Render Dashboard 选择 **Blueprints** → **New Blueprint Instance**
2. 连接 GitHub 仓库，选择本项目
3. Render# 灵伴 AI 好友 - 三阶段开发文档

> 版本：v1.0
> 当前状态：第一阶段核心代码已完成，待完善与部署
> 部署目标：Render
> 代码分支：main（默认分支）

---

## 0. 文档说明

本文档是「灵伴 AI 好友」项目的开发路线图，按三个阶段递进式推进：

- **第一阶段**：完善核心链路 + 成功部署到 Render
- **第二阶段**：深化 AI 好友感 + 打磨用户体验
- **第三阶段**：接入微信 + 跨端互通

每个阶段都有明确的目标、任务清单和验收标准，阶段结束时 `main` 分支上的代码都应能成功部署到 Render。

### Git 工作流约定

> **重要：所有开发和修改都直接在 `main` 分支上进行，每次完成后推送到远程 `main` 分支。**

```bash
# 查看当前状态
git status

# 添加修改
git add .

# 提交（使用有意义的提交信息）
git commit -m "feat: 添加 xxx 功能"
git commit -m "fix: 修复 xxx 问题"
git commit -m "refactor: 重构 xxx 模块"

# 推送到远程 main 分支
git push origin main
```

Render 会自动监听 `main` 分支的推送，触发自动部署。

---

## 1. 项目总览

### 1.1 产品定位

「灵伴」是一个 **AI 好友 / 角色陪伴** 应用。每个智能体都像用户拥有的一位虚拟朋友：有鲜明性格、背景、说话方式，会主动关心用户、找话题聊天。用户无需注册即可匿名使用，可创建多个不同性格的 AI 好友。

### 1.2 技术栈

| 层 | 选型 | 说明 |
|---|---|---|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS + Zustand + React Router | 移动端优先，单页应用 |
| 后端 | Express 4 + TypeScript（ESM） | REST + SSE 流式 |
| 数据库 | PostgreSQL + Prisma ORM v7 | |
| LLM | OpenAI 兼容格式 | 支持 OpenAI / DeepSeek / 自定义端点 |
| 部署 | Render Blueprint | Web Service + PostgreSQL |

### 1.3 当前项目结构

```text
/workspace
├── src/               # React 前端
│   ├── components/    # 通用组件
│   ├── pages/         # 页面
│   ├── store/         # Zustand 状态
│   ├── lib/           # API 封装、工具函数
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── api/               # Express 后端
│   ├── routes/        # 业务路由
│   ├── middleware/    # 鉴权
│   ├── lib/           # prisma、llm 适配器
│   ├── types/         # 类型声明
│   ├── app.ts
│   └── server.ts
├── prisma/            # Schema 与迁移
├── public/            # 静态资源
├── scripts/           # 维护脚本
├── render.yaml        # Render Blueprint 配置
└── package.json
```

---

## 2. 总体路线图

| 阶段 | 核心目标 | 产出标准 |
|---|---|---|
| **第一阶段** | 核心链路完善 + 稳定部署 | 修复问题、完善功能、Render 部署成功并可用 |
| **第二阶段** | AI 好友感 + 体验打磨 | 长期记忆、主动开口、角色一致、UI 顺滑 |
| **第三阶段** | 接入微信 | 微信内可多轮对话，跨端历史与记忆互通 |

---

## 3. 第一阶段：核心链路完善与部署上线

### 3.1 目标

基于现有代码，修复问题、完善功能、确保「匿名登录 → 创建 AI 好友 → 流式聊天」主链路完整可用，并成功部署到 Render 生产环境。

### 3.2 当前已实现

- ✅ 工程骨架：前后端分离、TypeScript、Vite、Tailwind CSS
- ✅ 数据库模型：User、Agent、ChatMessage 三张核心表
- ✅ 后端路由：auth、agents、chat、upload
- ✅ LLM 适配层：OpenAI 兼容格式，支持流式（SSE）
- ✅ 前端页面：AgentsPage、AgentEditPage、ChatPage、ProfilePage
- ✅ 状态管理：auth、agents、chat、theme、toast
- ✅ 通用组件：Avatar、BottomNav、GlassCard、Modal、Toast、EmptyState、ErrorBoundary
- ✅ 智能体模板：预设模板一键填充
- ✅ 双主题：极光 / 七彩
- ✅ Render Blueprint 配置：`render.yaml`

### 3.3 待完善任务

#### 3.3.1 代码质量检查与修复

- 运行 `pnpm lint`，修复所有 ESLint 错误和警告
- 运行 `pnpm check`，确保 TypeScript 类型检查通过
- 运行 `pnpm build`，确保生产构建成功
- 检查 Prisma schema 与生成路径是否正确（`output` 指向 `../src/generated/prisma`）

#### 3.3.2 核心功能验证与修复

- **开场白功能**：验证进入聊天页时智能体是否自动发送问候
- **流式对话**：验证 SSE 流式渲染是否正常，中断处理是否完善
- **重新生成**：验证重新生成最后一条消息功能
- **清空对话**：验证清空后历史记录是否正确删除
- **头像上传**：验证头像上传和显示是否正常
- **模板功能**：验证预设模板是否正确填充表单
- **主题切换**：验证极光 / 七彩主题切换是否正常

#### 3.3.3 移动端适配优化

- iOS 键盘弹出时输入框位置调整
- 底部安全区适配
- 触控目标大小检查
- 移动端浏览器兼容性测试

#### 3.3.4 错误处理完善

- 所有 API 请求错误有明确的用户提示
- 网络断开时的友好提示
- LLM API Key 缺失 / 无效 / 余额不足的具体错误提示
- 全局 ErrorBoundary 优化

#### 3.3.5 Render 部署准备

- 确认 `render.yaml` 配置正确
- 确认 `buildCommand` 和 `startCommand` 正确
- 确认环境变量配置完整
- 确认健康检查路径 `/api/health` 正常工作
- 确认静态资源路径配置正确（前端构建产物 `dist/` 目录）

### 3.4 部署到 Render 步骤

#### 前置准备

1. 确保代码已推送到 GitHub 仓库的 `main` 分支
2. 注册 Render 账号（render.com）

#### 部署步骤

1. 在 Render Dashboard 选择 **Blueprints** → **New Blueprint Instance**
2. 连接 GitHub 仓库，选择本项目
3. Render 会自动读取 `render.yaml`，创建：
   - Web Service（Node.js）
# 灵伴 AI 好友 - 三阶段开发文档

> 版本：v1.0
> 当前状态：第一阶段核心代码已完成，待完善与部署
> 部署目标：Render
> 代码分支：main（默认分支）

---

## 0. 文档说明

本文档是「灵伴 AI 好友」项目的开发路线图，按三个阶段递进式推进：

- **第一阶段**：完善核心链路 + 成功部署到 Render
- **第二阶段**：深化 AI 好友感 + 打磨用户体验
- **第三阶段**：接入微信 + 跨端互通

每个阶段都有明确的目标、任务清单和验收标准，阶段结束时 `main` 分支上的代码都应能成功部署到 Render。

### Git 工作流约定

> **重要：所有开发和修改都直接在 `main` 分支上进行，每次完成后推送到远程 `main` 分支。**

```bash
# 查看当前状态
git status

# 添加修改
git add .

# 提交（使用有意义的提交信息）
git commit -m "feat: 添加 xxx 功能"
git commit -m "fix: 修复 xxx 问题"
git commit -m "refactor: 重构 xxx 模块"

# 推送到远程 main 分支
git push origin main
```

Render 会自动监听 `main` 分支的推送，触发自动部署。

---

## 1. 项目总览

### 1.1 产品定位

「灵伴」是一个 **AI 好友 / 角色陪伴** 应用。每个智能体都像用户拥有的一位虚拟朋友：有鲜明性格、背景、说话方式，会主动关心用户、找话题聊天。用户无需注册即可匿名使用，可创建多个不同性格的 AI 好友。

### 1.2 技术栈

| 层 | 选型 | 说明 |
|---|---|---|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS + Zustand + React Router | 移动端优先，单页应用 |
| 后端 | Express 4 + TypeScript（ESM） | REST + SSE 流式 |
| 数据库 | PostgreSQL + Prisma ORM v7 | |
| LLM | OpenAI 兼容格式 | 支持 OpenAI / DeepSeek / 自定义端点 |
| 部署 | Render Blueprint | Web Service + PostgreSQL |

### 1.3 当前项目结构

```text
/workspace
├── src/               # React 前端
│   ├── components/    # 通用组件
│   ├── pages/         # 页面
│   ├── store/         # Zustand 状态
│   ├── lib/           # API 封装、工具函数
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── api/               # Express 后端
│   ├── routes/        # 业务路由
│   ├── middleware/    # 鉴权
│   ├── lib/           # prisma、llm 适配器
│   ├── types/         # 类型声明
│   ├── app.ts
│   └── server.ts
├── prisma/            # Schema 与迁移
├── public/            # 静态资源
├── scripts/           # 维护脚本
├── render.yaml        # Render Blueprint 配置
└── package.json
```

---

## 2. 总体路线图

| 阶段 | 核心目标 | 产出标准 |
|---|---|---|
| **第一阶段** | 核心链路完善 + 稳定部署 | 修复问题、完善功能、Render 部署成功并可用 |
| **第二阶段** | AI 好友感 + 体验打磨 | 长期记忆、主动开口、角色一致、UI 顺滑 |
| **第三阶段** | 接入微信 | 微信内可多轮对话，跨端历史与记忆互通 |

---

## 3. 第一阶段：核心链路完善与部署上线

### 3.1 目标

基于现有代码，修复问题、完善功能、确保「匿名登录 → 创建 AI 好友 → 流式聊天」主链路完整可用，并成功部署到 Render 生产环境。

### 3.2 当前已实现

- ✅ 工程骨架：前后端分离、TypeScript、Vite、Tailwind CSS
- ✅ 数据库模型：User、Agent、ChatMessage 三张核心表
- ✅ 后端路由：auth、agents、chat、upload
- ✅ LLM 适配层：OpenAI 兼容格式，支持流式（SSE）
- ✅ 前端页面：AgentsPage、AgentEditPage、ChatPage、ProfilePage
- ✅ 状态管理：auth、agents、chat、theme、toast
- ✅ 通用组件：Avatar、BottomNav、GlassCard、Modal、Toast、EmptyState、ErrorBoundary
- ✅ 智能体模板：预设模板一键填充
- ✅ 双主题：极光 / 七彩
- ✅ Render Blueprint 配置：`render.yaml`

### 3.3 待完善任务

#### 3.3.1 代码质量检查与修复

- 运行 `pnpm lint`，修复所有 ESLint 错误和警告
- 运行 `pnpm check`，确保 TypeScript 类型检查通过
- 运行 `pnpm build`，确保生产构建成功
- 检查 Prisma schema 与生成路径是否正确（`output` 指向 `../src/generated/prisma`）

#### 3.3.2 核心功能验证与修复

- **开场白功能**：验证进入聊天页时智能体是否自动发送问候
- **流式对话**：验证 SSE 流式渲染是否正常，中断处理是否完善
- **重新生成**：验证重新生成最后一条消息功能
- **清空对话**：验证清空后历史记录是否正确删除
- **头像上传**：验证头像上传和显示是否正常
- **模板功能**：验证预设模板是否正确填充表单
- **主题切换**：验证极光 / 七彩主题切换是否正常

#### 3.3.3 移动端适配优化

- iOS 键盘弹出时输入框位置调整
- 底部安全区适配
- 触控目标大小检查
- 移动端浏览器兼容性测试

#### 3.3.4 错误处理完善

- 所有 API 请求错误有明确的用户提示
- 网络断开时的友好提示
- LLM API Key 缺失 / 无效 / 余额不足的具体错误提示
- 全局 ErrorBoundary 优化

#### 3.3.5 Render 部署准备

- 确认 `render.yaml` 配置正确
- 确认 `buildCommand` 和 `startCommand` 正确
- 确认环境变量配置完整
- 确认健康检查路径 `/api/health` 正常工作
- 确认静态资源路径配置正确（前端构建产物 `dist/` 目录）

### 3.4 部署到 Render 步骤

#### 前置准备

1. 确保代码已推送到 GitHub 仓库的 `main` 分支
2. 注册 Render 账号（render.com）

#### 部署步骤

1. 在 Render Dashboard 选择 **Blueprints** → **New Blueprint Instance**
2. 连接 GitHub 仓库，选择本项目
3. Render 会自动读取 `render.yaml`，创建：
   - Web Service（Node.js）
   - PostgreSQL 数据库
4. 等待部署完成（首次部署约 5-1# 灵伴 AI 好友 - 三阶段开发文档

> 版本：v1.0
> 当前状态：第一阶段核心代码已完成，待完善与部署
> 部署目标：Render
> 代码分支：main（默认分支）

---

## 0. 文档说明

本文档是「灵伴 AI 好友」项目的开发路线图，按三个阶段递进式推进：

- **第一阶段**：完善核心链路 + 成功部署到 Render
- **第二阶段**：深化 AI 好友感 + 打磨用户体验
- **第三阶段**：接入微信 + 跨端互通

每个阶段都有明确的目标、任务清单和验收标准，阶段结束时 `main` 分支上的代码都应能成功部署到 Render。

### Git 工作流约定

> **重要：所有开发和修改都直接在 `main` 分支上进行，每次完成后推送到远程 `main` 分支。**

```bash
# 查看当前状态
git status

# 添加修改
git add .

# 提交（使用有意义的提交信息）
git commit -m "feat: 添加 xxx 功能"
git commit -m "fix: 修复 xxx 问题"
git commit -m "refactor: 重构 xxx 模块"

# 推送到远程 main 分支
git push origin main
```

Render 会自动监听 `main` 分支的推送，触发自动部署。

---

## 1. 项目总览

### 1.1 产品定位

「灵伴」是一个 **AI 好友 / 角色陪伴** 应用。每个智能体都像用户拥有的一位虚拟朋友：有鲜明性格、背景、说话方式，会主动关心用户、找话题聊天。用户无需注册即可匿名使用，可创建多个不同性格的 AI 好友。

### 1.2 技术栈

| 层 | 选型 | 说明 |
|---|---|---|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS + Zustand + React Router | 移动端优先，单页应用 |
| 后端 | Express 4 + TypeScript（ESM） | REST + SSE 流式 |
| 数据库 | PostgreSQL + Prisma ORM v7 | |
| LLM | OpenAI 兼容格式 | 支持 OpenAI / DeepSeek / 自定义端点 |
| 部署 | Render Blueprint | Web Service + PostgreSQL |

### 1.3 当前项目结构

```text
/workspace
├── src/               # React 前端
│   ├── components/    # 通用组件
│   ├── pages/         # 页面
│   ├── store/         # Zustand 状态
│   ├── lib/           # API 封装、工具函数
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── api/               # Express 后端
│   ├── routes/        # 业务路由
│   ├── middleware/    # 鉴权
│   ├── lib/           # prisma、llm 适配器
│   ├── types/         # 类型声明
│   ├── app.ts
│   └── server.ts
├── prisma/            # Schema 与迁移
├── public/            # 静态资源
├── scripts/           # 维护脚本
├── render.yaml        # Render Blueprint 配置
└── package.json
```

---

## 2. 总体路线图

| 阶段 | 核心目标 | 产出标准 |
|---|---|---|
| **第一阶段** | 核心链路完善 + 稳定部署 | 修复问题、完善功能、Render 部署成功并可用 |
| **第二阶段** | AI 好友感 + 体验打磨 | 长期记忆、主动开口、角色一致、UI 顺滑 |
| **第三阶段** | 接入微信 | 微信内可多轮对话，跨端历史与记忆互通 |

---

## 3. 第一阶段：核心链路完善与部署上线

### 3.1 目标

基于现有代码，修复问题、完善功能、确保「匿名登录 → 创建 AI 好友 → 流式聊天」主链路完整可用，并成功部署到 Render 生产环境。

### 3.2 当前已实现

- ✅ 工程骨架：前后端分离、TypeScript、Vite、Tailwind CSS
- ✅ 数据库模型：User、Agent、ChatMessage 三张核心表
- ✅ 后端路由：auth、agents、chat、upload
- ✅ LLM 适配层：OpenAI 兼容格式，支持流式（SSE）
- ✅ 前端页面：AgentsPage、AgentEditPage、ChatPage、ProfilePage
- ✅ 状态管理：auth、agents、chat、theme、toast
- ✅ 通用组件：Avatar、BottomNav、GlassCard、Modal、Toast、EmptyState、ErrorBoundary
- ✅ 智能体模板：预设模板一键填充
- ✅ 双主题：极光 / 七彩
- ✅ Render Blueprint 配置：`render.yaml`

### 3.3 待完善任务

#### 3.3.1 代码质量检查与修复

- 运行 `pnpm lint`，修复所有 ESLint 错误和警告
- 运行 `pnpm check`，确保 TypeScript 类型检查通过
- 运行 `pnpm build`，确保生产构建成功
- 检查 Prisma schema 与生成路径是否正确（`output` 指向 `../src/generated/prisma`）

#### 3.3.2 核心功能验证与修复

- **开场白功能**：验证进入聊天页时智能体是否自动发送问候
- **流式对话**：验证 SSE 流式渲染是否正常，中断处理是否完善
- **重新生成**：验证重新生成最后一条消息功能
- **清空对话**：验证清空后历史记录是否正确删除
- **头像上传**：验证头像上传和显示是否正常
- **模板功能**：验证预设模板是否正确填充表单
- **主题切换**：验证极光 / 七彩主题切换是否正常

#### 3.3.3 移动端适配优化

- iOS 键盘弹出时输入框位置调整
- 底部安全区适配
- 触控目标大小检查
- 移动端浏览器兼容性测试

#### 3.3.4 错误处理完善

- 所有 API 请求错误有明确的用户提示
- 网络断开时的友好提示
- LLM API Key 缺失 / 无效 / 余额不足的具体错误提示
- 全局 ErrorBoundary 优化

#### 3.3.5 Render 部署准备

- 确认 `render.yaml` 配置正确
- 确认 `buildCommand` 和 `startCommand` 正确
- 确认环境变量配置完整
- 确认健康检查路径 `/api/health` 正常工作
- 确认静态资源路径配置正确（前端构建产物 `dist/` 目录）

### 3.4 部署到 Render 步骤

#### 前置准备

1. 确保代码已推送到 GitHub 仓库的 `main` 分支
2. 注册 Render 账号（render.com）

#### 部署步骤

1. 在 Render Dashboard 选择 **Blueprints** → **New Blueprint Instance**
2. 连接 GitHub 仓库，选择本项目
3. Render 会自动读取 `render.yaml`，创建：
   - Web Service（Node.js）
   - PostgreSQL 数据库
4. 等待部署完成（首次部署约 5-10 分钟）
5. 访问分配的域名（如 `https://lingban-# 灵伴 AI 好友 - 三阶段开发文档

> 版本：v1.0
> 当前状态：第一阶段核心代码已完成，待完善与部署
> 部署目标：Render
> 代码分支：main（默认分支）

---

## 0. 文档说明

本文档是「灵伴 AI 好友」项目的开发路线图，按三个阶段递进式推进：

- **第一阶段**：完善核心链路 + 成功部署到 Render
- **第二阶段**：深化 AI 好友感 + 打磨用户体验
- **第三阶段**：接入微信 + 跨端互通

每个阶段都有明确的目标、任务清单和验收标准，阶段结束时 `main` 分支上的代码都应能成功部署到 Render。

### Git 工作流约定

> **重要：所有开发和修改都直接在 `main` 分支上进行，每次完成后推送到远程 `main` 分支。**

```bash
# 查看当前状态
git status

# 添加修改
git add .

# 提交（使用有意义的提交信息）
git commit -m "feat: 添加 xxx 功能"
git commit -m "fix: 修复 xxx 问题"
git commit -m "refactor: 重构 xxx 模块"

# 推送到远程 main 分支
git push origin main
```

Render 会自动监听 `main` 分支的推送，触发自动部署。

---

## 1. 项目总览

### 1.1 产品定位

「灵伴」是一个 **AI 好友 / 角色陪伴** 应用。每个智能体都像用户拥有的一位虚拟朋友：有鲜明性格、背景、说话方式，会主动关心用户、找话题聊天。用户无需注册即可匿名使用，可创建多个不同性格的 AI 好友。

### 1.2 技术栈

| 层 | 选型 | 说明 |
|---|---|---|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS + Zustand + React Router | 移动端优先，单页应用 |
| 后端 | Express 4 + TypeScript（ESM） | REST + SSE 流式 |
| 数据库 | PostgreSQL + Prisma ORM v7 | |
| LLM | OpenAI 兼容格式 | 支持 OpenAI / DeepSeek / 自定义端点 |
| 部署 | Render Blueprint | Web Service + PostgreSQL |

### 1.3 当前项目结构

```text
/workspace
├── src/               # React 前端
│   ├── components/    # 通用组件
│   ├── pages/         # 页面
│   ├── store/         # Zustand 状态
│   ├── lib/           # API 封装、工具函数
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── api/               # Express 后端
│   ├── routes/        # 业务路由
│   ├── middleware/    # 鉴权
│   ├── lib/           # prisma、llm 适配器
│   ├── types/         # 类型声明
│   ├── app.ts
│   └── server.ts
├── prisma/            # Schema 与迁移
├── public/            # 静态资源
├── scripts/           # 维护脚本
├── render.yaml        # Render Blueprint 配置
└── package.json
```

---

## 2. 总体路线图

| 阶段 | 核心目标 | 产出标准 |
|---|---|---|
| **第一阶段** | 核心链路完善 + 稳定部署 | 修复问题、完善功能、Render 部署成功并可用 |
| **第二阶段** | AI 好友感 + 体验打磨 | 长期记忆、主动开口、角色一致、UI 顺滑 |
| **第三阶段** | 接入微信 | 微信内可多轮对话，跨端历史与记忆互通 |

---

## 3. 第一阶段：核心链路完善与部署上线

### 3.1 目标

基于现有代码，修复问题、完善功能、确保「匿名登录 → 创建 AI 好友 → 流式聊天」主链路完整可用，并成功部署到 Render 生产环境。

### 3.2 当前已实现

- ✅ 工程骨架：前后端分离、TypeScript、Vite、Tailwind CSS
- ✅ 数据库模型：User、Agent、ChatMessage 三张核心表
- ✅ 后端路由：auth、agents、chat、upload
- ✅ LLM 适配层：OpenAI 兼容格式，支持流式（SSE）
- ✅ 前端页面：AgentsPage、AgentEditPage、ChatPage、ProfilePage
- ✅ 状态管理：auth、agents、chat、theme、toast
- ✅ 通用组件：Avatar、BottomNav、GlassCard、Modal、Toast、EmptyState、ErrorBoundary
- ✅ 智能体模板：预设模板一键填充
- ✅ 双主题：极光 / 七彩
- ✅ Render Blueprint 配置：`render.yaml`

### 3.3 待完善任务

#### 3.3.1 代码质量检查与修复

- 运行 `pnpm lint`，修复所有 ESLint 错误和警告
- 运行 `pnpm check`，确保 TypeScript 类型检查通过
- 运行 `pnpm build`，确保生产构建成功
- 检查 Prisma schema 与生成路径是否正确（`output` 指向 `../src/generated/prisma`）

#### 3.3.2 核心功能验证与修复

- **开场白功能**：验证进入聊天页时智能体是否自动发送问候
- **流式对话**：验证 SSE 流式渲染是否正常，中断处理是否完善
- **重新生成**：验证重新生成最后一条消息功能
- **清空对话**：验证清空后历史记录是否正确删除
- **头像上传**：验证头像上传和显示是否正常
- **模板功能**：验证预设模板是否正确填充表单
- **主题切换**：验证极光 / 七彩主题切换是否正常

#### 3.3.3 移动端适配优化

- iOS 键盘弹出时输入框位置调整
- 底部安全区适配
- 触控目标大小检查
- 移动端浏览器兼容性测试

#### 3.3.4 错误处理完善

- 所有 API 请求错误有明确的用户提示
- 网络断开时的友好提示
- LLM API Key 缺失 / 无效 / 余额不足的具体错误提示
- 全局 ErrorBoundary 优化

#### 3.3.5 Render 部署准备

- 确认 `render.yaml` 配置正确
- 确认 `buildCommand` 和 `startCommand` 正确
- 确认环境变量配置完整
- 确认健康检查路径 `/api/health` 正常工作
- 确认静态资源路径配置正确（前端构建产物 `dist/` 目录）

### 3.4 部署到 Render 步骤

#### 前置准备

1. 确保代码已推送到 GitHub 仓库的 `main` 分支
2. 注册 Render 账号（render.com）

#### 部署步骤

1. 在 Render Dashboard 选择 **Blueprints** → **New Blueprint Instance**
2. 连接 GitHub 仓库，选择本项目
3. Render 会自动读取 `render.yaml`，创建：
   - Web Service（Node.js）
   - PostgreSQL 数据库
4. 等待部署完成（首次部署约 5-10 分钟）
5. 访问分配的域名（如 `https://lingban-xxx.onrender.com`）验证

#### 后续部署

每次将代码推送到 `main# 灵伴 AI 好友 - 三阶段开发文档

> 版本：v1.0
> 当前状态：第一阶段核心代码已完成，待完善与部署
> 部署目标：Render
> 代码分支：main（默认分支）

---

## 0. 文档说明

本文档是「灵伴 AI 好友」项目的开发路线图，按三个阶段递进式推进：

- **第一阶段**：完善核心链路 + 成功部署到 Render
- **第二阶段**：深化 AI 好友感 + 打磨用户体验
- **第三阶段**：接入微信 + 跨端互通

每个阶段都有明确的目标、任务清单和验收标准，阶段结束时 `main` 分支上的代码都应能成功部署到 Render。

### Git 工作流约定

> **重要：所有开发和修改都直接在 `main` 分支上进行，每次完成后推送到远程 `main` 分支。**

```bash
# 查看当前状态
git status

# 添加修改
git add .

# 提交（使用有意义的提交信息）
git commit -m "feat: 添加 xxx 功能"
git commit -m "fix: 修复 xxx 问题"
git commit -m "refactor: 重构 xxx 模块"

# 推送到远程 main 分支
git push origin main
```

Render 会自动监听 `main` 分支的推送，触发自动部署。

---

## 1. 项目总览

### 1.1 产品定位

「灵伴」是一个 **AI 好友 / 角色陪伴** 应用。每个智能体都像用户拥有的一位虚拟朋友：有鲜明性格、背景、说话方式，会主动关心用户、找话题聊天。用户无需注册即可匿名使用，可创建多个不同性格的 AI 好友。

### 1.2 技术栈

| 层 | 选型 | 说明 |
|---|---|---|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS + Zustand + React Router | 移动端优先，单页应用 |
| 后端 | Express 4 + TypeScript（ESM） | REST + SSE 流式 |
| 数据库 | PostgreSQL + Prisma ORM v7 | |
| LLM | OpenAI 兼容格式 | 支持 OpenAI / DeepSeek / 自定义端点 |
| 部署 | Render Blueprint | Web Service + PostgreSQL |

### 1.3 当前项目结构

```text
/workspace
├── src/               # React 前端
│   ├── components/    # 通用组件
│   ├── pages/         # 页面
│   ├── store/         # Zustand 状态
│   ├── lib/           # API 封装、工具函数
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── api/               # Express 后端
│   ├── routes/        # 业务路由
│   ├── middleware/    # 鉴权
│   ├── lib/           # prisma、llm 适配器
│   ├── types/         # 类型声明
│   ├── app.ts
│   └── server.ts
├── prisma/            # Schema 与迁移
├── public/            # 静态资源
├── scripts/           # 维护脚本
├── render.yaml        # Render Blueprint 配置
└── package.json
```

---

## 2. 总体路线图

| 阶段 | 核心目标 | 产出标准 |
|---|---|---|
| **第一阶段** | 核心链路完善 + 稳定部署 | 修复问题、完善功能、Render 部署成功并可用 |
| **第二阶段** | AI 好友感 + 体验打磨 | 长期记忆、主动开口、角色一致、UI 顺滑 |
| **第三阶段** | 接入微信 | 微信内可多轮对话，跨端历史与记忆互通 |

---

## 3. 第一阶段：核心链路完善与部署上线

### 3.1 目标

基于现有代码，修复问题、完善功能、确保「匿名登录 → 创建 AI 好友 → 流式聊天」主链路完整可用，并成功部署到 Render 生产环境。

### 3.2 当前已实现

- ✅ 工程骨架：前后端分离、TypeScript、Vite、Tailwind CSS
- ✅ 数据库模型：User、Agent、ChatMessage 三张核心表
- ✅ 后端路由：auth、agents、chat、upload
- ✅ LLM 适配层：OpenAI 兼容格式，支持流式（SSE）
- ✅ 前端页面：AgentsPage、AgentEditPage、ChatPage、ProfilePage
- ✅ 状态管理：auth、agents、chat、theme、toast
- ✅ 通用组件：Avatar、BottomNav、GlassCard、Modal、Toast、EmptyState、ErrorBoundary
- ✅ 智能体模板：预设模板一键填充
- ✅ 双主题：极光 / 七彩
- ✅ Render Blueprint 配置：`render.yaml`

### 3.3 待完善任务

#### 3.3.1 代码质量检查与修复

- 运行 `pnpm lint`，修复所有 ESLint 错误和警告
- 运行 `pnpm check`，确保 TypeScript 类型检查通过
- 运行 `pnpm build`，确保生产构建成功
- 检查 Prisma schema 与生成路径是否正确（`output` 指向 `../src/generated/prisma`）

#### 3.3.2 核心功能验证与修复

- **开场白功能**：验证进入聊天页时智能体是否自动发送问候
- **流式对话**：验证 SSE 流式渲染是否正常，中断处理是否完善
- **重新生成**：验证重新生成最后一条消息功能
- **清空对话**：验证清空后历史记录是否正确删除
- **头像上传**：验证头像上传和显示是否正常
- **模板功能**：验证预设模板是否正确填充表单
- **主题切换**：验证极光 / 七彩主题切换是否正常

#### 3.3.3 移动端适配优化

- iOS 键盘弹出时输入框位置调整
- 底部安全区适配
- 触控目标大小检查
- 移动端浏览器兼容性测试

#### 3.3.4 错误处理完善

- 所有 API 请求错误有明确的用户提示
- 网络断开时的友好提示
- LLM API Key 缺失 / 无效 / 余额不足的具体错误提示
- 全局 ErrorBoundary 优化

#### 3.3.5 Render 部署准备

- 确认 `render.yaml` 配置正确
- 确认 `buildCommand` 和 `startCommand` 正确
- 确认环境变量配置完整
- 确认健康检查路径 `/api/health` 正常工作
- 确认静态资源路径配置正确（前端构建产物 `dist/` 目录）

### 3.4 部署到 Render 步骤

#### 前置准备

1. 确保代码已推送到 GitHub 仓库的 `main` 分支
2. 注册 Render 账号（render.com）

#### 部署步骤

1. 在 Render Dashboard 选择 **Blueprints** → **New Blueprint Instance**
2. 连接 GitHub 仓库，选择本项目
3. Render 会自动读取 `render.yaml`，创建：
   - Web Service（Node.js）
   - PostgreSQL 数据库
4. 等待部署完成（首次部署约 5-10 分钟）
5. 访问分配的域名（如 `https://lingban-xxx.onrender.com`）验证

#### 后续部署

每次将代码推送到 `main` 分支后，Render 会自动触发重新部署：

```bash
git add .# 灵伴 AI 好友 - 三阶段开发文档

> 版本：v1.0
> 当前状态：第一阶段核心代码已完成，待完善与部署
> 部署目标：Render
> 代码分支：main（默认分支）

---

## 0. 文档说明

本文档是「灵伴 AI 好友」项目的开发路线图，按三个阶段递进式推进：

- **第一阶段**：完善核心链路 + 成功部署到 Render
- **第二阶段**：深化 AI 好友感 + 打磨用户体验
- **第三阶段**：接入微信 + 跨端互通

每个阶段都有明确的目标、任务清单和验收标准，阶段结束时 `main` 分支上的代码都应能成功部署到 Render。

### Git 工作流约定

> **重要：所有开发和修改都直接在 `main` 分支上进行，每次完成后推送到远程 `main` 分支。**

```bash
# 查看当前状态
git status

# 添加修改
git add .

# 提交（使用有意义的提交信息）
git commit -m "feat: 添加 xxx 功能"
git commit -m "fix: 修复 xxx 问题"
git commit -m "refactor: 重构 xxx 模块"

# 推送到远程 main 分支
git push origin main
```

Render 会自动监听 `main` 分支的推送，触发自动部署。

---

## 1. 项目总览

### 1.1 产品定位

「灵伴」是一个 **AI 好友 / 角色陪伴** 应用。每个智能体都像用户拥有的一位虚拟朋友：有鲜明性格、背景、说话方式，会主动关心用户、找话题聊天。用户无需注册即可匿名使用，可创建多个不同性格的 AI 好友。

### 1.2 技术栈

| 层 | 选型 | 说明 |
|---|---|---|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS + Zustand + React Router | 移动端优先，单页应用 |
| 后端 | Express 4 + TypeScript（ESM） | REST + SSE 流式 |
| 数据库 | PostgreSQL + Prisma ORM v7 | |
| LLM | OpenAI 兼容格式 | 支持 OpenAI / DeepSeek / 自定义端点 |
| 部署 | Render Blueprint | Web Service + PostgreSQL |

### 1.3 当前项目结构

```text
/workspace
├── src/               # React 前端
│   ├── components/    # 通用组件
│   ├── pages/         # 页面
│   ├── store/         # Zustand 状态
│   ├── lib/           # API 封装、工具函数
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── api/               # Express 后端
│   ├── routes/        # 业务路由
│   ├── middleware/    # 鉴权
│   ├── lib/           # prisma、llm 适配器
│   ├── types/         # 类型声明
│   ├── app.ts
│   └── server.ts
├── prisma/            # Schema 与迁移
├── public/            # 静态资源
├── scripts/           # 维护脚本
├── render.yaml        # Render Blueprint 配置
└── package.json
```

---

## 2. 总体路线图

| 阶段 | 核心目标 | 产出标准 |
|---|---|---|
| **第一阶段** | 核心链路完善 + 稳定部署 | 修复问题、完善功能、Render 部署成功并可用 |
| **第二阶段** | AI 好友感 + 体验打磨 | 长期记忆、主动开口、角色一致、UI 顺滑 |
| **第三阶段** | 接入微信 | 微信内可多轮对话，跨端历史与记忆互通 |

---

## 3. 第一阶段：核心链路完善与部署上线

### 3.1 目标

基于现有代码，修复问题、完善功能、确保「匿名登录 → 创建 AI 好友 → 流式聊天」主链路完整可用，并成功部署到 Render 生产环境。

### 3.2 当前已实现

- ✅ 工程骨架：前后端分离、TypeScript、Vite、Tailwind CSS
- ✅ 数据库模型：User、Agent、ChatMessage 三张核心表
- ✅ 后端路由：auth、agents、chat、upload
- ✅ LLM 适配层：OpenAI 兼容格式，支持流式（SSE）
- ✅ 前端页面：AgentsPage、AgentEditPage、ChatPage、ProfilePage
- ✅ 状态管理：auth、agents、chat、theme、toast
- ✅ 通用组件：Avatar、BottomNav、GlassCard、Modal、Toast、EmptyState、ErrorBoundary
- ✅ 智能体模板：预设模板一键填充
- ✅ 双主题：极光 / 七彩
- ✅ Render Blueprint 配置：`render.yaml`

### 3.3 待完善任务

#### 3.3.1 代码质量检查与修复

- 运行 `pnpm lint`，修复所有 ESLint 错误和警告
- 运行 `pnpm check`，确保 TypeScript 类型检查通过
- 运行 `pnpm build`，确保生产构建成功
- 检查 Prisma schema 与生成路径是否正确（`output` 指向 `../src/generated/prisma`）

#### 3.3.2 核心功能验证与修复

- **开场白功能**：验证进入聊天页时智能体是否自动发送问候
- **流式对话**：验证 SSE 流式渲染是否正常，中断处理是否完善
- **重新生成**：验证重新生成最后一条消息功能
- **清空对话**：验证清空后历史记录是否正确删除
- **头像上传**：验证头像上传和显示是否正常
- **模板功能**：验证预设模板是否正确填充表单
- **主题切换**：验证极光 / 七彩主题切换是否正常

#### 3.3.3 移动端适配优化

- iOS 键盘弹出时输入框位置调整
- 底部安全区适配
- 触控目标大小检查
- 移动端浏览器兼容性测试

#### 3.3.4 错误处理完善

- 所有 API 请求错误有明确的用户提示
- 网络断开时的友好提示
- LLM API Key 缺失 / 无效 / 余额不足的具体错误提示
- 全局 ErrorBoundary 优化

#### 3.3.5 Render 部署准备

- 确认 `render.yaml` 配置正确
- 确认 `buildCommand` 和 `startCommand` 正确
- 确认环境变量配置完整
- 确认健康检查路径 `/api/health` 正常工作
- 确认静态资源路径配置正确（前端构建产物 `dist/` 目录）

### 3.4 部署到 Render 步骤

#### 前置准备

1. 确保代码已推送到 GitHub 仓库的 `main` 分支
2. 注册 Render 账号（render.com）

#### 部署步骤

1. 在 Render Dashboard 选择 **Blueprints** → **New Blueprint Instance**
2. 连接 GitHub 仓库，选择本项目
3. Render 会自动读取 `render.yaml`，创建：
   - Web Service（Node.js）
   - PostgreSQL 数据库
4. 等待部署完成（首次部署约 5-10 分钟）
5. 访问分配的域名（如 `https://lingban-xxx.onrender.com`）验证

#### 后续部署

每次将代码推送到 `main` 分支后，Render 会自动触发重新部署：

```bash
git add .
git commit -m "描述你的修改"
git push origin main
```

#### 灵伴 AI 好友 - 三阶段开发文档

> 版本：v1.0
> 当前状态：第一阶段核心代码已完成，待完善与部署
> 部署目标：Render
> 代码分支：main（默认分支）

---

## 0. 文档说明

本文档是「灵伴 AI 好友」项目的开发路线图，按三个阶段递进式推进：

- **第一阶段**：完善核心链路 + 成功部署到 Render
- **第二阶段**：深化 AI 好友感 + 打磨用户体验
- **第三阶段**：接入微信 + 跨端互通

每个阶段都有明确的目标、任务清单和验收标准，阶段结束时 `main` 分支上的代码都应能成功部署到 Render。

### Git 工作流约定

> **重要：所有开发和修改都直接在 `main` 分支上进行，每次完成后推送到远程 `main` 分支。**

```bash
# 查看当前状态
git status

# 添加修改
git add .

# 提交（使用有意义的提交信息）
git commit -m "feat: 添加 xxx 功能"
git commit -m "fix: 修复 xxx 问题"
git commit -m "refactor: 重构 xxx 模块"

# 推送到远程 main 分支
git push origin main
```

Render 会自动监听 `main` 分支的推送，触发自动部署。

---

## 1. 项目总览

### 1.1 产品定位

「灵伴」是一个 **AI 好友 / 角色陪伴** 应用。每个智能体都像用户拥有的一位虚拟朋友：有鲜明性格、背景、说话方式，会主动关心用户、找话题聊天。用户无需注册即可匿名使用，可创建多个不同性格的 AI 好友。

### 1.2 技术栈

| 层 | 选型 | 说明 |
|---|---|---|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS + Zustand + React Router | 移动端优先，单页应用 |
| 后端 | Express 4 + TypeScript（ESM） | REST + SSE 流式 |
| 数据库 | PostgreSQL + Prisma ORM v7 | |
| LLM | OpenAI 兼容格式 | 支持 OpenAI / DeepSeek / 自定义端点 |
| 部署 | Render Blueprint | Web Service + PostgreSQL |

### 1.3 当前项目结构

```text
/workspace
├── src/               # React 前端
│   ├── components/    # 通用组件
│   ├── pages/         # 页面
│   ├── store/         # Zustand 状态
│   ├── lib/           # API 封装、工具函数
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── api/               # Express 后端
│   ├── routes/        # 业务路由
│   ├── middleware/    # 鉴权
│   ├── lib/           # prisma、llm 适配器
│   ├── types/         # 类型声明
│   ├── app.ts
│   └── server.ts
├── prisma/            # Schema 与迁移
├── public/            # 静态资源
├── scripts/           # 维护脚本
├── render.yaml        # Render Blueprint 配置
└── package.json
```

---

## 2. 总体路线图

| 阶段 | 核心目标 | 产出标准 |
|---|---|---|
| **第一阶段** | 核心链路完善 + 稳定部署 | 修复问题、完善功能、Render 部署成功并可用 |
| **第二阶段** | AI 好友感 + 体验打磨 | 长期记忆、主动开口、角色一致、UI 顺滑 |
| **第三阶段** | 接入微信 | 微信内可多轮对话，跨端历史与记忆互通 |

---

## 3. 第一阶段：核心链路完善与部署上线

### 3.1 目标

基于现有代码，修复问题、完善功能、确保「匿名登录 → 创建 AI 好友 → 流式聊天」主链路完整可用，并成功部署到 Render 生产环境。

### 3.2 当前已实现

- ✅ 工程骨架：前后端分离、TypeScript、Vite、Tailwind CSS
- ✅ 数据库模型：User、Agent、ChatMessage 三张核心表
- ✅ 后端路由：auth、agents、chat、upload
- ✅ LLM 适配层：OpenAI 兼容格式，支持流式（SSE）
- ✅ 前端页面：AgentsPage、AgentEditPage、ChatPage、ProfilePage
- ✅ 状态管理：auth、agents、chat、theme、toast
- ✅ 通用组件：Avatar、BottomNav、GlassCard、Modal、Toast、EmptyState、ErrorBoundary
- ✅ 智能体模板：预设模板一键填充
- ✅ 双主题：极光 / 七彩
- ✅ Render Blueprint 配置：`render.yaml`

### 3.3 待完善任务

#### 3.3.1 代码质量检查与修复

- 运行 `pnpm lint`，修复所有 ESLint 错误和警告
- 运行 `pnpm check`，确保 TypeScript 类型检查通过
- 运行 `pnpm build`，确保生产构建成功
- 检查 Prisma schema 与生成路径是否正确（`output` 指向 `../src/generated/prisma`）

#### 3.3.2 核心功能验证与修复

- **开场白功能**：验证进入聊天页时智能体是否自动发送问候
- **流式对话**：验证 SSE 流式渲染是否正常，中断处理是否完善
- **重新生成**：验证重新生成最后一条消息功能
- **清空对话**：验证清空后历史记录是否正确删除
- **头像上传**：验证头像上传和显示是否正常
- **模板功能**：验证预设模板是否正确填充表单
- **主题切换**：验证极光 / 七彩主题切换是否正常

#### 3.3.3 移动端适配优化

- iOS 键盘弹出时输入框位置调整
- 底部安全区适配
- 触控目标大小检查
- 移动端浏览器兼容性测试

#### 3.3.4 错误处理完善

- 所有 API 请求错误有明确的用户提示
- 网络断开时的友好提示
- LLM API Key 缺失 / 无效 / 余额不足的具体错误提示
- 全局 ErrorBoundary 优化

#### 3.3.5 Render 部署准备

- 确认 `render.yaml` 配置正确
- 确认 `buildCommand` 和 `startCommand` 正确
- 确认环境变量配置完整
- 确认健康检查路径 `/api/health` 正常工作
- 确认静态资源路径配置正确（前端构建产物 `dist/` 目录）

### 3.4 部署到 Render 步骤

#### 前置准备

1. 确保代码已推送到 GitHub 仓库的 `main` 分支
2. 注册 Render 账号（render.com）

#### 部署步骤

1. 在 Render Dashboard 选择 **Blueprints** → **New Blueprint Instance**
2. 连接 GitHub 仓库，选择本项目
3. Render 会自动读取 `render.yaml`，创建：
   - Web Service（Node.js）
   - PostgreSQL 数据库
4. 等待部署完成（首次部署约 5-10 分钟）
5. 访问分配的域名（如 `https://lingban-xxx.onrender.com`）验证

#### 后续部署

每次将代码推送到 `main` 分支后，Render 会自动触发重新部署：

```bash
git add .
git commit -m "描述你的修改"
git push origin main
```

### 3.5 验收标准

- [ ] `pnpm lint` 无错误
-# 灵伴 AI 好友 - 三阶段开发文档

> 版本：v1.0
> 当前状态：第一阶段核心代码已完成，待完善与部署
> 部署目标：Render
> 代码分支：main（默认分支）

---

## 0. 文档说明

本文档是「灵伴 AI 好友」项目的开发路线图，按三个阶段递进式推进：

- **第一阶段**：完善核心链路 + 成功部署到 Render
- **第二阶段**：深化 AI 好友感 + 打磨用户体验
- **第三阶段**：接入微信 + 跨端互通

每个阶段都有明确的目标、任务清单和验收标准，阶段结束时 `main` 分支上的代码都应能成功部署到 Render。

### Git 工作流约定

> **重要：所有开发和修改都直接在 `main` 分支上进行，每次完成后推送到远程 `main` 分支。**

```bash
# 查看当前状态
git status

# 添加修改
git add .

# 提交（使用有意义的提交信息）
git commit -m "feat: 添加 xxx 功能"
git commit -m "fix: 修复 xxx 问题"
git commit -m "refactor: 重构 xxx 模块"

# 推送到远程 main 分支
git push origin main
```

Render 会自动监听 `main` 分支的推送，触发自动部署。

---

## 1. 项目总览

### 1.1 产品定位

「灵伴」是一个 **AI 好友 / 角色陪伴** 应用。每个智能体都像用户拥有的一位虚拟朋友：有鲜明性格、背景、说话方式，会主动关心用户、找话题聊天。用户无需注册即可匿名使用，可创建多个不同性格的 AI 好友。

### 1.2 技术栈

| 层 | 选型 | 说明 |
|---|---|---|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS + Zustand + React Router | 移动端优先，单页应用 |
| 后端 | Express 4 + TypeScript（ESM） | REST + SSE 流式 |
| 数据库 | PostgreSQL + Prisma ORM v7 | |
| LLM | OpenAI 兼容格式 | 支持 OpenAI / DeepSeek / 自定义端点 |
| 部署 | Render Blueprint | Web Service + PostgreSQL |

### 1.3 当前项目结构

```text
/workspace
├── src/               # React 前端
│   ├── components/    # 通用组件
│   ├── pages/         # 页面
│   ├── store/         # Zustand 状态
│   ├── lib/           # API 封装、工具函数
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── api/               # Express 后端
│   ├── routes/        # 业务路由
│   ├── middleware/    # 鉴权
│   ├── lib/           # prisma、llm 适配器
│   ├── types/         # 类型声明
│   ├── app.ts
│   └── server.ts
├── prisma/            # Schema 与迁移
├── public/            # 静态资源
├── scripts/           # 维护脚本
├── render.yaml        # Render Blueprint 配置
└── package.json
```

---

## 2. 总体路线图

| 阶段 | 核心目标 | 产出标准 |
|---|---|---|
| **第一阶段** | 核心链路完善 + 稳定部署 | 修复问题、完善功能、Render 部署成功并可用 |
| **第二阶段** | AI 好友感 + 体验打磨 | 长期记忆、主动开口、角色一致、UI 顺滑 |
| **第三阶段** | 接入微信 | 微信内可多轮对话，跨端历史与记忆互通 |

---

## 3. 第一阶段：核心链路完善与部署上线

### 3.1 目标

基于现有代码，修复问题、完善功能、确保「匿名登录 → 创建 AI 好友 → 流式聊天」主链路完整可用，并成功部署到 Render 生产环境。

### 3.2 当前已实现

- ✅ 工程骨架：前后端分离、TypeScript、Vite、Tailwind CSS
- ✅ 数据库模型：User、Agent、ChatMessage 三张核心表
- ✅ 后端路由：auth、agents、chat、upload
- ✅ LLM 适配层：OpenAI 兼容格式，支持流式（SSE）
- ✅ 前端页面：AgentsPage、AgentEditPage、ChatPage、ProfilePage
- ✅ 状态管理：auth、agents、chat、theme、toast
- ✅ 通用组件：Avatar、BottomNav、GlassCard、Modal、Toast、EmptyState、ErrorBoundary
- ✅ 智能体模板：预设模板一键填充
- ✅ 双主题：极光 / 七彩
- ✅ Render Blueprint 配置：`render.yaml`

### 3.3 待完善任务

#### 3.3.1 代码质量检查与修复

- 运行 `pnpm lint`，修复所有 ESLint 错误和警告
- 运行 `pnpm check`，确保 TypeScript 类型检查通过
- 运行 `pnpm build`，确保生产构建成功
- 检查 Prisma schema 与生成路径是否正确（`output` 指向 `../src/generated/prisma`）

#### 3.3.2 核心功能验证与修复

- **开场白功能**：验证进入聊天页时智能体是否自动发送问候
- **流式对话**：验证 SSE 流式渲染是否正常，中断处理是否完善
- **重新生成**：验证重新生成最后一条消息功能
- **清空对话**：验证清空后历史记录是否正确删除
- **头像上传**：验证头像上传和显示是否正常
- **模板功能**：验证预设模板是否正确填充表单
- **主题切换**：验证极光 / 七彩主题切换是否正常

#### 3.3.3 移动端适配优化

- iOS 键盘弹出时输入框位置调整
- 底部安全区适配
- 触控目标大小检查
- 移动端浏览器兼容性测试

#### 3.3.4 错误处理完善

- 所有 API 请求错误有明确的用户提示
- 网络断开时的友好提示
- LLM API Key 缺失 / 无效 / 余额不足的具体错误提示
- 全局 ErrorBoundary 优化

#### 3.3.5 Render 部署准备

- 确认 `render.yaml` 配置正确
- 确认 `buildCommand` 和 `startCommand` 正确
- 确认环境变量配置完整
- 确认健康检查路径 `/api/health` 正常工作
- 确认静态资源路径配置正确（前端构建产物 `dist/` 目录）

### 3.4 部署到 Render 步骤

#### 前置准备

1. 确保代码已推送到 GitHub 仓库的 `main` 分支
2. 注册 Render 账号（render.com）

#### 部署步骤

1. 在 Render Dashboard 选择 **Blueprints** → **New Blueprint Instance**
2. 连接 GitHub 仓库，选择本项目
3. Render 会自动读取 `render.yaml`，创建：
   - Web Service（Node.js）
   - PostgreSQL 数据库
4. 等待部署完成（首次部署约 5-10 分钟）
5. 访问分配的域名（如 `https://lingban-xxx.onrender.com`）验证

#### 后续部署

每次将代码推送到 `main` 分支后，Render 会自动触发重新部署：

```bash
git add .
git commit -m "描述你的修改"
git push origin main
```

### 3.5 验收标准

- [ ] `pnpm lint` 无错误
- [ ] `pnpm check` 无类型错误
- [ ] `pnpm build`# 灵伴 AI 好友 - 三阶段开发文档

> 版本：v1.0
> 当前状态：第一阶段核心代码已完成，待完善与部署
> 部署目标：Render
> 代码分支：main（默认分支）

---

## 0. 文档说明

本文档是「灵伴 AI 好友」项目的开发路线图，按三个阶段递进式推进：

- **第一阶段**：完善核心链路 + 成功部署到 Render
- **第二阶段**：深化 AI 好友感 + 打磨用户体验
- **第三阶段**：接入微信 + 跨端互通

每个阶段都有明确的目标、任务清单和验收标准，阶段结束时 `main` 分支上的代码都应能成功部署到 Render。

### Git 工作流约定

> **重要：所有开发和修改都直接在 `main` 分支上进行，每次完成后推送到远程 `main` 分支。**

```bash
# 查看当前状态
git status

# 添加修改
git add .

# 提交（使用有意义的提交信息）
git commit -m "feat: 添加 xxx 功能"
git commit -m "fix: 修复 xxx 问题"
git commit -m "refactor: 重构 xxx 模块"

# 推送到远程 main 分支
git push origin main
```

Render 会自动监听 `main` 分支的推送，触发自动部署。

---

## 1. 项目总览

### 1.1 产品定位

「灵伴」是一个 **AI 好友 / 角色陪伴** 应用。每个智能体都像用户拥有的一位虚拟朋友：有鲜明性格、背景、说话方式，会主动关心用户、找话题聊天。用户无需注册即可匿名使用，可创建多个不同性格的 AI 好友。

### 1.2 技术栈

| 层 | 选型 | 说明 |
|---|---|---|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS + Zustand + React Router | 移动端优先，单页应用 |
| 后端 | Express 4 + TypeScript（ESM） | REST + SSE 流式 |
| 数据库 | PostgreSQL + Prisma ORM v7 | |
| LLM | OpenAI 兼容格式 | 支持 OpenAI / DeepSeek / 自定义端点 |
| 部署 | Render Blueprint | Web Service + PostgreSQL |

### 1.3 当前项目结构

```text
/workspace
├── src/               # React 前端
│   ├── components/    # 通用组件
│   ├── pages/         # 页面
│   ├── store/         # Zustand 状态
│   ├── lib/           # API 封装、工具函数
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── api/               # Express 后端
│   ├── routes/        # 业务路由
│   ├── middleware/    # 鉴权
│   ├── lib/           # prisma、llm 适配器
│   ├── types/         # 类型声明
│   ├── app.ts
│   └── server.ts
├── prisma/            # Schema 与迁移
├── public/            # 静态资源
├── scripts/           # 维护脚本
├── render.yaml        # Render Blueprint 配置
└── package.json
```

---

## 2. 总体路线图

| 阶段 | 核心目标 | 产出标准 |
|---|---|---|
| **第一阶段** | 核心链路完善 + 稳定部署 | 修复问题、完善功能、Render 部署成功并可用 |
| **第二阶段** | AI 好友感 + 体验打磨 | 长期记忆、主动开口、角色一致、UI 顺滑 |
| **第三阶段** | 接入微信 | 微信内可多轮对话，跨端历史与记忆互通 |

---

## 3. 第一阶段：核心链路完善与部署上线

### 3.1 目标

基于现有代码，修复问题、完善功能、确保「匿名登录 → 创建 AI 好友 → 流式聊天」主链路完整可用，并成功部署到 Render 生产环境。

### 3.2 当前已实现

- ✅ 工程骨架：前后端分离、TypeScript、Vite、Tailwind CSS
- ✅ 数据库模型：User、Agent、ChatMessage 三张核心表
- ✅ 后端路由：auth、agents、chat、upload
- ✅ LLM 适配层：OpenAI 兼容格式，支持流式（SSE）
- ✅ 前端页面：AgentsPage、AgentEditPage、ChatPage、ProfilePage
- ✅ 状态管理：auth、agents、chat、theme、toast
- ✅ 通用组件：Avatar、BottomNav、GlassCard、Modal、Toast、EmptyState、ErrorBoundary
- ✅ 智能体模板：预设模板一键填充
- ✅ 双主题：极光 / 七彩
- ✅ Render Blueprint 配置：`render.yaml`

### 3.3 待完善任务

#### 3.3.1 代码质量检查与修复

- 运行 `pnpm lint`，修复所有 ESLint 错误和警告
- 运行 `pnpm check`，确保 TypeScript 类型检查通过
- 运行 `pnpm build`，确保生产构建成功
- 检查 Prisma schema 与生成路径是否正确（`output` 指向 `../src/generated/prisma`）

#### 3.3.2 核心功能验证与修复

- **开场白功能**：验证进入聊天页时智能体是否自动发送问候
- **流式对话**：验证 SSE 流式渲染是否正常，中断处理是否完善
- **重新生成**：验证重新生成最后一条消息功能
- **清空对话**：验证清空后历史记录是否正确删除
- **头像上传**：验证头像上传和显示是否正常
- **模板功能**：验证预设模板是否正确填充表单
- **主题切换**：验证极光 / 七彩主题切换是否正常

#### 3.3.3 移动端适配优化

- iOS 键盘弹出时输入框位置调整
- 底部安全区适配
- 触控目标大小检查
- 移动端浏览器兼容性测试

#### 3.3.4 错误处理完善

- 所有 API 请求错误有明确的用户提示
- 网络断开时的友好提示
- LLM API Key 缺失 / 无效 / 余额不足的具体错误提示
- 全局 ErrorBoundary 优化

#### 3.3.5 Render 部署准备

- 确认 `render.yaml` 配置正确
- 确认 `buildCommand` 和 `startCommand` 正确
- 确认环境变量配置完整
- 确认健康检查路径 `/api/health` 正常工作
- 确认静态资源路径配置正确（前端构建产物 `dist/` 目录）

### 3.4 部署到 Render 步骤

#### 前置准备

1. 确保代码已推送到 GitHub 仓库的 `main` 分支
2. 注册 Render 账号（render.com）

#### 部署步骤

1. 在 Render Dashboard 选择 **Blueprints** → **New Blueprint Instance**
2. 连接 GitHub 仓库，选择本项目
3. Render 会自动读取 `render.yaml`，创建：
   - Web Service（Node.js）
   - PostgreSQL 数据库
4. 等待部署完成（首次部署约 5-10 分钟）
5. 访问分配的域名（如 `https://lingban-xxx.onrender.com`）验证

#### 后续部署

每次将代码推送到 `main` 分支后，Render 会自动触发重新部署：

```bash
git add .
git commit -m "描述你的修改"
git push origin main
```

### 3.5 验收标准

- [ ] `pnpm lint` 无错误
- [ ] `pnpm check` 无类型错误
- [ ] `pnpm build` 构建成功
- [ ] `pnpm dev` 可正常启动前后端，本地