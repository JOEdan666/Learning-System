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
import { 
  PenTool, 
  BookOpen, 
  Clock, 
  Archive, 
  RotateCcw, 
  CheckCircle2, 
  HelpCircle, 
  XCircle,
  Plus,
  Search,
  Filter,
  MoreHorizontal
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// 学科颜色映射
const SUBJECT_COLORS: Record<string, string> = {
  '语文': 'bg-red-50 text-red-600 border-red-200',
  '数学': 'bg-blue-50 text-blue-600 border-blue-200',
  '英语': 'bg-purple-50 text-purple-600 border-purple-200',
  '物理': 'bg-indigo-50 text-indigo-600 border-indigo-200',
  '化学': 'bg-cyan-50 text-cyan-600 border-cyan-200',
  '生物': 'bg-green-50 text-green-600 border-green-200',
  '政治': 'bg-rose-50 text-rose-600 border-rose-200',
  '历史': 'bg-amber-50 text-amber-600 border-amber-200',
  '地理': 'bg-emerald-50 text-emerald-600 border-emerald-200',
  '其他': 'bg-slate-50 text-slate-600 border-slate-200',
}

export default function WrongQuestionPanel() {
  const [subject, setSubject] = useState('语文')
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [analysis, setAnalysis] = useState('')
  const [source, setSource] = useState('')
  const [all, setAll] = useState<WrongQuestion[]>([])
  const [due, setDue] = useState<WrongQuestion[]>([])
  
  // 简单的筛选状态
  const [filterSubject, setFilterSubject] = useState('全部')

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

  const filteredAll = filterSubject === '全部' 
    ? all 
    : all.filter(q => q.subject === filterSubject)

  return (
    <div className="grid lg:grid-cols-12 gap-8 items-start">
      {/* 左侧：录入区域 */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sticky top-24">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <PenTool className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">新题入库</h2>
              <p className="text-xs text-slate-500">记录每一次错误，都是进步的阶梯</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">学科 & 来源</label>
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                >
                  {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <input
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder="来源 (如: 期中考)"
                  className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">题目内容</label>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="请输入题目内容..."
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 min-h-[120px] resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">答案 & 解析 (可选)</label>
              <div className="space-y-3">
                <input
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="正确答案"
                  className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                />
                <textarea
                  value={analysis}
                  onChange={(e) => setAnalysis(e.target.value)}
                  placeholder="解析或备注..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 min-h-[80px] resize-none"
                />
              </div>
            </div>

            <button
              onClick={handleAdd}
              className="w-full h-12 mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              <span>录入错题</span>
            </button>
          </div>
        </div>
      </div>

      {/* 右侧：列表区域 */}
      <div className="lg:col-span-8 space-y-8">
        {/* 待复习模块 */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              <h3 className="text-lg font-bold text-slate-900">今日待复习</h3>
              <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">
                {due.length}
              </span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <AnimatePresence>
              {due.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="col-span-full py-12 text-center bg-white rounded-2xl border border-dashed border-slate-200"
                >
                  <div className="w-16 h-16 mx-auto bg-green-50 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                  </div>
                  <p className="text-slate-500">太棒了！今日复习任务已完成</p>
                </motion.div>
              ) : (
                due.map((q) => (
                  <motion.div
                    key={q.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white p-5 rounded-2xl shadow-sm border-l-4 border-amber-400 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <span className={`text-xs px-2 py-1 rounded-md font-medium ${SUBJECT_COLORS[q.subject] || SUBJECT_COLORS['其他']}`}>
                        {q.subject}
                      </span>
                      {q.source && <span className="text-xs text-slate-400">{q.source}</span>}
                    </div>
                    <p className="text-slate-800 font-medium mb-4 line-clamp-3 text-sm leading-relaxed">
                      {q.question}
                    </p>
                    <div className="flex items-center gap-2 pt-3 border-t border-slate-50">
                      <button 
                        onClick={() => { updateFeedback(q.id, 'remember'); refresh(); }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-green-50 text-green-700 text-xs font-medium hover:bg-green-100 transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> 记得
                      </button>
                      <button 
                        onClick={() => { updateFeedback(q.id, 'fuzzy'); refresh(); }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-amber-50 text-amber-700 text-xs font-medium hover:bg-amber-100 transition-colors"
                      >
                        <HelpCircle className="w-3.5 h-3.5" /> 模糊
                      </button>
                      <button 
                        onClick={() => { updateFeedback(q.id, 'forgot'); refresh(); }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-red-50 text-red-700 text-xs font-medium hover:bg-red-100 transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" /> 忘记
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* 全部错题模块 */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-500" />
              <h3 className="text-lg font-bold text-slate-900">题库总览</h3>
            </div>
            
            {/* 简单筛选 */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select 
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                className="text-xs border-none bg-transparent text-slate-600 focus:ring-0 cursor-pointer hover:text-blue-600 font-medium"
              >
                <option value="全部">全部学科</option>
                {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-3">
            {filteredAll.length === 0 ? (
              <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <p className="text-slate-400 text-sm">暂无相关错题记录</p>
              </div>
            ) : (
              filteredAll.map((q) => (
                <motion.div
                  key={q.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="group bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:border-blue-200 hover:shadow-md transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center text-sm font-bold ${SUBJECT_COLORS[q.subject] || SUBJECT_COLORS['其他']}`}>
                      {q.subject[0]}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-slate-900 truncate pr-4">
                          {q.source || '未分类题目'}
                        </span>
                        <span className="text-xs text-slate-400 flex-shrink-0">
                          {new Date(q.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 line-clamp-2 mb-2">
                        {q.question}
                      </p>
                      
                      <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => { updateFeedback(q.id, 'fuzzy'); refresh(); }}
                          className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                          再练一次
                        </button>
                        {q.status === 'active' ? (
                          <button 
                            onClick={() => { archiveWrongQuestion(q.id); refresh(); }}
                            className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1"
                          >
                            <Archive className="w-3 h-3" />
                            归档
                          </button>
                        ) : (
                          <button 
                            onClick={() => { restoreWrongQuestion(q.id); refresh(); }}
                            className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1"
                          >
                            <RotateCcw className="w-3 h-3" />
                            恢复
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
