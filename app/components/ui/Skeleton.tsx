'use client'

import React from 'react'

interface SkeletonProps {
  className?: string
  width?: string | number
  height?: string | number
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full'
  animate?: boolean
}

/**
 * Base Skeleton component with shimmer animation
 */
export function Skeleton({
  className = '',
  width,
  height,
  rounded = 'md',
  animate = true
}: SkeletonProps) {
  const roundedClasses = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full'
  }

  const style: React.CSSProperties = {}
  if (width) style.width = typeof width === 'number' ? `${width}px` : width
  if (height) style.height = typeof height === 'number' ? `${height}px` : height

  return (
    <div
      className={`
        bg-gray-200
        ${roundedClasses[rounded]}
        ${animate ? 'animate-pulse' : ''}
        ${className}
      `}
      style={style}
    />
  )
}

/**
 * Text skeleton - mimics a line of text
 */
export function SkeletonText({
  lines = 1,
  className = '',
  lastLineWidth = '60%'
}: {
  lines?: number
  className?: string
  lastLineWidth?: string
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height={16}
          width={i === lines - 1 && lines > 1 ? lastLineWidth : '100%'}
          rounded="sm"
        />
      ))}
    </div>
  )
}

/**
 * Avatar skeleton
 */
export function SkeletonAvatar({
  size = 40,
  className = ''
}: {
  size?: number
  className?: string
}) {
  return (
    <Skeleton
      width={size}
      height={size}
      rounded="full"
      className={className}
    />
  )
}

/**
 * Session card skeleton - for learning history
 */
export function SessionCardSkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-3 flex-1">
          {/* Title row */}
          <div className="flex items-center gap-3">
            <Skeleton height={24} width="40%" rounded="md" />
            <Skeleton height={20} width={60} rounded="full" />
          </div>
          {/* Meta row */}
          <div className="flex items-center gap-4">
            <Skeleton height={14} width={60} rounded="sm" />
            <Skeleton height={14} width={60} rounded="sm" />
            <Skeleton height={14} width={100} rounded="sm" />
          </div>
          {/* Description */}
          <Skeleton height={14} width="70%" rounded="sm" />
        </div>
        {/* Chevron */}
        <Skeleton height={20} width={20} rounded="sm" />
      </div>
    </div>
  )
}

/**
 * Chat message skeleton - for AI responses
 */
export function ChatMessageSkeleton({
  isAssistant = true
}: {
  isAssistant?: boolean
}) {
  return (
    <div className={`w-full ${isAssistant ? 'bg-gray-50' : 'bg-white'} border-b border-black/5`}>
      <div className="max-w-3xl mx-auto flex gap-4 p-4 md:py-6 lg:px-0">
        {/* Avatar */}
        <div className="w-8">
          <Skeleton width={32} height={32} rounded="sm" />
        </div>
        {/* Content */}
        <div className="flex-1 space-y-3">
          <Skeleton height={14} width={60} rounded="sm" />
          <div className="space-y-2">
            <Skeleton height={16} width="90%" rounded="sm" />
            <Skeleton height={16} width="75%" rounded="sm" />
            <Skeleton height={16} width="85%" rounded="sm" />
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Typing indicator with animated dots
 */
export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-4 py-2">
      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  )
}

/**
 * Generic list skeleton
 */
export function ListSkeleton({
  count = 3,
  gap = 4,
  children
}: {
  count?: number
  gap?: number
  children: React.ReactNode
}) {
  return (
    <div className={`space-y-${gap}`}>
      {Array.from({ length: count }).map((_, i) => (
        <React.Fragment key={i}>{children}</React.Fragment>
      ))}
    </div>
  )
}

/**
 * Card skeleton for dashboard stats
 */
export function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <Skeleton height={16} width={80} rounded="sm" />
        <Skeleton height={24} width={24} rounded="md" />
      </div>
      <Skeleton height={32} width={100} rounded="md" className="mb-2" />
      <Skeleton height={12} width={120} rounded="sm" />
    </div>
  )
}

/**
 * Dashboard skeleton layout
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
      {/* Content area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <Skeleton height={20} width={150} rounded="md" className="mb-4" />
          <div className="space-y-3">
            <Skeleton height={40} width="100%" rounded="lg" />
            <Skeleton height={40} width="100%" rounded="lg" />
            <Skeleton height={40} width="100%" rounded="lg" />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <Skeleton height={20} width={150} rounded="md" className="mb-4" />
          <Skeleton height={200} width="100%" rounded="lg" />
        </div>
      </div>
    </div>
  )
}

/**
 * Note card skeleton
 */
export function NoteCardSkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 h-64 animate-pulse flex flex-col">
      <div className="flex items-center mb-3">
        <Skeleton width={6} height={24} rounded="full" className="mr-3" />
        <Skeleton height={18} width="60%" rounded="sm" />
      </div>
      <div className="flex-1 space-y-2 mb-3">
        <Skeleton height={14} width="100%" rounded="sm" />
        <Skeleton height={14} width="90%" rounded="sm" />
        <Skeleton height={14} width="80%" rounded="sm" />
      </div>
      <div className="flex gap-2 mt-auto">
        <Skeleton height={20} width={50} rounded="md" />
        <Skeleton height={20} width={60} rounded="md" />
      </div>
    </div>
  )
}

export default Skeleton
