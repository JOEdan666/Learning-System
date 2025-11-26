import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '../../generated/prisma'

const prisma = new PrismaClient()

type NotePayload = {
  id: string
  title: string
  content: string
  color: string
  tags: string[]
  createdAt: string
}

export async function GET() {
  try {
    const items = await prisma.learningItem.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
    })

    const notes = items.map((it) => {
      try {
        const parsed = JSON.parse(it.text || '{}') as Partial<NotePayload>
        return {
          id: it.id,
          title: parsed.title || '未命名',
          content: parsed.content || '',
          color: parsed.color || '#3b82f6',
          tags: parsed.tags || [],
          createdAt: parsed.createdAt || new Date(it.createdAt).toISOString(),
        } as NotePayload
      } catch {
        return {
          id: it.id,
          title: it.text.slice(0, 20) || '未命名',
          content: it.text,
          color: '#3b82f6',
          tags: [],
          createdAt: new Date(it.createdAt).toISOString(),
        }
      }
    })

    return NextResponse.json({ success: true, data: notes })
  } catch (error) {
    console.error('获取学习记录失败:', error)
    return NextResponse.json({ success: false, error: '获取学习记录失败' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { item, items } = body as { item?: NotePayload; items?: NotePayload[] }

    const payloads = items || (item ? [item] : [])
    if (!Array.isArray(payloads) || payloads.length === 0) {
      return NextResponse.json({ success: false, error: '无效的数据格式' }, { status: 400 })
    }

    const created = await Promise.all(
      payloads.map((n) =>
        prisma.learningItem.create({
          data: {
            id: n.id,
            text: JSON.stringify(n),
            subject: 'notes',
            createdAt: new Date(n.createdAt),
          },
        })
      )
    )

    return NextResponse.json({ success: true, count: created.length })
  } catch (error) {
    console.error('保存学习记录失败:', error)
    return NextResponse.json({ success: false, error: '保存学习记录失败' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (id) {
      await prisma.learningItem.delete({ where: { id } })
      return NextResponse.json({ success: true })
    }
    await prisma.learningItem.deleteMany({})
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('删除学习记录失败:', error)
    return NextResponse.json({ success: false, error: '删除学习记录失败' }, { status: 500 })
  }
}

