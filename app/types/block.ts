// Block Editor Type Definitions for Notion-style editing

export type BlockType =
  | 'paragraph'
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'bulleted_list'
  | 'numbered_list'
  | 'todo_list'
  | 'code'
  | 'math'
  | 'image'
  | 'table'
  | 'callout'
  | 'toggle'
  | 'quote'
  | 'divider'

export type CalloutType = 'info' | 'warning' | 'success' | 'error' | 'note'

export interface BlockProperties {
  // For code blocks
  language?: string

  // For todo blocks
  checked?: boolean

  // For callout blocks
  calloutType?: CalloutType
  icon?: string

  // For image blocks
  url?: string
  caption?: string
  width?: number

  // For table blocks
  headers?: string[]
  rows?: string[][]

  // For toggle blocks
  collapsed?: boolean

  // General styling
  color?: string
  backgroundColor?: string
  textAlign?: 'left' | 'center' | 'right'
}

export interface Block {
  id: string
  type: BlockType
  content: string
  properties?: BlockProperties
  children?: string[] // For nested blocks (toggle, lists)
  order: number
  parentId?: string // For nested structure
  createdAt: number
  updatedAt: number
}

export interface BlockEditorState {
  blocks: Block[]
  selectedBlockId: string | null
  focusedBlockId: string | null
  isEditing: boolean
}

// Block menu command types
export interface BlockCommand {
  type: BlockType
  label: string
  description: string
  icon: string
  shortcut?: string
}

export const BLOCK_COMMANDS: BlockCommand[] = [
  { type: 'paragraph', label: '正文', description: '普通文本段落', icon: 'text' },
  { type: 'heading1', label: '标题 1', description: '大标题', icon: 'h1', shortcut: '# ' },
  { type: 'heading2', label: '标题 2', description: '中标题', icon: 'h2', shortcut: '## ' },
  { type: 'heading3', label: '标题 3', description: '小标题', icon: 'h3', shortcut: '### ' },
  { type: 'bulleted_list', label: '无序列表', description: '项目列表', icon: 'list', shortcut: '- ' },
  { type: 'numbered_list', label: '有序列表', description: '编号列表', icon: 'list-ordered', shortcut: '1. ' },
  { type: 'todo_list', label: '待办事项', description: '任务清单', icon: 'check-square', shortcut: '[] ' },
  { type: 'code', label: '代码块', description: '代码片段', icon: 'code', shortcut: '```' },
  { type: 'math', label: '数学公式', description: 'LaTeX 公式', icon: 'sigma', shortcut: '$$' },
  { type: 'quote', label: '引用', description: '引用文本', icon: 'quote', shortcut: '> ' },
  { type: 'callout', label: '提示框', description: '高亮提示', icon: 'alert-circle' },
  { type: 'toggle', label: '折叠块', description: '可展开内容', icon: 'chevron-right' },
  { type: 'image', label: '图片', description: '上传或粘贴图片', icon: 'image' },
  { type: 'divider', label: '分割线', description: '水平分隔', icon: 'minus', shortcut: '---' },
  { type: 'table', label: '表格', description: '数据表格', icon: 'table' },
]

// Helper functions
export function createBlock(type: BlockType, content: string = '', order: number = 0): Block {
  const now = Date.now()
  return {
    id: generateBlockId(),
    type,
    content,
    order,
    createdAt: now,
    updatedAt: now,
    properties: getDefaultProperties(type)
  }
}

export function generateBlockId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `block_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

function getDefaultProperties(type: BlockType): BlockProperties | undefined {
  switch (type) {
    case 'code':
      return { language: 'javascript' }
    case 'todo_list':
      return { checked: false }
    case 'callout':
      return { calloutType: 'info', icon: 'lightbulb' }
    case 'toggle':
      return { collapsed: false }
    case 'table':
      return { headers: ['列1', '列2'], rows: [['', '']] }
    default:
      return undefined
  }
}

// Parse markdown shortcuts to block type
export function parseMarkdownShortcut(text: string): { type: BlockType; content: string } | null {
  const trimmed = text.trimStart()

  if (trimmed.startsWith('### ')) {
    return { type: 'heading3', content: trimmed.slice(4) }
  }
  if (trimmed.startsWith('## ')) {
    return { type: 'heading2', content: trimmed.slice(3) }
  }
  if (trimmed.startsWith('# ')) {
    return { type: 'heading1', content: trimmed.slice(2) }
  }
  if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
    return { type: 'bulleted_list', content: trimmed.slice(2) }
  }
  if (/^\d+\.\s/.test(trimmed)) {
    return { type: 'numbered_list', content: trimmed.replace(/^\d+\.\s/, '') }
  }
  if (trimmed.startsWith('[] ') || trimmed.startsWith('[ ] ')) {
    return { type: 'todo_list', content: trimmed.replace(/^\[\s?\]\s/, '') }
  }
  if (trimmed.startsWith('[x] ') || trimmed.startsWith('[X] ')) {
    return { type: 'todo_list', content: trimmed.replace(/^\[[xX]\]\s/, '') }
  }
  if (trimmed.startsWith('> ')) {
    return { type: 'quote', content: trimmed.slice(2) }
  }
  if (trimmed === '---' || trimmed === '***') {
    return { type: 'divider', content: '' }
  }
  if (trimmed.startsWith('```')) {
    return { type: 'code', content: '' }
  }
  if (trimmed.startsWith('$$')) {
    return { type: 'math', content: '' }
  }

  return null
}
