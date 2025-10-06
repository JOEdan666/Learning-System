'use client';

import React, { useState } from 'react';

export default function TestAPIPage() {
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const testAPI = async () => {
    setLoading(true);
    setError('');
    setResponse('');

    try {
      const res = await fetch('/api/openai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: '请简单解释一下垂直平分线的概念',
          history: []
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setResponse(data.content || '没有收到内容');
    } catch (err: any) {
      setError(err.message || '未知错误');
      console.error('API测试错误:', err);
    } finally {
      setLoading(false);
    }
  };

  const testStreamAPI = async () => {
    setLoading(true);
    setError('');
    setResponse('');

    try {
      const res = await fetch('/api/openai-chat?stream=true', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: '请简单解释一下垂直平分线的概念',
          history: []
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `HTTP ${res.status}`);
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let content = '';

      if (reader) {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          content += chunk;
          setResponse(content);
        }
      }
    } catch (err: any) {
      setError(err.message || '未知错误');
      console.error('流式API测试错误:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">API 功能测试</h1>
        
        <div className="space-y-6">
          {/* 测试按钮 */}
          <div className="flex gap-4">
            <button
              onClick={testAPI}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded transition-colors"
            >
              {loading ? '测试中...' : '测试普通API'}
            </button>
            
            <button
              onClick={testStreamAPI}
              disabled={loading}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded transition-colors"
            >
              {loading ? '测试中...' : '测试流式API'}
            </button>
          </div>

          {/* 错误显示 */}
          {error && (
            <div className="bg-red-900 border border-red-600 rounded-lg p-4">
              <h3 className="text-red-400 font-bold mb-2">错误信息：</h3>
              <p className="text-red-300">{error}</p>
            </div>
          )}

          {/* 响应显示 */}
          {response && (
            <div className="bg-gray-800 border border-gray-600 rounded-lg p-6">
              <h3 className="text-white font-bold mb-4">API 响应：</h3>
              <div className="text-gray-300 whitespace-pre-wrap">
                {response}
              </div>
            </div>
          )}

          {/* 加载状态 */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
              <span className="ml-4 text-white">正在测试API...</span>
            </div>
          )}

          {/* 说明信息 */}
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-6">
            <h3 className="text-white font-bold mb-4">测试说明：</h3>
            <ul className="text-gray-300 space-y-2">
              <li>• 普通API：一次性返回完整响应</li>
              <li>• 流式API：实时流式返回响应内容</li>
              <li>• 如果出现错误，请检查API密钥配置</li>
              <li>• 当前使用的是测试密钥，可能无法连接到真实的OpenAI服务</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}