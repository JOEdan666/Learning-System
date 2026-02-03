import { NextRequest, NextResponse } from 'next/server';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Intent-specific prompts
const INTENT_PROMPTS: Record<string, string> = {
  clarify: `帮用户澄清和梳理当前内容。你需要：
1. 找出核心概念和关键点
2. 解释可能的困惑点
3. 用简单清晰的语言总结`,
  'next-steps': `基于当前状态，给出具体可执行的下一步行动建议。你需要：
1. 分析当前进度和目标差距
2. 给出2-4条具体、可立即执行的行动
3. 说明每个行动的价值`,
  brainstorm: `围绕用户的目标，发散思考。你需要：
1. 提供多个不同角度的创意想法
2. 不要过早否定任何可能性
3. 鼓励突破常规思维`
};

// Mode-specific styles
const MODE_STYLES: Record<string, string> = {
  Study: '你是一个耐心的学习导师，用教学的口吻，确保解释清晰易懂，适合学习场景。多用例子和类比。',
  Work: '你是一个高效的工作助手，用简洁专业的口吻，聚焦效率和可执行性。直接给出可操作的建议。',
  Brainstorm: '你是一个创意伙伴，用发散创意的口吻，鼓励新想法，不要过早否定。可以大胆提出非常规想法。'
};

function buildSystemPrompt(mode: string, intent: string) {
  return `${MODE_STYLES[mode] || MODE_STYLES.Study}

${INTENT_PROMPTS[intent] || INTENT_PROMPTS.clarify}

请用中文回答，内容要详细有价值。结构清晰，分点说明。`;
}

function buildUserMessage(data: any) {
  let msg = `【当前状态】
- 模式: ${data.mode}
- 主题: ${data.topic || '未设定'}
- 目标: ${data.goal || '未设定'}
- 当前页面: ${data.context?.title || '未知'} (${data.context?.domain || ''})

【用户请求】
${data.userInput}`;

  if (data.context?.pageSnippet) {
    msg += `

【页面内容参考】
${data.context.pageSnippet.slice(0, 1500)}`;
  }

  return msg;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mode, intent } = body;

    const apiKey = process.env.OPENAI_API_KEY;
    const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
    const model = process.env.OPENAI_MODEL || 'deepseek-chat';

    if (!apiKey) {
      return NextResponse.json(
        { error: '缺少 API Key' },
        { status: 500, headers: corsHeaders }
      );
    }

    const systemPrompt = buildSystemPrompt(mode, intent);
    const userMessage = buildUserMessage(body);

    // 使用流式输出
    const upstream = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: mode === 'Brainstorm' ? 0.8 : 0.6,
        max_tokens: 1500,
        stream: true,
      }),
    });

    if (!upstream.ok) {
      const errText = await upstream.text();
      console.error('OpenAI error:', errText);
      return NextResponse.json(
        { error: 'AI 服务暂时不可用' },
        { status: 502, headers: corsHeaders }
      );
    }

    // 流式转发
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const readable = new ReadableStream({
      async start(controller) {
        const reader = upstream.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        let buffer = '';

        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            let sepIndex: number;
            while ((sepIndex = buffer.indexOf('\n\n')) !== -1) {
              const eventChunk = buffer.slice(0, sepIndex);
              buffer = buffer.slice(sepIndex + 2);

              const lines = eventChunk.split('\n').map(l => l.trim());
              for (const line of lines) {
                if (!line.startsWith('data:')) continue;
                const data = line.slice(5).trim();
                if (!data || data === '[DONE]') continue;

                try {
                  const json = JSON.parse(data);
                  const deltaContent =
                    json?.choices?.[0]?.delta?.content ||
                    json?.choices?.[0]?.message?.content ||
                    '';
                  if (deltaContent) {
                    controller.enqueue(encoder.encode(deltaContent));
                  }
                } catch {}
              }
            }
          }
        } catch (e) {
          console.error('Stream error:', e);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Accel-Buffering': 'no',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    console.error('Ask error:', error);
    return NextResponse.json(
      { error: '请求失败' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}
