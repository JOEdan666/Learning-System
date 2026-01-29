import { openDB, DBSchema, IDBPDatabase } from 'idb'
import type { WrongQuestion } from '@/app/types/wrongQuestion'
import type { Block } from '@/app/types/block'

// Database schema definition
interface SelfLearningDB extends DBSchema {
  notes: {
    key: string
    value: NoteRecord
    indexes: {
      'by-updated': number
      'by-favorite': number
      'by-archived': number
    }
  }
  wrongQuestions: {
    key: string
    value: WrongQuestion
    indexes: {
      'by-subject': string
      'by-nextReview': number
      'by-status': string
      'by-updated': number
    }
  }
  blocks: {
    key: string
    value: Block & { noteId: string }
    indexes: {
      'by-note': string
      'by-order': [string, number]
    }
  }
  syncQueue: {
    key: string
    value: SyncQueueItem
    indexes: {
      'by-timestamp': number
      'by-type': string
    }
  }
  metadata: {
    key: string
    value: MetadataRecord
  }
}

// Note record type
export interface NoteRecord {
  id: string
  title: string
  icon?: string
  cover?: string
  backlinks: string[]
  forwardLinks: string[]
  knowledgePoints: string[]
  relatedQuestions: string[]
  tags: string[]
  template?: string
  color: string
  isFavorite: boolean
  isArchived: boolean
  createdAt: number
  updatedAt: number
  // Sync metadata
  syncStatus: 'pending' | 'synced' | 'conflict'
  localVersion: number
  serverVersion?: number
}

// Sync queue item
export interface SyncQueueItem {
  id: string
  type: 'note' | 'wrongQuestion' | 'block'
  operation: 'create' | 'update' | 'delete'
  recordId: string
  data?: unknown
  timestamp: number
  retryCount: number
}

// Metadata record
export interface MetadataRecord {
  key: string
  value: string | number | boolean | object
  updatedAt: number
}

const DB_NAME = 'self_learning_db'
const DB_VERSION = 1

let dbPromise: Promise<IDBPDatabase<SelfLearningDB>> | null = null

// Initialize database
export async function getDB(): Promise<IDBPDatabase<SelfLearningDB>> {
  if (typeof window === 'undefined') {
    throw new Error('IndexedDB is only available in browser')
  }

  if (!dbPromise) {
    dbPromise = openDB<SelfLearningDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion, transaction) {
        // Notes store
        if (!db.objectStoreNames.contains('notes')) {
          const noteStore = db.createObjectStore('notes', { keyPath: 'id' })
          noteStore.createIndex('by-updated', 'updatedAt')
          noteStore.createIndex('by-favorite', 'isFavorite')
          noteStore.createIndex('by-archived', 'isArchived')
        }

        // Wrong Questions store
        if (!db.objectStoreNames.contains('wrongQuestions')) {
          const wqStore = db.createObjectStore('wrongQuestions', { keyPath: 'id' })
          wqStore.createIndex('by-subject', 'subject')
          wqStore.createIndex('by-nextReview', 'nextReviewAt')
          wqStore.createIndex('by-status', 'status')
          wqStore.createIndex('by-updated', 'updatedAt')
        }

        // Blocks store
        if (!db.objectStoreNames.contains('blocks')) {
          const blockStore = db.createObjectStore('blocks', { keyPath: 'id' })
          blockStore.createIndex('by-note', 'noteId')
          blockStore.createIndex('by-order', ['noteId', 'order'])
        }

        // Sync Queue store
        if (!db.objectStoreNames.contains('syncQueue')) {
          const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id' })
          syncStore.createIndex('by-timestamp', 'timestamp')
          syncStore.createIndex('by-type', 'type')
        }

        // Metadata store
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' })
        }
      }
    })
  }

  return dbPromise
}

// ===== Notes Operations =====

export async function getAllNotes(): Promise<NoteRecord[]> {
  const db = await getDB()
  return db.getAllFromIndex('notes', 'by-updated')
}

export async function getNoteById(id: string): Promise<NoteRecord | undefined> {
  const db = await getDB()
  return db.get('notes', id)
}

export async function saveNote(note: NoteRecord): Promise<void> {
  const db = await getDB()
  note.updatedAt = Date.now()
  note.syncStatus = 'pending'
  note.localVersion = (note.localVersion || 0) + 1
  await db.put('notes', note)
  await addToSyncQueue('note', 'update', note.id, note)
}

export async function deleteNote(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('notes', id)
  // Also delete associated blocks
  const blocks = await db.getAllFromIndex('blocks', 'by-note', id)
  const tx = db.transaction('blocks', 'readwrite')
  await Promise.all(blocks.map(b => tx.store.delete(b.id)))
  await tx.done
  await addToSyncQueue('note', 'delete', id)
}

export async function getFavoriteNotes(): Promise<NoteRecord[]> {
  const db = await getDB()
  const all = await db.getAllFromIndex('notes', 'by-favorite')
  return all.filter(n => n.isFavorite && !n.isArchived)
}

// ===== Wrong Questions Operations =====

export async function getAllWrongQuestions(): Promise<WrongQuestion[]> {
  const db = await getDB()
  return db.getAllFromIndex('wrongQuestions', 'by-updated')
}

export async function getWrongQuestionById(id: string): Promise<WrongQuestion | undefined> {
  const db = await getDB()
  return db.get('wrongQuestions', id)
}

export async function saveWrongQuestion(question: WrongQuestion): Promise<void> {
  const db = await getDB()
  question.updatedAt = Date.now()
  question.syncStatus = 'pending'
  question.localVersion = (question.localVersion || 0) + 1
  await db.put('wrongQuestions', question)
  await addToSyncQueue('wrongQuestion', 'update', question.id, question)
}

export async function deleteWrongQuestion(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('wrongQuestions', id)
  await addToSyncQueue('wrongQuestion', 'delete', id)
}

export async function getDueWrongQuestions(referenceTime = Date.now()): Promise<WrongQuestion[]> {
  const db = await getDB()
  const all = await db.getAllFromIndex('wrongQuestions', 'by-nextReview')
  return all.filter(q => q.status === 'active' && q.nextReviewAt <= referenceTime)
}

export async function getWrongQuestionsBySubject(subject: string): Promise<WrongQuestion[]> {
  const db = await getDB()
  return db.getAllFromIndex('wrongQuestions', 'by-subject', subject)
}

// ===== Blocks Operations =====

export async function getBlocksByNoteId(noteId: string): Promise<(Block & { noteId: string })[]> {
  const db = await getDB()
  const blocks = await db.getAllFromIndex('blocks', 'by-note', noteId)
  return blocks.sort((a, b) => a.order - b.order)
}

export async function saveBlock(block: Block & { noteId: string }): Promise<void> {
  const db = await getDB()
  block.updatedAt = Date.now()
  await db.put('blocks', block)
}

export async function saveBlocks(blocks: (Block & { noteId: string })[]): Promise<void> {
  const db = await getDB()
  const tx = db.transaction('blocks', 'readwrite')
  const now = Date.now()
  await Promise.all(
    blocks.map(block => {
      block.updatedAt = now
      return tx.store.put(block)
    })
  )
  await tx.done
}

export async function deleteBlock(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('blocks', id)
}

export async function deleteBlocksByNoteId(noteId: string): Promise<void> {
  const db = await getDB()
  const blocks = await db.getAllFromIndex('blocks', 'by-note', noteId)
  const tx = db.transaction('blocks', 'readwrite')
  await Promise.all(blocks.map(b => tx.store.delete(b.id)))
  await tx.done
}

// ===== Sync Queue Operations =====

async function addToSyncQueue(
  type: SyncQueueItem['type'],
  operation: SyncQueueItem['operation'],
  recordId: string,
  data?: unknown
): Promise<void> {
  const db = await getDB()
  const item: SyncQueueItem = {
    id: `${type}_${recordId}_${Date.now()}`,
    type,
    operation,
    recordId,
    data,
    timestamp: Date.now(),
    retryCount: 0
  }
  await db.put('syncQueue', item)
}

export async function getSyncQueue(): Promise<SyncQueueItem[]> {
  const db = await getDB()
  return db.getAllFromIndex('syncQueue', 'by-timestamp')
}

export async function removeSyncQueueItem(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('syncQueue', id)
}

export async function clearSyncQueue(): Promise<void> {
  const db = await getDB()
  await db.clear('syncQueue')
}

// ===== Metadata Operations =====

export async function getMetadata<T>(key: string): Promise<T | undefined> {
  const db = await getDB()
  const record = await db.get('metadata', key)
  return record?.value as T | undefined
}

export async function setMetadata(key: string, value: unknown): Promise<void> {
  const db = await getDB()
  await db.put('metadata', {
    key,
    value,
    updatedAt: Date.now()
  } as MetadataRecord)
}

// ===== Batch Operations =====

export async function batchSaveNotes(notes: NoteRecord[]): Promise<void> {
  const db = await getDB()
  const tx = db.transaction('notes', 'readwrite')
  const now = Date.now()
  await Promise.all(
    notes.map(note => {
      note.updatedAt = now
      note.syncStatus = 'pending'
      note.localVersion = (note.localVersion || 0) + 1
      return tx.store.put(note)
    })
  )
  await tx.done
}

export async function batchSaveWrongQuestions(questions: WrongQuestion[]): Promise<void> {
  const db = await getDB()
  const tx = db.transaction('wrongQuestions', 'readwrite')
  const now = Date.now()
  await Promise.all(
    questions.map(q => {
      q.updatedAt = now
      q.syncStatus = 'pending'
      q.localVersion = (q.localVersion || 0) + 1
      return tx.store.put(q)
    })
  )
  await tx.done
}

// ===== Migration from localStorage =====

export async function migrateFromLocalStorage(): Promise<{
  migratedNotes: number
  migratedQuestions: number
}> {
  if (typeof window === 'undefined') return { migratedNotes: 0, migratedQuestions: 0 }

  let migratedNotes = 0
  let migratedQuestions = 0

  // Migrate wrong questions
  try {
    const wqRaw = localStorage.getItem('wrong_questions_v1')
    if (wqRaw) {
      const oldQuestions = JSON.parse(wqRaw)
      if (Array.isArray(oldQuestions) && oldQuestions.length > 0) {
        const questions: WrongQuestion[] = oldQuestions.map((q: Record<string, unknown>) => ({
          id: q.id as string,
          subject: q.subject as string,
          question: q.question as string,
          correctAnswer: q.correctAnswer as string | undefined,
          userAnswer: q.userAnswer as string | undefined,
          analysis: q.analysis as string | undefined,
          source: q.source as string | undefined,
          tags: (q.tags as string[]) || [],
          imageUrls: [],
          answerImageUrls: [],
          knowledgePoints: [],
          relatedNotes: [],
          relatedQuestions: [],
          stage: (q.stage as number) || 0,
          nextReviewAt: (q.nextReviewAt as number) || Date.now(),
          lastReviewedAt: q.lastReviewedAt as number | undefined,
          reviewHistory: [],
          reviewCount: 0,
          status: (q.status as WrongQuestion['status']) || 'active',
          isFavorite: false,
          createdAt: (q.createdAt as number) || Date.now(),
          updatedAt: Date.now(),
          syncStatus: 'pending',
          localVersion: 1
        }))
        await batchSaveWrongQuestions(questions)
        migratedQuestions = questions.length
        // Mark as migrated
        await setMetadata('wq_migrated_from_localstorage', true)
      }
    }
  } catch (e) {
    console.error('Failed to migrate wrong questions:', e)
  }

  // Migrate notes
  try {
    const notesRaw = localStorage.getItem('learning_notes')
    if (notesRaw) {
      const oldNotes = JSON.parse(notesRaw)
      if (Array.isArray(oldNotes) && oldNotes.length > 0) {
        const notes: NoteRecord[] = oldNotes.map((n: Record<string, unknown>) => ({
          id: n.id as string,
          title: (n.title as string) || '未命名',
          icon: undefined,
          cover: undefined,
          backlinks: [],
          forwardLinks: [],
          knowledgePoints: [],
          relatedQuestions: [],
          tags: (n.tags as string[]) || [],
          template: undefined,
          color: (n.color as string) || '#3b82f6',
          isFavorite: false,
          isArchived: false,
          createdAt: n.createdAt ? new Date(n.createdAt as string).getTime() : Date.now(),
          updatedAt: Date.now(),
          syncStatus: 'pending',
          localVersion: 1
        }))
        await batchSaveNotes(notes)
        migratedNotes = notes.length
        await setMetadata('notes_migrated_from_localstorage', true)
      }
    }
  } catch (e) {
    console.error('Failed to migrate notes:', e)
  }

  return { migratedNotes, migratedQuestions }
}

// Check if migration is needed
export async function needsMigration(): Promise<boolean> {
  const wqMigrated = await getMetadata<boolean>('wq_migrated_from_localstorage')
  const notesMigrated = await getMetadata<boolean>('notes_migrated_from_localstorage')

  if (wqMigrated && notesMigrated) return false

  if (typeof window === 'undefined') return false

  const hasLocalWq = !!localStorage.getItem('wrong_questions_v1')
  const hasLocalNotes = !!localStorage.getItem('learning_notes')

  return hasLocalWq || hasLocalNotes
}
