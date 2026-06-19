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
- **数据库**：SQLite + Prisma ORM
- **LLM 代理**：OpenAI 兼容格式，默认 DeepSeek

## 本地开发

```bash
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

## Render 部署

项目已配置 `render.yaml`，支持一键部署到 Render：

1. 将代码推送到 GitHub
2. 在 Render 创建 "Blueprint"，选择该仓库
3. Render 会自动读取 `render.yaml` 完成部署

部署完成后，访问 Render 生成的 URL 即可使用。

### 部署注意事项

- `prisma` 与 `tsx` 已放在 `dependencies` 中，确保 Render 生产环境安装时可用
- `startCommand` 已包含 `npx prisma generate && npx prisma migrate deploy`，每次启动都会生成 Prisma 客户端并应用迁移
- SQLite 数据库文件存储在 `prisma/dev.db`，Render 免费版文件系统会在重新部署后重置；如需持久化数据，请考虑使用 Render PostgreSQL 或外部数据库

## 环境变量

复制 `.env.example` 为 `.env` 并根据需要修改：

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `DATABASE_URL` | SQLite 数据库文件路径 | `file:./prisma/dev.db` |
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
├── prisma/             # Prisma  schema 与迁移
├── public/             # 静态资源
├── src/                # React 前端
│   ├── pages/          # 页面组件
│   ├── components/     # 通用组件
│   ├── store/          # Zustand 状态管理
│   └── lib/api.ts      # API 请求封装
├── render.yaml         # Render 部署配置
└── vite.config.ts      # Vite 配置
```

## 许可证

MIT
