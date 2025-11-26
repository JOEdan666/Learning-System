'use client'
import Link from 'next/link'
import { motion } from 'framer-motion'

const demos = [
  { title: '快速体验 AI 对话', desc: '无需配置，直接查看示例问答与表格输出', href: '/conversations' },
  { title: '示例测验套题', desc: '3 分钟生成 10 题并自动收集错题', href: '/learning-setup' },
  { title: '知识库演示', desc: '上传一份 PDF，控制是否参与对话', href: '/knowledge-base' },
]

export default function QuickDemo() {
  return (
    <section className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <h2 className="text-xl font-semibold dark:text-white">快速体验</h2>
        <div className="text-xs text-slate-500 dark:text-slate-400">无需配置，直接走一遍关键流程</div>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        {demos.map((demo, idx) => (
          <motion.div
            key={demo.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.35, delay: idx * 0.05 }}
            className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow p-4 flex flex-col gap-2"
          >
            <div className="text-sm font-semibold text-slate-900 dark:text-white">{demo.title}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 flex-1">{demo.desc}</div>
            <Link
              href={demo.href}
              className="inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              立即前往 <span aria-hidden="true">→</span>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
