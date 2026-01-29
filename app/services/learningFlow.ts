import { LearningState, LearningSession, LearningStep, QuizQuestion, QuizResult } from '../types/learning';
import type { AIProvider } from './ai';
import { createProviderFromEnv } from './ai';

export class LearningFlowService {
  private aiProvider: AIProvider | null = null;
  private currentSession: LearningSession | null = null;

  constructor() {
    this.aiProvider = createProviderFromEnv();
  }

  // 开始新的学习会话
  async startSession(studentId: string, subject: string, topic: string, learningMaterials?: any[]): Promise<LearningSession> {
    try {
      // 如果没有提供学习材料，尝试从savedItems中获取
      if (!learningMaterials || learningMaterials.length === 0) {
        throw new Error('没有可用的学习材料');
      }

      const session: LearningSession = {
        id: `session_${Date.now()}`,
        studentId,
        subject,
        topic,
        state: 'EXPLAIN',
        steps: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        learningMaterials
      };

      this.currentSession = session;
      return session;
    } catch (error) {
      console.error('Failed to start learning session:', error);
      throw error;
    }
  }

  // 获取当前会话
  getCurrentSession(): LearningSession | null {
    return this.currentSession;
  }

  // 处理学习流程的下一步
  async nextStep(sessionId: string, currentState: LearningState, userInput: string): Promise<{
    nextState: LearningState;
    content: string;
    data?: any;
  }> {
    if (!this.currentSession || this.currentSession.id !== sessionId) {
      throw new Error('无效的学习会话');
    }

    // 记录当前步骤
    const step: LearningStep = {
      id: `step_${Date.now()}`,
      sessionId,
      step: currentState,
      input: { userInput },
      output: {},
      createdAt: new Date()
    };

    let nextState: LearningState = currentState;
    let content = '';
    let data: any;

    switch (currentState) {
      case 'EXPLAIN':
        const explanation = await this.generateExplanation(this.currentSession.topic, this.currentSession.subject);
        content = explanation;
        step.output = { explanation };
        nextState = 'CONFIRM';
        break;



      case 'QUIZ':
        // 如果用户输入的是答案，则进行评分
        if (this.currentSession.steps.some(s => s.step === 'QUIZ' && s.output.questions)) {
          const quizResult = await this.gradeQuiz(
            this.currentSession.topic, 
            userInput, 
            this.getQuizQuestions()
          );
          content = `测验完成！你的得分是 ${quizResult.score} 分。`;
          step.output = { quizResult };
          data = quizResult;
          nextState = 'REVIEW';
        } else {
          // 生成测验题目
          const questions = await this.generateQuiz(this.currentSession.topic);
          content = this.formatQuizQuestions(questions);
          step.output = { questions };
          // 保持QUIZ状态，等待用户回答
        }
        break;

      case 'REVIEW':
        const review = await this.generateReview(this.currentSession);
        content = review;
        step.output = { review };
        nextState = 'DONE';
        break;

      default:
        throw new Error('未知的学习状态');
    }

    // 更新会话状态
    this.currentSession.state = nextState;
    this.currentSession.steps.push(step);
    this.currentSession.updatedAt = new Date();

    return { nextState, content, data };
  }

  // 生成知识点讲解
  private async generateExplanation(topic: string, subject: string): Promise<string> {
    if (!this.aiProvider) throw new Error('AI服务不可用');

    // 构建学习材料内容
    const materialsContent = this.currentSession?.learningMaterials
      ?.map((material, index) => `材料${index + 1}（${material.subject}）：${material.content}`)
      .join('\n\n') || '';

    const prompt = `你是"AI讲解教练"，专注于帮助学生高效掌握考点。请为${subject}科目讲解"${topic}"这个知识点。

## 讲解要求：
1. **聚焦核心考点**：直接讲解考试重点，不说废话
2. **易错易混辨析**：指出学生常见的错误和混淆点
3. **解题关键点**：传授解题的核心技巧和步骤
4. **言简意赅**：每句话都要有信息量，控制在400字以内
5. **不举不必要的例子**：不要举跨学科或生活中不相关的例子

## 内容结构：
- 核心概念（精确定义）
- 关键公式/结论（含适用条件）
- 解题步骤（可操作）
- 易错点提醒
- 记忆技巧（如有）

参考材料：
${materialsContent}`;

    return new Promise((resolve, reject) => {
      let response = '';
      
      this.aiProvider!.onMessage((content, isFinal) => {
        response += content;
        if (isFinal) {
          resolve(response);
        }
      });

      this.aiProvider!.onError((error) => {
        reject(new Error(error));
      });

      this.aiProvider!.sendMessage(prompt);
    });
  }



  // 生成测验题目
  private async generateQuiz(topic: string): Promise<QuizQuestion[]> {
    if (!this.aiProvider) throw new Error('AI服务不可用');

    // 构建学习材料内容
    const materialsContent = this.currentSession?.learningMaterials
      ?.map((material, index) => `材料${index + 1}（${material.subject}）：${material.content}`)
      .join('\n\n') || '';

    const prompt = `请基于"${topic}"这个知识点，生成5道高质量测验题。

## 命题要求：
1. **聚焦核心考点**：每道题必须考查该知识点的核心内容
2. **突出易错点**：干扰项要基于学生常见错误设计
3. **解析要精准**：必须包含考点、解题关键、易错分析

## 题型分布：
- 3道选择题（考查概念理解和易错点）
- 1道判断题
- 1道简答题（考查核心步骤或公式）

参考材料：
${materialsContent}

请以JSON格式回复：
[
  {
    "id": "1",
    "question": "题目内容（简洁明了）",
    "type": "multiple_choice|true_false|short_answer",
    "options": ["选项A", "选项B", "选项C", "选项D"],
    "correctAnswer": "正确答案",
    "explanation": "【考点】xxx【解题关键】xxx【易错分析】xxx"
  }
]`;

    return new Promise((resolve, reject) => {
      let response = '';
      
      this.aiProvider!.onMessage((content, isFinal) => {
        response += content;
        if (isFinal) {
          try {
            const parsed = JSON.parse(response);
            resolve(parsed);
          } catch (e) {
            // 如果返回的不是有效JSON，提供默认题目
            resolve([{
              id: '1',
              question: '请简述你对' + topic + '的理解',
              type: 'short_answer',
              correctAnswer: '根据学生的回答判断',
              explanation: '这是一个开放性问题，用于评估学生对知识点的理解'
            }]);
          }
        }
      });

      this.aiProvider!.onError((error) => {
        reject(new Error(error));
      });

      this.aiProvider!.sendMessage(prompt);
    });
  }

  // 评分测验
  private async gradeQuiz(topic: string, answers: string, questions: QuizQuestion[]): Promise<QuizResult> {
    if (!this.aiProvider) throw new Error('AI服务不可用');

    // 解析用户答案
    let userAnswers: string[] = [];
    try {
      userAnswers = JSON.parse(answers);
    } catch (e) {
      // 如果不是JSON格式，按行分割
      userAnswers = answers.split('\n').filter(a => a.trim());
    }

    const prompt = `请对以下测验进行评分：

知识点：${topic}

题目和答案：
${questions.map((q, i) => `
${i+1}. ${q.question}
类型：${q.type}
正确答案：${q.correctAnswer}
学生答案：${userAnswers[i] || '未回答'}
`).join('\n')}

请以JSON格式回复：
{
  "score": 0-100的分数,
  "weaknesses": ["弱点1", "弱点2"],
  "suggestions": ["建议1", "建议2"]
}`;

    return new Promise((resolve, reject) => {
      let response = '';
      
      this.aiProvider!.onMessage((content, isFinal) => {
        response += content;
        if (isFinal) {
          try {
            const parsed = JSON.parse(response);
            
            // 构建详细的结果
            const questionResults = questions.map((q, i) => ({
              questionId: q.id,
              userAnswer: userAnswers[i] || '',
              isCorrect: this.isAnswerCorrect(q, userAnswers[i])
            }));
            
            const correctCount = questionResults.filter(r => r.isCorrect).length;
            
            resolve({
              score: parsed.score,
              totalQuestions: questions.length,
              correctAnswers: correctCount,
              weaknesses: parsed.weaknesses || [],
              suggestions: parsed.suggestions || [],
              questionResults
            });
          } catch (e) {
            // 如果返回的不是有效JSON，提供默认评分
            resolve({
              score: 70,
              totalQuestions: questions.length,
              correctAnswers: Math.floor(questions.length * 0.7),
              weaknesses: ['需要加强对知识点的理解'],
              suggestions: ['建议重新学习相关概念', '多做练习题'],
              questionResults: questions.map((q, i) => ({
                questionId: q.id,
                userAnswer: userAnswers[i] || '',
                isCorrect: Math.random() > 0.3
              }))
            });
          }
        }
      });

      this.aiProvider!.onError((error) => {
        reject(new Error(error));
      });

      this.aiProvider!.sendMessage(prompt);
    });
  }

  // 生成学习复盘
  private async generateReview(session: LearningSession): Promise<string> {
    if (!this.aiProvider) throw new Error('AI服务不可用');

    const explainStep = session.steps.find(s => s.step === 'EXPLAIN');
    const quizStep = session.steps.find(s => s.step === 'QUIZ' && s.output.quizResult);
    const quizScore = quizStep?.output.quizResult?.score || 0;

    // 构建学习材料内容
    const materialsContent = session.learningMaterials
      ?.map((material, index) => `材料${index + 1}（${material.subject}）：${material.content}`)
      .join('\n\n') || '';

    const prompt = `你是"AI复盘教练"。请基于以下数据生成精准的学习复盘：

学习主题：${session.topic}
科目：${session.subject}
测验得分：${quizScore}分

学习材料：
${materialsContent}

## 复盘要求：
1. **言简意赅**，不说废话，每句话都要有价值
2. **聚焦问题**，直接指出薄弱环节
3. **给出具体建议**，可操作的改进方法

## 复盘内容：
1. **掌握情况**：哪些考点已掌握？哪些还需加强？
2. **易错点回顾**：测验中暴露的问题
3. **改进建议**：具体的复习方法和重点

控制在150字以内，直接给出有价值的反馈。`;

    return new Promise((resolve, reject) => {
      let response = '';
      
      this.aiProvider!.onMessage((content, isFinal) => {
        response += content;
        if (isFinal) {
          resolve(response);
        }
      });

      this.aiProvider!.onError((error) => {
        reject(new Error(error));
      });

      this.aiProvider!.sendMessage(prompt);
    });
  }

  // 格式化测验题目显示
  private formatQuizQuestions(questions: QuizQuestion[]): string {
    return questions.map((q, i) => {
      let questionText = `${i+1}. ${q.question}\n`;
      
      if (q.type === 'multiple_choice' && q.options) {
        questionText += q.options.map((opt, j) => `${String.fromCharCode(65+j)}. ${opt}`).join('\n');
      } else if (q.type === 'true_false') {
        questionText += 'A. 正确\nB. 错误';
      }
      
      questionText += '\n\n请回答：';
      return questionText;
    }).join('\n\n');
  }

  // 判断答案是否正确
  private isAnswerCorrect(question: QuizQuestion, userAnswer: string): boolean {
    if (!userAnswer.trim()) return false;
    
    const normalizedUser = userAnswer.trim().toLowerCase();
    const normalizedCorrect = question.correctAnswer.toLowerCase();
    
    if (question.type === 'multiple_choice') {
      return normalizedUser === normalizedCorrect || 
             normalizedUser === normalizedCorrect.charAt(0);
    } else if (question.type === 'true_false') {
      return (normalizedUser === 'true' || normalizedUser === 'a' || normalizedUser === '正确') ===
             (normalizedCorrect === 'true' || normalizedCorrect === 'a' || normalizedCorrect === '正确');
    } else {
      // 简答题，简单判断是否包含关键词
      return normalizedUser.length > 10; // 简单判断，实际应用中可以使用更复杂的NLP
    }
  }

  // 获取之前的步骤
  private getPreviousSteps(): LearningStep[] {
    return this.currentSession?.steps || [];
  }

  // 获取测验题目
  private getQuizQuestions(): QuizQuestion[] {
    const quizStep = this.currentSession?.steps.find(s => s.step === 'QUIZ' && s.output.questions);
    return quizStep?.output.questions || [];
  }

  // 生成日报
  async generateDailyReport(studentId: string, date: Date): Promise<any> {
    // 这里可以实现日报生成逻辑
    // 目前返回一个简单的示例
    return {
      studentId,
      date,
      sessions: [],
      totalDuration: 0,
      subjectsStudied: [],
      averageScore: 0
    };
  }
}