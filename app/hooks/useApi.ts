'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { toast } from 'react-hot-toast'

interface UseApiOptions<T> {
  /** Show toast on success */
  showSuccessToast?: boolean
  /** Show toast on error */
  showErrorToast?: boolean
  /** Success message */
  successMessage?: string
  /** Custom error message (overrides API error) */
  errorMessage?: string
  /** Transform response data */
  transform?: (data: any) => T
  /** Callback on success */
  onSuccess?: (data: T) => void
  /** Callback on error */
  onError?: (error: Error) => void
  /** Initial data */
  initialData?: T
  /** Cache key for request deduplication */
  cacheKey?: string
  /** Cache TTL in ms */
  cacheTTL?: number
}

interface UseApiState<T> {
  data: T | null
  isLoading: boolean
  error: Error | null
  isSuccess: boolean
}

interface UseApiReturn<T> extends UseApiState<T> {
  execute: (...args: any[]) => Promise<T | null>
  reset: () => void
  setData: (data: T | null) => void
}

// Simple in-memory cache
const apiCache = new Map<string, { data: any; timestamp: number }>()

/**
 * useApi - Generic hook for API calls with loading/error states
 *
 * Features:
 * - Loading and error state management
 * - Toast notifications for success/error
 * - Response transformation
 * - Request deduplication with caching
 * - Automatic cleanup on unmount
 */
export function useApi<T>(
  apiFn: (...args: any[]) => Promise<Response | T>,
  options: UseApiOptions<T> = {}
): UseApiReturn<T> {
  const {
    showSuccessToast = false,
    showErrorToast = true,
    successMessage = '操作成功',
    errorMessage,
    transform,
    onSuccess,
    onError,
    initialData = null,
    cacheKey,
    cacheTTL = 30000 // 30 seconds default
  } = options

  const [state, setState] = useState<UseApiState<T>>({
    data: initialData as T | null,
    isLoading: false,
    error: null,
    isSuccess: false
  })

  const isMounted = useRef(true)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Cleanup on unmount
  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
      abortControllerRef.current?.abort()
    }
  }, [])

  const execute = useCallback(
    async (...args: any[]): Promise<T | null> => {
      // Check cache first
      if (cacheKey) {
        const cached = apiCache.get(cacheKey)
        if (cached && Date.now() - cached.timestamp < cacheTTL) {
          if (isMounted.current) {
            setState(prev => ({
              ...prev,
              data: cached.data,
              isSuccess: true
            }))
          }
          return cached.data
        }
      }

      // Abort previous request
      abortControllerRef.current?.abort()
      abortControllerRef.current = new AbortController()

      setState(prev => ({
        ...prev,
        isLoading: true,
        error: null,
        isSuccess: false
      }))

      try {
        const result = await apiFn(...args)

        let data: T

        // Handle Response object
        if (result instanceof Response) {
          if (!result.ok) {
            const errorData = await result.json().catch(() => ({}))
            throw new Error(errorData.error || errorData.message || `HTTP error ${result.status}`)
          }
          const jsonData = await result.json()
          data = transform ? transform(jsonData) : jsonData
        } else {
          data = transform ? transform(result) : (result as T)
        }

        // Update cache
        if (cacheKey) {
          apiCache.set(cacheKey, { data, timestamp: Date.now() })
        }

        if (isMounted.current) {
          setState({
            data,
            isLoading: false,
            error: null,
            isSuccess: true
          })

          if (showSuccessToast) {
            toast.success(successMessage)
          }

          onSuccess?.(data)
        }

        return data
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))

        // Ignore abort errors
        if (error.name === 'AbortError') {
          return null
        }

        if (isMounted.current) {
          setState(prev => ({
            ...prev,
            isLoading: false,
            error,
            isSuccess: false
          }))

          if (showErrorToast) {
            toast.error(errorMessage || error.message || '操作失败')
          }

          onError?.(error)
        }

        return null
      }
    },
    [apiFn, cacheKey, cacheTTL, errorMessage, onError, onSuccess, showErrorToast, showSuccessToast, successMessage, transform]
  )

  const reset = useCallback(() => {
    setState({
      data: initialData as T | null,
      isLoading: false,
      error: null,
      isSuccess: false
    })
  }, [initialData])

  const setData = useCallback((data: T | null) => {
    setState(prev => ({ ...prev, data }))
  }, [])

  return {
    ...state,
    execute,
    reset,
    setData
  }
}

/**
 * Invalidate cached data by key or pattern
 */
export function invalidateApiCache(keyOrPattern?: string | RegExp): void {
  if (!keyOrPattern) {
    apiCache.clear()
    return
  }

  if (typeof keyOrPattern === 'string') {
    apiCache.delete(keyOrPattern)
  } else {
    for (const key of apiCache.keys()) {
      if (keyOrPattern.test(key)) {
        apiCache.delete(key)
      }
    }
  }
}

/**
 * Prefetch and cache API data
 */
export async function prefetchApi<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 30000
): Promise<T> {
  const cached = apiCache.get(key)
  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.data
  }

  const data = await fetcher()
  apiCache.set(key, { data, timestamp: Date.now() })
  return data
}

export default useApi
