import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { cookies } from 'next/headers';
import { randomUUID } from 'crypto';
// 绕过单例，强制使用新实例以解决开发环境 Schema 缓存问题
import { PrismaClient } from '@/app/generated/prisma';
import { memoryDB } from '@/app/lib/memory-db';

const prisma = new PrismaClient();

// 允许在数据库或鉴权不可用时回退；生产环境也默认开启
const MEMORY_FALLBACK_ENABLED =
  (process.env.ENABLE_MEMORY_DB_FALLBACK || 'true').toLowerCase() === 'true';

// 判断数据库不可用的特征错误
const isDbUnavailable = (error: any) =>
  error?.message?.includes('does not exist') ||
  error?.code === 'P2010' ||
  error?.message?.includes('Connection');

// 统一解析用户：优先 Clerk，失败则使用 guest cookie
const resolveUser = async (req: NextRequest) => {
  let userId: string | null = null;
  let shouldSetCookie = false;

  try {
    const authData = await auth();
    userId = authData.userId;
  } catch (e) {
    console.warn('Clerk auth failed:', e);
  }

  if (!userId) {
    const store = cookies();
    const guest = store.get('guest_id');
    if (guest?.value) {
      userId = guest.value;
    } else {
      userId = `guest-${randomUUID()}`;
      shouldSetCookie = true;
    }
  }

  return { userId, shouldSetCookie };
};

const respond = (payload: any, shouldSetCookie: boolean, userId: string) => {
  const res = NextResponse.json(payload);
  if (shouldSetCookie) {
    res.cookies.set('guest_id', userId, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 180, // 180 天
      path: '/',
    });
  }
  return res;
};

export async function GET(req: NextRequest) {
  try {
    const { userId, shouldSetCookie } = await resolveUser(req);
    if (!userId) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const type = searchParams.get('type') || undefined;
    const search = searchParams.get('search') || undefined;
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    const where: any = { userId, isArchived: false };
    if (type) where.type = type;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { subject: { contains: search, mode: 'insensitive' } },
        { topic: { contains: search, mode: 'insensitive' } },
      ];
    }

    try {
      const [conversations, total] = await Promise.all([
        prisma.conversation.findMany({
          where,
          orderBy: { lastActivity: 'desc' },
          skip,
          take: limit,
          include: { learningSession: true },
        }),
        prisma.conversation.count({ where }),
      ]);

      return respond(
        {
          conversations,
          total,
          page,
          limit,
          hasMore: skip + conversations.length < total,
        },
        shouldSetCookie,
        userId,
      );
    } catch (dbError: any) {
      if (MEMORY_FALLBACK_ENABLED && isDbUnavailable(dbError)) {
        console.warn('⚠️ [GET] 数据库不可用，切换内存数据库');
        const conversations = await memoryDB.getConversations(where);
        return respond(
          {
            conversations,
            total: conversations.length,
            page: 1,
            limit: 100,
            hasMore: false,
            source: 'memory',
          },
          shouldSetCookie,
          userId,
        );
      }
      throw dbError;
    }
  } catch (error) {
    console.error('获取对话列表失败:', error);
    return NextResponse.json({ error: '获取对话列表失败' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { title, type, initialMessage, subject, topic, aiExplanation, learningSession } = body;

  try {
    const { userId, shouldSetCookie } = await resolveUser(req);
    if (!userId) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const messages = initialMessage ? [initialMessage] : [];
    const createData: any = {
      userId,
      title: title || (type === 'learning' ? `${subject} - ${topic}` : '新对话'),
      type: type || 'general',
      messages,
      messageCount: messages.length,
      subject,
      topic,
      aiExplanation,
    };

    if (learningSession) {
      createData.learningSession = {
        create: {
          userId,
          subject: learningSession.subject || subject,
          topic: learningSession.topic || topic,
          currentStep: learningSession.currentStep || 'DIAGNOSE',
          isCompleted: false,
        },
      };
    }

    // 学习型对话去重
    if (type === 'learning' && subject && topic) {
      try {
        const existing = await prisma.conversation.findFirst({
          where: { userId, type: 'learning', subject, topic, isArchived: false },
          include: { learningSession: true },
        });
        if (existing) {
          const updated = await prisma.conversation.update({
            where: { id: existing.id },
            data: {
              lastActivity: new Date(),
              updatedAt: new Date(),
              aiExplanation: aiExplanation || existing.aiExplanation,
              messages: initialMessage
                ? [...((existing.messages as any[]) || []), initialMessage]
                : existing.messages || [],
              messageCount: initialMessage
                ? (existing.messageCount || 0) + 1
                : existing.messageCount,
            },
            include: { learningSession: true },
          });
          return respond(updated, shouldSetCookie, userId);
        }
      } catch (dbError: any) {
        if (!(MEMORY_FALLBACK_ENABLED && isDbUnavailable(dbError))) {
          throw dbError;
        }
        console.warn('⚠️ [POST-Check] DB 不可用，改用内存检查');
        const memConvs = await memoryDB.getConversations({ userId, type: 'learning' });
        const existing = memConvs.find((c: any) => c.subject === subject && c.topic === topic);
        if (existing) {
          const updated = await memoryDB.updateConversation(
            existing.id,
            {
              messages: initialMessage ? [...(existing.messages || []), initialMessage] : existing.messages,
              aiExplanation: aiExplanation || existing.aiExplanation,
            },
            userId,
          );
          return respond(updated, shouldSetCookie, userId);
        }
      }
    }

    try {
      const conversation = await prisma.conversation.create({
        data: createData,
        include: { learningSession: true },
      });
      return respond(conversation, shouldSetCookie, userId);
    } catch (dbError: any) {
      if (MEMORY_FALLBACK_ENABLED && isDbUnavailable(dbError)) {
        console.warn('🚨 [POST] DB 不可用，使用内存数据库');
        const conversation = await memoryDB.createConversation(createData);
        return respond(conversation, shouldSetCookie, userId);
      }
      throw dbError;
    }
  } catch (error: any) {
    console.error('创建对话失败:', error);
    return NextResponse.json(
      {
        error: '创建对话失败',
        details: error?.message || String(error),
      },
      { status: 500 },
    );
  }
}
