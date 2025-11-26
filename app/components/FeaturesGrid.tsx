'use client'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function FeaturesGrid() {
  const features = [
    { title: '学习流程', desc: '讲解/确认/测验/结果/复盘闭环', href: '/learning-setup', cta: '去配置' },
    { title: '知识库管理', desc: '上传资料，控制是否参与对话', href: '/knowledge-base', cta: '管理资料' },
    { title: '统一会话', desc: '学习与普通会话集中管理', href: '/conversations', cta: '查看对话' },
    { title: '学习历史', desc: '记录所有会话与成绩分析', href: '/learning-history', cta: '复盘记录' },
  ]
  return (
    <section className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <h2 className="text-2xl font-bold dark:text-white">功能导览</h2>
        <div className="text-xs text-slate-500 dark:text-slate-400">学习、知识库、会话、历史，四个入口一站式串起来</div>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((f, idx)=> (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ type: 'spring', stiffness: 180, damping: 20, delay: idx * 0.08 }}
            whileHover={{ y: -10, scale: 1.04 }}
            whileTap={{ scale: 0.98 }}
            className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow p-6 hover:shadow-md transition-shadow"
          >
            <Link href={f.href} aria-label={`前往${f.title}`}>
              <h3 className="text-lg font-semibold dark:text-white">{f.title}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{f.desc}</p>
              <div className="mt-3 inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400">
                <span>{f.cta}</span>
                <span aria-hidden="true">→</span>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
