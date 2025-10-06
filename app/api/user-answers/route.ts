import { NextRequest, NextResponse } from 'next/server';
import { LearningProgressService } from '../../services/learningProgressService';

// GET - 获取用户答案（错题集）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const incorrectOnly = searchParams.get('incorrectOnly') === 'true';
    const conversationId = searchParams.get('conversationId');

    let userAnswers;
    if (conversationId) {
      // 获取特定会话的用户答案
      userAnswers = await LearningProgressService.getUserAnswersByConversationId(conversationId);
    } else {
      // 获取所有用户答案
      userAnswers = await LearningProgressService.getAllUserAnswers(limit, offset);
    }
    
    // 如果只要错误答案，进行过滤
    const filteredAnswers = incorrectOnly 
      ? userAnswers.filter(answer => !answer.isCorrect)
      : userAnswers;

    return NextResponse.json({
      success: true,
      answers: filteredAnswers,
      total: filteredAnswers.length
    });
  } catch (error) {
    console.error('获取用户答案失败:', error);
    return NextResponse.json(
      { error: '获取用户答案失败' },
      { status: 500 }
    );
  }
}

// POST - 保存用户答案
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      conversationId,
      questionText,
      userAnswer,
      correctAnswer,
      isCorrect,
      explanation
    } = body;

    // 验证必需字段
    if (!conversationId || !questionText || !userAnswer) {
      return NextResponse.json(
        { error: '缺少必需字段: conversationId, questionText, userAnswer' },
        { status: 400 }
      );
    }

    // 保存用户答案
    const savedAnswer = await LearningProgressService.saveDirectUserAnswer({
      conversationId,
      questionText,
      userAnswer,
      correctAnswer: correctAnswer || '',
      isCorrect: isCorrect !== undefined ? isCorrect : false,
      explanation: explanation || ''
    });

    return NextResponse.json({
      success: true,
      answer: savedAnswer
    }, { status: 201 });

  } catch (error) {
    console.error('保存用户答案失败:', error);
    return NextResponse.json(
      { error: '保存用户答案失败' },
      { status: 500 }
    );
  }
}