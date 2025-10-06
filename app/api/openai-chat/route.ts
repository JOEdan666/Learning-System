import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    // 支持两种数据格式：
    // 1. { query, history } - 旧格式
    // 2. { messages } - 新格式（从ExplainStep发送）
    let messages;
    let query = '';
    
    if (body.messages) {
      // 新格式：直接使用messages
      messages = body.messages;
      // 提取最后一个用户消息作为query用于日志
      const lastUserMessage = body.messages.filter((m: any) => m.role === 'user').pop();
      query = lastUserMessage?.content || '';
    } else {
      // 旧格式：从query和history构建messages
      const { query: q, history } = body;
      query = q || '';
      messages = (history || []).concat([{ role: 'user', content: query }]);
    }

    const url = new URL(req.url)
    const isStream = ['1', 'true', 'yes'].includes((url.searchParams.get('stream') || '').toLowerCase())

    const apiKey = process.env.OPENAI_API_KEY
    const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'

    console.log('[API] 收到请求:', { 
      query: query ? query.substring(0, 50) + '...' : '(无query)', 
      messagesLength: messages?.length || 0, 
      isStream 
    });
    console.log('[API] 配置:', { apiKey: apiKey ? '已设置' : '未设置', baseUrl, model });

    if (!apiKey) {
      console.error('[API] 错误: 缺少 OPENAI_API_KEY');
      return NextResponse.json({ error: 'Missing OPENAI_API_KEY' }, { status: 400 })
    }

    if (!messages || messages.length === 0) {
      console.error('[API] 错误: 缺少消息内容');
      return NextResponse.json({ error: 'Missing messages' }, { status: 400 })
    }
    console.log('[API] 发送到上游的消息数量:', messages.length);

    // 流式：将上游 SSE 转换为纯文本增量输出
    if (isStream) {
      console.log('[API] 处理流式请求');
      const upstream = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.7,
          stream: true,
        }),
        cache: 'no-store',
      })

      console.log('[API] 上游响应状态:', upstream.status);
      
      if (!upstream.ok) {
        let errText = ''
        try {
          const j = await upstream.json()
          errText = j?.error?.message || j?.error || JSON.stringify(j)
        } catch {
          errText = await upstream.text()
        }
        const msg = `Upstream error ${upstream.status}: ${errText}`
        console.error('[API] 上游错误:', msg);
        return NextResponse.json({ error: msg }, { status: upstream.status })
      }

      const encoder = new TextEncoder()
      const decoder = new TextDecoder()

      const readable = new ReadableStream<Uint8Array>({
        async start(controller) {
          const reader = upstream.body?.getReader()
          if (!reader) {
            console.error('[API] 错误: 无法获取上游响应的读取器');
            controller.close()
            return
          }
          let buffer = ''
          let totalContent = ''
          let chunksSent = 0
          try {
            while (true) {
              const { value, done } = await reader.read()
              if (done) break
              buffer += decoder.decode(value, { stream: true })

              let sepIndex: number
              while ((sepIndex = buffer.indexOf('\n\n')) !== -1) {
                const eventChunk = buffer.slice(0, sepIndex)
                buffer = buffer.slice(sepIndex + 2)
                const lines = eventChunk.split('\n').map(l => l.trim())
                for (const line of lines) {
                  if (!line.startsWith('data:')) continue
                  const data = line.slice(5).trim()
                  if (!data) continue
                  if (data === '[DONE]') {
                    console.log('[API] 收到 [DONE] 信号，总发送内容长度:', totalContent.length, '总块数:', chunksSent);
                    controller.close()
                    return
                  }
                  try {
                    const json = JSON.parse(data)
                    // 尝试从多种可能的位置提取内容，以兼容不同模型
                    const delta = 
                      json?.choices?.[0]?.delta?.content || 
                      json?.choices?.[0]?.message?.content || 
                      ''
                       
                    if (delta) {
                      totalContent += delta
                      chunksSent++
                      console.log(`[API] 发送数据块 #${chunksSent}:`, delta.substring(0, 30) + '...');
                      controller.enqueue(encoder.encode(delta))
                    }
                  } catch (e) {
                    console.error('[API] 解析JSON数据块失败:', e, '数据:', data);
                    // 尝试直接发送数据作为文本，以防格式不匹配
                    try {
                      const textData = data.replace(/^data:/, '').trim()
                      if (textData && textData !== '[DONE]') {
                        controller.enqueue(encoder.encode(textData))
                      }
                    } catch (fallbackError) {
                      console.error('[API] 回退文本处理也失败:', fallbackError);
                    }
                  }
                }
              }
            }
          } catch (e) {
            console.error('[API] 处理流式响应时出错:', e);
            controller.error(e)
          } finally {
            console.log('[API] 流式响应处理完成，总内容长度:', totalContent.length);
            controller.close()
          }
        },
      })

      return new Response(readable, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-store',
        },
      })
    }

    // 非流式：保留原有一次性返回
    console.log('[API] 处理非流式请求');
    const resp = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
      }),
      cache: 'no-store',
    })

    if (!resp.ok) {
      let errText = ''
      try {
        const j = await resp.json()
        errText = j?.error?.message || j?.error || JSON.stringify(j)
      } catch {
        errText = await resp.text()
      }
      const msg = `Upstream error ${resp.status}: ${errText}`
      console.error('[API] 上游错误:', msg);
      return NextResponse.json({ error: msg }, { status: resp.status })
    }

    const data = await resp.json()
    // 尝试从多种可能的位置提取内容
    const content = 
      data.choices?.[0]?.message?.content || 
      data.choices?.[0]?.delta?.content || 
      ''
    console.log('[API] 非流式响应内容长度:', content.length);
    return NextResponse.json({ content })
  } catch (e: any) {
    console.error('[API] 发生未捕获错误:', e);
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 })
  }
}