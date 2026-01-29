import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/app/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
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
  } catch (error) {
    console.error('获取对话列表失败:', error);
    return NextResponse.json({ error: '获取对话列表失败' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const body = await req.json();
    const { title, type, initialMessage, subject, topic, aiExplanation, learningSession } = body;

    // 如果是学习类型，检查是否已存在
    if (type === 'learning' && subject && topic) {
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
              ? [...(existing.messages as any[]), initialMessage]
              : existing.messages,
            messageCount: initialMessage 
              ? (existing.messageCount || 0) + 1
              : existing.messageCount,
          },
          include: { learningSession: true },
        });
        return NextResponse.json(updated);
      }
    }

    // 创建新对话
    const messages = initialMessage ? [initialMessage] : [];
    
    // 准备创建数据
    const data: any = {
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
      data.learningSession = {
        create: {
          userId,
          subject: learningSession.subject || subject,
          topic: learningSession.topic || topic,
          currentStep: learningSession.currentStep || 'DIAGNOSE',
          isCompleted: false,
        }
      };
    }

    const conversation = await prisma.conversation.create({
      data,
      include: { learningSession: true },
    });

    return NextResponse.json(conversation);
  } catch (error) {
    console.error('创建对话失败:', error);
    return NextResponse.json({ error: '创建对话失败' }, { status: 500 });
  }
}
