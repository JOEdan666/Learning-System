"use client"
import UnifiedChat from '../components/UnifiedChat'
import { useEffect, useState } from 'react'
import { LearningItemsService, type Note } from '../services/learningItemsService'
import type { LearningItem } from '../types'

export default function UnifiedChatPage() {
  const [savedItems, setSavedItems] = useState<LearningItem[]>([])
  const [svc] = useState(() => new LearningItemsService())

  useEffect(() => {
    (async () => {
      try {
        const notes: Note[] = await svc.getNotes()
        const mapped: LearningItem[] = notes.map(n => ({
          id: n.id,
          text: `${n.title}\n\n${n.content}`,
          subject: '笔记',
          createdAt: new Date(n.createdAt).toISOString(),
        }))
        setSavedItems(mapped)
      } catch {}
    })()
  }, [svc])

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <UnifiedChat savedItems={savedItems} />
    </div>
  )
}

