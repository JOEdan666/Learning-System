import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

interface Chunk {
  id: string
  file: string
  position: number
  content: string
}

const indexPath = path.join(process.cwd(), 'data', 'learning-index.json')
let cache: Chunk[] | null = null

function loadIndex(): Chunk[] {
  if (cache) return cache
  try {
    const raw = fs.readFileSync(indexPath, 'utf-8')
    cache = JSON.parse(raw)
  } catch (e) {
    console.warn('内置知识库索引读取失败:', e)
    cache = []
  }
  return cache!
}

// 简单关键词评分
function score(text: string, query: string) {
  const terms = query
    .toLowerCase()
    .split(/[^a-zA-Z0-9\u4e00-\u9fa5]+/)
    .filter(Boolean)
  let hit = 0
  for (const t of terms) {
    if (text.toLowerCase().includes(t)) hit++
  }
  return hit
}

export async function POST(req: Request) {
  const { query, limit = 5 } = await req.json().catch(() => ({}))
  if (!query || typeof query !== 'string') {
    return NextResponse.json({ chunks: [] })
  }

  const data = loadIndex()
  const ranked = data
    .map((c) => ({ ...c, _score: score(c.content, query) }))
    .filter((c) => c._score > 0)
    .sort((a, b) => b._score - a._score)
    .slice(0, limit)
    .map(({ _score, ...rest }) => rest)

  return NextResponse.json({ chunks: ranked })
}
