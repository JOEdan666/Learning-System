'use client'

import { useEffect, useState, useRef } from 'react'
import { applyFeedback, getDueEntries, ReviewEntry } from '../utils/reviewPlanner'

export default function ReviewNavBadge() {
  const [open, setOpen] = useState(false)
  const [entries, setEntries] = useState<ReviewEntry[]>([])
  const ref = useRef<HTMLDivElement | null>(null)

  const refresh = () => {
    setEntries(getDueEntries())
  }

  useEffect(() => {
    refresh()
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'review_entries_v1') refresh()
    }
    window.addEventListener('storage', onStorage)
    const onClick = (e: MouseEvent) => {
      if (open && ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('click', onClick)
    return () => {
      window.removeEventListener('storage', onStorage)
      document.removeEventListener('click', onClick)
    }
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1 px-3 py-2 rounded-full bg-amber-100 text-amber-700 text-xs border border-amber-200 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-200 dark:border-amber-700"
      >
        <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" aria-hidden />
        待复习 {entries.length}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-72 rounded-xl border border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-800 shadow-lg p-3 space-y-2 z-50">
          <div className="flex items-center justify-between text-xs text-amber-700 dark:text-amber-200">
            <span>待复习列表</span>
            <span>{entries.length} 条</span>
          </div>
          {entries.length === 0 ? (
            <div className="text-xs text-amber-700/80 dark:text-amber-200/80">暂无待复习内容</div>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {entries.slice(0, 6).map((item) => (
                <div key={item.id} className="p-2 rounded bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-700">
                  <div className="text-[11px] text-gray-500 dark:text-gray-400 mb-1">{item.subject}</div>
                  <div className="text-xs text-gray-800 dark:text-gray-100 line-clamp-2">{item.text}</div>
                  <div className="mt-2 flex gap-1 text-[11px]">
                    <button
                      type="button"
                      className="px-2 py-1 rounded bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-200"
                      onClick={() => { applyFeedback(item.id, 'remember'); refresh(); }}
                    >记得</button>
                    <button
                      type="button"
                      className="px-2 py-1 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200"
                      onClick={() => { applyFeedback(item.id, 'fuzzy'); refresh(); }}
                    >模糊</button>
                    <button
                      type="button"
                      className="px-2 py-1 rounded bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200"
                      onClick={() => { applyFeedback(item.id, 'forgot'); refresh(); }}
                    >忘记</button>
                  </div>
                </div>
              ))}
              {entries.length > 6 && (
                <div className="text-[11px] text-amber-700 dark:text-amber-200">还有 {entries.length - 6} 条…</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
