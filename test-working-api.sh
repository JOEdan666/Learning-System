#!/bin/bash

echo "🧪 测试工作中的API..."

# SSH连接到服务器测试API
expect << 'EOF'
set timeout 30
spawn ssh root@120.24.22.244
expect "password:"
send "Lyc001286\r"
expect "# "

# 测试3000端口的API
send "echo '🧪 测试3000端口API:'\r"
expect "# "
send "curl -s http://localhost:3000/api/check-env\r"
expect "# "

send "echo ''\r"
expect "# "
send "echo '🧪 测试AI聊天API:'\r"
expect "# "
send "curl -X POST http://localhost:3000/api/openai-chat -H 'Content-Type: application/json' -d '{\"messages\":[{\"role\":\"user\",\"content\":\"你好\"}],\"stream\":false}'\r"
expect "# "

send "exit\r"
expect eof
EOF

echo "✅ 测试完成！"

# 现在测试外部访问3000端口
echo "🌐 测试外部3000端口访问..."
curl -s "http://120.24.22.244:3000/api/check-env" | head -10

echo ""
echo "🌐 测试外部AI API..."
curl -X POST "http://120.24.22.244:3000/api/openai-chat" \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"你好，请简单回复"}],"stream":false}' | head -20