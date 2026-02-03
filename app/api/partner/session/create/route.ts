import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { partnerMemory, isDbUnavailable, markMemoryFallback, shouldUseMemory } from '@/app/api/partner/_memory';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const payload = {
      mode: body.mode || 'Study',
      topic: body.topic || null,
      goal: body.goal || null,
      pageUrl: body.pageUrl || null,
      pageTitle: body.pageTitle || null,
      pageDomain: body.pageDomain || null,
      contextSnippet: body.contextSnippet || null,
      recentSignalsJson: body.recentSignals ? JSON.stringify(body.recentSignals) : null,
      status: 'draft',
    };

    if (shouldUseMemory()) {
      const session = partnerMemory.createSession(payload);
      return NextResponse.json(
        { sessionId: session.id, createdAt: session.createdAt.toISOString() },
        { headers: corsHeaders }
      );
    }

    try {
      const session = await prisma.partnerSession.create({ data: payload });
      return NextResponse.json(
        { sessionId: session.id, createdAt: session.createdAt.toISOString() },
        { headers: corsHeaders }
      );
    } catch (error) {
      if (isDbUnavailable(error)) {
        markMemoryFallback();
        const session = partnerMemory.createSession(payload);
        return NextResponse.json(
          { sessionId: session.id, createdAt: session.createdAt.toISOString() },
          { headers: corsHeaders }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error('Create session error:', error);
    return NextResponse.json(
      { error: '创建 session 失败' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}
