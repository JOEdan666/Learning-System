import { NextRequest, NextResponse } from 'next/server';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const SYSTEM_PROMPT = `你是一个阅读助手，帮助用户快速理解网页内容。

请根据提供的页面内容，生成简洁的摘要。你必须严格按照以下 JSON 格式返回：

{
  "gistTldr3": ["要点1", "要点2", "要点3"],
  "keyPoints": ["关键点1", "关键点2", "关键点3"],
  "citations": [{"quote": "原文引用", "source": "page", "url": "页面URL"}]
}

要求：
- gistTldr3: 3条核心要点，每条不超过30字
- keyPoints: 3-5个关键点
- citations: 至少1条原文引用，quote 必须是页面中的原文

只返回 JSON，不要任何其他内容。`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, title, pageSnippet } = body;

    if (!pageSnippet || pageSnippet.length < 30) {
      return NextResponse.json(
        { error: '页面内容太短' },
        { status: 400, headers: corsHeaders }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
    const model = process.env.OPENAI_MODEL || 'deepseek-chat';

    if (!apiKey) {
      return NextResponse.json(
        { error: '缺少 API Key 配置' },
        { status: 500, headers: corsHeaders }
      );
    }

    const userMessage = `页面标题: ${title || '未知'}
页面URL: ${url || '未知'}

页面内容:
${pageSnippet.slice(0, 2000)}`;

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.3,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('OpenAI API error:', errText);
      return NextResponse.json(
        { error: 'AI 服务暂时不可用' },
        { status: 502, headers: corsHeaders }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    // Parse JSON response
    try {
      // 尝试提取 JSON（处理可能的 markdown 代码块）
      let jsonStr = content;
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }

      const parsed = JSON.parse(jsonStr.trim());

      // 确保 citations 有 url
      if (parsed.citations) {
        parsed.citations = parsed.citations.map((c: any) => ({
          ...c,
          url: c.url || url || ''
        }));
      }

      return NextResponse.json(parsed, { headers: corsHeaders });
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      // 返回一个基本的结构
      return NextResponse.json({
        gistTldr3: [content.slice(0, 100) || '无法解析页面内容'],
        keyPoints: [],
        citations: [{ quote: pageSnippet.slice(0, 80), source: 'page', url: url || '' }]
      }, { headers: corsHeaders });
    }

  } catch (error) {
    console.error('Page gist error:', error);
    return NextResponse.json(
      { error: '分析页面失败' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}
