'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ConversationService } from '../services/conversationService';
import LearningProgressClient from '../services/learningProgressClient';

function DebugLearningContent() {
  const searchParams = useSearchParams();
  const subject = searchParams.get('subject') || '数学';
  const topic = searchParams.get('topic') || '微积分基础';
  
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  
  const conversationService = ConversationService.getInstance();

  const addDebugInfo = (info: string) => {
    setDebugInfo(prev => prev + info + '\n');
    console.log(info);
  };

  const debugSmartLoading = async () => {
    setIsLoading(true);
    setDebugInfo('');
    
    addDebugInfo(`=== 智能加载调试开始 ===`);
    addDebugInfo(`主题: ${subject}`);
    addDebugInfo(`话题: ${topic}`);
    addDebugInfo('');

    try {
      // 1. 检查所有对话
      addDebugInfo('1. 获取所有对话...');
      const allConversations = await conversationService.getConversations();
      addDebugInfo(`总对话数: ${allConversations.conversations.length}`);
      
      const learningConversations = allConversations.conversations.filter(conv => conv.type === 'learning');
      addDebugInfo(`学习对话数: ${learningConversations.length}`);
      
      learningConversations.forEach((conv, index) => {
        addDebugInfo(`  ${index + 1}. ID: ${conv.id}, 主题: ${conv.subject}, 话题: ${conv.topic}, 归档: ${conv.isArchived}`);
      });
      addDebugInfo('');

      // 2. 查找现有对话
      addDebugInfo('2. 查找现有学习对话...');
      const existingConversation = conversationService.findExistingLearningConversation(subject, topic);
      
      if (existingConversation) {
        addDebugInfo(`✓ 找到现有对话: ${existingConversation.id}`);
        addDebugInfo(`  创建时间: ${existingConversation.createdAt}`);
        addDebugInfo(`  更新时间: ${existingConversation.updatedAt}`);
        addDebugInfo(`  AI讲解内容: ${existingConversation.aiExplanation ? '有' : '无'}`);
        if (existingConversation.aiExplanation) {
          addDebugInfo(`  内容预览: ${existingConversation.aiExplanation.substring(0, 100)}...`);
        }
        addDebugInfo('');

        // 3. 检查学习进度数据库
        addDebugInfo('3. 检查学习进度数据库...');
        let learningProgress = null;
        try {
          learningProgress = await LearningProgressClient.getLearningProgress(existingConversation.id);
          if (learningProgress) {
            addDebugInfo(`✓ 找到学习进度记录`);
            addDebugInfo(`  AI讲解: ${learningProgress.aiExplanation ? '有' : '无'}`);
            addDebugInfo(`  苏格拉底对话: ${learningProgress.socraticDialogue ? '有' : '无'}`);
            addDebugInfo(`  当前步骤: ${learningProgress.currentStep}`);
            if (learningProgress.aiExplanation) {
              addDebugInfo(`  内容预览: ${learningProgress.aiExplanation.substring(0, 100)}...`);
            }
          } else {
            addDebugInfo(`⚠ 学习进度数据库中没有记录`);
          }
        } catch (error) {
          addDebugInfo(`❌ 查询学习进度失败: ${error}`);
        }
        addDebugInfo('');

        // 4. 智能加载决策
        addDebugInfo('4. 智能加载决策...');
        if (learningProgress && learningProgress.aiExplanation) {
          addDebugInfo(`✓ 应该从学习进度数据库恢复内容`);
        } else if (existingConversation.aiExplanation) {
          addDebugInfo(`✓ 应该从对话记录恢复内容`);
        } else {
          addDebugInfo(`⚠ 没有可恢复的内容，建议重新生成`);
        }

      } else {
        addDebugInfo(`⚠ 没有找到现有对话`);
        addDebugInfo(`将创建新的学习对话`);
      }

    } catch (error) {
      addDebugInfo(`❌ 调试过程出错: ${error}`);
    } finally {
      setIsLoading(false);
      addDebugInfo('');
      addDebugInfo('=== 智能加载调试结束 ===');
    }
  };

  const createTestData = async () => {
    setIsLoading(true);
    addDebugInfo('创建测试数据...\n');
    
    try {
      // 创建对话
      const conversation = await conversationService.createConversation({
        type: 'learning',
        subject: subject,
        topic: topic,
        title: `${subject} - ${topic}`
      });
      
      addDebugInfo(`✓ 创建对话: ${conversation.id}`);
      
      // 保存学习内容
      await LearningProgressClient.saveLearningProgress({
        conversationId: conversation.id,
        subject: subject,
        topic: topic,
        aiExplanation: `这是${subject}中${topic}的详细讲解内容。这是一个测试内容，用于验证智能加载功能是否正常工作。内容包含了基本概念、重要定理和实际应用等方面的知识。`,
        currentStep: 'explanation'
      });
      
      addDebugInfo('✓ 保存学习内容到数据库');
      addDebugInfo('🎉 测试数据创建完成！');
      
    } catch (error) {
      addDebugInfo(`❌ 创建失败: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const clearTestData = async () => {
    setIsLoading(true);
    addDebugInfo('清理测试数据...\n');
    
    try {
      const allConversations = await conversationService.getConversations();
      const targetConversations = allConversations.conversations.filter(conv => 
        conv.type === 'learning' && 
        conv.subject === subject && 
        conv.topic === topic
      );
      
      for (const conv of targetConversations) {
        await conversationService.deleteConversation(conv.id);
        addDebugInfo(`✓ 删除对话: ${conv.id}`);
      }
      
      addDebugInfo('🧹 清理完成！');
      
    } catch (error) {
      addDebugInfo(`❌ 清理失败: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    debugSmartLoading();
  }, [subject, topic]);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">智能加载调试页面</h1>
      
      <div className="mb-4">
        <p><strong>当前主题:</strong> {subject}</p>
        <p><strong>当前话题:</strong> {topic}</p>
      </div>
      
      <div className="space-x-4 mb-6">
        <button
          onClick={createTestData}
          disabled={isLoading}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          创建测试数据
        </button>
        
        <button
          onClick={debugSmartLoading}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          重新调试
        </button>
        
        <button
          onClick={clearTestData}
          disabled={isLoading}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
        >
          清理测试数据
        </button>
      </div>

      <div className="bg-gray-100 p-4 rounded">
        <h2 className="text-lg font-semibold mb-3">调试信息:</h2>
        <pre className="whitespace-pre-wrap text-sm font-mono">
          {debugInfo || '正在加载调试信息...'}
        </pre>
      </div>
      
      <div className="mt-6">
        <a 
          href={`/learning-interface?subject=${encodeURIComponent(subject)}&topic=${encodeURIComponent(topic)}`}
          className="inline-block px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
        >
          测试学习界面
        </a>
      </div>
    </div>
  );
}

export default function DebugLearningPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">正在加载调试页面...</p>
        </div>
      </div>
    }>
      <DebugLearningContent />
    </Suspense>
  );
}