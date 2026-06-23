# 灵伴 - AI 智能体应用 三阶段开发文档

## 项目概述
灵伴是一个 AI 好友陪伴应用，支持用户创建个性化 AI 智能体并进行流式对话。当前基于 Next.js 15 + Prisma 6 + PostgreSQL 技术栈开发。

---

## 🚀 第一阶段：核心功能完成（已完成 ✅）

### 目标
搭建项目基础框架，实现用户匿名认证、AI 智能体创建、流式对话核心功能。

### 已完成功能
- [x] 项目初始化与技术栈搭建
  - Next.js 15 App Router
  - TypeScript 类型安全
  - Tailwind CSS 样式系统
  - Prisma ORM + PostgreSQL
- [x] 匿名用户认证系统
  - 设备指纹识别
  - 本地 Token 存储
  - 自动登录/注册
- [x] AI 智能体管理
  - 创建智能体（名称、头像、人设）
  - 编辑智能体配置
  - 删除智能体
  - 智能体列表展示
- [x] 多模型支持
  - DeepSeek（默认）
  - OpenAI
  - 自定义 API 端点
  - 温度、最大 Token 可调
- [x] 流式对话功能
  - SSE 流式响应
  - 逐字打字机效果
  - 消息历史记录
  - 重新生成回复
- [x] UI/UX 基础
  - 移动端优先设计
  - 深色模式
  - 玻璃拟态风格
  - Toast 提示
  - 错误边界
  - 加载状态
- [x] 部署配置
  - Render Blueprint 配置（render.yaml）
  - 数据库自动迁移
  - 健康检查端点 `/api/health`

### 第一阶段技术栈
| 技术 | 版本 | 用途 |
|------|------|------|
| Next.js | 15.2.3 | 全栈框架 |
| React | 19.0.0 | UI 框架 |
| TypeScript | 5.8.3 | 类型系统 |
| Prisma | 6.19.3 | ORM |
| PostgreSQL | - | 数据库 |
| Tailwind CSS | 3.4.17 | 样式框架 |
| Zustand | 5.0.3 | 状态管理 |
| Lucide React | 0.511.0 | 图标库 |

### 数据库表结构
```
users - 用户表
  ├── id (CUID, 主键)
  ├── token (唯一, 认证令牌)
  ├── nickname (昵称)
  ├── avatar (头像)
  ├── persona (用户人设)
  ├── theme (主题)
  ├── created_at / updated_at

agents - AI 智能体表
  ├── id (CUID, 主键)
  ├── user_id (外键 → users)
  ├── name (名称)
  ├── avatar (头像)
  ├── persona (性格人设)
  ├── greeting (问候语)
  ├── model_provider (模型提供商)
  ├── model_name (模型名称)
  ├── api_endpoint (自定义 API 地址)
  ├── temperature (温度参数)
  ├── max_tokens (最大 Token)
  ├── api_key (用户 API Key)
  ├── created_at / updated_at

chat_messages - 聊天消息表
  ├── id (CUID, 主键)
  ├── agent_id (外键 → agents)
  ├── user_id (外键 → users)
  ├── role (user/assistant)
  ├── content (消息内容)
  ├── created_at
```

---

## 🎯 第二阶段：体验优化与功能增强（开发中）

### 目标
提升用户体验，增加个性化功能，优化对话质量，添加更多实用特性。

### 计划功能

#### 1. 用户系统增强
- [ ] 用户资料编辑
  - [ ] 上传自定义头像
  - [ ] 修改昵称
  - [ ] 设置个人人设（让 AI 更好了解你）
- [ ] 账号系统（可选）
  - [ ] 邮箱注册/登录
  - [ ] 数据云端同步
  - [ ] 多设备登录

#### 2. AI 智能体增强
- [ ] 智能体模板市场
  - [ ] 预设热门角色（女友、男友、闺蜜、导师、游戏角色等）
  - [ ] 一键使用模板
  - [ ] 用户分享自己创建的智能体
- [ ] 智能体头像生成
  - [ ] AI 自动生成头像
  - [ ] 头像风格选择
- [ ] 智能体记忆增强
  - [ ] 长期记忆摘要
  - [ ] 重要信息提取
  - [ ] 对话上下文窗口优化

#### 3. 对话体验优化
- [ ] 消息功能增强
  - [ ] 消息编辑
  - [ ] 消息删除
  - [ ] 消息复制
  - [ ] 消息重新生成分支
- [ ] 多媒体消息
  - [ ] 图片发送
  - [ ] 语音消息（TTS/STT）
  - [ ] 表情包支持
- [ ] 对话功能
  - [ ] 对话搜索
  - [ ] 对话导出
  - [ ] 对话分类/标签
  - [ ] 对话置顶/收藏

#### 4. UI/UX 升级
- [ ] 主题系统
  - [ ] 更多主题可选
  - [ ] 自定义主题颜色
  - [ ] 聊天背景自定义
- [ ] 动画效果
  - [ ] 更流畅的页面切换
  - [ ] 消息气泡动画
  - [ ] 智能体头像微动效
- [ ] 响应式优化
  - [ ] 平板适配
  - [ ] 桌面端优化
  - [ ] PWA 支持（可安装到手机桌面）

#### 5. 性能优化
- [ ] 对话列表虚拟滚动
- [ ] 消息分页加载
- [ ] 图片/资源懒加载
- [ ] API 响应缓存
- [ ] 数据库查询优化

---

## 🌟 第三阶段：社交化与商业化（未来规划）

### 目标
打造社区生态，探索商业模式，支持更大规模用户。

### 计划功能

#### 1. 社区功能
- [ ] 智能体广场
  - [ ] 热门智能体推荐
  - [ ] 分类浏览
  - [ ] 评分与评论
  - [ ] 使用量统计
- [ ] 用户社交
  - [ ] 关注其他用户
  - [ ] 智能体分享
  - [ ] 有趣对话分享
  - [ ] 私信功能
- [ ] 创作激励
  - [ ] 创作者榜单
  - [ ] 优质内容推荐
  - [ ] 创作者收益分成

#### 2. 高级功能
- [ ] 多模态能力
  - [ ] 图片理解（视觉模型）
  - [ ] AI 绘图
  - [ ] 语音通话
- [ ] 智能体群组
  - [ ] 多 AI 群聊
  - [ ] AI 之间互动
- [ ] 高级记忆
  - [ ] 知识库上传
  - [ ] 文档问答
  - [ ] 个性化记忆训练

#### 3. 商业化
- [ ] 会员体系
  - [ ] 免费额度
  - [ ] Pro 会员（无限对话、高级模型）
  - [ ] 订阅套餐
- [ ] 增值服务
  - [ ] 自定义智能体数量上限
  - [ ] 更长对话历史
  - [ ] 高级模型访问
- [ ] API 开放平台
  - [ ] 开发者 API
  - [ ] 第三方集成

#### 4. 运维与扩展
- [ ] 监控与分析
  - [ ] 用户行为分析
  - [ ] 错误监控
  - [ ] 性能监控
- [ ] 安全增强
  - [ ] 内容审核
  - [ ] 反滥用
  - [ ] 数据加密
- [ ] 多区域部署
  - [ ] 全球 CDN
  - [ ] 多区域节点
  - [ ] 容灾备份

---

## 🛠️ 开发指南

### 本地开发
```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env，设置 DATABASE_URL

# 3. 初始化数据库
npx prisma migrate dev

# 4. 启动开发服务器
npm run dev
```

### 部署
项目使用 Render Blueprint 一键部署：
1. 推送到 GitHub main 分支
2. 在 Render 选择 Blueprint 部署
3. 自动创建 Web Service + PostgreSQL 数据库
4. 自动运行构建和数据库迁移

### 常用命令
```bash
npm run dev          # 开发模式
npm run build        # 构建生产版本
npm run start        # 启动生产服务器
npm run lint         # 代码检查
npm run check        # TypeScript 类型检查
npm run db:generate  # 生成 Prisma Client
npm run db:migrate   # 开发环境迁移
npm run db:deploy    # 生产环境迁移
npm run db:studio    # 打开 Prisma Studio
```

---

## 📁 项目结构
```
lingban/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API 路由
│   │   │   ├── agents/        # 智能体 CRUD
│   │   │   ├── auth/          # 认证相关
│   │   │   ├── chat/          # 聊天相关
│   │   │   └── health/        # 健康检查
│   │   ├── agent/             # 智能体页面
│   │   │   ├── [id]/chat/     # 聊天页面
│   │   │   ├── [id]/edit/     # 编辑页面
│   │   │   └── new/           # 创建页面
│   │   ├── profile/           # 用户资料
│   │   ├── layout.tsx         # 根布局
│   │   ├── page.tsx           # 首页
│   │   └── providers.tsx      # 全局 Provider
│   ├── components/            # 通用组件
│   ├── lib/                   # 工具库
│   │   ├── api.ts            # API 请求封装
│   │   ├── auth.ts           # 认证逻辑
│   │   ├── llm.ts            # LLM 调用
│   │   ├── prisma.ts         # Prisma 客户端
│   │   └── utils.ts          # 工具函数
│   ├── store/                 # Zustand 状态管理
│   └── types/                 # TypeScript 类型定义
├── prisma/
│   ├── schema.prisma         # 数据库 Schema
│   └── migrations/           # 数据库迁移文件
├── .env.example              # 环境变量示例
├── package.json
├── render.yaml               # Render 部署配置
└── next.config.ts            # Next.js 配置
```

---

## 🎨 设计规范

### 颜色系统
使用 HSL CSS 变量定义主题色：
- `--primary`: 主色调
- `--secondary`: 辅助色
- `--accent`: 强调色
- `--background`: 背景色
- `--foreground`: 文字色
- `--muted`: 次要文字/背景
- `--destructive`: 危险/警告色

### 设计风格
- 移动端优先（最大宽度 480px 居中）
- 玻璃拟态（Glassmorphism）
- 圆角设计（rounded-xl / rounded-2xl）
- 柔和阴影
- 流畅动画（transition-all）

---

## 📝 更新日志

### 2026-06-23
- ✅ 完成第一阶段核心功能
- ✅ 修复 Render 部署配置问题
- ✅ 添加三阶段开发文档
