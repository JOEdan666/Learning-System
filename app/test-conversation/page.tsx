'use client'

import React, { useState, useEffect } from 'react';
import { ConversationService } from '../services/conversationService';
import { ConversationHistory } from '../types/conversation';
import { ChatMessage } from '../utils/chatTypes';

export default function TestConversationPage() {
  const [conversations, setConversations] = useState<ConversationHistory[]>([]);
  const [testResults, setTestResults] = useState<string[]>([]);
  const conversationService = ConversationService.getInstance();

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const testCreateConversation = async () => {
    try {
      const testMessage: ChatMessage = {
        role: 'user',
        content: '这是一条测试消息'
      };

      const conversation = await conversationService.createConversation({
        title: '测试对话',
        type: 'general',
        initialMessage: testMessage
      });

      addTestResult(`✅ 创建对话成功: ${conversation.title} (ID: ${conversation.id})`);
      loadConversations();
    } catch (error) {
      addTestResult(`❌ 创建对话失败: ${error}`);
    }
  };

  const testAddMessage = async () => {
    if (conversations.length === 0) {
      addTestResult('❌ 没有可用的对话来添加消息');
      return;
    }

    try {
      const conversation = conversations[0];
      const newMessage: ChatMessage = {
        role: 'assistant',
        content: '这是AI的回复消息'
      };

      const updated = await conversationService.addMessage(conversation.id, newMessage);
      if (updated) {
        addTestResult(`✅ 添加消息成功: ${updated.messageCount} 条消息`);
        loadConversations();
      } else {
        addTestResult('❌ 添加消息失败: 对话未找到');
      }
    } catch (error) {
      addTestResult(`❌ 添加消息失败: ${error}`);
    }
  };

  const loadConversations = async () => {
    try {
      const response = await conversationService.getConversations({
        type: 'general',
        sortBy: 'lastActivity',
        sortOrder: 'desc'
      });
      setConversations(response.conversations);
      addTestResult(`📋 加载对话: ${response.conversations.length} 个对话`);
    } catch (error) {
      addTestResult(`❌ 加载对话失败: ${error}`);
    }
  };

  const clearAllConversations = async () => {
    try {
      await conversationService.clearAllConversations();
      setConversations([]);
      addTestResult('🗑️ 清空所有对话成功');
    } catch (error) {
      addTestResult(`❌ 清空对话失败: ${error}`);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">对话历史功能测试</h1>
        
        {/* 测试按钮 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">测试操作</h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={testCreateConversation}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              创建测试对话
            </button>
            <button
              onClick={testAddMessage}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              添加测试消息
            </button>
            <button
              onClick={loadConversations}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              重新加载对话
            </button>
            <button
              onClick={clearAllConversations}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              清空所有对话
            </button>
          </div>
        </div>

        {/* 测试结果 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">测试结果</h2>
          <div className="bg-gray-100 rounded p-4 h-64 overflow-y-auto">
            {testResults.map((result, index) => (
              <div key={index} className="text-sm font-mono mb-1">
                {result}
              </div>
            ))}
          </div>
        </div>

        {/* 对话列表 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">当前对话列表 ({conversations.length})</h2>
          <div className="space-y-4">
            {conversations.map((conversation) => (
              <div key={conversation.id} className="border rounded p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium">{conversation.title}</h3>
                  <span className="text-sm text-gray-500">
                    {conversation.lastActivity.toLocaleString()}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  <p>消息数量: {conversation.messageCount}</p>
                  <p>类型: {conversation.type}</p>
                  <p>ID: {conversation.id}</p>
                </div>
                <div className="mt-2">
                  <h4 className="text-sm font-medium mb-1">消息:</h4>
                  <div className="space-y-1">
                    {conversation.messages.map((message, index) => (
                      <div key={index} className="text-xs bg-gray-50 p-2 rounded">
                        <span className="font-medium">{message.role}:</span> {message.content}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}