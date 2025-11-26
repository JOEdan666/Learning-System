'use client'

import { useEffect, useRef, useState } from 'react'
import { listDueWrongQuestions, listWrongQuestions, updateFeedback, archiveWrongQuestion, restoreWrongQuestion } from '../utils/wrongQuestionStore'

export default function WrongQuestionNavBadge() {
  const [open, setOpen] = useState(false)
  const [due, setDue] = useState(() => listDueWrongQuestions())
  const [all, setAll] = useState(() => listWrongQuestions())
  const ref = useRef<HTMLDivElement | null>(null)

  const refresh = () => {
    setDue(listDueWrongQuestions())
    setAll(listWrongQuestions())
  }

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (open && ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'wrong_questions_v1') refresh()
    }
    document.addEventListener('click', onClick)
    window.addEventListener('storage', onStorage)
    return () => {
      document.removeEventListener('click', onClick)
      window.removeEventListener('storage', onStorage)
    }
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1 px-3 py-2 rounded-full bg-blue-100 text-blue-700 text-xs border border-blue-200 hover:bg-blue-200 dark:bg-blue-900/40 dark:text-blue-100 dark:border-blue-700"
      >
        <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" aria-hidden />
        错题本 {all.length}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg p-3 space-y-3 z-50">
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-200">
            <span>待复习 {due.length} 条</span>
            <span>总计 {all.length}</span>
          </div>
          {due.length === 0 ? (
            <div className="text-xs text-slate-500 dark:text-slate-300">暂无待复习错题</div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {due.slice(0, 6).map((q) => (
                <div key={q.id} className="p-2 rounded border border-blue-100 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
                  <div className="text-[11px] text-gray-500 dark:text-gray-400 mb-1">{q.subject}{q.source ? ` · ${q.source}` : ''}</div>
                  <div className="text-xs text-gray-800 dark:text-gray-100 line-clamp-2">{q.question}</div>
                  <div className="mt-2 flex gap-1 text-[11px]">
                    <button className="px-2 py-1 rounded bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-200" onClick={() => { updateFeedback(q.id, 'remember'); refresh(); }}>记得</button>
                    <button className="px-2 py-1 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200" onClick={() => { updateFeedback(q.id, 'fuzzy'); refresh(); }}>模糊</button>
                    <button className="px-2 py-1 rounded bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200" onClick={() => { updateFeedback(q.id, 'forgot'); refresh(); }}>忘记</button>
                  </div>
                </div>
              ))}
              {due.length > 6 && <div className="text-[11px] text-blue-700 dark:text-blue-200">还有 {due.length - 6} 条…</div>}
            </div>
          )}
          {all.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs text-slate-500 dark:text-slate-300">最近添加</div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {all.slice(0, 6).map((q) => (
                  <div key={q.id} className="p-2 rounded border border-slate-200 dark:border-slate-700">
                    <div className="text-[11px] text-gray-500 dark:text-gray-400 mb-1">{q.subject}{q.source ? ` · ${q.source}` : ''}</div>
                    <div className="text-xs text-gray-800 dark:text-gray-100 line-clamp-2">{q.question}</div>
                    <div className="mt-2 flex gap-1 text-[11px]">
                      {q.status === 'active' ? (
                        <button className="px-2 py-1 rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200" onClick={() => { archiveWrongQuestion(q.id); refresh(); }}>归档</button>
                      ) : (
                        <button className="px-2 py-1 rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200" onClick={() => { restoreWrongQuestion(q.id); refresh(); }}>恢复</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
