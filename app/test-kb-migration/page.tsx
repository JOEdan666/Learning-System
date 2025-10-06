'use client'
import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'

export default function TestKBMigration() {
  const [hasLocalData, setHasLocalData] = useState(false)
  const [localDataCount, setLocalDataCount] = useState(0)

  useEffect(() => {
    checkLocalData()
  }, [])

  const checkLocalData = () => {
    try {
      const localData = localStorage.getItem('kb_items_v2')
      if (localData) {
        const parsed = JSON.parse(localData)
        if (Array.isArray(parsed)) {
          setHasLocalData(true)
          setLocalDataCount(parsed.length)
        }
      }
    } catch (error) {
      console.error('检查本地数据失败:', error)
    }
  }

  const createTestData = () => {
    const testData = [
      {
        id: 'test_1',
        name: '测试文档1.txt',
        type: 'text/plain',
        size: 1024,
        lastModified: Date.now(),
        text: '这是测试文档1的内容',
        createdAt: Date.now(),
        include: true
      },
      {
        id: 'test_2',
        name: '测试文档2.md',
        type: 'text/markdown',
        size: 2048,
        lastModified: Date.now(),
        text: '# 测试文档2\n\n这是一个markdown文档',
        createdAt: Date.now(),
        include: true
      },
      {
        id: 'test_3',
        name: '测试PDF.pdf',
        type: 'application/pdf',
        size: 5120,
        lastModified: Date.now(),
        text: 'PDF文档的文本内容',
        notes: 'PDF解析完成',
        createdAt: Date.now(),
        include: false
      }
    ]

    localStorage.setItem('kb_items_v2', JSON.stringify(testData))
    toast.success('已创建测试数据')
    checkLocalData()
  }

  const clearLocalData = () => {
    localStorage.removeItem('kb_items_v2')
    localStorage.removeItem('kb_items_backup_v2')
    toast.success('已清除本地数据')
    checkLocalData()
  }

  const clearDatabase = async () => {
    try {
      const response = await fetch('/api/knowledge-base', {
        method: 'DELETE'
      })
      const result = await response.json()
      if (result.success) {
        toast.success('已清除数据库数据')
      } else {
        toast.error('清除数据库失败: ' + result.error)
      }
    } catch (error) {
      console.error('清除数据库失败:', error)
      toast.error('清除数据库失败')
    }
  }

  const testMigration = () => {
    // 跳转到主页面测试迁移
    window.location.href = '/'
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">知识库数据迁移测试</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">本地数据状态</h2>
          <div className="space-y-2">
            <p>本地数据存在: <span className={hasLocalData ? 'text-green-600' : 'text-red-600'}>{hasLocalData ? '是' : '否'}</span></p>
            <p>本地数据数量: <span className="font-mono">{localDataCount}</span></p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">测试操作</h2>
          <div className="space-y-4">
            <div className="flex gap-4">
              <button
                onClick={createTestData}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                创建测试数据
              </button>
              <button
                onClick={clearLocalData}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                清除本地数据
              </button>
              <button
                onClick={clearDatabase}
                className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
              >
                清除数据库
              </button>
            </div>
            <div>
              <button
                onClick={testMigration}
                className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 font-semibold"
              >
                测试迁移功能（跳转到主页面）
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">测试步骤</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>点击"创建测试数据"按钮，在localStorage中创建测试数据</li>
            <li>点击"测试迁移功能"按钮，跳转到主页面</li>
            <li>观察知识库组件是否显示"正在迁移本地数据..."提示</li>
            <li>检查是否显示迁移成功的toast消息</li>
            <li>验证知识库中是否显示了迁移的文件</li>
            <li>测试文件的增删改查功能</li>
          </ol>
        </div>
      </div>
    </div>
  )
}