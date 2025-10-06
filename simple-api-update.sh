#!/bin/bash

echo "🔑 简单更新API密钥..."

# SSH连接到服务器
expect << 'EOF'
set timeout 30
spawn ssh root@120.24.22.244
expect "password:"
send "Lyc001286\r"
expect "# "

# 进入项目目录
send "cd /var/www/learning-system\r"
expect "# "

# 直接编辑配置文件
send "echo '🔧 直接更新API密钥...'\r"
expect "# "
send "sed -i 's/OPENAI_API_KEY=sk-.*/OPENAI_API_KEY=sk-71380376e8c2418f82c5f05bc3689e1a/' .env.production\r"
expect "# "

# 确认更新
send "echo '✅ 确认更新:'\r"
expect "# "
send "grep 'OPENAI_API_KEY' .env.production\r"
expect "# "

# 重启应用
send "echo '🔄 重启应用...'\r"
expect "# "
send "pm2 restart learning-system\r"
expect "# "

# 等待启动
send "sleep 3\r"
expect "# "

# 测试API
send "echo '🧪 测试API:'\r"
expect "# "
send "curl -s http://localhost:3000/api/check-env\r"
expect "# "

send "exit\r"
expect eof
EOF

echo "✅ 更新完成！"

# 最终测试
echo "🧪 最终测试..."
curl -X POST "http://120.24.22.244/api/openai-chat" \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"你好"}],"stream":false}'