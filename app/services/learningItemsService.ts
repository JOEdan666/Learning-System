export type Note = {
  id: string
  title: string
  content: string
  color: string
  tags: string[]
  createdAt: string
}

export class LearningItemsService {
  async getNotes(): Promise<Note[]> {
    const resp = await fetch('/api/learning-items')
    const json = await resp.json()
    if (!json.success) throw new Error(json.error || '获取学习记录失败')
    return json.data as Note[]
  }

  async addNote(note: Note): Promise<void> {
    const resp = await fetch('/api/learning-items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item: note }),
    })
    const json = await resp.json()
    if (!json.success) throw new Error(json.error || '保存学习记录失败')
  }

  async addNotes(notes: Note[]): Promise<void> {
    const resp = await fetch('/api/learning-items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: notes }),
    })
    const json = await resp.json()
    if (!json.success) throw new Error(json.error || '批量保存学习记录失败')
  }

  async deleteNote(id: string): Promise<void> {
    const resp = await fetch(`/api/learning-items?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
    const json = await resp.json()
    if (!json.success) throw new Error(json.error || '删除学习记录失败')
  }

  async clearNotes(): Promise<void> {
    const resp = await fetch('/api/learning-items', { method: 'DELETE' })
    const json = await resp.json()
    if (!json.success) throw new Error(json.error || '清空学习记录失败')
  }
}

