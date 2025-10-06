# 手动部署指南

## 服务器信息
- IP: 120.24.22.244
- 用户: root
- 密码: Lyc001286
- 域名: learning-system.top

## 部署步骤

### 1. 准备部署包
```bash
# 创建部署包
tar -czf learning-system-deploy.tar.gz .next public prisma package.json package-lock.json next.config.js .env.production app
```

### 2. 上传到服务器
```bash
scp learning-system-deploy.tar.gz root@120.24.22.244:/tmp/
```

### 3. 连接服务器并部署
```bash
ssh root@120.24.22.244
```

在服务器上执行：
```bash
# 停止现有服务
pm2 stop learning-system || true

# 创建应用目录
mkdir -p /var/www/learning-system
cd /var/www/learning-system

# 清理并解压
rm -rf *
tar -xzf /tmp/learning-system-deploy.tar.gz
mv .env.production .env

# 安装Node.js (如果未安装)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# 安装PM2 (如果未安装)
npm install -g pm2

# 安装依赖
npm install --production

# 数据库设置
npx prisma generate
npx prisma db push

# 启动应用
pm2 start npm --name "learning-system" -- start
pm2 save
pm2 startup

# 配置Nginx
cat > /etc/nginx/sites-available/learning-system.top << 'EOF'
server {
    listen 80;
    server_name learning-system.top www.learning-system.top;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# 启用站点
ln -sf /etc/nginx/sites-available/learning-system.top /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx

# 检查状态
pm2 status
systemctl status nginx
```

### 4. 验证部署
访问 http://learning-system.top 检查网站是否正常运行。