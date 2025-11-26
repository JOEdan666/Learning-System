## 概览
- 项目类型：Next.js 14（App Router），已含 `vercel.json` 与标准构建脚本（`package.json:6-11`）。
- 后端与数据：使用 Prisma + PostgreSQL（`prisma/schema.prisma:6-9` 指向 `DATABASE_URL`），API 路由位于 `app/api/*/route.ts`。
- 构建配置：`vercel.json` 已设定 `framework: nextjs`、`buildCommand: npm run build`（`vercel.json:1-5`）。
- 目录选择：以当前根目录为部署源（不是 `github-upload/` 副本）。

## 我将为你自动化的操作
- 初始化 Git 仓库、设置远程、推送代码到 GitHub。
- 可选：使用你的 GitHub Token 直接创建远程仓库（非交互）。
- 使用 Vercel 导入 GitHub 仓库并配置项目（框架自动识别为 Next.js）。
- 在 Vercel 设置环境变量并触发构建；为 Prisma 生成客户端并执行数据库迁移。

## 你需要提供
- GitHub：
  - 账号链接：`https://github.com/JOEdan666`（已提供）。
  - 仓库名：`AI-system`（假设将你给的 `AI- system` 规范化为无空格）。
  - 若需我自动创建仓库：GitHub Personal Access Token（`repo` 权限）。
- Vercel：
  - 账户/团队（默认个人账户即可），如需我 CLI 登录则需 Vercel Access Token。
- 环境变量值（不要放入代码仓库，仅在 Vercel 配置）：
  - `DATABASE_URL`（PostgreSQL 连接串）。
  - `OPENAI_API_KEY`、`OPENAI_BASE_URL`、`OPENAI_MODEL`（若启用 OpenAI/DeepSeek）。
  - 可选：`NEXT_PUBLIC_XUNFEI_*`（若启用讯飞）。

## 具体步骤
1. 安全检查与准备
   - 确认不把 `.env` 推到 GitHub（根目录当前 `.gitignore` 未忽略 `.env`；我会改为忽略并保留 `.env.example`）。
   - 为 Prisma 添加 `postinstall: prisma generate`（确保 Vercel 安装后生成客户端，因代码导入 `app/generated/prisma`，见 `app/api/...` 与 `app/services/...`）。
2. 推送到 GitHub
   - 在本地目录初始化 git（如未初始化）。
   - 设置远程为 `https://github.com/JOEdan666/AI-system.git`。
   - 推送 `main` 分支。
   - 若你授权，我也可直接通过 GitHub API 创建该仓库并推送。
3. 在 Vercel 部署
   - 在 Vercel 仪表盘选择 “Import Git Repository”，选中 `AI-system`。
   - 框架自动识别为 Next.js；构建命令 `npm run build`，输出目录 `.next`（`vercel.json` 已定义）。
   - 在 Vercel 的 Environment Variables 设置：至少 `DATABASE_URL` 和你的 AI 配置；保存后首次构建。
4. 初始化数据库
   - 在首次部署或之后，执行 `npx prisma migrate deploy` 让远端数据库应用迁移（也可本地执行一次指向远端 DB）。
5. 验证与收尾
   - 访问 Vercel 生成的预览/生产 URL，验证：主页（`app/page.tsx`）、知识库与对话 API（如 `app/api/openai-chat/route.ts:29-33`）。
   - 如需自定义域名，在 Vercel 绑定域名并把 `NEXT_PUBLIC_SITE_URL`/相关链接更新到环境变量。

## 使用到的项目信息（代码参考）
- 构建脚本：`package.json:6-11`（`build: next build`）。
- Vercel 配置：`vercel.json:1-5`。
- 数据库配置：`prisma/schema.prisma:6-9`（`DATABASE_URL`）。
- Prisma 客户端导入：
  - `app/api/learning-progress/route.ts:3`
  - `app/services/learningProgressService.ts:1`
- AI 环境变量使用：
  - `app/api/openai-chat/route.ts:29-33`
  - `app/components/AIChat.tsx:51`

## 重要假设
- 仓库名使用 `AI-system`（避免空格），如你希望不同名称我也可调整。
- 数据库与 AI 密钥由你在 Vercel 后台提供，不写入代码仓库。

## 确认后我会执行
- 更新 `.gitignore` 以忽略 `.env`，添加 `postinstall`。
- 初始化并推送到 `https://github.com/JOEdan666/AI-system.git`。
- 处理 Vercel 项目创建与变量配置，执行迁移，完成首个生产部署并给出可访问链接。

