// 知识库数据库服务
export type KBItem = {
  id: string
  name: string
  type: string
  size: number
  lastModified: number
  text?: string
  ocrText?: string
  notes?: string
  createdAt: number
  dataUrl?: string
  include?: boolean
}

export class KnowledgeBaseService {
  constructor() {
    // 不再需要userId
  }

  // 获取知识库文件列表
  async getItems(): Promise<KBItem[]> {
    try {
      const response = await fetch('/api/knowledge-base')
      const result = await response.json()
      
      if (result.success) {
        // 转换数据库格式到前端格式
        return result.data.map((item: any) => ({
          id: item.id,
          name: item.name,
          type: item.type,
          size: item.size,
          lastModified: item.lastModified,
          text: item.text,
          ocrText: item.ocrText,
          notes: item.notes,
          createdAt: new Date(item.createdAt).getTime(),
          dataUrl: item.dataUrl,
          include: item.include
        }))
      } else {
        throw new Error(result.error || '获取知识库文件失败')
      }
    } catch (error) {
      console.error('获取知识库文件失败:', error)
      throw error
    }
  }

  // 保存知识库文件
  async saveItems(items: KBItem[]): Promise<KBItem[]> {
    try {
      const response = await fetch('/api/knowledge-base', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          items
        })
      })
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || '保存知识库文件失败')
      }
      
      return result.data || items
    } catch (error) {
      console.error('保存知识库文件失败:', error)
      throw error
    }
  }

  // 更新单个文件
  async updateItem(id: string, updates: Partial<KBItem>): Promise<void> {
    try {
      const response = await fetch('/api/knowledge-base', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id,
          updates
        })
      })
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || '更新文件失败')
      }
    } catch (error) {
      console.error('更新文件失败:', error)
      throw error
    }
  }

  // 删除单个文件
  async deleteItem(id: string): Promise<void> {
    try {
      const params = new URLSearchParams({ id })
      const response = await fetch(`/api/knowledge-base?${params}`, {
        method: 'DELETE'
      })
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || '删除文件失败')
      }
    } catch (error) {
      console.error('删除文件失败:', error)
      throw error
    }
  }

  // 删除所有文件
  async deleteAllItems(): Promise<void> {
    try {
      const response = await fetch('/api/knowledge-base', {
        method: 'DELETE'
      })
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || '删除所有文件失败')
      }
    } catch (error) {
      console.error('删除所有文件失败:', error)
      throw error
    }
  }

  // 从本地存储迁移到数据库
  async migrateFromLocalStorage(): Promise<KBItem[]> {
    try {
      // 尝试从各种本地存储中读取数据
      let localItems: KBItem[] = []
      
      // 从localStorage读取
      try {
        const localData = localStorage.getItem('kb_items_v2')
        if (localData) {
          const parsed = JSON.parse(localData)
          if (Array.isArray(parsed)) {
            localItems = parsed
          }
        }
      } catch (e) {
        console.warn('从localStorage读取失败:', e)
      }
      
      // 如果localStorage没有数据，尝试从sessionStorage读取
      if (localItems.length === 0) {
        try {
          const sessionData = sessionStorage.getItem('kb_items_backup_v2')
          if (sessionData) {
            const parsed = JSON.parse(sessionData)
            if (Array.isArray(parsed)) {
              localItems = parsed
            }
          }
        } catch (e) {
          console.warn('从sessionStorage读取失败:', e)
        }
      }
      
      // 如果有本地数据，迁移到数据库
      if (localItems.length > 0) {
        const savedItems = await this.saveItems(localItems)
        
        // 迁移成功后清理本地存储
        try {
          localStorage.removeItem('kb_items_v2')
          localStorage.removeItem('kb_items_backup_v2')
          sessionStorage.removeItem('kb_items_v2')
          sessionStorage.removeItem('kb_items_backup_v2')
          
          // 清理IndexedDB
          if ('indexedDB' in window) {
            const deleteReq = indexedDB.deleteDatabase('knowledge_base_db')
            deleteReq.onsuccess = () => console.log('IndexedDB已清理')
          }
        } catch (e) {
          console.warn('清理本地存储失败:', e)
        }
        
        return savedItems
      }
      
      return []
    } catch (error) {
      console.error('迁移本地数据失败:', error)
      throw error
    }
  }
}