# 灵伴 - AI 智能体应用

一个纯网页端的 AI 智能体应用，支持匿名登录、自定义智能体、多轮对话与历史记录持久化。

## 功能特性

- **匿名登录**：首次访问自动创建用户，无需注册
- **智能体管理**：创建、编辑、删除智能体，配置头像/人设/模型/API Key
- **多轮对话**：选择智能体进行流式对话，历史记录自动保存
- **移动端优先**：极光渐变 + 毛玻璃拟态设计，底部悬浮导航

## 技术栈

- **前端**：React 18 + TypeScript + Vite + Tailwind CSS + Zustand
- **后端**：Express 4 + TypeScript（ESM）
- **数据库**：PostgreSQL + Prisma ORM
- **LLM 代理**：OpenAI 兼容格式，默认 DeepSeek

## 本地开发

### 前置条件

- Node.js 22.x
- pnpm 10.x
- 本地 PostgreSQL（或用 Docker 启动）

```bash
# 启动本地 PostgreSQL（可选）
docker run -d --name lingban-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=lingban \
  -p 5432:5432 postgres:16

# 复制环境变量并修改
cp .env.example .env

# 安装依赖
pnpm install

# 生成 Prisma 客户端
npx prisma generate

# 应用数据库迁移
npx prisma migrate deploy

# 启动开发服务器（同时运行前端 + 后端）
pnpm run dev
```

前端默认运行在 `http://localhost:5173`，后端 API 代理到 `http://localhost:3001`。

## 生产构建

```bash
# 构建前端
pnpm run build

# 启动生产服务器
NODE_ENV=production pnpm run start
```

生产模式下，Express 会同时提供 API 与前端静态文件（`dist/`）。

## Koyeb 部署

项目已配置 `.github/workflows/koyeb.yaml`，使用 GitHub Actions 自动部署到 Koyeb：

1. 在 Koyeb 控制台创建 **Database Service**（PostgreSQL），记下连接字符串
2. 在 GitHub 仓库设置中添加两个 Secrets：
   - `KOYEB_API_TOKEN`：从 [Koyeb API 设置](https://app.koyeb.com/settings/api) 生成
   - `DATABASE_URL`：PostgreSQL 连接字符串
3. 将代码推送到 `main` 分支，GitHub Actions 会自动构建并部署
4. 部署完成后，访问 Koyeb 生成的 `*.koyeb.app` 地址即可使用

部署参数：

- 构建命令：`pnpm install --frozen-lockfile && pnpm run build`
- 启动命令：`npx prisma generate && npx prisma migrate deploy && pnpm run start`
- 监听端口：`8000`
- 健康检查：`/api/health`

### 部署注意事项

- `prisma`、`tsx`、`@prisma/adapter-pg`、`pg` 等运行必需依赖已放在 `dependencies` 中
- 生产环境 Prisma 客户端会自动启用 SSL（`rejectUnauthorized: false`），适配 Koyeb 托管 PostgreSQL
- 首次部署前请确保 PostgreSQL 数据库已存在且连接字符串正确

## Render 部署（可选）

项目已配置 `render.yaml`，可一键部署到 Render：

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/qwkoty/lingban)

1. 点击上方 **Deploy to Render** 按钮
2. 登录 Render 账号并连接 GitHub
3. Render 会自动创建 Web Service + 免费 PostgreSQL + 环境变量并部署

> 如果之前已经手动创建过 `lingban` 服务，建议先在 Render 控制台删除旧服务，再用 Blueprint 部署，避免命名冲突。

## 环境变量

复制 `.env.example` 为 `.env` 并根据需要修改：

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `DATABASE_URL` | PostgreSQL 连接字符串 | `postgresql://postgres:postgres@localhost:5432/lingban?schema=public` |
| `NODE_ENV` | 运行环境 | `development` |
| `PORT` | 后端服务端口 | `3001` |

## 项目结构

```
.
├── api/                 # Express 后端
│   ├── app.ts          # Express 应用入口
│   ├── server.ts       # 服务器启动入口
│   ├── lib/prisma.ts   # Prisma 客户端
│   ├── middleware/     # 中间件
│   └── routes/         # API 路由
├── prisma/             # Prisma schema 与迁移
├── public/             # 静态资源
├── src/                # React 前端
│   ├── pages/          # 页面组件
│   ├── components/     # 通用组件
│   ├── store/          # Zustand 状态管理
│   └── lib/api.ts      # API 请求封装
├── .github/workflows/  # CI/CD 工作流
├── render.yaml         # Render 部署配置
└── vite.config.ts      # Vite 配置
```

## 许可证

MIT
