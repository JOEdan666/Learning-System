'use client';

import React from 'react';
import ExplainStep from '../components/LearningFlow/ExplainStep';

export default function TestMathPage() {
  const testContent = `### 二次函数的性质

**二次函数**的一般形式为 $f(x) = ax^2 + bx + c$，其中 $a \\neq 0$。

#### 顶点坐标

二次函数的顶点坐标公式为：

$$\\left(-\\frac{b}{2a}, \\frac{4ac-b^2}{4a}\\right)$$

#### 判别式

判别式 $\\Delta = b^2 - 4ac$ 决定了二次函数的性质：

* 当 $\\Delta > 0$ 时，函数与 $x$ 轴有两个交点
* 当 $\\Delta = 0$ 时，函数与 $x$ 轴有一个交点
* 当 $\\Delta < 0$ 时，函数与 $x$ 轴没有交点

**重要性质**：二次函数的图像是一个抛物线，开口方向由系数 $a$ 决定。`;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">数学公式测试</h1>
        <ExplainStep 
          content={testContent}
          onNext={() => console.log('Next step')}
        />
      </div>
    </div>
  );
}