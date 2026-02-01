import { NextResponse } from 'next/server'

export async function GET() {
  const provider = (process.env.NEXT_PUBLIC_AI_PROVIDER || 'xunfei').toLowerCase()

  const hasOpenAIKey = Boolean(process.env.OPENAI_API_KEY)
  const hasXunfei = Boolean(
    process.env.NEXT_PUBLIC_XUNFEI_APP_ID &&
    process.env.NEXT_PUBLIC_XUNFEI_API_KEY &&
    process.env.NEXT_PUBLIC_XUNFEI_API_SECRET
  )

  return NextResponse.json({
    preferredProvider: provider,
    provider,
    hasOpenAIKey,
    hasXunfei,
  }, {
    headers: { 'Cache-Control': 'no-store' }
  })
}
