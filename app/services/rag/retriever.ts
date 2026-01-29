import prisma from '@/app/lib/prisma';
import { KnowledgeChunk, LocalExamProfile } from '@/app/generated/prisma';

interface RetrievalContext {
  syllabus: KnowledgeChunk[];
  templates: KnowledgeChunk[];
  pitfalls: KnowledgeChunk[];
  examProfile: LocalExamProfile | null;
}

export class KnowledgeRetriever {
  /**
   * 检索出题上下文
   * MVP: 目前使用关键词匹配 tags，未来可升级为向量检索
   */
  async retrieveContext(
    subject: string,
    region: string,
    grade: string,
    knowledgePoints: string[],
    questionType: string
  ): Promise<RetrievalContext> {
    console.log(`[Retriever] Searching for: ${subject}, ${region}, ${knowledgePoints.join(',')}`);

    // 1. 获取考情画像
    const examProfile = await prisma.localExamProfile.findFirst({
      where: {
        region,
        subject,
        // year: 2024 // 默认取最新的，暂不限年份
      },
      orderBy: { year: 'desc' }
    });

    // 2. 获取考纲 (Syllabus)
    // 策略：tags 包含任意一个知识点
    const syllabus = knowledgePoints.length > 0 ? await prisma.knowledgeChunk.findMany({
      where: {
        subject,
        type: 'SYLLABUS',
        OR: [
          { tags: { hasSome: knowledgePoints } },
          { content: { contains: knowledgePoints[0] } } // Fallback content search
        ]
      },
      take: 3
    }) : [];

    // 2.2 如果知识点为空数组，避免 contains 报错
    if (knowledgePoints.length === 0) {
      console.warn('[Retriever] No knowledge points provided.');
    } else {
      // (Keep existing logic or enhance if needed)
    }

    // 3. 获取设问模板 (Templates)
    // 策略：tags 包含 questionType (如 "材料题")
    const templates = await prisma.knowledgeChunk.findMany({
      where: {
        subject,
        type: 'TEMPLATE',
        tags: { has: this.mapQuestionTypeToTag(questionType) }
      },
      take: 2
    });

    // 4. 获取易错点 (Pitfalls)
    // 策略：tags 包含知识点
    const pitfalls = knowledgePoints.length > 0 ? await prisma.knowledgeChunk.findMany({
      where: {
        subject,
        type: 'PITFALL',
        tags: { hasSome: knowledgePoints }
      },
      take: 3
    }) : [];

    return {
      syllabus,
      templates,
      pitfalls,
      examProfile
    };
  }

  private mapQuestionTypeToTag(type: string): string {
    const map: Record<string, string> = {
      'material_analysis': '材料题',
      'choice': '选择题',
      'essay': '论述题'
    };
    return map[type] || '材料题';
  }
}

export const retriever = new KnowledgeRetriever();
