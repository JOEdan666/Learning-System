import { deepseek } from './rag/deepseekClient';
import { retriever } from './rag/retriever';
import { promptBuilder, QuestionSpec } from './rag/promptBuilder';
import prisma from '@/app/lib/prisma';

export interface GeneratedQuestion {
  stem: string;
  questions: {
    sub_question: string;
    score: number;
    answer: string;
    grading_points: string[];
  }[];
  analysis: string;
  difficulty_assessed: number;
  pitfalls: string;
  tags: string[];
}

export class QuestionGenerator {
  
  async generate(spec: QuestionSpec): Promise<GeneratedQuestion> {
    console.log('[Generator] Starting generation for:', spec);

    // 1. RAG Retrieve
    const context = await retriever.retrieveContext(
      spec.subject,
      spec.region,
      spec.grade,
      spec.knowledgePoints,
      spec.questionType
    );
    console.log('[Generator] Context retrieved:', { 
      syllabusCount: context.syllabus.length,
      templateCount: context.templates.length 
    });

    // 2. Build Prompt
    const prompt = promptBuilder.buildPrompt(spec, context);
    console.log('[Generator] Prompt built, length:', prompt.length);

    // 3. Call LLM
    const responseText = await deepseek.generateCompletion([
      { role: 'system', content: 'You are a helpful assistant designed to output JSON.' },
      { role: 'user', content: prompt }
    ], true);

    // 4. Parse & Validate (Basic)
    let result: GeneratedQuestion;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      console.error('[Generator] JSON Parse Error:', e);
      console.error('[Generator] Raw Output:', responseText);
      throw new Error('生成的格式无效，请重试');
    }

    // 5. QC Check (Simplified for MVP)
    // TODO: Implement full QC Chain here
    
    // 6. Save to DB (Optional for Debug)
    // await this.saveToBank(result, spec);

    return result;
  }

  // private async saveToBank(q: GeneratedQuestion, spec: QuestionSpec) { ... }
}

export const questionGenerator = new QuestionGenerator();
