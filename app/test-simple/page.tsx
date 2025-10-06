'use client';

import React from 'react';
import ExplainStep from '../components/LearningFlow/ExplainStep';

export default function TestSimplePage() {
  const testContent = `### 定义
**二次函数**是形如 $y = ax^2 + bx + c$ (其中 $a \\ne 0$) 的函数。它的图像是一条**抛物线**。

### 重要性
二次函数是描述现实世界中许多现象的基础数学模型，例如：

* **抛体运动**：篮球投出的轨迹
* **工程设计**：桥梁拱形、卫星天线
* **经济分析**：最大利润问题

### 关键点
* **开口方向**：由系数 $a$ 决定
  - $a > 0$：开口向上（像碗）
  - $a < 0$：开口向下（像山）
* **顶点**：抛物线的最高点或最低点，坐标为 $(-\\frac{b}{2a}, \\frac{4ac-b^2}{4a})$
* **对称轴**：穿过顶点的垂直线 $x = -\\frac{b}{2a}$

**例如**：$y = x^2 - 4x + 3$ 的抛物线开口向上，顶点在 $(2, -1)$，对称轴是 $x = 2$。`;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">简单格式化测试</h1>
        <ExplainStep 
          content={testContent}
          onNext={() => console.log('Next step')}
        />
      </div>
    </div>
  );
}