'use client';

import { useState } from 'react';
import LearningProgressClient from '../services/learningProgressClient';

export default function TestSaveAPI() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testSave = async () => {
    setLoading(true);
    setResult('');
    
    try {
      const testData = {
        conversationId: 'test_' + Date.now(),
        subject: '数学',
        topic: '二次函数',
        aiExplanation: '这是一个测试的AI讲解内容',
        socraticDialogue: [
          {
            question: '什么是二次函数？',
            answer: '二次函数是形如 y = ax² + bx + c 的函数',
            feedback: '很好的回答！'
          }
        ],
        currentStep: 'explanation'
      };

      console.log('开始测试保存...', testData);
      const response = await LearningProgressClient.saveLearningProgress(testData);
      console.log('保存成功:', response);
      setResult(`✅ 保存成功！\n${JSON.stringify(response, null, 2)}`);
      
      // 测试获取
      console.log('开始测试获取...');
      const retrieved = await LearningProgressClient.getLearningProgress(testData.conversationId);
      console.log('获取成功:', retrieved);
      setResult(prev => prev + `\n\n✅ 获取成功！\n${JSON.stringify(retrieved, null, 2)}`);
      
    } catch (error) {
      console.error('测试失败:', error);
      setResult(`❌ 测试失败: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">学习进度保存 API 测试</h1>
      
      <button
        onClick={testSave}
        disabled={loading}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
      >
        {loading ? '测试中...' : '测试保存功能'}
      </button>
      
      {result && (
        <div className="mt-6 p-4 bg-gray-100 rounded">
          <h2 className="text-lg font-semibold mb-2">测试结果:</h2>
          <pre className="whitespace-pre-wrap text-sm">{result}</pre>
        </div>
      )}
    </div>
  );
}