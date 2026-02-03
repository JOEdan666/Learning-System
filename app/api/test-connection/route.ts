import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const apiKey = process.env.OPENAI_API_KEY
    const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
    const model = process.env.OPENAI_MODEL || 'deepseek-chat'

    console.log('[API测试] 开始连接测试');
    console.log('[API测试] 配置:', { 
      apiKey: apiKey ? '已设置' : '未设置', 
      baseUrl, 
      model 
    });

    if (!apiKey) {
      return NextResponse.json({ 
        success: false, 
        error: '缺少 OPENAI_API_KEY 环境变量',
        config: { baseUrl, model }
      }, { status: 400 })
    }

    // 发送简单的测试请求
    const testResponse = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'user',
            content: '请回复"连接测试成功"'
          }
        ],
        max_tokens: 50,
        temperature: 0.1,
      }),
      cache: 'no-store',
    })

    console.log('[API测试] 响应状态:', testResponse.status);

    if (!testResponse.ok) {
      let errorText = ''
      const raw = await testResponse.text()
      try {
        const errorData = JSON.parse(raw)
        errorText = errorData?.error?.message || errorData?.error || raw
      } catch {
        errorText = raw
      }
      
      console.error('[API测试] 连接失败:', errorText);
      return NextResponse.json({ 
        success: false, 
        error: `API连接失败 (${testResponse.status}): ${errorText}`,
        config: { baseUrl, model }
      }, { status: testResponse.status })
    }

    const data = await testResponse.json()
    const content = data.choices?.[0]?.message?.content || ''
    
    console.log('[API测试] 连接成功，响应内容:', content);
    
    return NextResponse.json({ 
      success: true, 
      message: 'API连接测试成功',
      response: content,
      config: { baseUrl, model },
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('[API测试] 发生错误:', error);
    return NextResponse.json({ 
      success: false, 
      error: error?.message || '未知错误',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
