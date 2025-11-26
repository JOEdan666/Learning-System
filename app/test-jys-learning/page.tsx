'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export const dynamic = 'force-dynamic'

function RedirectInner() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const params = searchParams.toString()
    const hasSubject = searchParams.get('subject')
    const hasTopic = searchParams.get('topic')
    if (hasSubject && hasTopic) {
      const target = '/learning-interface'
      router.replace(params ? `${target}?${params}` : target)
    } else {
      router.replace('/learning-setup')
    }
  }, [router, searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-700">
      <div className="text-center space-y-3">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto" aria-hidden />
        <p className="text-sm">正在打开系统化学习...</p>
      </div>
    </div>
  )
}

export default function RedirectToLearning() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-700">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto" aria-hidden />
          <p className="text-sm">正在打开系统化学习...</p>
        </div>
      </div>
    }>
      <RedirectInner />
    </Suspense>
  )
}
