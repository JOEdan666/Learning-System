#!/bin/bash

# 上传项目到阿里云 ECS 脚本
echo "📤 准备上传项目到阿里云 ECS..."

# 配置变量 - 请修改为您的服务器信息
SERVER_IP="120.24.22.244"           # 阿里云 ECS 公网 IP
SERVER_USER="root"                   # 服务器用户名
SERVER_PATH="/var/www/learning-system"  # 服务器部署路径

# 检查服务器 IP 是否已配置
if [ "$SERVER_IP" = "YOUR_SERVER_IP" ]; then
    echo "❌ 请先在脚本中配置您的阿里云 ECS 服务器 IP 地址"
    echo "编辑 upload-to-aliyun.sh 文件，将 YOUR_SERVER_IP 替换为实际 IP"
    exit 1
fi

# 创建排除文件列表
echo "📋 创建上传排除列表..."
cat > .upload-exclude << EOF
node_modules/
.next/
.git/
.env.local
.env.development
.env.test
dev.db
*.log
.DS_Store
.vscode/
.claude/
EOF

# 构建项目
echo "🏗️ 构建项目..."
npm run build

# 创建服务器目录
echo "📁 在服务器上创建目录..."
ssh $SERVER_USER@$SERVER_IP "mkdir -p $SERVER_PATH"

# 上传项目文件
echo "📤 上传项目文件到服务器..."
# 创建临时压缩包
tar --exclude-from=.upload-exclude -czf project.tar.gz .
scp project.tar.gz $SERVER_USER@$SERVER_IP:$SERVER_PATH/
ssh $SERVER_USER@$SERVER_IP "cd $SERVER_PATH && tar -xzf project.tar.gz && rm project.tar.gz"
rm project.tar.gz

# 上传环境配置文件
echo "📤 上传生产环境配置..."
scp .env.production $SERVER_USER@$SERVER_IP:$SERVER_PATH/.env

# 设置脚本执行权限
echo "🔧 设置脚本权限..."
ssh $SERVER_USER@$SERVER_IP "chmod +x $SERVER_PATH/deploy-aliyun.sh"
ssh $SERVER_USER@$SERVER_IP "chmod +x $SERVER_PATH/setup-ssl.sh"

echo "✅ 文件上传完成！"
echo ""
echo "📋 上传信息："
echo "- 服务器: $SERVER_USER@$SERVER_IP"
echo "- 路径: $SERVER_PATH"
echo ""
echo "🚀 下一步操作："
echo "1. 登录服务器: ssh $SERVER_USER@$SERVER_IP"
echo "2. 进入项目目录: cd $SERVER_PATH"
echo "3. 运行部署脚本: ./deploy-aliyun.sh"
echo "4. 配置 SSL 证书: ./setup-ssl.sh"
echo ""
echo "🌐 完成后访问: https://learning-system.top"

# 清理临时文件
rm -f .upload-exclude