您可以在 Vercel 的 **Settings** -> **Environment Variables** 中批量添加以下变量。

### Vercel 环境变量配置清单

```bash
# 数据库连接串 (必需)
# 请替换为您在 Neon/Supabase 等平台获取的真实连接串
DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"

# AI 服务配置 (必需 - 推荐 DeepSeek)
OPENAI_API_KEY="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
OPENAI_BASE_URL="https://api.deepseek.com/v1"
OPENAI_MODEL="deepseek-chat"

# 前端配置 (可选)
# 用于标识当前使用的 AI 提供商，默认 openai
NEXT_PUBLIC_AI_PROVIDER="openai"
```

### 操作提示
1.  **DATABASE_URL**：这是最关键的。由于我删除了本地的 `.env`，您需要去您的云数据库控制台（如 Neon, Supabase, Vercel Postgres）复制这个连接串。
2.  **OPENAI_API_KEY**：请填入您的 DeepSeek API Key。
3.  **修改后生效**：保存变量后，记得去 **Deployments** 页面重新部署 (Redeploy) 才能生效。
