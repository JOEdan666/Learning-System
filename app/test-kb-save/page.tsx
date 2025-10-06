'use client'

import { useState } from 'react'
import { KnowledgeBaseService, type KBItem } from '../services/knowledgeBaseService'

export default function TestKBSave() {
  const [result, setResult] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  const testSaveWithSpecialChars = async () => {
    setIsLoading(true)
    setResult('开始测试...\n')
    
    const kbService = new KnowledgeBaseService()
    
    // 创建包含特殊字符的测试数据
    const testItems: KBItem[] = [
      {
        id: 'test_1',
        name: 'test_file.txt',
        type: 'text/plain',
        size: 100,
        lastModified: Date.now(),
        createdAt: Date.now(),
        text: 'This is a test with "quotes" and \n newlines and \t tabs',
        include: true
      },
      {
        id: 'test_2',
        name: 'test_json.json',
        type: 'application/json',
        size: 200,
        lastModified: Date.now(),
        createdAt: Date.now(),
        text: '{"key": "value with \\"escaped quotes\\"", "array": [1, 2, 3]}',
        include: true
      },
      {
        id: 'test_3',
        name: 'test_special.txt',
        type: 'text/plain',
        size: 150,
        lastModified: Date.now(),
        createdAt: Date.now(),
        text: 'Text with unicode: 中文测试 🚀 and backslashes: C:\\\\path\\\\to\\\\file',
        include: true
      }
    ]

    try {
      setResult(prev => prev + '准备发送数据...\n')
      setResult(prev => prev + `数据内容: ${JSON.stringify(testItems, null, 2)}\n\n`)
      
      const savedItems = await kbService.saveItems(testItems)
      setResult(prev => prev + `✅ 保存成功! 返回数据: ${JSON.stringify(savedItems, null, 2)}\n`)
    } catch (error) {
      setResult(prev => prev + `❌ 保存失败: ${error}\n`)
      console.error('保存失败:', error)
    }
    
    setIsLoading(false)
  }

  const testSaveWithLargeText = async () => {
    setIsLoading(true)
    setResult('测试大文本保存...\n')
    
    const kbService = new KnowledgeBaseService()
    
    // 创建包含大量文本的测试数据
    const largeText = 'Lorem ipsum '.repeat(1000) + '\n\n' + 
                     '这是中文测试内容 '.repeat(500) + '\n\n' +
                     'Special chars: "quotes", \'single quotes\', \\backslashes\\, /forward/slashes/, {braces}, [brackets], (parentheses)'
    
    const testItems: KBItem[] = [
      {
        id: 'large_test',
        name: 'large_file.txt',
        type: 'text/plain',
        size: largeText.length,
        lastModified: Date.now(),
        createdAt: Date.now(),
        text: largeText,
        include: true
      }
    ]

    try {
      setResult(prev => prev + `文本长度: ${largeText.length} 字符\n`)
      const savedItems = await kbService.saveItems(testItems)
      setResult(prev => prev + `✅ 大文本保存成功!\n`)
    } catch (error) {
      setResult(prev => prev + `❌ 大文本保存失败: ${error}\n`)
      console.error('大文本保存失败:', error)
    }
    
    setIsLoading(false)
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">知识库保存测试</h1>
      
      <div className="space-y-4 mb-6">
        <button
          onClick={testSaveWithSpecialChars}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isLoading ? '测试中...' : '测试特殊字符保存'}
        </button>
        
        <button
          onClick={testSaveWithLargeText}
          disabled={isLoading}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 ml-4"
        >
          {isLoading ? '测试中...' : '测试大文本保存'}
        </button>
      </div>
      
      <div className="bg-gray-100 p-4 rounded">
        <h2 className="text-lg font-semibold mb-2">测试结果:</h2>
        <pre className="whitespace-pre-wrap text-sm">{result}</pre>
      </div>
    </div>
  )
}