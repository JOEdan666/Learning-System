import { NextRequest, NextResponse } from 'next/server';
import { questionGenerator } from '@/app/services/questionGenerator';
import { QuestionSpec } from '@/app/services/rag/promptBuilder';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const spec: QuestionSpec = {
      subject: body.subject || 'history',
      grade: body.grade || '8',
      region: body.region || 'guangdong',
      knowledgePoints: body.knowledgePoints || ['洋务运动'],
      questionType: body.questionType || 'material_analysis',
      difficulty: Number(body.difficulty) || 0.65,
      bloomLevel: body.bloomLevel || 'analyze'
    };

    const result = await questionGenerator.generate(spec);
    
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error('[API] Generate Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
