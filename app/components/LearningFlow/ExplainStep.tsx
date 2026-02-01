import React, { useState, useEffect, useRef } from 'react';
import { LearningState } from '../../types/learning';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { CheckCircle, HelpCircle, ArrowRight, BookOpen } from 'lucide-react';
import ReAskModal from './ReAskModal';

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

// 检测是否为ASCII艺术/树状图（包含特殊符号如╱╲├│└─等）
const isAsciiArt = (text: string): boolean => {
  const asciiArtChars = /[╱╲├│└─┌┐┘┬┴┼═║╔╗╚╝╠╣╦╩╬▲▼◆●○■□★☆→←↑↓↔⇒⇐⇑⇓]/;
  const hasMultipleSpaces = /\s{2,}/.test(text);
  const hasBoxDrawing = /[┌┐└┘├┤┬┴┼│─]/.test(text);
  return asciiArtChars.test(text) || (hasMultipleSpaces && hasBoxDrawing);
};

// 优化的Markdown组件 - 针对知识点讲解
const customComponents = {
  h1: ({node, ...props}: any) => <h1 className="text-2xl font-bold mt-6 mb-4 text-slate-900 border-l-4 border-blue-500 pl-3" {...props} />,
  h2: ({node, ...props}: any) => <h2 className="text-xl font-bold mt-5 mb-3 text-slate-800 flex items-center gap-2" {...props} />,
  h3: ({node, ...props}: any) => <h3 className="text-lg font-semibold mt-4 mb-2 text-slate-700" {...props} />,
  p: ({node, children, ...props}: any) => {
    // 检测段落内容是否为ASCII艺术
    const textContent = typeof children === 'string' ? children :
      (Array.isArray(children) ? children.map(c => typeof c === 'string' ? c : '').join('') : '');

    if (isAsciiArt(textContent)) {
      return (
        <pre className="font-mono text-sm bg-slate-50 p-4 rounded-lg overflow-x-auto my-4 text-slate-700 leading-relaxed whitespace-pre" {...props}>
          {children}
        </pre>
      );
    }
    return <p className="mb-3 text-slate-600 leading-relaxed" {...props}>{children}</p>;
  },
  strong: ({node, ...props}: any) => <strong className="font-bold text-blue-700 bg-blue-50 px-1 rounded" {...props} />,
  ul: ({node, ...props}: any) => <ul className="list-disc pl-5 mb-4 space-y-1 text-slate-600" {...props} />,
  ol: ({node, ...props}: any) => <ol className="list-decimal pl-5 mb-4 space-y-1 text-slate-600" {...props} />,
  li: ({node, ...props}: any) => <li className="pl-1" {...props} />,
  blockquote: ({node, ...props}: any) => <blockquote className="border-l-4 border-yellow-400 pl-4 py-2 my-4 bg-yellow-50 text-slate-700 rounded-r" {...props} />,
  // 代码块处理 - 支持ASCII艺术和普通代码
  pre: ({node, children, ...props}: any) => {
    return (
      <pre className="font-mono text-sm bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto my-4 whitespace-pre" {...props}>
        {children}
      </pre>
    );
  },
  code: ({node, inline, className, children, ...props}: any) => {
    const match = /language-(\w+)/.exec(className || '')
    const lang = match?.[1] || ''
    const codeContent = String(children).replace(/\n$/, '');

    // 行内代码
    if (inline) {
      return <code className="bg-slate-100 rounded px-1.5 py-0.5 font-mono text-sm text-pink-600" {...props}>{children}</code>
    }

    // 检测是否为ASCII艺术/知识结构图
    if (isAsciiArt(codeContent) || lang === 'diagram' || lang === 'ascii' || lang === 'tree') {
      return (
        <div className="my-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
          <div className="text-xs text-blue-600 font-medium mb-3 flex items-center gap-1">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            知识结构图
          </div>
          <pre className="font-mono text-sm text-slate-800 whitespace-pre overflow-x-auto leading-relaxed">
            {children}
          </pre>
        </div>
      )
    }

    // 普通代码块
    return (
      <div className="relative group my-3">
        {lang && <div className="absolute top-2 left-3 text-[10px] uppercase tracking-wider text-slate-400 bg-slate-800 px-2 py-0.5 rounded">{lang}</div>}
        <pre className="bg-slate-900 rounded-lg p-4 pt-8 overflow-x-auto text-slate-100 text-sm">
          <code className="font-mono whitespace-pre" {...props}>{children}</code>
        </pre>
      </div>
    )
  },
  table: ({node, ...props}: any) => (
    <div className="overflow-x-auto my-4 rounded-lg border border-slate-200 shadow-sm">
      <table className="w-full border-collapse" {...props} />
    </div>
  ),
  thead: ({node, ...props}: any) => <thead className="bg-slate-100" {...props} />,
  tbody: ({node, ...props}: any) => <tbody className="bg-white" {...props} />,
  th: ({node, ...props}: any) => <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 border-b border-slate-200" {...props} />,
  td: ({node, ...props}: any) => <td className="px-4 py-3 text-sm text-slate-600 border-b border-slate-100" {...props} />,
};

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
            <ReactMarkdown 
              remarkPlugins={[remarkGfm, remarkMath]} 
              rehypePlugins={[rehypeKatex]}
              components={customComponents}
            >
              {content}
            </ReactMarkdown>
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