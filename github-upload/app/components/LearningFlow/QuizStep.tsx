'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, Clock, CheckCircle, XCircle, ArrowRight, RotateCcw, Trophy } from 'lucide-react'

interface Question {
  id: number
  question: string
  type: 'multiple_choice' | 'short_answer' | 'essay'
  options?: string[]
  correctAnswer?: string
  points: number
}

// 纯API驱动的题目生成 - 不再使用固定模板
const generateQuestionsFromAPI = async (
  content: string,
  topic?: string,
  region?: string,
  grade?: string,
  subject?: string,
  onProgress?: (partialQuestions: Question[]) => void
): Promise<Question[]> => {
  console.log('=== 开始API驱动题目生成 ===')
  console.log('学习内容:', content?.substring(0, 200) + '...')
  console.log('主题:', topic)
  console.log('地区:', region)
  console.log('年级:', grade) 
  console.log('学科:', subject)
  
  if (!content || content.trim().length === 0) {
    throw new Error('学习内容不能为空')
  }

  try {
      // 创建AbortController用于超时控制
      const controller = new AbortController()
      const timeoutId = setTimeout(() => {
        controller.abort()
      }, 120000) // 2分钟超时
      
      const response = await fetch('/api/openai-chat?stream=1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: `你是一位资深的 ${grade || '中学'} ${subject || '全学科'} 教师和考试专家，熟悉 ${region || '通用'} 的命题风格。\n请根据提供的学习内容生成 10 道高质量考试题，并以 NDJSON（换行分隔的 JSON）逐条输出，方便前端流式解析。\n\n严格要求：仅输出 10 行 JSON 对象，不要输出数组、标题或任何额外说明。\n\n字段：{id, subject, question, type, options?, correctAnswer, explanation, points, difficulty}\n规范：\n- 题型覆盖：2~4 道 multiple_choice、1~3 道 short_answer（不要使用 fill_in_blank）、其余 essay；\n- multiple_choice 必须提供 4 个选项；\n- 内容准确、表达清晰、解析详尽；\n- 难度比例：基础30% / 中等50% / 提高20%；\n- 题干紧扣学习内容与考纲；\n- 论述题给出得分要点；\n\n示例（注意仅逐行对象）：\n{"id":1,"subject":"数学","question":"……","type":"multiple_choice","options":["A…","B…","C…","D…"],"correctAnswer":"B","explanation":"……","points":5,"difficulty":"基础"}`
            },
            {
              role: 'user',
              content: `请根据以下学习内容生成10道高质量的考试题目：

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
          ],
          model: 'gpt-4o-mini',
          max_tokens: 2000
        }),
        signal: controller.signal
      })

      // 清除超时定时器
      clearTimeout(timeoutId)

      if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API请求失败: ${response.status} ${response.statusText}\n详细信息: ${errorText}`)
    }

    // 流式读取响应：优先按 NDJSON 逐条解析并推送进度；若失败再整体解析
    let fullText = ''
    const parsedQuestions: Question[] = []
    const reader = response.body?.getReader()
    if (reader) {
      const decoder = new TextDecoder('utf-8')
      let buffer = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        fullText += chunk
        buffer += chunk
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''
        for (const raw of lines) {
          const line = raw.trim()
          if (!line) continue
          try {
            const qObj: any = JSON.parse(line)
            if (qObj.type === 'fill_in_blank') qObj.type = 'short_answer'
            if (!qObj.id) qObj.id = parsedQuestions.length + 1
            const normalized: Question = {
              id: qObj.id,
              question: qObj.question,
              type: qObj.type,
              options: qObj.options,
              correctAnswer: qObj.correctAnswer,
              points: qObj.points ?? 5,
            }
            // 基础校验
            if (!normalized.question || !normalized.type) continue
            if (!['multiple_choice', 'short_answer', 'essay'].includes(normalized.type)) continue
            if (normalized.type === 'multiple_choice' && (!normalized.options || normalized.options.length !== 4)) continue
            parsedQuestions.push(normalized)
            if (onProgress) onProgress([...parsedQuestions])
          } catch {
            // 非完整行，等待后续流
          }
        }
      }
      const last = buffer.trim()
      if (last) {
        try {
          const qObj: any = JSON.parse(last)
          if (qObj.type === 'fill_in_blank') qObj.type = 'short_answer'
          if (!qObj.id) qObj.id = parsedQuestions.length + 1
          const normalized: Question = {
            id: qObj.id,
            question: qObj.question,
            type: qObj.type,
            options: qObj.options,
            correctAnswer: qObj.correctAnswer,
            points: qObj.points ?? 5,
          }
          if (normalized.question && ['multiple_choice', 'short_answer', 'essay'].includes(normalized.type)) {
            if (normalized.type !== 'multiple_choice' || (normalized.options && normalized.options.length === 4)) {
              parsedQuestions.push(normalized)
              if (onProgress) onProgress([...parsedQuestions])
            }
          }
        } catch {}
      }

      if (parsedQuestions.length > 0) {
        console.log('=== NDJSON 流式解析成功 ===', parsedQuestions.length)
        return parsedQuestions
      }
    } else {
      const data = await response.json()
      console.log('API响应:', data)
      if (!data.content) {
        throw new Error('API响应格式错误：缺少content字段')
      }
      fullText = data.content
    }

    // 兼容：整体 JSON 数组解析
    let questionsData
    try {
      questionsData = JSON.parse(fullText)
    } catch (e) {
      const jsonMatch = fullText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        questionsData = JSON.parse(jsonMatch[0])
      } else {
        throw new Error(`无法解析API返回的JSON格式\n原始响应: ${fullText}`)
      }
    }

    if (!questionsData.questions || !Array.isArray(questionsData.questions)) {
      throw new Error(`API返回的数据格式错误：缺少questions数组\n返回数据: ${JSON.stringify(questionsData)}`)
    }

    const questions = questionsData.questions

    if (questions.length !== 10) {
      console.warn(`警告：期望10道题目，实际收到${questions.length}道题目`)
    }

    for (let i = 0; i < questions.length; i++) {
      const q: any = questions[i]
      if (!q.id || !q.question || !q.type || !q.points) {
        throw new Error(`第${i+1}道题目格式错误：缺少必要字段\n题目数据: ${JSON.stringify(q)}`)
      }
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

    console.log('=== API题目生成成功（整体JSON） ===')
    console.log('生成题目数量:', questions.length)
    console.log('题目类型分布:', {
      选择题: questions.filter((q: any) => q.type === 'multiple_choice').length,
      简答题: questions.filter((q: any) => q.type === 'short_answer').length,
      论述题: questions.filter((q: any) => q.type === 'essay').length
    })

    return questions

  } catch (error) {
    console.error('=== API题目生成失败 ===')
    console.error('错误详情:', error)
    
    // 处理超时错误
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('题目生成超时（超过2分钟），请检查网络连接后重试')
    }
    
    throw error
  }
}

interface QuizStepProps {
  knowledgeContent: string
  region?: string
  grade?: string
  subject?: string
  topic?: string
  onComplete: (results: { answers: string[], questions: Question[], score: number }) => void
  onBack: () => void
}

export default function QuizStep({ knowledgeContent, region, grade, subject, topic, onComplete, onBack }: QuizStepProps) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<string[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)

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
  const generateQuestions = async () => {
    try {
      setIsLoading(true)
      console.log('=== 开始生成题目 ===')
      
      // 验证学习内容
      if (!knowledgeContent || knowledgeContent.trim().length === 0) {
        const errorMsg = '学习内容为空，无法生成题目'
        console.error(errorMsg)
        throw new Error(errorMsg)
      }
      
      console.log('学习内容长度:', knowledgeContent.length)
      console.log('学习内容预览:', knowledgeContent.substring(0, 200) + '...')
      console.log('主题:', topic)
      console.log('地区:', region)
      console.log('年级:', grade)
      console.log('学科:', subject)
      
      // 直接调用API生成题目（支持流式增量）
      const questions = await generateQuestionsFromAPI(
        knowledgeContent,
        topic,
        region,
        grade,
        subject,
        (qs) => {
          // 流式回传增量题目，立即渲染
          setQuestions(qs)
          setAnswers(prev => {
            const next = [...prev]
            if (next.length < qs.length) {
              next.push(...new Array(qs.length - next.length).fill(''))
            }
            return next
          })
          // 一旦收到首题，结束加载遮罩
          setIsLoading(false)
        }
      )
      
      console.log('=== 题目生成成功 ===')
      console.log('生成题目数量:', questions.length)
      
      setQuestions(questions)
      setAnswers(new Array(questions.length).fill(''))
    } catch (error) {
      console.error('=== 题目生成失败 ===')
      console.error('错误类型:', error instanceof Error ? error.constructor.name : typeof error)
      console.error('错误消息:', error instanceof Error ? error.message : String(error))
      console.error('错误堆栈:', error instanceof Error ? error.stack : '无堆栈信息')
      
      // 显示用户友好的错误信息
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      
      // 检查是否是网络或超时问题
      if (errorMessage.includes('fetch') || errorMessage.includes('timeout') || errorMessage.includes('network')) {
        alert(`网络连接问题：\n\n题目生成需要较长时间（通常1-2分钟），请确保网络连接稳定并耐心等待。\n\n如果问题持续存在，请稍后重试。`)
      } else if (errorMessage.includes('API请求失败')) {
        alert(`服务暂时不可用：\n\n${errorMessage}\n\n请稍后重试，或联系技术支持。`)
      } else {
        alert(`题目生成遇到问题：\n\n${errorMessage}\n\n建议：\n1. 检查学习内容是否完整\n2. 稍后重试\n3. 如问题持续存在，请联系技术支持`)
      }
      
      // 设置空题目数组，让用户知道生成失败
      setQuestions([])
      setAnswers([])
    } finally {
      console.log('=== 题目生成流程结束 ===')
      setIsLoading(false)
    }
  }

  useEffect(() => {
    generateQuestions()
  }, [knowledgeContent])

  const handleAnswerChange = (value: string) => {
    const newAnswers = [...answers]
    newAnswers[currentQuestionIndex] = value
    setAnswers(newAnswers)
  }

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setIsCompleted(true)
    
    // 这里先给一个临时分数，实际评分会在下一步进行
    const tempScore = 0
    onComplete({ answers, questions, score: tempScore })
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 relative">
        <div className="relative z-10 container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-20">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-6"
              />
              <h2 className="text-2xl font-bold text-blue-800 mb-4">AI正在为您生成专属题目...</h2>
              <p className="text-blue-600 mb-4">根据您的学习内容，精心设计试题目</p>
              
              {/* 进度提示 */}
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 max-w-md mx-auto mt-8">
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span>分析学习内容...</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
                    <span>设计题目类型...</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
                    <span>生成高质量题目...</span>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-700">
                    💡 <strong>提示：</strong>AI正在深度分析您的学习内容，生成个性化题目。
                    这个过程通常需要1-2分钟，请耐心等待。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100

  // 如果没有当前题目，显示加载状态
  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-blue-600 font-medium">正在加载题目...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 relative">
      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* 头部信息 */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 mb-8 border border-blue-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-blue-800">知识测验</h1>
                  <p className="text-blue-600">检验您的学习成果</p>
                </div>
              </div>
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2 text-blue-600">
                  <Clock className="w-5 h-5" />
                  <span className="font-mono text-lg">{formatTime(timeElapsed)}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm text-blue-500">进度</div>
                  <div className="text-lg font-bold text-blue-700">
                    {currentQuestionIndex + 1} / {questions.length}
                  </div>
                </div>
              </div>
            </div>

            {/* 进度条 */}
            <div className="w-full bg-blue-100 rounded-full h-3">
              <motion.div
                className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full shadow-sm"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          {/* 题目区域 */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestionIndex}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 mb-8 border border-blue-200"
            >
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                    第 {currentQuestion.id} 题
                  </span>
                  <span className="text-blue-600 font-bold">{currentQuestion.points} 分</span>
                </div>
                <h2 className="text-xl font-bold text-blue-800 leading-relaxed">
                  {currentQuestion.question}
                </h2>
              </div>

              {/* 答题区域 */}
              <div className="mb-8">
                {currentQuestion.type === 'multiple_choice' && currentQuestion.options ? (
                  <div className="space-y-3">
                    {currentQuestion.options.map((option: string, index: number) => (
                      <label
                        key={index}
                        className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                          answers[currentQuestionIndex] === option
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-blue-200 hover:border-blue-400'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`question-${currentQuestion.id}`}
                          value={option}
                          checked={answers[currentQuestionIndex] === option}
                          onChange={(e) => handleAnswerChange(e.target.value)}
                          className="sr-only"
                        />
                        <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                          answers[currentQuestionIndex] === option
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-blue-300'
                        }`}>
                          {answers[currentQuestionIndex] === option && (
                            <div className="w-2 h-2 bg-white rounded-full" />
                          )}
                        </div>
                        <span className="text-blue-800">{option}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <textarea
                    value={answers[currentQuestionIndex] || ''}
                    onChange={(e) => handleAnswerChange(e.target.value)}
                    placeholder={currentQuestion.type === 'essay' ? '请详细阐述您的观点...' : '请简要回答...'}
                    className="w-full p-4 border-2 border-blue-200 rounded-xl focus:border-blue-500 focus:outline-none resize-none"
                    rows={currentQuestion.type === 'essay' ? 8 : 4}
                  />
                )}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* 导航按钮 */}
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center space-x-2 px-6 py-3 text-blue-600 hover:text-blue-800 transition-colors"
            >
              <ArrowRight className="w-5 h-5 rotate-180" />
              <span>返回学习</span>
            </button>

            <div className="flex items-center space-x-4">
              {currentQuestionIndex > 0 && (
                <button
                  onClick={handlePrevious}
                  className="px-6 py-3 border-2 border-blue-300 text-blue-700 rounded-xl hover:border-blue-400 transition-colors"
                >
                  上一题
                </button>
              )}

              {currentQuestionIndex < questions.length - 1 ? (
                <button
                  onClick={handleNext}
                  disabled={!answers[currentQuestionIndex]}
                  className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  <span>下一题</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={!answers[currentQuestionIndex] || isSubmitting}
                  className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl hover:from-blue-700 hover:to-indigo-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all"
                >
                  {isSubmitting ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                      />
                      <span>提交中...</span>
                    </>
                  ) : (
                    <>
                      <Trophy className="w-5 h-5" />
                      <span>提交答案</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}