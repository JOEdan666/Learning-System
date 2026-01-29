'use client'

import WrongQuestionPanel from '../components/WrongQuestionPanel'
import { BookMarked } from 'lucide-react'

export default function WrongBookPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-10 space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center">
              <BookMarked className="w-7 h-7 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900">智能错题本</h1>
              <p className="text-slate-500 mt-1 text-sm md:text-base">
                科学管理错题，智能安排复习，让每一个错误都成为提分的契机
              </p>
            </div>
          </div>
        </div>

        <WrongQuestionPanel />
      </div>
    </div>
  )
}
