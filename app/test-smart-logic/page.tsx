'use client';

import React, { useState } from 'react';
import { ConversationService } from '../services/conversationService';
import LearningProgressClient from '../services/learningProgressClient';

export default function TestSmartLogicPage() {
  const [result, setResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  
  const conversationService = ConversationService.getInstance();

  const testSmartLoading = async () => {
    setIsLoading(true);
    setResult('开始测试智能加载逻辑...\n');
    
    const subject = '数学';
    const topic = '微积分基础';
    
    try {
      // 步骤1：查找现有对话
      setResult(prev => prev + '1. 查找现有学习对话...\n');
      const existingConversation = conversationService.findExistingLearningConversation(subject, topic);
      
      if (existingConversation) {
        setResult(prev => prev + `✓ 找到现有对话: ${existingConversation.id}\n`);
        
        // 步骤2：尝试从数据库恢复内容
        setResult(prev => prev + '2. 尝试从学习进度数据库恢复内容...\n');
        try {
          const learningProgress = await LearningProgressClient.getLearningProgress(existingConversation.id);
          if (learningProgress && learningProgress.aiExplanation) {
            setResult(prev => prev + `✓ 从数据库恢复成功！内容预览: ${learningProgress.aiExplanation.substring(0, 50)}...\n`);
            setResult(prev => prev + '🎉 智能加载功能正常工作！\n');
            return;
          } else {
            setResult(prev => prev + '⚠ 数据库中没有找到学习内容\n');
          }
        } catch (error) {
          setResult(prev => prev + `⚠ 从数据库恢复失败: ${error}\n`);
        }
        
        // 步骤3：尝试从对话记录恢复
        setResult(prev => prev + '3. 尝试从对话记录恢复内容...\n');
        const aiExplanation = existingConversation.aiExplanation;
        if (aiExplanation && aiExplanation.length > 0) {
          setResult(prev => prev + `✓ 从对话记录恢复成功！内容预览: ${aiExplanation.substring(0, 50)}...\n`);
          setResult(prev => prev + '🎉 智能加载功能正常工作！\n');
          return;
        } else {
          setResult(prev => prev + '⚠ 对话记录中也没有学习内容\n');
          setResult(prev => prev + '💡 建议用户点击"重新生成"按钮\n');
          return;
        }
      } else {
        setResult(prev => prev + '⚠ 没有找到现有对话\n');
        setResult(prev => prev + '💡 将生成新的学习内容\n');
      }
      
    } catch (error) {
      setResult(prev => prev + `❌ 测试失败: ${error}\n`);
    } finally {
      setIsLoading(false);
    }
  };

  const createTestData = async () => {
    setIsLoading(true);
    setResult('创建测试数据...\n');
    
    try {
      // 创建对话
      const conversation = await conversationService.createConversation({
        type: 'learning',
        subject: '数学',
        topic: '微积分基础',
        title: '数学 - 微积分基础'
      });
      
      setResult(prev => prev + `✓ 创建对话: ${conversation.id}\n`);
      
      // 保存学习内容
      await LearningProgressClient.saveLearningProgress({
        conversationId: conversation.id,
        subject: '数学',
        topic: '微积分基础',
        aiExplanation: '这是测试的AI讲解内容：微积分是数学的一个重要分支，主要研究函数的导数、积分以及相关概念。微积分的基本思想是通过极限的概念来处理连续变化的量。导数描述了函数在某一点的瞬时变化率，而积分则是导数的逆运算，用于计算曲线下的面积。',
        currentStep: 'explanation'
      });
      
      setResult(prev => prev + '✓ 保存学习内容到数据库\n');
      setResult(prev => prev + '🎉 测试数据创建完成！\n');
      
    } catch (error) {
      setResult(prev => prev + `❌ 创建失败: ${error}\n`);
    } finally {
      setIsLoading(false);
    }
  };

  const clearTestData = async () => {
    setIsLoading(true);
    setResult('清理测试数据...\n');
    
    try {
      const allConversations = await conversationService.getConversations();
      const mathConversations = allConversations.conversations.filter(conv => 
        conv.type === 'learning' && 
        conv.subject === '数学' && 
        conv.topic === '微积分基础'
      );
      
      for (const conv of mathConversations) {
        await conversationService.deleteConversation(conv.id);
        setResult(prev => prev + `✓ 删除对话: ${conv.id}\n`);
      }
      
      setResult(prev => prev + '🧹 清理完成！\n');
      
    } catch (error) {
      setResult(prev => prev + `❌ 清理失败: ${error}\n`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">智能加载逻辑测试</h1>
      
      <div className="space-x-4 mb-6">
        <button
          onClick={createTestData}
          disabled={isLoading}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          创建测试数据
        </button>
        
        <button
          onClick={testSmartLoading}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          测试智能加载
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
        <h2 className="text-lg font-semibold mb-3">测试结果:</h2>
        <pre className="whitespace-pre-wrap text-sm">
          {result || '点击按钮开始测试...'}
        </pre>
      </div>
      
      <div className="mt-6 p-4 bg-blue-50 rounded">
        <h3 className="font-semibold mb-2">测试说明:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>先点击"创建测试数据"创建一个包含学习内容的对话</li>
          <li>然后点击"测试智能加载"验证是否能正确找到并恢复现有内容</li>
          <li>最后可以点击"清理测试数据"清理测试数据</li>
        </ol>
      </div>
    </div>
  );
}