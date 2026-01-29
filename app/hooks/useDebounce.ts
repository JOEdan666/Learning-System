'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * useDebounce - Debounce a value
 * Returns the debounced value that only updates after the specified delay
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * useDebouncedCallback - Debounce a callback function
 * Returns a debounced version of the callback that delays execution
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 500
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const callbackRef = useRef(callback)

  // Keep callback ref updated
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args)
      }, delay)
    },
    [delay]
  )

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return debouncedCallback
}

/**
 * useThrottle - Throttle a value
 * Returns a throttled value that only updates at most once per interval
 */
export function useThrottle<T>(value: T, interval: number = 500): T {
  const [throttledValue, setThrottledValue] = useState<T>(value)
  const lastExecuted = useRef<number>(Date.now())

  useEffect(() => {
    if (Date.now() >= lastExecuted.current + interval) {
      lastExecuted.current = Date.now()
      setThrottledValue(value)
    } else {
      const timer = setTimeout(() => {
        lastExecuted.current = Date.now()
        setThrottledValue(value)
      }, interval)

      return () => clearTimeout(timer)
    }
  }, [value, interval])

  return throttledValue
}

export default useDebounce
