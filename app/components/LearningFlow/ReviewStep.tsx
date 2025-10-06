'use client'
import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import html2canvas from 'html2canvas';
import { Download, Camera } from 'lucide-react';
import 'katex/dist/katex.min.css';
import TableRenderer, { parseMarkdownTable } from '../TableRenderer';

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
  };
  quizQuestions?: any[];
  learningDuration?: number; // 学习时长（分钟）
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
  learningDuration = 0
}) => {
  const [hasReviewed, setHasReviewed] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [aiSummary, setAiSummary] = useState<string>('');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [learningRecommendations, setLearningRecommendations] = useState<string[]>([]);
  const summaryRef = useRef<HTMLDivElement>(null);

  // 混合渲染函数：检测表格并选择合适的渲染方式
  const renderContentWithTables = (content: string, customComponents: any) => {
    // 检查内容是否包含表格
    const hasTable = parseMarkdownTable(content) !== null;
    
    if (hasTable) {
      // 如果包含表格，使用TableRenderer处理表格，ReactMarkdown处理其他内容
      const tableRegex = /(\|.+\|\n\|[-\s|:]+\|\n(?:\|.+\|\n?)*)/g;
      const parts = content.split(tableRegex);
      
      return (
        <div>
          {parts.map((part, index) => {
            // 检查这部分是否是表格
            if (parseMarkdownTable(part)) {
              return <TableRenderer key={index} content={part} />;
            } else if (part.trim()) {
              // 非表格内容使用ReactMarkdown渲染
              return (
                <ReactMarkdown
                  key={index}
                  remarkPlugins={[remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                  components={customComponents}
                >
                  {part}
                </ReactMarkdown>
              );
            }
            return null;
          })}
        </div>
      );
    } else {
      // 如果没有表格，直接使用ReactMarkdown
      return (
        <ReactMarkdown
          remarkPlugins={[remarkMath]}
          rehypePlugins={[rehypeKatex]}
          components={customComponents}
        >
          {content}
        </ReactMarkdown>
      );
    }
  };

  // 生成AI学习总结
  const generateAISummary = async () => {
    if (!session || isGeneratingSummary || aiSummary) return;
    
    setIsGeneratingSummary(true);
    try {
      const response = await fetch('/api/openai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: `你是一个专业的学习分析师和教育专家。请根据学生的学习情况生成深度的、个性化的学习总结和分析。

## 📋 分析目标
为学生提供有价值的学习反馈，帮助他们了解自己的学习状况，发现优势和不足，并获得改进建议。

## 📊 可以关注的方面
你可以从以下角度进行分析，但不必拘泥于固定格式：
- 知识掌握情况和理解深度
- 学习表现和能力评估
- 错误模式和改进方向
- 学习效率和时间管理
- 个性化建议和后续规划

## 📝 写作要求
- 使用专业但易懂的语言
- 提供具体的数据支撑
- 包含鼓励性的正面反馈
- 给出明确的行动建议
- 用自然的方式组织内容，避免固定模板`
            },
            {
              role: 'user',
              content: `请为以下学习情况生成深度个性化分析：

## 📚 学习基本信息
- **学习主题**: ${session.topic}
- **学科领域**: ${session.subject}
- **学习时长**: ${learningDuration}分钟
- **完成时间**: ${new Date().toLocaleDateString()}

## 📊 学习成果数据
- **测验得分**: ${score}/${totalQuestions}题正确
- **得分率**: ${Math.round((score/totalQuestions)*100)}%
- **理解程度**: ${getUnderstandingText(understandingLevel)} (${understandingLevel}/5星)
- **学习效率**: ${learningDuration > 0 ? Math.round((score/totalQuestions)*100/learningDuration*10) : 0}分/题

## 📖 学习内容概要
${content.substring(0, 800)}...

## 🎯 测验详细表现
${quizQuestions.map((q: any, index: number) => {
  const isCorrect = q.userAnswer === q.correctAnswer;
  return `**题目${index + 1}** [${isCorrect ? '✅正确' : '❌错误'}]: ${q.question.substring(0, 80)}...
  - 学生答案: ${q.userAnswer || '未作答'}
  - 正确答案: ${q.correctAnswer}
  ${!isCorrect ? `- 错误分析: ${q.errorType || '需要进一步分析'}` : ''}`;
}).join('\n\n')}

## 🎯 分析要求
请生成一份深度学习分析报告，用自然灵活的方式分析学生的学习情况，提供有价值的反馈和建议。

请确保分析具有**专业性、针对性和实用性**，但不必拘泥于固定的格式结构。`
            }
          ]
        })
      });

      if (response.ok) {
        const data = await response.json();
        setAiSummary(data.content || '');
      } else {
        throw new Error('AI总结生成失败');
      }
    } catch (error) {
      console.error('生成AI总结失败:', error);
      // 使用增强的智能总结作为备选
      const enhancedSummary = generateEnhancedIntelligentSummary();
      setAiSummary(enhancedSummary);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  // 生成个性化学习建议
  const generateLearningRecommendations = (): string[] => {
    const scorePercentage = Math.round((score / totalQuestions) * 100);
    const recommendations: string[] = [];

    // 基于得分率生成核心建议
    if (scorePercentage >= 90) {
      recommendations.push(
        `🎯 挑战进阶内容：尝试学习${session?.topic}的高级应用和相关拓展知识`,
        `🔗 知识整合：将${session?.topic}与其他学科知识点建立联系`,
        `💼 实践应用：寻找实际项目或案例来应用所学知识`
      );
    } else if (scorePercentage >= 80) {
      recommendations.push(
        `📚 深化理解：重点复习少数错误题目涉及的知识点`,
        `🎯 提升精度：通过更多练习提高答题准确性`,
        `🔄 定期复习：建立定期复习机制巩固已掌握的知识`
      );
    } else if (scorePercentage >= 70) {
      recommendations.push(
        `📖 基础巩固：重点复习${session?.topic}的核心概念和基础知识`,
        `🔄 反复练习：每天安排20-30分钟进行相关练习`,
        `🤝 寻求帮助：对不理解的知识点及时请教老师或同学`
      );
    } else if (scorePercentage >= 60) {
      recommendations.push(
        `🎯 重点突破：系统性复习${session?.topic}的基础概念`,
        `📝 笔记整理：制作知识点思维导图和重点笔记`,
        `⏰ 增加时间：建议每天至少投入30-45分钟学习相关内容`,
        `👥 学习小组：加入学习小组，通过讨论加深理解`
      );
    } else {
      recommendations.push(
        `📚 从头开始：建议重新系统学习${session?.topic}的基础知识`,
        `🎥 多媒体学习：寻找视频教程和在线课程辅助理解`,
        `🤝 一对一辅导：考虑寻求老师或同学的个别指导`,
        `⏰ 充足时间：每天安排至少45-60分钟专门学习时间`
      );
    }

    // 基于理解程度调整建议
    if (understandingLevel <= 2) {
      recommendations.push(`💡 理解优先：重点关注概念理解，而非题目数量`);
    } else if (understandingLevel >= 4) {
      recommendations.push(`🚀 应用导向：重点练习知识的实际应用和综合运用`);
    }

    // 基于学习时长调整建议
    if (learningDuration < 15) {
      recommendations.push(`⏰ 延长学习：建议增加学习时间，确保充分理解`);
    } else if (learningDuration > 60) {
      recommendations.push(`⚡ 提高效率：尝试改进学习方法，提高学习效率`);
    }

    // 返回最多5条核心建议
    return recommendations.slice(0, 5);
  };

  // 生成增强的智能学习总结
  const generateEnhancedIntelligentSummary = (): string => {
    const scorePercentage = Math.round((score / totalQuestions) * 100);
    const correctAnswers = score;
    const wrongAnswers = totalQuestions - score;
    const learningEfficiency = learningDuration > 0 ? Math.round(scorePercentage / learningDuration * 10) : 0;
    
    // 分析学习表现等级
    const getPerformanceLevel = (percentage: number) => {
      if (percentage >= 90) return { level: '优秀', color: '🟢', description: '知识掌握非常扎实' };
      if (percentage >= 80) return { level: '良好', color: '🔵', description: '基础理解较好，有提升空间' };
      if (percentage >= 70) return { level: '中等', color: '🟡', description: '基本掌握，需要加强练习' };
      if (percentage >= 60) return { level: '及格', color: '🟠', description: '理解有限，需要重点复习' };
      return { level: '需要提升', color: '🔴', description: '基础薄弱，建议系统性学习' };
    };

    const performance = getPerformanceLevel(scorePercentage);
    
    // 分析错误模式
    const analyzeErrorPatterns = () => {
      if (wrongAnswers === 0) return '🎉 **完美表现！** 所有题目都答对了，显示出对知识点的全面掌握。';
      if (wrongAnswers === 1) return '👍 **接近完美！** 仅有1题错误，整体掌握很好，注意细节即可。';
      if (wrongAnswers <= totalQuestions * 0.3) return '📈 **良好表现！** 大部分知识点掌握良好，少数错误可能是粗心或理解不够深入。';
      if (wrongAnswers <= totalQuestions * 0.5) return '⚠️ **需要加强！** 约一半题目存在问题，建议重点复习相关概念。';
      return '🚨 **重点关注！** 多数题目答错，建议系统性重新学习基础概念。';
    };

    // 学习效率分析
    const analyzeEfficiency = () => {
      if (learningDuration < 10) return '⚡ 学习时间较短，建议增加深度思考时间';
      if (learningDuration > 60) return '🐌 学习时间较长，可以尝试提高学习效率';
      if (learningEfficiency > 8) return '🚀 学习效率很高，时间利用得当';
      if (learningEfficiency > 5) return '📊 学习效率中等，有优化空间';
      return '📉 学习效率偏低，建议改进学习方法';
    };

    return `# 📊 深度学习分析报告

## 🎯 学习表现总览

### 📈 核心数据
| 指标 | 数值 | 评价 |
|------|------|------|
| **总体得分** | ${correctAnswers}/${totalQuestions} (${scorePercentage}%) | ${performance.color} ${performance.level} |
| **理解程度** | ${understandingLevel}/5星 | ${understandingLevel >= 4 ? '🌟 理解深入' : understandingLevel >= 3 ? '📚 理解良好' : '📖 需要加强'} |
| **学习时长** | ${learningDuration}分钟 | ${analyzeEfficiency()} |
| **学习效率** | ${learningEfficiency}分/题 | ${learningEfficiency > 6 ? '高效' : learningEfficiency > 3 ? '中等' : '待提升'} |

## 🧠 知识掌握分析

### 📚 **${session?.topic}** 掌握情况
${performance.description}

**具体表现：**
- ✅ **正确题目**: ${correctAnswers}题 - 显示了对核心概念的${correctAnswers/totalQuestions > 0.8 ? '深度理解' : correctAnswers/totalQuestions > 0.6 ? '良好掌握' : '基本认知'}
- ${wrongAnswers > 0 ? `❌ **错误题目**: ${wrongAnswers}题 - ${analyzeErrorPatterns()}` : ''}

### 🎯 知识点掌握度评估
${scorePercentage >= 80 ? 
  `**优势领域：**
- 对${session?.topic}的核心概念理解准确
- 能够正确应用理论知识解决问题
- 具备良好的逻辑思维和分析能力

**巩固建议：**
- 继续保持当前学习状态
- 可以尝试更有挑战性的题目
- 将知识应用到实际场景中` :
  `**需要加强的领域：**
- ${session?.topic}的基础概念理解需要深化
- 知识点之间的联系需要加强
- 实际应用能力有待提升

**重点改进方向：**
- 重新梳理${session?.topic}的知识框架
- 加强基础概念的理解和记忆
- 通过更多练习提高应用能力`
}

## 🔍 学习能力诊断

### 💡 思维能力分析
- **理解能力**: ${understandingLevel >= 4 ? '强' : understandingLevel >= 3 ? '中等' : '待提升'} - ${understandingLevel >= 4 ? '能够快速理解复杂概念' : understandingLevel >= 3 ? '基本理解能力良好' : '需要更多时间消化知识'}
- **应用能力**: ${scorePercentage >= 80 ? '强' : scorePercentage >= 60 ? '中等' : '待提升'} - ${scorePercentage >= 80 ? '能够灵活运用知识解决问题' : scorePercentage >= 60 ? '基本应用能力可以' : '需要加强知识的实际运用'}
- **学习效率**: ${learningEfficiency > 6 ? '高' : learningEfficiency > 3 ? '中等' : '待提升'} - ${analyzeEfficiency()}

## 🎯 个性化改进方案

### 📋 短期目标（1-2周）
${scorePercentage >= 80 ? 
  `1. 🎯 **深化理解**：尝试解决更复杂的${session?.topic}相关问题
2. 🔗 **知识拓展**：学习与${session?.topic}相关的进阶内容
3. 🎨 **实践应用**：将所学知识应用到实际项目或案例中` :
  `1. 📚 **基础巩固**：重点复习${session?.topic}的核心概念
2. 🔄 **反复练习**：每天安排15-20分钟练习相关题目
3. 🤝 **寻求帮助**：对不理解的知识点及时请教老师或同学`
}

### 🚀 中期目标（1个月）
1. 📈 **提升目标**：将理解程度提升到${Math.min(5, understandingLevel + 1)}星水平
2. 🎯 **准确率目标**：测验准确率达到${Math.min(100, scorePercentage + 20)}%以上
3. ⚡ **效率目标**：学习效率提升${learningEfficiency < 5 ? '50%' : '20%'}

### 📚 推荐学习资源
- 📖 **教材章节**：重点复习${session?.subject}中关于${session?.topic}的相关章节
- 🎥 **视频教程**：寻找${session?.topic}的在线视频课程
- 📝 **练习题库**：多做${session?.topic}相关的练习题
- 👥 **学习小组**：与同学组成学习小组，互相讨论和答疑

## 📅 后续学习建议

### 🎯 学习重点
${scorePercentage >= 80 ? 
  `由于你在${session?.topic}方面表现优秀，建议：
- 🚀 学习更高级的相关概念
- 🔗 探索${session?.topic}与其他知识点的联系
- 💼 尝试将知识应用到实际问题中` :
  `针对当前的学习状况，建议重点关注：
- 🎯 ${session?.topic}的基础概念理解
- 📚 相关知识点的系统性学习
- 🔄 通过大量练习提高熟练度`
}

### ⏰ 学习计划建议
- **每日学习时间**：${learningDuration < 30 ? '30-45分钟' : '保持当前时长'}
- **复习频率**：每周至少复习2-3次
- **测验频率**：每周进行1次自测

---

*📊 本报告基于您的学习数据生成，建议定期进行学习评估以跟踪进步情况。*`;
  };

  // 组件加载时生成AI总结和建议
  useEffect(() => {
    generateAISummary();
    const recommendations = generateLearningRecommendations();
    setLearningRecommendations(recommendations);
  }, [session, score, totalQuestions, understandingLevel]);

  const handleContinue = () => {
    setHasReviewed(true);
    onContinue();
  };

  const getScoreColor = (score: number, total: number): string => {
    const percentage = (score / total) * 100;
    if (percentage >= 80) return 'text-green-600 dark:text-green-400';
    if (percentage >= 60) return 'text-blue-600 dark:text-blue-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getUnderstandingText = (level: number): string => {
    switch (level) {
      case 1: return '初步了解';
      case 2: return '基本理解';
      case 3: return '一般掌握';
      case 4: return '较好掌握';
      case 5: return '完全掌握';
      default: return '';
    }
  };

  const getUnderstandingColor = (level: number): string => {
    switch (level) {
      case 1: return 'bg-red-500';
      case 2: return 'bg-orange-500';
      case 3: return 'bg-yellow-500';
      case 4: return 'bg-blue-500';
      case 5: return 'bg-green-500';
      default: return '';
    }
  };

  const getOverallAssessment = (score: number, total: number, level: number): string => {
    const scorePercentage = (score / total) * 100;
    
    if (scorePercentage >= 80 && level >= 4) {
      return '优秀！你已经完全掌握了这个知识点，可以继续学习新的内容。';
    } else if (scorePercentage >= 60 && level >= 3) {
      return '良好！你对这个知识点有了较好的理解，但还有提升空间。';
    } else {
      return '需要加强！建议你重新学习这个知识点，巩固基础。';
    }
  };

  // 截长图功能
  const handleCapture = async () => {
    if (!summaryRef.current) return;
    
    setIsCapturing(true);
    try {
      const canvas = await html2canvas(summaryRef.current, {
        useCORS: true,
        allowTaint: true,
        background: '#111827', // 深色背景
        height: summaryRef.current.scrollHeight,
        width: summaryRef.current.scrollWidth,
      });
      
      // 创建下载链接
      const link = document.createElement('a');
      link.download = `学习总结_${session?.topic || '知识点'}_${new Date().toLocaleDateString()}.png`;
      link.href = canvas.toDataURL();
      link.click();
    } catch (error) {
      console.error('截图失败:', error);
      alert('截图失败，请重试');
    } finally {
      setIsCapturing(false);
    }
  };

  // 格式化学习时长
  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}分钟`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}小时${remainingMinutes > 0 ? remainingMinutes + '分钟' : ''}`;
  };

  return (
    <div className="max-w-2xl mx-auto bg-gray-900 min-h-screen">
      <div className="mb-6 p-6">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-2xl font-bold text-yellow-400 mb-2 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              学习总结
            </h3>
            <p className="text-white">
              回顾你的学习过程和成果
            </p>
          </div>
          <button
            onClick={handleCapture}
            disabled={isCapturing}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
          >
            {isCapturing ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Camera className="w-4 h-4" />
            )}
            <span>{isCapturing ? '生成中...' : '截长图'}</span>
          </button>
        </div>
      </div>

      {/* 可截图的内容区域 */}
      <div ref={summaryRef} className="bg-gray-900 p-6">
        {/* 学习概览 */}
        {session && (
          <div className="bg-gray-800 rounded p-6 mb-6 border border-gray-600">
            <h4 className="font-bold text-yellow-400 mb-4 text-lg">学习概览</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-white">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">{session.subject}</div>
                <div className="text-sm text-gray-300">学科</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{session.topic}</div>
                <div className="text-sm text-gray-300">知识点</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">{formatDuration(learningDuration)}</div>
                <div className="text-sm text-gray-300">学习时长</div>
              </div>
            </div>
          </div>
        )}

        {/* 学习成果卡片 */}
        <div className="bg-gray-800 rounded p-6 mb-6 border border-gray-600">
          <h4 className="font-bold text-yellow-400 mb-4 text-lg">学习成果</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* 测验成绩 */}
            <div className="bg-gray-700 rounded p-4 border border-gray-600">
              <div className="text-white mb-1">测验成绩</div>
              <div className="text-2xl font-bold text-yellow-400">
                {score}/{totalQuestions}
              </div>
              <div className="text-white">
                {Math.round((score / totalQuestions) * 100)}%
              </div>
            </div>
            
            {/* 理解程度 */}
            <div className="bg-gray-700 rounded p-4 border border-gray-600">
              <div className="text-white mb-1">理解程度</div>
              <div className="flex items-center">
                <div className="flex space-x-1 mr-2">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div
                      key={level}
                      className={`h-5 w-5 rounded-full ${level <= understandingLevel ? 'bg-yellow-400' : 'bg-gray-600'}`}
                    ></div>
                  ))}
                </div>
                <span className="font-bold text-white">
                  {understandingLevel}/5 - {getUnderstandingText(understandingLevel)}
                </span>
              </div>
            </div>
          </div>

          {/* AI学习总结 */}
          <div>
            <h4 className="font-bold text-yellow-400 mb-3 text-lg flex items-center gap-2">
              <span>🤖</span>
              AI学习总结
            </h4>
            <div className="bg-gray-700 rounded p-4 border border-gray-600">
              {isGeneratingSummary ? (
                <div className="flex items-center gap-3 text-white">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                  <span>正在生成个性化学习总结...</span>
                </div>
              ) : aiSummary ? (
                <div className="prose prose-invert max-w-none">
                  {renderContentWithTables(aiSummary, {
                    h1: ({node, ...props}: any) => <h1 className="text-2xl font-bold text-yellow-400 mb-4" {...props} />,
                    h2: ({node, ...props}: any) => <h2 className="text-xl font-bold text-yellow-300 mb-3" {...props} />,
                    h3: ({node, ...props}: any) => <h3 className="text-lg font-bold text-yellow-200 mb-2" {...props} />,
                    p: ({node, ...props}: any) => <p className="text-white mb-3 leading-relaxed" {...props} />,
                    ul: ({node, ...props}: any) => <ul className="text-white list-disc pl-5 space-y-1 mb-3" {...props} />,
                    ol: ({node, ...props}: any) => <ol className="text-white list-decimal pl-5 space-y-1 mb-3" {...props} />,
                    li: ({node, ...props}: any) => <li className="text-white" {...props} />,
                    strong: ({node, ...props}: any) => <strong className="text-yellow-300 font-bold" {...props} />,
                    em: ({node, ...props}: any) => <em className="text-blue-300 italic" {...props} />,
                    code: ({node, ...props}: any) => <code className="bg-gray-800 text-green-300 px-1 py-0.5 rounded text-sm" {...props} />,
                    pre: ({node, ...props}: any) => <pre className="bg-gray-800 text-green-300 p-3 rounded overflow-x-auto mb-3" {...props} />,
                    blockquote: ({node, ...props}: any) => <blockquote className="border-l-4 border-yellow-400 pl-4 text-gray-300 italic mb-3" {...props} />,
                    table: ({node, ...props}: any) => (
                      <div className="overflow-x-auto my-4 rounded-lg shadow-md border border-gray-200">
                        <table className="w-full border-collapse bg-white" {...props} />
                      </div>
                    ),
                    thead: ({node, ...props}: any) => <thead className="bg-blue-100" {...props} />,
                    tbody: ({node, ...props}: any) => <tbody {...props} />,
                    th: ({node, ...props}: any) => (
                      <th className="px-4 py-3 text-center text-sm font-bold text-gray-800 border border-gray-300" {...props} />
                    ),
                    td: ({node, ...props}: any) => (
                      <td className="px-4 py-3 text-center text-sm text-gray-700 border border-gray-300 whitespace-pre-wrap" {...props} />
                    ),
                    tr: ({node, ...props}: any) => <tr className="bg-white even:bg-gray-50 hover:bg-blue-50 transition-colors duration-200" {...props} />,
                  })}
                </div>
              ) : (
                <div className="text-white leading-relaxed">
                  {getOverallAssessment(score, totalQuestions, understandingLevel)}
                </div>
              )}
            </div>
          </div>

          {/* 测验题目复盘 */}
          {quizQuestions.length > 0 && (
            <div className="mt-6">
              <h4 className="font-bold text-yellow-400 mb-3 text-lg">测验题目复盘</h4>
              <div className="space-y-4">
                {quizQuestions.map((question, index) => (
                  <div key={index} className="bg-gray-700 rounded p-4 border border-gray-600">
                    <div className="text-white font-medium mb-2">第{index + 1}题</div>
                    <div className="text-white mb-2">{question.question}</div>
                    {question.options && (
                      <div className="text-sm text-gray-300 mb-2">
                        选项: {question.options.join(', ')}
                      </div>
                    )}
                    <div className="text-sm text-green-400">
                      正确答案: {question.correctAnswer}
                    </div>
                    {question.explanation && (
                      <div className="text-sm text-blue-300 mt-2">
                        解析: {question.explanation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 个性化学习建议 */}
        <div className="bg-gray-800 border border-gray-600 rounded p-5 mb-6">
          <h4 className="font-bold text-yellow-400 mb-3 text-lg flex items-center gap-2">
            <span>💡</span>
            个性化学习建议
          </h4>
          {learningRecommendations.length > 0 ? (
            <ul className="text-white space-y-3">
              {learningRecommendations.map((recommendation, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="text-yellow-400 mt-1">•</span>
                  <span className="leading-relaxed">{recommendation}</span>
                </li>
              ))}
            </ul>
          ) : (
            <ul className="text-white list-disc pl-5 space-y-2">
              {score / totalQuestions >= 0.8 && understandingLevel >= 4 ? (
                <>
                  <li>你已经很好地掌握了这个知识点，可以继续学习新的内容</li>
                  <li>建议定期复习，巩固记忆</li>
                  <li>尝试将所学知识应用到实际问题中</li>
                </>
              ) : (
                <>
                  <li>建议重新学习这个知识点，重点关注薄弱环节</li>
                  <li>可以尝试不同的学习方法，如观看视频、做练习题等</li>
                  <li>如果有疑问，及时向老师或同学请教</li>
                </>
              )}
            </ul>
          )}
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex flex-col sm:flex-row justify-center gap-4 p-6">
        <button
          onClick={onRestart}
          className="px-6 py-3 bg-gray-700 text-white rounded font-bold hover:bg-gray-600 border border-gray-600"
        >
          重新学习
        </button>
        <button
          onClick={handleContinue}
          className="px-6 py-3 bg-yellow-400 text-black rounded font-bold hover:bg-yellow-500"
        >
          {hasReviewed ? '继续学习' : '完成学习'}
        </button>
      </div>
    </div>
  );
};

export default ReviewStep;