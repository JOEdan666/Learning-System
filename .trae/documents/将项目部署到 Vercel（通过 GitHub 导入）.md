## 总览
- 项目是 Next.js 14（app 目录），包含多个 `app/api/*/route.ts` 服务端接口
- 使用 Prisma + PostgreSQL（`prisma/schema.prisma`，需要 `DATABASE_URL`）
- AI 供应商可选：讯飞（客户端 `NEXT_PUBLIC_XUNFEI_*`）或 OpenAI/DeepSeek（后端 `OPENAI_*`）
- 目标流程：推到 GitHub → 在 Vercel 导入并配置环境变量/数据库 → 自动构建与部署

## 你需要准备
- GitHub：一个空仓库（或给我权限创建并推送）
- Vercel：账户可访问 GitHub 仓库并导入项目
- 数据库：Vercel Postgres 或你自己的 Postgres 连接串
- AI 密钥：按你选择的供应商提供对应密钥

## 我会做的修改（确认后执行）
1. 在 `package.json` 添加 `postinstall: prisma generate`，确保在 Vercel 安装阶段生成适配 Linux 的 Prisma Client（避免当前仓库里包含的 macOS 引擎文件导致运行失败）。
2. 添加 `vercel.json`，设置 `buildCommand: prisma generate && prisma migrate deploy && next build` 并确保 API 路由使用 Node 运行时。
3. 添加 `.env.example`，罗列所需环境变量（见下方清单），便于你在 Vercel 上配置。
4. 更新 `.gitignore`：忽略 `app/generated/prisma/**`（生成文件由构建阶段产生，不随仓库提交）。
5. 保持 `next.config.js` 的服务器模式（已经不是静态导出），确保 API 路由可用。

## 环境变量清单
- 必填：`DATABASE_URL`（Postgres 连接串）
- 选择其一：
  - 讯飞：`NEXT_PUBLIC_AI_PROVIDER=xunfei`、`NEXT_PUBLIC_XUNFEI_APP_ID`、`NEXT_PUBLIC_XUNFEI_API_KEY`、`NEXT_PUBLIC_XUNFEI_API_SECRET`、可选 `NEXT_PUBLIC_XUNFEI_DOMAIN`、`NEXT_PUBLIC_XUNFEI_API_URL`
  - OpenAI/DeepSeek：`NEXT_PUBLIC_AI_PROVIDER=openai`、`OPENAI_API_KEY`、`OPENAI_BASE_URL`（如 DeepSeek 则 `https://api.deepseek.com/v1`）、`OPENAI_MODEL`（如 `deepseek-chat` 或 OpenAI 模型名）
- 可选：`NEXT_PUBLIC_AI_DEBUG=true`（客户端调试日志）

## 数据库与迁移
- 首次部署会运行 `prisma migrate deploy` 将 `prisma/migrations` 应用到目标数据库
- 你可以选择：
  - Vercel Postgres（在 Vercel 控制台创建数据库，复制连接串到 `DATABASE_URL`）
  - 自有 Postgres（云服务或自托管，提供 `DATABASE_URL`）

## 推送到 GitHub（你做或我代做）
- 你自己：
  - 在 GitHub 创建空仓库
  - 在本地执行：
    - `git init`
    - `git add . && git commit -m "init"`
    - `git branch -M main`
    - `git remote add origin <你的仓库URL>`
    - `git push -u origin main`
- 我代做（自动化）：
  - 你提供：仓库 URL 或 GitHub Personal Access Token（repo 权限）、你的 GitHub 用户名和邮箱
  - 我将为你初始化 Git、设置远程并推送

## 在 Vercel 导入并配置
- 在 Vercel 控制台选择 “Import Git Repository”，选中该仓库
- 框架自动识别为 Next.js，无需手动设置输出目录
- 在 “Environment Variables” 中配置上面的变量
- 如果使用 Vercel Postgres，绑定数据库并填入连接串到 `DATABASE_URL`
- 首次部署日志中会看到 `prisma generate` 和 `prisma migrate deploy`，随后执行 `next build`

## 验证与自测
- 部署完成后：
  - 访问首页与聊天功能，发送一条消息（确认所选 AI 供应商工作正常）
  - 访问 `GET /api/learning-items`、`GET /api/learning-progress?conversationId=...`（确认数据库读写）
  - 若使用 DeepSeek，确认已设置 `OPENAI_BASE_URL=https://api.deepseek.com/v1` 与 `OPENAI_MODEL=deepseek-chat`

## 你需要提供的信息
- GitHub：仓库 URL；若让我自动化创建/推送，请提供 PAT（repo 权限）与你的用户名/邮箱
- Vercel：你自己导入即可；若让我自动化（可选），需要 Vercel Access Token 与团队/项目名称
- 数据库：选型（Vercel Postgres 或自有）与 `DATABASE_URL`
- AI：选择供应商与相应密钥

## 可选的进一步优化
- 移除与 Vercel 不相关的依赖（如 `@netlify/plugin-nextjs`）以精简体积
- 合并 `next.config.js` 与 `next.config.mjs`，保持单一配置文件

请确认以上计划；确认后我将按此执行修改、推送到 GitHub，并指导或为你完成在 Vercel 的导入与配置。