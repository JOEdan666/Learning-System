# 🚀 AI学习平台 - Vercel一键部署

## 🎯 一键部署按钮

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FJOEdan666%2FAI-System-best-&env=DATABASE_URL,OPENAI_API_KEY,OPENAI_BASE_URL,OPENAI_MODEL,NEXTAUTH_URL,NEXTAUTH_SECRET&envDescription=AI%E5%AD%A6%E4%B9%A0%E5%B9%B3%E5%8F%B0%E6%89%80%E9%9C%80%E7%9A%84%E7%8E%AF%E5%A2%83%E5%8F%98%E9%87%8F&envLink=https%3A%2F%2Fgithub.com%2FJOEdan666%2FAI-System-best-%2Fblob%2Fmain%2Fvercel-env-setup.txt&project-name=ai-learning-system&repository-name=ai-learning-system)

## 📋 快速部署步骤

### 方法一：一键部署（推荐）

1. **点击上方部署按钮**
2. **登录Vercel账户**（如果没有账户会自动创建）
3. **配置项目**：
   - 项目名称：`ai-learning-system`
   - 仓库名称：`ai-learning-system`
4. **配置环境变量**（必需）：
   ```
   DATABASE_URL=postgresql://JOEdan666:962222mini%23@pgm-wz9e83um4mxsop2yvo.pg.rds.aliyuncs.com:5432/pgm-wz9e83um4mxsop2y?schema=public
   OPENAI_API_KEY=sk-71380376e8c2418f82c5f05bc3689e1a
   OPENAI_BASE_URL=https://api.deepseek.com/v1
   OPENAI_MODEL=deepseek-chat
   NEXTAUTH_URL=https://your-project-name.vercel.app
   NEXTAUTH_SECRET=your-random-secret-here
   ```
5. **点击Deploy**开始部署

### 方法二：本地脚本部署

```bash
# 运行一键部署脚本
./deploy-to-vercel.sh
```

## 🔑 环境变量配置

### 必需变量

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `DATABASE_URL` | PostgreSQL数据库连接 | `postgresql://user:pass@host:5432/db` |
| `OPENAI_API_KEY` | DeepSeek API密钥 | `sk-xxx` |
| `OPENAI_BASE_URL` | DeepSeek API地址 | `https://api.deepseek.com/v1` |
| `OPENAI_MODEL` | AI模型名称 | `deepseek-chat / deepseek-reasoner` |
| `NEXTAUTH_URL` | 应用域名 | `https://your-app.vercel.app` |
| `NEXTAUTH_SECRET` | 认证密钥 | 随机字符串 |

### 可选变量（科大讯飞）

| 变量名 | 说明 |
|--------|------|
| `NEXT_PUBLIC_XUNFEI_APP_ID` | 讯飞应用ID |
| `NEXT_PUBLIC_XUNFEI_API_KEY` | 讯飞API密钥 |
| `NEXT_PUBLIC_XUNFEI_API_SECRET` | 讯飞API密钥 |

## 🎯 部署后配置

### 1. 更新域名配置
部署完成后，更新以下环境变量：
```
NEXTAUTH_URL=https://your-actual-domain.vercel.app
NEXT_PUBLIC_SITE_URL=https://your-actual-domain.vercel.app
```

### 2. 生成认证密钥
```bash
# 生成随机密钥
openssl rand -base64 32
```
将生成的密钥设置为 `NEXTAUTH_SECRET`

### 3. 重新部署
在Vercel控制台点击 "Redeploy" 使配置生效

## 🔧 故障排除

### 构建失败
- 检查环境变量是否正确配置
- 确认数据库连接是否可用
- 查看Vercel构建日志

### 运行时错误
- 检查API密钥是否有效
- 确认数据库权限设置
- 查看Function日志

## 📞 技术支持

如遇到部署问题，请检查：
1. 环境变量配置是否完整
2. 数据库连接是否正常
3. API密钥是否有效

## 🌟 功能特性

- 🧠 AI智能学习流程
- 📚 知识库管理
- 📝 错题本系统
- 📊 学习分析报告
- 🎯 个性化学习体验

---

**🎉 部署完成后，您就可以开始使用AI学习平台了！**
