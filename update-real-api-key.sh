#!/bin/bash

echo "🔑 更新真实的DeepSeek API密钥到服务器..."

# 使用用户提供的有效API密钥
NEW_API_KEY="sk-71380376e8c2418f82c5f05bc3689e1a"

echo "🔄 连接服务器更新API密钥..."

# SSH连接到服务器更新API密钥
expect << EOF
set timeout 30
spawn ssh root@120.24.22.244
expect "password:"
send "Lyc001286\r"
expect "# "

# 进入项目目录
send "cd /var/www/learning-system\r"
expect "# "

# 备份当前配置
send "echo '💾 备份当前配置...'\r"
expect "# "
send "cp .env.production .env.production.backup\r"
expect "# "

# 更新API密钥
send "echo '🔑 更新API密钥...'\r"
expect "# "
send "sed -i 's/OPENAI_API_KEY=.*/OPENAI_API_KEY=$NEW_API_KEY/' .env.production\r"
expect "# "

# 确认更新（只显示前缀，保护密钥安全）
send "echo '✅ API密钥已更新（显示前缀）:'\r"
expect "# "
send "grep 'OPENAI_API_KEY' .env.production | sed 's/\\(sk-[a-zA-Z0-9]\\{8\\}\\).*/\\1.../' \r"
expect "# "

# 重启应用
send "echo '🔄 重启应用...'\r"
expect "# "
send "pm2 restart learning-system\r"
expect "# "

# 等待应用启动
send "echo '⏳ 等待应用启动...'\r"
expect "# "
send "sleep 5\r"
expect "# "

# 测试API配置
send "echo '🧪 测试API配置:'\r"
expect "# "
send "curl -s http://localhost:3000/api/check-env\r"
expect "# "

# 测试AI功能
send "echo '🧪 测试AI功能:'\r"
expect "# "
send "curl -X POST http://localhost:3000/api/openai-chat -H 'Content-Type: application/json' -d '{\"messages\":[{\"role\":\"user\",\"content\":\"你好，请简单回复一下测试\"}],\"stream\":false}'\r"
expect "# "

send "exit\r"
expect eof
EOF

echo "✅ API密钥更新完成！"

# 测试外部访问
echo "🧪 测试外部AI功能..."
curl -X POST "http://120.24.22.244/api/openai-chat" \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"你好，这是最终测试，请回复确认AI功能正常"}],"stream":false}'

echo ""
echo "🎉 如果看到AI回复，说明修复成功！"
echo "📝 现在可以测试网站的AI对话和学习功能了"