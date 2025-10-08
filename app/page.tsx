// @ts-nocheck
'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import UnifiedChat from './components/UnifiedChat';
import KnowledgeBase from './components/KnowledgeBase';
import { LearningItem, SUBJECTS } from './types';

// 学习闭环页面URL常量
const LEARNING_LOOP_URL = '/test-jys-learning';

export default function Home() {
  // 状态管理
  const [inputText, setInputText] = useState('')
  const [selectedSubject, setSelectedSubject] = useState(SUBJECTS[0]) // 默认选择第一个科目
  const [savedItems, setSavedItems] = useState<LearningItem[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [isStorageAvailable, setIsStorageAvailable] = useState(true)
  // 知识库条目（来自 KnowledgeBase 组件）
  const [kbItems, setKbItems] = useState<any[]>([])
  // 知识笔记输出内容
  const [knowledgeNotes, setKnowledgeNotes] = useState<string>('')
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [lastSavedTime, setLastSavedTime] = useState<string>('')
  // 界面状态
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return false
  })
  const [isMobileView, setIsMobileView] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const router = useRouter();
  
  // 打开统一对话界面
  const handleOpenChat = () => {
    setShowChat(true);
  };

  // 关闭对话界面
  const handleCloseChat = () => {
    setShowChat(false);
  };

  // 检测响应式设计
  useEffect(() => {
    const checkMobileView = () => {
      setIsMobileView(window.innerWidth < 768)
    }
    
    checkMobileView()
    window.addEventListener('resize', checkMobileView)
    
    // 监听系统暗黑模式变化
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleDarkModeChange = (e: MediaQueryListEvent) => {
      setIsDarkMode(e.matches)
    }
    
    darkModeMediaQuery.addEventListener('change', handleDarkModeChange)
    
    return () => {
      window.removeEventListener('resize', checkMobileView)
      darkModeMediaQuery.removeEventListener('change', handleDarkModeChange)
    }
  }, [])

  // 本地存储配置
  const STORAGE_KEY = 'learning_system_items'
  const STORAGE_VERSION_KEY = 'learning_system_version'
  const CURRENT_VERSION = '2.0.0' // 升级版本以支持分类功能
  const MAX_STORAGE_ITEMS = 500
  const STORAGE_BACKUP_KEY = STORAGE_KEY + '_backup'
  
  // 检查localStorage是否可用的函数 - 增强版
  const checkLocalStorageAvailability = useCallback(() => {
    try {
      // 创建一个唯一的测试键
      const testKey = `__storage_test_${Date.now()}`;
      localStorage.setItem(testKey, testKey);
      const value = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);
      const result = value === testKey;
      setIsStorageAvailable(result);
      if (!result) {
        console.warn('localStorage检测失败，值不匹配');
      }
      return result;
    } catch (e) {
      console.warn('localStorage不可用:', e instanceof Error ? e.message : String(e));
      setIsStorageAvailable(false);
      return false;
    }
  }, []);
  
  // 显示当前localStorage内容的调试函数 - 增强版
  const debugLocalStorage = useCallback(() => {
    try {
      if (isStorageAvailable) {
        const currentValue = localStorage.getItem(STORAGE_KEY);
        const backupValue = localStorage.getItem(STORAGE_BACKUP_KEY);
        const version = localStorage.getItem(STORAGE_VERSION_KEY);
        const keys = Object.keys(localStorage);
        
        console.group('localStorage调试信息');
        console.log('主数据键:', STORAGE_KEY);
        console.log('主数据内容:', currentValue);
        console.log('备份数据键:', STORAGE_BACKUP_KEY);
        console.log('备份数据内容:', backupValue);
        console.log('版本信息:', version);
        console.log('所有存储键:', keys);
        console.log('存储项数量:', keys.length);
        console.groupEnd();
      }
    } catch (e) {
      console.error('调试localStorage失败:', e instanceof Error ? e.message : String(e));
    }
  }, [isStorageAvailable]);

  // 验证数据完整性 - 支持新的数据结构
  const validateDataIntegrity = useCallback((data: any): data is LearningItem[] => {
    try {
      // 检查是否为数组
      if (!Array.isArray(data)) {
        console.error('数据不是数组格式:', typeof data);
        return false;
      }
      
      // 检查数组元素是否都是有效的LearningItem对象
      const allValidItems = data.every((item: any) => {
        return (
          typeof item === 'object' &&
          item !== null &&
          typeof item.id === 'string' &&
          typeof item.text === 'string' &&
          typeof item.subject === 'string' &&
          typeof item.createdAt === 'string'
        );
      });
      
      if (!allValidItems) {
        console.error('数组中包含无效的学习项目');
        return false;
      }
      
      // 检查数组长度是否合理
      if (data.length > MAX_STORAGE_ITEMS) {
        console.warn('存储项数量超过建议最大值');
        // 截取合理数量
      }
      
      return true;
    } catch (e) {
      console.error('验证数据完整性失败:', e instanceof Error ? e.message : String(e));
      return false;
    }
  }, []);



  // 清理无效数据
  const cleanupInvalidData = useCallback(() => {
    try {
      if (isStorageAvailable) {
        console.log('清理无效数据...');
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(STORAGE_VERSION_KEY);
        console.log('无效数据已清理');
      }
    } catch (e) {
      console.error('清理无效数据失败:', e instanceof Error ? e.message : String(e));
    }
  }, [isStorageAvailable]);

  // 创建数据备份
  const createBackup = useCallback((data: LearningItem[]) => {
    try {
      // 尝试使用localStorage备份
      if (isStorageAvailable) {
        localStorage.setItem(STORAGE_BACKUP_KEY, JSON.stringify(data));
        console.log('数据已备份到localStorage');
      } else {
        // 尝试使用sessionStorage作为备选
        sessionStorage.setItem(STORAGE_BACKUP_KEY, JSON.stringify(data));
        console.log('数据已备份到sessionStorage');
      }
    } catch (e) {
      console.error('创建数据备份失败:', e instanceof Error ? e.message : String(e));
    }
  }, [isStorageAvailable]);

  // 从备份恢复数据
  const restoreFromBackup = useCallback(() => {
    try {
      console.log('尝试从备份恢复数据...');
      
      // 尝试从localStorage备份恢复
      let backupData = localStorage.getItem(STORAGE_BACKUP_KEY);
      let source = 'localStorage';
      
      // 如果localStorage没有备份，尝试从sessionStorage恢复
      if (!backupData) {
        backupData = sessionStorage.getItem(STORAGE_BACKUP_KEY);
        source = 'sessionStorage';
      }
      
      if (backupData) {
        const parsedData = JSON.parse(backupData);
        if (validateDataIntegrity(parsedData)) {
          console.log(`成功从${source}恢复数据，共${parsedData.length}项`);
          return parsedData;
        }
      }
      
      console.log('没有找到有效的备份数据');
      return null;
    } catch (e) {
      console.error('从备份恢复数据失败:', e instanceof Error ? e.message : String(e));
      return null;
    }
  }, [validateDataIntegrity]);
  
  // 初始化存储系统
  useEffect(() => {
    const initializeStorage = async () => {
      console.log('开始初始化存储系统...');
      
      // 检查存储可用性
      const available = checkLocalStorageAvailability();
      
      // 延迟加载以确保存储系统稳定
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (available) {
        try {
          // 检查版本兼容性
          const storedVersion = localStorage.getItem(STORAGE_VERSION_KEY);
          console.log(`当前存储版本: ${storedVersion || '未知'}，目标版本: ${CURRENT_VERSION}`);
          
          // 加载主数据
          const savedData = localStorage.getItem(STORAGE_KEY);
          console.log('加载主数据:', savedData ? '存在' : '不存在');
          
          if (savedData) {
            try {
              const parsedData = JSON.parse(savedData);
              
              // 数据迁移：如果是旧版本的字符串数组，转换为新的数据结构
              let itemsToSave: LearningItem[] = [];
              if (Array.isArray(parsedData)) {
                if (parsedData.length > 0 && typeof parsedData[0] === 'string') {
                  // 旧版本数据，进行迁移
                  console.log('检测到旧版本数据，正在进行迁移...');
                  itemsToSave = parsedData.map((text: string, index: number) => ({
                    id: `migrated_${Date.now()}_${index}`,
                    text: text,
                    subject: SUBJECTS[0], // 默认使用第一个科目
                    createdAt: new Date().toISOString()
                  }));
                  console.log('数据迁移完成，共转换', itemsToSave.length, '项');
                } else if (validateDataIntegrity(parsedData)) {
                  // 新版本数据
                  itemsToSave = parsedData;
                  console.log('主数据加载成功，共', parsedData.length, '项');
                }
              }
              
              if (itemsToSave.length > 0) {
                setSavedItems(itemsToSave);
                
                // 如果数据有效，更新版本
                if (storedVersion !== CURRENT_VERSION) {
                  localStorage.setItem(STORAGE_VERSION_KEY, CURRENT_VERSION);
                  console.log('存储版本已更新');
                }
              } else {
                // 数据无效，尝试从备份恢复
                console.warn('主数据无效，尝试从备份恢复...');
                const backupData = restoreFromBackup();
                if (backupData) {
                  setSavedItems(backupData);
                }
                // 清理无效的主数据
                cleanupInvalidData();
              }
            } catch (parseError) {
              console.error('解析主数据失败:', parseError instanceof Error ? parseError.message : String(parseError));
              
              // 尝试从备份恢复
              const backupData = restoreFromBackup();
              if (backupData) {
                setSavedItems(backupData);
              }
              
              // 清理无效数据
              cleanupInvalidData();
            }
          } else {
            console.log('主数据不存在，尝试从备份恢复...');
            const backupData = restoreFromBackup();
            if (backupData) {
              setSavedItems(backupData);
            } else {
              console.log('没有找到可恢复的数据，使用空数组');
            }
          }
        } catch (error) {
          console.error('初始化存储系统失败:', error instanceof Error ? error.message : String(error));
          
          // 尝试从备份恢复
          const backupData = restoreFromBackup();
          if (backupData) {
            setSavedItems(backupData);
          }
        } finally {
          // 显示调试信息
          debugLocalStorage();
        }
      } else {
        console.warn('localStorage不可用，使用内存存储');
        
        // 尝试从sessionStorage恢复
        const backupData = restoreFromBackup();
        if (backupData) {
          setSavedItems(backupData);
        }
      }
    };
    
    initializeStorage();
  }, [checkLocalStorageAvailability, validateDataIntegrity, restoreFromBackup, cleanupInvalidData, debugLocalStorage]);
  
  // 保存数据到本地存储 - 高级版
  useEffect(() => {
    // 防抖保存，避免频繁写入
    const saveTimeout = setTimeout(() => {
      console.log('准备保存数据，当前项目数量:', savedItems.length);
      
      if (savedItems.length === 0) {
        console.log('没有数据需要保存');
        return;
      }
      
      // 验证数据完整性
      if (!validateDataIntegrity(savedItems)) {
        console.error('待保存数据无效，跳过保存');
        return;
      }
      
      // 限制最大项目数
      const dataToSave = savedItems.slice(-MAX_STORAGE_ITEMS);
      
      try {
        // 序列化为JSON
        const jsonData = JSON.stringify(dataToSave);
        const dataSize = new Blob([jsonData]).size;
        
        console.log(`准备保存${dataToSave.length}项数据，大小约${(dataSize / 1024).toFixed(2)}KB`);
        
        if (isStorageAvailable) {
          // 三步保存策略
          try {
            // 1. 先保存到备份位置
            localStorage.setItem(STORAGE_BACKUP_KEY, jsonData);
            console.log('数据已保存到备份位置');
            
            // 2. 清除并重新设置主数据
            localStorage.removeItem(STORAGE_KEY);
            localStorage.setItem(STORAGE_KEY, jsonData);
            
            // 3. 更新版本信息
            localStorage.setItem(STORAGE_VERSION_KEY, CURRENT_VERSION);
            
            // 验证保存是否成功
            const verifyData = localStorage.getItem(STORAGE_KEY);
            if (verifyData === jsonData) {
              console.log('数据已成功保存到localStorage并验证通过');
              setLastSavedTime(new Date().toLocaleTimeString());
              
              // 显示调试信息
              debugLocalStorage();
            } else {
              console.warn('数据保存验证失败，可能存在存储问题');
              // 恢复备份
              localStorage.setItem(STORAGE_KEY, localStorage.getItem(STORAGE_BACKUP_KEY) || jsonData);
            }
          } catch (localError) {
            console.error('保存到localStorage失败:', localError instanceof Error ? localError.message : String(localError));
            
            // 尝试使用sessionStorage作为备选
            try {
              sessionStorage.setItem(STORAGE_KEY, jsonData);
              sessionStorage.setItem(STORAGE_VERSION_KEY, CURRENT_VERSION);
              console.log('已将数据保存到sessionStorage');
              setLastSavedTime(new Date().toLocaleTimeString());
            } catch (sessionError) {
              console.error('保存到sessionStorage也失败:', sessionError instanceof Error ? sessionError.message : String(sessionError));
              console.warn('数据仅保存在内存中，刷新页面将丢失');
            }
          }
        } else {
          // localStorage不可用，尝试使用sessionStorage
          try {
            sessionStorage.setItem(STORAGE_KEY, jsonData);
            console.log('已将数据保存到sessionStorage');
            setLastSavedTime(new Date().toLocaleTimeString());
          } catch (error) {
            console.error('保存到sessionStorage失败:', error instanceof Error ? error.message : String(error));
            console.warn('数据仅保存在内存中，刷新页面将丢失');
          }
        }
      } catch (error) {
        console.error('数据保存过程中发生错误:', error instanceof Error ? error.message : String(error));
      }
    }, 300); // 300ms防抖
    
    return () => clearTimeout(saveTimeout);
  }, [savedItems, isStorageAvailable, validateDataIntegrity, debugLocalStorage]);



  // 处理保存操作
  const handleSave = async () => {
    if (inputText.trim()) {
      setIsSaving(true)
      
      try {
        const newItem: LearningItem = {
          id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          text: inputText.trim(),
          subject: selectedSubject,
          createdAt: new Date().toISOString()
        };
        
        // 更新本地状态
        setSavedItems((prevItems: LearningItem[]) => [...prevItems, newItem])
        
        // 智能保存到系统化学习对话
        await saveToSystematicLearning(newItem);
        
        setInputText('')
        setIsSaving(false)
        
        // 保存后自动聚焦到输入框
        if (inputRef.current) {
          inputRef.current.focus()
        }
        
        // 添加保存成功的动画效果
        if (containerRef.current) {
          containerRef.current.classList.add('save-success')
          setTimeout(() => {
            if (containerRef.current) {
              containerRef.current.classList.remove('save-success')
            }
          }, 500)
        }
      } catch (error) {
        console.error('保存失败:', error);
        setIsSaving(false)
      }
    }
  }

  // 智能保存到系统化学习对话
  const saveToSystematicLearning = async (item: LearningItem) => {
    try {
      const { ConversationService } = await import('./services/conversationService');
      const conversationService = ConversationService.getInstance();
      
      // 检查是否已有该学科的今日学习对话
      const today = new Date().toLocaleDateString('zh-CN');
      const conversationTitle = `${item.subject}学习笔记 - ${today}`;
      
      // 获取所有对话，查找今日该学科的对话
      const allConversations = conversationService.getAllConversations();
      let targetConversation = allConversations.find(conv => 
        conv.title === conversationTitle && 
        conv.type === 'learning' &&
        conv.subject === item.subject
      );
      
      // 创建智能化的学习消息
      const learningMessage = {
        role: 'user' as const,
        content: `📝 学习笔记记录：\n\n**学科：** ${item.subject}\n**内容：** ${item.text}\n**记录时间：** ${new Date().toLocaleString('zh-CN')}`
      };
      
      const aiResponse = {
        role: 'assistant' as const,
        content: `✅ 已记录您的${item.subject}学习笔记！\n\n**学习内容分析：**\n${generateLearningAnalysis(item.text, item.subject)}\n\n**建议下一步：**\n${generateNextStepSuggestion(item.text, item.subject)}`
      };
      
      if (!targetConversation) {
        // 创建新的学习对话
        const createRequest = {
          type: 'learning' as const,
          title: conversationTitle,
          subject: item.subject,
          topic: '学习笔记整理',
          initialMessage: learningMessage
        };
        
        targetConversation = await conversationService.createConversation(createRequest);
        await conversationService.addMessage(targetConversation.id, aiResponse);
      } else {
        // 添加到现有对话
        await conversationService.addMessage(targetConversation.id, learningMessage);
        await conversationService.addMessage(targetConversation.id, aiResponse);
      }
      
      console.log('学习内容已智能保存到系统化学习对话:', targetConversation.id);
    } catch (error) {
      console.error('保存到系统化学习对话失败:', error);
      // 不影响主要保存流程，只是记录错误
    }
  };

  // 生成学习内容分析
  const generateLearningAnalysis = (content: string, subject: string): string => {
    const contentLength = content.length;
    const hasFormulas = /[=+\-*/()^√∫∑]/.test(content);
    const hasKeywords = /定义|定理|公式|方法|步骤|原理|概念/.test(content);
    
    let analysis = '';
    
    if (contentLength > 100) {
      analysis += '• 内容较为详细，建议分段复习\n';
    } else {
      analysis += '• 内容简洁明了，适合快速回顾\n';
    }
    
    if (hasFormulas) {
      analysis += '• 包含数学公式或符号，建议多练习计算\n';
    }
    
    if (hasKeywords) {
      analysis += '• 包含重要概念，建议深入理解并记忆\n';
    }
    
    if (subject === '数学') {
      analysis += '• 数学学习建议：理解概念→练习例题→总结方法\n';
    } else if (subject === '物理') {
      analysis += '• 物理学习建议：掌握原理→分析过程→应用实践\n';
    } else if (subject === '化学') {
      analysis += '• 化学学习建议：记忆基础→理解反应→实验验证\n';
    }
    
    return analysis;
  };

  // 生成下一步学习建议
  const generateNextStepSuggestion = (content: string, subject: string): string => {
    const suggestions = [
      '复习相关基础概念',
      '寻找类似例题进行练习',
      '制作思维导图整理知识点',
    ];
    
    // 根据内容和学科智能选择建议
    if (content.includes('公式') || content.includes('定理')) {
      return '• 多做相关练习题巩固公式应用\n• 理解公式推导过程\n• 总结公式使用条件';
    } else if (content.includes('概念') || content.includes('定义')) {
      return '• 用自己的话重新表述概念\n• 寻找生活中的实际例子\n• 与相关概念进行对比学习';
    } else {
      return suggestions.slice(0, 3).map(s => `• ${s}`).join('\n');
    }
  };

  // 处理键盘事件
  const handleKeyDown = (e: any) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSave();
    }
  };

  // 删除保存的项目
  const handleDeleteItem = (index: number) => {
    // 先获取更新后的数据
    const updatedItems = savedItems.filter((_, i) => i !== index);
    
    // 更新状态
    setSavedItems(updatedItems);
    
    // 确保数据被持久化 - 直接调用保存逻辑
    try {
      if (isStorageAvailable && updatedItems.length > 0) {
        // 立即保存到localStorage以避免数据丢失
        const jsonData = JSON.stringify(updatedItems);
        localStorage.setItem(STORAGE_KEY, jsonData);
        localStorage.setItem(STORAGE_BACKUP_KEY, jsonData);
        console.log('删除项目后数据已立即保存到localStorage');
      } else if (updatedItems.length === 0) {
        // 如果删除后没有项目了，清除所有存储位置（包括备份）的数据
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(STORAGE_BACKUP_KEY);
        sessionStorage.removeItem(STORAGE_KEY);
        sessionStorage.removeItem(STORAGE_BACKUP_KEY);
        console.log('所有项目已删除，已清除所有存储中的数据');
      }
    } catch (error) {
      console.error('删除项目后立即保存失败:', error instanceof Error ? error.message : String(error));
    }
  };





  // 将知识库条目转换为 AIChat 可用的 LearningItem 结构
  const kbAsLearningItems = (kbItems || [])
    .filter((it: any) => (it?.include !== false))
    .filter((it: any) => (it?.text && String(it.text).trim().length > 0) || (it?.notes && String(it.notes).trim().length > 0))
    .map((it: any) => ({
      id: `kb_${it.id}`,
      text: it.text ? String(it.text) : `[${it.name || '附件'}] ${String(it.notes || '')}`,
      subject: it.name ? `知识库/${it.name}` : '知识库',
      createdAt: new Date(it.createdAt || Date.now()).toISOString(),
    }))

  // 合并后的学习内容（用户输入 + 知识库）
  const mergedSavedItems = [...savedItems, ...kbAsLearningItems]

  return (
    <div 
      ref={containerRef}
      className={`min-h-screen p-4 sm:p-6 md:p-8 flex flex-col transition-all duration-500 relative bg-cover bg-center bg-no-repeat ${isDarkMode ? 'dark bg-gray-900' : ''}`}
      style={{ backgroundImage: isDarkMode ? "none" : "url('/uni.png')" }}
    >
      {/* 头部 */}
      <header className="text-center mb-8 animate-fade-in relative">

        <h1 className={`text-3xl sm:text-4xl md:text-5xl font-bold mb-2 animate-gradient bg-clip-text text-transparent ${isDarkMode ? 'bg-gradient-to-r from-purple-400 to-pink-400' : 'bg-gradient-to-r from-blue-500 to-cyan-400'} transition-all duration-500 hover:scale-105`}>
          自学系统
        </h1>
        <p className={`${isDarkMode ? 'text-gray-300' : 'text-blue-200'} text-lg font-medium tracking-wide transition-all duration-300 hover:text-blue-100`}>
          以自学为基础，以生产为导向
        </p>
        {/* 开始学习按钮 */}
        <div className="mt-6 flex flex-col items-center">
          <button
            onClick={handleOpenChat}
            className="px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-full shadow-lg hover:from-blue-600 hover:to-purple-700 hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-opacity-50 flex flex-col items-center gap-1"
          >
            <div className="text-sm flex items-center gap-2">
              🎯 点击这里，开启今日学习任务
            </div>
            <div className="text-xs text-white/90 font-normal">
              专业教练将为你自动生成讲解、提问、小测与复盘。
            </div>
          </button>
        </div>
        
        {/* 知识库和已保存内容 - 三栏布局 */}
        <div className="mt-8 flex items-start max-w-6xl mx-auto px-8 gap-6">
          {/* 左栏 - 知识库（三分之二大小，向左） */}
          <div className="flex-shrink-0 transform scale-75 origin-top-left w-1/3">
            <KnowledgeBase onItemsChange={setKbItems} hideParsingText={true} />
          </div>
          
          {/* 中间 - 不做第一做唯一模块和知识笔记输出 */}
          <div className="flex-1 flex flex-col items-center space-y-6">
            {/* 不做第一做唯一模块 */}
            <div className="bg-white/95 border border-blue-200 rounded-lg p-4 shadow-md hover:shadow-lg transition-all duration-300 backdrop-blur-md transform hover:-translate-y-0.5 w-80">
              <h3 className="text-base font-semibold text-primary mb-2 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                不做第一做唯一 · 2035去火星🫵
              </h3>
              <p className="text-gray-700 mb-3 text-sm leading-relaxed">
                这是一个AI时代，更是学习者和生产者的时代
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium">
                  自学
                </span>
                <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium">
                  积累
                </span>
                <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium">
                  思考
                </span>
              </div>
            </div>
            
            {/* 知识笔记输出区域 - GPT风格气泡 */}
            {knowledgeNotes && (
              <div className="w-80 max-w-md">
                <div className="relative">
                  {/* GPT风格的气泡：左侧圆角，右侧半圆 */}
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 text-gray-800 px-4 py-3 rounded-l-2xl rounded-tr-2xl rounded-br-sm relative shadow-sm">
                    <div className="text-sm leading-relaxed whitespace-pre-wrap">
                      {knowledgeNotes}
                    </div>
                    {/* 右侧半圆形装饰 */}
                    <div className="absolute -right-2 top-1/2 transform -translate-y-1/2 w-4 h-8 bg-gradient-to-r from-blue-100 to-blue-50 rounded-r-full"></div>
                  </div>
                </div>
              </div>
            )}
            
            {/* 已保存内容 - ChatGPT风格气泡 */}
            {savedItems.length > 0 && (
              <div className="w-80 max-w-md animate-fade-in">
                <div className="relative">
                  {/* ChatGPT风格的气泡：左侧圆角，右侧半圆 */}
                  <div className="bg-gradient-to-r from-green-50 to-green-100 text-gray-800 px-4 py-3 rounded-l-2xl rounded-tr-2xl rounded-br-sm relative shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-sm font-semibold text-green-700 flex items-center gap-1">
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-200 text-green-700 text-xs font-medium">
                          📝
                        </span>
                        已保存的内容 ({savedItems.length})
                      </h2>
                      <button 
                        onClick={() => {
                          setSavedItems([]);
                          try {
                            if (isStorageAvailable) {
                              localStorage.removeItem(STORAGE_KEY);
                              localStorage.removeItem(STORAGE_BACKUP_KEY);
                              sessionStorage.removeItem(STORAGE_KEY);
                              sessionStorage.removeItem(STORAGE_BACKUP_KEY);
                              console.log('所有项目已删除，已清除所有存储中的数据');
                            }
                          } catch (error) {
                            console.error('清空项目后立即保存失败:', error instanceof Error ? error.message : String(error));
                          }
                        }}
                        className="text-sm text-gray-500 hover:text-red-500 transition-colors"
                        aria-label="清空所有内容"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    <ul className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-green-200 scrollbar-track-transparent">
                      {savedItems.map((item: LearningItem, index: number) => (
                        <li key={item.id} className="flex items-start p-1.5 rounded-md bg-white/50 text-gray-700 hover:bg-white/70 transition-all duration-200 group relative max-w-sm">
                          <span className="inline-flex items-center justify-center w-3 h-3 rounded-full bg-green-200 text-green-700 text-xs font-medium mt-0.5 flex-shrink-0 mr-1.5">
                            {index + 1}
                          </span>
                          <div className="flex-grow min-w-0">
                            <span className="whitespace-pre-wrap break-words text-xs leading-relaxed">
                              <span className="inline-block px-1.5 py-0.5 bg-green-200 text-green-700 text-xs rounded-md mr-1">
                                {item.subject}
                              </span>
                              {item.text}
                            </span>
                          </div>
                          <button 
                            onClick={() => handleDeleteItem(index)}
                            className="absolute right-1 top-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                            aria-label={`删除第${index + 1}项`}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-400 hover:text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </li>
                      ))}
                    </ul>
                    {/* 右侧半圆形装饰 */}
                    <div className="absolute -right-2 top-1/2 transform -translate-y-1/2 w-4 h-8 bg-gradient-to-r from-green-100 to-green-50 rounded-r-full"></div>
                  </div>
                </div>
              </div>
            )}
 
          </div>
          
          {/* 右栏内容 - 现在为空 */}
          <div className="flex-shrink-0 w-80">
          </div>
          

        </div>
      </header>
      
      {/* 主要内容区域 */}
      <div className="flex-grow flex gap-4">
        {/* 左侧边栏 - 现在为空 */}
        <aside className="hidden md:block w-64 shrink-0 order-0">
          <div className="sticky top-6">
            {/* 模块已移动到左栏正中间 */}
          </div>
        </aside>
        
        {/* 中间主内容区域 - 记录学习板块 */}
        <main className="flex-grow order-1 flex flex-col items-center">
          {/* 记录学习的板块 - 居中大小适中 */}
          <div className="w-full max-w-xl mx-auto my-6">
            {/* 移动端已保存内容 */}
            <div className="md:hidden mb-6">
              {savedItems.length > 0 && (
                <div className="animate-fade-in bg-slate-50/70 border border-slate-200 dark:border-slate-700 rounded-lg p-3 shadow-md hover:shadow-lg transition-all duration-300 backdrop-blur-md">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-sm font-semibold text-primary flex items-center gap-1">
                      <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary/10 text-primary text-xs font-medium">
                        📝
                      </span>
                      已保存的内容 ({savedItems.length})
                    </h2>
                    <button 
                      onClick={() => {
                        setSavedItems([]);
                        try {
                          if (isStorageAvailable) {
                            localStorage.removeItem(STORAGE_KEY);
                            localStorage.removeItem(STORAGE_BACKUP_KEY);
                            sessionStorage.removeItem(STORAGE_KEY);
                            sessionStorage.removeItem(STORAGE_BACKUP_KEY);
                            console.log('所有项目已清空，已清除所有存储中的数据');
                          }
                        } catch (error) {
                          console.error('清空项目后立即保存失败:', error instanceof Error ? error.message : String(error));
                        }
                      }}
                      className="text-sm text-gray-500 hover:text-red-500 transition-colors"
                      aria-label="清空所有内容"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  <ul className="space-y-2 max-h-[180px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-purple-200 dark:scrollbar-thumb-purple-700 scrollbar-track-transparent">
                    {savedItems.map((item: LearningItem, index: number) => (
                      <li key={item.id} className="flex items-start p-2 rounded-md bg-slate-100/50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 hover:bg-primary/5 transition-all duration-200 group relative">
                        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary/10 text-primary text-xs font-medium mt-0.5">
                        {index + 1}
                      </span>
                        <div className="flex-grow">
                          <span className="inline-block px-1.5 py-0.5 bg-primary/10 text-primary text-xs rounded-md mb-1">
                            {item.subject}
                          </span>
                          <span className="flex-grow whitespace-pre-wrap break-words text-xs group-hover:text-primary transition-colors">{item.text}</span>
                        </div>
                        <button 
                          onClick={() => handleDeleteItem(index)}
                          className="absolute right-1 top-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label={`删除第${index + 1}项`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-400 hover:text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            

          </div>
        </main>
      </div>
      


      {/* 固定在底部的输入区域 - 调小尺寸 */}
      <div className="fixed bottom-4 left-0 right-0 p-4 border-t border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="w-full max-w-2xl mx-auto">
          {/* 分类选择下拉菜单 */}
          <div className="mb-2">
            <label htmlFor="subject-select" className="text-xs text-gray-500 mr-2">选择科目：</label>
            <select
              id="subject-select"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              disabled={isSaving}
              className={`px-3 py-1.5 rounded-md border border-slate-200 bg-white dark:bg-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-300 ${isSaving ? 'bg-slate-100 dark:bg-slate-700 cursor-not-allowed' : ''}`}
            >
              {SUBJECTS.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </div>
          
          <div className="relative">
            <textarea
              ref={inputRef}
              value={inputText}
              onChange={(e) => {
                const newValue = e.target.value;
                setInputText(newValue);
                
                // 自动调整高度 - 更平滑的GPT风格
                if (inputRef.current) {
                  inputRef.current.style.height = 'auto';
                  const newHeight = Math.max(32, Math.min(inputRef.current.scrollHeight, 100));
                  inputRef.current.style.height = newHeight + 'px';
                }
              }}
              onKeyDown={(e) => {
                handleKeyDown(e);
              }}
              placeholder="输入你的学习心得、思考或灵感..."
              className="w-full pl-4 pr-12 py-2 rounded-2xl border border-slate-200 bg-white dark:bg-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary resize-none text-sm transition-all duration-300 shadow-sm hover:shadow-md mx-auto"
              disabled={isSaving}
              style={{ height: '32px', overflow: 'hidden' }}
            />
            
            {/* 发送按钮 - GPT风格的右下角按钮 */}
            <button
              onClick={handleSave}
              disabled={isSaving || inputText.trim().length === 0}
              className={`absolute right-3 bottom-3 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-105 ${isSaving || inputText.trim().length === 0 ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-primary text-white hover:bg-primary/90 active:bg-primary/80 shadow hover:shadow-md'}`}
              aria-label="发送"
            >
              {isSaving ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          </div>
          
          {/* 输入提示 - GPT风格的提示 */}
          <div className="mt-2 text-xs text-gray-500 flex items-center justify-between">
            <div>
              <kbd className="px-2 py-1 bg-gray-100 rounded-md text-xs font-mono">Ctrl</kbd>
              <span className="mx-1">+</span>
              <kbd className="px-2 py-1 bg-gray-100 rounded-md text-xs font-mono">Enter</kbd>
              <span className="ml-2">发送</span>
            </div>
            <span className="text-gray-400">继续输入或按发送键保存</span>
          </div>
        </div>
      </div>
      
      {/* 底部空间，确保内容不被输入框遮挡 */}
      <div className="h-40"></div>
      
      {/* 统一对话组件 */}
      {showChat && (
        <UnifiedChat 
          savedItems={mergedSavedItems} 
          onClose={handleCloseChat} 
        />
      )}
    </div>
  )
}