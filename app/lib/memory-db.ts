// 简单的内存数据库，用于开发环境数据库不可用时的兜底
// 使用全局变量在所有路由间共享数据

declare global {
  var __memoryDBData: { conversations: any[]; learningSessions: any[] } | undefined;
}

// 确保数据持久化在全局变量中
if (!global.__memoryDBData) {
  global.__memoryDBData = { conversations: [], learningSessions: [] };
  console.log('🌟 [MemoryDB] 初始化全局内存存储');
}

class MemoryDB {
  get conversations() {
    return global.__memoryDBData!.conversations;
  }
  set conversations(val: any[]) {
    global.__memoryDBData!.conversations = val;
  }

  get learningSessions() {
    return global.__memoryDBData!.learningSessions;
  }
  set learningSessions(val: any[]) {
    global.__memoryDBData!.learningSessions = val;
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
    })).sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime());
  }

  async getConversation(id: string, userId?: string) {
    const conv = this.conversations.find(c => c.id === id && (!userId || c.userId === userId));
    if (!conv) return null;
    return {
      ...conv,
      learningSession: this.learningSessions.find(ls => ls.conversationId === id)
    };
  }

  async updateConversation(id: string, data: any, userId?: string) {
    const index = this.conversations.findIndex(c => c.id === id && (!userId || c.userId === userId));
    if (index === -1) return null;

    const now = new Date();
    const existing = this.conversations[index];
    const updated = {
      ...existing,
      ...data,
      updatedAt: now,
      lastActivity: now,
      messageCount: data.messages ? data.messages.length : existing.messageCount
    };
    this.conversations[index] = updated;

    return {
      ...updated,
      learningSession: this.learningSessions.find(ls => ls.conversationId === id)
    };
  }

  async deleteConversation(id: string, userId?: string) {
    const index = this.conversations.findIndex(c => c.id === id && (!userId || c.userId === userId));
    if (index === -1) return false;
    this.conversations.splice(index, 1);
    // 也删除关联的learningSession
    const lsIndex = this.learningSessions.findIndex(ls => ls.conversationId === id);
    if (lsIndex !== -1) this.learningSessions.splice(lsIndex, 1);
    return true;
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

// 使用全局变量缓存 MemoryDB 实例
declare global {
  var __memoryDBInstance: MemoryDB | undefined;
}

if (!global.__memoryDBInstance) {
  global.__memoryDBInstance = new MemoryDB();
  console.log('🌟 [MemoryDB] 创建全局 MemoryDB 实例');
}

export const memoryDB = global.__memoryDBInstance;
