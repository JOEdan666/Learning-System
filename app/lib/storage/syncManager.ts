import {
  getSyncQueue,
  removeSyncQueueItem,
  setMetadata,
  getMetadata,
  type SyncQueueItem
} from './indexedDB'

export type SyncStatus = 'idle' | 'syncing' | 'offline' | 'error'
export type ConnectionStatus = 'online' | 'offline' | 'unknown'

interface SyncState {
  status: SyncStatus
  lastSyncAt: number | null
  pendingCount: number
  connectionStatus: ConnectionStatus
  error: string | null
}

type SyncListener = (state: SyncState) => void

class SyncManager {
  private listeners: Set<SyncListener> = new Set()
  private state: SyncState = {
    status: 'idle',
    lastSyncAt: null,
    pendingCount: 0,
    connectionStatus: 'unknown',
    error: null
  }
  private syncInterval: NodeJS.Timeout | null = null
  private isInitialized = false

  async initialize(): Promise<void> {
    if (this.isInitialized || typeof window === 'undefined') return

    this.isInitialized = true

    // Check connection status
    this.updateConnectionStatus()

    // Listen for online/offline events
    window.addEventListener('online', () => this.handleOnline())
    window.addEventListener('offline', () => this.handleOffline())

    // Load last sync time
    const lastSync = await getMetadata<number>('lastSyncAt')
    if (lastSync) {
      this.state.lastSyncAt = lastSync
    }

    // Start periodic sync (every 30 seconds when online)
    this.startPeriodicSync()

    // Initial sync check
    await this.checkPendingItems()
  }

  private updateConnectionStatus(): void {
    if (typeof navigator === 'undefined') {
      this.state.connectionStatus = 'unknown'
      return
    }
    this.state.connectionStatus = navigator.onLine ? 'online' : 'offline'
  }

  private handleOnline(): void {
    this.state.connectionStatus = 'online'
    this.state.error = null
    this.notifyListeners()
    // Trigger sync when coming online
    this.sync()
  }

  private handleOffline(): void {
    this.state.connectionStatus = 'offline'
    this.state.status = 'offline'
    this.notifyListeners()
  }

  private startPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
    }

    this.syncInterval = setInterval(async () => {
      if (this.state.connectionStatus === 'online' && this.state.status !== 'syncing') {
        await this.checkPendingItems()
        if (this.state.pendingCount > 0) {
          await this.sync()
        }
      }
    }, 30000) // 30 seconds
  }

  private async checkPendingItems(): Promise<void> {
    try {
      const queue = await getSyncQueue()
      this.state.pendingCount = queue.length
      this.notifyListeners()
    } catch (e) {
      console.error('Failed to check pending items:', e)
    }
  }

  async sync(): Promise<boolean> {
    if (this.state.connectionStatus !== 'online') {
      this.state.status = 'offline'
      this.notifyListeners()
      return false
    }

    if (this.state.status === 'syncing') {
      return false
    }

    this.state.status = 'syncing'
    this.state.error = null
    this.notifyListeners()

    try {
      const queue = await getSyncQueue()

      if (queue.length === 0) {
        this.state.status = 'idle'
        this.notifyListeners()
        return true
      }

      // Process queue items
      const results = await this.processSyncQueue(queue)

      // Remove successful items
      for (const { item, success } of results) {
        if (success) {
          await removeSyncQueueItem(item.id)
        }
      }

      // Update state
      const successCount = results.filter(r => r.success).length
      const failCount = results.filter(r => !r.success).length

      if (failCount === 0) {
        this.state.status = 'idle'
        this.state.lastSyncAt = Date.now()
        await setMetadata('lastSyncAt', this.state.lastSyncAt)
      } else {
        this.state.status = 'error'
        this.state.error = `${failCount} 项同步失败`
      }

      await this.checkPendingItems()
      this.notifyListeners()

      return failCount === 0
    } catch (e) {
      console.error('Sync failed:', e)
      this.state.status = 'error'
      this.state.error = e instanceof Error ? e.message : '同步失败'
      this.notifyListeners()
      return false
    }
  }

  private async processSyncQueue(queue: SyncQueueItem[]): Promise<{ item: SyncQueueItem; success: boolean }[]> {
    const results: { item: SyncQueueItem; success: boolean }[] = []

    // Group by type for batch processing
    const noteItems = queue.filter(q => q.type === 'note')
    const questionItems = queue.filter(q => q.type === 'wrongQuestion')

    // Process notes
    if (noteItems.length > 0) {
      try {
        const response = await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'notes',
            items: noteItems.map(item => ({
              operation: item.operation,
              recordId: item.recordId,
              data: item.data
            }))
          })
        })

        if (response.ok) {
          noteItems.forEach(item => results.push({ item, success: true }))
        } else {
          noteItems.forEach(item => results.push({ item, success: false }))
        }
      } catch {
        noteItems.forEach(item => results.push({ item, success: false }))
      }
    }

    // Process wrong questions
    if (questionItems.length > 0) {
      try {
        const response = await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'wrongQuestions',
            items: questionItems.map(item => ({
              operation: item.operation,
              recordId: item.recordId,
              data: item.data
            }))
          })
        })

        if (response.ok) {
          questionItems.forEach(item => results.push({ item, success: true }))
        } else {
          questionItems.forEach(item => results.push({ item, success: false }))
        }
      } catch {
        questionItems.forEach(item => results.push({ item, success: false }))
      }
    }

    return results
  }

  getState(): SyncState {
    return { ...this.state }
  }

  subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener)
    // Send current state immediately
    listener(this.getState())

    return () => {
      this.listeners.delete(listener)
    }
  }

  private notifyListeners(): void {
    const state = this.getState()
    this.listeners.forEach(listener => listener(state))
  }

  destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', () => this.handleOnline())
      window.removeEventListener('offline', () => this.handleOffline())
    }
    this.listeners.clear()
    this.isInitialized = false
  }
}

// Singleton instance
export const syncManager = new SyncManager()

// React hook for sync state
export function useSyncState(): SyncState {
  if (typeof window === 'undefined') {
    return {
      status: 'idle',
      lastSyncAt: null,
      pendingCount: 0,
      connectionStatus: 'unknown',
      error: null
    }
  }

  // This is a placeholder - will be properly implemented with React hooks
  return syncManager.getState()
}
