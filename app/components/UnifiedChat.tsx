'use client'

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import TableRenderer from './TableRenderer';
import { ConversationHistory, CreateConversationRequest } from '../types/conversation';
import { ConversationService } from '../services/conversationService';
import { ChatMessage } from '../utils/chatTypes';
import { SUBJECTS, LearningItem } from '../types';
import { toast } from 'react-hot-toast';
import { createProvider, createProviderFromEnv } from '../services/ai';
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
  const [providerName, setProviderName] = useState<'openai' | 'xunfei' | 'unknown'>('unknown');
  const [health, setHealth] = useState<{ provider: string; hasOpenAIKey: boolean; hasXunfei: boolean } | null>(null);
  const preferredProvider = (process.env.NEXT_PUBLIC_AI_PROVIDER || 'openai').toLowerCase();

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
    if (providerName === 'openai' && health && !health.hasOpenAIKey) {
      toast.error('OpenAI API Key 未配置，无法发送。请在服务器环境变量中设置 OPENAI_API_KEY。');
      return;
    }
    if (providerName === 'xunfei' && health && !health.hasXunfei) {
      toast.error('讯飞凭证未配置，无法发送。请补齐 NEXT_PUBLIC_XUNFEI_* 环境变量。');
      return;
    }

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
    parts.push('【重要指令】你是专属私教。严禁使用任何开场白或前缀，包括但不限于："根据知识库"、"根据资料"、"基于提供的内容"、"好的"、"让我来"、"首先"等。直接进入正题，用简洁清晰的语言回答问题。可融合下方参考资料，若资料不足则用通用知识作答。');
    for (const s of subjects) {
      parts.push(`【${s === '知识库' ? '参考资料' : s}】`);
      const lines = bySubject[s].map((t, idx) => `${idx + 1}. ${t}`);
      parts.push(lines.join('\n'));
    }
    return parts.join('\n');
  }, []);

  // 初始化AI Provider（仅初始化一次，避免重复注册导致多次回调）
  // 更强大的前缀过滤，覆盖AI可能使用的各种变体
  const stripKnowledgePrefix = useCallback((content: string) => {
    if (!content) return '';
    // 多种前缀模式依次过滤
    const patterns = [
      /^(根据|基于|依据|参考|结合|综合)?(你的|本|提供的|上述|以上|给定的|所给的|已有的|现有的)?(知识库|资料|内容|信息|材料|文档|参考资料)[，,、:：]?\s*/gi,
      /^(从|按照|通过)?(你的|本|提供的)?(知识库|资料)[来]?(来看|分析|了解|可知)[，,、:：]?\s*/gi,
      /^好的[，,]?\s*/gi,
      /^(让我|我来|我将|我会)(为你|帮你|给你)?[，,]?\s*/gi,
      /^(首先|接下来)[，,]?\s*/gi,
    ];
    let result = content;
    for (const pattern of patterns) {
      result = result.replace(pattern, '');
    }
    return result.trim();
  }, []);

  useEffect(() => {
    const initProvider = async () => {
      try {
        const res = await fetch('/api/ai/health', { cache: 'no-store' });
        const json = await res.json();
        setHealth(json);

        let provider: AIProvider | null = null;
        let finalProvider: 'openai' | 'xunfei' | 'unknown' = 'unknown';

        if (preferredProvider === 'openai') {
          if (json.hasOpenAIKey) {
            provider = createProvider({ provider: 'openai' });
            finalProvider = 'openai';
          } else if (json.hasXunfei) {
            provider = createProvider({
              provider: 'xunfei',
              xunfei: {
                appId: process.env.NEXT_PUBLIC_XUNFEI_APP_ID || '',
                apiKey: process.env.NEXT_PUBLIC_XUNFEI_API_KEY || '',
                apiSecret: process.env.NEXT_PUBLIC_XUNFEI_API_SECRET || '',
                domain: process.env.NEXT_PUBLIC_XUNFEI_DOMAIN || 'generalv3.5',
                apiUrl: process.env.NEXT_PUBLIC_XUNFEI_API_URL || 'wss://spark-api.xf-yun.com/v3.5/chat',
              }
            });
            finalProvider = 'xunfei';
            toast('OpenAI 未就绪，已自动切换到讯飞通道', { icon: '🚦' });
          }
        } else {
          provider = createProviderFromEnv();
          finalProvider = provider ? (preferredProvider === 'xunfei' ? 'xunfei' : 'unknown') : 'unknown';
        }

        if (!provider) {
          toast.error('未检测到可用的 AI 凭证，请检查环境变量');
          return;
        }

        aiProviderRef.current = provider;
        setProviderName(finalProvider);

      // 设置消息处理器
      provider.onMessage(async (content: string, isFinal: boolean) => {
        if (!content && !isFinal) return;
        
        setMessages(prev => {
          const lastMessage = prev[prev.length - 1];
          const validContent = stripKnowledgePrefix(content || '');
          
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
             const newMessage: ChatMessage = { role: 'assistant', content: stripKnowledgePrefix(validContent) };
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
      } catch (e) {
        console.error('初始化AI Provider失败', e);
        toast.error('AI通道初始化失败，请检查配置');
      }
    };

    initProvider();

    // 组件卸载时关闭连接
    return () => {
      if (aiProviderRef.current) {
        aiProviderRef.current.close();
      }
    };
  }, [preferredProvider, stripKnowledgePrefix]);

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

  // UI渲染 - 浅蓝色现代化风格
  return (
    <div className="flex h-[calc(100vh-64px)] bg-gradient-to-br from-sky-50 via-sky-100/50 to-blue-100 overflow-hidden">
      {/* 装饰性背景元素 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-[10%] w-72 h-72 bg-blue-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-[15%] w-96 h-96 bg-sky-200/40 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
      </div>

      {/* 移动端遮罩 */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* 左侧对话列表 (侧边栏) - 浅色毛玻璃风格 */}
      <div
        className={`
          fixed inset-y-0 left-0 z-30 w-[280px] bg-white/80 backdrop-blur-xl border-r border-blue-100 shadow-xl shadow-blue-100/20 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          ${!isSidebarOpen && 'lg:hidden'}
        `}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* 侧边栏头部 */}
          <div className="shrink-0 p-4 border-b border-blue-100/50">
            <button
              onClick={() => {
                setShowNewChatForm(true);
                if (window.innerWidth < 1024) setIsSidebarOpen(false);
              }}
              className="w-full flex items-center justify-between px-4 py-3 text-sm text-gray-700 bg-gradient-to-r from-blue-50 to-sky-50 hover:from-blue-100 hover:to-sky-100 rounded-xl transition-all border border-blue-200/50 shadow-sm hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-sky-500 flex items-center justify-center shadow-md shadow-blue-200">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <span className="font-semibold">新对话</span>
              </div>
              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* 新对话表单 */}
          {showNewChatForm && (
            <div className="shrink-0 px-4 py-3 border-b border-blue-100/50 bg-gradient-to-b from-white to-sky-50/50">
              <div className="bg-white rounded-xl p-4 space-y-4 shadow-lg shadow-blue-100/30 border border-blue-100">
                <h3 className="text-sm font-semibold text-gray-800">创建新对话</h3>

                {/* 类型切换 */}
                <div className="flex bg-gray-100 p-1 rounded-lg">
                  <button
                    onClick={() => setChatType('general')}
                    className={`flex-1 py-2 text-sm rounded-md transition-all font-medium ${chatType === 'general' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    普通对话
                  </button>
                  <button
                    onClick={() => setChatType('learning')}
                    className={`flex-1 py-2 text-sm rounded-md transition-all font-medium ${chatType === 'learning' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    系统学习
                  </button>
                </div>

                {chatType === 'learning' && (
                  <div className="space-y-3">
                    <select
                      value={selectedSubject}
                      onChange={(e) => setSelectedSubject(e.target.value)}
                      className="w-full bg-gray-50 text-gray-800 text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:outline-none"
                    >
                      <option value="">选择学科</option>
                      {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <input
                      type="text"
                      value={learningTopic}
                      onChange={(e) => setLearningTopic(e.target.value)}
                      placeholder="输入学习主题..."
                      className="w-full bg-gray-50 text-gray-800 text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:outline-none placeholder-gray-400"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={selectedRegion}
                        onChange={(e) => setSelectedRegion(e.target.value)}
                        className="w-full bg-gray-50 text-gray-800 text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:outline-none"
                      >
                        <option value="">选择地区</option>
                        {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                      <select
                        value={selectedGrade}
                        onChange={(e) => setSelectedGrade(e.target.value)}
                        className="w-full bg-gray-50 text-gray-800 text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:outline-none"
                      >
                        <option value="">选择年级</option>
                        {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button onClick={handleCreateNewChat} className="flex-1 bg-gradient-to-r from-blue-500 to-sky-500 text-white hover:from-blue-600 hover:to-sky-600 text-sm py-2.5 rounded-lg font-semibold transition-all shadow-lg shadow-blue-200 hover:shadow-xl">
                    创建
                  </button>
                  <button onClick={() => setShowNewChatForm(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm py-2.5 rounded-lg font-medium transition-colors">
                    取消
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 对话列表 */}
          <div className="flex-1 min-h-0 overflow-y-auto px-3 pt-3 pb-0 flex flex-col gap-1">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-2 shrink-0">历史对话</div>
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => {
                  handleSelectConversation(conversation);
                  if (window.innerWidth < 1024) setIsSidebarOpen(false);
                }}
                className={`group relative flex items-center gap-3 px-3 py-3 text-sm rounded-xl cursor-pointer transition-all ${
                  selectedConversation?.id === conversation.id
                    ? 'bg-gradient-to-r from-blue-500 to-sky-500 text-white shadow-lg shadow-blue-200'
                    : 'text-gray-700 hover:bg-blue-50 bg-white/50'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  selectedConversation?.id === conversation.id
                    ? 'bg-white/20'
                    : 'bg-gradient-to-br from-blue-100 to-sky-100'
                }`}>
                  <svg className={`w-4 h-4 ${selectedConversation?.id === conversation.id ? 'text-white' : 'text-blue-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>

                {editingId === conversation.id ? (
                   <input
                    type="text"
                    autoFocus
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onKeyDown={handleRenameKeyDown}
                    onBlur={commitRename}
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 bg-white text-gray-800 text-sm px-3 py-1.5 border-2 border-blue-400 rounded-lg focus:outline-none shadow-sm"
                  />
                ) : (
                  <div className="flex-1 truncate pr-8 font-medium">
                    {conversation.title}
                  </div>
                )}

                {/* 悬停操作按钮 */}
                {editingId !== conversation.id && (
                  <div className={`absolute right-2 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-1 pl-4 ${
                    selectedConversation?.id === conversation.id
                      ? 'bg-gradient-to-l from-blue-500 to-transparent'
                      : 'bg-gradient-to-l from-blue-50 to-transparent'
                  }`}>
                    <button
                      onClick={(e) => { e.stopPropagation(); startRename(conversation); }}
                      className={`p-1.5 rounded-lg transition-colors ${
                        selectedConversation?.id === conversation.id
                          ? 'hover:bg-white/20 text-white'
                          : 'hover:bg-blue-100 text-gray-500'
                      }`}
                      title="重命名"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteConversation(conversation.id); }}
                      className={`p-1.5 rounded-lg transition-colors ${
                        selectedConversation?.id === conversation.id
                          ? 'hover:bg-red-400/30 text-white'
                          : 'hover:bg-red-100 text-red-500'
                      }`}
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
          <div className="shrink-0 border-t border-blue-100/50 bg-white/60 backdrop-blur">
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-sky-500 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-lg shadow-blue-200">
                U
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-gray-800">用户</span>
                <span className="text-xs text-gray-500">学习者</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 主聊天区域 */}
      <div className="flex-1 flex flex-col h-full relative z-10">
        {/* 顶部导航栏 */}
        <div className="sticky top-0 z-10 flex items-center p-3 bg-white/70 backdrop-blur-xl border-b border-blue-100/50 shadow-sm lg:hidden">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 hover:bg-blue-50 rounded-lg text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="ml-3 font-semibold text-gray-800 truncate">
            {selectedConversation?.title || '新对话'}
          </span>
        </div>

        {/* 桌面端侧边栏切换按钮 */}
        {!isSidebarOpen && (
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="absolute top-4 left-4 z-10 p-2.5 text-gray-600 hover:text-blue-600 rounded-xl bg-white/80 backdrop-blur shadow-lg shadow-blue-100/30 hover:shadow-xl border border-blue-100 hidden lg:flex items-center justify-center transition-all"
            title="显示侧边栏"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}

        {selectedConversation ? (
          <>
             {/* 对话信息栏 */}
             <div className="px-4 pt-4">
               <div className="max-w-4xl mx-auto flex flex-wrap items-center gap-2 text-xs">
                 <span className="px-3 py-1.5 rounded-full bg-white/80 backdrop-blur border border-blue-100 text-gray-700 font-medium shadow-sm">
                   {selectedConversation.title || '新对话'}
                 </span>
                 <span className={`px-3 py-1.5 rounded-full border font-medium flex items-center gap-1.5 ${
                   providerName === 'unknown'
                     ? 'border-gray-200 text-gray-500 bg-gray-50'
                     : 'border-emerald-200 text-emerald-700 bg-emerald-50'
                 }`}>
                   {providerName !== 'unknown' && (
                     <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                   )}
                   {providerName === 'unknown' ? '未连接' : '专属私教在线'}
                 </span>
                 {health && providerName === 'unknown' && (
                   <span className="px-3 py-1.5 rounded-full border border-rose-200 text-rose-600 bg-rose-50">
                     请检查网络连接
                   </span>
                 )}
               </div>
             </div>

             {/* 消息滚动区域 */}
            <div
              ref={messagesContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto w-full scroll-smooth"
            >
              <div className="flex flex-col items-center text-sm">
                {/* 顶部留白 */}
                <div className="w-full h-6 shrink-0" />

                {/* AI 讲解 (学习模式) */}
                {selectedConversation.type === 'learning' && selectedConversation.aiExplanation && (
                   <div className="w-full max-w-3xl px-4 md:px-6 mb-6">
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-5 shadow-lg shadow-green-100/30">
                        <div className="flex items-center gap-2 mb-3 text-green-700 font-semibold">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-md shadow-green-200">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          </div>
                          知识讲解
                        </div>
                        <div className="text-gray-700">
                          <TableRenderer content={selectedConversation.aiExplanation} />
                        </div>
                      </div>
                   </div>
                )}

                {messages.map((message, index) => {
                  const sanitized = message.role === 'assistant' ? stripKnowledgePrefix(message.content) : message.content;
                  const isUser = message.role === 'user';
                  return (
                    <div
                      key={index}
                      className="w-full px-4 mb-4"
                    >
                      <div className={`max-w-3xl mx-auto flex gap-4 ${isUser ? 'flex-row-reverse' : ''}`}>
                        {/* 头像 */}
                        <div className="shrink-0">
                          <div className={`
                            w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-lg
                            ${isUser
                              ? 'bg-gradient-to-br from-blue-500 to-sky-500 shadow-blue-200'
                              : 'bg-gradient-to-br from-emerald-500 to-green-500 shadow-green-200'
                            }
                          `}>
                            {isUser ? (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                            ) : (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            )}
                          </div>
                        </div>

                        {/* 消息气泡 */}
                        <div className={`flex-1 max-w-[85%] ${isUser ? 'text-right' : ''}`}>
                          <div className="text-xs font-medium text-gray-500 mb-1.5 px-1">
                             {isUser ? '你' : '专属私教'}
                          </div>
                          <div className={`
                            inline-block text-left px-5 py-4 rounded-2xl shadow-lg
                            ${isUser
                              ? 'bg-gradient-to-br from-blue-500 to-sky-500 text-white rounded-tr-sm shadow-blue-200'
                              : 'bg-white/95 backdrop-blur text-gray-800 border border-blue-100/50 rounded-tl-sm shadow-blue-100/30'
                            }
                          `}>
                            <div className="min-h-[20px] break-words leading-relaxed">
                              {isUser ? (
                                <div className="whitespace-pre-wrap">{sanitized}</div>
                              ) : (
                                <TableRenderer content={sanitized} />
                              )}
                            </div>

                            {/* 图片显示 */}
                            {message.image && (
                              <div className="mt-3">
                                <img
                                  src={message.image}
                                  alt="Uploaded"
                                  className="max-w-md rounded-xl shadow-md border border-gray-100 cursor-zoom-in hover:shadow-lg transition-shadow"
                                  onClick={() => window.open(message.image, '_blank')}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}

                {/* 加载中状态 */}
                {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
                   <div className="w-full px-4 mb-4">
                      <div className="max-w-3xl mx-auto flex gap-4">
                        <div className="shrink-0">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center text-white shadow-lg shadow-green-200">
                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                          </div>
                        </div>
                        <div className="flex-1">
                           <div className="text-xs font-medium text-gray-500 mb-1.5 px-1">专属私教</div>
                           <div className="inline-block bg-white/95 backdrop-blur border border-blue-100/50 px-5 py-4 rounded-2xl rounded-tl-sm shadow-lg shadow-blue-100/30">
                             <div className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms', animationDuration: '1s' }} />
                                <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms', animationDuration: '1s' }} />
                                <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms', animationDuration: '1s' }} />
                                <span className="ml-2 text-sm text-gray-500">正在思考...</span>
                             </div>
                           </div>
                        </div>
                      </div>
                   </div>
                )}

                {/* 底部留白 */}
                <div className="w-full h-36 shrink-0" />
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* 滚动到底部按钮 */}
            {showScrollButton && (
              <button
                onClick={() => scrollToBottom(true)}
                className="absolute bottom-28 left-1/2 -translate-x-1/2 bg-white border border-blue-200 shadow-lg shadow-blue-100/50 rounded-full p-2.5 text-blue-600 hover:text-blue-700 hover:shadow-xl z-10 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </button>
            )}

            {/* 输入区域 */}
            <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-sky-100 via-sky-50/90 to-transparent pt-8 pb-6 px-4">
              <div className="max-w-3xl mx-auto relative">
                <div className="relative flex items-end w-full p-3 bg-white/95 backdrop-blur-xl border border-blue-200/50 shadow-2xl shadow-blue-100/40 rounded-2xl overflow-hidden">
                  <textarea
                    value={inputMessage}
                    onChange={(e) => {
                      setInputMessage(e.target.value);
                      e.target.style.height = 'auto';
                      e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="输入你的问题..."
                    rows={1}
                    className="w-full max-h-[200px] py-2 pl-2 pr-12 resize-none border-none focus:ring-0 focus:outline-none text-gray-800 placeholder-gray-400 bg-transparent"
                    style={{ minHeight: '28px' }}
                    disabled={isLoading}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || isLoading}
                    className={`absolute right-3 bottom-3 p-2.5 rounded-xl transition-all ${
                      inputMessage.trim() && !isLoading
                        ? 'bg-gradient-to-r from-blue-500 to-sky-500 text-white hover:from-blue-600 hover:to-sky-600 shadow-lg shadow-blue-200 hover:shadow-xl hover:scale-105'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
                <div className="text-center text-xs text-gray-500 mt-3">
                   内容仅供参考，请核对重要信息
                </div>
              </div>
            </div>
          </>
        ) : (
          /* 空状态 - 浅蓝色现代化风格 */
          <div className="flex-1 flex flex-col items-center justify-center px-4">
             <div className="text-center max-w-md">
               {/* 图标 */}
               <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-sky-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-200 rotate-3 hover:rotate-0 transition-transform">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
               </div>

               {/* 标题 */}
               <h2 className="text-3xl font-bold text-gray-800 mb-3">有什么可以帮你的吗？</h2>
               <p className="text-gray-500 mb-8">选择一个对话开始，或创建新对话与专属私教交流</p>

               {/* 快捷操作 */}
               <div className="flex flex-col sm:flex-row gap-3 justify-center">
                 <button
                    onClick={() => setShowNewChatForm(true)}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-sky-500 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-sky-600 transition-all shadow-lg shadow-blue-200 hover:shadow-xl hover:-translate-y-0.5"
                 >
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                   </svg>
                   开始新对话
                 </button>
                 {!isSidebarOpen && (
                   <button
                      onClick={() => setIsSidebarOpen(true)}
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all border border-gray-200 shadow-md hover:shadow-lg lg:hidden"
                   >
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                     </svg>
                     查看历史
                   </button>
                 )}
               </div>

               {/* 提示卡片 */}
               <div className="mt-10 grid gap-3 text-left">
                 <div className="p-4 bg-white/80 backdrop-blur rounded-xl border border-blue-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => { setShowNewChatForm(true); setChatType('general'); }}>
                   <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-sky-100 flex items-center justify-center">
                       <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                     </div>
                     <div>
                       <div className="font-semibold text-gray-800">普通对话</div>
                       <div className="text-sm text-gray-500">自由提问，获取 AI 解答</div>
                     </div>
                   </div>
                 </div>
                 <div className="p-4 bg-white/80 backdrop-blur rounded-xl border border-blue-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => { setShowNewChatForm(true); setChatType('learning'); }}>
                   <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-100 to-green-100 flex items-center justify-center">
                       <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                     </div>
                     <div>
                       <div className="font-semibold text-gray-800">系统化学习</div>
                       <div className="text-sm text-gray-500">按学科主题进行结构化学习</div>
                     </div>
                   </div>
                 </div>
               </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
