'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ConversationService } from '../services/conversationService';
import { CreateConversationRequest } from '../types/conversation';
import { ChatMessage } from '../utils/chatTypes';
import { toast } from 'react-hot-toast';
import LearningProgressClient from '../services/learningProgressClient';
import { LearningState } from '../types/learning';
import { CurriculumService } from '../services/curriculumService';
import RegionalCurriculumSelector from '../components/RegionalCurriculumSelector';

// 动态导入组件以避免SSR问题
const ExplainStep = dynamic(() => import('../components/LearningFlow/ExplainStep'), { ssr: false });
const ConfirmStep = dynamic(() => import('../components/LearningFlow/ConfirmStep'), { ssr: false });
const QuizStep = dynamic(() => import('../components/LearningFlow/QuizStep'), { ssr: false });
const ResultStep = dynamic(() => import('../components/LearningFlow/ResultStep'), { ssr: false });
const ReviewStep = dynamic(() => import('../components/LearningFlow/ReviewStep'), { ssr: false });

function LearningInterfaceContent() {
  const searchParams = useSearchParams();
  const subject = searchParams.get('subject') || '';
  const topic = searchParams.get('topic') || '';
  const region = searchParams.get('region') || '';
  const grade = searchParams.get('grade') || '';
  const existingConversationId = searchParams.get('conversationId');
  
  const [learningContent, setLearningContent] = useState(''); // 基础学习内容
  const [aiExplanation, setAiExplanation] = useState(''); // AI讲解内容
  const [isLoading, setIsLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState<LearningState>('EXPLAIN');
  const [conversationId, setConversationId] = useState<string | null>(existingConversationId);
  const [hasManualSave, setHasManualSave] = useState(false);
  const [isRestoredSession, setIsRestoredSession] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState<number>(0);
  
  // 地区考纲选择状态
  const [selectedRegion, setSelectedRegion] = useState(region || '全国');
  const [selectedCurriculum, setSelectedCurriculum] = useState('');
  
  // 学习流程相关状态
  const [stepContent, setStepContent] = useState('');
  const [stepData, setStepData] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [quizResults, setQuizResults] = useState<any>(null);
  const [aiSummary, setAiSummary] = useState(''); // AI学习总结
  const [showSummaryModal, setShowSummaryModal] = useState(false); // 控制总结弹窗显示
  
  // 苏格拉底对话状态
  const [socraticDialogue, setSocraticDialogue] = useState<Array<{
    question: string;
    answer: string;
    feedback?: string;
  }>>([]);
  
  const conversationService = ConversationService.getInstance();

  // 更新苏格拉底对话
  const updateSocraticDialogue = async (newDialogue: Array<{question: string; answer: string; feedback?: string}>) => {
    setSocraticDialogue(newDialogue);
    
    // 如果有对话ID，自动保存到数据库
    if (conversationId) {
      try {
        await LearningProgressClient.updateSocraticDialogue(conversationId, newDialogue);
      } catch (error) {
        console.error('保存苏格拉底对话失败:', error);
      }
    }
  };

  useEffect(() => {
    if (subject && topic) {
      initializeLearningSession();
    }
  }, [subject, topic]);

  // 初始化学习会话
  const initializeLearningSession = async () => {
    try {
      setIsLoading(true);
      
      // 如果有现有的对话ID，尝试恢复会话
      if (existingConversationId) {
        try {
          const conversation = await conversationService.getConversation(existingConversationId);
          if (conversation) {
            setConversationId(existingConversationId);
            setIsRestoredSession(true);
            
            // 尝试从学习进度数据库恢复内容
            try {
              const learningProgress = await LearningProgressClient.getLearningProgress(existingConversationId);
              if (learningProgress && learningProgress.aiExplanation) {
                setAiExplanation(learningProgress.aiExplanation);
                setLearningContent(learningProgress.aiExplanation);
                console.log('从学习进度数据库恢复AI讲解内容');
                
                // 恢复苏格拉底对话
                if (learningProgress.socraticDialogue) {
                  setSocraticDialogue(learningProgress.socraticDialogue);
                }
                
                // 恢复AI总结
                if (learningProgress.aiSummary) {
                  console.log('恢复AI总结:', learningProgress.aiSummary);
                  setAiSummary(learningProgress.aiSummary);
                } else {
                  console.log('学习进度中没有AI总结');
                }
                
                setIsLoading(false);
                return;
              }
            } catch (error) {
              console.error('从学习进度数据库恢复内容失败:', error);
            }
            
            // 如果学习进度数据库没有内容，尝试从对话历史恢复
            try {
              const messages = conversation.messages || [];
              const aiMessages = messages.filter(msg => msg.role === 'assistant');
              if (aiMessages.length > 0) {
                const lastAiMessage = aiMessages[aiMessages.length - 1];
                setAiExplanation(lastAiMessage.content);
                setLearningContent(lastAiMessage.content);
                console.log('从对话历史恢复AI讲解内容');
                setIsLoading(false);
                return;
              }
            } catch (error) {
              console.error('从对话历史恢复内容失败:', error);
            }
          }
        } catch (error) {
          console.error('恢复会话失败:', error);
        }
      }
      
      // 如果没有现有会话或恢复失败，查找或创建学习会话（避免重复创建）
       if (!conversationId) {
         const newConversationRequest: CreateConversationRequest = {
           title: `${subject} - ${topic}`,
           type: 'learning' as const,
           subject,
           topic
         };
         
         const conversation = await conversationService.findOrCreateLearningConversation(newConversationRequest);
         setConversationId(conversation.id);
         
         // 如果是现有对话，尝试恢复学习状态
         if (conversation.learningSession) {
           try {
             // 从LearningSession恢复基本状态
             setCurrentStep(conversation.learningSession.state || 'EXPLAIN');
             
             // 尝试从学习进度数据库恢复完整学习数据
             try {
               const completeLearningData = await LearningProgressClient.getComplete(conversation.id);
               if (completeLearningData && completeLearningData.session) {
                 const learningProgress = completeLearningData.session;
                 const stats = completeLearningData.stats;
                 
                 // 设置当前步骤
                 if (learningProgress.currentStep) {
                   setCurrentStep(learningProgress.currentStep as LearningState);
                 }
                 
                 // 恢复AI讲解内容
                 if (learningProgress.aiExplanation) {
                   setAiExplanation(learningProgress.aiExplanation);
                   setLearningContent(learningProgress.aiExplanation);
                 }
                 
                 // 恢复苏格拉底对话
                 if (learningProgress.socraticDialogue) {
                   setSocraticDialogue(learningProgress.socraticDialogue);
                 }
                 
                 // 恢复练习题结果
                 if (learningProgress.quizQuestions && learningProgress.userAnswers) {
                   const quizResultsData = learningProgress.quizQuestions.map(question => {
                     const userAnswer = learningProgress.userAnswers?.find(
                       answer => answer.questionId === question.id
                     );
                     return {
                       question: question.question,
                       options: question.options || [],
                       correctAnswer: question.correctAnswer,
                       userAnswer: userAnswer?.userAnswer || '',
                       isCorrect: userAnswer?.isCorrect || false,
                       explanation: question.explanation || '',
                       score: userAnswer?.score || 0,
                       timeSpent: userAnswer?.timeSpent || 0
                     };
                   });
                   setQuizResults(quizResultsData);
                 }
                 
                 // 恢复其他学习数据
                 if (learningProgress.finalScore !== undefined) {
                   // 可以在这里设置最终分数相关的状态
                 }
                 
                 if (learningProgress.feedback) {
                   // 可以在这里设置反馈相关的状态
                 }
                 
                 console.log('从PostgreSQL数据库恢复完整学习状态', {
                   currentStep: learningProgress.currentStep,
                   hasAiExplanation: !!learningProgress.aiExplanation,
                   hasSocraticDialogue: !!learningProgress.socraticDialogue,
                   hasQuizData: !!(learningProgress.quizQuestions && learningProgress.userAnswers),
                   hasStats: !!stats
                 });
                 
                 setIsLoading(false);
                 return;
               }
             } catch (error) {
               console.error('从学习进度数据库恢复内容失败:', error);
             }
             
             // 如果没有数据库记录，尝试从对话记录恢复基本内容
             if (conversation.aiExplanation) {
               setAiExplanation(conversation.aiExplanation);
               setLearningContent(conversation.aiExplanation);
               setIsLoading(false);
               return;
             }
           } catch (error) {
             console.error('恢复学习状态失败:', error);
           }
         }
       }
      
      // 生成AI学习内容
      await generateLearningContent();
      
    } catch (error) {
      console.error('初始化学习会话失败:', error);
      toast.error('初始化学习会话失败，请稍后重试');
      setIsLoading(false);
    }
  };

  // 生成AI学习内容
  const generateLearningContent = async () => {
    try {
      setIsLoading(true);
      
      // 使用AI生成个性化学习内容
      const { createProviderFromEnv } = await import('../services/ai');
      const aiProvider = createProviderFromEnv();
      
      if (!aiProvider) {
        throw new Error('AI服务不可用');
      }

      // 获取教学大纲指导
      const curriculumService = CurriculumService.getInstance();
      const currentRegion = selectedRegion || region;
      const curriculumStandard = curriculumService.getCurriculumStandard(currentRegion, grade, subject);
      const topicRequirementsData = curriculumService.getTopicRequirements(currentRegion, grade, subject, topic);
      const difficulty = curriculumService.getTopicDifficulty(currentRegion, grade, subject, topic);
      const examWeight = curriculumService.getTopicExamWeight(currentRegion, grade, subject, topic);
      const learningGuidance = curriculumService.generateLearningGuidance(currentRegion, grade, subject, topic);

      const prompt = `你是一位专业的AI学习教练，具有深厚的学科知识和丰富的教学经验。你的使命是帮助学生建立完整的知识体系，培养深度思维能力和问题解决能力。

## 🎯 教学目标
- **知识目标**：确保学生准确掌握核心概念和基本原理
- **能力目标**：培养学生的分析思维、逻辑推理和应用能力
- **素养目标**：提升学生的学科素养和创新思维

## 📚 内容要求

### 🔍 核心内容（必须包含）
1. **概念定义**：准确、清晰的概念表述
2. **知识背景**：概念的来源、发展历程和重要意义
3. **核心原理**：基本原理、定理、公式的详细阐述
4. **逻辑关系**：知识点之间的内在联系和逻辑结构

### 💡 理解深化（重点强化）
1. **本质理解**：揭示概念的本质特征和内在规律
2. **多角度分析**：从不同维度解读知识点
3. **类比联想**：运用生活实例和类比帮助理解
4. **思维导图**：构建知识网络和思维框架

### 🎯 应用拓展（能力提升）
1. **典型例题**：精选代表性例题，展示解题思路
2. **方法技巧**：总结解题方法和思维策略
3. **实际应用**：展示知识在现实生活中的应用
4. **拓展延伸**：相关知识点的扩展和深化

### ⚠️ 易错防范（质量保证）
1. **常见误区**：指出学习中容易出现的错误
2. **辨析对比**：对比相似概念，避免混淆
3. **注意事项**：提醒学习和应用中的关键点
4. **自检方法**：提供自我检验的方法和标准

## 🎨 表达要求

### 📝 语言风格
- **准确性**：用词精确，表述严谨，避免歧义
- **生动性**：语言生动有趣，富有感染力
- **启发性**：多用问题引导，激发思考
- **个性化**：根据${grade || '中学'}学生特点调整表达

### 📐 结构组织
- **层次清晰**：使用标题、列表、表格等组织内容
- **重点突出**：用**加粗**、*斜体*等强调关键信息
- **逻辑连贯**：确保各部分之间逻辑关系明确
- **视觉友好**：适当使用emoji和符号增强可读性

### 🎚️ 深度控制
- **基础扎实**：确保基础概念准确无误
- **适度拓展**：在学生能力范围内适当延伸
- **循序渐进**：从简单到复杂，层层递进
- **因材施教**：考虑${grade || '中学'}学生的认知水平

## 📋 质量标准

### ✅ 内容质量
- **科学准确**：所有知识点必须科学准确，经得起检验
- **完整系统**：覆盖主题的核心要点，形成完整体系
- **深度适宜**：既有深度又不超出学生理解能力
- **实用有效**：对学生的学习和考试有实际帮助

### 🎯 教学效果
- **易于理解**：表述清晰，学生容易理解和掌握
- **便于记忆**：结构清晰，要点突出，便于记忆
- **启发思考**：能够激发学生的思考和探索欲望
- **促进应用**：帮助学生将知识转化为解决问题的能力

## 📖 具体任务
请基于以上要求，对"${topic}"这一主题进行系统化、专业化的讲解。

**学习背景：**
- 学科：${subject || '数学'}
- 年级：${grade || '中学'}
- 地区：${selectedRegion || region || '通用'}

**特别要求：**
1. 确保内容的科学性和准确性
2. 体现${selectedRegion || region || '通用'}地区的教学特色
3. 适合${grade || '中学'}学生的认知水平
4. 提供丰富的例题和应用实例
5. 构建完整的知识体系和思维框架

请开始你的专业讲解：`;

      // 使用Promise包装AI调用
      const content = await new Promise<string>((resolve, reject) => {
        let fullResponse = '';
        
        aiProvider.onMessage((message: string, isFinal: boolean) => {
          fullResponse += message;
          if (isFinal) {
            resolve(fullResponse);
          }
        });
        
        aiProvider.onError((error: string) => {
          reject(new Error(error));
        });
        
        aiProvider.sendMessage(prompt);
      });

      if (content && content.trim()) {
        setLearningContent(content);
        setAiExplanation(content);
        toast.success('AI学习内容生成成功！');
        
        // 自动保存生成的AI学习内容
         if (conversationId) {
           try {
             await LearningProgressClient.saveLearningProgress({
               conversationId,
               subject,
               topic,
               aiExplanation: content,
               socraticDialogue: socraticDialogue,
               currentStep: 'EXPLAIN'
             });
             console.log('AI学习内容已自动保存');
           } catch (error) {
             console.error('自动保存AI学习内容失败:', error);
           }
         }
      } else {
        throw new Error('AI返回空内容');
      }
      
    } catch (error) {
      console.error('生成AI学习内容失败:', error);
      toast.error('生成学习内容失败，请稍后重试');
      
      // 使用fallback内容
      const fallbackContent = `## ${subject} - ${topic}

### 📚 学习内容生成中...

抱歉，AI内容生成暂时不可用。请稍后重试或点击"重新生成"按钮。

### 💡 学习建议
在等待期间，您可以：
1. 回顾相关的基础知识
2. 准备学习笔记
3. 思考与"${topic}"相关的问题

*注：这是临时内容，实际学习内容将由AI根据您的具体主题生成。*`;
      
      setLearningContent(fallbackContent);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = async () => {
    console.log('进入下一步学习，当前步骤:', currentStep);
    
    // 根据当前步骤决定下一步
    switch (currentStep) {
      case 'EXPLAIN':
        setCurrentStep('CONFIRM');
        setStepContent('现在让我们通过知识大纲来确认你对这个知识点的理解。');
        toast.success('进入确认理解阶段');
        break;
      case 'CONFIRM':
        setCurrentStep('QUIZ');
        toast.success('进入测验阶段');
        break;
      case 'QUIZ':
        setCurrentStep('RESULT');
        toast.success('查看测验结果');
        break;
      case 'RESULT':
        setCurrentStep('REVIEW');
        toast.success('进入复习阶段');
        break;
      case 'REVIEW':
        toast.success('学习完成！');
        // 可以跳转到其他页面或重新开始
        break;
      default:
        console.log('未知的学习步骤:', currentStep);
    }
    
    // 保存学习进度到对话
    if (conversationId) {
      try {
        const message: ChatMessage = {
          role: 'user',
          content: `完成了${topic}的${currentStep}阶段，准备进入下一步学习`
        };
        await conversationService.addMessage(conversationId, message);
        
        const responseMessage: ChatMessage = {
          role: 'assistant',
          content: `很好！你已经完成了${topic}的${currentStep}阶段。继续加油！`
        };
        await conversationService.addMessage(conversationId, responseMessage);
      } catch (error) {
        console.error('保存学习进度失败:', error);
      }
    }
  };

  const handleAskQuestion = async (question: string) => {
    console.log('用户提问:', question);
    
    // 保存到对话记录
    if (conversationId) {
      try {
        const userMessage: ChatMessage = {
          role: 'user',
          content: `在学习${topic}时提问：${question}`
        };
        await conversationService.addMessage(conversationId, userMessage);
        
        // 这里可以调用AI API获取回答
        const aiResponse = `关于"${question}"的问题，这是一个很好的思考。在${subject}的${topic}学习中...`;
        
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: aiResponse
        };
        await conversationService.addMessage(conversationId, assistantMessage);
      } catch (error) {
        console.error('保存问题失败:', error);
      }
    }
  };

  // 处理确认理解步骤的回调
  const handleConfirmNext = async () => {
    console.log('确认理解步骤完成');
    setCurrentStep('QUIZ');
    toast.success('进入测验阶段');
  };

  // 处理测验完成
  const handleQuizComplete = async (results: any) => {
    console.log('测验完成，结果:', results);
    setQuizResults(results);
    setCurrentStep('RESULT');
    toast.success('测验完成，查看结果');
  };

  // 处理结果查看完成
  const handleResultNext = async () => {
    console.log('结果查看完成');
    setCurrentStep('REVIEW');
    toast.success('进入复习阶段');
  };

  // 处理复习完成
  const handleReviewComplete = async () => {
    console.log('复习完成');
    toast.success('学习完成！恭喜你完成了整个学习流程！');
    // 可以跳转到其他页面或重新开始
  };

  const handleManualSave = async () => {
    if (!conversationId) {
      toast.error('没有活动的学习会话');
      return;
    }

    try {
       setIsSaving(true);
       
       await LearningProgressClient.saveLearningProgress({
         conversationId,
         subject,
         topic,
         aiExplanation,
         socraticDialogue,
         currentStep,
         aiSummary // 包含AI总结
       });
       
       setHasManualSave(true);
       setLastSaveTime(Date.now());
       toast.success('学习进度已保存');
     } catch (error) {
       console.error('手动保存失败:', error);
       toast.error('保存失败，请稍后重试');
     } finally {
       setIsSaving(false);
     }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-32 w-32 border-b-4 border-blue-500"></div>
          <p className="mt-6 text-blue-800 text-xl font-medium">正在精心准备系统学习课程……</p>
          <p className="mt-2 text-blue-600">请稍候，我们正在为您准备最佳的学习体验</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 relative">
      {/* 动态背景效果 */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-1/4 left-1/2 w-96 h-96 bg-cyan-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-2000"></div>
      </div>

      {/* 顶部导航栏 */}
      <div className="relative z-10 backdrop-blur-sm bg-white/80 border-b border-blue-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2 text-blue-700 hover:text-blue-900 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="font-medium">返回首页</span>
              </Link>
              
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-700 to-blue-900 bg-clip-text text-transparent">
                  {subject} - {topic}
                </h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="px-4 py-2 bg-gradient-to-r from-blue-100 to-indigo-100 backdrop-blur-sm border border-blue-300 rounded-full shadow-sm">
                <span className="text-blue-700 text-sm font-medium flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
                  系统化学习
                </span>
              </div>
              <div className="px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 backdrop-blur-sm border border-green-300 rounded-full shadow-sm">
                <span className="text-green-700 text-sm font-medium flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  {isRestoredSession ? '恢复会话' : '讲解阶段'}
                </span>
              </div>
              <div className="px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 backdrop-blur-sm border border-purple-300 rounded-full shadow-sm">
                <span className="text-purple-700 text-sm font-medium flex items-center">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-2 animate-pulse"></div>
                  {selectedRegion}考纲
                </span>
              </div>
              
              {/* 重新生成按钮 */}
              <button
                onClick={async () => {
                  setIsLoading(true);
                  try {
                    await generateLearningContent();
                    toast.success('AI讲解内容已重新生成');
                  } catch (error) {
                    console.error('重新生成失败:', error);
                    toast.error('重新生成失败，请稍后重试');
                  }
                }}
                className="px-4 py-2 bg-gradient-to-r from-orange-400 to-red-400 text-white rounded-lg hover:from-orange-500 hover:to-red-500 transition-all duration-200 flex items-center space-x-2 shadow-md border border-orange-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>重新生成</span>
              </button>

              {/* 手动保存按钮 */}
              <button
                onClick={handleManualSave}
                disabled={isSaving}
                className="px-4 py-2 bg-gradient-to-r from-green-400 to-emerald-400 text-white rounded-lg hover:from-green-500 hover:to-emerald-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 shadow-md border border-green-300"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>保存中...</span>
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    <span>保存进度</span>
                  </>
                )}
              </button>

              {/* 调试信息 */}
              {process.env.NODE_ENV === 'development' && (
                <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded">
                  aiSummary状态: {aiSummary ? `有内容(${aiSummary.length}字符)` : '无内容'}
                </div>
              )}

              {/* 学习总结按钮 */}
              {aiSummary && (
                <button
                  onClick={() => setShowSummaryModal(true)}
                  className="px-4 py-2 bg-gradient-to-r from-purple-400 to-indigo-400 text-white rounded-lg hover:from-purple-500 hover:to-indigo-500 transition-all duration-200 flex items-center space-x-2 shadow-md border border-purple-300"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>上一次课程总结</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {/* 装饰性顶部边框 */}
        <div className="h-1 bg-gradient-to-r from-blue-400 via-indigo-500 to-cyan-400 rounded-full mb-8 shadow-lg"></div>
        
        {/* 考纲选择器 */}
        <div className="mb-6">
          <RegionalCurriculumSelector
            selectedRegion={selectedRegion}
            selectedCurriculum={selectedCurriculum}
            onCurriculumSelect={(region, curriculum) => {
              setSelectedRegion(region);
              setSelectedCurriculum(curriculum);
              // 当考纲改变时，提示用户重新生成内容
              if (learningContent) {
                toast.success(`已选择${region} - ${curriculum}，点击重新生成获取对应内容`);
              }
            }}
            onRegionChange={(region) => {
              setSelectedRegion(region);
              // 当地区改变时，重新生成学习内容
              if (region !== selectedRegion && learningContent) {
                toast.success(`已切换到${region}考纲，点击重新生成获取对应内容`);
              }
            }}
            onCurriculumChange={setSelectedCurriculum}
            subject={subject}
            grade={grade}
          />
        </div>

        {/* 玻璃效果卡片容器 */}
        <div className="backdrop-blur-xl bg-white/80 border border-blue-200/50 rounded-3xl shadow-xl overflow-hidden">
          <div className="p-8">
            {currentStep === 'EXPLAIN' && (
              <ExplainStep 
                content={learningContent}
                initialAiExplanation={aiExplanation}
                onNext={handleNext}
                onAskQuestion={handleAskQuestion}
                step="EXPLAIN"
                socraticDialogue={socraticDialogue}
                onSocraticDialogueUpdate={updateSocraticDialogue}
                subject={subject}
                topic={topic}
                selectedRegion={selectedRegion}
                selectedCurriculum={selectedCurriculum}
                grade={grade}
                onAiExplanationUpdate={async (content: string) => {
                  setAiExplanation(content);
                  if (conversationId) {
                    try {
                      await LearningProgressClient.saveLearningProgress({
                        conversationId,
                        subject,
                        topic,
                        aiExplanation: content,
                        socraticDialogue,
                        currentStep
                      });
                    } catch (error) {
                      console.error('自动保存AI讲解失败:', error);
                    }
                  }
                }}
              />
            )}

            {currentStep === 'CONFIRM' && (
              <ConfirmStep
                content={stepContent || `现在让我们通过知识大纲来确认你对${topic}的理解。`}
                isLoading={isProcessing}
                showConfirmation={true}
                onConfirmUnderstanding={() => {
                  console.log('确认理解');
                  handleConfirmNext();
                }}
                onContinueExplanation={() => {
                  console.log('继续讲解');
                  setCurrentStep('EXPLAIN');
                  toast.success('返回讲解阶段');
                }}
              />
            )}

            {currentStep === 'QUIZ' && (
              <QuizStep
                knowledgeContent={learningContent}
                region={region}
                grade={grade}
                subject={subject}
                topic={topic}
                onComplete={handleQuizComplete}
                onBack={() => setCurrentStep('CONFIRM')}
              />
            )}

            {currentStep === 'RESULT' && quizResults && (
              <ResultStep
                answers={quizResults.answers || []}
                questions={quizResults.questions || []}
                knowledgeContent={learningContent}
                onRestart={() => setCurrentStep('QUIZ')}
                onContinue={handleResultNext}
              />
            )}

            {currentStep === 'REVIEW' && (
              <ReviewStep
                content={learningContent}
                score={quizResults?.score || 0}
                totalQuestions={quizResults?.questions?.length || 0}
                understandingLevel={80}
                onContinue={handleReviewComplete}
                onRestart={() => setCurrentStep('EXPLAIN')}
                session={{
                  topic: topic || '',
                  subject: subject || '',
                  createdAt: new Date(),
                  steps: []
                }}
                quizQuestions={quizResults?.questions || []}
                learningDuration={Math.floor((Date.now() - (lastSaveTime || Date.now())) / 60000) || 25}
                onAiSummaryGenerated={(summary) => setAiSummary(summary)}
                conversationId={conversationId || undefined}
              />
            )}
          </div>
        </div>
      </div>

      {/* 学习总结弹窗 */}
      {showSummaryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            {/* 弹窗头部 */}
            <div className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white p-6 flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h2 className="text-2xl font-bold">上一次课程总结</h2>
              </div>
              <button
                onClick={() => setShowSummaryModal(false)}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 弹窗内容 */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {aiSummary ? (
                <div className="prose prose-lg max-w-none">
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-200">
                    <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                      {aiSummary}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-gray-500 text-lg">暂无课程总结</p>
                  <p className="text-gray-400 text-sm mt-2">完成学习流程后将自动生成课程总结</p>
                </div>
              )}
            </div>

            {/* 弹窗底部 */}
            <div className="bg-gray-50 px-6 py-4 flex justify-end">
              <button
                onClick={() => setShowSummaryModal(false)}
                className="px-6 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg hover:from-purple-600 hover:to-indigo-600 transition-all duration-200 shadow-md"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 底部装饰线 */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent"></div>
    </div>
  );
}

export default function LearningInterfacePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">正在加载学习界面...</p>
        </div>
      </div>
    }>
      <LearningInterfaceContent />
    </Suspense>
  );
}