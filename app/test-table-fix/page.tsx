'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

// 当前的表格样式组件
const currentComponents = {
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
  // 当前表格样式
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

// 改进的表格样式 - 简洁整洁外观
  const improvedComponents = {
    table: ({node, ...props}: any) => (
      <div className="overflow-x-auto my-6 bg-white rounded-lg border border-gray-200 shadow-sm">
        <table className="w-full border-collapse" {...props} />
      </div>
    ),
    thead: ({node, ...props}: any) => (
      <thead className="bg-gray-100 border-b-2 border-gray-200" {...props} />
    ),
    tbody: ({node, ...props}: any) => <tbody className="bg-white" {...props} />,
    th: ({node, ...props}: any) => (
      <th className="px-4 py-3 text-left text-sm font-bold text-gray-800 border-r border-gray-200 last:border-r-0" {...props} />
    ),
    td: ({node, ...props}: any) => (
      <td className="px-4 py-3 text-sm text-gray-700 border-r border-gray-200 last:border-r-0 border-b border-gray-100 align-top leading-6" {...props} />
    ),
    tr: ({node, ...props}: any) => <tr className="even:bg-gray-50 hover:bg-blue-50 transition-colors duration-150" {...props} />,
    h1: ({node, ...props}: any) => <h1 className="text-2xl font-bold mb-4 text-blue-900" {...props} />,
    h2: ({node, ...props}: any) => <h2 className="text-xl font-semibold mb-3 text-blue-800" {...props} />,
    h3: ({node, ...props}: any) => <h3 className="text-lg font-medium mb-2 text-blue-700" {...props} />,
    p: ({node, ...props}: any) => <p className="mb-3 text-gray-800 leading-relaxed" {...props} />,
    ul: ({node, ...props}: any) => <ul className="list-disc pl-6 mb-4 space-y-1" {...props} />,
    li: ({node, ...props}: any) => <li className="text-gray-800" {...props} />,
  };

const testContent = `# 戊戌变法知识结构

## 树状结构内容测试

戊戌变法
├── 背景（为什么变）
│   ├── 外因：甲午战败+瓜分狂潮
│   └── 内因：洋务运动局限+统治危机
├── 经过（怎么变）
│   ├── 思想准备：维新宣传
│   ├── 高潮：百日维新
│   └── 结局：戊戌政变
├── 内容（变什么）
│   ├── 政治：裁撤冗员
│   ├── 经济：设立工商局
│   ├── 文教：废八股、办学堂
│   └── 军事：训练新军
└── 影响（变的结果）
    ├── 直接：改革失败
    ├── 间接：启蒙作用
    └── 长远：为辛亥革命铺路

## 表格格式测试

| 方面 | 具体内容 | 意义 |
|------|----------|------|
| **背景** | 甲午战败、瓜分狂潮 | 民族危机加深 |
| **经过** | 百日维新、戊戌政变 | 改革尝试与失败 |
| **内容** | 政治、经济、文教、军事改革 | 全面现代化尝试 |
| **影响** | 启蒙作用、为辛亥革命铺路 | 推动历史进程 |

## 复杂表格测试

| 改革领域 | 具体措施 | 实施情况 | 历史意义 |
|----------|----------|----------|----------|
| **政治改革** | • 裁撤冗员<br>• 精简机构<br>• 改革官制 | 遭到守旧派强烈反对 | 触动了封建官僚的既得利益 |
| **经济改革** | • 设立工商局<br>• 保护民族工业<br>• 改革财政 | 部分措施得到实施 | 有利于民族资本主义发展 |
| **文教改革** | • 废除八股<br>• 兴办学堂<br>• 提倡西学 | 影响深远 | 推动了思想启蒙运动 |
| **军事改革** | • 训练新军<br>• 改革军制<br>• 加强国防 | 实施有限 | 为后来军事现代化奠定基础 |
`;

export default function TestTableFix() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* 当前样式效果 */}
        <div className="bg-white rounded-xl shadow-xl p-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-4">当前表格样式效果</h2>
          <ReactMarkdown
            remarkPlugins={[remarkMath]}
            rehypePlugins={[rehypeKatex]}
            components={currentComponents}
          >
            {testContent}
          </ReactMarkdown>
        </div>

        {/* 改进后样式效果 */}
        <div className="bg-white rounded-xl shadow-xl p-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-4">改进后表格样式效果</h2>
          <ReactMarkdown
            remarkPlugins={[remarkMath]}
            rehypePlugins={[rehypeKatex]}
            components={improvedComponents}
          >
            {testContent}
          </ReactMarkdown>
        </div>

      </div>
    </div>
  );
}