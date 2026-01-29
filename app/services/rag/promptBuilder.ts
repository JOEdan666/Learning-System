import { KnowledgeChunk, LocalExamProfile } from '@/app/generated/prisma';

export interface RetrievalContext {
  syllabus: KnowledgeChunk[];
  templates: KnowledgeChunk[];
  pitfalls: KnowledgeChunk[];
  examProfile: LocalExamProfile | null;
}

export interface QuestionSpec {
  subject: string;      // "history"
  grade: string;        // "8"
  region: string;       // "guangdong"
  knowledgePoints: string[]; // ["洋务运动"]
  questionType: string; // "material_analysis"
  difficulty: number;   // 0.65
  bloomLevel: string;   // "analyze"
}

export class PromptBuilder {
  buildPrompt(spec: QuestionSpec, context: RetrievalContext): string {
    const { syllabus, templates, pitfalls, examProfile } = context;

    // 格式化上下文
    const syllabusText = syllabus.map(s => `- ${s.content}`).join('\n') || '（暂无具体考纲，请通用标准）';
    const templateText = templates.map(t => `- ${t.content}`).join('\n') || '（无特定模板，请自由发挥）';
    const pitfallText = pitfalls.map(p => `- ${p.content}`).join('\n') || '（无特定易错点）';
    
    const profileInfo = examProfile 
      ? JSON.stringify(examProfile.profileData, null, 2) 
      : '（暂无详细统计数据）';

    // 构造 Prompt
    return `
Role: 你是${spec.region}地区资深的中考${spec.subject}命题专家。
Task: 请根据提供的[地方考情]和[知识点]，创作一道符合${spec.grade}年级水平的${this.getQuestionTypeName(spec.questionType)}。

[Constraints]
1. 严格遵守以下考纲边界，禁止超纲：
${syllabusText}

2. 模仿以下设问风格（不要直接复制）：
${templateText}

3. 难度系数控制在 ${spec.difficulty} 左右。
4. 必须以 JSON 格式输出，不要包含 Markdown 标记。

[Local Context - ${spec.region}考情]
${profileInfo}

[Pitfalls to Avoid - 易错点]
${pitfallText}

[Input Spec]
知识点: ${spec.knowledgePoints.join(', ')}
能力层级: ${spec.bloomLevel}

[Output JSON Structure]
{
  "stem": "材料一：...（题目材料）...",
  "questions": [
    {
      "sub_question": "根据材料一，指出...",
      "score": 4,
      "answer": "...",
      "grading_points": ["提到'自强'得2分", "提到'求富'得2分"]
    }
  ],
  "analysis": "...",
  "difficulty_assessed": 0.7,
  "pitfalls": "学生容易混淆...",
  "tags": ["tag1", "tag2"]
}
`;
  }

  private getQuestionTypeName(type: string): string {
    const map: Record<string, string> = {
      'material_analysis': '材料分析题',
      'choice': '选择题',
      'essay': '论述题'
    };
    return map[type] || type;
  }
}

export const promptBuilder = new PromptBuilder();
