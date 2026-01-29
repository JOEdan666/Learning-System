'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ConversationsPage() {
  const router = useRouter()
  
  useEffect(() => {
    router.replace('/unified-chat')
  }, [router])

  return null
}
