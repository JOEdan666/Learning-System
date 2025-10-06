'use client';

import React from 'react';
import dynamic from 'next/dynamic';

// 动态导入 ExplainStep 组件以避免 SSR 问题
const ExplainStep = dynamic(() => import('../components/LearningFlow/ExplainStep'), { ssr: false });

export default function TestFormatVerificationPage() {
  // 您可以在这里修改 testContent 来测试不同的格式
  const testContent = `### 在这里输入您的标题

在这里输入您的段落文本，可以包含**加粗内容**和数学公式 $E = mc^2$。

#### 子标题

* 列表项1
* **加粗列表项2**
* 包含公式的列表项 $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$

块级公式：

$$\\int_{0}^{\\infty} e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}$$

另一个段落用于测试段落间距。`;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">格式验证测试</h1>
        <div className="mb-8 p-4 bg-yellow-50 border-l-4 border-yellow-400">
          <h2 className="text-lg font-bold mb-2">使用说明：</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>修改 testContent 变量中的内容来测试不同的格式</li>
            <li>保存文件后刷新页面查看效果</li>
            <li>如果发现格式问题，请截图或描述问题现象</li>
          </ul>
        </div>
        <ExplainStep 
          content={testContent}
          onNext={() => console.log('Next step')}
        />
      </div>
    </div>
  );
}