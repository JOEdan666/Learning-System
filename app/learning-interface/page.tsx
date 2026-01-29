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
import { KnowledgeBaseService } from '../services/knowledgeBaseService';

const STEP_FLOW: Array<{ key: LearningState; label: string; desc: string }> = [
  { key: 'DIAGNOSE', label: '诊断', desc: '极速测验定位薄弱点' },
  { key: 'ANALYSIS', label: '分析', desc: '生成诊断报告' },
  { key: 'REMEDY', label: '补漏', desc: '针对性微课讲解' },
  { key: 'VERIFY', label: '验证', desc: '变式题确认掌握' },
];

// 动态导入组件以避免SSR问题
const ExplainStep = dynamic(() => import('../components/LearningFlow/ExplainStep'), { ssr: false });
const QuizStep = dynamic(() => import('../components/LearningFlow/QuizStep'), { ssr: false });
const ResultStep = dynamic(() => import('../components/LearningFlow/ResultStep'), { ssr: false });
const ReviewStep = dynamic(() => import('../components/LearningFlow/ReviewStep'), { ssr: false });

function LearningInterfaceContent() {
  const searchParams = useSearchParams();
  const subject = searchParams.get('subject') || '';
  const topic = searchParams.get('topic') || '';
  const region = searchParams.get('region') || '';
  const grade = searchParams.get('grade') || '';
  const semester = searchParams.get('semester') || ''; // 读取学期参数
  const topicId = searchParams.get('topicId') || '';
  const existingConversationId = searchParams.get('conversationId');
  
  const [learningContent, setLearningContent] = useState(''); // 基础学习内容
  const [aiExplanation, setAiExplanation] = useState(''); // AI讲解内容
  const [isLoading, setIsLoading] = useState(false); // 默认为 false，因为我们直接开始
  const [currentStep, setCurrentStep] = useState<LearningState>('DIAGNOSE'); // 默认为 DIAGNOSE
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
  const currentStepIndex = STEP_FLOW.findIndex(s => s.key === currentStep);
  
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
    } else {
      setIsLoading(false);
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
             setCurrentStep((conversation.learningSession.state as LearningState) || 'DIAGNOSE');
             
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
                  const answersArr = learningProgress.userAnswers.map(ans => ans.userAnswer || '');
                  setQuizResults({
                    questions: learningProgress.quizQuestions,
                    answers: answersArr,
                    score: learningProgress.finalScore ?? stats?.totalScore ?? 0,
                  });
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
      // await generateLearningContent(); 
      // 改为按需生成，如果是 REMEDY 阶段才生成
      if (currentStep === 'REMEDY') {
        await generateLearningContent();
      } else {
        setIsLoading(false);
      }
      
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
      // 1) 优先使用知识库教材内容（更科学、专业）
      try {
        const kb = new KnowledgeBaseService();
        const items = await kb.getItems();
        const keyword = (topic || '').slice(0, 20);
        const subjectHint = subject || '';
        const matched = items.filter(it => (it.text || '').includes(keyword) || (it.name || '').includes(keyword));
        if (matched.length > 0) {
          const merged = matched.slice(0, 4).map(it => `### ${it.name}\n\n${(it.text || '').slice(0, 3000)}`).join('\n\n');
          const header = `## ${subjectHint} · ${topic}\n\n${selectedRegion || region || '通用'} · ${grade || ''}`;
          const kbContent = `${header}\n\n${merged}`;
          setLearningContent(kbContent);
          setAiExplanation(kbContent);
          setIsLoading(false);
          return;
        }
      } catch (e) {
        console.warn('知识库内容不可用，降级使用AI生成:', e);
      }
      const { createProviderFromEnv } = await import('../services/ai');
      const aiProvider = createProviderFromEnv();
      if (!aiProvider) throw new Error('AI服务不可用');

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

      // 流式获取AI内容，首段即显示，加速体感
      const content = await new Promise<string>((resolve, reject) => {
        let fullResponse = '';
        let gotFirstChunk = false;
        aiProvider.onMessage((message: string, isFinal: boolean) => {
          fullResponse += message;
          if (!gotFirstChunk && fullResponse.trim()) {
            setLearningContent(fullResponse);
            gotFirstChunk = true;
            setIsLoading(false);
          }
          if (isFinal) {
            resolve(fullResponse);
          } else {
            setLearningContent(fullResponse);
          }
        });
        aiProvider.onError((error: string) => reject(new Error(error)));
        aiProvider.sendMessage(prompt);
      });

      if (!content || !content.trim()) throw new Error('AI返回空内容');

      setLearningContent(content);
      setAiExplanation(content);
      toast.success('AI学习内容生成成功！');

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
      case 'DIAGNOSE':
        setCurrentStep('ANALYSIS');
        toast.success('查看测验结果');
        break;
      case 'ANALYSIS':
        setCurrentStep('REMEDY');
        if (!learningContent) {
          generateLearningContent();
        }
        toast.success('进入知识补漏');
        break;
      case 'REMEDY':
        setCurrentStep('VERIFY');
        toast.success('进入验证阶段');
        break;
      case 'VERIFY':
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
    setCurrentStep('DIAGNOSE');
    toast.success('进入测验阶段');
  };

  // 处理测验完成
  const handleQuizComplete = async (results: any) => {
    console.log('测验完成，结果:', results);
    const normalized = {
      answers: results.answers || [],
      questions: results.questions || [],
      score: results.score || 0,
    };
    setQuizResults(normalized);
    setCurrentStep('ANALYSIS');
    toast.success('测验完成，查看结果');

    // 保存测验数据
    if (conversationId) {
      try {
        const userAnswers = normalized.questions.map((q: any, idx: number) => {
          const ua = normalized.answers[idx] || '';
          const isCorrect = ua === q.correctAnswer;
          return {
            questionId: q.id ?? idx,
            userAnswer: ua,
            isCorrect,
            score: isCorrect ? (q.points || 10) : 0,
          };
        });
        await LearningProgressClient.saveLearningProgress({
          conversationId,
          subject,
          topic,
          aiExplanation,
          socraticDialogue,
          currentStep: 'ANALYSIS',
          quizQuestions: normalized.questions,
          userAnswers,
          finalScore: normalized.score,
          stats: {
            conversationId,
            accuracy: normalized.score,
            totalQuestions: normalized.questions.length,
            correctAnswers: userAnswers.filter((a: any) => a.isCorrect).length,
          },
        });
      } catch (error) {
        console.error('保存测验数据失败:', error);
      }
    }
  };

  // 处理结果查看完成
  const handleResultNext = async () => {
    console.log('结果查看完成');
    setCurrentStep('REMEDY');
    if (!learningContent) {
      generateLearningContent();
    }
    toast.success('进入知识补漏');
  };

  // 处理复习完成
  const handleReviewComplete = async () => {
    console.log('复习完成');
    toast.success('学习完成！恭喜你完成了整个学习流程！');
    if (conversationId && quizResults) {
      try {
        const userAnswers = quizResults.questions.map((q: any, idx: number) => {
          const ua = quizResults.answers?.[idx] || '';
          const isCorrect = ua === q.correctAnswer;
          return {
            questionId: q.id ?? idx,
            userAnswer: ua,
            isCorrect,
            score: isCorrect ? (q.points || 10) : 0,
          };
        });
        await LearningProgressClient.saveLearningProgress({
          conversationId,
          subject,
          topic,
          aiExplanation,
          socraticDialogue,
          currentStep: 'DONE',
          isCompleted: true,
          quizQuestions: quizResults.questions,
          userAnswers,
          finalScore: quizResults.score,
          stats: {
            conversationId,
            accuracy: quizResults.score,
            totalQuestions: quizResults.questions.length,
            correctAnswers: userAnswers.filter((a: any) => a.isCorrect).length,
          },
        });
      } catch (error) {
        console.error('保存复习数据失败:', error);
      }
    }
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
         aiSummary, // 包含AI总结
         quizQuestions: quizResults?.questions,
         userAnswers: quizResults
          ? quizResults.questions.map((q: any, idx: number) => {
              const ua = quizResults.answers?.[idx] || '';
              const isCorrect = ua === q.correctAnswer;
              return {
                questionId: q.id ?? idx,
                userAnswer: ua,
                isCorrect,
                score: isCorrect ? (q.points || 10) : 0,
              };
            })
          : undefined,
         finalScore: quizResults?.score,
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

  if (!subject || !topic) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex items-center justify-center">
        <div className="bg-white border border-slate-200 rounded-2xl shadow p-6 max-w-md text-center">
          <h2 className="text-xl font-semibold mb-2">请选择学习内容</h2>
          <p className="text-sm text-slate-600 mb-4">进入系统化学习前，请先选择学科与主题。</p>
          <button onClick={() => window.location.href = '/learning-setup'} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold shadow-sm hover:bg-blue-700">去选择内容</button>
        </div>
      </div>
    )
  }
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      {/* 顶部导航栏 */}
      <div className="sticky top-0 z-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-3 flex flex-wrap items-center gap-3 justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700">←</span>
              返回首页
            </Link>
            <div className="flex flex-col">
              <span className="text-sm font-semibold">{subject || '未选择学科'} · {topic || '未选择主题'}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">{selectedRegion} · {grade || '年级未设定'}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {aiSummary && (
              <button
                onClick={() => setShowSummaryModal(true)}
                className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                查看总结
              </button>
            )}
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
              className="px-3 py-2 rounded-lg bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 shadow-sm"
            >
              重新生成
            </button>
            <button
              onClick={handleManualSave}
              disabled={isSaving}
              className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 shadow-sm disabled:opacity-60"
            >
              {isSaving ? '保存中...' : '保存进度'}
            </button>
          </div>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 space-y-6">
        {/* 概览卡 */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-5 flex flex-wrap gap-4 items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide">系统化学习</p>
            <h1 className="text-2xl font-bold">专注当前主题 · 提升效率</h1>
            <p className="text-sm text-slate-600 dark:text-slate-300">AI 讲解 → 理解确认 → 测验 → 结果 → 复盘，全程自动记录。</p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800">
              <div className="text-xs text-slate-500">当前阶段</div>
              <div className="font-semibold">{STEP_FLOW.find(s => s.key === currentStep)?.label || '讲解'}</div>
            </div>
            <div className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800">
              <div className="text-xs text-slate-500">进度保存</div>
              <div className="font-semibold">{hasManualSave ? '已手动保存' : '自动保存中'}</div>
            </div>
            <div className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800">
              <div className="text-xs text-slate-500">会话状态</div>
              <div className="font-semibold">{isRestoredSession ? '已恢复' : '新会话'}</div>
            </div>
          </div>
        </div>

        {/* 流程步骤指示 */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-4 flex flex-wrap gap-3">
          {STEP_FLOW.map((step, idx) => {
            const active = currentStepIndex === idx;
            const done = currentStepIndex > idx;
            return (
              <div
                key={step.key}
                className={`flex-1 min-w-[140px] px-3 py-2 rounded-xl border text-sm ${active ? 'border-blue-500 bg-blue-50 text-blue-700' : done ? 'border-green-200 bg-green-50 text-green-700' : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'}`}
              >
                <div className="font-semibold flex items-center gap-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold border border-current">
                    {idx + 1}
                  </span>
                  {step.label}
                </div>
                <div className="text-xs mt-1">{step.desc}</div>
              </div>
            );
          })}
        </div>

        {/* 考纲选择器 */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-4">
          <RegionalCurriculumSelector
            selectedRegion={selectedRegion}
            selectedCurriculum={selectedCurriculum}
            onCurriculumSelect={(region, curriculum) => {
              setSelectedRegion(region);
              setSelectedCurriculum(curriculum);
              if (learningContent) {
                toast.success(`已选择${region} - ${curriculum}，点击重新生成获取对应内容`);
              }
            }}
            onRegionChange={(region) => {
              setSelectedRegion(region);
              if (region !== selectedRegion && learningContent) {
                toast.success(`已切换到${region}考纲，点击重新生成获取对应内容`);
              }
            }}
            onCurriculumChange={setSelectedCurriculum}
            subject={subject}
            grade={grade}
          />
        </div>

        {/* 学习流程内容 */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg overflow-hidden">
        <div className="p-6 md:p-8">
          {currentStep === 'REMEDY' && (
              <ExplainStep 
                content={learningContent}
                initialAiExplanation={aiExplanation}
                onNext={handleNext}
                onAskQuestion={handleAskQuestion}
                step="REMEDY"
                socraticDialogue={socraticDialogue}
                onSocraticDialogueUpdate={updateSocraticDialogue}
                subject={subject}
                topic={topic}
                selectedRegion={selectedRegion}
                selectedCurriculum={selectedCurriculum}
                grade={grade}
                semester={semester}
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

            {currentStep === 'DIAGNOSE' && (
              <QuizStep
                knowledgeContent={learningContent}
                region={region}
                grade={grade}
                semester={semester}
                subject={subject}
                topic={topic}
                topicId={topicId}
                onComplete={handleQuizComplete}
                onBack={() => {}}
              />
            )}

            {currentStep === 'ANALYSIS' && quizResults && (
              <ResultStep
                answers={quizResults.answers || []}
                questions={quizResults.questions || []}
                knowledgeContent={learningContent}
                onRestart={() => setCurrentStep('DIAGNOSE')}
                onContinue={handleResultNext}
              />
            )}

            {currentStep === 'VERIFY' && (
              <ReviewStep
                content={learningContent}
                score={quizResults?.score || 0}
                totalQuestions={quizResults?.questions?.length || 0}
                understandingLevel={80}
                onContinue={handleReviewComplete}
                onRestart={() => setCurrentStep('REMEDY')}
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
