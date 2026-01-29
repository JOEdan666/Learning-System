'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, Clock, CheckCircle, XCircle, ArrowRight, RotateCcw, Trophy, Terminal, RefreshCw } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import remarkBreaks from 'remark-breaks'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'

interface Question {
  id: number
  question: string
  type: 'multiple_choice' | 'short_answer' | 'essay'
  options?: string[]
  correctAnswer?: string
  points: number
}

import { MOCK_QUESTIONS_DATABASE } from '../../data/mockQuestions';

// 纯API驱动的题目生成 - 不再使用固定模板
const generateQuestionsFromAPI = async (
  content: string, 
  topic?: string, 
  region?: string, 
  grade?: string, 
  subject?: string, 
  semester?: string, 
  topicId?: string,
  onProgress?: (chunk: string) => void,
  skipMock: boolean = false
): Promise<Question[]> => {
  console.log('=== 开始API驱动题目生成 ===')
  console.log('主题:', topic, '跳过Mock:', skipMock)
  
  // 1. 尝试从 Mock 数据库获取题目 (优先topicId，其次名称包含)
  if (!skipMock) {
    if (topicId) {
      const byId = MOCK_QUESTIONS_DATABASE.find(m => m.topicId === topicId)
      if (byId) {
        console.log('>>> 命中 Mock 题库（topicId），秒级返回 <<<')
        await new Promise(resolve => setTimeout(resolve, 300))
        return byId.questions
      }
    }
    if (topic) {
      const byName = MOCK_QUESTIONS_DATABASE.find(m => topic.includes(m.topicId))
      if (byName) {
        console.log('>>> 命中 Mock 题库（名称包含），秒级返回 <<<')
        await new Promise(resolve => setTimeout(resolve, 300))
        return byName.questions
      }
    }
  }

  if ((!content || content.trim().length === 0) && !topic) {
    throw new Error('学习内容和主题不能同时为空')
  }

  try {
      // 创建AbortController用于超时控制
      const controller = new AbortController()
      const timeoutId = setTimeout(() => {
        controller.abort()
      }, 180000) // 延长到3分钟超时
      
      const response = await fetch('/api/openai-chat?stream=true', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: `你是一位资深的 ${grade || '中学'} ${semester || ''} ${subject || '全学科'} 命题专家，熟悉 ${region || '全国通用'} 地区的考试风格与课程标准。
请生成 3 道高质量考试题（极速诊断模式）。

## 🎯 命题原则
1. **严格匹配年级**：基于 **${grade || '中学'}** 知识体系，**禁止超纲**。计算数据要凑整。
2. **聚焦核心考点**：题目必须考查该知识点的核心内容和高频考点。
3. **突出易错易混**：设计干扰项时要针对学生常见的错误理解和思维陷阱。

## 📋 题目要求
**题型分布：**
- 2 道选择题：考查核心概念和易错点
- 1 道填空/简答题：考查解题关键步骤和核心公式

**质量标准：**
- **干扰项设计**：必须基于学生常见错误，有针对性地设计迷惑选项
- **解析要求**：
  - 明确指出本题考查的**核心考点**
  - 说明**解题的关键步骤**和突破口
  - 分析**易错点**：为什么学生容易选错？错在哪里？
  - 给出**记忆技巧**或**快速判断方法**（如有）
- **言简意赅**：题目表述简洁明了，不加入不必要的背景描述

**难度分布：**
- 基础题（40%）：直接考查核心概念
- 中等题（60%）：需要推理或计算
${grade === '八年级' ? '- 八年级题目侧重基础理解和简单应用' : ''}

---

请严格按照以下 JSON 格式输出：

{
  "questions": [
    {
      "id": 1,
      "subject": "${subject || '物理'}",
      "question": "题目内容（简洁明了）",
      "type": "multiple_choice",
      "options": ["A. 选项1", "B. 选项2", "C. 选项3", "D. 选项4"],
      "correctAnswer": "C",
      "explanation": "【考点】xxx\\n【解题关键】xxx\\n【易错分析】xxx\\n【技巧】xxx",
      "points": 10,
      "difficulty": "基础"
    }
  ]
}

## ⚠️ 重要提醒
1. 严格输出 **JSON 格式**，不添加任何额外文字。
2. 解析必须包含：考点、解题关键、易错分析。
3. 题目语言简洁，不要有多余的废话和背景描述。
4. 不要举不必要的生活例子，聚焦于学科知识本身。`
            },
            {
              role: 'user',
              content: `请根据以下学习内容生成3道高质量的考试题目：

**学习主题：** ${topic || '未指定'}
**适用年级：** ${grade || '中学'}
**学科领域：** ${subject || '数学'}
**地区要求：** ${region || '通用'}

**学习内容：**
${content}

**特别要求：**
1. 题目必须紧扣上述学习内容
2. 难度适合${grade || '中学'}学生
3. 体现${region || '通用'}地区的考试特色
4. 确保科学性和准确性
5. 提供详细的解析和评分标准

请严格按照JSON格式输出，生成10道题目。`
            }
          ]
        }),
        signal: controller.signal
      })

      // 清除超时定时器
      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`API请求失败: ${response.status} ${response.statusText}\n详细信息: ${errorText}`)
      }

      // 读取流式响应
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let fullContent = ''

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value, { stream: true })
          fullContent += chunk
          onProgress?.(fullContent)
        }
      } else {
        // 降级处理：非流式响应
        const data = await response.json()
        fullContent = data.content
        onProgress?.(fullContent)
      }

    console.log('API完整响应长度:', fullContent.length)

    // 解析JSON响应
    let questionsData
    try {
      // 尝试直接解析
      questionsData = JSON.parse(fullContent)
    } catch (e) {
      // 如果直接解析失败，尝试提取JSON部分
      const jsonMatch = fullContent.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        questionsData = JSON.parse(jsonMatch[0])
      } else {
        throw new Error(`无法解析API返回的JSON格式\n原始响应: ${fullContent}`)
      }
    }

    if (!questionsData.questions || !Array.isArray(questionsData.questions)) {
      throw new Error(`API返回的数据格式错误：缺少questions数组\n返回数据: ${JSON.stringify(questionsData)}`)
    }

    const questions = questionsData.questions

    // 验证题目格式
     for (let i = 0; i < questions.length; i++) {
       const q: any = questions[i]
       if (!q.id || !q.question || !q.type || !q.points) {
         throw new Error(`第${i+1}道题目格式错误：缺少必要字段\n题目数据: ${JSON.stringify(q)}`)
       }
       
       // 将fill_in_blank类型转换为short_answer类型
       if (q.type === 'fill_in_blank') {
         q.type = 'short_answer'
       }
       
       if (!['multiple_choice', 'short_answer', 'essay'].includes(q.type)) {
         throw new Error(`第${i+1}道题目类型错误：${q.type}，支持的类型：multiple_choice, short_answer, essay`)
       }

       if (q.type === 'multiple_choice' && (!q.options || !Array.isArray(q.options) || q.options.length !== 4)) {
         throw new Error(`第${i+1}道选择题缺少4个选项\n题目数据: ${JSON.stringify(q)}`)
       }
     }

     console.log('=== API题目生成成功 ===')
     return questions

  } catch (error) {
    console.error('=== API题目生成失败 ===')
    console.error('错误详情:', error)
    
    // 处理超时错误
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('题目生成超时（超过3分钟），请检查网络连接后重试')
    }
    
    throw error
  }
}

interface QuizStepProps {
  knowledgeContent: string
  region?: string
  grade?: string
  semester?: string
  subject?: string
  topic?: string
  topicId?: string
  onComplete: (results: { answers: string[], questions: Question[], score: number }) => void
  onBack: () => void
}

export default function QuizStep({ knowledgeContent, region, grade, semester, subject, topic, topicId, onComplete, onBack }: QuizStepProps) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<string[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [streamingText, setStreamingText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // 自动滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [streamingText])

  // 计时器
  useEffect(() => {
    if (!isLoading && !isCompleted) {
      const timer = setInterval(() => {
        setTimeElapsed(prev => prev + 1)
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [isLoading, isCompleted])

  // 生成题目
  const generateQuestions = async (forceRefresh = false) => {
    try {
      setIsLoading(true)
      setStreamingText('')
      console.log('=== 开始生成题目 ===', { forceRefresh })
      
      // 优先命中缓存，命中则秒回（除非强制刷新）
      if (!forceRefresh) {
        try {
          const cacheKey = `diagnose:${grade || ''}|${semester || ''}|${subject || ''}|${topicId || ''}|${topic || ''}`
          if (typeof window !== 'undefined') {
            const cached = sessionStorage.getItem(cacheKey)
            if (cached) {
              const parsed = JSON.parse(cached) as Question[]
              if (Array.isArray(parsed) && parsed.length > 0) {
                setQuestions(parsed)
                setAnswers(new Array(parsed.length).fill(''))
                setIsLoading(false)
                console.log('命中题目缓存，直接使用')
                return
              }
            }
          }
        } catch {}
      }
      
      // 验证学习内容
      if ((!knowledgeContent || knowledgeContent.trim().length === 0) && !topic) {
        const errorMsg = '学习内容和主题不能同时为空'
        console.error(errorMsg)
        throw new Error(errorMsg)
      }
      
      // 直接调用API或本地Mock生成题目
      const questions = await generateQuestionsFromAPI(
        knowledgeContent, 
        topic, 
        region, 
        grade, 
        subject, 
        semester, 
        topicId,
        (text) => setStreamingText(text), // 实时更新流式文本
        forceRefresh // 传递是否跳过Mock
      )
      
      console.log('=== 题目生成成功 ===')
      console.log('生成题目数量:', questions.length)
      
      setQuestions(questions)
      setAnswers(new Array(questions.length).fill(''))
      try {
        const cacheKey = `diagnose:${grade || ''}|${semester || ''}|${subject || ''}|${topicId || ''}|${topic || ''}`
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(cacheKey, JSON.stringify(questions))
        }
      } catch {}
    } catch (error) {
      console.error('=== 题目生成失败 ===')
      // ... 错误处理逻辑保持不变 ...
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      
      if (errorMessage.includes('fetch') || errorMessage.includes('timeout') || errorMessage.includes('network')) {
        alert(`网络连接问题：\n\n题目生成需要较长时间，请确保网络连接稳定并耐心等待。\n\n如果问题持续存在，请稍后重试。`)
      } else if (errorMessage.includes('API请求失败')) {
        alert(`服务暂时不可用：\n\n${errorMessage}\n\n请稍后重试，或联系技术支持。`)
      } else {
        alert(`题目生成遇到问题：\n\n${errorMessage}\n\n建议：\n1. 检查学习内容是否完整\n2. 稍后重试\n3. 如问题持续存在，请联系技术支持`)
      }
      
      setQuestions([])
      setAnswers([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    generateQuestions()
  }, [knowledgeContent, region, grade, semester, subject, topic, topicId])

  // 处理提交单题
  const handleAnswerSelect = (answer: string) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = answer;
    setAnswers(newAnswers);
  }

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      handleComplete();
    }
  }

  const handleComplete = () => {
    setIsCompleted(true);
    
    // 计算得分
    let totalScore = 0;
    let maxScore = 0;
    
    questions.forEach((q, index) => {
      maxScore += q.points;
      if (q.type === 'multiple_choice') {
        const userAnswer = answers[index]?.charAt(0).toUpperCase();
        const correctAnswer = q.correctAnswer?.charAt(0).toUpperCase();
        if (userAnswer === correctAnswer) {
          totalScore += q.points;
        }
      } else {
        if (answers[index]?.trim()) {
           totalScore += q.points * 0.5; 
        }
      }
    });

    const finalScore = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
    
    onComplete({
      answers,
      questions,
      score: finalScore
    });
  }

  // Loading Steps State
  const [loadingStep, setLoadingStep] = useState(0)
  const loadingMessages = [
    "正在深入分析学习内容与考点...",
    "正在构建题目架构与难度分层...",
    "正在生成干扰项与详细解析...",
    "正在进行最终质量校对..."
  ]

  // Cycle through loading messages
  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setLoadingStep(prev => (prev + 1) % loadingMessages.length)
      }, 3000)
      return () => clearInterval(interval)
    }
  }, [isLoading])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 max-w-2xl mx-auto">
        <div className="relative mb-8">
          <div className="w-20 h-20 border-4 border-blue-100 rounded-full animate-spin"></div>
          <div className="absolute top-0 left-0 w-20 h-20 border-4 border-blue-600 rounded-full animate-spin border-t-transparent"></div>
          <BookOpen className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-blue-600 w-8 h-8" />
        </div>
        
        <h3 className="text-xl font-bold text-slate-800 mb-2">AI 正在生成诊断题目</h3>
        
        <div className="h-8 overflow-hidden relative w-full text-center">
          <AnimatePresence mode='wait'>
            <motion.p
              key={loadingStep}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-slate-500"
            >
              {loadingMessages[loadingStep]}
            </motion.p>
          </AnimatePresence>
        </div>

        <div className="mt-8 flex gap-2">
          {[0, 1, 2, 3].map((step) => (
            <div 
              key={step}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                step === loadingStep ? 'w-8 bg-blue-600' : 'w-2 bg-slate-200'
              }`}
            />
          ))}
        </div>
      </div>
    )
  }

  // 安全检查：如果没有生成题目，显示重试界面，防止崩溃
  if (!questions || questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
          <XCircle className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">题目生成失败</h3>
        <p className="text-slate-500 mb-6 max-w-md text-center">可能是网络连接问题或 AI 服务繁忙，请稍后重试。</p>
        <button 
          onClick={() => generateQuestions(true)}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          重试
        </button>
      </div>
    )
  }

  const currentQuestion = questions[currentQuestionIndex];

  // 再次安全检查：防止索引越界
  if (!currentQuestion) {
     return null;
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* 进度条 */}
      <div className="mb-8">
        <div className="flex justify-between items-center text-sm text-slate-500 mb-2">
          <div className="flex items-center gap-4">
            <span>进度 {currentQuestionIndex + 1}/{questions.length}</span>
            <span>已用时 {Math.floor(timeElapsed / 60)}:{(timeElapsed % 60).toString().padStart(2, '0')}</span>
          </div>
          <button 
            onClick={() => generateQuestions(true)}
            className="flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 rounded transition-colors text-xs"
            title="对题目不满意？点击由 AI 重新生成"
          >
            <RefreshCw className="w-3 h-3" />
            换一批
          </button>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-blue-600"
            initial={{ width: 0 }}
            animate={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* 题目卡片 */}
      <AnimatePresence mode='wait'>
        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-10 min-h-[400px] flex flex-col"
        >
          <div className="flex items-start gap-4 mb-6">
            <span className="flex-shrink-0 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold">
              {currentQuestion.type === 'multiple_choice' ? '选择题' : 
               currentQuestion.type === 'short_answer' ? '填空题' : '简答题'}
            </span>
            <span className="text-sm text-slate-400 mt-1">{currentQuestion.points} 分</span>
          </div>

          <div className="text-xl md:text-2xl font-medium text-slate-900 leading-relaxed mb-8 flex items-start gap-2">
            <span className="flex-shrink-0">{currentQuestionIndex + 1}.</span>
            <div className="flex-1 overflow-x-auto">
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath, remarkBreaks]}
                rehypePlugins={[rehypeKatex]}
                components={{
                  // 保持段落间距，同时避免h3嵌套p导致的HTML错误
                  p: ({children}) => <p className="mb-2 last:mb-0">{children}</p>
                }}
              >
                {currentQuestion.question}
              </ReactMarkdown>
            </div>
          </div>

          <div className="flex-1">
            {currentQuestion.type === 'multiple_choice' && currentQuestion.options ? (
              <div className="space-y-3">
                {currentQuestion.options.map((option, idx) => {
                  const isSelected = answers[currentQuestionIndex] === option;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleAnswerSelect(option)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 flex items-center gap-4 ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm' 
                          : 'border-slate-100 hover:border-blue-200 hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center border-2 text-sm font-bold transition-colors ${
                        isSelected ? 'border-blue-500 bg-blue-500 text-white' : 'border-slate-200 text-slate-400'
                      }`}>
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <div className="text-lg flex-1">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm, remarkMath, remarkBreaks]}
                          rehypePlugins={[rehypeKatex]}
                          components={{
                            // 移除 p 标签默认的外边距以保持选项布局整洁
                            p: ({children}) => <span className="block">{children}</span>
                          }}
                        >
                          {option.replace(/^[A-D][\.\、\s]*/, '')}
                        </ReactMarkdown>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <textarea
                value={answers[currentQuestionIndex]}
                onChange={(e) => handleAnswerSelect(e.target.value)}
                placeholder="请输入你的答案..."
                className="w-full h-40 p-4 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:ring-0 resize-none text-lg"
              />
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between items-center">
             <button
              onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
              disabled={currentQuestionIndex === 0}
              className="px-6 py-2 text-slate-400 hover:text-slate-600 disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
            >
              上一题
            </button>
            
            <button
              onClick={handleNext}
              disabled={!answers[currentQuestionIndex]}
              className="px-8 py-3 bg-blue-600 text-white rounded-xl font-semibold shadow-lg shadow-blue-200 hover:bg-blue-700 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:shadow-none disabled:hover:translate-y-0"
            >
              {currentQuestionIndex === questions.length - 1 ? '提交测验' : '下一题'}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
