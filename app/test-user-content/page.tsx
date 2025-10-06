'use client';

import React from 'react';
import dynamic from 'next/dynamic';

// 动态导入 ExplainStep 组件以避免 SSR 问题
const ExplainStep = dynamic(() => import('../components/LearningFlow/ExplainStep'), { ssr: false });

export default function TestUserContentPage() {
  const testContent = `### 全面功能测试

1. 标题测试

这是**加粗文本**测试。

2. 列表测试

* 第一个列表项
* **第二个加粗列表项**
* 第三个列表项包含 $E = mc^2$ 公式

3. 数学公式测试

行内公式：$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$

块级公式：

$$\\int_{0}^{\\infty} e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}$$

4. 段落测试

这是一个普通段落，包含**加粗文本**和行内公式 $\\pi \\approx 3.14159$。

这是第二个段落，用于测试段落间的间距和格式化。`;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">用户内容全面测试</h1>
        <ExplainStep 
          content={testContent}
          onNext={() => console.log('Next step')}
        />
      </div>
    </div>
  );
}