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

export class ConversationService {
  private static instance: ConversationService;

  private constructor() {
    // 无需初始化AI Provider，标题生成通过API完成
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

  // 查找或创建学习对话 (复用 createConversation，后端已处理幂等性)
  async findOrCreateLearningConversation(request: CreateConversationRequest): Promise<ConversationHistory> {
    return this.createConversation(request);
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

  // 生成对话标题 (通过API调用，服务端有API Key)
  async generateTitle(request: GenerateTitleRequest): Promise<GenerateTitleResponse> {
    try {
      const response = await fetch('/api/generate-title', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: request.messages,
          type: request.type,
          subject: request.subject,
          topic: request.topic
        }),
      });

      if (!response.ok) {
        throw new Error('生成标题API请求失败');
      }

      return await response.json();
    } catch (error) {
      console.error('生成标题失败:', error);
      // 本地备用方案
      const firstUser = request.messages.find(m => m.role === 'user');
      const fallback = firstUser?.content || request.messages[0]?.content || '';
      const plain = (fallback || '').replace(/\s+/g, ' ').trim();
      const title = plain.length > 12 ? plain.slice(0, 12) + '…' : (plain || '新对话');
      return {
        title,
        confidence: 0.3
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
