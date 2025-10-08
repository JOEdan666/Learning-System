'use client';

import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import LearningProgressClient from '../services/learningProgressClient';

export default function TestAISummarySave() {
  const [conversationId, setConversationId] = useState('test_summary_' + Date.now());
  const [aiSummary, setAiSummary] = useState('');
  const [savedSummary, setSavedSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 模拟AI总结内容
  const mockAISummary = `📚 **今日学习内容总结**

## 🎯 学习主题：垂直平分线的性质

### 📖 知识要点回顾
1. **垂直平分线定义**：垂直且平分一条线段的直线
2. **核心性质**：垂直平分线上的任意一点到线段两端点的距离相等
3. **判定方法**：到线段两端点距离相等的点在该线段的垂直平分线上

### 🧠 理解程度分析
- **掌握程度**：85%
- **强项**：基本概念理解清晰，能够识别垂直平分线
- **待提升**：复杂图形中的应用需要加强练习

### 📊 测验表现
- **总题数**：5题
- **正确率**：80%
- **得分**：4/5分
- **用时**：8分钟

### 💡 个性化建议
1. 🎯 **重点练习**：多做综合应用题，提高在复杂图形中识别垂直平分线的能力
2. 📝 **复习建议**：每天花15分钟复习垂直平分线的性质和判定
3. 🔄 **巩固方法**：通过画图练习加深对概念的理解

### 🌟 学习成果
今天成功掌握了垂直平分线的基本概念和性质，为后续学习三角形的性质打下了良好基础！`;

  // 保存AI总结到数据库
  const handleSaveSummary = async () => {
    if (!aiSummary.trim()) {
      toast.error('请先输入AI总结内容');
      return;
    }

    try {
      setIsLoading(true);
      
      await LearningProgressClient.saveLearningProgress({
        conversationId,
        subject: '数学',
        topic: '垂直平分线的性质',
        aiSummary,
        currentStep: 'REVIEW',
        isCompleted: true
      });
      
      toast.success('AI总结已保存到数据库');
    } catch (error) {
      console.error('保存AI总结失败:', error);
      toast.error('保存失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 从数据库加载AI总结
  const handleLoadSummary = async () => {
    try {
      setIsLoading(true);
      
      const learningProgress = await LearningProgressClient.getLearningProgress(conversationId);
      
      if (learningProgress && learningProgress.aiSummary) {
        setSavedSummary(learningProgress.aiSummary);
        toast.success('AI总结已从数据库加载');
      } else {
        toast.error('未找到保存的AI总结');
      }
    } catch (error) {
      console.error('加载AI总结失败:', error);
      toast.error('加载失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
            🧪 AI总结保存功能测试
          </h1>

          {/* 测试控制区域 */}
          <div className="bg-gray-50 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">测试控制</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  对话ID
                </label>
                <input
                  type="text"
                  value={conversationId}
                  onChange={(e) => setConversationId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex items-end space-x-2">
                <button
                  onClick={() => setAiSummary(mockAISummary)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  填充模拟数据
                </button>
                
                <button
                  onClick={handleSaveSummary}
                  disabled={isLoading}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                >
                  {isLoading ? '保存中...' : '保存总结'}
                </button>
                
                <button
                  onClick={handleLoadSummary}
                  disabled={isLoading}
                  className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50"
                >
                  {isLoading ? '加载中...' : '加载总结'}
                </button>
              </div>
            </div>
          </div>

          {/* AI总结输入区域 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl font-semibold mb-4">📝 AI总结内容（待保存）</h2>
              <textarea
                value={aiSummary}
                onChange={(e) => setAiSummary(e.target.value)}
                placeholder="请输入AI总结内容..."
                className="w-full h-96 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">💾 已保存的AI总结</h2>
              <div className="h-96 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 overflow-y-auto">
                {savedSummary ? (
                  <div className="whitespace-pre-wrap text-gray-800">
                    {savedSummary}
                  </div>
                ) : (
                  <div className="text-gray-500 text-center mt-20">
                    暂无保存的AI总结
                    <br />
                    点击"加载总结"按钮从数据库获取
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 测试说明 */}
          <div className="mt-8 bg-blue-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">🔍 测试说明</h3>
            <ul className="text-blue-700 space-y-2">
              <li>1. 点击"填充模拟数据"按钮填充示例AI总结内容</li>
              <li>2. 点击"保存总结"按钮将AI总结保存到数据库</li>
              <li>3. 点击"加载总结"按钮从数据库加载已保存的AI总结</li>
              <li>4. 可以修改对话ID来测试不同的学习会话</li>
              <li>5. 验证保存和加载功能是否正常工作</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}