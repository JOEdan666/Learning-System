'use client'
// AI聊天组件
import { castToChat } from '../utils/chatTypes'
import React, { useState, useRef, useEffect } from 'react';
import type { LearningItem } from '../types';
import type { AIProvider } from '../services/ai';
import { createProviderFromEnv } from '../services/ai';
import type { ChatMessage as MessageItem } from '../services/ai/types';
import toast from 'react-hot-toast';

interface AIChatProps {
  savedItems: LearningItem[];
  onClose: () => void;
}

// 会话类型与本地存储键（用于保存/恢复对话）
type Conversation = {
  id: string;
  title: string;
  messages: MessageItem[];
  createdAt: number;
  updatedAt: number;
}

const CONV_STORAGE_KEY = 'ai_conversations_v1';
const CONV_ACTIVE_KEY = 'ai_conversations_active_id_v1';

const AIChat: React.FC<AIChatProps> = ({ savedItems, onClose }) => {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSavedContent, setShowSavedContent] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const apiServiceRef = useRef<AIProvider | null>(null);

  // 从环境变量创建 Provider；保持与原有环境变量兼容
  const DEBUG_MODE = (process.env.NEXT_PUBLIC_XUNFEI_DEBUG === 'true') || (process.env.NEXT_PUBLIC_AI_DEBUG === 'true');

  // 调试日志函数
  const debugLog = (...args: any[]): void => {
    if (DEBUG_MODE) {
      console.log('[AI聊天组件]', ...args);
    }
  };

  // 初始化 Provider
  useEffect(() => {
    const provider = createProviderFromEnv();
    if (provider) {
      debugLog('初始化AI Provider');
      apiServiceRef.current = provider;
      // 在不同 Provider 实现下安全启用调试
      if (DEBUG_MODE) (apiServiceRef.current as any)?.setDebugMode?.(true);

      // 设置消息处理器
      apiServiceRef.current.onMessage((content: string, isFinal: boolean) => {
        setMessages(prev => {
          const lastMessage = prev[prev.length - 1];
          if (lastMessage && lastMessage.role === 'assistant') {
            // 更新最后一条助手消息
            return [...prev.slice(0, -1), {
              ...lastMessage,
              content: lastMessage.content + content
            }];
          } else {
            // 添加新的助手消息
            return [...prev, { role: 'assistant', content }];
          }
        });

        if (isFinal) {
          setIsLoading(false);
        }
      });

      // 设置错误处理器
      apiServiceRef.current.onError((errorMsg: string) => {
        setError(errorMsg);
        setIsLoading(false);
      });
    } else {
      setError('未检测到可用的AI Provider，请检查环境变量配置');
    }

    // 组件卸载时关闭连接
    return () => {
      if (apiServiceRef.current) {
        apiServiceRef.current.close();
      }
    };
  }, []);

  // 加载本地会话
  useEffect(() => {
    try {
      const raw = localStorage.getItem(CONV_STORAGE_KEY);
      if (raw) {
        const list: Conversation[] = JSON.parse(raw);
        setConversations(list);
        const savedActive = localStorage.getItem(CONV_ACTIVE_KEY);
        let current: Conversation | undefined;
        if (savedActive) current = list.find(c => c.id === savedActive);
        if (!current && list.length > 0) {
          current = [...list].sort((a, b) => b.updatedAt - a.updatedAt)[0];
        }
        if (current) {
          setActiveId(current.id);
          setMessages(current.messages || []);
        }
      }
    } catch (e) {
      console.warn('载入会话失败:', e);
    }
  }, []);

  // 当消息或激活会话变化时，持久化当前会话
  useEffect(() => {
    if (!activeId) return;
    setConversations(prev => {
      const idx = prev.findIndex(c => c.id === activeId);
      if (idx === -1) return prev;
      const updated = { ...prev[idx], messages, updatedAt: Date.now() };
      const next = [...prev];
      next[idx] = updated;
      try {
        localStorage.setItem(CONV_STORAGE_KEY, JSON.stringify(next));
        localStorage.setItem(CONV_ACTIVE_KEY, activeId);
      } catch {}
      return next;
    });
  }, [messages, activeId]);

  const deriveTitle = (msgs: MessageItem[]): string => {
    const firstUser = msgs.find(m => m.role === 'user');
    if (firstUser) {
      const t = firstUser.content.trim().replace(/\s+/g, ' ');
      return t.length > 20 ? t.slice(0, 20) + '…' : t || '新对话';
    }
    return `对话 ${new Date().toLocaleString('zh-CN')}`;
  };

  const ensureActiveConversation = (initialMessages: MessageItem[] = []) => {
    if (activeId) return activeId;
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const now = Date.now();
    const conv: Conversation = {
      id,
      title: deriveTitle(initialMessages),
      messages: initialMessages,
      createdAt: now,
      updatedAt: now,
    };
    setConversations(prev => {
      const next = [conv, ...prev];
      try { localStorage.setItem(CONV_STORAGE_KEY, JSON.stringify(next)); } catch {}
      try { localStorage.setItem(CONV_ACTIVE_KEY, id); } catch {}
      return next;
    });
    setActiveId(id);
    return id;
  };

  const handleSelectConversation = (id: string) => {
    const conv = conversations.find(c => c.id === id);
    setActiveId(id);
    setMessages(conv?.messages || []);
    try { localStorage.setItem(CONV_ACTIVE_KEY, id); } catch {}
  };

  const handleNewConversation = () => {
    // 不要复用现有 activeId；应创建一个全新的会话，避免清空当前会话消息
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const now = Date.now();
    const conv: Conversation = {
      id,
      title: `对话 ${new Date().toLocaleString('zh-CN')}`,
      messages: [],
      createdAt: now,
      updatedAt: now,
    };
    setConversations(prev => {
      const next = [conv, ...prev];
      try { localStorage.setItem(CONV_STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
    setActiveId(id);
    try { localStorage.setItem(CONV_ACTIVE_KEY, id); } catch {}
    setMessages([]);
    setInputMessage('');
  };

  // 重命名相关
  const startRename = (c: Conversation) => {
    setEditingId(c.id);
    setEditingTitle(c.title);
  };

  const cancelRename = () => {
    setEditingId(null);
    setEditingTitle('');
  };

  const commitRename = () => {
    if (!editingId) return;
    const newTitle = editingTitle.trim() || '未命名对话';
    setConversations(prev => {
      const next = prev.map(c => c.id === editingId ? { ...c, title: newTitle, updatedAt: Date.now() } : c);
      try { localStorage.setItem(CONV_STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
    setEditingId(null);
  };

  // 删除会话
  const handleDeleteConversation = (id: string) => {
    setConversations(prev => {
      const next = prev.filter(c => c.id !== id);
      try { localStorage.setItem(CONV_STORAGE_KEY, JSON.stringify(next)); } catch {}

      // 若删除的是当前会话，选择最近更新的一个作为新的 active；若没有则清空
      if (id === activeId) {
        const nextActive = next.length > 0 ? [...next].sort((a, b) => b.updatedAt - a.updatedAt)[0].id : null;
        setActiveId(nextActive);
        if (nextActive) {
          const conv = next.find(c => c.id === nextActive);
          setMessages(conv?.messages || []);
          try { localStorage.setItem(CONV_ACTIVE_KEY, nextActive); } catch {}
        } else {
          setMessages([]);
          try { localStorage.removeItem(CONV_ACTIVE_KEY); } catch {}
        }
      }

      // 若正在重命名被删除的会话，重置重命名状态
      if (editingId === id) {
        setEditingId(null);
        setEditingTitle('');
      }

      return next;
    });
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitRename();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelRename();
    }
  };

  // 自动滚动到最新消息
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // 基础检索：将 savedItems 分块，基于查询挑选 Top-K 相关片段，避免超长上下文
  const generateSystemPrompt = (query: string): string => {
    const q = (query || '').slice(0, 500)
    if (!savedItems || savedItems.length === 0) {
      return '你是有帮助的学习助手。当前没有可用的外部资料，请基于通用知识回答；若无法确定请直说不足。'
    }

    const normalize = (s: string) => (s || '').replace(/\s+/g, ' ').trim()
    const isCJK = (ch: string) => /[\u3400-\u9fff]/.test(ch)
    const tokenize = (s: string): string[] => {
      const out: string[] = []
      for (const ch of s.toLowerCase()) {
        if (isCJK(ch)) out.push(ch)
        else if (/\w/.test(ch)) out.push(ch)
        else out.push(' ')
      }
      return out.join('')
        .split(/[^\w\u3400-\u9fff]+/)
        .filter(Boolean)
    }
    const qTokens = new Set(tokenize(q))
    const chunkText = (text: string, maxLen = 600, overlap = 80): string[] => {
      const t = normalize(text)
      if (t.length <= maxLen) return [t]
      const res: string[] = []
      let i = 0
      while (i < t.length) {
        const end = Math.min(t.length, i + maxLen)
        res.push(t.slice(i, end))
        if (end === t.length) break
        i = Math.max(end - overlap, i + 1)
      }
      return res
    }
    const scoreChunk = (chunk: string): number => {
      if (qTokens.size === 0) return 0
      const toks = tokenize(chunk)
      if (toks.length === 0) return 0
      let hit = 0
      for (const tk of toks) if (qTokens.has(tk)) hit++
      return hit / Math.sqrt(toks.length)
    }

    type Snip = { score: number; text: string; source: string }
    const pool: Snip[] = []
    for (const item of savedItems) {
      const txt = normalize(item.text || '')
      if (!txt) continue
      const chunks = chunkText(txt)
      // 限制每条最多取前 12 个片段以控量
      const capped = chunks.slice(0, 12)
      for (const c of capped) {
        const s = scoreChunk(c)
        if (s > 0) pool.push({ score: s, text: c, source: item.subject || '外部资料' })
      }
    }

    if (pool.length === 0) {
      // 没有匹配则退化为简单拼接（截断）
      const flat = savedItems.map(it => `【来源：${it.subject}】\n${normalize(it.text || '')}`).join('\n\n')
      const brief = flat.slice(0, 6000)
      return `你是有帮助的学习助手。请尽量依据下述材料回答，若材料未覆盖请直说不足。\n\n材料：\n${brief}`
    }

    const top = pool
      .sort((a, b) => b.score - a.score)
      .slice(0, 8) // Top-K 片段

    const grouped = top.map((s, i) => `【片段${i + 1}｜来源：${s.source}】\n${s.text}`)
    const guidance = [
      '你必须优先依据提供的片段作答；如片段未涵盖，请明确说明资料不足，并给出你能给的通用建议。',
      '保持答案简明、结构化；适当引用关键句并标注来源片段编号。',
    ].join('\n')

    return `系统提示：\n${guidance}\n\n检索到的相关资料片段如下：\n${grouped.join('\n\n')}`
  }

  // 发送消息
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading || !apiServiceRef.current) {
      return;
    }

    setError(null);
    setIsLoading(true);
    toast.loading('AI正在思考中...', { id: 'ai-thinking' });

    // 添加用户消息
    const userMessage: MessageItem = { role: 'user', content: inputMessage.trim() };
    const newActiveId = ensureActiveConversation([...messages, userMessage]);
    setMessages(prev => [...prev, userMessage]);
    setConversations(prev => prev.map(c => c.id === newActiveId ? { ...c, title: c.title || deriveTitle([userMessage]) } : c));

    try {
      // 生成与当前问题相关的系统提示（检索Top-K片段）
      const systemPrompt = generateSystemPrompt(inputMessage.trim());
      
      // 构建消息历史，添加系统提示
      const historyWithSystem = [
        { role: 'system' as const, content: systemPrompt },
        ...messages.filter(msg => msg.role !== 'system')
      ];

      // 添加一个空的助手消息，用于流式更新
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      // 发送消息到API
      await apiServiceRef.current.sendMessage(inputMessage.trim(), historyWithSystem);
      
      // 成功后更新toast
      toast.success('回复完成', { id: 'ai-thinking' });
    } catch (err) {
      // 尝试获取更详细的错误信息
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`发送消息失败: ${errorMessage}`);
      setIsLoading(false);
      
      // 显示错误提示
      toast.error(`发送消息失败: ${errorMessage}`, { id: 'ai-thinking' });
      
      // 在控制台记录详细错误信息，帮助调试
      console.error('发送消息时发生错误:', err);
    }

    setInputMessage('');
  };

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 处理Markdown格式：**文本** 转换为 加粗文本
  const processMarkdownBold = (text: string): React.ReactNode[] => {
    // 匹配 **文本** 格式
    const parts = text.split(/(\*\*[^*]+\*\*)/);
    
    return parts.map((part, index) => {
      // 检查是否是加粗文本格式
      if (part.startsWith('**') && part.endsWith('**')) {
        // 提取并返回加粗内容
        return <strong key={index} className="font-bold text-blue-700">{part.substring(2, part.length - 2)}</strong>;
      }
      return part;
    });
  };

  // 处理Markdown标题：移除 ###
  const removeMarkdownHeaders = (text: string): string => {
    // 移除行首的 ### 符号
    return text.replace(/^\s*#{1,6}\s*/gm, '');
  };

  // 格式化消息内容，处理换行、空格和Markdown格式
  const formatMessageContent = (content: string): React.ReactNode => {
    if (!content) return null;

    // 移除Markdown标题符号
    const contentWithoutHeaders = removeMarkdownHeaders(content);

    // 分割段落并处理
    const paragraphs = contentWithoutHeaders.split(/\n\n+/);
    
    if (paragraphs.length === 1) {
      // 单个段落，处理换行和加粗格式
      const lines = contentWithoutHeaders.split('\n');
      
      return lines.map((line, lineIndex) => (
        <p key={lineIndex} className="whitespace-pre-wrap">
          {processMarkdownBold(line)}
        </p>
      ));
    }
    
    // 多个段落，处理段落间距和加粗格式
    return paragraphs.map((paragraph, i) => (
      <p key={i} className="whitespace-pre-wrap mb-3">
        {processMarkdownBold(paragraph)}
      </p>
    ));
  };

  // 渲染消息气泡
  const renderMessage = (message: MessageItem, index: number) => {
    if (message.role === 'system') return null; // 不显示系统消息

    const isUser = message.role === 'user';
    
    return (
      <div 
        key={index} 
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div 
          className={`max-w-[80%] p-3 rounded-lg 
            ${isUser ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-800'}
          `}
        >
          {formatMessageContent(message.content)}
        </div>
      </div>
    );
  };

  // 渲染已保存的学习内容
  const renderSavedContent = () => {
    if (savedItems.length === 0) {
      return <p className="text-gray-500 text-sm">暂无已保存的学习内容</p>;
    }

    return (
      <div className="space-y-2 max-h-40 overflow-y-auto">
        {savedItems.slice(-5).reverse().map((item) => (
          <div key={item.id} className="p-2 bg-gray-50 rounded text-sm">
            <div className="font-medium text-blue-600">{item.subject}</div>
            <div className="text-gray-700 truncate">{item.text}</div>
            <div className="text-xs text-gray-400">
              {new Date(item.createdAt).toLocaleTimeString('zh-CN')}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex backdrop-blur-sm">
      {/* 左侧：会话列表 */}
      <aside className="w-64 md:w-72 border-r border-gray-200 dark:border-gray-700 flex flex-col bg-white dark:bg-gray-800">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-900">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">AI对话</h2>
          <button onClick={handleNewConversation} className="text-blue-600 dark:text-blue-400 text-sm hover:underline">新建</button>
        </div>
        <div className="p-3 overflow-y-auto flex-1">
          {conversations.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">暂无历史对话</p>
          ) : (
            <ul className="space-y-2">
              {conversations.map((c) => (
                <li key={c.id} className="group">
                  {editingId === c.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        autoFocus
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onKeyDown={handleRenameKeyDown}
                        onBlur={commitRename}
                        className="w-full text-sm border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="输入对话标题"
                      />
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={commitRename}
                        className="text-xs px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                        aria-label="保存重命名"
                      >保存</button>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={cancelRename}
                        className="text-xs px-2 py-1 rounded border dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        aria-label="取消重命名"
                      >取消</button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2">
                      <button
                        className={`flex-1 text-left text-sm truncate ${c.id === activeId ? 'text-blue-700 dark:text-blue-400 underline' : 'text-blue-600 dark:text-blue-400 hover:underline'}`}
                        onClick={() => handleSelectConversation(c.id)}
                        title={c.title}
                      >
                        {c.title}
                      </button>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => startRename(c)}
                          className="opacity-70 group-hover:opacity-100 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 underline"
                          aria-label="重命名会话"
                          title="重命名"
                        >重命名</button>
                        <button
                          type="button"
                          onClick={() => handleDeleteConversation(c.id)}
                          className="opacity-70 group-hover:opacity-100 text-xs text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 underline"
                          aria-label="删除会话"
                          title="删除"
                        >删除</button>
                      </div>
                    </div>
                  )}
                  <div className="text-xs text-gray-400 dark:text-gray-500">{new Date(c.updatedAt).toLocaleString('zh-CN')}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="p-3 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <button onClick={onClose} className="w-full text-sm py-1.5 border dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">关闭</button>
        </div>
      </aside>

      {/* 右侧：聊天主区域 */}
      <main className="flex-1 flex flex-col bg-white dark:bg-gray-800">
        {/* 顶部栏 */}
        <div className="px-4 py-3 border-b dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-900">
          <div className="font-medium text-gray-700 dark:text-gray-200 truncate">{conversations.find(c => c.id === activeId)?.title || '新对话'}</div>
          <div className="text-xs text-gray-400 dark:text-gray-500">{savedItems.length > 0 ? `已保存学习内容 ${savedItems.length} 项` : '无已保存内容'}</div>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 px-4 py-3 border-b dark:border-red-800/30">{error}</div>
        )}

        {/* 聊天内容区域 */}
        <div ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto bg-gray-50 dark:bg-gray-900">
          <div className="max-w-3xl mx-auto space-y-2">
            {messages.map(renderMessage)}
            {isLoading && (
              <div className="flex justify-start mb-4">
                <div className="max-w-[80%] p-3 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border dark:border-gray-700 shadow-sm">
                  <p className="animate-pulse">AI正在思考...</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 已保存内容切换 */}
        <div className="border-t dark:border-gray-700 px-4 py-2 bg-white dark:bg-gray-800">
          <button
            onClick={() => setShowSavedContent(!showSavedContent)}
            className="text-sm text-gray-600 dark:text-gray-300 hover:underline"
          >
            {showSavedContent ? '隐藏' : '显示'}已保存的学习内容 ({savedItems.length}项)
          </button>
          {showSavedContent && (
            <div className="mt-2">{renderSavedContent()}</div>
          )}
        </div>

        {/* 输入区域 */}
        <div className="p-4 border-t dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="max-w-3xl mx-auto">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入您的问题，按Enter发送，Shift+Enter换行..."
              className="w-full p-3 border dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-28 resize-none bg-gray-50 dark:bg-gray-700 dark:text-white"
              disabled={isLoading}
            />
            <div className="flex justify-end mt-2">
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className={`px-4 py-2 rounded-md text-white transition-colors ${inputMessage.trim() && !isLoading ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'}`}
              >
                {isLoading ? '发送中...' : '发送'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AIChat;