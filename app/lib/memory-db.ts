
// 简单的内存数据库，用于开发环境数据库不可用时的兜底
// 挂载在 global 对象上以在热重载中保持数据

const globalForMemoryDB = global as unknown as { memoryDB: MemoryDB };

class MemoryDB {
  conversations: any[] = [];
  learningSessions: any[] = [];
  
  constructor() {
    console.log('🌟 [MemoryDB] 初始化内存数据库');
  }

  // Conversation Methods
  async createConversation(data: any) {
    const id = `mem_conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    
    // 处理嵌套写入 learningSession
    let learningSession = null;
    if (data.learningSession && data.learningSession.create) {
      const lsData = data.learningSession.create;
      learningSession = {
        id: `mem_ls_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        conversationId: id,
        ...lsData,
        createdAt: now,
        updatedAt: now
      };
      this.learningSessions.push(learningSession);
    }

    const conversation = {
      id,
      ...data,
      learningSession: undefined, // 移除嵌套定义
      createdAt: now,
      updatedAt: now,
      lastActivity: now,
      isArchived: false,
      messageCount: data.messages ? data.messages.length : 0
    };
    
    this.conversations.push(conversation);
    
    // 返回时带上关联数据
    return {
      ...conversation,
      learningSession
    };
  }

  async getConversations(where: any) {
    // 简单的过滤逻辑
    let results = this.conversations.filter(c => !c.isArchived);
    if (where.userId) results = results.filter(c => c.userId === where.userId);
    if (where.type) results = results.filter(c => c.type === where.type);
    
    // 关联 learningSession
    return results.map(c => ({
      ...c,
      learningSession: this.learningSessions.find(ls => ls.conversationId === c.id)
    })).sort((a, b) => b.lastActivity - a.lastActivity);
  }

  async getConversation(id: string, userId?: string) {
    const conversation = this.conversations.find(c => c.id === id);
    if (!conversation) return null;
    if (userId && conversation.userId !== userId) return null;
    
    return {
      ...conversation,
      learningSession: this.learningSessions.find(ls => ls.conversationId === id)
    };
  }

  async deleteConversation(id: string, userId?: string) {
    const index = this.conversations.findIndex(c => c.id === id);
    if (index === -1) return false;
    
    const conversation = this.conversations[index];
    if (userId && conversation.userId !== userId) return false;
    
    // 删除对话
    this.conversations.splice(index, 1);
    
    // 级联删除 LearningSession
    const lsIndex = this.learningSessions.findIndex(ls => ls.conversationId === id);
    if (lsIndex !== -1) {
      this.learningSessions.splice(lsIndex, 1);
    }
    
    return true;
  }

  async updateConversation(id: string, data: any, userId?: string) {
    const index = this.conversations.findIndex(c => c.id === id);
    if (index === -1) {
      throw new Error(`Conversation ${id} not found`);
    }
    
    const existing = this.conversations[index];
    if (userId && existing.userId !== userId) {
      throw new Error('Unauthorized');
    }

    const updated = {
      ...existing,
      ...data,
      updatedAt: new Date(),
      lastActivity: new Date()
    };
    
    if (data.messages) {
      updated.messageCount = data.messages.length;
    }

    this.conversations[index] = updated;
    
    return {
      ...updated,
      learningSession: this.learningSessions.find(ls => ls.conversationId === id)
    };
  }

  // LearningSession Methods
  async upsertLearningSession(data: any) {
    const existingIndex = this.learningSessions.findIndex(ls => ls.conversationId === data.conversationId);
    const now = new Date();
    
    if (existingIndex >= 0) {
      // Update
      const existing = this.learningSessions[existingIndex];
      const updated = {
        ...existing,
        ...data,
        updatedAt: now
      };
      this.learningSessions[existingIndex] = updated;
      return updated;
    } else {
      // Create
      const newItem = {
        id: `mem_ls_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...data,
        createdAt: now,
        updatedAt: now
      };
      this.learningSessions.push(newItem);
      return newItem;
    }
  }
}

export const memoryDB = globalForMemoryDB.memoryDB || new MemoryDB();

if (process.env.NODE_ENV !== 'production') {
  globalForMemoryDB.memoryDB = memoryDB;
}
