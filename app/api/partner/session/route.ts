import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { partnerMemory, isDbUnavailable, markMemoryFallback, shouldUseMemory } from '@/app/api/partner/_memory';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query')?.trim();
    const mode = searchParams.get('mode')?.trim();
    const domain = searchParams.get('domain')?.trim();

    const where: any = {};
    if (mode) where.mode = mode;
    if (domain) where.pageDomain = domain;
    if (query) {
      where.OR = [
        { topic: { contains: query, mode: 'insensitive' } },
        { goal: { contains: query, mode: 'insensitive' } },
        { pageTitle: { contains: query, mode: 'insensitive' } },
        { pageUrl: { contains: query, mode: 'insensitive' } },
        { messages: { some: { content: { contains: query, mode: 'insensitive' } } } },
      ];
    }

    let payload: any[] = [];

    if (shouldUseMemory()) {
      const sessions = partnerMemory.listSessions({ query, mode, domain });
      payload = sessions.map(session => ({
        id: session.id,
        mode: session.mode,
        topic: session.topic,
        pageTitle: session.pageTitle,
        pageDomain: session.pageDomain,
        messageCount: partnerMemory.getSessionMessages(session.id).length,
        assetCount: partnerMemory.getSessionAssets(session.id).length,
        status: session.status,
        createdAt: session.createdAt.toISOString(),
      }));
    } else {
      try {
        const sessions = await prisma.partnerSession.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: 50,
          include: {
            _count: {
              select: { messages: true, assets: true },
            },
          },
        });

        payload = sessions.map(session => ({
          id: session.id,
          mode: session.mode,
          topic: session.topic,
          pageTitle: session.pageTitle,
          pageDomain: session.pageDomain,
          messageCount: session._count.messages,
          assetCount: session._count.assets,
          status: session.status,
          createdAt: session.createdAt.toISOString(),
        }));
      } catch (error) {
        if (isDbUnavailable(error)) {
          markMemoryFallback();
          const sessions = partnerMemory.listSessions({ query, mode, domain });
          payload = sessions.map(session => ({
            id: session.id,
            mode: session.mode,
            topic: session.topic,
            pageTitle: session.pageTitle,
            pageDomain: session.pageDomain,
            messageCount: partnerMemory.getSessionMessages(session.id).length,
            assetCount: partnerMemory.getSessionAssets(session.id).length,
            status: session.status,
            createdAt: session.createdAt.toISOString(),
          }));
        } else {
          throw error;
        }
      }
    }

    return NextResponse.json(
      { sessions: payload, total: payload.length },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('List sessions error:', error);
    return NextResponse.json(
      { error: '获取列表失败' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}
