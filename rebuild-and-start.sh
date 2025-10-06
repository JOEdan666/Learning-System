#!/bin/bash

echo "🔨 重新构建并启动应用..."

# SSH连接到服务器
expect << 'EOF'
set timeout 120
spawn ssh root@120.24.22.244
expect "password:"
send "Lyc001286\r"
expect "# "

# 进入项目目录
send "cd /var/www/learning-system\r"
expect "# "

# 停止应用
send "echo '⏹️ 停止应用...'\r"
expect "# "
send "pm2 stop learning-system\r"
expect "# "

# 构建应用
send "echo '🔨 构建应用...'\r"
expect "# "
send "npm run build\r"
expect "# "

# 等待构建完成
send "sleep 30\r"
expect "# "

# 重新启动
send "echo '🚀 启动应用...'\r"
expect "# "
send "NODE_ENV=production pm2 restart learning-system\r"
expect "# "

# 等待启动
send "sleep 10\r"
expect "# "

# 检查状态
send "echo '📊 检查状态:'\r"
expect "# "
send "pm2 list\r"
expect "# "

# 测试API
send "echo '🧪 测试API:'\r"
expect "# "
send "curl -s http://localhost:3000/api/check-env\r"
expect "# "

send "exit\r"
expect eof
EOF

echo "✅ 重新构建完成！"

# 测试外部访问
echo "🧪 测试外部访问..."
curl -s "http://120.24.22.244/api/check-env"

echo ""
echo "🧪 测试AI功能..."
curl -X POST "http://120.24.22.244/api/openai-chat" \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"你好"}],"stream":false}'