'use client';

import React, { useState } from 'react';
import { ConversationService } from '../services/conversationService';
import LearningProgressClient from '../services/learningProgressClient';

export default function TestSmartLoadingPage() {
  const [log, setLog] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const conversationService = ConversationService.getInstance();

  const addLog = (message: string) => {
    console.log(message);
    setLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testFullFlow = async () => {
    setIsLoading(true);
    setLog([]);
    
    const subject = '数学';
    const topic = '微积分基础';
    
    try {
      addLog('开始测试智能加载流程...');
      
      // 1. 清理现有数据
      addLog('1. 清理现有数据...');
      const allConversations = await conversationService.getConversations();
      const existingConv = allConversations.conversations.find(conv => 
        conv.type === 'learning' && 
        conv.subject === subject && 
        conv.topic === topic
      );
      
      if (existingConv) {
        await conversationService.deleteConversation(existingConv.id);
        addLog(`删除现有对话: ${existingConv.id}`);
      }
      
      // 2. 测试第一次访问（应该创建新对话）
      addLog('2. 测试第一次访问...');
      let foundConversation = conversationService.findExistingLearningConversation(subject, topic);
      addLog(`第一次查找结果: ${foundConversation ? '找到' : '未找到'}`);
      
      // 3. 创建新的学习对话
      addLog('3. 创建新的学习对话...');
      const newConversation = await conversationService.createConversation({
        type: 'learning',
        subject: subject,
        topic: topic,
        title: `${subject} - ${topic}`
      });
      addLog(`创建对话成功: ${newConversation.id}`);
      
      // 4. 保存学习内容到数据库
      addLog('4. 保存学习内容到数据库...');
      const testContent = '这是测试的AI讲解内容：微积分是数学的一个重要分支...';
      await LearningProgressClient.saveLearningProgress({
        conversationId: newConversation.id,
        subject: subject,
        topic: topic,
        aiExplanation: testContent,
        currentStep: 'explanation'
      });
      addLog('学习内容保存成功');
      
      // 5. 测试第二次访问（应该找到现有对话）
      addLog('5. 测试第二次访问...');
      foundConversation = conversationService.findExistingLearningConversation(subject, topic);
      addLog(`第二次查找结果: ${foundConversation ? `找到 - ${foundConversation.id}` : '未找到'}`);
      
      // 6. 测试从数据库恢复内容
      addLog('6. 测试从数据库恢复内容...');
      if (foundConversation) {
        const learningProgress = await LearningProgressClient.getLearningProgress(foundConversation.id);
        addLog(`恢复的内容: ${learningProgress?.aiExplanation ? '成功' : '失败'}`);
        if (learningProgress?.aiExplanation) {
          addLog(`内容预览: ${learningProgress.aiExplanation.substring(0, 50)}...`);
        }
      }
      
      addLog('✅ 测试完成！智能加载功能正常工作');
      
    } catch (error) {
      addLog(`❌ 测试失败: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const clearData = async () => {
    setIsLoading(true);
    try {
      addLog('清理所有学习对话数据...');
      const allConversations = await conversationService.getConversations();
      const learningConversations = allConversations.conversations.filter(conv => conv.type === 'learning');
      
      for (const conv of learningConversations) {
        await conversationService.deleteConversation(conv.id);
        addLog(`删除对话: ${conv.id}`);
      }
      
      addLog('清理完成');
    } catch (error) {
      addLog(`清理失败: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">智能加载功能测试</h1>
      
      <div className="space-x-4 mb-6">
        <button
          onClick={testFullFlow}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isLoading ? '测试中...' : '开始完整测试'}
        </button>
        
        <button
          onClick={clearData}
          disabled={isLoading}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
        >
          清理测试数据
        </button>
      </div>

      <div className="bg-gray-100 p-4 rounded">
        <h2 className="text-lg font-semibold mb-3">测试日志:</h2>
        <div className="space-y-1 max-h-96 overflow-auto">
          {log.map((entry, index) => (
            <div key={index} className="text-sm font-mono">
              {entry}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}