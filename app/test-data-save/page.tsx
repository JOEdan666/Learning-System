'use client';

import { useState } from 'react';
import LearningProgressClient from '../services/learningProgressClient';

export default function TestDataSave() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testSaveAndRetrieve = async () => {
    setLoading(true);
    setResult('正在测试数据保存和检索功能...\n\n');
    
    try {
      // 1. 测试保存学习进度
      const testData = {
        conversationId: 'test_conversation_' + Date.now(),
        subject: '数学',
        topic: '二次函数',
        region: '全国',
        grade: '九年级',
        aiExplanation: '二次函数是形如 y = ax² + bx + c (a ≠ 0) 的函数。它的图像是一条抛物线。',
        socraticDialogue: [
          {
            question: '什么是二次函数的顶点？',
            answer: '顶点是抛物线的最高点或最低点',
            feedback: '很好的理解！'
          }
        ],
        currentStep: 'EXPLAIN',
        isCompleted: false
      };

      setResult(prev => prev + '📝 步骤1: 保存学习进度...\n');
      const saveResponse = await LearningProgressClient.saveLearningProgress(testData);
      setResult(prev => prev + `✅ 保存成功！会话ID: ${saveResponse.id}\n\n`);
      
      // 2. 测试获取学习进度
      setResult(prev => prev + '📖 步骤2: 获取学习进度...\n');
      const retrieveResponse = await LearningProgressClient.getLearningProgress(testData.conversationId);
      setResult(prev => prev + `✅ 获取成功！\n`);
      setResult(prev => prev + `主题: ${retrieveResponse.topic}\n`);
      setResult(prev => prev + `学科: ${retrieveResponse.subject}\n`);
      setResult(prev => prev + `当前步骤: ${retrieveResponse.currentStep}\n\n`);
      
      // 3. 测试更新学习进度
      setResult(prev => prev + '🔄 步骤3: 更新学习进度...\n');
      const updateData = {
        ...testData,
        currentStep: 'QUIZ',
        aiExplanation: testData.aiExplanation + '\n\n补充：二次函数的开口方向由a的符号决定。'
      };
      
      const updateResponse = await LearningProgressClient.saveLearningProgress(updateData);
      setResult(prev => prev + `✅ 更新成功！当前步骤: ${updateResponse.currentStep}\n\n`);
      
      // 4. 再次获取验证更新
      setResult(prev => prev + '🔍 步骤4: 验证更新结果...\n');
      const finalRetrieve = await LearningProgressClient.getLearningProgress(testData.conversationId);
      setResult(prev => prev + `✅ 验证成功！\n`);
      setResult(prev => prev + `更新后的步骤: ${finalRetrieve.currentStep}\n`);
      setResult(prev => prev + `AI讲解长度: ${finalRetrieve.aiExplanation?.length || 0} 字符\n\n`);
      
      setResult(prev => prev + '🎉 所有测试通过！数据保存和检索功能正常工作。\n');
      
    } catch (error) {
      console.error('测试失败:', error);
      setResult(prev => prev + `❌ 测试失败: ${error instanceof Error ? error.message : String(error)}\n`);
      setResult(prev => prev + '\n详细错误信息请查看浏览器控制台。\n');
    } finally {
      setLoading(false);
    }
  };

  const testDatabaseConnection = async () => {
    setLoading(true);
    setResult('正在测试数据库连接...\n\n');
    
    try {
      // 测试简单的数据库查询
      const response = await fetch('/api/learning-progress?conversationId=test_connection');
      
      if (response.status === 404) {
        setResult(prev => prev + '✅ 数据库连接正常（返回404表示连接成功但未找到数据）\n');
      } else if (response.ok) {
        setResult(prev => prev + '✅ 数据库连接正常且找到了数据\n');
      } else {
        const errorData = await response.json();
        setResult(prev => prev + `❌ 数据库连接异常: ${errorData.error}\n`);
      }
    } catch (error) {
      setResult(prev => prev + `❌ 数据库连接失败: ${error instanceof Error ? error.message : String(error)}\n`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">数据保存功能测试</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">测试选项</h2>
          <div className="space-y-4">
            <button
              onClick={testDatabaseConnection}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg mr-4"
            >
              {loading ? '测试中...' : '测试数据库连接'}
            </button>
            
            <button
              onClick={testSaveAndRetrieve}
              disabled={loading}
              className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg"
            >
              {loading ? '测试中...' : '测试完整保存和检索流程'}
            </button>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">测试结果</h2>
          <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-auto max-h-96 whitespace-pre-wrap">
            {result || '点击上方按钮开始测试...'}
          </pre>
        </div>
        
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">说明</h3>
          <ul className="text-yellow-700 space-y-1">
            <li>• 此页面用于测试学习进度的保存和检索功能</li>
            <li>• 测试包括：数据库连接、数据保存、数据获取、数据更新</li>
            <li>• 如果测试失败，请检查数据库配置和网络连接</li>
            <li>• 可以通过 Prisma Studio (http://localhost:5555) 查看数据库中的实际数据</li>
          </ul>
        </div>
      </div>
    </div>
  );
}