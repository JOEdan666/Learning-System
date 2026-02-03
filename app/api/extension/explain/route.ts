import { NextRequest, NextResponse } from 'next/server';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const SYSTEM_PROMPT = `用简洁中文解释用户选中的文字。返回JSON格式：
{"tldr3":["要点1","要点2","要点3"],"explainFull":"50字解释","citations":[{"quote":"原文片段","source":"selection"}]}
只返回JSON。`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, selectionText } = body;

    if (!selectionText || selectionText.trim().length === 0) {
      return NextResponse.json(
        { error: '没有选中任何文字' },
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

    // 精简输入，只发选中文字
    const userMessage = `解释: "${selectionText.slice(0, 500)}"`;

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
        max_tokens: 400,
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
      let jsonStr = content;
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }

      const parsed = JSON.parse(jsonStr.trim());

      // 确保 citations 有 url
      if (!parsed.citations || parsed.citations.length === 0) {
        parsed.citations = [{
          quote: selectionText.slice(0, 60),
          source: 'selection',
          url: url || ''
        }];
      }

      return NextResponse.json(parsed, { headers: corsHeaders });
    } catch {
      // 解析失败，直接返回文本
      return NextResponse.json({
        tldr3: [content.slice(0, 100) || '解释生成中...'],
        explainFull: content,
        citations: [{ quote: selectionText.slice(0, 60), source: 'selection', url: url || '' }]
      }, { headers: corsHeaders });
    }

  } catch (error) {
    console.error('Explain error:', error);
    return NextResponse.json(
      { error: '生成解释失败' },
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
