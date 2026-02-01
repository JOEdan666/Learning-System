"use client"
import UnifiedChat from '../components/UnifiedChat'
import { useEffect, useState } from 'react'
import notesService, { type Note } from '../services/notesService'
import type { LearningItem } from '../types'

export default function UnifiedChatPage() {
  const [savedItems, setSavedItems] = useState<LearningItem[]>([])

  useEffect(() => {
    (async () => {
      try {
        const notes: Note[] = await notesService.getNotes()
        const mapped: LearningItem[] = notes.map(n => ({
          id: n.id,
          text: `${n.title}\n\n${notesService.getPlainContent(n)}`,
          subject: '笔记',
          createdAt: n.createdAt,
        }))
        setSavedItems(mapped)
      } catch (e) {
        console.warn('加载笔记失败:', e)
      }
    })()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-sky-100/50 to-blue-100">
      <UnifiedChat savedItems={savedItems} />
    </div>
  )
}

