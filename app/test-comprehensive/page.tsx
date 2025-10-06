'use client';

import React from 'react';
import ExplainStep from '../components/LearningFlow/ExplainStep';

export default function TestComprehensivePage() {
  const testContent = `### 全等三角形的定义与性质

**全等三角形**是指能够完全重合的两个三角形。它们具有以下性质：

* **对应边相等**：两个全等三角形的对应边长度相等
* **对应角相等**：两个全等三角形的对应角度数相等
* **对应高相等**：两个全等三角形的对应高长度相等

### 判定方法

全等三角形有多种判定方法：

* **SSS（边边边）**：三边对应相等的两个三角形全等
* **SAS（边角边）**：两边及其夹角对应相等的两个三角形全等
* **ASA（角边角）**：两角及其夹边对应相等的两个三角形全等
* **AAS（角角边）**：两角及其中一个角的对边对应相等的两个三角形全等
* **HL（斜边直角边）**：斜边和一条直角边对应相等的两个直角三角形全等

### 实际应用

全等三角形在实际生活中有广泛应用：

* **建筑工程**：确保结构对称性和稳定性
* **机械制造**：保证零件的精确匹配
* **艺术设计**：创造对称美观的图案

**例如**：在设计桥梁时，工程师会利用全等三角形的性质来确保桥梁的两边具有相同的承重能力。`;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">全面格式化测试</h1>
        <ExplainStep 
          content={testContent}
          onNext={() => console.log('Next step')}
        />
      </div>
    </div>
  );
}