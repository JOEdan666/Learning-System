'use client'
import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { SUBJECTS } from '../types'
import { CurriculumService } from '../services/curriculumService'
import LearningRoadmap from '../components/LearningFlow/LearningRoadmap'

export default function LearningSetupPage() {
  const router = useRouter()
  const cs = useMemo(()=>CurriculumService.getInstance(),[])
  const [subject, setSubject] = useState<string>('')
  const [topic, setTopic] = useState<string>('')
  const [grade, setGrade] = useState<string>('')
  const [region, setRegion] = useState<string>('')
  const [suggestions, setSuggestions] = useState<Array<{id:string; name:string}>>([])

  useEffect(()=>{
    document.body.classList.add('bg-slate-50')
    return ()=>document.body.classList.remove('bg-slate-50')
  },[])

  useEffect(()=>{
    if (subject && grade && region) {
      const std = cs.getCurriculumStandard(region, grade, subject)
      setSuggestions(std ? std.topics.map(t=>({id:t.id, name:t.name})) : [])
    } else {
      setSuggestions([])
    }
  }, [subject, grade, region, cs])

  const canStart = subject.trim() && topic.trim()

  const start = () => {
    if (!canStart) return
    const params = new URLSearchParams()
    params.set('subject', subject)
    params.set('topic', topic)
    if (grade) params.set('grade', grade)
    if (region) params.set('region', region)
    router.push(`/learning-interface?${params.toString()}`)
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      {/* 学习路径图 */}
      <LearningRoadmap />
      
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 max-w-2xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-slate-900">开启新的学习旅程</h1>
          <p className="text-slate-500 mt-2">选择你想要攻克的知识点，专属私教将为你生成专属路径</p>
        </div>

        <div className="space-y-6">
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700">学科</label>
            <select 
              value={subject} 
              onChange={(e)=>setSubject(e.target.value)} 
              className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
            >
              <option value="">请选择学科</option>
              {SUBJECTS.map(s=> (<option key={s} value={s}>{s}</option>))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700">年级</label>
              <input 
                value={grade} 
                onChange={(e)=>setGrade(e.target.value)} 
                placeholder="例如：初中二年级" 
                className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700">地区</label>
              <input 
                value={region} 
                onChange={(e)=>setRegion(e.target.value)} 
                placeholder="例如：东莞/广州" 
                className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700">主题/知识点</label>
            <input 
              value={topic} 
              onChange={(e)=>setTopic(e.target.value)} 
              placeholder="例如：机械运动 / 光现象" 
              className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
            />
            {suggestions.length > 0 && (
              <div className="mt-3 bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                <div className="text-xs font-medium text-blue-600 mb-2 flex items-center gap-1">
                  ✨ 推荐主题：
                </div>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map(s=> (
                    <button 
                      key={s.id} 
                      onClick={()=>setTopic(s.name)} 
                      className="px-3 py-1.5 rounded-lg bg-white border border-blue-100 text-slate-600 text-sm hover:border-blue-300 hover:text-blue-600 hover:shadow-sm transition-all"
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="pt-4">
            <button 
              onClick={start} 
              disabled={!canStart} 
              className={`
                w-full h-14 rounded-xl font-bold text-lg shadow-lg transition-all
                flex items-center justify-center gap-2
                ${canStart 
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-blue-500/30 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98]' 
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                }
              `}
            >
              {canStart ? '开始系统学习' : '请填写完整信息'}
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}

