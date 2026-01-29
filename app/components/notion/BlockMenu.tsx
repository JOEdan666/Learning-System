'use client'

import React, { useState, useEffect, useRef } from 'react'
import { BLOCK_COMMANDS, BlockType } from '@/app/types/block'
import {
  Type,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Code,
  Quote,
  AlertCircle,
  ChevronRight,
  Image,
  Minus,
  Table,
  Sigma
} from 'lucide-react'

interface BlockMenuProps {
  isOpen: boolean
  position: { top: number; left: number }
  onSelect: (type: BlockType) => void
  onClose: () => void
  searchQuery?: string
}

const ICON_MAP: Record<string, React.ReactNode> = {
  text: <Type size={24} />,
  h1: <Heading1 size={24} />,
  h2: <Heading2 size={24} />,
  h3: <Heading3 size={24} />,
  list: <List size={24} />,
  'list-ordered': <ListOrdered size={24} />,
  'check-square': <CheckSquare size={24} />,
  code: <Code size={24} />,
  quote: <Quote size={24} />,
  'alert-circle': <AlertCircle size={24} />,
  'chevron-right': <ChevronRight size={24} />,
  image: <Image size={24} />,
  minus: <Minus size={24} />,
  table: <Table size={24} />,
  sigma: <Sigma size={24} />,
  lightbulb: <AlertCircle size={24} />
}

export default function BlockMenu({
  isOpen,
  position,
  onSelect,
  onClose,
  searchQuery = ''
}: BlockMenuProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const menuRef = useRef<HTMLDivElement>(null)

  // Filter commands based on search
  const filteredCommands = BLOCK_COMMANDS.filter(cmd =>
    cmd.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cmd.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Reset active index when filtered list changes
  useEffect(() => {
    setActiveIndex(0)
  }, [searchQuery])

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setActiveIndex(prev => (prev + 1) % filteredCommands.length)
          break
        case 'ArrowUp':
          e.preventDefault()
          setActiveIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length)
          break
        case 'Enter':
          e.preventDefault()
          if (filteredCommands[activeIndex]) {
            onSelect(filteredCommands[activeIndex].type)
          }
          break
        case 'Escape':
          e.preventDefault()
          onClose()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, activeIndex, filteredCommands, onSelect, onClose])

  // Scroll active item into view
  useEffect(() => {
    if (menuRef.current) {
      const activeItem = menuRef.current.querySelector('.active')
      if (activeItem) {
        activeItem.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [activeIndex])

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      ref={menuRef}
      className="notion-block-menu notion-fade-in"
      style={{
        top: position.top,
        left: position.left
      }}
    >
      {filteredCommands.length === 0 ? (
        <div className="px-4 py-3 text-sm text-gray-400 text-center">
          未找到匹配的块类型
        </div>
      ) : (
        <>
          <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
            基础块
          </div>
          {filteredCommands.map((cmd, index) => (
            <div
              key={cmd.type}
              className={`notion-block-menu-item ${index === activeIndex ? 'active' : ''}`}
              onClick={() => onSelect(cmd.type)}
              onMouseEnter={() => setActiveIndex(index)}
            >
              <div className="notion-block-menu-item-icon">
                {ICON_MAP[cmd.icon] || <Type size={24} />}
              </div>
              <div className="notion-block-menu-item-info">
                <div className="notion-block-menu-item-title">{cmd.label}</div>
                <div className="notion-block-menu-item-description">{cmd.description}</div>
              </div>
              {cmd.shortcut && (
                <span className="text-xs text-gray-400 font-mono">{cmd.shortcut}</span>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  )
}
