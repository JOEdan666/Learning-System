'use client'
import { useState } from 'react'
import { toast } from 'react-hot-toast'

export default function TestKBAPI() {
  const [testResults, setTestResults] = useState<string[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const clearResults = () => {
    setTestResults([])
  }

  const runAllTests = async () => {
    setIsRunning(true)
    clearResults()
    
    try {
      addResult('开始测试知识库API...')

      // 1. 测试创建数据 (POST)
      addResult('测试1: 创建知识库项目...')
      const testItems = [
        {
          id: 'test_item_1',
          name: '测试文档1.txt',
          type: 'text/plain',
          size: 1024,
          lastModified: Date.now(),
          text: '这是测试文档1的内容',
          createdAt: Date.now(),
          include: true
        },
        {
          id: 'test_item_2',
          name: '测试文档2.md',
          type: 'text/markdown',
          size: 2048,
          lastModified: Date.now(),
          text: '# 测试文档2\n\n这是markdown内容',
          createdAt: Date.now(),
          include: false
        }
      ]

      const createResponse = await fetch('/api/knowledge-base', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: testItems })
      })
      const createResult = await createResponse.json()
      
      if (createResult.success) {
        addResult('✅ 创建成功')
      } else {
        addResult(`❌ 创建失败: ${createResult.error}`)
        return
      }

      // 2. 测试读取数据 (GET)
      addResult('测试2: 读取知识库项目...')
      const getResponse = await fetch('/api/knowledge-base')
      const getResult = await getResponse.json()
      
      if (getResult.success && getResult.data.length === 2) {
        addResult(`✅ 读取成功，获取到 ${getResult.data.length} 个项目`)
      } else {
        addResult(`❌ 读取失败或数据不匹配: ${getResult.error || '数据数量不正确'}`)
        return
      }

      // 3. 测试更新数据 (PUT)
      addResult('测试3: 更新知识库项目...')
      const updateResponse = await fetch('/api/knowledge-base', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 'test_item_1',
          updates: { text: '更新后的内容', include: false }
        })
      })
      const updateResult = await updateResponse.json()
      
      if (updateResult.success) {
        addResult('✅ 更新成功')
      } else {
        addResult(`❌ 更新失败: ${updateResult.error}`)
        return
      }

      // 4. 验证更新结果
      addResult('测试4: 验证更新结果...')
      const verifyResponse = await fetch('/api/knowledge-base')
      const verifyResult = await verifyResponse.json()
      
      if (verifyResult.success) {
        const updatedItem = verifyResult.data.find((item: any) => item.id === 'test_item_1')
        if (updatedItem && updatedItem.text === '更新后的内容' && updatedItem.include === false) {
          addResult('✅ 更新验证成功')
        } else {
          addResult('❌ 更新验证失败，数据未正确更新')
          return
        }
      } else {
        addResult(`❌ 验证失败: ${verifyResult.error}`)
        return
      }

      // 5. 测试删除单个项目 (DELETE)
      addResult('测试5: 删除单个项目...')
      const deleteResponse = await fetch(`/api/knowledge-base?id=test_item_1`, {
        method: 'DELETE'
      })
      const deleteResult = await deleteResponse.json()
      
      if (deleteResult.success) {
        addResult('✅ 删除成功')
      } else {
        addResult(`❌ 删除失败: ${deleteResult.error}`)
        return
      }

      // 6. 验证删除结果
      addResult('测试6: 验证删除结果...')
      const verifyDeleteResponse = await fetch('/api/knowledge-base')
      const verifyDeleteResult = await verifyDeleteResponse.json()
      
      if (verifyDeleteResult.success && verifyDeleteResult.data.length === 1) {
        addResult('✅ 删除验证成功，剩余1个项目')
      } else {
        addResult(`❌ 删除验证失败，期望1个项目，实际${verifyDeleteResult.data?.length || 0}个`)
        return
      }

      // 7. 测试清空所有数据 (DELETE ALL)
      addResult('测试7: 清空所有数据...')
      const clearResponse = await fetch('/api/knowledge-base', {
        method: 'DELETE'
      })
      const clearResult = await clearResponse.json()
      
      if (clearResult.success) {
        addResult('✅ 清空成功')
      } else {
        addResult(`❌ 清空失败: ${clearResult.error}`)
        return
      }

      // 8. 验证清空结果
      addResult('测试8: 验证清空结果...')
      const verifyClearResponse = await fetch('/api/knowledge-base')
      const verifyClearResult = await verifyClearResponse.json()
      
      if (verifyClearResult.success && verifyClearResult.data.length === 0) {
        addResult('✅ 清空验证成功，数据库为空')
      } else {
        addResult(`❌ 清空验证失败，仍有${verifyClearResult.data?.length || 0}个项目`)
        return
      }

      addResult('🎉 所有测试通过！知识库API功能正常')
      toast.success('所有API测试通过！')

    } catch (error) {
      addResult(`❌ 测试过程中发生错误: ${error}`)
      toast.error('API测试失败')
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">知识库API测试</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex gap-4 mb-4">
            <button
              onClick={runAllTests}
              disabled={isRunning}
              className={`px-6 py-3 rounded-lg font-semibold ${
                isRunning 
                  ? 'bg-gray-400 text-white cursor-not-allowed' 
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              {isRunning ? '测试进行中...' : '运行所有测试'}
            </button>
            <button
              onClick={clearResults}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              清除结果
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">测试结果</h2>
          <div className="bg-gray-100 rounded p-4 h-96 overflow-y-auto">
            {testResults.length === 0 ? (
              <p className="text-gray-500">点击"运行所有测试"开始测试...</p>
            ) : (
              <div className="space-y-1">
                {testResults.map((result, index) => (
                  <div key={index} className="font-mono text-sm">
                    {result}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">测试说明</h2>
          <p className="text-gray-700 mb-4">
            此测试将验证知识库API的所有CRUD操作：
          </p>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>创建知识库项目 (POST)</li>
            <li>读取知识库项目 (GET)</li>
            <li>更新知识库项目 (PUT)</li>
            <li>验证更新结果</li>
            <li>删除单个项目 (DELETE)</li>
            <li>验证删除结果</li>
            <li>清空所有数据 (DELETE ALL)</li>
            <li>验证清空结果</li>
          </ol>
        </div>
      </div>
    </div>
  )
}