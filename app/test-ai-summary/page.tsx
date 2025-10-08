'use client'
import React, { useState } from 'react';

const TestAISummaryPage = () => {
  const [aiSummary, setAiSummary] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string>('');
  const [apiStatus, setApiStatus] = useState<string>('');

  // 模拟学习数据
  const mockSession = {
    topic: '透镜及其应用',
    subject: '物理',
    createdAt: new Date(),
    steps: []
  };

  const mockQuizData = {
    score: 7,
    totalQuestions: 10,
    understandingLevel: 4,
    learningDuration: 25,
    quizQuestions: [
      {
        question: '凸透镜的焦点有什么特性？',
        userAnswer: '平行光线经过凸透镜后会聚焦到焦点',
        correctAnswer: '平行光线经过凸透镜后会聚焦到焦点',
        isCorrect: true,
        explanation: '这是凸透镜的基本光学性质'
      },
      {
        question: '凹透镜对光线有什么作用？',
        userAnswer: '会聚光线',
        correctAnswer: '发散光线',
        isCorrect: false,
        explanation: '凹透镜是发散透镜，会使光线发散'
      }
    ]
  };

  const mockContent = `
# 透镜及其应用

## 1. 透镜的基本概念
透镜是由透明材料制成的光学元件，能够改变光线的传播方向。

## 2. 凸透镜
- **定义**：中间厚、边缘薄的透镜
- **作用**：对光线起会聚作用
- **焦点**：平行光线经过凸透镜后会聚的点

## 3. 凹透镜  
- **定义**：中间薄、边缘厚的透镜
- **作用**：对光线起发散作用
- **虚焦点**：发散光线的反向延长线的交点

## 4. 透镜的应用
- 放大镜
- 照相机
- 显微镜
- 望远镜
  `;

  // 测试API连接
  const testApiConnection = async () => {
    setApiStatus('正在测试API连接...');
    try {
      const response = await fetch('/api/test-connection');
      const data = await response.json();
      setApiStatus(`API连接状态: ${response.ok ? '成功' : '失败'} - ${data.message || data.error}`);
    } catch (error) {
      setApiStatus(`API连接错误: ${error}`);
    }
  };

  // 测试AI总结生成
  const testAISummaryGeneration = async () => {
    setIsGenerating(true);
    setError('');
    setAiSummary('');

    try {
      console.log('🔍 开始测试AI总结生成...');
      
      // 构建请求数据
      const requestData = {
        messages: [
          {
            role: 'system',
            content: `你是一个专业的学习分析师和教育专家。请根据学生的学习情况生成深度的、个性化的学期总结。

## 📋 分析要求
请提供以下几个方面的详细分析：
- **学习表现评估**：基于测验成绩和理解程度
- **知识掌握分析**：分析学生对各知识点的掌握情况
- **学习能力诊断**：评估学习效率和学习方法
- **个性化改进计划**：提供具体的学习建议
- **推荐学习资源**：推荐适合的学习材料和方法

## 📝 写作要求
- 使用清晰的结构和标题
- 提供具体的数据和例子
- 语言专业但易懂
- 给出可操作的建议
- 保持鼓励和建设性的语调`
          },
          {
            role: 'user',
            content: `请为以下学习情况生成学期总结：

## 📚 学习基本信息
- **学习主题**: ${mockSession.topic}
- **学科领域**: ${mockSession.subject}
- **学习时长**: ${mockQuizData.learningDuration}分钟
- **完成时间**: ${new Date().toLocaleDateString()}

## 📊 测验成绩数据
- **测验得分**: ${mockQuizData.score}/${mockQuizData.totalQuestions}题正确
- **得分率**: ${Math.round((mockQuizData.score / mockQuizData.totalQuestions) * 100)}%
- **理解程度**: ${mockQuizData.understandingLevel}/5星
- **错题数量**: ${mockQuizData.totalQuestions - mockQuizData.score}题

## 📖 今日学习内容
${mockContent.substring(0, 1000)}...

请生成详细的个性化学习总结。`
          }
        ]
      };

      console.log('📤 发送请求到 /api/openai-chat');
      console.log('请求数据:', JSON.stringify(requestData, null, 2));

      const response = await fetch('/api/openai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      console.log('📥 收到响应:', response.status, response.statusText);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ API响应成功:', data);
        setAiSummary(data.content || '响应中没有内容');
      } else {
        const errorData = await response.text();
        console.error('❌ API响应失败:', errorData);
        throw new Error(`API调用失败: ${response.status} - ${errorData}`);
      }
    } catch (error) {
      console.error('💥 AI总结生成失败:', error);
      setError(`生成失败: ${error}`);
      
      // 使用备选总结
      const fallbackSummary = `
# 📊 学习总结报告

## 🎯 学习表现概览
- **学习主题**: ${mockSession.topic}
- **学科**: ${mockSession.subject}
- **得分**: ${mockQuizData.score}/${mockQuizData.totalQuestions} (${Math.round((mockQuizData.score / mockQuizData.totalQuestions) * 100)}%)
- **理解程度**: ${mockQuizData.understandingLevel}/5星

## 📈 学习分析
您在${mockSession.topic}的学习中表现${mockQuizData.score / mockQuizData.totalQuestions >= 0.7 ? '良好' : '需要改进'}。

## 💡 改进建议
${mockQuizData.score / mockQuizData.totalQuestions >= 0.8 ? 
  '继续保持良好的学习状态，可以尝试更高难度的内容。' : 
  '建议重点复习错题涉及的知识点，加强基础概念的理解。'}

*注：此为备选总结，API调用失败时显示*
      `;
      setAiSummary(fallbackSummary);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          AI总结功能测试页面
        </h1>

        {/* 测试控制面板 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">测试控制</h2>
          <div className="flex gap-4 mb-4">
            <button
              onClick={testApiConnection}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              测试API连接
            </button>
            <button
              onClick={testAISummaryGeneration}
              disabled={isGenerating}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
            >
              {isGenerating ? '生成中...' : '测试AI总结生成'}
            </button>
          </div>
          
          {apiStatus && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded mb-4">
              <p className="text-blue-800">{apiStatus}</p>
            </div>
          )}
        </div>

        {/* 模拟数据展示 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">模拟学习数据</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium mb-2">学习信息</h3>
              <ul className="text-sm text-gray-600">
                <li>主题: {mockSession.topic}</li>
                <li>学科: {mockSession.subject}</li>
                <li>学习时长: {mockQuizData.learningDuration}分钟</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-2">测验结果</h3>
              <ul className="text-sm text-gray-600">
                <li>得分: {mockQuizData.score}/{mockQuizData.totalQuestions}</li>
                <li>正确率: {Math.round((mockQuizData.score / mockQuizData.totalQuestions) * 100)}%</li>
                <li>理解程度: {mockQuizData.understandingLevel}/5星</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 错误信息 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <h3 className="text-red-800 font-medium mb-2">错误信息</h3>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* AI总结结果 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">AI总结结果</h2>
          {isGenerating ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-2 text-gray-600">正在生成AI总结...</span>
            </div>
          ) : aiSummary ? (
            <div className="prose max-w-none">
              <div className="bg-gray-50 p-4 rounded border">
                <pre className="whitespace-pre-wrap text-sm">{aiSummary}</pre>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              点击"测试AI总结生成"按钮开始测试
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestAISummaryPage;