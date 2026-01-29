'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useDebouncedCallback } from './useDebounce'

interface UseLocalStorageOptions<T> {
  /** Debounce delay in ms (default: 500) */
  debounceMs?: number
  /** Custom serializer function */
  serializer?: (value: T) => string
  /** Custom deserializer function */
  deserializer?: (value: string) => T
  /** Callback when storage error occurs */
  onError?: (error: Error) => void
}

/**
 * useLocalStorage - Generic hook for localStorage with debouncing
 *
 * Features:
 * - Type-safe with generics
 * - Built-in debouncing (500ms default) to prevent UI jank
 * - SSR-safe (only accesses localStorage on client)
 * - Cross-tab synchronization via storage event
 * - Custom serializer/deserializer support
 * - Error handling with callback
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options: UseLocalStorageOptions<T> = {}
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const {
    debounceMs = 500,
    serializer = JSON.stringify,
    deserializer = JSON.parse,
    onError
  } = options

  // Track if we're mounted (for SSR safety)
  const isMounted = useRef(false)

  // Initialize state
  const [storedValue, setStoredValue] = useState<T>(() => {
    // SSR: return initial value
    if (typeof window === 'undefined') {
      return initialValue
    }

    try {
      const item = window.localStorage.getItem(key)
      return item ? deserializer(item) : initialValue
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error)
      onError?.(error as Error)
      return initialValue
    }
  })

  // Debounced persist function
  const debouncedPersist = useDebouncedCallback((value: T) => {
    if (typeof window === 'undefined') return

    try {
      window.localStorage.setItem(key, serializer(value))
    } catch (error) {
      console.warn(`Error writing to localStorage key "${key}":`, error)
      onError?.(error as Error)
    }
  }, debounceMs)

  // Set value with debounced persistence
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value
        setStoredValue(valueToStore)
        debouncedPersist(valueToStore)
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error)
        onError?.(error as Error)
      }
    },
    [key, storedValue, debouncedPersist, onError]
  )

  // Remove value from storage
  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue)
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key)
      }
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error)
      onError?.(error as Error)
    }
  }, [key, initialValue, onError])

  // Sync with other tabs via storage event
  useEffect(() => {
    isMounted.current = true

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(deserializer(e.newValue))
        } catch (error) {
          console.warn(`Error parsing storage event for key "${key}":`, error)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => {
      isMounted.current = false
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [key, deserializer])

  return [storedValue, setValue, removeValue]
}

/**
 * Check if localStorage is available
 */
export function isLocalStorageAvailable(): boolean {
  if (typeof window === 'undefined') return false

  try {
    const testKey = '__storage_test__'
    window.localStorage.setItem(testKey, testKey)
    const result = window.localStorage.getItem(testKey) === testKey
    window.localStorage.removeItem(testKey)
    return result
  } catch {
    return false
  }
}

export default useLocalStorage
