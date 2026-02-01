import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/app/lib/prisma';
import { memoryDB } from '@/app/lib/memory-db';

// 检查是否是数据库不可用错误
const isDbUnavailable = (error: any) => {
  return process.env.NODE_ENV === 'development' && (
    error?.message?.includes('does not exist') ||
    error?.code === 'P2010' ||
    error?.message?.includes('Connection')
  );
};

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    let userId: string | null = null;
    try {
      const authData = await auth();
      userId = authData.userId;
    } catch (e) {
      console.warn('Clerk auth failed:', e);
    }

    if (!userId && process.env.NODE_ENV === 'development') {
      userId = 'mock-dev-user';
    }

    if (!userId) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    try {
      const conversation = await prisma.conversation.findUnique({
        where: {
          id: params.id,
          userId,
        },
        include: {
          learningSession: true,
        },
      });

      if (!conversation) {
        return NextResponse.json({ error: '对话不存在' }, { status: 404 });
      }

      return NextResponse.json(conversation);
    } catch (dbError: any) {
      if (isDbUnavailable(dbError)) {
        console.warn('⚠️ [GET/:id] 数据库不可用，使用内存数据库');
        const conv = await memoryDB.getConversation(params.id, userId);
        if (!conv) {
          return NextResponse.json({ error: '对话不存在' }, { status: 404 });
        }
        return NextResponse.json(conv);
      }
      throw dbError;
    }
  } catch (error) {
    console.error('获取对话失败:', error);
    return NextResponse.json({ error: '获取对话失败' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    let userId: string | null = null;
    try {
      const authData = await auth();
      userId = authData.userId;
    } catch (e) {
      console.warn('Clerk auth failed:', e);
    }

    if (!userId && process.env.NODE_ENV === 'development') {
      userId = 'mock-dev-user';
    }

    if (!userId) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const body = await req.json();
    const { title, messages, isArchived, tags, aiExplanation } = body;

    const data: any = {
      updatedAt: new Date(),
      lastActivity: new Date(),
    };

    if (title !== undefined) data.title = title;
    if (messages !== undefined) {
      data.messages = messages;
      data.messageCount = messages.length;
    }
    if (isArchived !== undefined) data.isArchived = isArchived;
    if (tags !== undefined) data.tags = tags;
    if (aiExplanation !== undefined) data.aiExplanation = aiExplanation;

    try {
      // 验证所有权
      const existing = await prisma.conversation.findUnique({
        where: { id: params.id, userId },
      });

      if (!existing) {
        return NextResponse.json({ error: '对话不存在' }, { status: 404 });
      }

      const updated = await prisma.conversation.update({
        where: { id: params.id },
        data,
        include: { learningSession: true },
      });

      return NextResponse.json(updated);
    } catch (dbError: any) {
      if (isDbUnavailable(dbError)) {
        console.warn('⚠️ [PUT/:id] 数据库不可用，使用内存数据库');
        const updated = await memoryDB.updateConversation(params.id, data, userId);
        if (!updated) {
          return NextResponse.json({ error: '对话不存在' }, { status: 404 });
        }
        return NextResponse.json(updated);
      }
      throw dbError;
    }
  } catch (error) {
    console.error('更新对话失败:', error);
    return NextResponse.json({ error: '更新对话失败' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    let userId: string | null = null;
    try {
      const authData = await auth();
      userId = authData.userId;
    } catch (e) {
      console.warn('Clerk auth failed:', e);
    }

    if (!userId && process.env.NODE_ENV === 'development') {
      userId = 'mock-dev-user';
    }

    if (!userId) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    try {
      const result = await prisma.conversation.deleteMany({
        where: {
          id: params.id,
          userId,
        },
      });

      if (result.count === 0) {
        return NextResponse.json({ error: '对话不存在或无权删除' }, { status: 404 });
      }

      return NextResponse.json({ success: true });
    } catch (dbError: any) {
      if (isDbUnavailable(dbError)) {
        console.warn('⚠️ [DELETE/:id] 数据库不可用，使用内存数据库');
        const deleted = await memoryDB.deleteConversation(params.id, userId);
        if (!deleted) {
          return NextResponse.json({ error: '对话不存在或无权删除' }, { status: 404 });
        }
        return NextResponse.json({ success: true });
      }
      throw dbError;
    }
  } catch (error) {
    console.error('删除对话失败:', error);
    return NextResponse.json({ error: '删除对话失败' }, { status: 500 });
  }
}
