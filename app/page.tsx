'use client'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { ArrowRight, BookOpen, MessageSquare, NotebookPen } from 'lucide-react'

const QuickStart = dynamic(() => import('./components/QuickStart'))
const CurrentLearningCard = dynamic(() => import('./components/Dashboard/CurrentLearningCard'), { ssr: false })

const CORE_ENTRIES = [
  {
    title: '系统学习',
    desc: '围绕目标知识点，进入诊断-讲解-验证闭环。',
    href: '/learning-setup',
    icon: BookOpen,
  },
  {
    title: 'AI 对话',
    desc: '针对当前疑问，快速和 AI 私教深聊。',
    href: '/unified-chat',
    icon: MessageSquare,
  },
  {
    title: '学习档案',
    desc: '复盘学习过程、错题与笔记，持续优化方法。',
    href: '/learning-history',
    icon: NotebookPen,
  },
]

export default function Home() {
  return (
    <div className="zen-page space-y-8 md:space-y-10">
      <section className="zen-panel px-6 py-10 md:px-10 md:py-12 text-center">
        <span className="zen-chip">专注于学习本身</span>
        <h1 className="mt-5 text-3xl md:text-5xl font-semibold tracking-tight text-slate-900">
          Incredible OS
        </h1>
        <p className="mt-4 text-slate-600 max-w-2xl mx-auto leading-relaxed">
          把诊断、学习、复盘集中在一个入口，减少切换与干扰，让每次学习都直达结果。
        </p>
      </section>

      <CurrentLearningCard />

      <QuickStart />

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {CORE_ENTRIES.map((entry) => (
          <Link key={entry.title} href={entry.href} className="zen-link-card p-5 md:p-6">
            <div className="flex items-start justify-between">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 text-white flex items-center justify-center shadow-sm">
                <entry.icon className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </div>
            <h2 className="mt-5 text-lg font-semibold text-slate-900">{entry.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{entry.desc}</p>
          </Link>
        ))}
      </section>
    </div>
  )
}
