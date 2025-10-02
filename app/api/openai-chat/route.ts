import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { query, history } = await req.json()

    const url = new URL(req.url)
    const isStream = ['1', 'true', 'yes'].includes((url.searchParams.get('stream') || '').toLowerCase())

    const apiKey = process.env.OPENAI_API_KEY
    const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'

    if (!apiKey) {
      return NextResponse.json({ error: 'Missing OPENAI_API_KEY' }, { status: 400 })
    }

    const messages = (history || []).concat([{ role: 'user', content: query }])

    // 流式：将上游 SSE 转换为纯文本增量输出
    if (isStream) {
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

      if (!upstream.ok) {
        let errText = ''
        try {
          const j = await upstream.json()
          errText = j?.error?.message || j?.error || JSON.stringify(j)
        } catch {
          errText = await upstream.text()
        }
        const msg = `Upstream error ${upstream.status}: ${errText}`
        return NextResponse.json({ error: msg }, { status: upstream.status })
      }

      const encoder = new TextEncoder()
      const decoder = new TextDecoder()

      const readable = new ReadableStream<Uint8Array>({
        async start(controller) {
          const reader = upstream.body?.getReader()
          if (!reader) {
            controller.close()
            return
          }
          let buffer = ''
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
                    controller.close()
                    return
                  }
                  try {
                    const json = JSON.parse(data)
                    const delta = json?.choices?.[0]?.delta?.content || ''
                    if (delta) controller.enqueue(encoder.encode(delta))
                  } catch {
                    // 无法解析则忽略
                  }
                }
              }
            }
          } catch (e) {
            controller.error(e)
          } finally {
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
      return NextResponse.json({ error: msg }, { status: resp.status })
    }

    const data = await resp.json()
    const content = data.choices?.[0]?.message?.content ?? ''
    return NextResponse.json({ content })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 })
  }
}