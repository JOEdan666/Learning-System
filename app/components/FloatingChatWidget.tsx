'use client'

import React, { useState, useEffect, useRef } from 'react'
import { MessageCircle, X, Send, Minimize2, Maximize2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { createProviderFromEnv, AIProvider } from '../services/ai'
import { toast } from 'react-hot-toast'
import 'katex/dist/katex.min.css'

// 检测是否为ASCII艺术/树状图
const isAsciiArt = (text: string): boolean => {
  const asciiArtChars = /[╱╲├│└─┌┐┘┬┴┼═║╔╗╚╝╠╣╦╩╬▲▼◆●○■□★☆→←↑↓↔⇒⇐⇑⇓]/;
  const hasMultipleSpaces = /\s{2,}/.test(text);
  const hasBoxDrawing = /[┌┐└┘├┤┬┴┼│─]/.test(text);
  return asciiArtChars.test(text) || (hasMultipleSpaces && hasBoxDrawing);
};

// Markdown 自定义组件
const markdownComponents = {
  p: ({ children }: any) => {
    const textContent = typeof children === 'string' ? children :
      (Array.isArray(children) ? children.map((c: any) => typeof c === 'string' ? c : '').join('') : '');
    if (isAsciiArt(textContent)) {
      return <pre className="font-mono text-xs bg-blue-50 p-2 rounded overflow-x-auto my-2 whitespace-pre">{children}</pre>;
    }
    return <p className="mb-2 leading-relaxed">{children}</p>;
  },
  pre: ({ children }: any) => (
    <pre className="font-mono text-xs bg-gray-800 text-gray-100 p-2 rounded overflow-x-auto my-2 whitespace-pre">{children}</pre>
  ),
  code: ({ inline, className, children }: any) => {
    const codeContent = String(children).replace(/\n$/, '');
    if (inline) {
      return <code className="bg-gray-100 px-1 py-0.5 rounded text-xs font-mono">{children}</code>;
    }
    if (isAsciiArt(codeContent)) {
      return (
        <div className="my-2 bg-blue-50 rounded p-2 border border-blue-200">
          <pre className="font-mono text-xs whitespace-pre overflow-x-auto">{children}</pre>
        </div>
      );
    }
    return <code className="block bg-gray-100 p-2 rounded text-xs font-mono overflow-x-auto">{children}</code>;
  },
  strong: ({ children }: any) => <strong className="font-semibold text-blue-600">{children}</strong>,
  ul: ({ children }: any) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
  ol: ({ children }: any) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
  blockquote: ({ children }: any) => <blockquote className="border-l-2 border-blue-300 pl-2 my-2 text-gray-600">{children}</blockquote>,
};

interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface FloatingChatWidgetProps {
  context: string
  title?: string
}

export default function FloatingChatWidget({ context, title = '学习助手' }: FloatingChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const aiProviderRef = useRef<AIProvider | null>(null)

  useEffect(() => {
    // Initialize AI Provider
    const provider = createProviderFromEnv()
    if (provider) {
      aiProviderRef.current = provider
      
      provider.onMessage((content, isFinal) => {
        setMessages(prev => {
          const lastMsg = prev[prev.length - 1]
          if (lastMsg && lastMsg.role === 'assistant') {
            return [...prev.slice(0, -1), { ...lastMsg, content: lastMsg.content + content }]
          }
          return [...prev, { role: 'assistant', content }]
        })

        if (isFinal) {
          setIsLoading(false)
        }
      })

      provider.onError((err) => {
        console.error('AI Error:', err)
        toast.error('AI回复出错')
        setIsLoading(false)
      })
    }

    return () => {
      if (aiProviderRef.current) {
        aiProviderRef.current.close()
      }
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, isOpen])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSend = async () => {
    if (!input.trim() || isLoading || !aiProviderRef.current) return

    const userMsg: ChatMessage = { role: 'user', content: input }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsLoading(true)

    try {
      // Construct history with system context
      const systemMsg: ChatMessage = {
        role: 'system',
        content: `你是一个乐于助人的学习导师。用户正在复习一个之前的学习会话。
以下是该会话的完整内容（包括讲解、测验和结果）：
---
${context}
---
请根据以上内容回答用户的问题。如果用户询问具体题目，请参考测验部分的详细信息。`
      }

      // Prepare history for AI: System Prompt + Recent Messages
      const history = [systemMsg, ...messages, userMsg]
      
      await aiProviderRef.current.sendMessage(userMsg.content, history)
    } catch (error) {
      console.error('Send failed:', error)
      setIsLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105 z-50"
        title="打开学习助手"
      >
        <MessageCircle size={28} />
      </button>
    )
  }

  return (
    <div className={`fixed bottom-6 right-6 bg-white rounded-xl shadow-2xl flex flex-col z-50 transition-all duration-300 border border-gray-200 ${isMinimized ? 'w-72 h-14' : 'w-96 h-[600px] max-h-[80vh]'}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-blue-50 rounded-t-xl cursor-pointer" onClick={() => !isMinimized && setIsMinimized(!isMinimized)}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <h3 className="font-semibold text-gray-800">{title}</h3>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized) }} 
            className="text-gray-500 hover:text-blue-600 p-1"
          >
            {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); setIsOpen(false) }} 
            className="text-gray-500 hover:text-red-600 p-1"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      {!isMinimized && (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 mt-10 text-sm">
                <p>👋 你好！我是你的复习助手。</p>
                <p className="mt-2">关于这次学习内容，你有什么疑问吗？</p>
              </div>
            )}
            
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-lg p-3 text-sm ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white border border-gray-200 text-gray-800 shadow-sm'
                }`}>
                  {msg.role === 'assistant' ? (
                    <div className="markdown-body prose prose-sm max-w-none">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm, remarkMath]}
                        rehypePlugins={[rehypeKatex]}
                        components={markdownComponents}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 border-t bg-white rounded-b-xl">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="输入问题..."
                className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
