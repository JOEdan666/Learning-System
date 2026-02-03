import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { partnerMemory, isDbUnavailable, markMemoryFallback, shouldUseMemory } from '@/app/api/partner/_memory';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function parseJson(value: string | null) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export async function GET(_request: NextRequest, context: { params: { id: string } }) {
  try {
    const { id } = context.params;
    let session: any = null;
    let messages: any[] = [];
    let assets: any[] = [];

    if (shouldUseMemory()) {
      session = partnerMemory.getSession(id);
      messages = partnerMemory.getSessionMessages(id);
      assets = partnerMemory.getSessionAssets(id);
    } else {
      try {
        session = await prisma.partnerSession.findUnique({
          where: { id },
          include: {
            messages: { orderBy: { createdAt: 'asc' } },
            assets: { orderBy: { createdAt: 'asc' } },
          },
        });
        messages = session?.messages || [];
        assets = session?.assets || [];
      } catch (error) {
        if (isDbUnavailable(error)) {
          markMemoryFallback();
          session = partnerMemory.getSession(id);
          messages = partnerMemory.getSessionMessages(id);
          assets = partnerMemory.getSessionAssets(id);
        } else {
          throw error;
        }
      }
    }

    if (!session) {
      return NextResponse.json(
        { error: 'Session 不存在' },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      {
        session: {
          id: session.id,
          mode: session.mode,
          topic: session.topic,
          goal: session.goal,
          pageUrl: session.pageUrl,
          pageTitle: session.pageTitle,
          pageDomain: session.pageDomain,
          status: session.status,
          createdAt: session.createdAt.toISOString(),
        },
        messages: messages.map(message => ({
          id: message.id,
          role: message.role,
          content: message.content,
          contentJson: parseJson(message.contentJson),
          createdAt: message.createdAt.toISOString(),
        })),
        assets: assets.map(asset => ({
          id: asset.id,
          type: asset.type,
          title: asset.title,
          content: parseJson(asset.contentJson),
          actionItems: parseJson(asset.actionItemsJson),
          citations: parseJson(asset.citationsJson),
          status: asset.status,
          createdAt: asset.createdAt.toISOString(),
        })),
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('Get session error:', error);
    return NextResponse.json(
      { error: '获取详情失败' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function DELETE(_request: NextRequest, context: { params: { id: string } }) {
  try {
    const { id } = context.params;
    if (shouldUseMemory()) {
      partnerMemory.deleteSession(id);
    } else {
      try {
        await prisma.partnerSession.delete({ where: { id } });
      } catch (error) {
        if (isDbUnavailable(error)) {
          markMemoryFallback();
          partnerMemory.deleteSession(id);
        } else {
          throw error;
        }
      }
    }
    return NextResponse.json(
      { ok: true },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('Delete session error:', error);
    return NextResponse.json(
      { error: '删除失败' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}
