#!/bin/bash

echo "🧪 测试API连接..."

# 测试服务器上的API
echo "📡 测试服务器API连接..."
curl -s "http://120.24.22.244/api/check-env" | head -20

echo ""
echo "🔍 测试结果分析："
echo "如果看到 'apiKey: 已设置' 说明API密钥配置正确"
echo "如果看到 'baseUrl: https://api.deepseek.com/v1' 说明API地址正确"
echo ""

# 测试一个简单的AI请求
echo "🤖 测试AI功能..."
curl -X POST "http://120.24.22.244/api/openai-chat" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "你好，请简单回复一下"}],
    "stream": false
  }' | head -50

echo ""
echo "✅ API测试完成！"