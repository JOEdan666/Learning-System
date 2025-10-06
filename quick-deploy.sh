#!/bin/bash

# 快速部署脚本 - 跳过系统更新
# 配置变量
SERVER_IP="120.24.22.244"
SERVER_USER="root"
SERVER_PATH="/var/www/learning-system"
SERVER_PASSWORD="Lyc001286"

echo "🚀 快速部署到阿里云ECS服务器..."

# 检查expect是否安装
if ! command -v expect &> /dev/null; then
    echo "⚠️ expect未安装，正在安装..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        brew install expect
    else
        # Linux
        sudo apt-get update && sudo apt-get install -y expect
    fi
fi

# 创建expect脚本来运行快速部署
cat > quick_deploy_expect.exp << EOF
#!/usr/bin/expect -f
set timeout 600
spawn ssh $SERVER_USER@$SERVER_IP
expect {
    "yes/no" { send "yes\r"; exp_continue }
    "password:" { send "$SERVER_PASSWORD\r" }
}

expect "# "
send "cd $SERVER_PATH\r"
expect "# "

# 检查Node.js是否已安装
send "node --version\r"
expect "# "

# 如果Node.js未安装，安装它
send "if ! command -v node &> /dev/null; then curl -fsSL https://rpm.nodesource.com/setup_18.x | bash - && dnf install -y nodejs; fi\r"
expect "# "

# 安装PM2
send "npm install -g pm2\r"
expect "# "

# 安装项目依赖（使用--force跳过引擎检查）
send "npm install --force\r"
expect "# "

# 生成Prisma客户端
send "npx prisma generate\r"
expect "# "

# 运行数据库迁移
send "npx prisma migrate deploy\r"
expect "# "

# 使用PM2启动应用
send "pm2 stop learning-system 2>/dev/null || true\r"
expect "# "
send "PORT=3003 pm2 start npm --name learning-system -- start\r"
expect "# "

# 安装和配置Nginx
send "if ! command -v nginx &> /dev/null; then dnf install -y nginx; fi\r"
expect "# "

# 创建Nginx配置
send "cat > /etc/nginx/conf.d/learning-system.conf << 'NGINX_EOF'
server {
    listen 80;
    server_name learning-system.top www.learning-system.top $SERVER_IP;

    location / {
        proxy_pass http://localhost:3003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\\$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \\\$host;
        proxy_set_header X-Real-IP \\\$remote_addr;
        proxy_set_header X-Forwarded-For \\\$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \\\$scheme;
        proxy_cache_bypass \\\$http_upgrade;
    }
}
NGINX_EOF\r"
expect "# "

# 测试Nginx配置
send "nginx -t\r"
expect "# "

# 启动Nginx
send "systemctl enable nginx\r"
expect "# "
send "systemctl restart nginx\r"
expect "# "

# 检查服务状态
send "pm2 status\r"
expect "# "
send "systemctl status nginx --no-pager\r"
expect "# "

send "echo '✅ 部署完成！'\r"
expect "# "
send "echo '🌐 访问地址: http://$SERVER_IP:3003'\r"
expect "# "
send "echo '🌐 域名访问: http://learning-system.top'\r"
expect "# "

send "exit\r"
expect eof
EOF

chmod +x quick_deploy_expect.exp

echo "📦 运行快速部署脚本..."
./quick_deploy_expect.exp

# 清理临时文件
rm -f quick_deploy_expect.exp

echo "✅ 快速部署完成！"
echo ""
echo "🌐 您的网站应该已经可以通过以下地址访问："
echo "http://$SERVER_IP:3003"
echo "http://learning-system.top (需要域名解析)"