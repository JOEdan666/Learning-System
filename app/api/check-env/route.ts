import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const envStatus = {
      aiProvider: process.env.NEXT_PUBLIC_AI_PROVIDER || '未设置',
      apiKey: process.env.OPENAI_API_KEY ? '已设置' : '未设置',
      baseUrl: process.env.OPENAI_BASE_URL || '未设置',
      model: process.env.OPENAI_MODEL || '未设置'
    }

    return NextResponse.json(envStatus)
  } catch (error) {
    return NextResponse.json({ error: '获取环境变量失败' }, { status: 500 })
  }
}