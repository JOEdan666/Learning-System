'use client'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'react-hot-toast'

type KBItem = {
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

const KB_STORAGE_KEY = 'kb_items_v2' // 升级版本号以支持新的存储结构
const KB_SESSION_KEY = 'kb_items_backup_v2'
const KB_INDEXEDDB_NAME = 'knowledge_base_db'
const KB_INDEXEDDB_STORE = 'kb_items'
const KB_INDEXEDDB_VERSION = 1

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

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

// IndexedDB数据库操作
const openDatabase = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(KB_INDEXEDDB_NAME, KB_INDEXEDDB_VERSION);
    
    request.onerror = (event) => {
      console.error('IndexedDB打开失败:', event);
      reject('无法打开数据库');
    };
    
    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(KB_INDEXEDDB_STORE)) {
        db.createObjectStore(KB_INDEXEDDB_STORE, { keyPath: 'id' });
        console.log('创建IndexedDB存储');
      }
    };
  });
};

const saveToIndexedDB = async (items: KBItem[]): Promise<boolean> => {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([KB_INDEXEDDB_STORE], 'readwrite');
    const store = transaction.objectStore(KB_INDEXEDDB_STORE);
    
    // 清除现有数据
    store.clear();
    
    // 添加所有项目
    for (const item of items) {
      store.add(item);
    }
    
    return new Promise((resolve) => {
      transaction.oncomplete = () => {
        db.close();
        resolve(true);
      };
      
      transaction.onerror = (event) => {
        console.error('保存到IndexedDB失败:', event);
        db.close();
        resolve(false);
      };
    });
  } catch (error) {
    console.error('IndexedDB操作失败:', error);
    return false;
  }
};

const loadFromIndexedDB = async (): Promise<KBItem[]> => {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([KB_INDEXEDDB_STORE], 'readonly');
    const store = transaction.objectStore(KB_INDEXEDDB_STORE);
    const request = store.getAll();
    
    return new Promise((resolve) => {
      request.onsuccess = () => {
        db.close();
        resolve(request.result || []);
      };
      
      request.onerror = (event) => {
        console.error('从IndexedDB加载失败:', event);
        db.close();
        resolve([]);
      };
    });
  } catch (error) {
    console.error('IndexedDB操作失败:', error);
    return [];
  }
};

// 轻量解析器：立即支持 txt/csv/json；其余类型按需动态解析或存占位
async function extractText(file: File): Promise<{ text?: string; note?: string }> {
  const mime = (file.type || '').toLowerCase()
  const name = file.name.toLowerCase()

  // 纯文本族
  if (
    mime.startsWith('text/') ||
    name.endsWith('.txt') ||
    name.endsWith('.md') ||
    name.endsWith('.csv') ||
    name.endsWith('.json')
  ) {
    try {
      const raw = await readAsText(file)
      return { text: raw }
    } catch (e) {
      return { note: '读取文本失败' }
    }
  }

  // PDF（先尝试文本提取；若文本极少，回退到少量页面的OCR）
  if (mime === 'application/pdf' || name.endsWith('.pdf')) {
    try {
      const pdfjsLib: any = await import('pdfjs-dist')
      const ab = await readAsArrayBuffer(file)
      // 配置 worker：统一使用 CDN，避免模块对象赋值导致运行时错误
      try {
        ;(pdfjsLib as any).GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${(pdfjsLib as any).version}/pdf.worker.min.js`
      } catch {}
      const doc = await pdfjsLib.getDocument({ data: ab }).promise
      let full = ''
      for (let p = 1; p <= doc.numPages; p++) {
        const page = await doc.getPage(p)
        const content = await page.getTextContent()
        const text = content.items.map((it: any) => it.str || '').join(' ')
        full += (p > 1 ? '\n\n' : '') + text
      }
      const plain = (full || '').replace(/\s+/g, ' ').trim()

      // 如果文本极少（可能是扫描版PDF），尝试对前若干页做OCR回退
      if (plain.length < 50) {
        try {
          const Tesseract: any = await import('tesseract.js')
          const maxOcrPages = Math.min(doc.numPages, 8) // 为了性能限制到前8页
          let ocrAll = ''
          for (let p = 1; p <= maxOcrPages; p++) {
            const page = await doc.getPage(p)
            const viewport = page.getViewport({ scale: 2 })
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')
            if (!ctx) continue
            canvas.width = viewport.width
            canvas.height = viewport.height
            await page.render({ canvasContext: ctx, viewport }).promise
            const { data } = await Tesseract.recognize(canvas, 'eng+chi_sim')
            const t = String(data?.text || '').trim()
            if (t) ocrAll += (p > 1 ? '\n\n' : '') + t
          }
          if (ocrAll.trim().length > 0) {
            return { text: ocrAll, note: `通过OCR提取了前${maxOcrPages}页文本` }
          }
        } catch (e) {
          // OCR失败则继续返回原始提取
        }
      }

      return { text: full }
    } catch (e) {
      return { note: 'PDF 解析未启用（缺少依赖或运行环境限制）' }
    }
  }

  // DOCX（mammoth）
  if (name.endsWith('.docx')) {
    try {
      const mammoth: any = await import('mammoth/mammoth.browser')
      const ab = await readAsArrayBuffer(file)
      const result = await mammoth.convertToHtml({ arrayBuffer: ab })
      // 粗暴去标签
      const tmp = document.createElement('div')
      tmp.innerHTML = result.value
      const text = tmp.textContent || tmp.innerText || ''
      return { text }
    } catch (e) {
      return { note: 'DOCX 解析未启用（缺少依赖）' }
    }
  }

  // XLSX（xlsx -> CSV 文本）
  if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
    try {
      const XLSX: any = await import('xlsx')
      const ab = await readAsArrayBuffer(file)
      const wb = XLSX.read(ab, { type: 'array' })
      const sheets = wb.SheetNames
      const parts: string[] = []
      for (const s of sheets) {
        const ws = wb.Sheets[s]
        const csv = XLSX.utils.sheet_to_csv(ws)
        parts.push(`# ${s}\n${csv}`)
      }
      return { text: parts.join('\n\n') }
    } catch (e) {
      return { note: 'Excel 解析未启用（缺少依赖）' }
    }
  }

  // 图片 OCR（Tesseract）- 可选
  if (mime.startsWith('image/') || name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg')) {
    try {
      const Tesseract: any = await import('tesseract.js')
      const url = URL.createObjectURL(file)
      const { data } = await Tesseract.recognize(url, 'eng+chi_sim')
      URL.revokeObjectURL(url)
      return { text: data?.text || '', note: 'OCR 自动提取' }
    } catch (e) {
      return { note: 'OCR 未启用（缺少依赖）' }
    }
  }

  // 视频/其它格式：存元数据与备注
  if (mime.startsWith('video/') || name.endsWith('.mov') || name.endsWith('.mp4')) {
    return { note: '视频暂不自动转写音频，可添加手动摘要' }
  }

  return { note: '暂不支持的文件类型，已保存元数据' }
}

import PDFViewer from './PDFViewer'

const KnowledgeBase: React.FC<{ onItemsChange?: (items: KBItem[]) => void }> = ({ onItemsChange }) => {
  const [items, setItems] = useState<KBItem[]>([])
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [previewItem, setPreviewItem] = useState<KBItem | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isStorageAvailable, setIsStorageAvailable] = useState(true)
  const [storageType, setStorageType] = useState<'indexeddb' | 'localstorage' | 'sessionstorage' | 'memory'>('memory')

  // 检查存储可用性
  const checkStorageAvailability = useCallback(() => {
    // 检查IndexedDB
    try {
      if ('indexedDB' in window) {
        return 'indexeddb';
      }
    } catch (e) {
      console.warn('IndexedDB不可用:', e);
    }
    
    // 检查localStorage
    try {
      const testKey = `__storage_test_${Date.now()}`;
      localStorage.setItem(testKey, testKey);
      const value = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);
      if (value === testKey) {
        return 'localstorage';
      }
    } catch (e) {
      console.warn('localStorage不可用:', e);
    }
    
    // 检查sessionStorage
    try {
      const testKey = `__storage_test_${Date.now()}`;
      sessionStorage.setItem(testKey, testKey);
      const value = sessionStorage.getItem(testKey);
      sessionStorage.removeItem(testKey);
      if (value === testKey) {
        return 'sessionstorage';
      }
    } catch (e) {
      console.warn('sessionStorage不可用:', e);
    }
    
    // 所有存储方式都不可用
    return 'memory';
  }, []);

  // 载入
  useEffect(() => {
    const loadItems = async () => {
      setIsLoading(true);
      try {
        // 确定最佳存储方式
        const bestStorage = checkStorageAvailability();
        setStorageType(bestStorage);
        setIsStorageAvailable(bestStorage !== 'memory');
        console.log('使用存储类型:', bestStorage);
        
        let loadedItems: KBItem[] = [];
        
        // 按优先级尝试不同的存储方式
        if (bestStorage === 'indexeddb') {
          // 从IndexedDB加载
          loadedItems = await loadFromIndexedDB();
          console.log('从IndexedDB加载了', loadedItems.length, '个项目');
        }
        
        // 如果IndexedDB没有数据，尝试localStorage
        if (loadedItems.length === 0 && (bestStorage === 'indexeddb' || bestStorage === 'localstorage')) {
          try {
            const raw = localStorage.getItem(KB_STORAGE_KEY);
            if (raw) {
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed)) {
                loadedItems = parsed;
                console.log('从localStorage加载了', loadedItems.length, '个项目');
                
                // 如果从localStorage加载成功且IndexedDB可用，则同步到IndexedDB
                if (bestStorage === 'indexeddb') {
                  saveToIndexedDB(loadedItems).then(success => {
                    if (success) console.log('已同步项目到IndexedDB');
                  });
                }
              }
            }
          } catch (error) {
            console.error('从localStorage加载失败:', error);
          }
        }
        
        // 如果localStorage没有数据，尝试sessionStorage
        if (loadedItems.length === 0) {
          try {
            const backupRaw = sessionStorage.getItem(KB_SESSION_KEY);
            if (backupRaw) {
              const parsed = JSON.parse(backupRaw);
              if (Array.isArray(parsed)) {
                loadedItems = parsed;
                console.log('从sessionStorage加载了', loadedItems.length, '个项目');
              }
            }
          } catch (error) {
            console.error('从sessionStorage加载失败:', error);
          }
        }
        
        if (loadedItems.length > 0) {
          setItems(loadedItems);
          if (onItemsChange) onItemsChange(loadedItems);
          toast.success(`已加载${loadedItems.length}个知识库项目`);
        }
      } catch (error) {
        console.error('加载知识库项目失败:', error);
        toast.error('加载知识库失败，请刷新重试');
        setIsStorageAvailable(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadItems();
  }, [checkStorageAvailability, onItemsChange])

  // 持久化（优先使用IndexedDB，带容错/压缩，防止存储容量超限导致丢失）
  useEffect(() => {
    const saveItems = async () => {
      // 优先使用IndexedDB
      if (storageType === 'indexeddb') {
        const success = await saveToIndexedDB(items);
        if (success) {
          console.log('成功保存到IndexedDB');
          // 同时备份到localStorage和sessionStorage（如果可用）
          try {
            localStorage.setItem(KB_STORAGE_KEY, JSON.stringify(items));
            sessionStorage.setItem(KB_SESSION_KEY, JSON.stringify(items));
          } catch (e) {
            console.warn('备份到localStorage/sessionStorage失败，但IndexedDB已保存成功', e);
          }
          return;
        }
      }
      
      // 如果IndexedDB不可用或保存失败，回退到localStorage
      const trySaveLocal = (payload: KBItem[]) => localStorage.setItem(KB_STORAGE_KEY, JSON.stringify(payload))
      const trySaveSession = (payload: KBItem[]) => sessionStorage.setItem(KB_SESSION_KEY, JSON.stringify(payload))
      try {
        // 1) 直接保存
        try {
          trySaveLocal(items)
          try { trySaveSession(items) } catch {}
        } catch (e1) {
          // 2) 轻度压缩：移除过大的 dataUrl（>200k 字符）
          const lightCompact = items.map(it => {
            if (it?.dataUrl && it.dataUrl.length > 200_000) {
              const { dataUrl, ...rest } = it
              return rest as KBItem
            }
            return it
          })
          try {
            trySaveLocal(lightCompact)
            try { trySaveSession(lightCompact) } catch {}
            console.warn('[KB] 已压缩保存：为避免超过 localStorage 限制，移除了部分大文件预览。')
          } catch (e2) {
            // 3) 极限压缩：移除所有 dataUrl 预览字段
            const hardCompact = items.map(({ dataUrl, ...rest }) => rest as KBItem)
            try {
              trySaveLocal(hardCompact)
              try { trySaveSession(hardCompact) } catch {}
              console.warn('[KB] 已极限压缩保存：移除了全部预览以确保持久化。')
            } catch (e3) {
              console.error('[KB] 保存失败：localStorage 容量或权限问题。', e3)
              // 最后兜底：至少把当前内存中的内容备份到 sessionStorage，保证刷新仍在
              try { trySaveSession(items) } catch {}
            }
          }
        }
      } catch {}
    };
    
    if (items.length > 0) {
      saveItems();
    }
    onItemsChange?.(items);
  }, [items, onItemsChange, storageType])

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setIsLoading(true)
    const newItems: KBItem[] = []
    for (const file of Array.from(files)) {
      const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
      const base: KBItem = {
        id,
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified,
        createdAt: Date.now(),
        include: true,
      }
      let dataUrl: string | undefined = undefined
      // 对 PDF 小于 2MB 的，保存 base64 以支持后续预览（避免占满 localStorage）
      const lower = file.name.toLowerCase()
      if ((file.type === 'application/pdf' || lower.endsWith('.pdf')) && file.size <= 2 * 1024 * 1024) {
          try { 
            dataUrl = await readAsDataURL(file) 
            
            // 显示加载提示
            toast.loading(`正在自动处理PDF文件"${file.name}"...`, {
              id: `pdf-ocr-${id}`,
              duration: 10000
            })
            
            // 创建临时项目，稍后更新
            const tempItem: KBItem = {
              ...base,
              text: `[PDF文件: ${file.name}]\n\n正在自动提取文本，请稍候...\n\n文件大小: ${formatBytes(file.size)}\n上传时间: ${new Date().toLocaleString()}`,
              notes: '',
              dataUrl
            }
            
            // 先添加临时项目
            newItems.push(tempItem)
            
            // 异步处理OCR，完成后更新项目
            setTimeout(async () => {
              try {
                // 创建PDF查看器需要的环境
                const pdfjs = await (async () => {
                  if (typeof window === 'undefined') return null
                  if (window.pdfjsLib) return window.pdfjsLib
                  
                  // 动态加载PDF.js
                  const loadScript = (src: string): Promise<void> => {
                    return new Promise((resolve, reject) => {
                      const script = document.createElement('script')
                      script.src = src
                      script.onload = () => resolve()
                      script.onerror = () => reject(new Error(`加载脚本失败: ${src}`))
                      document.head.appendChild(script)
                    })
                  }
                  
                  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js')
                  if (!window.pdfjsLib) throw new Error('PDF.js库未正确加载')
                  window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js'
                  return window.pdfjsLib
                })()
                
                if (!pdfjs) throw new Error('无法加载PDF.js')
                
                // 加载PDF文档
                const loadingTask = pdfjs.getDocument({ url: dataUrl })
                const doc = await loadingTask.promise
                
                // 提取文本
                let extractedText = ''
                for (let i = 1; i <= Math.min(doc.numPages, 10); i++) {
                  try {
                    const page = await doc.getPage(i)
                    const content = await page.getTextContent()
                    const pageText = content.items.map((it: any) => it.str || '').join(' ')
                    extractedText += (i > 1 ? '\n\n' : '') + pageText
                  } catch (e) {
                    console.error(`提取第${i}页文本失败:`, e)
                  }
                }
                
                // 如果提取的文本太少，尝试OCR
                if (extractedText.trim().length < 100) {
                  toast.loading(`PDF文本较少，正在尝试OCR识别...`, {
                    id: `pdf-ocr-${id}`,
                    duration: 20000
                  })
                  
                  // 加载Tesseract
                  const Tesseract = await import('tesseract.js')
                  
                  // 创建canvas用于OCR
                  const c = document.createElement('canvas')
                  const ctx = c.getContext('2d')
                  if (!ctx) throw new Error('无法创建Canvas上下文')
                  
                  // 对前3页进行OCR
                  let ocrText = ''
                  for (let i = 1; i <= Math.min(doc.numPages, 3); i++) {
                    const page = await doc.getPage(i)
                    const viewport = page.getViewport({ scale: 2 })
                    c.width = viewport.width
                    c.height = viewport.height
                    await page.render({ canvasContext: ctx, viewport }).promise
                    
                    const { data } = await Tesseract.recognize(c, 'eng+chi_sim')
                    const t = String(data?.text || '').trim()
                    if (t) ocrText += (i > 1 ? '\n\n' : '') + t
                  }
                  
                  if (ocrText.trim().length > 0) {
                    extractedText = ocrText
                  }
                }
                
                // 更新项目
                if (extractedText.trim().length > 0) {
                  setItems(prev => prev.map(item => 
                    item.id === id 
                      ? { ...item, text: extractedText } 
                      : item
                  ))
                  toast.success(`PDF文件"${file.name}"文本提取成功`, {
                    id: `pdf-ocr-${id}`
                  })
                } else {
                  toast.error(`无法从PDF提取文本，请手动处理`, {
                    id: `pdf-ocr-${id}`
                  })
                }
              } catch (e) {
                console.error('自动OCR处理失败:', e)
                toast.error(`自动处理PDF失败，请手动提取文本`, {
                  id: `pdf-ocr-${id}`
                })
              }
            }, 500)
            
          } catch (e) {
            console.error('PDF处理失败:', e)
            // 如果自动处理失败，添加默认文本
            const pdfDefaultText = `[PDF文件: ${file.name}]\n\n此PDF已上传到知识库，但自动提取失败。请手动提取文本。\n\n文件大小: ${formatBytes(file.size)}\n上传时间: ${new Date().toLocaleString()}`
            const { note } = await extractText(file)
            newItems.push({ ...base, text: pdfDefaultText, notes: note, dataUrl })
          }
          continue // 跳过下面的处理
        }
        const { text, note } = await extractText(file)
      newItems.push({ ...base, text, notes: note, dataUrl })
    }
    setItems(prev => [...newItems, ...prev])
    setIsLoading(false)
  }, [])

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(false)
    handleFiles(e.dataTransfer.files)
  }
  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setDragOver(true) }
  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setDragOver(false) }

  const removeItem = (id: string) => setItems(prev => prev.filter(i => i.id !== id))

  const tryReparse = async (item: KBItem) => {
    // 仅在缺少文本时尝试
    const filePicker = document.createElement('input')
    filePicker.type = 'file'
    filePicker.accept = ''
    filePicker.onchange = async () => {
      const f = filePicker.files?.[0]
      if (!f) return
      const { text, note } = await extractText(f)
      setItems(prev => prev.map(it => it.id === item.id ? { ...it, text, notes: note } : it))
    }
    filePicker.click()
  }

  return (
    <section className="bg-white/70 border border-blue-200 rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-blue-700">知识库（上传文件以加入上下文）</h2>
        <div className="flex items-center gap-2">
          <button
            className="px-3 py-1.5 text-sm rounded border hover:bg-gray-50"
            onClick={() => fileInputRef.current?.click()}
          >选择文件</button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>
      </div>

      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={`border-2 border-dashed rounded-md p-6 text-center transition-colors ${dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'}`}
      >
        拖拽文件到此处，或点击“选择文件”上传。支持 PDF、Word、TXT、Excel、PNG、JPG、MOV 等。
      </div>

      <div className="mt-4">
        {items.length === 0 ? (
          <p className="text-sm text-gray-500">尚未上传文件。</p>
        ) : (
          <ul className="space-y-3 max-h-72 overflow-y-auto">
            {items.map(item => (
              <li key={item.id} className="border rounded-md p-3 bg-white">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-gray-800 truncate" title={item.name}>{item.name}</div>
                  <div className="text-xs text-gray-500">{item.type || '未知类型'} · {formatBytes(item.size)}</div>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <label className="inline-flex items-center gap-1 text-gray-600">
                    <input
                      type="checkbox"
                      checked={item.include !== false}
                      onChange={(e) => setItems(prev => prev.map(it => it.id === item.id ? { ...it, include: e.target.checked } : it))}
                    />
                    用于AI对话
                  </label>
                  {(item.dataUrl && (item.type === 'application/pdf' || item.name.toLowerCase().endsWith('.pdf'))) && (
                    <button className="underline text-blue-600" onClick={() => setPreviewItem(item)}>预览 PDF</button>
                  )}
                </div>
                {item.text ? (
                  <div className="mt-2 text-sm text-gray-700 whitespace-pre-wrap max-h-24 overflow-y-auto">
                    {item.text.slice(0, 1000)}{item.text.length > 1000 ? '…' : ''}
                  </div>
                ) : (
                  <div className="mt-2 text-sm text-gray-500 flex items-center gap-2">
                    <span>{item.notes || '尚未解析内容'}</span>
                    <button className="text-blue-600 underline text-xs" onClick={() => tryReparse(item)}>尝试解析</button>
                  </div>
                )}
                <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
                  <span>更新时间：{new Date(item.createdAt).toLocaleString('zh-CN')}</span>
                  <button className="underline hover:text-red-600" onClick={() => removeItem(item.id)}>删除</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {previewItem && previewItem.dataUrl && (
        <PDFViewer
          dataUrl={previewItem.dataUrl}
          name={previewItem.name}
          onClose={() => setPreviewItem(null)}
          onExtract={(text) => {
            setItems(prev => prev.map(it => it.id === previewItem.id ? { ...it, text } : it))
            setPreviewItem(null)
          }}
        />
      )}
    </section>
  )
}

export default KnowledgeBase