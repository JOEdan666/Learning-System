'use client'

import React, { useState } from 'react';
import { Card, Button, Typography, Space, Spin } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, BookOutlined } from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import TableRenderer, { parseMarkdownTable } from '../TableRenderer';

// 检测是否为ASCII艺术/树状图
const isAsciiArt = (text: string): boolean => {
  const asciiArtChars = /[╱╲├│└─┌┐┘┬┴┼═║╔╗╚╝╠╣╦╩╬▲▼◆●○■□★☆→←↑↓↔⇒⇐⇑⇓]/;
  const hasMultipleSpaces = /\s{2,}/.test(text);
  const hasBoxDrawing = /[┌┐└┘├┤┬┴┼│─]/.test(text);
  return asciiArtChars.test(text) || (hasMultipleSpaces && hasBoxDrawing);
};

const { Title, Paragraph } = Typography;

interface ConfirmStepProps {
  content: string;
  isLoading?: boolean;
  onConfirmUnderstanding: () => void;
  onContinueExplanation: () => void;
  showConfirmation?: boolean;
}

const ConfirmStep: React.FC<ConfirmStepProps> = ({
  content,
  isLoading = false,
  onConfirmUnderstanding,
  onContinueExplanation,
  showConfirmation = false
}) => {
  const [userChoice, setUserChoice] = useState<string>('');

  const handleConfirm = () => {
    setUserChoice('confirmed');
    onConfirmUnderstanding();
  };

  const handleContinue = () => {
    setUserChoice('continue');
    onContinueExplanation();
  };

  // 自定义Markdown组件（支持ASCII艺术和公式渲染）
  const customComponents = {
    h1: ({ children }: any) => (
      <h1 className="text-2xl font-bold text-gray-900 mb-4 border-b-2 border-blue-500 pb-2">
        {children}
      </h1>
    ),
    h2: ({ children }: any) => (
      <h2 className="text-xl font-semibold text-gray-800 mb-3 mt-6">
        {children}
      </h2>
    ),
    h3: ({ children }: any) => (
      <h3 className="text-lg font-medium text-gray-700 mb-2 mt-4">
        {children}
      </h3>
    ),
    p: ({ children }: any) => {
      // 检测段落内容是否为ASCII艺术
      const textContent = typeof children === 'string' ? children :
        (Array.isArray(children) ? children.map((c: any) => typeof c === 'string' ? c : '').join('') : '');

      if (isAsciiArt(textContent)) {
        return (
          <pre className="font-mono text-sm bg-blue-50 p-4 rounded-lg overflow-x-auto my-4 text-gray-700 leading-relaxed whitespace-pre border border-blue-200">
            {children}
          </pre>
        );
      }
      return (
        <p className="text-gray-700 mb-3 leading-relaxed">
          {children}
        </p>
      );
    },
    ul: ({ children }: any) => (
      <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1 ml-4">
        {children}
      </ul>
    ),
    ol: ({ children }: any) => (
      <ol className="list-decimal list-inside text-gray-700 mb-4 space-y-1 ml-4">
        {children}
      </ol>
    ),
    li: ({ children }: any) => (
      <li className="mb-1">
        {children}
      </li>
    ),
    strong: ({ children }: any) => (
      <strong className="font-semibold text-blue-600">
        {children}
      </strong>
    ),
    // 代码块 - 支持ASCII艺术
    pre: ({ children }: any) => (
      <pre className="font-mono text-sm bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-4 whitespace-pre">
        {children}
      </pre>
    ),
    code: ({ inline, className, children }: any) => {
      const codeContent = String(children).replace(/\n$/, '');
      const match = /language-(\w+)/.exec(className || '');
      const lang = match?.[1] || '';

      if (inline) {
        return (
          <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-gray-800">
            {children}
          </code>
        );
      }

      // 检测是否为ASCII艺术/知识结构图
      if (isAsciiArt(codeContent) || lang === 'diagram' || lang === 'ascii' || lang === 'tree') {
        return (
          <div className="my-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
            <div className="text-xs text-blue-600 font-medium mb-3 flex items-center gap-1">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              知识结构图
            </div>
            <pre className="font-mono text-sm text-gray-800 whitespace-pre overflow-x-auto leading-relaxed">
              {children}
            </pre>
          </div>
        );
      }

      return (
        <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-gray-800">
          {children}
        </code>
      );
    },
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50 text-gray-700 mb-4 italic">
        {children}
      </blockquote>
    ),
    table: ({ children }: any) => (
      <div className="overflow-x-auto my-4 rounded-lg shadow-md border border-gray-200">
        <table className="w-full border-collapse bg-white">{children}</table>
      </div>
    ),
    thead: ({ children }: any) => (
      <thead className="bg-blue-100">{children}</thead>
    ),
    tbody: ({ children }: any) => <tbody>{children}</tbody>,
    th: ({ children }: any) => (
      <th className="px-4 py-3 text-center text-sm font-bold text-gray-800 border border-gray-300">
        {children}
      </th>
    ),
    td: ({ children }: any) => (
      <td className="px-4 py-3 text-center text-sm text-gray-700 border border-gray-300 whitespace-pre-wrap">
        {children}
      </td>
    ),
    tr: ({ children }: any) => (
      <tr className="bg-white even:bg-gray-50 hover:bg-blue-50 transition-colors duration-200">
        {children}
      </tr>
    ),
  };

  // 混合渲染函数：检测表格并选择合适的渲染方式
  const renderContentWithTables = (content: string) => {
    const hasTable = parseMarkdownTable(content) !== null;

    if (hasTable) {
      const tableRegex = /^\s*\|(.+)\|\s*\n\s*\|[-\s|:]+\|\s*\n((?:\s*\|.+\|\s*\n?)*)/gm;
      let lastIndex = 0;
      const parts = [];
      let match;

      tableRegex.lastIndex = 0;

      while ((match = tableRegex.exec(content)) !== null) {
        if (match.index > lastIndex) {
          const beforeTable = content.substring(lastIndex, match.index).trim();
          if (beforeTable) {
            parts.push({ type: 'markdown', content: beforeTable });
          }
        }

        parts.push({ type: 'table', content: match[0] });
        lastIndex = match.index + match[0].length;
      }

      if (lastIndex < content.length) {
        const afterTable = content.substring(lastIndex).trim();
        if (afterTable) {
          parts.push({ type: 'markdown', content: afterTable });
        }
      }

      return (
        <div>
          {parts.map((part, index) => {
            if (part.type === 'table') {
              return <TableRenderer key={index} content={part.content} />;
            } else {
              return (
                <ReactMarkdown
                  key={index}
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                  components={customComponents}
                >
                  {part.content}
                </ReactMarkdown>
              );
            }
          })}
        </div>
      );
    } else {
      return (
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeKatex]}
          components={customComponents}
        >
          {content}
        </ReactMarkdown>
      );
    }
  };

  return (
    <Card
      style={{ maxWidth: 900, margin: '0 auto' }}
      title={
        <Space>
          <BookOutlined style={{ fontSize: 24, color: '#165DFF' }} />
          <Title level={3} style={{ margin: 0 }}>知识理解确认</Title>
        </Space>
      }
    >
      {/* 知识内容 */}
      <Card
        type="inner"
        style={{ marginBottom: showConfirmation ? 24 : 0, backgroundColor: '#fafafa' }}
      >
        <div className="prose prose-lg max-w-none">
          {renderContentWithTables(content)}
        </div>
      </Card>

      {/* 确认按钮区域 */}
      {showConfirmation && !isLoading && (
        <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 24 }}>
          <Paragraph style={{ textAlign: 'center', fontSize: 16, marginBottom: 24 }}>
            请确认你是否已经理解了以上知识点和解题方法？
          </Paragraph>

          <Space direction="vertical" size="middle" style={{ width: '100%', display: 'flex', alignItems: 'center' }}>
            <Space size="middle" wrap>
              <Button
                type="primary"
                size="large"
                icon={<CheckCircleOutlined />}
                onClick={handleConfirm}
                disabled={userChoice !== ''}
                style={{
                  minWidth: 200,
                  backgroundColor: userChoice === 'confirmed' ? '#52c41a' : undefined,
                  opacity: userChoice !== '' && userChoice !== 'confirmed' ? 0.5 : 1
                }}
              >
                确认理解，进行测验
              </Button>

              <Button
                size="large"
                icon={<CloseCircleOutlined />}
                onClick={handleContinue}
                disabled={userChoice !== ''}
                danger={userChoice === '' || userChoice === 'continue'}
                style={{
                  minWidth: 200,
                  opacity: userChoice !== '' && userChoice !== 'continue' ? 0.5 : 1
                }}
              >
                需要继续讲解
              </Button>
            </Space>
          </Space>
        </div>
      )}

      {/* 加载状态 */}
      {isLoading && (
        <div style={{ textAlign: 'center', padding: '32px 0' }}>
          <Spin size="large" tip="正在处理..." />
        </div>
      )}
    </Card>
  );
};

export default ConfirmStep;
