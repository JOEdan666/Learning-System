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
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: '缺少 sessionId' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (shouldUseMemory()) {
      partnerMemory.updateSessionStatus(sessionId, 'saved');
      partnerMemory.updateAssetsStatus(sessionId, 'saved');
    } else {
      try {
        await prisma.partnerSession.update({
          where: { id: sessionId },
          data: { status: 'saved' },
        });

        await prisma.partnerAsset.updateMany({
          where: { sessionId, status: 'draft' },
          data: { status: 'saved' },
        });
      } catch (error) {
        if (isDbUnavailable(error)) {
          markMemoryFallback();
          partnerMemory.updateSessionStatus(sessionId, 'saved');
          partnerMemory.updateAssetsStatus(sessionId, 'saved');
        } else {
          throw error;
        }
      }
    }

    return NextResponse.json(
      { ok: true, sessionUrl: `/workspace?session=${sessionId}` },
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

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}
