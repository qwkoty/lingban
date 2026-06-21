# TurtleCode（乌龟码）开发文档

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 按阶段任务逐项实现。

**Goal:** 将现有「灵伴」AI 智能体应用重构为 TurtleCode（乌龟码）——一款以 DeepSeek 为核心模型、聊天驱动、具备 Agent 自动编程与插件生态的 AI Agent 编程平台。

**Architecture:** 保留现有 Express + React + Vite + PostgreSQL + Prisma 的单体架构，新增 Agent 编排层（Job Queue + WebSocket 事件流）、DeepSeek 专用缓存与 Token 统计层、文件/GitHub 操作层、插件运行时层。前端按「聊天最大、代码次之、文件最小」原则重新设计为 Settings / Workspace / Skills 三大页面。

**Tech Stack:** React 18 + TypeScript + Vite + Tailwind CSS + Zustand + shadcn/ui（新增）+ Monaco Editor（新增）+ Framer Motion（新增）；Express 4 + TypeScript ESM + Prisma + PostgreSQL；Redis（新增，缓存/语义缓存/WebSocket 状态）；DeepSeek API；GitHub API；WebSocket；Render 部署。

---

## 1. 项目概述

TurtleCode 的核心不是代码编辑器，而是 AI Agent。用户通过自然语言与小乌龟对话，完成从需求理解、项目分析、代码生成、文件修改、调试到 GitHub 同步的完整开发流程。

**必须实现的产品能力：**

- 仅支持 DeepSeek 模型：V4 Flash（日常首选）与 V4 Pro（复杂任务）。
- 三页产品：Settings（API/缓存配置）、Workspace（AI 工作台）、Skills（技能中心）。
- Agent 模式：项目分析、代码生成、代码修改、Bug 修复、自动重构、文档/测试生成、任务执行。
- GitHub 集成：连接仓库、拉取/创建仓库、Commit、Push、Pull、分支管理、自动生成 Commit Message。
- DeepSeek 优化：Prompt 模板化、上下文压缩、Semantic Cache、Redis Cache、Agent Memory、Token/费用统计，目标缓存命中率 ≥ 90%。
- 插件生态：GitHub、Docker、Browser、Database、Linux Terminal、MCP、Figma、Deploy 等默认插件，支持安装/启用/配置/删除/更新。
- 小乌龟 IP 动态状态：待机、思考、编辑代码、调用插件、完成任务。

---

## 2. 现有基础

当前仓库为「灵伴」，已具备：

- 前端：React + Vite + Tailwind CSS + Zustand，页面包括 Agents、AgentEdit、Chat、Profile。
- 后端：Express 4 + TypeScript ESM，路由包含 `agents.ts`、`auth.ts`、`chat.ts`、`upload.ts`。
- 数据库：PostgreSQL + Prisma，已配置迁移。
- 部署：`render.yaml` 已配置 Web Service + PostgreSQL，健康检查 `/api/health`。
- 匿名登录、智能体管理、流式对话已存在，但面向通用聊天场景。

**需保留：** 用户会话、流式响应、数据库迁移、Render Blueprint 部署流程。

**需彻底重构：** 前端页面结构、Agent 数据模型、对话流程、新增文件/代码编辑/GitHub/插件能力。

---

## 3. 总体架构

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Vite)                       │
│  Settings Page  │  Workspace Page  │  Skills Page            │
│  - Model/API    │  - AI Chat 70%   │  - Installed skills     │
│  - Cache config │  - Agent zone 30%│  - Marketplace          │
└──────────────────────┬──────────────────────────────────────┘
                       │ WebSocket / HTTP
┌──────────────────────▼──────────────────────────────────────┐
│                      Backend (Express)                       │
│  /api/settings  /api/chat  /api/agent/jobs  /api/skills      │
│  /api/github  /api/files  /api/projects  /api/cache          │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┬──────────────┐
        ▼              ▼              ▼              ▼
   DeepSeek API    GitHub API    Redis Cache    PostgreSQL
   (V4 Flash/Pro)  (OAuth)       (Semantic +    (Prisma)
                                  Session)
```

---

## 4. 三个阶段

### Phase 1：品牌重塑 + Settings + Workspace 基础

**目标：** 完成品牌切换、三页导航、Settings 全功能、Workspace 基础布局与 DeepSeek 流式对话，让用户能与小乌龟聊天并看到 Agent 状态。

#### 任务 1.1：品牌与样式系统

**Files:**
- Modify: `index.html`（标题、描述、favicon）
- Modify: `public/favicon.svg`（小乌龟 IP SVG）
- Create: `src/styles/turtle-theme.css`
- Modify: `tailwind.config.js`
- Modify: `src/App.tsx`
- Modify: `src/components/BottomNav.tsx`

**内容：**

- 颜色系统：主色 `#2563EB`、辅助 `#3B82F6`、强调 `#06B6D4`、高亮 `#22D3EE`、深蓝黑渐变背景。
- 字体与圆角：统一 `rounded-2xl` / `rounded-3xl`，毛玻璃 `backdrop-blur-xl`。
- 页面切换动画使用 Framer Motion 淡入。
- 底部导航改为三个入口：Settings / Workspace / Skills。
- 动态小乌龟组件：创建 `src/components/TurtleMascot.tsx`，根据状态显示不同 Lottie/SVG 动画（待机、思考、编辑代码、完成任务）。

#### 任务 1.2：Settings 页面

**Files:**
- Create: `src/pages/SettingsPage.tsx`
- Create: `src/components/settings/ModelSelector.tsx`
- Create: `src/components/settings/ApiKeyInput.tsx`
- Create: `src/components/settings/CacheSettings.tsx`
- Create: `src/components/settings/ConnectionTester.tsx`
- Create: `src/store/settings.ts`
- Create: `api/routes/settings.ts`
- Modify: `prisma/schema.prisma`

**内容：**

- 模型选择：DeepSeek V4 Flash / DeepSeek V4 Pro。
- API Key 输入框，支持显示/隐藏，调用 DeepSeek `/models` 或简单 `/chat/completions` 测试连接。
- 缓存配置开关：启用缓存、启用语义缓存、启用上下文压缩。
- 实时显示：缓存命中率、Token 节省、费用节省（先读取内存/Redis 统计，后续接入真实数据）。
- 右上角显示动态小乌龟状态动画。
- Prisma 新增 `Setting` 模型：

```prisma
model Setting {
  id              String   @id @default(cuid())
  userId          String   @unique
  deepseekKey     String?
  model           String   @default("deepseek-v4-flash")
  cacheEnabled    Boolean  @default(true)
  semanticCache   Boolean  @default(true)
  contextCompress Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

#### 任务 1.3：Workspace 页面布局

**Files:**
- Create: `src/pages/WorkspacePage.tsx`
- Create: `src/components/workspace/ChatPanel.tsx`
- Create: `src/components/workspace/AgentPanel.tsx`
- Create: `src/components/workspace/InputBar.tsx`
- Create: `src/components/workspace/StatusBar.tsx`
- Create: `src/components/workspace/MessageBubble.tsx`
- Modify: `src/App.tsx`

**内容：**

- 布局：左侧 70% AI 聊天区，右侧 30% Agent 工作区，底部状态栏。
- 顶部显示 TurtleCode Logo、当前模型、当前项目名。
- 聊天区支持：文字、代码块、文件附件、图片（图片先支持上传与展示，后续接入多模态模型）。
- 输入框底部实时显示：当前输入 Token、当前输出 Token、总 Token、预计费用、缓存命中率。
- 右侧 Agent 区显示：当前编辑文件路径、文件修改过程（Diff 占位）、Agent 状态（思考中/编辑中/运行中/完成）。
- 底部状态栏：当前模型、Token 消耗、缓存命中率、GitHub 状态、Agent 状态。

#### 任务 1.4：DeepSeek 流式对话

**Files:**
- Modify: `api/routes/chat.ts`
- Create: `api/lib/deepseek.ts`
- Create: `api/lib/tokenizer.ts`
- Modify: `src/store/chat.ts`
- Create: `src/lib/streaming.ts`

**内容：**

- 封装 DeepSeek 客户端，支持 `deepseek-chat` 映射到 V4 Flash、`deepseek-reasoner` 映射到 V4 Pro（根据 DeepSeek 2025 实际模型名调整）。
- 服务端使用 OpenAI 兼容格式调用 DeepSeek API，流式返回 SSE。
- Token 统计：输入/输出 Token 实时计算（可先用简单字符估算，后续接入 tiktoken 或 DeepSeek 返回的 usage）。
- 前端解析 SSE 流并逐字渲染。
- 费用统计：按 DeepSeek 官方定价计算每次对话费用并累加。

#### 任务 1.5：Agent 状态机与 WebSocket

**Files:**
- Create: `api/lib/agent/AgentState.ts`
- Create: `api/lib/agent/JobQueue.ts`
- Create: `api/routes/agent.ts`
- Create: `api/websocket.ts`
- Modify: `api/server.ts`
- Create: `src/hooks/useAgentSocket.ts`

**内容：**

- WebSocket 服务器接入 Express，命名空间 `/agent`。
- Agent 状态枚举：`idle`、`thinking`、`editing`、`running`、`completed`、`error`。
- 服务端 Job Queue（内存版，Phase 2 升级为 Redis/BullMQ），每个用户任务一个 Job。
- 前端订阅 Agent 状态更新，在聊天气泡和右侧 Agent 区同步显示。

#### Phase 1 验收标准

- [ ] 打开应用显示 TurtleCode 品牌与三页导航。
- [ ] Settings 可保存模型、API Key、缓存配置。
- [ ] Workspace 聊天能流式接收 DeepSeek 回复，输入框显示实时 Token/费用。
- [ ] 小乌龟状态动画在待机、思考、完成间切换。
- [ ] Render 部署正常，`/api/health` 通过。

---

### Phase 2：Agent 引擎 + 文件/GitHub 操作 + DeepSeek 优化

**目标：** 让小乌龟真正能动代码：分析项目、创建/修改文件、生成 Diff、提交 GitHub，同时实现 DeepSeek 缓存优化与费用统计。

#### 任务 2.1：项目上下文分析

**Files:**
- Create: `api/lib/project/ProjectContext.ts`
- Create: `api/lib/project/fileTree.ts`
- Create: `api/routes/projects.ts`
- Create: `src/components/workspace/ProjectSelector.tsx`

**内容：**

- 扫描后端工作目录（`/workspace` 或用户指定路径），生成文件树。
- 按规则忽略：`node_modules`、`.git`、`dist`、`*.log`、`.env`。
- 对代码文件做轻量摘要（文件路径 + 前 50 行 + 导出符号列表）。
- 将项目上下文注入 DeepSeek Prompt，让模型知道当前代码库结构。

#### 任务 2.2：文件操作与代码编辑

**Files:**
- Create: `api/lib/files/FileManager.ts`
- Create: `api/lib/files/DiffEngine.ts`
- Create: `api/routes/files.ts`
- Create: `src/components/workspace/FileEditor.tsx`
- Create: `src/components/workspace/DiffViewer.tsx`
- Modify: `src/components/workspace/AgentPanel.tsx`

**内容：**

- 支持读取、写入、创建、删除文件，所有写操作先进入暂存区 `/.turtle/staging`。
- 生成统一 Diff 格式，右侧 Agent 区显示新增/删除行。
- 代码编辑器使用 Monaco Editor 嵌入 `FileEditor.tsx`。
- Agent 编辑文件时广播事件：`file:read`、`file:write`、`file:diff`。

#### 任务 2.3：Agent 编排引擎

**Files:**
- Create: `api/lib/agent/AgentOrchestrator.ts`
- Create: `api/lib/agent/prompts.ts`
- Create: `api/lib/agent/tools.ts`
- Create: `api/lib/agent/ToolExecutor.ts`
- Modify: `api/routes/chat.ts`

**内容：**

- 将用户消息交给 Agent Orchestrator，根据意图选择模式：`chat`、`analyze`、`generate`、`modify`、`fix`、`refactor`、`test`、`doc`。
- 工具列表：`read_file`、`write_file`、`apply_diff`、`run_command`、`search_code`、`github_*`。
- 工具调用结果回注对话上下文，形成 ReAct 循环。
- Prompt 模板化：系统 Prompt、项目上下文、工具描述、用户任务、输出格式分离管理。

#### 任务 2.4：GitHub 集成

**Files:**
- Create: `api/lib/github/GitHubClient.ts`
- Create: `api/lib/github/RepoManager.ts`
- Create: `api/routes/github.ts`
- Create: `src/components/github/GitHubConnect.tsx`
- Create: `src/components/github/BranchManager.tsx`
- Create: `src/components/github/CommitPanel.tsx`
- Modify: `prisma/schema.prisma`

**内容：**

- GitHub OAuth 或 Personal Access Token 连接。
- 支持：列出仓库、Clone/Pull、创建仓库、创建分支、Commit、Push。
- 自动生成 Commit Message：将暂存区 Diff 交给 DeepSeek 生成 Conventional Commit 消息。
- Prisma 新增模型：

```prisma
model GitHubConnection {
  id        String   @id @default(cuid())
  userId    String   @unique
  token     String
  username  String
  repoUrl   String?
  branch    String   @default("main")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

#### 任务 2.5：DeepSeek 优化层

**Files:**
- Create: `api/lib/cache/RedisClient.ts`
- Create: `api/lib/cache/SemanticCache.ts`
- Create: `api/lib/cache/ContextCompressor.ts`
- Create: `api/lib/cache/PromptTemplate.ts`
- Create: `api/lib/cache/TokenCounter.ts`
- Create: `api/lib/cache/CostTracker.ts`
- Create: `api/routes/cache.ts`
- Modify: `api/lib/deepseek.ts`

**内容：**

- Redis 连接（开发可用内存版，生产连接 Render Redis 或 Upstash）。
- Prompt 模板化：将系统提示、项目摘要、历史对话模板化并缓存哈希。
- Semantic Cache：对 Embeddings 相似请求返回缓存结果（先用简单向量距离，后续接入 Embedding 模型）。
- Context Compressor：当对话超过模型上下文阈值时，对历史消息做摘要压缩。
- Token 统计：精确统计每次请求输入/输出 Token，累计用户/项目/模型维度。
- 费用统计：按模型定价计算并展示节省费用（命中缓存时费用为 0）。
- 目标：缓存命中率 ≥ 90%（通过 Prompt 模板化 + 语义缓存 + Agent Memory 共同达成）。

#### 任务 2.6：Agent Memory

**Files:**
- Create: `api/lib/agent/AgentMemory.ts`
- Modify: `prisma/schema.prisma`

**内容：**

- 长期记忆：项目偏好、用户习惯、常见错误模式、已确认决策。
- 短期记忆：当前任务上下文、已编辑文件列表、待确认 Diff。
- Prisma 新增 `AgentMemory` 模型，按项目/用户维度存储关键记忆片段。

#### Phase 2 验收标准

- [ ] 用户输入「修复支付接口」，Agent 能分析项目、定位文件、生成 Diff 并展示。
- [ ] 用户可连接 GitHub 并自动 Commit/Push 代码。
- [ ] DeepSeek 请求命中缓存时响应明显更快，缓存命中率仪表板可查看。
- [ ] Token/费用统计准确，按对话和项目汇总。
- [ ] 所有文件写操作经过暂存区，支持 Diff 确认。

---

### Phase 3：Skills 中心 + 插件生态

**目标：** 实现 Skills 页面，建立插件架构，内置 8 大默认插件，支持安装、启用、配置与市场扩展。

#### 任务 3.1：插件架构

**Files:**
- Create: `api/lib/skills/SkillRegistry.ts`
- Create: `api/lib/skills/SkillRuntime.ts`
- Create: `api/lib/skills/SkillManifest.ts`
- Create: `api/routes/skills.ts`
- Create: `src/types/skill.ts`

**内容：**

- 插件清单 `manifest.json` 规范：id、name、version、description、category、entry、configSchema、permissions、tools。
- 插件运行时隔离：每个插件暴露 `tools` 和 `handlers`，由 Agent 调用。
- 插件安装方式：本地内置、npm 包、GitHub URL、Marketplace API。
- 权限模型：文件、网络、命令、GitHub、Docker 等权限需用户授权。

#### 任务 3.2：内置默认插件

**Files:**
- Create: `skills/github/index.ts`
- Create: `skills/docker/index.ts`
- Create: `skills/browser/index.ts`
- Create: `skills/database/index.ts`
- Create: `skills/linux/index.ts`
- Create: `skills/mcp/index.ts`
- Create: `skills/figma/index.ts`
- Create: `skills/deploy/index.ts`

**内容：**

| 插件 | 能力 |
|------|------|
| GitHub | 仓库管理、代码同步、Commit、分支、PR |
| Docker | 容器管理、镜像构建、部署项目 |
| Browser | 网页访问、网页分析、网页抓取 |
| Database | MySQL / PostgreSQL / SQLite / Redis 连接与查询 |
| Linux Terminal | 命令执行、日志查看、进程管理 |
| MCP | 兼容 Model Context Protocol，扩展 Agent 能力 |
| Figma | 读取设计稿、生成页面、组件转换 |
| Deploy | 部署到 Render / Vercel / Netlify / Cloudflare |

- 每个插件实现 `manifest.json` + `tools.ts` + `handlers.ts` + `config.tsx`（前端配置界面）。

#### 任务 3.3：Skills 页面

**Files:**
- Create: `src/pages/SkillsPage.tsx`
- Create: `src/components/skills/InstalledSkills.tsx`
- Create: `src/components/skills/SkillMarketplace.tsx`
- Create: `src/components/skills/SkillCard.tsx`
- Create: `src/components/skills/SkillConfigModal.tsx`
- Modify: `src/components/BottomNav.tsx`

**内容：**

- 左侧「我的技能」：已安装插件列表，支持启用/禁用/配置/删除/更新。
- 右侧「插件市场」：卡片式布局，显示图标、名称、简介、版本、安装按钮。
- 支持搜索、分类筛选（开发工具、数据库、部署工具、设计工具、浏览器工具、Agent 工具、MCP 工具）、排序。
- 点击插件进入配置界面：GitHub Token、Docker 服务器地址、数据库连接串等。

#### 任务 3.4：插件与 Agent 联动

**Files:**
- Modify: `api/lib/agent/ToolExecutor.ts`
- Modify: `api/lib/agent/prompts.ts`
- Modify: `api/lib/agent/AgentOrchestrator.ts`

**内容：**

- Agent 根据用户任务自动判断调用哪些插件工具。
- 插件启用后，其工具描述自动注入系统 Prompt。
- 调用插件时，小乌龟背部显示对应技能图标动画。

#### 任务 3.5：小乌龟 IP 完整动画

**Files:**
- Modify: `src/components/TurtleMascot.tsx`
- Create: `src/components/TurtleMascot.module.css`

**内容：**

- 待机：缓慢爬行。
- 思考：探头观察。
- 生成代码：戴工程师头盔敲代码。
- 调用插件：背部出现对应技能图标（GitHub / Docker / Browser 等）。
- 完成任务：开心挥手，显示「任务完成 ✓」。
- 使用 Framer Motion + CSS 动画实现，避免重型 Lottie 依赖。

#### 任务 3.6：部署与监控

**Files:**
- Modify: `render.yaml`
- Create: `api/routes/health.ts`
- Create: `api/lib/monitoring/Logger.ts`

**内容：**

- `render.yaml` 增加 Redis 服务（Render Redis 或外部 Upstash）。
- 健康检查扩展：数据库、Redis、DeepSeek API 连通性。
- 日志统一输出，便于 Render Dashboard 查看。

#### Phase 3 验收标准

- [ ] Skills 页面可查看已安装插件与插件市场。
- [ ] 可安装、启用、配置、删除插件。
- [ ] Agent 能调用 Docker / Browser / Database 等插件完成复杂任务。
- [ ] 小乌龟在调用不同插件时显示对应背部图标动画。
- [ ] Render 生产部署稳定，所有默认插件至少可在本地/沙箱验证。

---

## 5. 数据模型演进

基于现有 Prisma schema，新增/调整以下模型：

```prisma
model User {
  id          String   @id @default(cuid())
  createdAt   DateTime @default(now())
  settings    Setting?
  github      GitHubConnection?
  memories    AgentMemory[]
  chats       Chat[]
  skills      UserSkill[]
}

model Setting {
  id              String   @id @default(cuid())
  userId          String   @unique
  user            User     @relation(fields: [userId], references: [id])
  deepseekKey     String?
  model           String   @default("deepseek-v4-flash")
  cacheEnabled    Boolean  @default(true)
  semanticCache   Boolean  @default(true)
  contextCompress Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model Chat {
  id        String    @id @default(cuid())
  userId    String
  user      User      @relation(fields: [userId], references: [id])
  title     String?
  project   String?
  messages  Message[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}

model Message {
  id        String   @id @default(cuid())
  chatId    String
  chat      Chat     @relation(fields: [chatId], references: [id], onDelete: Cascade)
  role      String
  content   String
  tokensIn  Int      @default(0)
  tokensOut Int      @default(0)
  cost      Float    @default(0)
  createdAt DateTime @default(now())
}

model GitHubConnection {
  id        String   @id @default(cuid())
  userId    String   @unique
  user      User     @relation(fields: [userId], references: [id])
  token     String
  username  String
  repoUrl   String?
  branch    String   @default("main")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model AgentMemory {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  project   String?
  key       String
  value     String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Skill {
  id          String      @id @default(cuid())
  key         String      @unique
  name        String
  version     String
  category    String
  description String
  icon        String?
  entry       String
  configSchema Json       @default("{}")
  permissions String[]
  users       UserSkill[]
}

model UserSkill {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  skillId   String
  skill     Skill    @relation(fields: [skillId], references: [id])
  enabled   Boolean  @default(false)
  config    Json     @default("{}")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([userId, skillId])
}
```

---

## 6. API 路由规划

| 路由 | 说明 |
|------|------|
| `GET /api/health` | 健康检查 |
| `POST /api/settings` | 保存设置 |
| `GET /api/settings` | 读取设置 |
| `POST /api/settings/test` | 测试 DeepSeek 连接 |
| `POST /api/chat` | 发送消息（SSE 流式） |
| `GET /api/chat/:id` | 获取聊天记录 |
| `POST /api/agent/jobs` | 创建 Agent 任务 |
| `GET /api/agent/jobs/:id` | 获取任务状态 |
| `POST /api/agent/jobs/:id/confirm` | 确认 Diff/操作 |
| `GET /api/projects` | 列出项目/文件树 |
| `GET /api/files/*` | 读取文件内容 |
| `POST /api/files/*` | 写入文件（暂存区） |
| `GET /api/files/diff/*` | 获取文件 Diff |
| `POST /api/github/connect` | 连接 GitHub |
| `GET /api/github/repos` | 列出仓库 |
| `POST /api/github/commit` | 自动 Commit |
| `POST /api/github/push` | Push 代码 |
| `GET /api/skills` | 已安装/可用插件 |
| `POST /api/skills/install` | 安装插件 |
| `POST /api/skills/:id/enable` | 启用插件 |
| `POST /api/skills/:id/config` | 配置插件 |
| `GET /api/cache/stats` | 缓存命中率/费用统计 |
| `WS /agent` | Agent 实时状态 |

---

## 7. Render 部署方案

项目已配置 `render.yaml`，只需扩展以下部分：

```yaml
services:
  - type: web
    name: turtlecode
    runtime: node
    plan: starter
    buildCommand: pnpm install --frozen-lockfile && pnpm run build
    startCommand: npx prisma generate && npx prisma migrate deploy && pnpm run start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 8000
      - key: DATABASE_URL
        fromDatabase:
          name: turtlecode-db
          property: connectionString
      - key: REDIS_URL
        fromService:
          type: redis
          name: turtlecode-redis
          property: connectionString
    healthCheckPath: /api/health

databases:
  - name: turtlecode-db
    plan: free
    region: singapore

redis:
  - name: turtlecode-redis
    plan: free
    region: singapore
```

**部署前准备：**

1. 在 Render Dashboard 通过 Blueprint 导入仓库。
2. 确认 `render.yaml` 中服务名与数据库名唯一。
3. 设置环境变量：`DEEPSEEK_API_KEY`（用于系统级测试，用户仍可在 Settings 中配置自己的 Key）、`GITHUB_CLIENT_ID`、`GITHUB_CLIENT_SECRET`（如走 OAuth）。
4. 构建命令会先执行 TypeScript 检查与 Prisma 生成，确保无类型错误。
5. 启动命令会自动应用数据库迁移。

**环境变量示例（.env.example 补充）：**

```bash
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
DEEPSEEK_API_KEY=sk-...
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
```

---

## 8. 测试策略

- **单元测试：** 使用 Vitest 测试 `api/lib/agent/*`、`api/lib/cache/*`、`api/lib/files/*` 中的纯函数。
- **集成测试：** 使用 Supertest 测试 API 路由，数据库使用 `prisma migrate deploy` 准备测试库。
- **端到端测试：** 使用 Playwright 验证 Settings / Workspace / Skills 三大页面核心流程。
- **Agent 测试：** 准备一组标准任务（如「创建一个 Todo API」），评估 Agent 完成率与代码正确性。

---

## 9. 里程碑与交付物

| 阶段 | 交付物 | 预计关键能力 |
|------|--------|--------------|
| Phase 1 | Settings + Workspace 基础 | 可聊天、可配置、可流式对话、小乌龟状态动画 |
| Phase 2 | Agent 引擎 + GitHub + 缓存优化 | 可自动改代码、可提交 GitHub、缓存命中率 ≥ 90% |
| Phase 3 | Skills 中心 + 8 大默认插件 | 可安装配置插件、Agent 可调用插件、完整市场 |

---

## 10. 后续优化方向

- 支持多项目工作区切换。
- 支持团队协作与权限管理。
- 引入更强大的 Embedding 模型做 Semantic Cache。
- 插件市场后端化，支持版本管理与自动更新。
- 移动端优化与 PWA。
