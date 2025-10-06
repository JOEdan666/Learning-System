'use client'

import React, { useState } from 'react';
import { ConversationService } from '../services/conversationService';
import { ChatMessage } from '../utils/chatTypes';

export default function TestTitleGenerationPage() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const conversationService = ConversationService.getInstance();

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const testTitleGeneration = async () => {
    setIsLoading(true);
    addTestResult('🚀 开始测试自动标题生成...');

    try {
      // 创建测试对话
      const conversation = await conversationService.createConversation({
        title: '新对话',
        type: 'general'
      });
      addTestResult(`✅ 创建测试对话: ${conversation.id}`);

      // 模拟对话消息
      const testMessages: ChatMessage[] = [
        { role: 'user', content: '你好，我想学习JavaScript编程' },
        { role: 'assistant', content: '你好！我很乐意帮助你学习JavaScript编程。JavaScript是一门非常流行的编程语言...' },
        { role: 'user', content: '能给我介绍一下变量的概念吗？' },
        { role: 'assistant', content: '当然可以！在JavaScript中，变量是用来存储数据的容器...' }
      ];

      // 逐一添加消息
      for (let i = 0; i < testMessages.length; i++) {
        const message = testMessages[i];
        await conversationService.addMessage(conversation.id, message);
        addTestResult(`📝 添加消息 ${i + 1}: ${message.role} - ${message.content.substring(0, 20)}...`);
      }

      // 测试标题生成
      addTestResult('🎯 测试标题生成...');
      const titleResponse = await conversationService.generateTitle({
        messages: testMessages,
        type: 'general'
      });

      addTestResult(`🏷️ 生成的标题: "${titleResponse.title}" (置信度: ${titleResponse.confidence})`);

      // 更新对话标题
      const updatedConversation = await conversationService.updateConversation(conversation.id, {
        title: titleResponse.title
      });

      if (updatedConversation) {
        addTestResult(`✅ 标题更新成功: "${updatedConversation.title}"`);
      }

    } catch (error) {
      addTestResult(`❌ 测试失败: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testLearningTitleGeneration = async () => {
    setIsLoading(true);
    addTestResult('🚀 开始测试学习对话标题生成...');

    try {
      // 测试学习对话标题生成
      const titleResponse = await conversationService.generateTitle({
        messages: [
          { role: 'user', content: '请解释一下牛顿第一定律' },
          { role: 'assistant', content: '牛顿第一定律，也称为惯性定律...' }
        ],
        type: 'learning',
        subject: '物理',
        topic: '牛顿定律'
      });

      addTestResult(`🏷️ 学习对话标题: "${titleResponse.title}" (置信度: ${titleResponse.confidence})`);

    } catch (error) {
      addTestResult(`❌ 学习对话标题生成失败: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">自动标题生成功能测试</h1>
        
        {/* 测试按钮 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">测试操作</h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={testTitleGeneration}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {isLoading ? '测试中...' : '测试普通对话标题生成'}
            </button>
            <button
              onClick={testLearningTitleGeneration}
              disabled={isLoading}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
            >
              {isLoading ? '测试中...' : '测试学习对话标题生成'}
            </button>
            <button
              onClick={clearResults}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              清空结果
            </button>
          </div>
        </div>

        {/* 测试结果 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">测试结果</h2>
          <div className="bg-gray-100 rounded p-4 h-96 overflow-y-auto">
            {testResults.length === 0 ? (
              <p className="text-gray-500 text-center">点击上方按钮开始测试</p>
            ) : (
              testResults.map((result, index) => (
                <div key={index} className="text-sm font-mono mb-1">
                  {result}
                </div>
              ))
            )}
          </div>
        </div>

        {/* 说明 */}
        <div className="bg-blue-50 rounded-lg p-6 mt-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">功能说明</h3>
          <ul className="text-blue-800 space-y-1">
            <li>• 普通对话：使用DeepSeek API根据对话内容自动生成标题</li>
            <li>• 学习对话：基于学科和主题直接生成标题</li>
            <li>• 自动触发：当对话消息数量达到4条且标题为默认标题时自动生成</li>
            <li>• 智能判断：避免重复生成，只在需要时更新标题</li>
          </ul>
        </div>
      </div>
    </div>
  );
}