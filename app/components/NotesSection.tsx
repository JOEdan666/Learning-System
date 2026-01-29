'use client'
import { useEffect, useMemo, useState, useRef } from 'react'
import {
  Layout, Menu, Button, Input, List, Card, Tag, Modal,
  message, Typography, Space, Tooltip, ConfigProvider,
  Empty, FloatButton, Select
} from 'antd'
import type { MenuProps } from 'antd'
import {
  PlusOutlined, SearchOutlined, DeleteOutlined,
  FileTextOutlined, AppstoreOutlined, TagsOutlined,
  SaveOutlined, BoldOutlined, ItalicOutlined,
  UnderlineOutlined, OrderedListOutlined, UnorderedListOutlined,
  FontSizeOutlined, MoreOutlined, StarOutlined, StarFilled
} from '@ant-design/icons'
import notesService, { type Note } from '../services/notesService'

const { Header, Sider, Content } = Layout
const { Title, Text, Paragraph } = Typography
const { TextArea } = Input

export default function NotesSection() {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)

  // 筛选状态
  const [search, setSearch] = useState('')
  const [activeTag, setActiveTag] = useState<string | null>(null)

  // 编辑器状态
  const [isEditing, setIsEditing] = useState(false)
  const [currentNote, setCurrentNote] = useState<{
    id?: string
    title: string
    content: string
    color: string
    tags: string[]
    isFavorite?: boolean
  }>({
    title: '',
    content: '',
    color: '#3b82f6',
    tags: []
  })

  const editorRef = useRef<HTMLDivElement>(null)
  const [messageApi, contextHolder] = message.useMessage()

  // 加载数据
  useEffect(() => {
    (async () => {
      try {
        const loaded = await notesService.getNotes()
        setNotes(loaded)
      } catch (e) {
        console.error('加载笔记失败:', e)
        messageApi.error('加载笔记失败')
      } finally {
        setLoading(false)
      }
    })()
  }, [messageApi])

  // 自动提取所有标签
  const allTags = useMemo(() => {
    const tags = new Set<string>()
    notes.forEach(n => n.tags.forEach(t => tags.add(t)))
    return Array.from(tags).sort()
  }, [notes])

  // 过滤笔记
  const filteredNotes = useMemo(() => {
    return notes.filter(n => {
      // 获取笔记内容（从 blocks 中提取）
      const content = notesService.getPlainContent(n)
      const hitSearch = !search || (n.title.toLowerCase().includes(search.toLowerCase()) || content.toLowerCase().includes(search.toLowerCase()))
      const hitTag = !activeTag || n.tags.includes(activeTag)
      return hitSearch && hitTag
    }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  }, [notes, search, activeTag])

  // 打开新建
  const handleCreate = () => {
    setCurrentNote({
      title: '',
      content: '',
      color: '#1677ff', // Ant Design Blue
      tags: []
    })
    setIsEditing(true)
  }

  // 打开编辑
  const handleEdit = (note: Note) => {
    const content = notesService.getHtmlContent(note)
    setCurrentNote({
      id: note.id,
      title: note.title,
      content,
      color: note.color,
      tags: note.tags,
      isFavorite: note.isFavorite
    })
    setIsEditing(true)
  }

  // 保存笔记
  const handleSave = async () => {
    if (!currentNote.title?.trim() && !currentNote.content?.trim()) {
      messageApi.warning('标题或内容不能为空')
      return
    }

    try {
      const isUpdate = !!currentNote.id

      if (isUpdate) {
        // 更新现有笔记
        const updatedNote = await notesService.updateNote({
          id: currentNote.id!,
          title: currentNote.title?.trim() || '未命名',
          content: currentNote.content || '',
          color: currentNote.color || '#1677ff',
          tags: currentNote.tags || []
        })

        setNotes(prev => prev.map(n => n.id === updatedNote.id ? updatedNote : n))
        messageApi.success('已更新')
      } else {
        // 创建新笔记
        const newNote = await notesService.createNote({
          title: currentNote.title?.trim() || '未命名',
          content: currentNote.content || '',
          color: currentNote.color || '#1677ff',
          tags: currentNote.tags || []
        })

        setNotes(prev => [newNote, ...prev])
        messageApi.success('已创建')
      }

      setIsEditing(false)
    } catch (e) {
      console.error('保存失败:', e)
      messageApi.error('保存失败')
    }
  }

  // 切换收藏状态
  const handleToggleFavorite = async (note: Note, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const updated = await notesService.toggleFavorite(note.id, !note.isFavorite)
      setNotes(prev => prev.map(n => n.id === updated.id ? updated : n))
      messageApi.success(updated.isFavorite ? '已收藏' : '已取消收藏')
    } catch (e) {
      console.error('操作失败:', e)
      messageApi.error('操作失败')
    }
  }

  // 删除笔记
  const handleDelete = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这条笔记吗？此操作无法撤销。',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await notesService.deleteNote(id)
          setNotes(prev => prev.filter(n => n.id !== id))
          messageApi.success('已删除')
          if (currentNote.id === id) setIsEditing(false)
        } catch (e) {
          console.error('删除失败:', e)
          messageApi.error('删除失败')
        }
      }
    })
  }

  // 同步编辑器内容（解决中文输入法冲突问题）
  useEffect(() => {
    if (isEditing && editorRef.current) {
      if (editorRef.current.innerHTML !== (currentNote.content || '')) {
        editorRef.current.innerHTML = currentNote.content || ''
      }
    }
  }, [isEditing, currentNote.id])

  // 简单的富文本命令
  const execCmd = (cmd: string, val?: string) => {
    document.execCommand(cmd, false, val)
    if (editorRef.current) {
      setCurrentNote(prev => ({ ...prev, content: editorRef.current?.innerHTML || '' }))
    }
  }

  const palette = ['#1677ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#eb2f96', '#8c8c8c']

  // 菜单项
  const menuItems: MenuProps['items'] = [
    {
      key: 'all',
      icon: <AppstoreOutlined />,
      label: '全部笔记',
      onClick: () => setActiveTag(null)
    },
    {
      type: 'divider' as const
    },
    {
      key: 'tags-group',
      label: '标签',
      type: 'group' as const,
      children: allTags.map(tag => ({
        key: tag,
        icon: <TagsOutlined />,
        label: tag,
        onClick: () => setActiveTag(tag)
      }))
    }
  ]

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
      <Layout style={{ height: '100%', background: '#f0f2f5' }}>
        <Sider 
          width={260} 
          theme="light" 
          breakpoint="lg" 
          collapsedWidth="0"
          style={{ borderRight: '1px solid #f0f0f0' }}
        >
          <div style={{ padding: '24px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileTextOutlined style={{ fontSize: 24, color: '#1677ff' }} />
            <Title level={4} style={{ margin: 0 }}>记录所思</Title>
          </div>
          
          <div style={{ padding: '0 16px 16px' }}>
            <Button 
              type="primary" 
              block 
              size="large" 
              icon={<PlusOutlined />} 
              onClick={handleCreate}
              style={{ borderRadius: 8 }}
            >
              新建笔记
            </Button>
          </div>

          <Menu
            mode="inline"
            selectedKeys={[activeTag || 'all']}
            items={menuItems}
            style={{ borderRight: 0 }}
          />
        </Sider>
        
        <Content style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
          {/* 顶部工具栏 */}
          <div style={{ 
            padding: '16px 24px', 
            background: '#fff', 
            borderBottom: '1px solid #f0f0f0',
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ maxWidth: 400, width: '100%' }}>
              <Input.Search 
                placeholder="搜索笔记..." 
                allowClear 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                enterButton
              />
            </div>
            <Text type="secondary">
              {activeTag ? `标签: ${activeTag}` : '全部笔记'} ({filteredNotes.length})
            </Text>
          </div>

          {/* 笔记列表 */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
            {filteredNotes.length === 0 ? (
              <Empty 
                image={Empty.PRESENTED_IMAGE_SIMPLE} 
                description="没有找到相关笔记"
              >
                {notes.length === 0 && (
                  <Button type="link" onClick={handleCreate}>创建第一条笔记</Button>
                )}
              </Empty>
            ) : (
              <List
                grid={{ gutter: 16, xs: 1, sm: 2, md: 2, lg: 3, xl: 4, xxl: 5 }}
                dataSource={filteredNotes}
                renderItem={note => (
                  <List.Item>
                    <Card
                      hoverable
                      style={{ height: 280, display: 'flex', flexDirection: 'column' }}
                      styles={{ body: { flex: 1, display: 'flex', flexDirection: 'column', padding: '20px' } }}
                      onClick={() => handleEdit(note)}
                      actions={[
                        <span key="date" style={{ fontSize: 12, color: '#8c8c8c' }}>
                          {new Date(note.updatedAt).toLocaleDateString()}
                        </span>,
                        note.isFavorite ? (
                          <StarFilled
                            key="favorite"
                            onClick={(e) => handleToggleFavorite(note, e)}
                            style={{ color: '#faad14' }}
                          />
                        ) : (
                          <StarOutlined
                            key="favorite"
                            onClick={(e) => handleToggleFavorite(note, e)}
                            style={{ color: '#8c8c8c' }}
                          />
                        ),
                        <DeleteOutlined
                          key="delete"
                          onClick={(e) => handleDelete(note.id, e)}
                          style={{ color: '#ff4d4f' }}
                        />
                      ]}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                        <div style={{ width: 4, height: 16, background: note.color, borderRadius: 2, marginRight: 8 }}></div>
                        <Text strong style={{ fontSize: 16 }} ellipsis>{note.title}</Text>
                      </div>

                      <div style={{ flex: 1, overflow: 'hidden', position: 'relative', marginBottom: 12 }}>
                        <div
                          className="prose prose-sm max-w-none text-slate-500"
                          style={{ fontSize: 14, color: '#666' }}
                          dangerouslySetInnerHTML={{ __html: notesService.getHtmlContent(note) }}
                        />
                        <div style={{
                          position: 'absolute', bottom: 0, left: 0, width: '100%', height: 40,
                          background: 'linear-gradient(to top, #ffffff, transparent)'
                        }}></div>
                      </div>

                      <div style={{ minHeight: 24 }}>
                        {note.tags.slice(0, 3).map(tag => (
                          <Tag key={tag} bordered={false} style={{ fontSize: 12 }}>#{tag}</Tag>
                        ))}
                        {note.tags.length > 3 && (
                          <Tag bordered={false} style={{ fontSize: 12 }}>+{note.tags.length - 3}</Tag>
                        )}
                      </div>
                    </Card>
                  </List.Item>
                )}
              />
            )}
          </div>
        </Content>

        {/* 移动端新建按钮 */}
        <FloatButton 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={handleCreate}
          style={{ right: 24, bottom: 24 }}
          className="md:hidden"
        />

        {/* 编辑模态框 */}
        <Modal
          title={null}
          open={isEditing}
          onCancel={() => setIsEditing(false)}
          footer={null}
          width={900}
          centered
          styles={{ body: { padding: 0, height: '80vh', display: 'flex', flexDirection: 'column' } }}
          destroyOnClose
        >
          {/* Header */}
          <div style={{ 
            padding: '16px 24px', 
            borderBottom: '1px solid #f0f0f0', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center' 
          }}>
            <Space>
              {palette.map(c => (
                <div 
                  key={c}
                  onClick={() => setCurrentNote(prev => ({ ...prev, color: c }))}
                  style={{ 
                    width: 20, 
                    height: 20, 
                    borderRadius: '50%', 
                    background: c, 
                    cursor: 'pointer',
                    border: currentNote.color === c ? '2px solid #000' : '2px solid transparent',
                    transition: 'all 0.2s'
                  }}
                />
              ))}
            </Space>
            <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} shape="round">
              保存
            </Button>
          </div>

          {/* Editor Body */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '24px 40px 0' }}>
              <Input
                placeholder="无标题笔记"
                value={currentNote.title}
                onChange={(e) => setCurrentNote(prev => ({ ...prev, title: e.target.value }))}
                bordered={false}
                style={{ 
                  fontSize: 28, 
                  fontWeight: 'bold', 
                  padding: '8px 0' 
                }}
              />
            </div>

            {/* Toolbar */}
            <div style={{ 
              padding: '8px 40px', 
              borderBottom: '1px solid #f0f0f0',
              position: 'sticky',
              top: 0,
              background: '#fff',
              zIndex: 10
            }}>
              <Space>
                <Tooltip title="加粗"><Button type="text" icon={<BoldOutlined />} onClick={() => execCmd('bold')} /></Tooltip>
                <Tooltip title="斜体"><Button type="text" icon={<ItalicOutlined />} onClick={() => execCmd('italic')} /></Tooltip>
                <Tooltip title="下划线"><Button type="text" icon={<UnderlineOutlined />} onClick={() => execCmd('underline')} /></Tooltip>
                <div style={{ width: 1, height: 16, background: '#f0f0f0', margin: '0 8px' }} />
                <Tooltip title="大标题"><Button type="text" onClick={() => execCmd('formatBlock', 'H1')}>H1</Button></Tooltip>
                <Tooltip title="小标题"><Button type="text" onClick={() => execCmd('formatBlock', 'H2')}>H2</Button></Tooltip>
                <div style={{ width: 1, height: 16, background: '#f0f0f0', margin: '0 8px' }} />
                <Tooltip title="无序列表"><Button type="text" icon={<UnorderedListOutlined />} onClick={() => execCmd('insertUnorderedList')} /></Tooltip>
              </Space>
            </div>

            {/* Content Area */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px 40px' }}>
              <div 
                ref={editorRef}
                className="ant-typography"
                style={{ 
                  minHeight: '300px', 
                  fontSize: '16px', 
                  lineHeight: '1.8', 
                  outline: 'none' 
                }}
                contentEditable
                suppressContentEditableWarning
                onInput={(e) => setCurrentNote(prev => ({ ...prev, content: (e.target as HTMLElement).innerHTML }))}
              />
            </div>
          </div>

          {/* Footer Tags */}
          <div style={{ 
            padding: '16px 24px', 
            borderTop: '1px solid #f0f0f0', 
            background: '#fafafa'
          }}>
            <Space style={{ width: '100%' }} align="center">
              <TagsOutlined style={{ color: '#8c8c8c' }} />
              <Select
                mode="tags"
                style={{ width: '100%', minWidth: 300 }}
                placeholder="添加标签..."
                value={currentNote.tags}
                onChange={(value) => setCurrentNote(prev => ({ ...prev, tags: value }))}
                tokenSeparators={[',', '，']}
                options={allTags.map(tag => ({ label: tag, value: tag }))}
                bordered={false}
              />
            </Space>
          </div>
        </Modal>
      </Layout>
    </ConfigProvider>
  )
}
