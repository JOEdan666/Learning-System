import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log('[Analytics]', {
      path: body?.path,
      event: body?.event,
      meta: body?.meta,
      ts: new Date().toISOString(),
    })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Analytics error', e)
    return NextResponse.json({ ok: false }, { status: 400 })
  }
}

