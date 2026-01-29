import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/app/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const conversation = await prisma.conversation.findUnique({
      where: {
        id: params.id,
        userId, // 确保只能访问自己的对话
      },
      include: {
        learningSession: true,
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: '对话不存在' }, { status: 404 });
    }

    return NextResponse.json(conversation);
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
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const body = await req.json();
    const { title, messages, isArchived, tags, aiExplanation } = body;

    // 验证所有权
    const existing = await prisma.conversation.findUnique({
      where: { id: params.id, userId },
    });

    if (!existing) {
      return NextResponse.json({ error: '对话不存在' }, { status: 404 });
    }

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

    const updated = await prisma.conversation.update({
      where: { id: params.id },
      data,
      include: { learningSession: true },
    });

    return NextResponse.json(updated);
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
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    // 验证所有权并删除
    // deleteMany 即使没有找到记录也不会报错，但可以确保 userId 匹配
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
  } catch (error) {
    console.error('删除对话失败:', error);
    return NextResponse.json({ error: '删除对话失败' }, { status: 500 });
  }
}
