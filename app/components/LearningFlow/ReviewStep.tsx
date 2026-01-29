import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Download, Camera, CheckCircle, RefreshCcw, ArrowRight, Lightbulb, BookOpen } from 'lucide-react';
import 'katex/dist/katex.min.css';

interface ReviewStepProps {
  content: string;
  score: number;
  totalQuestions: number;
  understandingLevel: number;
  onContinue: () => void;
  onRestart: () => void;
  session?: {
    topic: string;
    subject: string;
    createdAt: Date;
    steps: any[];
    conversationId?: string;
  };
  quizQuestions?: any[];
  learningDuration?: number; // 学习时长（分钟）
  onAiSummaryGenerated?: (summary: string) => void; // 课程总结生成回调
  conversationId?: string; // 对话ID，用于保存课程总结
  grade?: string; // 年级，用于生成适应难度的题目
}

const ReviewStep: React.FC<ReviewStepProps> = ({ 
  content, 
  score, 
  totalQuestions, 
  understandingLevel, 
  onContinue, 
  onRestart,
  session,
  quizQuestions = [],
  learningDuration = 0,
  onAiSummaryGenerated,
  conversationId,
  grade = '八年级' // 默认值
}) => {
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [verificationQuestion, setVerificationQuestion] = useState<any>(null);
  const [verificationAnswer, setVerificationAnswer] = useState('');
  const [verificationResult, setVerificationResult] = useState<'pending' | 'correct' | 'incorrect' | 'completed'>('pending');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(true);

  // 生成变式题
  useEffect(() => {
    const generateVariantQuestion = async () => {
      if (!session?.topic) return;
      
      setIsLoadingQuestion(true);
      try {
        const prompt = `你是一位经验丰富的${grade} ${session.subject || '全科'}老师。
学生刚刚学习了"${session.topic}"这个知识点。
请生成一道**变式题**（Variant Question）来检验学生是否真正掌握了该知识点。

要求：
1. **难度匹配**：严格符合${grade}学生的认知水平。不要出现超纲的抽象符号（如未学过的参数k讨论）或复杂概念。
2. **具体情境**：题目要具体、直观，最好结合实际数值或具体图形/情境。
3. **考察本质**：考察学生对核心概念的迁移应用能力，而不是死记硬背。
4. **格式要求**：返回JSON格式，包含题目、参考答案和详细解析。

输出JSON格式：
{
  "question": "题目内容",
  "referenceAnswer": "参考答案（简洁明了）",
  "explanation": "详细解析（解题思路和步骤）"
}`;

        const response = await fetch('/api/openai-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{ role: 'user', content: prompt }]
          })
        });

        if (!response.ok) throw new Error('API request failed');

        const data = await response.json();
        let questionData;
        try {
          // 尝试提取JSON
          const jsonMatch = data.content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            questionData = JSON.parse(jsonMatch[0]);
          } else {
            questionData = JSON.parse(data.content);
          }
        } catch (e) {
          // Fallback if parsing fails
          questionData = {
            question: `(变式题) 请简述你对 ${session.topic} 的理解，并举一个生活中的例子。`,
            referenceAnswer: "开放性回答",
            explanation: "考察学生对知识点的直观理解和应用。"
          };
        }

        setVerificationQuestion({
          id: 'v1',
          question: questionData.question,
          referenceAnswer: questionData.referenceAnswer,
          explanation: questionData.explanation,
          type: 'short_answer',
          points: 10
        });

      } catch (error) {
        console.error('Failed to generate variant question:', error);
        // Fallback
        setVerificationQuestion({
          id: 'v1',
          question: `(变式题) 请用自己的话总结一下 ${session.topic} 的核心要点。`,
          referenceAnswer: "核心要点总结",
          explanation: "自我总结是最好的复习方式。",
          type: 'short_answer',
          points: 10
        });
      } finally {
        setIsLoadingQuestion(false);
      }
    };

    generateVariantQuestion();
  }, [session?.topic, session?.subject, grade]);

  const handleVerify = () => {
    setIsVerifying(true);
    // 模拟提交过程
    setTimeout(() => {
      // 无论回答什么，都算完成，显示参考答案让学生自查（因为是主观填空，很难前端自动判分）
      setVerificationResult('completed');
      setIsVerifying(false);
    }, 800);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-900">最终验证</h2>
        <p className="text-slate-500">完成最后一道变式题，确保真正掌握</p>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 mb-8">
        {isLoadingQuestion ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mb-4"></div>
            <p className="text-slate-500">正在生成适合{grade}的变式挑战题...</p>
          </div>
        ) : verificationQuestion && (
          <div>
            <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm font-bold mb-4">
              变式题挑战 ({grade}难度)
            </span>
            <div className="prose prose-slate max-w-none mb-6">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm, remarkMath]} 
                rehypePlugins={[rehypeKatex]}
              >
                {verificationQuestion.question}
              </ReactMarkdown>
            </div>
            
            <textarea
              value={verificationAnswer}
              onChange={(e) => setVerificationAnswer(e.target.value)}
              placeholder="请输入你的推导过程或答案..."
              className="w-full h-32 p-4 rounded-xl border-2 border-slate-200 focus:border-purple-500 focus:ring-0 resize-none text-lg mb-6"
              disabled={verificationResult === 'completed'}
            />

            {verificationResult === 'pending' ? (
              <button
                onClick={handleVerify}
                disabled={!verificationAnswer || isVerifying}
                className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold shadow-lg shadow-purple-200 hover:bg-purple-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isVerifying ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    验证中...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    提交并查看答案
                  </>
                )}
              </button>
            ) : (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* 结果反馈区 */}
                <div className="p-5 rounded-xl bg-slate-50 border border-slate-200">
                  <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-yellow-500" />
                    参考答案
                  </h4>
                  <div className="text-slate-700 prose prose-sm max-w-none bg-white p-4 rounded-lg border border-slate-100">
                     <ReactMarkdown 
                      remarkPlugins={[remarkGfm, remarkMath]} 
                      rehypePlugins={[rehypeKatex]}
                    >
                      {verificationQuestion.referenceAnswer}
                    </ReactMarkdown>
                  </div>
                </div>

                <div className="p-5 rounded-xl bg-blue-50 border border-blue-100">
                  <h4 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                    解析与思路
                  </h4>
                   <div className="text-slate-700 prose prose-sm max-w-none">
                     <ReactMarkdown 
                      remarkPlugins={[remarkGfm, remarkMath]} 
                      rehypePlugins={[rehypeKatex]}
                    >
                      {verificationQuestion.explanation}
                    </ReactMarkdown>
                  </div>
                </div>

                <div className="flex justify-center pt-4">
                  <button
                    onClick={() => setVerificationResult('pending')}
                    className="text-slate-500 hover:text-purple-600 text-sm underline mr-6"
                  >
                    重新作答
                  </button>
                  <button
                    onClick={onContinue}
                    className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold shadow-lg hover:bg-slate-800 transition-all flex items-center gap-2"
                  >
                    <span>我已掌握，完成学习</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewStep;
