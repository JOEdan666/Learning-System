import React, { useState, useEffect, useRef } from 'react';
import { LearningState } from '../../types/learning';
import { CheckCircle, HelpCircle, ArrowRight, BookOpen } from 'lucide-react';
import ReAskModal from './ReAskModal';
import MarkdownRenderer from '../MarkdownRenderer';

interface ExplainStepProps {
  content: string;
  onNext: () => void;
  onAskQuestion?: (question: string) => void;
  step?: LearningState;
  onSkipToQuiz?: () => void;
  questionCount?: number;
  socraticDialogue?: Array<{question: string; answer: string; feedback?: string}>;
  onSocraticDialogueUpdate?: (dialogue: Array<{question: string; answer: string; feedback?: string}>) => void;
  subject?: string;
  topic?: string;
  initialAiExplanation?: string;
  onAiExplanationUpdate?: (content: string) => void;
  selectedRegion?: string;
  selectedCurriculum?: string;
  grade?: string;
  semester?: string;
}

export default function ExplainStep({ 
  content, 
  onNext, 
  step = 'REMEDY',
  subject,
  topic,
  socraticDialogue = [],
  onSocraticDialogueUpdate
}: ExplainStepProps) {
  
  // 模拟加载状态（如果内容为空）
  const isLoading = !content || content.trim().length === 0;
  const [showReAsk, setShowReAsk] = useState(false);
  const [localDialogue, setLocalDialogue] = useState<Array<{question: string; answer: string; feedback?: string}>>(socraticDialogue);

  // 当本地对话更新时，通知父组件
  useEffect(() => {
    if (onSocraticDialogueUpdate) {
      onSocraticDialogueUpdate(localDialogue);
    }
  }, [localDialogue, onSocraticDialogueUpdate]);

  const handleReAskComplete = (dialogueItem: {question: string; answer: string; feedback?: string}) => {
    setLocalDialogue(prev => [...prev, dialogueItem]);
    setShowReAsk(false);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* 头部状态栏 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">知识补漏</h2>
            <p className="text-sm text-slate-500">针对你的薄弱点进行的靶向讲解</p>
          </div>
        </div>
        <div className="text-sm text-slate-400">
          {subject} · {topic}
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 min-h-[400px] p-6 md:p-10">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
            <p className="text-slate-600 font-medium">专属私教正在为你准备讲解...</p>
            <p className="text-slate-400 text-sm mt-2">分析错题原因 · 提炼核心考点 · 生成通俗解释</p>
          </div>
        ) : (
          <div className="prose prose-slate max-w-none">
            <MarkdownRenderer content={content} fontSize="lg" />
          </div>
        )}
      </div>

      {/* 苏格拉底式追问历史展示 */}
      {localDialogue.length > 0 && (
        <div className="mt-8 space-y-4">
          <h3 className="text-lg font-bold text-slate-800 flex items-center">
            <span className="w-1 h-6 bg-indigo-500 rounded-full mr-2"></span>
            深入思考记录
          </h3>
          {localDialogue.map((item, idx) => (
            <div key={idx} className="bg-slate-50 rounded-xl p-5 border border-slate-200">
              <div className="flex gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600 font-bold text-sm">Q</div>
                <div className="text-slate-800 font-medium pt-1">{item.question}</div>
              </div>
              <div className="flex gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center flex-shrink-0 text-slate-500 text-sm">A</div>
                <div className="text-slate-600 pt-1">{item.answer}</div>
              </div>
              {item.feedback && (
                <div className="ml-11 bg-indigo-50 rounded-lg p-3 text-sm text-indigo-800 border border-indigo-100">
                  <span className="font-bold mr-2">点评:</span>
                  {item.feedback}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 底部操作栏 */}
      <div className="mt-8 flex justify-between items-center">
        <button
          onClick={() => setShowReAsk(true)}
          disabled={isLoading}
          className="text-slate-500 hover:text-blue-600 font-medium flex items-center transition-colors px-4 py-2 rounded-lg hover:bg-slate-50 disabled:opacity-50"
        >
          <HelpCircle className="w-5 h-5 mr-2" />
          <span>我有疑问，请苏格拉底老师解答</span>
        </button>

        <button
          onClick={onNext}
          disabled={isLoading}
          className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-semibold shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:shadow-none disabled:hover:translate-y-0 flex items-center gap-2"
        >
          <span>我已理解，做题验证</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      {/* 追问弹窗 */}
      <ReAskModal
        isOpen={showReAsk}
        onClose={() => setShowReAsk(false)}
        onComplete={handleReAskComplete}
        subject={subject || ''}
        topic={topic || ''}
        context={content}
      />
    </div>
  );
}
