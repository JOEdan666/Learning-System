// 笔记 Block 类型
export interface NoteBlock {
  id: string
  type: string
  content: string
  properties: Record<string, unknown> | null
  order: number
  parentId?: string | null
}

// 笔记类型
export interface Note {
  id: string
  title: string
  icon?: string | null
  cover?: string | null
  color: string
  tags: string[]
  isFavorite: boolean
  isArchived: boolean
  createdAt: string
  updatedAt: string
  blocks: NoteBlock[]
}

// 创建笔记的请求类型
export interface CreateNoteRequest {
  title?: string
  content?: string  // 简单模式：直接传内容
  color?: string
  tags?: string[]
  icon?: string
  cover?: string
  blocks?: Omit<NoteBlock, 'id'>[]  // 高级模式：传 blocks
}

// 更新笔记的请求类型
export interface UpdateNoteRequest {
  id: string
  title?: string
  content?: string
  color?: string
  tags?: string[]
  icon?: string
  cover?: string
  blocks?: Omit<NoteBlock, 'id'>[]
  isFavorite?: boolean
  isArchived?: boolean
}

// 获取笔记的查询参数
export interface GetNotesParams {
  archived?: boolean
  tag?: string
  search?: string
}

class NotesService {
  private baseUrl = '/api/notes'

  /**
   * 获取所有笔记
   */
  async getNotes(params?: GetNotesParams): Promise<Note[]> {
    const searchParams = new URLSearchParams()
    if (params?.archived) searchParams.set('archived', 'true')
    if (params?.tag) searchParams.set('tag', params.tag)
    if (params?.search) searchParams.set('search', params.search)

    const url = searchParams.toString()
      ? `${this.baseUrl}?${searchParams.toString()}`
      : this.baseUrl

    const response = await fetch(url)
    const json = await response.json()

    if (!json.success) {
      throw new Error(json.error || '获取笔记失败')
    }

    return json.data as Note[]
  }

  /**
   * 创建新笔记
   */
  async createNote(data: CreateNoteRequest): Promise<Note> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })

    const json = await response.json()

    if (!json.success) {
      throw new Error(json.error || '创建笔记失败')
    }

    return json.data as Note
  }

  /**
   * 更新笔记
   */
  async updateNote(data: UpdateNoteRequest): Promise<Note> {
    const response = await fetch(this.baseUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })

    const json = await response.json()

    if (!json.success) {
      throw new Error(json.error || '更新笔记失败')
    }

    return json.data as Note
  }

  /**
   * 删除笔记
   */
  async deleteNote(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}?id=${encodeURIComponent(id)}`, {
      method: 'DELETE'
    })

    const json = await response.json()

    if (!json.success) {
      throw new Error(json.error || '删除笔记失败')
    }
  }

  /**
   * 切换收藏状态
   */
  async toggleFavorite(id: string, isFavorite: boolean): Promise<Note> {
    return this.updateNote({ id, isFavorite })
  }

  /**
   * 归档笔记
   */
  async archiveNote(id: string): Promise<Note> {
    return this.updateNote({ id, isArchived: true })
  }

  /**
   * 取消归档
   */
  async unarchiveNote(id: string): Promise<Note> {
    return this.updateNote({ id, isArchived: false })
  }

  /**
   * 从旧格式转换（兼容 LearningItemsService 的数据）
   */
  convertFromLegacyNote(legacy: {
    id: string
    title: string
    content: string
    color: string
    tags: string[]
    createdAt: string
  }): CreateNoteRequest {
    return {
      title: legacy.title,
      content: legacy.content,
      color: legacy.color,
      tags: legacy.tags
    }
  }

  /**
   * 获取笔记的纯文本内容（用于搜索、预览等）
   */
  getPlainContent(note: Note): string {
    return note.blocks
      .map(block => block.content)
      .filter(Boolean)
      .join('\n')
  }

  /**
   * 获取笔记的 HTML 内容（用于富文本显示）
   */
  getHtmlContent(note: Note): string {
    return note.blocks
      .map(block => block.content)
      .filter(Boolean)
      .join('')
  }
}

export const notesService = new NotesService()
export default notesService
