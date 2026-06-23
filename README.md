# 灵伴 - AI 好友

一个像 Character.AI 那样拥有鲜明性格、能主动开口、持续陪伴的 AI 好友应用。

## 技术栈

- 前端：Next.js 15 + TypeScript + Tailwind CSS + Zustand
- 后端：Next.js Route Handlers（Node.js Runtime）
- 数据库：PostgreSQL + Prisma ORM v7
- 部署：Render Blueprint

## 本地开发

```bash
# 安装依赖
pnpm install

# 配置环境变量
cp .env.example .env
# 编辑 .env，填入本地 PostgreSQL 连接字符串

# 生成 Prisma Client 并运行迁移
pnpm db:generate
pnpm db:migrate

# 启动开发服务器
pnpm dev
```

访问 http://localhost:3000

## 第一阶段特性

- 匿名登录，无需注册
- 创建多个 AI 好友
- AI 好友模板（知心好友、游戏搭子、学习伙伴等）
- 角色一致性：人设注入系统提示
- 多模型支持：DeepSeek / OpenAI / Anthropic / 自定义 OpenAI 兼容端点
- 流式对话、重新生成、清空对话、复制消息
- 自适应高度输入框，Enter 发送 / Shift+Enter 换行
- 全局 Toast 错误提示
- 极光 / 暗夜双主题
- Render Blueprint 部署配置

## 部署到 Render

项目已包含 `render.yaml`，使用 Render Blueprint 即可一键部署：

1. 将代码推送到 GitHub 的 main 分支。
2. 在 Render Dashboard 选择 **Blueprints** → **New Blueprint Instance**。
3. 选择仓库，Render 会自动读取 `render.yaml` 并创建 Web Service 和 PostgreSQL 数据库。
4. 部署完成后访问分配的域名即可。

**自动部署**：每次推送到 main 分支，Render 会自动触发部署。

## 常用命令

```bash
pnpm dev          # 开发模式
pnpm build        # 生产构建
pnpm start        # 生产启动
pnpm lint         # ESLint 检查
pnpm check        # TypeScript 类型检查
pnpm db:generate  # 生成 Prisma Client
pnpm db:migrate   # 创建并运行迁移（开发）
pnpm db:deploy    # 部署迁移（生产）
pnpm db:studio    # Prisma Studio 可视化数据库
```

## 项目结构

```
src/
├── app/              # Next.js App Router（页面 + API 路由）
├── components/       # 通用组件
├── lib/              # 工具库（prisma, llm, auth, api, utils）
├── store/            # Zustand 状态管理
├── types/            # 共享类型定义
└── styles/           # 全局样式
prisma/               # Prisma Schema 与迁移
```
