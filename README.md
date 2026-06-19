# 灵伴 - AI 智能体应用

纯网页端 AI 智能体应用，支持匿名登录、自定义智能体、多轮对话与历史记录持久化。

## 功能特性

- 匿名登录：首次访问自动创建用户
- 智能体管理：创建、编辑、删除智能体，配置头像/人设/模型/API Key
- 多轮对话：选择智能体进行流式对话，历史记录自动保存
- 移动端优先：极光渐变 + 毛玻璃拟态设计

## 技术栈

- 前端：React 18 + TypeScript + Vite + Tailwind CSS + Zustand
- 后端：Express 4 + TypeScript（ESM）
- 数据库：PostgreSQL + Prisma ORM
- LLM：OpenAI 兼容格式，用户自填 API Key

## 本地开发

```bash
# 复制环境变量
cp .env.example .env

# 安装依赖
pnpm install

# 生成 Prisma 客户端并应用迁移
npx prisma generate
npx prisma migrate deploy

# 启动开发服务器
pnpm run dev
```

前端运行在 `http://localhost:5173`，后端 API 代理到 `http://localhost:3001`。

## 生产构建

```bash
pnpm run build
NODE_ENV=production pnpm run start
```

生产模式下 Express 同时提供 API 与前端静态文件（`dist/`）。

## Render 部署

项目已配置 `render.yaml`，在 Render Dashboard 中使用 Blueprint 导入即可自动创建 Web Service + PostgreSQL。

部署参数：

- 构建命令：`pnpm install --frozen-lockfile && pnpm run build`
- 启动命令：`npx prisma generate && npx prisma migrate deploy && pnpm run start`
- 监听端口：`8000`
- 健康检查：`/api/health`
