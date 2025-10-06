'use client';

import React from 'react';
import ExplainStep from '../components/LearningFlow/ExplainStep';

const verticalBisectorContent = `# 数学 - 垂直平分线

## 学习目标
通过本次学习，你将掌握垂直平分线的核心概念和应用方法。

## 核心概念
垂直平分线是数学中的重要概念，具有以下特点：

- **基础性**：是理解更高级概念的基础
- **实用性**：在实际问题中有广泛应用
- **系统性**：与其他知识点形成完整的知识体系

## 详细讲解

### 1. 基本定义
垂直平分线是指通过线段中点并且垂直于该线段的直线。

### 2. 重要性质
- **性质一**：垂直平分线上的任意一点到线段两端点的距离相等
- **性质二**：到线段两端点距离相等的点在该线段的垂直平分线上
- **性质三**：垂直平分线是线段的对称轴

### 3. 应用场景
在实际学习和考试中，垂直平分线主要应用于：

- 基础题型的解答
- 综合问题的分析
- 实际问题的建模

## 学习要点

### 重点掌握
- 核心概念的准确理解
- 基本方法的熟练运用
- 典型问题的解题思路

### 难点突破
- 抽象概念的具体化理解
- 多种方法的灵活选择
- 复杂问题的分析策略

## 练习建议
- **基础练习**：从简单例题开始，巩固基本概念
- **提高练习**：尝试中等难度题目，提升应用能力
- **综合练习**：挑战复杂问题，培养综合思维

## 学习提示

💡 **学习建议**：
- 理解概念比记忆公式更重要
- 多做练习，在实践中加深理解
- 及时总结，形成知识网络

🎯 **重点关注**：
- 概念的本质含义
- 方法的适用条件
- 问题的解决策略`;

export default function TestContentPage() {
  return (
    <div className="min-h-screen bg-gray-900">
      <ExplainStep
        content={verticalBisectorContent}
        onNext={() => {
          console.log('点击了继续按钮');
          alert('这是测试页面，继续功能已触发！');
        }}
        onAskQuestion={(question) => {
          console.log('用户提问:', question);
          alert(`收到问题: ${question}`);
        }}
        step="EXPLAIN"
      />
    </div>
  );
}