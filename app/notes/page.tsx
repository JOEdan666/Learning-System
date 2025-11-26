"use client"
import NotesSection from '../components/NotesSection'
import { useEffect } from 'react'

export default function NotesPage() {
  useEffect(() => {
    document.body.classList.add('bg-learn')
    return () => document.body.classList.remove('bg-learn')
  }, [])
  return (
    <div className="min-h-screen text-slate-900 dark:text-slate-100">
      <main className="max-w-6xl w-full mx-auto px-4 py-6">
        <NotesSection />
      </main>
    </div>
  )
}
