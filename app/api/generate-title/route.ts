import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { messages, type, subject, topic } = body

    // 学习类型直接返回
    if (type === 'learning' && subject && topic) {
      return NextResponse.json({
        title: `${subject} - ${topic}`,
        confidence: 1.0
      })
    }

    // 没有消息时返回默认标题
    if (!messages || messages.length === 0) {
      return NextResponse.json({
        title: type === 'learning' ? '系统化学习' : '新对话',
        confidence: 0.5
      })
    }

    // 从消息中提取本地标题作为备用
    const deriveLocalTitle = (): string => {
      const firstUser = messages.find((m: any) => m.role === 'user')
      const fallback = firstUser?.content || messages[0]?.content || ''
      const plain = (fallback || '').replace(/\s+/g, ' ').trim()
      if (!plain) return type === 'learning' ? '系统化学习' : '新对话'
      const slice = plain.length > 12 ? plain.slice(0, 12) + '…' : plain
      return slice
    }

    const apiKey = process.env.OPENAI_API_KEY
    const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
    const model = process.env.OPENAI_MODEL || 'deepseek-chat'

    if (!apiKey) {
      // 没有API Key，使用本地方法
      return NextResponse.json({
        title: deriveLocalTitle(),
        confidence: 0.4
      })
    }

    // 构建prompt
    const recentMessages = messages.slice(-6)
    const conversationContent = recentMessages
      .map((msg: any) => `${msg.role}: ${msg.content}`)
      .join('\n')

    const prompt = `请基于以下对话内容，生成一个简洁精炼的对话标题（不超过10个字）：

${conversationContent}

要求：
1. 标题要能概括对话的主要内容
2. 简洁明了，尽量不超过10个字
3. 避免使用"关于"、"讨论"等冗余词汇
4. 直接返回标题文本，不要包含任何标点符号
5. 不要重复输出

标题：`

    const resp = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 50,
      }),
      cache: 'no-store',
    })

    if (!resp.ok) {
      console.error('[generate-title] API请求失败:', resp.status)
      return NextResponse.json({
        title: deriveLocalTitle(),
        confidence: 0.4
      })
    }

    const data = await resp.json()
    let title = data.choices?.[0]?.message?.content || ''

    // 清理标题
    title = title.trim().replace(/^标题[：:]\s*/, '').trim()
    title = title.replace(/["""'']/g, '').trim()

    // 去重处理
    if (title.length > 4 && title.length % 2 === 0) {
      const halfLen = title.length / 2
      const firstHalf = title.substring(0, halfLen)
      const secondHalf = title.substring(halfLen)
      if (firstHalf === secondHalf) {
        title = firstHalf
      }
    }
    title = title.replace(/(.{2,})\1+/g, '$1')

    // 如果标题太长，截断
    if (title.length > 15) {
      title = title.slice(0, 12) + '…'
    }

    return NextResponse.json({
      title: title || deriveLocalTitle(),
      confidence: 0.8
    })
  } catch (e: any) {
    console.error('[generate-title] 错误:', e)
    return NextResponse.json({
      title: '新对话',
      confidence: 0.3
    })
  }
}
