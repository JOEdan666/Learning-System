'use client'

import { useState, useEffect } from 'react'

export default function TestDeepSeekPage() {
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [envStatus, setEnvStatus] = useState({
    aiProvider: '检查中...',
    apiKey: '检查中...',
    baseUrl: '检查中...',
    model: '检查中...'
  })
  const [serverEnvStatus, setServerEnvStatus] = useState<any>(null)

  useEffect(() => {
    // 在客户端获取环境变量状态
    setEnvStatus({
      aiProvider: process.env.NEXT_PUBLIC_AI_PROVIDER || '未设置',
      apiKey: process.env.OPENAI_API_KEY ? '已设置' : '未设置',
      baseUrl: process.env.OPENAI_BASE_URL || '未设置',
      model: process.env.OPENAI_MODEL || '未设置'
    })
  }, [])

  const checkServerEnv = async () => {
    try {
      const res = await fetch('/api/check-env')
      const data = await res.json()
      setServerEnvStatus(data)
    } catch (error) {
      console.error('获取服务器环境变量失败:', error)
    }
  }

  const testDeepSeek = async () => {
    setLoading(true)
    setError('')
    setResponse('')

    try {
      const res = await fetch('/api/openai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: '请简单介绍一下你自己，限制在50字以内',
        }),
      })

      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || '请求失败')
      }

      setResponse(data.content)
    } catch (err: any) {
      setError(err.message || '未知错误')
      console.error('测试 DeepSeek 失败:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">DeepSeek API 测试</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">客户端环境变量状态</h2>
          <div className="space-y-2 text-sm">
            <p><strong>AI Provider:</strong> {envStatus.aiProvider}</p>
            <p><strong>API Key:</strong> {envStatus.apiKey}</p>
            <p><strong>Base URL:</strong> {envStatus.baseUrl}</p>
            <p><strong>Model:</strong> {envStatus.model}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">服务器端环境变量状态</h2>
            <button
              onClick={checkServerEnv}
              className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600"
            >
              检查服务器环境
            </button>
          </div>
          {serverEnvStatus ? (
            <div className="space-y-2 text-sm">
              <p><strong>AI Provider:</strong> {serverEnvStatus.aiProvider}</p>
              <p><strong>API Key:</strong> {serverEnvStatus.apiKey}</p>
              <p><strong>Base URL:</strong> {serverEnvStatus.baseUrl}</p>
              <p><strong>Model:</strong> {serverEnvStatus.model}</p>
            </div>
          ) : (
            <p className="text-sm text-gray-500">点击按钮检查服务器环境变量</p>
          )}
        </div>

        <button
          onClick={testDeepSeek}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          {loading ? '测试中...' : '测试 DeepSeek API'}
        </button>

        {error && (
          <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
            <h3 className="font-semibold mb-2">错误:</h3>
            <p>{error}</p>
          </div>
        )}

        {response && (
          <div className="mt-4 p-4 bg-green-100 text-green-700 rounded">
            <h3 className="font-semibold mb-2">响应:</h3>
            <p>{response}</p>
          </div>
        )}
      </div>
    </div>
  )
}