'use client'
import { useEffect } from 'react'
import KnowledgeBase from '../components/KnowledgeBase'

export default function KnowledgeBasePage() {
  useEffect(() => {
    document.body.classList.add('bg-learn')
    return () => document.body.classList.remove('bg-learn')
  }, [])
  return (
    <main className="max-w-6xl mx-auto px-4 py-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">知识库管理</h1>
        <p className="text-sm text-slate-600">上传资料并管理是否用于AI对话。</p>
      </div>
      <KnowledgeBase />
    </main>
  )
}
