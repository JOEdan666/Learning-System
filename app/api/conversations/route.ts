import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
// 绕过单例，强制使用新实例以解决开发环境Schema缓存问题
import { PrismaClient } from '@/app/generated/prisma';
import { memoryDB } from '@/app/lib/memory-db';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    let userId: string | null = null;
    
    // 尝试获取用户ID，捕获所有可能的错误
    try {
      const authData = await auth();
      userId = authData.userId;
    } catch (e) {
      console.warn('Clerk auth failed:', e);
    }
    
    // 开发环境兜底：如果未登录，使用模拟用户ID
    if (!userId && process.env.NODE_ENV === 'development') {
      userId = 'mock-dev-user';
      console.log('⚠️ 开发模式：使用模拟用户ID (GET)');
    }

    if (!userId) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const type = searchParams.get('type') || undefined;
    const search = searchParams.get('search') || undefined;
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    const where: any = {
      userId,
      isArchived: false,
    };

    if (type) {
      where.type = type;
    }

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
          include: {
            learningSession: true,
          },
        }),
        prisma.conversation.count({ where }),
      ]);

      return NextResponse.json({
        conversations,
        total,
        page,
        limit,
        hasMore: skip + conversations.length < total,
      });
    } catch (dbError: any) {
      // 数据库故障兜底
      if (process.env.NODE_ENV === 'development' && 
          (dbError.message?.includes('does not exist') || dbError.code === 'P2010')) {
        console.warn('⚠️ [GET] 数据库不可用，切换至内存数据库');
        const conversations = await memoryDB.getConversations(where);
        return NextResponse.json({
          conversations,
          total: conversations.length,
          page: 1,
          limit: 100,
          hasMore: false,
          source: 'memory'
        });
      }
      throw dbError;
    }
  } catch (error) {
    console.error('获取对话列表失败:', error);
    return NextResponse.json({ error: '获取对话列表失败' }, { status: 500 });
  }
}

// 检查是否是数据库不可用错误
const isDbUnavailable = (error: any) => {
  return process.env.NODE_ENV === 'development' && (
    error?.message?.includes('does not exist') ||
    error?.code === 'P2010' ||
    error?.message?.includes('Connection')
  );
};

export async function POST(req: NextRequest) {
  // 先读取 body，避免多次读取流
  const body = await req.json();
  const { title, type, initialMessage, subject, topic, aiExplanation, learningSession } = body;

  try {
    let userId: string | null = null;

    // 尝试获取用户ID，捕获所有可能的错误
    try {
      const authData = await auth();
      userId = authData.userId;
    } catch (e) {
      console.warn('Clerk auth failed:', e);
    }

    // 开发环境兜底：如果未登录，使用模拟用户ID
    if (!userId && process.env.NODE_ENV === 'development') {
      userId = 'mock-dev-user';
      console.log('⚠️ 开发模式：使用模拟用户ID (POST)');
    }

    if (!userId) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    // 准备创建数据 - 提前定义以便在 catch 中也能访问
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

    // 如果有 learningSession 数据，同时创建
    if (learningSession) {
      createData.learningSession = {
        create: {
          userId,
          subject: learningSession.subject || subject,
          topic: learningSession.topic || topic,
          currentStep: learningSession.currentStep || 'DIAGNOSE',
          isCompleted: false,
        }
      };
    }

    // 如果是学习类型，检查是否已存在
    if (type === 'learning' && subject && topic) {
      try {
        const existing = await prisma.conversation.findFirst({
          where: {
            userId,
            type: 'learning',
            subject,
            topic,
            isArchived: false,
          },
          include: { learningSession: true },
        });

        if (existing) {
          // 更新现有对话
          const updated = await prisma.conversation.update({
            where: { id: existing.id },
            data: {
              lastActivity: new Date(),
              updatedAt: new Date(),
              aiExplanation: aiExplanation || existing.aiExplanation,
              messages: initialMessage
                ? [...((existing.messages as any[]) || []), initialMessage]
                : (existing.messages || []),
              messageCount: initialMessage
                ? (existing.messageCount || 0) + 1
                : existing.messageCount,
            },
            include: { learningSession: true },
          });
          return NextResponse.json(updated);
        }
      } catch (dbError: any) {
        if (isDbUnavailable(dbError)) {
          console.warn('⚠️ [POST-Check] 数据库不可用，使用内存数据库检查');
          // 在内存数据库中检查是否已存在
          const memConversations = await memoryDB.getConversations({ userId, type: 'learning' });
          const existing = memConversations.find((c: any) => c.subject === subject && c.topic === topic);
          if (existing) {
            const updated = await memoryDB.updateConversation(existing.id, {
              messages: initialMessage
                ? [...(existing.messages || []), initialMessage]
                : existing.messages,
              aiExplanation: aiExplanation || existing.aiExplanation,
            }, userId);
            return NextResponse.json(updated);
          }
          // 不存在则继续创建流程
        } else {
          throw dbError;
        }
      }
    }

    try {
      const conversation = await prisma.conversation.create({
        data: createData,
        include: { learningSession: true },
      });
      return NextResponse.json(conversation);
    } catch (dbError: any) {
      if (isDbUnavailable(dbError)) {
        console.warn('🚨 [POST] 数据库不可用，使用内存数据库创建');
        const conversation = await memoryDB.createConversation(createData);
        console.log('✅ [POST] 内存数据库创建成功:', conversation.id);
        return NextResponse.json(conversation);
      }
      throw dbError;
    }
  } catch (error: any) {
    console.error('创建对话失败:', error);
    return NextResponse.json({
      error: '创建对话失败',
      details: error?.message || String(error),
    }, { status: 500 });
  }
}
