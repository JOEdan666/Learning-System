'use client'
import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react'
import {
  Layout, Card, Table, Button, Input, Tag, Upload, Modal,
  message, Typography, Space, Tooltip, Switch, Progress,
  Empty, Spin, ConfigProvider, Dropdown, Segmented
} from 'antd'
import type { UploadProps, MenuProps } from 'antd'
import {
  InboxOutlined, DeleteOutlined, FileTextOutlined,
  FilePdfOutlined, FileExcelOutlined, FileWordOutlined,
  FileImageOutlined, FileUnknownOutlined, SearchOutlined,
  EyeOutlined, ReloadOutlined, MoreOutlined, CloudUploadOutlined,
  CheckCircleOutlined, CloseCircleOutlined
} from '@ant-design/icons'
import { KnowledgeBaseService, type KBItem } from '../services/knowledgeBaseService'
import PDFViewer from './PDFViewer'

const { Dragger } = Upload
const { Title, Text, Paragraph } = Typography
const { Content } = Layout

// 文件类型图标映射
const getFileIcon = (type: string, name: string) => {
  const lowerName = name.toLowerCase()
  if (type === 'application/pdf' || lowerName.endsWith('.pdf')) {
    return <FilePdfOutlined style={{ fontSize: 24, color: '#ff4d4f' }} />
  }
  if (lowerName.endsWith('.docx') || lowerName.endsWith('.doc')) {
    return <FileWordOutlined style={{ fontSize: 24, color: '#1677ff' }} />
  }
  if (lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls')) {
    return <FileExcelOutlined style={{ fontSize: 24, color: '#52c41a' }} />
  }
  if (type.startsWith('image/') || /\.(png|jpg|jpeg|gif|webp)$/i.test(lowerName)) {
    return <FileImageOutlined style={{ fontSize: 24, color: '#722ed1' }} />
  }
  if (type.startsWith('text/') || /\.(txt|md|csv|json)$/i.test(lowerName)) {
    return <FileTextOutlined style={{ fontSize: 24, color: '#faad14' }} />
  }
  return <FileUnknownOutlined style={{ fontSize: 24, color: '#8c8c8c' }} />
}

// 文件大小格式化
function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 文件类型分类
function getFileCategory(type: string, name: string): string {
  const lowerName = name.toLowerCase()
  if (type === 'application/pdf' || lowerName.endsWith('.pdf')) return 'PDF'
  if (lowerName.endsWith('.docx') || lowerName.endsWith('.doc')) return 'Word'
  if (lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls')) return 'Excel'
  if (type.startsWith('image/') || /\.(png|jpg|jpeg|gif|webp)$/i.test(lowerName)) return '图片'
  if (type.startsWith('text/') || /\.(txt|md|csv|json)$/i.test(lowerName)) return '文本'
  return '其他'
}

// 文件读取辅助函数
async function readAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = reject
    reader.readAsText(file)
  })
}

async function readAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as ArrayBuffer)
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}

async function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// 文本提取函数
async function extractText(file: File): Promise<{ text?: string; note?: string }> {
  const mime = (file.type || '').toLowerCase()
  const name = file.name.toLowerCase()

  // 纯文本
  if (mime.startsWith('text/') || /\.(txt|md|csv|json)$/i.test(name)) {
    try {
      const raw = await readAsText(file)
      return { text: raw }
    } catch {
      return { note: '读取文本失败' }
    }
  }

  // PDF
  if (mime === 'application/pdf' || name.endsWith('.pdf')) {
    try {
      const pdfjsLib = await import('pdfjs-dist') as any
      const ab = await readAsArrayBuffer(file)
      try {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`
      } catch {}
      const doc = await pdfjsLib.getDocument({ data: ab }).promise
      let full = ''
      for (let p = 1; p <= Math.min(doc.numPages, 20); p++) {
        const page = await doc.getPage(p)
        const content = await page.getTextContent()
        const text = content.items.map((it: any) => it.str || '').join(' ')
        full += (p > 1 ? '\n\n' : '') + text
      }
      return { text: full.trim() || undefined, note: full.trim() ? undefined : 'PDF文本为空，可能是扫描件' }
    } catch {
      return { note: 'PDF 解析失败' }
    }
  }

  // DOCX
  if (name.endsWith('.docx')) {
    try {
      const mammoth = await import('mammoth/mammoth.browser') as any
      const ab = await readAsArrayBuffer(file)
      const result = await mammoth.convertToHtml({ arrayBuffer: ab })
      const tmp = document.createElement('div')
      tmp.innerHTML = result.value
      const text = tmp.textContent || tmp.innerText || ''
      return { text }
    } catch {
      return { note: 'DOCX 解析失败' }
    }
  }

  // Excel
  if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
    try {
      const XLSX = await import('xlsx') as any
      const ab = await readAsArrayBuffer(file)
      const wb = XLSX.read(ab, { type: 'array' })
      const parts: string[] = []
      for (const s of wb.SheetNames) {
        const ws = wb.Sheets[s]
        const csv = XLSX.utils.sheet_to_csv(ws)
        parts.push(`# ${s}\n${csv}`)
      }
      return { text: parts.join('\n\n') }
    } catch {
      return { note: 'Excel 解析失败' }
    }
  }

  // 图片 OCR
  if (mime.startsWith('image/') || /\.(png|jpg|jpeg)$/i.test(name)) {
    try {
      const Tesseract = await import('tesseract.js') as any
      const url = URL.createObjectURL(file)
      const { data } = await Tesseract.recognize(url, 'eng+chi_sim')
      URL.revokeObjectURL(url)
      return { text: data?.text || '', note: 'OCR 自动提取' }
    } catch {
      return { note: 'OCR 未启用' }
    }
  }

  return { note: '暂不支持的文件类型' }
}

interface KnowledgeBaseProps {
  onItemsChange?: (items: KBItem[]) => void
  compact?: boolean
}

const KnowledgeBase: React.FC<KnowledgeBaseProps> = ({ onItemsChange, compact = false }) => {
  const [items, setItems] = useState<KBItem[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<string>('全部')
  const [previewItem, setPreviewItem] = useState<KBItem | null>(null)
  const [messageApi, contextHolder] = message.useMessage()
  const [kbService] = useState(() => new KnowledgeBaseService())

  // 加载数据
  useEffect(() => {
    (async () => {
      try {
        const loaded = await kbService.getItems()
        setItems(loaded)
        onItemsChange?.(loaded)
      } catch (e) {
        console.error('加载知识库失败:', e)
        messageApi.error('加载知识库失败')
      } finally {
        setLoading(false)
      }
    })()
  }, [kbService, messageApi, onItemsChange])

  // 分类选项
  const categories = useMemo(() => {
    const cats = new Set(['全部'])
    items.forEach(item => cats.add(getFileCategory(item.type, item.name)))
    return Array.from(cats)
  }, [items])

  // 过滤文件
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchSearch = !search ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.text?.toLowerCase().includes(search.toLowerCase())
      const matchCategory = category === '全部' ||
        getFileCategory(item.type, item.name) === category
      return matchSearch && matchCategory
    })
  }, [items, search, category])

  // 统计信息
  const stats = useMemo(() => {
    const included = items.filter(i => i.include !== false)
    return {
      total: items.length,
      included: included.length,
      totalSize: items.reduce((acc, i) => acc + i.size, 0)
    }
  }, [items])

  // 处理文件上传
  const handleUpload = useCallback(async (file: File) => {
    setUploading(true)
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

    try {
      const base: KBItem = {
        id,
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified,
        createdAt: Date.now(),
        include: true
      }

      // 对小文件保存 dataUrl 用于预览
      let dataUrl: string | undefined
      if (file.size <= 2 * 1024 * 1024) {
        if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
          dataUrl = await readAsDataURL(file)
        }
      }

      // 提取文本
      const { text, note } = await extractText(file)

      const newItem: KBItem = { ...base, text, notes: note, dataUrl }
      const savedItems = await kbService.saveItems([newItem])

      setItems(prev => {
        const updated = [...savedItems, ...prev]
        onItemsChange?.(updated)
        return updated
      })

      messageApi.success(`${file.name} 上传成功`)
    } catch (e) {
      console.error('上传失败:', e)
      messageApi.error(`${file.name} 上传失败`)
    } finally {
      setUploading(false)
    }

    return false // 阻止 antd 默认上传
  }, [kbService, messageApi, onItemsChange])

  // 删除文件
  const handleDelete = useCallback(async (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '删除后无法恢复，确定要删除吗？',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await kbService.deleteItem(id)
          setItems(prev => {
            const updated = prev.filter(i => i.id !== id)
            onItemsChange?.(updated)
            return updated
          })
          messageApi.success('已删除')
        } catch (e) {
          messageApi.error('删除失败')
        }
      }
    })
  }, [kbService, messageApi, onItemsChange])

  // 切换是否用于 AI 对话
  const handleToggleInclude = useCallback(async (id: string, include: boolean) => {
    try {
      await kbService.updateItem(id, { include })
      setItems(prev => {
        const updated = prev.map(i => i.id === id ? { ...i, include } : i)
        onItemsChange?.(updated)
        return updated
      })
    } catch (e) {
      messageApi.error('更新失败')
    }
  }, [kbService, messageApi, onItemsChange])

  // 上传配置
  const uploadProps: UploadProps = {
    name: 'file',
    multiple: true,
    showUploadList: false,
    beforeUpload: handleUpload,
    accept: '.pdf,.doc,.docx,.xls,.xlsx,.txt,.md,.csv,.json,.png,.jpg,.jpeg,.gif'
  }

  // 表格列配置
  const columns = [
    {
      title: '文件',
      key: 'file',
      render: (_: unknown, record: KBItem) => (
        <Space>
          {getFileIcon(record.type, record.name)}
          <div>
            <Text strong ellipsis style={{ maxWidth: 200, display: 'block' }}>
              {record.name}
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {formatBytes(record.size)} · {getFileCategory(record.type, record.name)}
            </Text>
          </div>
        </Space>
      )
    },
    {
      title: '状态',
      key: 'status',
      width: 100,
      render: (_: unknown, record: KBItem) => (
        record.text ? (
          <Tag icon={<CheckCircleOutlined />} color="success">已解析</Tag>
        ) : (
          <Tooltip title={record.notes || '未解析'}>
            <Tag icon={<CloseCircleOutlined />} color="warning">待处理</Tag>
          </Tooltip>
        )
      )
    },
    {
      title: '用于AI',
      key: 'include',
      width: 80,
      render: (_: unknown, record: KBItem) => (
        <Switch
          size="small"
          checked={record.include !== false}
          onChange={(checked) => handleToggleInclude(record.id, checked)}
        />
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: unknown, record: KBItem) => {
        const menuItems: MenuProps['items'] = [
          {
            key: 'preview',
            icon: <EyeOutlined />,
            label: '预览',
            disabled: !record.dataUrl,
            onClick: () => setPreviewItem(record)
          },
          {
            type: 'divider'
          },
          {
            key: 'delete',
            icon: <DeleteOutlined />,
            label: '删除',
            danger: true,
            onClick: () => handleDelete(record.id)
          }
        ]

        return (
          <Dropdown menu={{ items: menuItems }} trigger={['click']}>
            <Button type="text" icon={<MoreOutlined />} />
          </Dropdown>
        )
      }
    }
  ]

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <Spin size="large" tip="加载知识库..." />
      </div>
    )
  }

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 8,
        },
      }}
    >
      {contextHolder}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* 上传区域 */}
        <Card size="small" styles={{ body: { padding: 16 } }}>
          <Dragger {...uploadProps} style={{ background: '#fafafa' }}>
            <p className="ant-upload-drag-icon">
              <InboxOutlined style={{ color: '#1677ff', fontSize: 48 }} />
            </p>
            <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
            <p className="ant-upload-hint" style={{ color: '#8c8c8c' }}>
              支持 PDF、Word、Excel、图片、文本等格式
            </p>
          </Dragger>
        </Card>

        {/* 工具栏 */}
        <Card size="small" styles={{ body: { padding: '12px 16px' } }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <Space>
              <Input.Search
                placeholder="搜索文件..."
                allowClear
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: 200 }}
              />
              <Segmented
                options={categories}
                value={category}
                onChange={(val) => setCategory(val as string)}
              />
            </Space>
            <Space>
              <Text type="secondary">
                {stats.included}/{stats.total} 个文件用于AI · 共 {formatBytes(stats.totalSize)}
              </Text>
            </Space>
          </div>
        </Card>

        {/* 文件列表 */}
        <Card size="small" styles={{ body: { padding: 0 } }}>
          {filteredItems.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={items.length === 0 ? '暂无文件，上传文件以开始' : '没有匹配的文件'}
              style={{ padding: 40 }}
            />
          ) : (
            <Table
              dataSource={filteredItems}
              columns={columns}
              rowKey="id"
              pagination={filteredItems.length > 10 ? { pageSize: 10 } : false}
              size="small"
              loading={uploading}
            />
          )}
        </Card>
      </div>

      {/* PDF 预览 */}
      {previewItem && previewItem.dataUrl && (
        <PDFViewer
          dataUrl={previewItem.dataUrl}
          name={previewItem.name}
          onClose={() => setPreviewItem(null)}
          onExtract={async (text) => {
            try {
              await kbService.updateItem(previewItem.id, { text })
              setItems(prev => prev.map(i =>
                i.id === previewItem.id ? { ...i, text } : i
              ))
              messageApi.success('文本已提取')
            } catch {
              messageApi.error('保存失败')
            }
            setPreviewItem(null)
          }}
        />
      )}
    </ConfigProvider>
  )
}

export default KnowledgeBase
