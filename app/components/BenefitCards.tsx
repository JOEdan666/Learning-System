'use client'
import { motion } from 'framer-motion'

export default function BenefitCards() {
  const items = [
    { title: '系统讲解', desc: '按地区考纲与年级生成结构化讲解，支持导图/表格/公式', stat: '覆盖 20+ 版本教材', color: 'from-blue-500 to-indigo-500' },
    { title: '高效测验', desc: '题目自动生成与错误定位，一键加入错题集', stat: '3 分钟生成一套', color: 'from-green-500 to-emerald-500' },
    { title: '间隔复习', desc: '自动安排复习计划，提醒待复习错题，巩固记忆', stat: '艾宾浩斯曲线规划', color: 'from-orange-500 to-amber-500' },
  ]
  return (
    <section className="max-w-6xl mx-auto px-4 py-10">
      <div className="grid md:grid-cols-3 gap-6">
        {items.map((it, idx) => (
          <motion.div
            key={it.title}
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ type: 'spring', stiffness: 180, damping: 20, delay: idx * 0.08 }}
            whileHover={{ y: -10, scale: 1.04 }}
            whileTap={{ scale: 0.98 }}
            className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow p-6"
          >
            <div aria-hidden="true" className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-white bg-gradient-to-r ${it.color} mb-3`}>★</div>
            <h3 className="text-lg font-semibold dark:text-white">{it.title}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">{it.desc}</p>
            <div className="mt-3 inline-flex px-3 py-1 rounded-full bg-slate-50 dark:bg-slate-800 text-xs text-slate-500 dark:text-slate-300 border border-slate-200 dark:border-slate-700">{it.stat}</div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
