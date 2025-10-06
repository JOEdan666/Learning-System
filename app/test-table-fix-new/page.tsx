'use client';

import React from 'react';
import TableRenderer from '../components/TableRenderer';

const TestTableFixNew = () => {
  // 测试用的表格内容
  const testContent1 = `这是表格前的内容。

| 项目 | 具体内容 | 时间安排 | 预期突破 |
|------|----------|----------|----------|
| 目标 | 熟练掌握脑功能应用分析能力 | 2周内完成 | 能够快速准确解决各类脑功能问题 |
| 执行步骤 | ①每日分析2个临床病例<br>②绘制3个功能网络图<br>③完成跨学科应用联想练习 | 每天30分钟 | 建立牢固的神经功能分析框架 |
| 突破点 | 重点攻克"症状-脑区"快速匹配能力 | 第1周集中训练 | 形成条件反射式的功能定位思维 |

这是表格后的内容。`;

  const testContent2 = `# 思维导图核心

| 中日甲午战争 | 背景原因 | 日本：大陆政策+明治维新 | 国际：列强纵容+势力均衡 | 中国：洋务运动+政治腐败 |
|-------------|---------|----------------------|---------------------|-------------------|
| 战争经过 | 丰岛海战→平壤战役→黄海海战 | 辽东战役→威海卫战役 | (马关条约) |
| 失败原因 | 根本原因：制度落后 | 直接原因：军事失误 | 深层原因：综合国力差距 |
| 历史影响 | 对中国：半殖民地化加深+民族觉醒 | 对日本：获得巨额赔款+加速扩张 | 对世界：列强瓜分中国+远东格局改变 |

这是一个复杂的思维导图表格。`;

  const testContent3 = `没有表格的普通文本内容，应该正常显示。

这里有一些**粗体**文字和*斜体*文字。

还有一些代码：\`console.log('hello')\`

这应该都能正常显示。`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div className="bg-white rounded-xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
            新表格渲染组件测试
          </h1>
          <p className="text-gray-600 text-center mb-8">
            测试新的TableRenderer组件是否能正确渲染Markdown表格
          </p>
        </div>

        {/* 测试1：基本表格 */}
        <div className="bg-white rounded-xl shadow-xl p-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-4">
            测试1：基本表格渲染
          </h2>
          <TableRenderer content={testContent1} />
        </div>

        {/* 测试2：复杂表格 */}
        <div className="bg-white rounded-xl shadow-xl p-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-4">
            测试2：复杂思维导图表格
          </h2>
          <TableRenderer content={testContent2} />
        </div>

        {/* 测试3：无表格内容 */}
        <div className="bg-white rounded-xl shadow-xl p-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-4">
            测试3：无表格的普通内容
          </h2>
          <TableRenderer content={testContent3} />
        </div>

        {/* 功能说明 */}
        <div className="bg-white rounded-xl shadow-xl p-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-4">
            新组件特性
          </h2>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-3 mt-2"></span>
              <span>使用专门的解析函数处理Markdown表格语法</span>
            </li>
            <li className="flex items-start">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-3 mt-2"></span>
              <span>支持表格前后的文本内容</span>
            </li>
            <li className="flex items-start">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-3 mt-2"></span>
              <span>自动处理换行符（&lt;br&gt;标签）</span>
            </li>
            <li className="flex items-start">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-3 mt-2"></span>
              <span>优雅的表格样式和悬停效果</span>
            </li>
            <li className="flex items-start">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-3 mt-2"></span>
              <span>响应式设计，支持移动端</span>
            </li>
            <li className="flex items-start">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-3 mt-2"></span>
              <span>如果没有表格，正常显示原始内容</span>
            </li>
          </ul>
        </div>

      </div>
    </div>
  );
};

export default TestTableFixNew;