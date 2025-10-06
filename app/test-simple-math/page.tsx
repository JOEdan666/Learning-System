'use client';

import React from 'react';
import dynamic from 'next/dynamic';

// 动态导入 ExplainStep 组件以避免 SSR 问题
const ExplainStep = dynamic(() => import('../components/LearningFlow/ExplainStep'), { ssr: false });

export default function TestSimpleMathPage() {
  const testContent = `### 简单数学公式测试

这是一个行内公式：$E = mc^2$

这是一个块级公式：

$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$

**重点公式**：$\\pi \\approx 3.14159$`;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">简单数学公式测试</h1>
        <ExplainStep 
          content={testContent}
          onNext={() => console.log('Next step')}
        />
      </div>
    </div>
  );
}