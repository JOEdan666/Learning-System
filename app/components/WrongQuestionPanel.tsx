'use client'

import { useEffect, useState } from 'react'
import { SUBJECTS } from '../types'
import {
  addWrongQuestion,
  archiveWrongQuestion,
  listDueWrongQuestions,
  listWrongQuestions,
  restoreWrongQuestion,
  updateFeedback,
  WrongQuestion
} from '../utils/wrongQuestionStore'
import { applyFeedback, getDueEntries } from '../utils/reviewPlanner'
import toast from 'react-hot-toast'

export default function WrongQuestionPanel() {
  const [subject, setSubject] = useState('语文')
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [analysis, setAnalysis] = useState('')
  const [source, setSource] = useState('')
  const [all, setAll] = useState<WrongQuestion[]>([])
  const [due, setDue] = useState<WrongQuestion[]>([])

  const refresh = () => {
    setAll(listWrongQuestions())
    setDue(listDueWrongQuestions())
  }

  useEffect(() => {
    refresh()
  }, [])

  const handleAdd = () => {
    if (!question.trim()) {
      toast.error('题干不能为空')
      return
    }
    addWrongQuestion({
      subject,
      question: question.trim(),
      correctAnswer: answer.trim() || undefined,
      analysis: analysis.trim() || undefined,
      source: source.trim() || undefined,
      userAnswer: undefined,
      tags: []
    })
    refresh()
    setQuestion('')
    setAnswer('')
    setAnalysis('')
    setSource('')
    toast.success('已加入错题本')
  }

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 md:p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-2xl md:text-3xl font-semibold text-slate-800 dark:text-slate-100">错题本</div>
          <div className="text-base text-slate-500 dark:text-slate-400 mt-1">收集错题，安排复习提醒，追踪掌握度。</div>
        </div>
        <div className="text-base text-amber-700 dark:text-amber-200 font-semibold">
          待复习 {due.length} / 总计 {all.length}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div className="text-xl font-semibold text-slate-700 dark:text-slate-200">快速录入</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="text-lg border rounded px-3 py-2 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
            >
              {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <input
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="来源/备注（可选）"
              className="text-lg border rounded px-3 py-2 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
            />
          </div>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="题干/错题内容"
            className="w-full text-lg border rounded px-3 py-3 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
            rows={4}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="正确答案（可选）"
              className="text-lg border rounded px-3 py-2 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
            />
            <input
              value={analysis}
              onChange={(e) => setAnalysis(e.target.value)}
              placeholder="解析/备注（可选）"
              className="text-lg border rounded px-3 py-2 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
            />
          </div>
          <button
            type="button"
            onClick={handleAdd}
            className="w-full text-lg py-3 rounded-lg bg-primary text-white hover:bg-primary/90"
          >
            加入错题本
          </button>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="text-xl font-semibold text-amber-700 dark:text-amber-200">待复习</div>
              <div className="text-base text-slate-500 dark:text-slate-300">遗忘曲线间隔自动安排</div>
            </div>
            <div className="grid md:grid-cols-2 gap-3 max-h-[520px] overflow-y-auto pr-1">
              {due.length === 0 && <div className="text-lg text-slate-500 dark:text-slate-300">暂无待复习内容</div>}
              {due.map((q) => (
                <div key={q.id} className="p-4 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">{q.subject}{q.source ? ` · ${q.source}` : ''}</div>
                  <div className="text-base text-gray-800 dark:text-gray-100 line-clamp-4">{q.question}</div>
                  <div className="mt-3 flex gap-2 text-sm">
                    <button className="px-2 py-1 rounded bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-200" onClick={() => { updateFeedback(q.id, 'remember'); refresh(); }}>记得</button>
                    <button className="px-2 py-1 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200" onClick={() => { updateFeedback(q.id, 'fuzzy'); refresh(); }}>模糊</button>
                    <button className="px-2 py-1 rounded bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200" onClick={() => { updateFeedback(q.id, 'forgot'); refresh(); }}>忘记</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="text-xl font-semibold text-slate-700 dark:text-slate-200">全部错题</div>
              <div className="text-base text-slate-500 dark:text-slate-300">按时间降序</div>
            </div>
            <div className="grid md:grid-cols-2 gap-3 max-h-[600px] overflow-y-auto pr-1">
              {all.length === 0 && <div className="text-lg text-slate-500 dark:text-slate-300">暂无错题</div>}
              {all.map((q) => (
                <div key={q.id} className="p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">{q.subject}{q.source ? ` · ${q.source}` : ''}</div>
                  <div className="text-base text-gray-800 dark:text-gray-100 line-clamp-4">{q.question}</div>
                  <div className="mt-3 flex gap-2 text-sm">
                    <button className="px-3 py-1.5 rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200" onClick={() => { updateFeedback(q.id, 'fuzzy'); refresh(); }}>再练</button>
                    {q.status === 'active' ? (
                      <button className="px-3 py-1.5 rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200" onClick={() => { archiveWrongQuestion(q.id); refresh(); }}>归档</button>
                    ) : (
                      <button className="px-3 py-1.5 rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200" onClick={() => { restoreWrongQuestion(q.id); refresh(); }}>恢复</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
