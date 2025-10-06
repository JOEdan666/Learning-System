'use client';

import React from 'react';
import dynamic from 'next/dynamic';

// 动态导入 ExplainStep 组件以避免 SSR 问题
const ExplainStep = dynamic(() => import('../components/LearningFlow/ExplainStep'), { ssr: false });

export default function JingYeSiLearningPage() {
  const learningContent = `## 《静夜思》中考学习闭环

### 作品背景与主旨

**《静夜思》**是唐代诗人**李白**创作的一首五言绝句，描绘了游子在寂静的月夜思念故乡的深情。

**核心情感**：表达了**漂泊者对故乡的普遍思念**，语言浅显却意境深远，是**中国古典诗歌的代表作**之一。

### 中考考点分析

#### 1. 主旨思想考点
- **考查重点**：思乡之情的表达
- **常见题型**：诗歌表达了诗人怎样的思想感情？

#### 2. 写作手法考点
- **借景抒情**：通过"床前明月光"的实景，自然引出"思故乡"的深情
- **语言特色**：通俗易懂，如口语般自然，却蕴含深刻情感

#### 3. 易考题型示例
1. 诗歌前两句描绘了怎样的画面？
2. "疑"字有何表达效果？
3. 全诗如何体现思乡之情？

### 写作手法详解

#### 情景交融
- 通过"床前明月光"的实景描写，营造静谧的夜晚氛围
- 自然引出"思故乡"的深情，做到情景交融

#### 语言特色
- **通俗易懂**：用词简单，接近口语
- **意蕴深远**：浅显的语言中蕴含浓浓的思乡之情

### 模拟考题与答案解析

#### 【考题1】
诗歌表达了诗人怎样的思想感情？

**答案**：表达了诗人对故乡的深切思念之情。诗人看到床前的月光，以为是地上的霜，抬头望月，低头沉思，生动地表现了诗人的思乡之情。

#### 【考题2】
"疑是地上霜"中的"疑"字有何妙处？

**答案**："疑"是"怀疑"的意思，诗人把照在床前的月光误认为是洒在地面的浓霜，生动地表现了诗人睡眼朦胧时的迷糊状态，也侧面表现了夜色之深、月光之明亮。

#### 【考题3】
请从写作手法的角度赏析这首诗。

**答案**：这首诗运用了借景抒情的手法。通过描写静夜中的月光，营造了清冷的氛围，自然引出诗人的思乡之情。全诗语言朴素自然，却情深意长，体现了李白诗歌清新自然的风格特点。

### 学习建议

1. **理解记忆**：在理解诗歌情感的基础上背诵
2. **考点把握**：重点掌握借景抒情的写作手法
3. **迁移运用**：学习"由眼前景触发心中情"的写法，用于自己的作文中
`;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">《静夜思》中考学习闭环</h1>
        <div className="mb-8 p-4 bg-blue-50 border-l-4 border-blue-400">
          <h2 className="text-lg font-bold mb-2">学习目标：</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>掌握《静夜思》的主旨思想和写作手法</li>
            <li>熟悉中考常见题型及答题技巧</li>
            <li>能够迁移运用借景抒情的写作手法</li>
          </ul>
        </div>
        <ExplainStep 
          content={learningContent}
          onNext={() => console.log('Next step')}
        />
      </div>
    </div>
  );
}