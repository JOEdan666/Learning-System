import { NextRequest, NextResponse } from 'next/server';
import LearningProgressService from '@/app/services/learningProgressService';
import { PrismaClient } from '@/app/generated/prisma';
const prisma = new PrismaClient();

// GET - 获取学习进度
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    const includeStats = searchParams.get('includeStats') === 'true';
    const getAllSessions = searchParams.get('getAllSessions') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // 如果请求获取所有学习会话
    if (getAllSessions) {
      const sessions = await LearningProgressService.getAllLearningSessions(limit, offset);
      return NextResponse.json({
        success: true,
        sessions: sessions
      });
    }

    // 如果没有conversationId，返回错误
    if (!conversationId) {
      return NextResponse.json(
        { error: '缺少conversationId参数' },
        { status: 400 }
      );
    }

    let progress;
    if (includeStats) {
      // 获取完整的学习数据（包含统计信息）
      progress = await LearningProgressService.getCompleteLearningData(conversationId);
    } else {
      // 只获取基本学习进度
      progress = await LearningProgressService.getLearningProgress(conversationId);
    }
    
    if (!progress) {
      return NextResponse.json(
        { error: '未找到学习进度' },
        { status: 404 }
      );
    }

    return NextResponse.json(progress);
  } catch (error) {
    console.error('获取学习进度失败:', error);
    return NextResponse.json(
      { error: '获取学习进度失败' },
      { status: 500 }
    );
  }
}

// POST - 保存学习进度
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    const {
      conversationId,
      subject,
      topic,
      aiExplanation,
      socraticDialogue,
      currentStep,
      isCompleted,
      region,
      grade,
      coachingHistory,
      finalScore,
      feedback,
      reviewNotes,
      quizQuestions,
      userAnswers,
      stats
    } = data;

    if (!conversationId) {
      return NextResponse.json(
        { error: '缺少conversationId参数' },
        { status: 400 }
      );
    }

    // 保存基本学习进度
    const progress = await LearningProgressService.saveLearningProgress({
      conversationId,
      subject,
      topic,
      aiExplanation,
      socraticDialogue,
      currentStep,
      isCompleted,
      region,
      grade,
      coachingHistory,
      finalScore,
      feedback,
      reviewNotes
    });

    // 如果有练习题，保存练习题
    if (quizQuestions && quizQuestions.length > 0) {
      await LearningProgressService.saveQuizQuestions(progress.id, quizQuestions);
    }

    // 如果有用户答案，保存用户答案（将前端索引/占位ID映射为数据库真实题目ID）
    if (userAnswers && userAnswers.length > 0) {
      try {
        // 获取该会话的题目列表，按order排序
        const questions = await prisma.quizQuestion.findMany({
          where: { sessionId: progress.id },
          orderBy: { order: 'asc' },
          select: { id: true, order: true, question: true }
        });

        const mapped = userAnswers
          .map((ans: any, idx: number) => {
            const qByIndex = questions[idx];
            // 支持questionId为数字/字符串索引用于回退匹配
            const raw = ans.questionId as any;
            const num = typeof raw === 'number' ? raw : (raw && /^\d+$/.test(String(raw)) ? parseInt(String(raw), 10) : NaN);
            const qByOrder = Number.isFinite(num)
              ? (questions.find(q => q.order === num) || questions.find(q => q.order === num + 1))
              : undefined;
            const realId = (qByIndex?.id) || (qByOrder?.id);
            if (!realId) return null;
            return {
              ...ans,
              questionId: realId,
            };
          })
          .filter(Boolean);

        if (mapped.length > 0) {
          await LearningProgressService.saveUserAnswers(progress.id, mapped as any);
        }
      } catch (e) {
        console.warn('用户答案ID映射失败，跳过保存用户答案:', e);
      }
    }

    // 如果有统计数据，保存统计数据
    if (stats) {
      await LearningProgressService.updateLearningStats(conversationId, stats);
    }

    return NextResponse.json(progress, { status: 201 });
  } catch (error) {
    console.error('保存学习进度失败:', error);
    return NextResponse.json(
      { error: '保存学习进度失败' },
      { status: 500 }
    );
  }
}

// PUT - 更新学习进度
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { conversationId, aiExplanation, socraticDialogue, currentStep, isCompleted } = body;

    if (!conversationId) {
      return NextResponse.json(
        { error: '缺少conversationId参数' },
        { status: 400 }
      );
    }

    // 读取现有会话，避免覆盖必填字段为空字符串
    const existing = await LearningProgressService.getLearningProgress(conversationId);
    const learningProgress = await LearningProgressService.saveLearningProgress({
      conversationId,
      subject: existing?.subject || '未设置',
      topic: existing?.topic || '未设置',
      aiExplanation,
      socraticDialogue,
      currentStep,
      isCompleted
    });

    return NextResponse.json(learningProgress);
  } catch (error) {
    console.error('更新学习进度失败:', error);
    return NextResponse.json(
      { error: '更新学习进度失败' },
      { status: 500 }
    );
  }
}

// DELETE - 删除学习进度
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');

    if (!conversationId) {
      return NextResponse.json(
        { error: '缺少conversationId参数' },
        { status: 400 }
      );
    }

    await LearningProgressService.deleteLearningProgress(conversationId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除学习进度失败:', error);
    return NextResponse.json(
      { error: '删除学习进度失败' },
      { status: 500 }
    );
  }
}
