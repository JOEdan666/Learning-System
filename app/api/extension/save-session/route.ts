import { NextRequest, NextResponse } from 'next/server';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// In-memory storage for Day1 (will be replaced with DB in Day2)
const sessions: any[] = [];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { worldState, userInput, intent, result } = body;

    const session = {
      id: `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      worldState: {
        mode: worldState?.mode || 'Study',
        topic: worldState?.topic || '',
        goal: worldState?.goal || '',
        context: {
          url: worldState?.context?.url || '',
          title: worldState?.context?.title || '',
          domain: worldState?.context?.domain || '',
        }
      },
      userInput: userInput || '',
      intent: intent || 'custom',
      result: {
        // 支持新的纯文本格式和旧的结构化格式
        content: result?.content || '',
        conclusion: result?.conclusion || '',
        reasoning: result?.reasoning || '',
        actions: result?.actions || [],
        citations: result?.citations || []
      },
      timestamp: Date.now(),
      saved: true
    };

    // Store in memory (Day1)
    sessions.unshift(session);

    // Keep only last 50 sessions
    if (sessions.length > 50) {
      sessions.pop();
    }

    console.log('[Save Session] Saved:', session.id);

    return NextResponse.json(
      { success: true, sessionId: session.id },
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('Save session error:', error);
    return NextResponse.json(
      { error: '保存失败' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// GET endpoint for /today page
export async function GET() {
  return NextResponse.json(
    { sessions: sessions.slice(0, 20) },
    { headers: corsHeaders }
  );
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}
