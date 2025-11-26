'use client'
import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { SUBJECTS } from '../types'
import { CurriculumService } from '../services/curriculumService'

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
    <main className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">选择学习内容</h1>
      <p className="text-sm text-slate-600 mb-6">先选学科与主题，再开始系统化学习。</p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">学科</label>
          <select value={subject} onChange={(e)=>setSubject(e.target.value)} className="w-full border rounded-md px-3 py-2">
            <option value="">请选择学科</option>
            {SUBJECTS.map(s=> (<option key={s} value={s}>{s}</option>))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">年级</label>
            <input value={grade} onChange={(e)=>setGrade(e.target.value)} placeholder="例如：初中二年级" className="w-full border rounded-md px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">地区</label>
            <input value={region} onChange={(e)=>setRegion(e.target.value)} placeholder="例如：东莞/广州" className="w-full border rounded-md px-3 py-2" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">主题/知识点</label>
          <input value={topic} onChange={(e)=>setTopic(e.target.value)} placeholder="例如：机械运动 / 光现象" className="w-full border rounded-md px-3 py-2" />
          {suggestions.length > 0 && (
            <div className="mt-2 text-xs text-slate-600">
              推荐主题：
              <div className="flex flex-wrap gap-2 mt-1">
                {suggestions.map(s=> (
                  <button key={s.id} onClick={()=>setTopic(s.name)} className="px-2 py-1 rounded border text-slate-700 hover:bg-slate-50">
                    {s.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="pt-2">
          <button onClick={start} disabled={!canStart} className={`px-4 py-2 rounded-md text-white ${canStart ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-300 cursor-not-allowed'}`}>开始系统学习</button>
          <span className="ml-3 text-xs text-slate-500">必须选择学科与主题</span>
        </div>
      </div>
    </main>
  )
}

