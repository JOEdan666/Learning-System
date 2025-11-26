"use client"
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-hot-toast'
import { LearningItemsService, type Note } from '../services/learningItemsService'

export default function NotesSection() {
  const [notes, setNotes] = useState<Note[]>([])
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [color, setColor] = useState('#3b82f6')
  const [tagInput, setTagInput] = useState('')
  const [search, setSearch] = useState('')
  const [filterTag, setFilterTag] = useState<string>('')
  const [service] = useState(() => new LearningItemsService())

  useEffect(() => {
    (async () => {
      try {
        const loaded = await service.getNotes()
        setNotes(loaded)
      } catch (e) {
        console.error('加载学习记录失败:', e)
        toast.error('加载学习记录失败')
      }
    })()
  }, [service])

  useEffect(() => {
    // 可选：不再写入localStorage，改为纯服务端存储
  }, [notes])

  const addNote = async () => {
    if (!title.trim() && !content.trim()) return
    const tags = tagInput.split(',').map(t=>t.trim()).filter(Boolean)
    const n: Note = { id: `${Date.now()}`, title: title.trim() || '未命名', content, color, tags, createdAt: new Date().toISOString() }
    try {
      await service.addNote(n)
      setNotes([n, ...notes])
      toast.success('已保存到数据库')
    } catch (e) {
      console.error('保存失败:', e)
      toast.error('保存失败')
    }
    setTitle('')
    setContent('')
    setTagInput('')
  }

  const delNote = async (id: string) => {
    try {
      await service.deleteNote(id)
      setNotes(notes.filter(n=>n.id!==id))
      toast.success('已删除')
    } catch (e) {
      console.error('删除失败:', e)
      toast.error('删除失败')
    }
  }

  const palette = ['#3b82f6','#22c55e','#f59e0b','#ef4444','#a855f7','#0ea5e9']

  const filtered = useMemo(()=>{
    return notes.filter(n=>{
      const hitSearch = !search || (n.title.includes(search) || n.content.includes(search))
      const hitTag = !filterTag || n.tags.includes(filterTag)
      return hitSearch && hitTag
    })
  },[notes,search,filterTag])

  const fmt = (cmd:string) => document.execCommand(cmd)
  const applyHeading = (level:number) => document.execCommand('formatBlock', false, `h${level}`)

  return (
    <section className="max-w-6xl mx-auto px-4 py-10" id="notes">
      <h2 className="text-2xl font-bold mb-4 dark:text-white">记录学习</h2>
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow p-4">
        <input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="标题" className="w-full border border-slate-200 dark:border-slate-700 rounded px-3 py-2 mb-3"/>
        <div className="flex flex-wrap items-center gap-2 text-sm mb-3">
          <button onClick={()=>fmt('bold')} className="px-2 py-1 rounded border">B</button>
          <button onClick={()=>fmt('italic')} className="px-2 py-1 rounded border">I</button>
          <button onClick={()=>fmt('underline')} className="px-2 py-1 rounded border">U</button>
          <button onClick={()=>applyHeading(1)} className="px-2 py-1 rounded border">H1</button>
          <button onClick={()=>applyHeading(2)} className="px-2 py-1 rounded border">H2</button>
          <div className="flex items-center gap-2 ml-2">
            {palette.map(c=> (
              <button key={c} onClick={()=>setColor(c)} className="w-5 h-5 rounded" style={{background:c}}/>
            ))}
          </div>
        </div>
        <div contentEditable suppressContentEditableWarning onInput={(e)=>setContent((e.target as HTMLElement).innerHTML)} className="min-h-[140px] rounded border border-slate-200 dark:border-slate-700 p-3 outline-none"/>
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <input value={tagInput} onChange={(e)=>setTagInput(e.target.value)} placeholder="标签（逗号分隔）" className="border border-slate-200 dark:border-slate-700 rounded px-3 py-2"/>
          <button onClick={addNote} className="px-3 py-2 rounded bg-blue-600 text-white">保存笔记</button>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 mt-4 text-sm">
        <input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="搜索标题或内容" className="border border-slate-200 dark:border-slate-700 rounded px-3 py-2"/>
        <input value={filterTag} onChange={(e)=>setFilterTag(e.target.value)} placeholder="按标签过滤" className="border border-slate-200 dark:border-slate-700 rounded px-3 py-2"/>
      </div>
      <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        {filtered.map(n=> (
          <div key={n.id} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow p-4">
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-semibold" style={{borderLeft:`4px solid ${n.color}`, paddingLeft:8}}>{n.title}</h3>
              <button onClick={()=>delNote(n.id)} className="text-xs text-slate-500">删除</button>
            </div>
            <div className="prose prose-sm max-w-none mt-2" dangerouslySetInnerHTML={{__html:n.content}}/>
            {n.tags.length>0 && (
              <div className="mt-2 flex flex-wrap gap-1 text-xs">
                {n.tags.map(t=> (<span key={t} className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">{t}</span>))}
              </div>
            )}
            <div className="text-xs text-slate-500 mt-2">{new Date(n.createdAt).toLocaleString('zh-CN')}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
