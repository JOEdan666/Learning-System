'use client'

const items = [
  { label: '日均学习', value: '3.2h', desc: '单人平均高效学习时长' },
  { label: '题目生成', value: '3分钟', desc: '一套测验自动生成' },
  { label: '覆盖教材', value: '20+版本', desc: '地区/版本持续更新' },
  { label: '复习提醒', value: '自动', desc: '按遗忘曲线安排' },
]

export default function TrustStrip() {
  return (
    <section className="max-w-6xl mx-auto px-4 pb-4 pt-2">
      <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
        {items.map((it) => (
          <div key={it.label} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm px-4 py-3">
            <div className="text-xs text-slate-500 dark:text-slate-400">{it.label}</div>
            <div className="text-lg font-semibold text-slate-900 dark:text-white">{it.value}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">{it.desc}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
