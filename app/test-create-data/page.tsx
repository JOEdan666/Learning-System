'use client';

import React, { useState } from 'react';
import { ConversationService } from '../services/conversationService';
import LearningProgressClient from '../services/learningProgressClient';

export default function TestCreateDataPage() {
  const [status, setStatus] = useState('');
  const conversationService = ConversationService.getInstance();

  const createTestData = async () => {
    try {
      setStatus('正在创建测试数据...');
      
      // 创建学习对话
      const conversation = await conversationService.createConversation({
        type: 'learning',
        subject: '数学',
        topic: '微积分基础',
        title: '数学 - 微积分基础'
      });
      
      setStatus(`创建对话成功: ${conversation.id}`);
      
      // 保存学习内容
      await LearningProgressClient.saveLearningProgress({
        conversationId: conversation.id,
        subject: '数学',
        topic: '微积分基础',
        aiExplanation: '这是测试的AI讲解内容：微积分是数学的一个重要分支，主要研究函数的导数、积分以及相关概念。微积分的基本思想是通过极限的概念来处理连续变化的量。',
        currentStep: 'explanation'
      });
      
      setStatus('测试数据创建完成！现在可以测试智能加载功能了。');
      
    } catch (error) {
      setStatus(`创建失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">创建测试数据</h1>
      
      <button
        onClick={createTestData}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mb-4"
      >
        创建测试数据
      </button>
      
      <div className="bg-gray-100 p-4 rounded">
        <p>{status}</p>
      </div>
      
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-3">测试步骤：</h2>
        <ol className="list-decimal list-inside space-y-2">
          <li>点击"创建测试数据"按钮</li>
          <li>访问学习界面：<a href="/learning-interface?subject=数学&topic=微积分基础" className="text-blue-500 underline">数学-微积分基础</a></li>
          <li>检查是否直接加载了现有内容，而不是重新生成</li>
        </ol>
      </div>
    </div>
  );
}