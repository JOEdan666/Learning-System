#!/bin/bash

echo "🔧 简单直接修复API连接..."

# SSH连接到服务器
expect << 'EOF'
set timeout 30
spawn ssh root@120.24.22.244
expect "password:"
send "Lyc001286\r"
expect "# "

send "cd /var/www/learning-system\r"
expect "# "

# 停止应用
send "pm2 stop learning-system\r"
expect "# "

# 删除应用
send "pm2 delete learning-system\r"
expect "# "

# 直接启动应用，强制使用3000端口
send "PORT=3000 pm2 start 'npm start' --name learning-system\r"
expect "# "

# 等待启动
send "sleep 5\r"
expect "# "

# 检查状态
send "pm2 status\r"
expect "# "

# 检查日志
send "pm2 logs learning-system --lines 5\r"
expect "# "

# 测试3000端口
send "curl -s http://localhost:3000/api/check-env | head -3\r"
expect "# "

send "exit\r"
expect eof
EOF

echo "✅ 修复完成！"

# 测试外部访问
echo "🧪 测试外部访问..."
curl -s "http://120.24.22.244/api/check-env" | head -5