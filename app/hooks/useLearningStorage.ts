'use client'

import { useCallback, useEffect, useMemo, useState, useRef } from 'react'
import { toast } from 'react-hot-toast'
import type { LearningItem } from '../types'

const STORAGE_KEY = 'learning_system_items'
const STORAGE_VERSION_KEY = 'learning_system_version'
const STORAGE_BACKUP_KEY = `${STORAGE_KEY}_backup`
const CURRENT_VERSION = '2.0.0'
const MAX_ITEMS = 500
const DEBOUNCE_MS = 500 // Debounce delay for localStorage writes

const isValidItem = (item: any): item is LearningItem => {
  return (
    item &&
    typeof item.id === 'string' &&
    typeof item.text === 'string' &&
    typeof item.subject === 'string' &&
    typeof item.createdAt === 'string'
  )
}

const validateItems = (items: any): items is LearningItem[] => {
  return Array.isArray(items) && items.every(isValidItem)
}

const checkStorage = (): boolean => {
  try {
    const testKey = `__storage_test_${Date.now()}`
    localStorage.setItem(testKey, testKey)
    const ok = localStorage.getItem(testKey) === testKey
    localStorage.removeItem(testKey)
    return ok
  } catch {
    return false
  }
}

const readJson = (raw: string | null) => {
  try {
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export const useLearningStorage = () => {
  const [savedItems, setSavedItems] = useState<LearningItem[]>([])
  const [isStorageAvailable, setIsStorageAvailable] = useState(true)
  const [lastSavedTime, setLastSavedTime] = useState<string>('')

  // Ref for debounce timeout management
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const available = checkStorage()
    setIsStorageAvailable(available)

    const stored = readJson(localStorage.getItem(STORAGE_KEY))
    const storedVersion = localStorage.getItem(STORAGE_VERSION_KEY)

    if (validateItems(stored)) {
      setSavedItems(stored.slice(-MAX_ITEMS))
    } else {
      const backup = readJson(localStorage.getItem(STORAGE_BACKUP_KEY))
      if (validateItems(backup)) {
        setSavedItems(backup.slice(-MAX_ITEMS))
      }
    }

    if (available && storedVersion !== CURRENT_VERSION) {
      localStorage.setItem(STORAGE_VERSION_KEY, CURRENT_VERSION)
    }
  }, [])

  // Debounced persist function to prevent UI jank during rapid updates
  const persistItems = useCallback(
    (items: LearningItem[]) => {
      if (!isStorageAvailable) return

      // Clear any pending debounced write
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }

      // Schedule debounced write
      debounceTimeoutRef.current = setTimeout(() => {
        try {
          const payload = JSON.stringify(items.slice(-MAX_ITEMS))
          localStorage.setItem(STORAGE_BACKUP_KEY, payload)
          localStorage.setItem(STORAGE_KEY, payload)
          localStorage.setItem(STORAGE_VERSION_KEY, CURRENT_VERSION)
          setLastSavedTime(new Date().toLocaleTimeString())
        } catch (error) {
          console.warn('Failed to persist items to localStorage:', error)
        }
      }, DEBOUNCE_MS)
    },
    [isStorageAvailable]
  )

  // Cleanup debounce timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (savedItems.length === 0) {
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem(STORAGE_BACKUP_KEY)
      return
    }
    persistItems(savedItems)
  }, [persistItems, savedItems])

  const addItem = useCallback((item: LearningItem) => {
    setSavedItems(prev => [...prev, item].slice(-MAX_ITEMS))
  }, [])

  const deleteItem = useCallback((index: number) => {
    setSavedItems(prev => prev.filter((_, i) => i !== index))
  }, [])

  const clearAll = useCallback(() => {
    setSavedItems([])
    if (isStorageAvailable) {
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem(STORAGE_BACKUP_KEY)
      localStorage.removeItem(STORAGE_VERSION_KEY)
    }
  }, [isStorageAvailable])

  const exportItems = useCallback(() => {
    if (savedItems.length === 0) {
      toast('没有可导出的内容')
      return
    }
    const blob = new Blob([JSON.stringify(savedItems, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `learning-items-${Date.now()}.json`
    link.click()
    URL.revokeObjectURL(url)
    toast.success('已导出学习记录')
  }, [savedItems])

  const importItems = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || ''))
        if (!validateItems(parsed)) {
          throw new Error('文件格式不正确')
        }
        setSavedItems(prev => {
          const merged = [...prev, ...parsed]
          const unique = Array.from(
            new Map(merged.map(item => [item.id, item])).values()
          )
          return unique.slice(-MAX_ITEMS)
        })
        toast.success('已导入学习记录')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : '导入失败')
      }
    }
    reader.onerror = () => toast.error('读取文件失败')
    reader.readAsText(file)
  }, [])

  const stats = useMemo(
    () => ({
      count: savedItems.length,
      lastSavedTime,
      isStorageAvailable,
    }),
    [isStorageAvailable, lastSavedTime, savedItems.length]
  )

  return {
    savedItems,
    setSavedItems,
    addItem,
    deleteItem,
    clearAll,
    exportItems,
    importItems,
    stats,
  }
}
