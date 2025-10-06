'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

const customComponents = {
  h1: ({node, ...props}: any) => <h1 className="text-3xl font-bold mt-8 mb-6 text-blue-900 leading-tight" {...props} />,
  h2: ({node, ...props}: any) => <h2 className="text-2xl font-bold mt-6 mb-4 text-blue-800 leading-tight" {...props} />,
  h3: ({node, ...props}: any) => <h3 className="text-xl font-semibold mt-5 mb-3 text-blue-700 leading-tight" {...props} />,
  p: ({node, ...props}: any) => <p className="mb-4 text-blue-900 leading-relaxed text-lg" {...props} />,
  strong: ({node, ...props}: any) => <strong className="font-bold text-indigo-700" {...props} />,
  ul: ({node, ...props}: any) => <ul className="list-disc pl-6 mb-6 space-y-2" {...props} />,
  ol: ({node, ...props}: any) => <ol className="list-decimal pl-6 mb-6 space-y-2" {...props} />,
  li: ({node, ...props}: any) => <li className="text-blue-900 leading-relaxed text-lg" {...props} />,
  blockquote: ({node, ...props}: any) => <blockquote className="border-l-4 border-blue-400 pl-6 italic text-blue-800 bg-blue-50 py-4 rounded-r-lg my-6 shadow-sm" {...props} />,
  code: ({node, inline, ...props}: any) => 
    inline 
      ? <code className="bg-blue-100 rounded px-2 py-1 font-mono text-sm text-indigo-700" {...props} />
      : <code className="block bg-blue-50 rounded-lg p-4 font-mono text-sm overflow-x-auto text-blue-900 border border-blue-200" {...props} />,
  pre: ({node, ...props}: any) => <pre className="bg-blue-50 rounded-lg p-4 overflow-x-auto mb-6 border border-blue-200" {...props} />,
  table: ({node, ...props}: any) => (
    <div className="overflow-x-auto my-4">
      <table className="w-full border-collapse border border-gray-300" {...props} />
    </div>
  ),
  thead: ({node, ...props}: any) => <thead className="bg-gray-50" {...props} />,
  tbody: ({node, ...props}: any) => <tbody {...props} />,
  th: ({node, ...props}: any) => (
    <th className="px-3 py-2 text-left text-sm font-semibold text-gray-900 border border-gray-300 bg-gray-50" {...props} />
  ),
  td: ({node, ...props}: any) => (
    <td className="px-3 py-2 text-sm text-gray-900 border border-gray-300 align-top" {...props} />
  ),
  tr: ({node, ...props}: any) => <tr {...props} />,
};

const tableContent = `
# 行动卡表格测试

| 项目 | 具体内容 | 时间安排 | 预期突破 |
|------|----------|----------|----------|
| 目标 | 熟练掌握脑功能应用分析能力 | 2周内完成 | 能够快速准确解决各类脑功能问题 |
| 执行步骤 | ①每日分析2个临床病例<br>②绘制3个功能网络图<br>③完成跨学科应用联想练习 | 每天30分钟 | 建立牢固的神经功能分析框架 |
| 突破点 | 重点攻克"症状-脑区"快速匹配能力 | 第1周集中训练 | 形成条件反射式的功能定位思维 |

## 测试不同的表格样式

### 当前样式效果
上面的表格使用了当前的样式配置。

### 期望的样式效果
根据您的图片，表格应该更加紧凑，具有清晰的边框和适当的间距。
`;

export default function TestTableRendering() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-xl p-8">
          <ReactMarkdown
            remarkPlugins={[remarkMath]}
            rehypePlugins={[rehypeKatex]}
            components={customComponents}
          >
            {tableContent}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}