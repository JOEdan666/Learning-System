'use client'

import { 
  ConversationHistory, 
  ConversationListQuery, 
  ConversationListResponse,
  CreateConversationRequest,
  UpdateConversationRequest,
  GenerateTitleRequest,
  GenerateTitleResponse
} from '../types/conversation';
import { ChatMessage } from '../utils/chatTypes';
import { createProviderFromEnv } from './ai';
import type { AIProvider } from './ai';

export class ConversationService {
  private static instance: ConversationService;
  private aiProvider: AIProvider | null = null;
  
  private constructor() {
    this.aiProvider = createProviderFromEnv();
  }
  
  static getInstance(): ConversationService {
    if (!ConversationService.instance) {
      ConversationService.instance = new ConversationService();
    }
    return ConversationService.instance;
  }

  // 获取对话列表
  async getConversations(query: ConversationListQuery = {}): Promise<ConversationListResponse> {
    try {
      const params = new URLSearchParams();
      if (query.page) params.append('page', query.page.toString());
      if (query.limit) params.append('limit', query.limit.toString());
      if (query.type) params.append('type', query.type);
      if (query.search) params.append('search', query.search);
      if (query.sortBy) params.append('sortBy', query.sortBy);
      if (query.sortOrder) params.append('sortOrder', query.sortOrder);

      const response = await fetch(`/api/conversations?${params.toString()}`);
      if (!response.ok) {
        throw new Error('获取对话列表失败');
      }
      return await response.json();
    } catch (error) {
      console.error('获取对话列表失败:', error);
      return {
        conversations: [],
        total: 0,
        page: 1,
        limit: 20,
        hasMore: false
      };
    }
  }

  // 获取单个对话
  async getConversation(id: string): Promise<ConversationHistory | null> {
    try {
      const response = await fetch(`/api/conversations/${id}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('获取对话详情失败');
      }
      const data = await response.json();
      return {
        ...data,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
        lastActivity: new Date(data.lastActivity),
        learningSession: data.learningSession ? {
          ...data.learningSession,
          createdAt: new Date(data.learningSession.createdAt),
          updatedAt: new Date(data.learningSession.updatedAt)
        } : undefined
      };
    } catch (error) {
      console.error('获取对话详情失败:', error);
      return null;
    }
  }

  // 创建新对话
  async createConversation(request: CreateConversationRequest): Promise<ConversationHistory> {
    try {
      // 如果没有标题，先生成默认标题
      if (!request.title) {
        request.title = await this.generateDefaultTitle(request);
      }

      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error('创建对话失败');
      }

      const data = await response.json();
      return {
        ...data,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
        lastActivity: new Date(data.lastActivity),
        learningSession: data.learningSession ? {
          ...data.learningSession,
          createdAt: new Date(data.learningSession.createdAt),
          updatedAt: new Date(data.learningSession.updatedAt)
        } : undefined
      };
    } catch (error) {
      console.error('创建对话失败:', error);
      throw error;
    }
  }

  // 更新对话
  async updateConversation(id: string, request: UpdateConversationRequest): Promise<ConversationHistory | null> {
    try {
      const response = await fetch(`/api/conversations/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error('更新对话失败');
      }

      const data = await response.json();
      return {
        ...data,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
        lastActivity: new Date(data.lastActivity),
        learningSession: data.learningSession ? {
          ...data.learningSession,
          createdAt: new Date(data.learningSession.createdAt),
          updatedAt: new Date(data.learningSession.updatedAt)
        } : undefined
      };
    } catch (error) {
      console.error('更新对话失败:', error);
      return null;
    }
  }

  // 删除对话
  async deleteConversation(id: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/conversations/${id}`, {
        method: 'DELETE',
      });
      return response.ok;
    } catch (error) {
      console.error('删除对话失败:', error);
      return false;
    }
  }

  // 添加消息到对话
  async addMessage(conversationId: string, message: ChatMessage): Promise<ConversationHistory | null> {
    try {
      // 获取当前对话最新状态
      const current = await this.getConversation(conversationId);
      if (!current) return null;

      // 防止重复消息
      const lastMessage = current.messages[current.messages.length - 1];
      if (lastMessage && 
          lastMessage.role === message.role && 
          lastMessage.content === message.content) {
        return current;
      }

      const messages = [...current.messages, message];
      
      return await this.updateConversation(conversationId, {
        messages
      });
    } catch (error) {
      console.error('添加消息失败:', error);
      return null;
    }
  }

  // 生成对话标题 (保持原逻辑，因为这是调用 AI 服务，不涉及数据库)
  async generateTitle(request: GenerateTitleRequest): Promise<GenerateTitleResponse> {
    try {
      if (request.type === 'learning' && request.subject && request.topic) {
        return {
          title: `${request.subject} - ${request.topic}`,
          confidence: 1.0
        };
      }

      const tempProvider = createProviderFromEnv();
      if (!tempProvider) {
        throw new Error('AI Provider 未初始化');
      }

      const recentMessages = request.messages.slice(-6);
      const conversationContent = recentMessages
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n');

      const prompt = `请基于以下对话内容，生成一个简洁精炼的对话标题（不超过10个字）：

${conversationContent}

要求：
1. 标题要能概括对话的主要内容
2. 简洁明了，尽量不超过10个字
3. 避免使用"关于"、"讨论"等冗余词汇
4. 直接返回标题文本，不要包含任何标点符号或重复内容
5. 不要重复输出标题

标题：`;

      return new Promise((resolve) => {
        let fullResponse = '';
        
        tempProvider.onMessage((message: string, isFinal: boolean) => {
          fullResponse += message;
          if (isFinal) {
            let title = fullResponse.trim().replace(/^标题[：:]\s*/, '').trim();
            if (title.length > 4) {
              if (title.length % 2 === 0) {
                const halfLen = title.length / 2;
                const firstHalf = title.substring(0, halfLen);
                const secondHalf = title.substring(halfLen);
                if (firstHalf === secondHalf) {
                  title = firstHalf;
                }
              }
              title = title.replace(/(.{2,})\1+/g, '$1');
            }
            tempProvider.close();
            resolve({
              title: title || '新对话',
              confidence: 0.8
            });
          }
        });
        
        tempProvider.onError((error: string) => {
          console.error('生成标题失败:', error);
          tempProvider.close();
          resolve({
            title: request.type === 'learning' ? '系统化学习' : '新对话',
            confidence: 0.5
          });
        });
        
        tempProvider.sendMessage(prompt);
      });
    } catch (error) {
      console.error('生成标题失败:', error);
      return {
        title: request.type === 'learning' ? '系统化学习' : '新对话',
        confidence: 0.5
      };
    }
  }

  // 生成默认标题
  private async generateDefaultTitle(request: CreateConversationRequest): Promise<string> {
    if (request.type === 'learning' && request.subject && request.topic) {
      return `${request.subject} - ${request.topic}`;
    }
    
    if (request.initialMessage) {
      const titleResponse = await this.generateTitle({
        messages: [request.initialMessage],
        type: request.type,
        subject: request.subject,
        topic: request.topic
      });
      return titleResponse.title;
    }

    return request.type === 'learning' ? '系统化学习' : '新对话';
  }

  // 导出对话历史 (从API获取所有数据)
  async exportConversations(): Promise<string> {
    const response = await this.getConversations({ limit: 1000 });
    return JSON.stringify({
      version: '1.0',
      exportDate: new Date().toISOString(),
      conversations: response.conversations
    }, null, 2);
  }

  // 导入对话历史 (暂不支持批量导入到数据库，因为需要处理ID冲突等)
  async importConversations(jsonData: string): Promise<boolean> {
    console.warn('云端存储模式暂不支持批量导入');
    return false;
  }
}
