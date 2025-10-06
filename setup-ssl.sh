#!/bin/bash

# SSL 证书配置脚本 - Let's Encrypt
echo "🔒 开始配置 SSL 证书..."

# 检查是否为 root 用户
if [ "$EUID" -ne 0 ]; then
    echo "❌ 请使用 root 用户或 sudo 运行此脚本"
    exit 1
fi

# 安装 certbot
echo "📦 安装 Certbot..."
yum install -y epel-release
yum install -y certbot python3-certbot-nginx

# 获取 SSL 证书
echo "🔐 获取 SSL 证书..."
certbot --nginx -d learning-system.top -d www.learning-system.top --non-interactive --agree-tos --email admin@learning-system.top

# 设置自动续期
echo "⏰ 设置证书自动续期..."
echo "0 12 * * * /usr/bin/certbot renew --quiet" | crontab -

# 更新 Nginx 配置以支持 HTTPS
echo "⚙️ 更新 Nginx 配置..."
cat > /etc/nginx/conf.d/learning-system.conf << EOF
server {
    listen 80;
    server_name learning-system.top www.learning-system.top;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name learning-system.top www.learning-system.top;

    ssl_certificate /etc/letsencrypt/live/learning-system.top/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/learning-system.top/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;

    location / {
        proxy_pass http://localhost:3003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# 重启 Nginx
echo "🔄 重启 Nginx..."
nginx -t && systemctl reload nginx

echo "✅ SSL 配置完成！"
echo ""
echo "🔒 HTTPS 访问地址: https://learning-system.top"
echo "📋 证书信息:"
echo "- 证书路径: /etc/letsencrypt/live/learning-system.top/"
echo "- 自动续期: 已配置 (每天 12:00 检查)"
echo ""
echo "🔧 证书管理命令:"
echo "- 查看证书状态: certbot certificates"
echo "- 手动续期: certbot renew"
echo "- 测试续期: certbot renew --dry-run"