'use client'

import WrongQuestionPanel from '../components/WrongQuestionPanel'

export default function WrongBookPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-10 space-y-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">错题本</h1>
              <p className="text-lg text-slate-600 mt-2">收集错题，复习提醒，追踪掌握度。左侧录入，右侧大列表填满整页。</p>
            </div>
          </div>
        </div>
        <WrongQuestionPanel />
      </div>
    </div>
  )
}
