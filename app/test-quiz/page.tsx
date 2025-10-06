'use client'

import React, { useState } from 'react'
import QuizStep from '../components/LearningFlow/QuizStep'

export default function TestQuizPage() {
  const [showQuiz, setShowQuiz] = useState(false)
  
  const testContent = `
垂直平分线是几何学中的一个重要概念。垂直平分线是指垂直于一条线段并且平分这条线段的直线。

垂直平分线具有以下重要性质：
1. 垂直平分线上的任意一点到线段两端点的距离相等
2. 到线段两端点距离相等的点都在这条线段的垂直平分线上

垂直平分线在实际生活中有广泛的应用：
- 在建筑设计中，用于确保结构的对称性
- 在地图制作中，用于确定等距离点
- 在工程测量中，用于精确定位

垂直平分线的作图方法：
1. 以线段的两个端点为圆心，以大于线段长度一半的长度为半径画弧
2. 两弧的交点确定了垂直平分线的方向
3. 连接两个交点即得到垂直平分线
  `

  const handleQuizComplete = (results: any) => {
    console.log('测试完成:', results)
    alert('测试完成！查看控制台了解详情。')
  }

  const handleBack = () => {
    setShowQuiz(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">题目生成测试页面</h1>
        
        {!showQuiz ? (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">测试内容</h2>
            <div className="bg-gray-100 p-4 rounded mb-6">
              <pre className="whitespace-pre-wrap text-sm">{testContent}</pre>
            </div>
            
            <button
              onClick={() => setShowQuiz(true)}
              className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
            >
              开始测试题目生成
            </button>
            
            <div className="mt-4 text-sm text-gray-600">
              <p>点击按钮后，请打开浏览器开发者工具查看控制台输出，了解题目生成的详细过程。</p>
            </div>
          </div>
        ) : (
          <QuizStep
            knowledgeContent={testContent}
            region="北京"
            grade="初中"
            subject="数学"
            topic="垂直平分线"
            onComplete={handleQuizComplete}
            onBack={handleBack}
          />
        )}
      </div>
    </div>
  )
}