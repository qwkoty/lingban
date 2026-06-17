# 灵伴 (LingBan)

AI 智能体应用，支持创建自定义智能体并与多种大模型对话。

## 项目结构

- `apps/server` - 后端 API 服务（Node.js + Express + PostgreSQL）
- `apps/mobile` - 移动端 APP（React Native + Expo）

## 一键部署后端

点击下方按钮，使用 Render Blueprint 自动创建后端服务和 PostgreSQL 数据库：

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/qwkoty/lingban)

部署完成后，服务地址类似 `https://lingban-server.onrender.com`，把它填到 App「我的」→「服务器地址」里即可。

> 注意：免费 PostgreSQL 数据库 30 天后会自动过期删除，正式上线前请升级到付费套餐。

## 技术栈

- 后端：Node.js, Express, TypeScript, Prisma, PostgreSQL
- 前端：React Native, Expo, TypeScript

## 开发

```bash
# 安装依赖
npm install

# 启动后端
npm run dev:server

# 启动移动端 Web 预览
npm run dev:mobile
```

## 自动部署

推送 `apps/server/` 或 `render.yaml` 的改动到 `main` 分支后，GitHub Actions 会自动触发 Render 后端部署。
