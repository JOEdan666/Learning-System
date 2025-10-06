#!/bin/bash

# 更新服务器API密钥脚本
echo "🔧 开始更新服务器API密钥..."

# 真实的API密钥
API_KEY="sk-71380376e8c2418f82c5f05bc3689e1a"

# SSH连接到服务器并更新环境变量
expect << 'EOF'
set timeout 30
spawn ssh root@120.24.22.244
expect "password:"
send "Lyc001286\r"
expect "# "

# 进入项目目录
send "cd /var/www/learning-system\r"
expect "# "

# 检查当前配置
send "echo '📋 当前API密钥配置:'\r"
expect "# "
send "grep OPENAI_API_KEY .env.production\r"
expect "# "

# 创建备份
send "cp .env.production .env.production.backup\r"
expect "# "
send "echo '✅ 已创建配置文件备份'\r"
expect "# "

# 更新API密钥
send "sed -i 's/OPENAI_API_KEY=.*/OPENAI_API_KEY=sk-71380376e8c2418f82c5f05bc3689e1a/' .env.production\r"
expect "# "
send "echo '✅ 已更新API密钥'\r"
expect "# "

# 验证更新
send "echo '📋 验证更新后的配置:'\r"
expect "# "
send "grep OPENAI_API_KEY .env.production\r"
expect "# "

# 重启应用
send "echo '🔄 重启应用...'\r"
expect "# "
send "pm2 restart learning-system\r"
expect "# "

# 等待应用启动
send "sleep 5\r"
expect "# "

# 检查应用状态
send "echo '📊 检查应用状态:'\r"
expect "# "
send "pm2 status\r"
expect "# "

# 检查应用日志
send "echo '📝 检查应用日志:'\r"
expect "# "
send "pm2 logs learning-system --lines 5\r"
expect "# "

# 测试API连接
send "echo '🧪 测试API连接...'\r"
expect "# "
send "curl -s http://localhost:3003/api/check-env\r"
expect "# "

send "exit\r"
expect eof
EOF

echo "✅ API密钥更新完成！"
echo ""
echo "📋 更新内容："
echo "1. ✅ 更新了服务器上的OPENAI_API_KEY"
echo "2. ✅ 重启了learning-system应用"
echo "3. ✅ 验证了配置更新"
echo ""
echo "🔗 现在可以测试AI功能了！"