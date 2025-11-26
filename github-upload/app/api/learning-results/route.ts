import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '../../generated/prisma';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');

    if (!conversationId) {
      return NextResponse.json(
        { error: '缺少conversationId参数' },
        { status: 400 }
      );
    }

    // 获取学习会话数据
    const session = await prisma.learningSession.findUnique({
      where: { conversationId },
      include: {
        quizQuestions: true,
        userAnswers: true
      }
    });

    if (!session) {
      return NextResponse.json(
        { error: '未找到学习会话' },
        { status: 404 }
      );
    }

    // 获取学习统计数据
    const stats = await prisma.learningStats.findUnique({
      where: { conversationId }
    });

    // 计算真实的测验成绩
    const totalQuestions = session.quizQuestions.length;
    const correctAnswers = session.userAnswers.filter(answer => answer.isCorrect).length;
    const totalScore = session.userAnswers.reduce((sum, answer) => sum + answer.score, 0);
    const maxPossibleScore = session.quizQuestions.reduce((sum, question) => sum + question.points, 0);
    const accuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

    // 计算理解程度（基于正确率和答题时间）
    let understandingLevel = 1;
    if (accuracy >= 90) understandingLevel = 5;
    else if (accuracy >= 80) understandingLevel = 4;
    else if (accuracy >= 70) understandingLevel = 3;
    else if (accuracy >= 60) understandingLevel = 2;

    // 计算学习时长
    const learningDuration = stats?.totalTimeSpent || 0;

    // 分析错误题目
    const wrongAnswers = session.userAnswers.filter(answer => !answer.isCorrect);
    const errorAnalysis = wrongAnswers.map(answer => {
      const question = session.quizQuestions.find(q => q.id === answer.questionId);
      return {
        questionId: answer.questionId,
        question: question?.question || '',
        userAnswer: answer.userAnswer,
        correctAnswer: question?.correctAnswer || '',
        explanation: question?.explanation || ''
      };
    });

    // 生成学习建议
    const suggestions = [];
    if (accuracy < 60) {
      suggestions.push('建议重新学习基础概念');
      suggestions.push('增加练习题的数量');
    } else if (accuracy < 80) {
      suggestions.push('加强对错误题目的理解');
      suggestions.push('复习相关知识点');
    } else {
      suggestions.push('继续保持良好的学习状态');
      suggestions.push('可以尝试更有挑战性的内容');
    }

    // 返回真实的学习成果数据
    const learningResults = {
      // 基础数据
      conversationId,
      subject: session.subject,
      topic: session.topic,
      
      // 测验成绩
      quiz: {
        totalQuestions,
        correctAnswers,
        wrongAnswers: totalQuestions - correctAnswers,
        totalScore,
        maxPossibleScore,
        accuracy,
        scorePercentage: maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0
      },
      
      // 理解程度
      understanding: {
        level: understandingLevel,
        description: getUnderstandingDescription(understandingLevel)
      },
      
      // 学习时长
      duration: {
        total: learningDuration,
        explanation: stats?.explanationTime || 0,
        coaching: stats?.coachingTime || 0,
        quiz: stats?.quizTime || 0
      },
      
      // 错误分析
      errorAnalysis,
      
      // 学习建议
      suggestions,
      
      // 学习效率
      efficiency: {
        score: learningDuration > 0 ? Math.round(accuracy / learningDuration * 10) : 0,
        level: getEfficiencyLevel(learningDuration > 0 ? Math.round(accuracy / learningDuration * 10) : 0)
      },
      
      // 时间戳
      createdAt: session.createdAt,
      updatedAt: session.updatedAt
    };

    return NextResponse.json(learningResults);

  } catch (error) {
    console.error('获取学习成果失败:', error);
    return NextResponse.json(
      { error: '获取学习成果失败' },
      { status: 500 }
    );
  }
}

// 辅助函数：获取理解程度描述
function getUnderstandingDescription(level: number): string {
  switch (level) {
    case 5: return '完全掌握';
    case 4: return '理解良好';
    case 3: return '基本理解';
    case 2: return '部分理解';
    case 1: return '需要加强';
    default: return '未评估';
  }
}

// 辅助函数：获取学习效率等级
function getEfficiencyLevel(score: number): string {
  if (score > 8) return '高效';
  if (score > 5) return '中等';
  return '待提升';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { conversationId, manualScore, manualTotal, manualUnderstanding } = body;

    if (!conversationId) {
      return NextResponse.json(
        { error: '缺少conversationId参数' },
        { status: 400 }
      );
    }

    // 如果提供了手动数据，更新学习统计
    if (manualScore !== undefined && manualTotal !== undefined) {
      await prisma.learningStats.upsert({
        where: { conversationId },
        update: {
          totalQuestions: manualTotal,
          correctAnswers: manualScore,
          accuracy: (manualScore / manualTotal) * 100,
          updatedAt: new Date()
        },
        create: {
          conversationId,
          totalQuestions: manualTotal,
          correctAnswers: manualScore,
          accuracy: (manualScore / manualTotal) * 100
        }
      });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('更新学习成果失败:', error);
    return NextResponse.json(
      { error: '更新学习成果失败' },
      { status: 500 }
    );
  }
}