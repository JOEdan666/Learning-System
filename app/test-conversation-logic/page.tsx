'use client';

import React, { useState } from 'react';
import { ConversationService } from '../services/conversationService';

export default function TestConversationLogicPage() {
  const [subject, setSubject] = useState('数学');
  const [topic, setTopic] = useState('微积分基础');
  const [result, setResult] = useState<any>(null);
  const [allConversations, setAllConversations] = useState<any[]>([]);

  const conversationService = ConversationService.getInstance();

  const testFindExisting = () => {
    console.log('测试查找现有对话...');
    const existing = conversationService.findExistingLearningConversation(subject, topic);
    console.log('查找结果:', existing);
    setResult(existing);
  };

  const loadAllConversations = async () => {
    console.log('加载所有对话...');
    const response = await conversationService.getConversations();
    console.log('所有对话:', response.conversations);
    setAllConversations(response.conversations);
  };

  const createTestConversation = async () => {
    console.log('创建测试对话...');
    try {
      const newConv = await conversationService.createConversation({
        type: 'learning',
        subject: subject,
        topic: topic,
        title: `${subject} - ${topic}`
      });
      console.log('创建的对话:', newConv);
      setResult(newConv);
      await loadAllConversations();
    } catch (error) {
      console.error('创建对话失败:', error);
      setResult({ error: error instanceof Error ? error.message : String(error) });
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">ConversationService 逻辑测试</h1>
      
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2">学科:</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">主题:</label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
      </div>

      <div className="space-x-4 mb-6">
        <button
          onClick={testFindExisting}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          查找现有对话
        </button>
        
        <button
          onClick={createTestConversation}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          创建测试对话
        </button>
        
        <button
          onClick={loadAllConversations}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          加载所有对话
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-semibold mb-3">查找结果:</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-96">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-3">所有对话 ({allConversations.length}):</h2>
          <div className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-96">
            {allConversations.map((conv, index) => (
              <div key={conv.id} className="mb-2 p-2 bg-white rounded">
                <div><strong>ID:</strong> {conv.id}</div>
                <div><strong>类型:</strong> {conv.type}</div>
                <div><strong>学科:</strong> {conv.subject}</div>
                <div><strong>主题:</strong> {conv.topic}</div>
                <div><strong>标题:</strong> {conv.title}</div>
                <div><strong>已归档:</strong> {conv.isArchived ? '是' : '否'}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}