// @ts-nocheck
'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import AIChat from './components/AIChat';
import KnowledgeBase from './components/KnowledgeBase';
import { LearningItem, SUBJECTS } from './types';

export default function Home() {
  // 状态管理
  const [inputText, setInputText] = useState('')
  const [selectedSubject, setSelectedSubject] = useState(SUBJECTS[0]) // 默认选择第一个科目
  const [savedItems, setSavedItems] = useState<LearningItem[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [isStorageAvailable, setIsStorageAvailable] = useState(true)
  // 知识库条目（来自 KnowledgeBase 组件）
  const [kbItems, setKbItems] = useState<any[]>([])
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
  const handleSave = () => {
    if (inputText.trim()) {
      setIsSaving(true)
      
      // 模拟异步保存操作
      setTimeout(() => {
        const newItem: LearningItem = {
          id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          text: inputText.trim(),
          subject: selectedSubject,
          createdAt: new Date().toISOString()
        };
        
        setSavedItems((prevItems: LearningItem[]) => [...prevItems, newItem])
        setInputText('')
        // 保持当前选择的科目，不重置
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
      }, 500)
    }
  }

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

  // AI聊天相关状态和函数
  const [showAIChat, setShowAIChat] = useState(false);

  const handleOpenAIChat = () => {
    setShowAIChat(true);
  };

  const handleCloseAIChat = () => {
    setShowAIChat(false);
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
        <div className="absolute right-4 top-2 flex items-center space-x-2">
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/30 transition-all duration-300"
            aria-label={isDarkMode ? "切换到亮色模式" : "切换到暗色模式"}
          >
            {isDarkMode ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
        </div>
        <h1 className={`text-3xl sm:text-4xl md:text-5xl font-bold mb-2 animate-gradient bg-clip-text text-transparent ${isDarkMode ? 'bg-gradient-to-r from-purple-400 to-pink-400' : 'bg-gradient-to-r from-blue-500 to-cyan-400'} transition-all duration-500 hover:scale-105`}>
          自学系统
        </h1>
        <p className={`${isDarkMode ? 'text-gray-300' : 'text-blue-200'} text-lg font-medium tracking-wide transition-all duration-300 hover:text-blue-100`}>
          以自学为基础，以生产为导向
        </p>
      </header>
      
      {/* 主要内容区域 */}
      <div className="flex-grow flex gap-4">
        {/* 左侧 - 今日学习提示 */}
        <aside className="hidden md:block w-64 shrink-0 order-0">
          <div className="sticky top-6">
            <div className="bg-white/95 border border-blue-200 rounded-lg p-4 shadow-md hover:shadow-lg transition-all duration-300 backdrop-blur-md transform hover:-translate-y-0.5">
              <h3 className="text-base font-semibold text-blue-600 mb-2 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                不做第一做唯一 · 2035去火星🫵
              </h3>
              <p className="text-gray-700 mb-3 text-sm leading-relaxed">
                这是一个AI时代，更是学习者和生产者的时代😎
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                  自学
                </span>
                <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                  积累
                </span>
                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                  思考
                </span>
              </div>
            </div>
          </div>
        </aside>
        
        {/* 中间主内容区域 - 记录学习板块 */}
        <main className="flex-grow order-1 flex flex-col items-center">
          {/* 记录学习的板块 - 居中大小适中 */}
          <div className="w-full max-w-2xl mx-auto my-6">
            {/* 知识库上传与管理 */}
            <div className="mb-6">
              <KnowledgeBase onItemsChange={setKbItems} />
            </div>
            {/* 移动端已保存内容 */}
            <div className="md:hidden mb-6">
              {savedItems.length > 0 && (
                <div className="animate-fade-in bg-white/70 border border-purple-200 rounded-lg p-3 shadow-md hover:shadow-lg transition-all duration-300 backdrop-blur-md">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-sm font-semibold text-purple-600 flex items-center gap-1">
                      <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-purple-100 text-purple-600 text-xs font-medium">
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
                      className="text-xs text-gray-500 hover:text-red-500 transition-colors"
                      aria-label="清空所有内容"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  <ul className="space-y-2 max-h-[180px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-purple-200 dark:scrollbar-thumb-purple-700 scrollbar-track-transparent">
                    {savedItems.map((item: LearningItem, index: number) => (
                      <li key={item.id} className="flex items-start p-2 rounded-md bg-purple-50 text-gray-700 hover:bg-purple-100/50 transition-all duration-200 group relative">
                        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-purple-100 text-purple-600 text-xs font-medium mt-0.5">
                        {index + 1}
                      </span>
                        <div className="flex-grow">
                          <span className="inline-block px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-md mb-1">
                            {item.subject}
                          </span>
                          <span className="flex-grow whitespace-pre-wrap break-words text-xs group-hover:text-purple-600 transition-colors">{item.text}</span>
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
            
            {/* 已保存内容（桌面端） */}
            <div className="hidden md:block">
              {savedItems.length > 0 && (
                <div className="animate-fade-in bg-white/70 border border-purple-200 rounded-lg p-4 shadow-md hover:shadow-lg transition-all duration-300 backdrop-blur-md mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold text-purple-600 flex items-center gap-1">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-purple-100 text-purple-600 text-xs font-medium">
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
                  <ul className="space-y-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-purple-200 dark:scrollbar-thumb-purple-700 scrollbar-track-transparent">
                    {savedItems.map((item: LearningItem, index: number) => (
                      <li key={item.id} className="flex items-start p-3 rounded-md bg-purple-50 text-gray-700 hover:bg-purple-100/50 transition-all duration-200 group relative">
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-purple-100 text-purple-600 text-xs font-medium mt-0.5">
                        {index + 1}
                      </span>
                        <div className="flex-grow ml-2">
                          <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-md mb-1.5">
                            {item.subject}
                          </span>
                          <span className="flex-grow whitespace-pre-wrap break-words text-sm group-hover:text-purple-600 transition-colors">{item.text}</span>
                        </div>
                        <button 
                          onClick={() => handleDeleteItem(index)}
                          className="absolute right-2 top-2.5 opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label={`删除第${index + 1}项`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 hover:text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
      
      {/* AI助手按钮 */}
      <button 
        onClick={handleOpenAIChat}
        className="fixed bottom-20 right-4 bg-blue-500 text-white p-3 rounded-full shadow-lg hover:bg-blue-600 z-10"
        title="打开AI助手"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
        </svg>
      </button>

      {/* 固定在底部的输入区域 - 调小尺寸 */}
      <div className="fixed bottom-0 left-0 right-0 p-3 border-t border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="w-full max-w-3xl mx-auto">
          {/* 分类选择下拉菜单 */}
          <div className="mb-2">
            <label htmlFor="subject-select" className="text-xs text-gray-500 mr-2">选择科目：</label>
            <select
              id="subject-select"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              disabled={isSaving}
              className={`px-3 py-1.5 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 ${isSaving ? 'bg-gray-100 cursor-not-allowed' : ''}`}
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
                  const newHeight = Math.max(40, Math.min(inputRef.current.scrollHeight, 150));
                  inputRef.current.style.height = newHeight + 'px';
                }
              }}
              onKeyDown={(e) => {
                handleKeyDown(e);
              }}
              placeholder="输入你的学习心得、思考或灵感..."
              className="w-full pl-3 pr-14 py-2 rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm transition-all duration-300 shadow-sm hover:shadow"
              disabled={isSaving}
              style={{ height: '40px', overflow: 'hidden' }}
            />
            
            {/* 发送按钮 - GPT风格的右下角按钮 */}
            <button
              onClick={handleSave}
              disabled={isSaving || inputText.trim().length === 0}
              className={`absolute right-3 bottom-3 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-105 ${isSaving || inputText.trim().length === 0 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 shadow hover:shadow-md'}`}
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
      
      {/* AI聊天组件 */}
      {showAIChat && (
        <AIChat 
          savedItems={mergedSavedItems} 
          onClose={handleCloseAIChat} 
        />
      )}
    </div>
  )
}