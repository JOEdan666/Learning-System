'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, AlertCircle, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react'

interface Question {
  id: number
  question: string
  type: 'multiple_choice' | 'short_answer' | 'essay'
  options?: string[]
  correctAnswer?: string
  points: number
}

export default function QuizGenerationTest() {
  const [testContent, setTestContent] = useState(`
# 二次函数的基本性质

## 1. 二次函数的定义
二次函数是形如 f(x) = ax² + bx + c (a ≠ 0) 的函数。

## 2. 二次函数的图像
二次函数的图像是一条抛物线：
- 当 a > 0 时，抛物线开口向上
- 当 a < 0 时，抛物线开口向下

## 3. 顶点坐标
二次函数 f(x) = ax² + bx + c 的顶点坐标为：
- x = -b/(2a)
- y = f(-b/(2a)) = (4ac - b²)/(4a)

## 4. 对称轴
二次函数的对称轴方程为：x = -b/(2a)

## 5. 判别式
对于二次方程 ax² + bx + c = 0：
- Δ = b² - 4ac
- Δ > 0：有两个不相等的实根
- Δ = 0：有两个相等的实根
- Δ < 0：无实根
  `)
  
  const [topic, setTopic] = useState('二次函数')
  const [region, setRegion] = useState('中国')
  const [grade, setGrade] = useState('高中')
  const [subject, setSubject] = useState('数学')
  
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    questions?: Question[]
    error?: string
    apiResponse?: any
    duration?: number
  } | null>(null)

  const generateQuestionsFromAPI = async (content: string, topic?: string, region?: string, grade?: string, subject?: string): Promise<Question[]> => {
    const startTime = Date.now()
    
    console.log('=== 开始API调用 ===')
    console.log('请求参数:', { topic, region, grade, subject, contentLength: content.length })
    
    const response = await fetch('/api/openai-chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: `你是一位专业的教育专家和出题老师，擅长根据学习内容生成高质量的考试题目。

## 📋 任务要求
请根据提供的学习内容，生成10道符合${region || '中国'}地区${grade || '中学'}${subject || '数学'}考试标准的题目。

## 🎯 题目要求
1. **题目类型分布**：
   - 选择题（multiple_choice）：4-5道，每题4个选项（A、B、C、D）
   - 简答题（short_answer）：3-4道，需要计算或简要说明
   - 论述题（essay）：1-2道，需要详细分析和论证

2. **质量标准**：
   - 题目必须基于提供的学习内容
   - 难度适合${grade || '中学'}学生水平
   - 考查不同层次的认知能力（记忆、理解、应用、分析）
   - 体现${region || '中国'}地区的教学特色和考试风格

3. **分值分配**：
   - 选择题：每题5分
   - 简答题：每题8-12分
   - 论述题：每题15-20分
   - 总分控制在100分左右

## 📝 输出格式
请严格按照以下JSON格式输出，不要添加任何其他文字：

\`\`\`json
{
  "questions": [
    {
      "id": 1,
      "question": "题目内容（选择题）",
      "type": "multiple_choice",
      "options": ["A. 选项1", "B. 选项2", "C. 选项3", "D. 选项4"],
      "correctAnswer": "A",
      "explanation": "详细解析（说明正确答案的原因）",
      "points": 5
    },
    {
      "id": 2,
      "question": "题目内容（要求有明确的解题步骤）",
      "type": "short_answer",
      "correctAnswer": "标准答案（包含关键步骤）",
      "explanation": "详细解析（包含解题方法和注意事项）",
      "points": 8
    },
    {
      "id": 3,
      "question": "题目内容（要求具有综合性和开放性）",
      "type": "essay",
      "correctAnswer": "参考答案要点（列出主要得分点）",
      "explanation": "评分标准（明确各部分分值分配）",
      "points": 15
    }
  ]
}
\`\`\`

## ⚠️ 重要提醒
- 必须严格按照JSON格式输出，不要添加任何其他文字
- 确保所有题目都基于提供的学习内容
- 题目难度要符合${grade || '中学'}学生的认知水平
- 每道题目都要有详细的解析和评分标准`
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
        ]
      })
    })

    const duration = Date.now() - startTime
    console.log('API响应时间:', duration + 'ms')

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API请求失败: ${response.status} ${response.statusText}\n详细信息: ${errorText}`)
    }

    const data = await response.json()
    console.log('API响应数据:', data)

    if (!data.content) {
      throw new Error('API响应格式错误：缺少content字段')
    }

    // 解析JSON响应
    let questionsData
    try {
      // 尝试直接解析
      questionsData = JSON.parse(data.content)
    } catch (e) {
      // 如果直接解析失败，尝试提取JSON部分
      const jsonMatch = data.content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        questionsData = JSON.parse(jsonMatch[0])
      } else {
        throw new Error(`无法解析API返回的JSON格式\n原始响应: ${data.content}`)
      }
    }

    if (!questionsData.questions || !Array.isArray(questionsData.questions)) {
      throw new Error(`API返回的数据格式错误：缺少questions数组\n返回数据: ${JSON.stringify(questionsData)}`)
    }

    const questions = questionsData.questions

    // 验证题目数量
    if (questions.length !== 10) {
      console.warn(`警告：期望10道题目，实际收到${questions.length}道题目`)
    }

    // 验证题目格式
    for (let i = 0; i < questions.length; i++) {
      const q: any = questions[i]
      if (!q.id || !q.question || !q.type || !q.points) {
        throw new Error(`第${i+1}道题目格式错误：缺少必要字段\n题目数据: ${JSON.stringify(q)}`)
      }
      
      if (!['multiple_choice', 'short_answer', 'essay'].includes(q.type)) {
        throw new Error(`第${i+1}道题目类型错误：${q.type}，支持的类型：multiple_choice, short_answer, essay`)
      }

      if (q.type === 'multiple_choice' && (!q.options || !Array.isArray(q.options) || q.options.length !== 4)) {
        throw new Error(`第${i+1}道选择题缺少4个选项\n题目数据: ${JSON.stringify(q)}`)
      }
    }

    console.log('=== API题目生成成功 ===')
    console.log('生成题目数量:', questions.length)
    console.log('题目类型分布:', {
      选择题: questions.filter((q: any) => q.type === 'multiple_choice').length,
      简答题: questions.filter((q: any) => q.type === 'short_answer').length,
      论述题: questions.filter((q: any) => q.type === 'essay').length
    })

    return questions
  }

  const handleTest = async () => {
    setIsLoading(true)
    setResult(null)
    
    const startTime = Date.now()
    
    try {
      console.log('=== 开始题目生成测试 ===')
      
      if (!testContent || testContent.trim().length === 0) {
        throw new Error('测试内容为空')
      }
      
      const questions = await generateQuestionsFromAPI(testContent, topic, region, grade, subject)
      const duration = Date.now() - startTime
      
      setResult({
        success: true,
        questions,
        duration
      })
      
      console.log('=== 测试成功完成 ===')
      
    } catch (error) {
      const duration = Date.now() - startTime
      console.error('=== 测试失败 ===', error)
      
      setResult({
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration
      })
    } finally {
      setIsLoading(false)
    }
  }

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-8"
        >
          <div className="flex items-center gap-3 mb-8">
            <BookOpen className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-800">题目生成诊断测试</h1>
          </div>

          {/* 配置区域 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">主题</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">地区</label>
              <input
                type="text"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">年级</label>
              <input
                type="text"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">学科</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* 测试内容 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">测试内容</label>
            <textarea
              value={testContent}
              onChange={(e) => setTestContent(e.target.value)}
              rows={10}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              placeholder="输入学习内容..."
            />
          </div>

          {/* 测试按钮 */}
          <div className="flex justify-center mb-8">
            <button
              onClick={handleTest}
              disabled={isLoading}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-lg font-medium"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <BookOpen className="w-5 h-5" />
                  开始测试
                </>
              )}
            </button>
          </div>

          {/* 结果显示 */}
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="border-t pt-8"
            >
              <div className="flex items-center gap-3 mb-6">
                {result.success ? (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-600" />
                )}
                <h2 className="text-2xl font-bold text-gray-800">
                  {result.success ? '测试成功' : '测试失败'}
                </h2>
                {result.duration && (
                  <div className="flex items-center gap-1 text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">{formatDuration(result.duration)}</span>
                  </div>
                )}
              </div>

              {result.success && result.questions ? (
                <div className="space-y-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="font-semibold text-green-800 mb-2">生成统计</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">总题目数：</span>
                        <span className="font-medium">{result.questions.length}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">选择题：</span>
                        <span className="font-medium">
                          {result.questions.filter(q => q.type === 'multiple_choice').length}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">简答题：</span>
                        <span className="font-medium">
                          {result.questions.filter(q => q.type === 'short_answer').length}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">论述题：</span>
                        <span className="font-medium">
                          {result.questions.filter(q => q.type === 'essay').length}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {result.questions.map((question, index) => (
                      <div key={question.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-gray-800">
                            题目 {index + 1} ({question.type === 'multiple_choice' ? '选择题' : 
                                            question.type === 'short_answer' ? '简答题' : '论述题'})
                          </h4>
                          <span className="text-sm text-gray-600">{question.points}分</span>
                        </div>
                        <p className="text-gray-700 mb-3">{question.question}</p>
                        {question.options && (
                          <div className="space-y-1 mb-3">
                            {question.options.map((option, optIndex) => (
                              <div key={optIndex} className="text-sm text-gray-600">
                                {option}
                              </div>
                            ))}
                          </div>
                        )}
                        {question.correctAnswer && (
                          <div className="text-sm">
                            <span className="font-medium text-green-700">正确答案：</span>
                            <span className="text-gray-700">{question.correctAnswer}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-red-800 mb-2">错误详情</h3>
                      <pre className="text-sm text-red-700 whitespace-pre-wrap bg-red-100 p-3 rounded border">
                        {result.error}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  )
}