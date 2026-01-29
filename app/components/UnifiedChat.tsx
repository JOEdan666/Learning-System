'use client'

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import TableRenderer from './TableRenderer';
import { ConversationHistory, CreateConversationRequest } from '../types/conversation';
import { ConversationService } from '../services/conversationService';
import { ChatMessage } from '../utils/chatTypes';
import { SUBJECTS, LearningItem } from '../types';
import { toast } from 'react-hot-toast';
import { createProviderFromEnv } from '../services/ai';
import type { AIProvider } from '../services/ai';
import type { ChatMessage as AIChatMessage } from '../services/ai/types';
import { KnowledgeBaseService, type KBItem } from '../services/knowledgeBaseService'

// 地区选项
const REGIONS = [
  '北京', '上海', '广州', '深圳', '东莞', '佛山', '中山', '珠海', '江门', '惠州',
  '杭州', '南京', '苏州', '成都', '重庆', '武汉', '西安', '天津', '青岛', '大连',
  '厦门', '福州', '长沙', '郑州', '济南', '石家庄', '太原', '沈阳', '长春', '哈尔滨',
  '南昌', '合肥', '南宁', '昆明', '贵阳', '兰州', '银川', '西宁', '乌鲁木齐', '拉萨'
];

// 年级选项
const GRADES = [
  '小学一年级', '小学二年级', '小学三年级', '小学四年级', '小学五年级', '小学六年级',
  '初中一年级', '初中二年级', '初中三年级',
  '高中一年级', '高中二年级', '高中三年级', '大学','工作'
];

interface UnifiedChatProps {
  onClose?: () => void;
  savedItems?: LearningItem[];
}

export default function UnifiedChat({ onClose, savedItems }: UnifiedChatProps) {
  // 状态管理
  const [conversations, setConversations] = useState<ConversationHistory[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ConversationHistory | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showNewChatForm, setShowNewChatForm] = useState(false);
  
  // 重命名相关状态
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  
  // 新对话表单状态
  const [chatType, setChatType] = useState<'general' | 'learning'>('general');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [learningTopic, setLearningTopic] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null); // 消息容器Ref
  const shouldAutoScrollRef = useRef(true); // 使用 ref 避免闭包问题
  const [showScrollButton, setShowScrollButton] = useState(false); // 是否显示"新消息"按钮
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // 侧边栏开关
  const aiProviderRef = useRef<AIProvider | null>(null);
  const conversationService = ConversationService.getInstance();
  const [kbItems, setKbItems] = useState<KBItem[]>([])
  const [kbService] = useState(() => new KnowledgeBaseService())
  const userScrollingRef = useRef(false); // 追踪用户是否正在滚动
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 引用当前选中的对话，解决闭包问题
  const selectedConversationRef = useRef(selectedConversation);

  // 同步 selectedConversation 到 ref
  useEffect(() => {
    selectedConversationRef.current = selectedConversation;
  }, [selectedConversation]);

  // 处理滚动事件，判断用户是否手动向上滚动
  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    // 如果距离底部超过 100px，则停止自动滚动
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;

    // 标记用户正在滚动
    userScrollingRef.current = true;
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      userScrollingRef.current = false;
    }, 150);

    shouldAutoScrollRef.current = isNearBottom;
    setShowScrollButton(!isNearBottom);
  }, []);

  // 滚动到底部函数
  const scrollToBottom = useCallback((force = false) => {
    // 如果用户正在滚动，不要自动滚动（除非是强制滚动）
    if (!force && userScrollingRef.current) return;

    if (force || shouldAutoScrollRef.current) {
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: force ? 'smooth' : 'auto' });
      });
      if (force) {
        shouldAutoScrollRef.current = true;
        setShowScrollButton(false);
      }
    }
  }, []);

  const loadConversations = async () => {
    try {
      const response = await conversationService.getConversations();
      setConversations(response.conversations);
    } catch (error) {
      console.error('加载对话列表失败:', error);
      toast.error('加载对话列表失败');
    }
  };

  // 选择对话
  const handleSelectConversation = async (conversation: ConversationHistory) => {
    if (conversation.type === 'learning' && conversation.subject && conversation.topic) {
      // 学习类型对话：直接跳转到学习界面并恢复学习状态
      const learningUrl = `/learning-interface?subject=${encodeURIComponent(conversation.subject)}&topic=${encodeURIComponent(conversation.topic)}&conversationId=${conversation.id}`;
      window.location.href = learningUrl;
      return;
    }
    
    // 普通对话：在当前界面显示
    setSelectedConversation(conversation);
    setMessages(conversation.messages || []);
    setShowNewChatForm(false);
  };

  // 创建新对话
  const handleCreateNewChat = async () => {
    if (chatType === 'learning') {
      // 系统化学习：跳转到图形化学习界面
      if (!selectedSubject || !learningTopic || !selectedRegion || !selectedGrade) {
        toast.error('请填写完整的学习信息（学科、主题、地区、年级）');
        return;
      }
      
      // 跳转到图形化学习界面，传递地区和年级信息
      const learningUrl = `/learning-interface?subject=${encodeURIComponent(selectedSubject)}&topic=${encodeURIComponent(learningTopic)}&region=${encodeURIComponent(selectedRegion)}&grade=${encodeURIComponent(selectedGrade)}`;
      window.location.href = learningUrl;
      return;
    }

    // 普通对话：创建普通聊天对话
    try {
      const request: CreateConversationRequest = {
        type: chatType,
        title: '新对话',
        subject: undefined,
        topic: undefined
      };

      const newConversation = await conversationService.createConversation(request);
      setSelectedConversation(newConversation);
      setMessages([]);
      setShowNewChatForm(false);
      await loadConversations();
      
      toast.success('新对话创建成功');
    } catch (error) {
      console.error('创建新对话失败:', error);
      toast.error('创建新对话失败');
    }
  };

  // 发送消息
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !selectedConversation || isLoading || !aiProviderRef.current) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: inputMessage.trim()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // 添加用户消息到对话
      await conversationService.addMessage(selectedConversation.id, userMessage);

      // 构造历史消息与知识库系统提示
      const kbPrompt = buildKnowledgeBasePrompt(savedItems || [], kbItems || []);
      const recentHistoryLimit = 10;
      const recentHistory = messages.slice(-recentHistoryLimit).map(m => ({ role: m.role, content: m.content })) as AIChatMessage[];
      const historyWithKb: AIChatMessage[] = [];
      if (kbPrompt) {
        historyWithKb.push({ role: 'system', content: kbPrompt });
      }
      // 将最近的历史加入，帮助模型延续上下文
      historyWithKb.push(...recentHistory);

      // 发送到AI，附带历史与系统提示
      await aiProviderRef.current.sendMessage(userMessage.content, historyWithKb);

      // 注意：AI回复会通过onMessage回调处理，这里不需要手动添加回复消息

    } catch (error) {
      console.error('发送消息失败:', error);
      toast.error('发送消息失败');
      setIsLoading(false);
    }
  };

  // 删除对话
  const handleDeleteConversation = async (conversationId: string) => {
    try {
      await conversationService.deleteConversation(conversationId);
      await loadConversations();
      
      if (selectedConversation?.id === conversationId) {
        setSelectedConversation(null);
        setMessages([]);
      }
      
      toast.success('对话已删除');
    } catch (error) {
      console.error('删除对话失败:', error);
      toast.error('删除对话失败');
    }
  };

  // 重命名相关函数
  const startRename = (conversation: ConversationHistory) => {
    setEditingId(conversation.id);
    setEditingTitle(conversation.title);
  };

  const cancelRename = () => {
    setEditingId(null);
    setEditingTitle('');
  };

  const commitRename = async () => {
    if (!editingId) return;
    const newTitle = editingTitle.trim() || '未命名对话';
    
    try {
      await conversationService.updateConversation(editingId, {
        title: newTitle
      });
      
      setConversations(prev => 
        prev.map(c => c.id === editingId ? { ...c, title: newTitle } : c)
      );
      
      if (selectedConversation?.id === editingId) {
        setSelectedConversation(prev => prev ? { ...prev, title: newTitle } : null);
      }
      
      setEditingId(null);
      toast.success('重命名成功');
    } catch (e) {
      console.error('重命名失败:', e);
      toast.error('重命名失败');
    }
  };

  // 处理重命名时的键盘事件
  const handleRenameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      commitRename();
    } else if (e.key === 'Escape') {
      cancelRename();
    }
  };

  // 初始化AI Provider（仅初始化一次，避免重复注册导致多次回调）
  // Memoized function to build knowledge base prompt - prevents recalculation on every render
  const buildKnowledgeBasePrompt = useCallback((notes: LearningItem[], kb: KBItem[]): string | null => {
    const items = notes || []
    const kbIncluded = (kb || []).filter(it => it.include !== false && (it.text && it.text.trim().length > 0))
    if (items.length === 0 && kbIncluded.length === 0) return null;
    // 仅取最近的若干条，避免上下文过长
    const MAX_ITEMS = 10;
    const recentNotes = items.slice(-MAX_ITEMS).reverse();
    const recentKb = kbIncluded.slice(0, MAX_ITEMS)
    // 按学科分组
    const bySubject: Record<string, string[]> = {};
    for (const it of recentNotes) {
      const subject = it.subject || '其他';
      const text = (it.text || '').trim();
      if (!text) continue;
      const truncated = text.length > 600 ? (text.slice(0, 600) + '…') : text;
      if (!bySubject[subject]) bySubject[subject] = [];
      bySubject[subject].push(truncated);
    }
    // 知识库作为单独分组
    if (recentKb.length > 0) {
      bySubject['知识库'] = recentKb.map(it => {
        const t = String(it.text || it.ocrText || it.notes || '').trim()
        return t.length > 800 ? (t.slice(0, 800) + '…') : t
      }).filter(Boolean)
    }
    const subjects = Object.keys(bySubject);
    if (subjects.length === 0) return null;
    const parts: string[] = [];
    parts.push('你是我的学习助理。回答问题时优先基于下列知识库内容；若知识库没有相关信息，请明确说明并再进行通用回答：');
    for (const s of subjects) {
      parts.push(`【${s}】`);
      const lines = bySubject[s].map((t, idx) => `${idx + 1}. ${t}`);
      parts.push(lines.join('\n'));
    }
    return parts.join('\n');
  }, []);

  // 初始化AI Provider（仅初始化一次，避免重复注册导致多次回调）
  useEffect(() => {
    const provider = createProviderFromEnv();
    if (provider) {
      aiProviderRef.current = provider;

      // 设置消息处理器
      provider.onMessage(async (content: string, isFinal: boolean) => {
        if (!content && !isFinal) return;
        
        setMessages(prev => {
          const lastMessage = prev[prev.length - 1];
          const validContent = content || '';
          
          // 避免在最终空内容事件或空增量时创建空消息
          if (validContent.length === 0 && (!lastMessage || lastMessage.role !== 'assistant')) {
            return prev;
          }

          if (lastMessage && lastMessage.role === 'assistant') {
            // 更新最后一条助手消息
            const updatedContent = lastMessage.content + validContent;
            const updatedMessage = {
              ...lastMessage,
              content: updatedContent
            };
            return [...prev.slice(0, -1), updatedMessage];
          } else {
             // 添加新的助手消息
             const newMessage: ChatMessage = { role: 'assistant', content: validContent };
             return [...prev, newMessage];
           }
        });
        
        if (isFinal) {
          setIsLoading(false);
          
          // 当消息完成时，保存AI回复并处理标题生成
          setMessages(currentMessages => {
            const lastMessage = currentMessages[currentMessages.length - 1];
            const currentConv = selectedConversationRef.current;
            
            // 使用 ref 获取最新的 selectedConversation
            if (lastMessage && lastMessage.role === 'assistant' && currentConv) {
              // 确保使用最新的消息内容（从 validContent 累积的结果可能比 state 更新快）
              // 但这里我们在 setMessages 回调中，currentMessages 是最新的
              
              // 保存AI回复
              conversationService.addMessage(currentConv.id, lastMessage).then(updatedConversation => {
                if (updatedConversation) {
                  // 更新本地选中的对话状态，确保包含新消息
                  setSelectedConversation(prev => {
                    if (!prev || prev.id !== updatedConversation.id) return prev;
                    return {
                      ...updatedConversation,
                      messages: updatedConversation.messages // 确保消息列表同步
                    };
                  });
                  
                  // 更新列表中的预览
                  setConversations(prev => prev.map(c => 
                    c.id === updatedConversation.id ? updatedConversation : c
                  ));
                  
                  // 自动生成标题：当消息数量达到2条且标题是默认标题时
                  if (currentMessages.length >= 2 && 
                      (updatedConversation.title.includes('对话') || 
                       updatedConversation.title === '新对话' ||
                       updatedConversation.title.includes(new Date().toLocaleString('zh-CN', { year: 'numeric' }).substring(0, 4)))) { // 简单检查年份
                    
                    conversationService.generateTitle({
                      messages: currentMessages,
                      type: updatedConversation.type
                    }).then(titleResponse => {
                      if (titleResponse.title && titleResponse.title !== updatedConversation.title) {
                        // 更新对话标题
                        conversationService.updateConversation(updatedConversation.id, {
                          title: titleResponse.title
                        }).then(titleUpdatedConversation => {
                          if (titleUpdatedConversation) {
                            // 同步更新选中状态的标题
                            setSelectedConversation(prev => prev ? { ...prev, title: titleUpdatedConversation.title } : null);
                            
                            // 同步更新列表中的标题
                            setConversations(prev => prev.map(c => 
                              c.id === titleUpdatedConversation.id ? { ...c, title: titleUpdatedConversation.title } : c
                            ));
                            
                            toast.success(`已自动生成标题: ${titleResponse.title}`);
                          }
                        });
                      }
                    }).catch(titleError => {
                      console.warn('自动生成标题失败:', titleError);
                    });
                  }
                }
              }).catch(error => {
                console.error('保存AI回复失败:', error);
              });
            }
            return currentMessages;
          });
        }
      });

      // 设置错误处理器
      provider.onError((errorMsg: string) => {
        console.error('AI回复失败:', errorMsg);
        toast.error('AI回复失败');
        setIsLoading(false);
      });
    }

    // 组件卸载时关闭连接
    return () => {
      if (aiProviderRef.current) {
        aiProviderRef.current.close();
      }
    };
  }, []);

  // 加载对话列表
  useEffect(() => {
    loadConversations();
  }, []);

  // 加载知识库（用于注入AI上下文）
  useEffect(() => {
    (async () => {
      try {
        const list = await kbService.getItems()
        setKbItems(list)
      } catch (e) {
        console.warn('加载知识库失败:', e)
      }
    })()
  }, [kbService])

  // 滚动到底部 - 仅在新消息添加时滚动，流式更新时不强制滚动
  const prevMessagesLengthRef = useRef(messages.length);
  useEffect(() => {
    // 只有当消息数量增加时才自动滚动（新消息到达）
    // 流式更新同一条消息时不触发滚动
    if (messages.length > prevMessagesLengthRef.current) {
      scrollToBottom();
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages.length, scrollToBottom]);

  // UI渲染重构
  return (
    <div className="flex h-[calc(100vh-64px)] bg-white overflow-hidden">
      {/* 移动端遮罩 */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* 左侧对话列表 (侧边栏) - 已现代化为浅色风格 */}
      <div 
        className={`
          fixed inset-y-0 left-0 z-30 w-[260px] bg-gray-50 text-gray-700 border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          ${!isSidebarOpen && 'lg:hidden'} 
        `}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* 侧边栏头部 - 固定高度 */}
          <div className="shrink-0 p-3">
            <button
              onClick={() => {
                setShowNewChatForm(true);
                if (window.innerWidth < 1024) setIsSidebarOpen(false);
              }}
              className="w-full flex items-center justify-between px-3 py-2.5 text-sm text-gray-700 bg-white hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 shadow-sm"
            >
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="font-medium">新对话</span>
              </div>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          </div>

          {/* 新对话表单 (嵌入在侧边栏) */}
          {showNewChatForm && (
            <div className="shrink-0 px-3 pb-3 border-b border-gray-200">
              <div className="bg-white border border-gray-200 rounded-lg p-3 space-y-3 shadow-sm">
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">创建新对话</h3>
                
                {/* 类型切换 */}
                <div className="flex bg-gray-100 p-1 rounded-lg">
                  <button
                    onClick={() => setChatType('general')}
                    className={`flex-1 py-1.5 text-xs rounded-md transition-all ${chatType === 'general' ? 'bg-white text-gray-900 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    普通
                  </button>
                  <button
                    onClick={() => setChatType('learning')}
                    className={`flex-1 py-1.5 text-xs rounded-md transition-all ${chatType === 'learning' ? 'bg-white text-gray-900 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    学习
                  </button>
                </div>

                {chatType === 'learning' && (
                  <div className="space-y-2">
                    <select
                      value={selectedSubject}
                      onChange={(e) => setSelectedSubject(e.target.value)}
                      className="w-full bg-gray-50 text-gray-900 text-xs border border-gray-200 rounded px-2 py-2 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="">选择学科</option>
                      {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <input
                      type="text"
                      value={learningTopic}
                      onChange={(e) => setLearningTopic(e.target.value)}
                      placeholder="学习主题"
                      className="w-full bg-gray-50 text-gray-900 text-xs border border-gray-200 rounded px-2 py-2 focus:ring-1 focus:ring-blue-500 focus:outline-none placeholder-gray-400"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={selectedRegion}
                        onChange={(e) => setSelectedRegion(e.target.value)}
                        className="w-full bg-gray-50 text-gray-900 text-xs border border-gray-200 rounded px-2 py-2 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="">地区</option>
                        {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                      <select
                        value={selectedGrade}
                        onChange={(e) => setSelectedGrade(e.target.value)}
                        className="w-full bg-gray-50 text-gray-900 text-xs border border-gray-200 rounded px-2 py-2 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="">年级</option>
                        {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <button onClick={handleCreateNewChat} className="flex-1 bg-black text-white hover:bg-gray-800 text-xs py-2 rounded font-medium transition-colors">创建</button>
                  <button onClick={() => setShowNewChatForm(false)} className="flex-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 text-xs py-2 rounded transition-colors">取消</button>
                </div>
              </div>
            </div>
          )}

          {/* 对话列表 - 确保稳定滚动 */}
          <div className="flex-1 min-h-0 overflow-y-auto px-2 pt-2 pb-0 flex flex-col gap-0.5 scrollbar-thin scrollbar-thumb-gray-300">
            <div className="text-xs font-medium text-gray-400 px-3 py-2 shrink-0">最近</div>
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => {
                  handleSelectConversation(conversation);
                  if (window.innerWidth < 1024) setIsSidebarOpen(false);
                }}
                className={`group relative flex items-center gap-3 px-3 py-3 text-sm rounded-lg cursor-pointer transition-colors ${
                  selectedConversation?.id === conversation.id 
                    ? 'bg-gray-200 text-gray-900 font-medium' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <svg className={`w-4 h-4 shrink-0 ${selectedConversation?.id === conversation.id ? 'text-gray-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                
                {editingId === conversation.id ? (
                   <input
                    type="text"
                    autoFocus
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onKeyDown={handleRenameKeyDown}
                    onBlur={commitRename}
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 bg-white text-gray-900 text-sm px-2 py-1 border border-blue-500 rounded focus:outline-none shadow-sm"
                  />
                ) : (
                  <div className="flex-1 truncate pr-8">
                    {conversation.title}
                  </div>
                )}

                {/* 悬停操作按钮 (仅在非编辑模式显示) */}
                {editingId !== conversation.id && (
                  <div className={`absolute right-2 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-1 pl-4 ${
                    selectedConversation?.id === conversation.id 
                      ? 'bg-gradient-to-l from-gray-200 to-transparent' 
                      : 'bg-gradient-to-l from-gray-100 to-transparent'
                  }`}>
                    <button 
                      onClick={(e) => { e.stopPropagation(); startRename(conversation); }}
                      className="p-1.5 hover:text-gray-900 text-gray-500 rounded hover:bg-gray-300 transition-colors"
                      title="重命名"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeleteConversation(conversation.id); }}
                      className="p-1.5 hover:text-red-500 text-gray-500 rounded hover:bg-gray-300 transition-colors"
                      title="删除"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 侧边栏底部 */}
          <div className="shrink-0 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700">
              <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm">
                U
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-gray-900">用户</span>
                <span className="text-xs text-gray-500">学习者</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 主聊天区域 */}
      <div className="flex-1 flex flex-col h-full relative">
        {/* 顶部导航栏 (仅移动端或当侧边栏关闭时显示Toggle) */}
        <div className="sticky top-0 z-10 flex items-center p-2 text-gray-500 bg-white border-b border-gray-100 lg:hidden">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 hover:bg-gray-100 rounded-md"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="ml-2 font-medium text-gray-700 truncate">
            {selectedConversation?.title || '新对话'}
          </span>
        </div>

        {/* 桌面端侧边栏切换按钮 (悬浮) */}
        {!isSidebarOpen && (
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="absolute top-4 left-4 z-10 p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 hidden lg:block"
            title="显示侧边栏"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}

        {selectedConversation ? (
          <>
             {/* 消息滚动区域 */}
            <div 
              ref={messagesContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto w-full scroll-smooth"
            >
              <div className="flex flex-col items-center text-sm dark:bg-gray-800">
                {/* 顶部留白 */}
                <div className="w-full h-10 shrink-0" />
                
                {/* AI 讲解 (学习模式) */}
                {selectedConversation.type === 'learning' && selectedConversation.aiExplanation && (
                   <div className="w-full max-w-3xl px-4 md:px-6 mb-8">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2 text-green-700 font-medium">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          知识讲解
                        </div>
                        <TableRenderer content={selectedConversation.aiExplanation} />
                      </div>
                   </div>
                )}

                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`w-full text-gray-800 ${
                      message.role === 'assistant' ? 'bg-gray-50' : 'bg-white'
                    }`}
                  >
                    <div className="max-w-3xl mx-auto flex gap-4 p-4 md:py-6 lg:px-0 m-auto">
                      {/* 头像 */}
                      <div className="w-8 flex flex-col relative items-end">
                        <div className={`
                          relative h-8 w-8 rounded-sm flex items-center justify-center font-bold text-white shrink-0
                          ${message.role === 'assistant' ? 'bg-green-500' : 'bg-blue-600'}
                        `}>
                          {message.role === 'assistant' ? (
                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                          ) : 'U'}
                        </div>
                      </div>
                      
                      {/* 消息内容 */}
                      <div className="relative flex-1 overflow-hidden">
                        {/* 发送者名称 (可选) */}
                        <div className="font-semibold text-sm mb-1 opacity-90">
                           {message.role === 'assistant' ? 'AI 助教' : '你'}
                        </div>
                        
                        <div className="min-h-[20px] break-words">
                          {message.role === 'assistant' ? (
                            <TableRenderer content={message.content} />
                          ) : (
                            <div className="whitespace-pre-wrap">{message.content}</div>
                          )}
                        </div>

                        {/* 图片显示 */}
                        {message.image && (
                          <div className="mt-3">
                            <img 
                              src={message.image} 
                              alt="Uploaded" 
                              className="max-w-md rounded-lg shadow-sm border border-gray-200 cursor-zoom-in"
                              onClick={() => window.open(message.image, '_blank')}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* 加载中状态 - 改进的打字指示器 */}
                {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
                   <div className="w-full bg-gray-50">
                      <div className="max-w-3xl mx-auto flex gap-4 p-4 md:py-6 lg:px-0 m-auto">
                        <div className="w-8 flex flex-col relative items-end">
                          <div className="h-8 w-8 bg-green-500 rounded-sm flex items-center justify-center text-white">
                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                          </div>
                        </div>
                        <div className="flex-1">
                           <div className="font-semibold text-sm mb-2 opacity-90">AI 助教</div>
                           <div className="flex items-center gap-1.5 h-6">
                              <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0ms', animationDuration: '1s' }} />
                              <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '150ms', animationDuration: '1s' }} />
                              <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '300ms', animationDuration: '1s' }} />
                              <span className="ml-2 text-sm text-gray-400">正在思考...</span>
                           </div>
                        </div>
                      </div>
                   </div>
                )}
                
                {/* 底部留白，防止输入框遮挡 */}
                <div className="w-full h-32 shrink-0" />
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* 滚动到底部按钮 (当用户向上滚动时显示) */}
            {showScrollButton && (
              <button
                onClick={() => scrollToBottom(true)}
                className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-white border border-gray-200 shadow-md rounded-full p-2 text-gray-600 hover:text-gray-900 z-10 animate-bounce"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </button>
            )}

            {/* 输入区域 */}
            <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-white via-white to-transparent pt-10 pb-6 px-4">
              <div className="max-w-3xl mx-auto relative">
                <div className="relative flex items-end w-full p-3 bg-white border border-gray-200 shadow-lg rounded-2xl overflow-hidden">
                  <textarea
                    value={inputMessage}
                    onChange={(e) => {
                      setInputMessage(e.target.value);
                      // 自动调整高度
                      e.target.style.height = 'auto';
                      e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="发送消息..."
                    rows={1}
                    className="w-full max-h-[200px] py-1 pl-1 pr-10 resize-none border-none focus:ring-0 focus:outline-none text-gray-800 placeholder-gray-400 bg-transparent"
                    style={{ minHeight: '24px' }}
                    disabled={isLoading}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || isLoading}
                    className={`absolute right-2 bottom-2 p-1.5 rounded-md transition-colors ${
                      inputMessage.trim() && !isLoading 
                        ? 'bg-green-500 text-white hover:bg-green-600' 
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
                <div className="text-center text-xs text-gray-400 mt-2">
                   AI 可能会产生错误信息，请核对重要事实。
                </div>
              </div>
            </div>
          </>
        ) : (
          /* 空状态 */
          <div className="flex-1 flex flex-col items-center justify-center bg-white text-gray-800">
             <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
             </div>
             <h2 className="text-2xl font-semibold mb-2">有什么可以帮你的吗？</h2>
             
             {/* 侧边栏 Toggle (如果已关闭) */}
             {!isSidebarOpen && (
               <button 
                  onClick={() => setIsSidebarOpen(true)}
                  className="mt-8 px-4 py-2 bg-black text-white rounded-md text-sm hover:bg-gray-800 transition-colors lg:hidden"
               >
                 查看历史对话
               </button>
             )}
          </div>
        )}
      </div>
    </div>
  );
}
