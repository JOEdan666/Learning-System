// 客户端学习进度服务 - 通过API路由与服务器通信
export interface LearningProgressData {
  conversationId: string;
  subject?: string;
  topic?: string;
  aiExplanation?: string;
  socraticDialogue?: any[];
  currentStep?: string;
  isCompleted?: boolean;
  region?: string;
  grade?: string;
  coachingHistory?: any[];
  finalScore?: number;
  feedback?: string;
  reviewNotes?: string;
  aiSummary?: string; // AI生成的学习总结
  quizQuestions?: QuizQuestionData[];
  userAnswers?: UserAnswerData[];
  stats?: LearningStatsData;
}

export interface QuizQuestionData {
  id?: string;
  question: string;
  type: string;
  options?: string[];
  correctAnswer: string;
  explanation?: string;
  difficulty?: string;
  points?: number;
  order: number;
}

export interface UserAnswerData {
  id?: string;
  questionId: string;
  userAnswer: string;
  isCorrect: boolean;
  score?: number;
  timeSpent?: number;
}

export interface LearningStatsData {
  conversationId: string;
  totalQuestions?: number;
  correctAnswers?: number;
  totalScore?: number;
  maxScore?: number;
  accuracy?: number;
  totalTimeSpent?: number;
  explanationTime?: number;
  coachingTime?: number;
  quizTime?: number;
  weaknesses?: string[];
  suggestions?: string[];
}

export class LearningProgressClient {
  // 保存学习进度
  static async saveLearningProgress(data: LearningProgressData) {
    try {
      const response = await fetch('/api/learning-progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('客户端保存学习进度失败:', error);
      throw error;
    }
  }

  // 获取学习进度
  static async get(conversationId: string, includeStats: boolean = false): Promise<LearningProgressData | null> {
    try {
      const url = `/api/learning-progress?conversationId=${conversationId}${includeStats ? '&includeStats=true' : ''}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('获取学习进度失败:', error);
      return null;
    }
  }

  // 获取完整学习数据（包含统计信息）
  static async getComplete(conversationId: string): Promise<{
    session: LearningProgressData | null;
    stats: LearningStatsData | null;
  } | null> {
    try {
      const response = await fetch(`/api/learning-progress?conversationId=${conversationId}&includeStats=true`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('获取完整学习数据失败:', error);
      return null;
    }
  }

  // 获取学习进度（保持向后兼容）
  static async getLearningProgress(conversationId: string) {
    try {
      const response = await fetch(`/api/learning-progress?conversationId=${encodeURIComponent(conversationId)}`);

      if (!response.ok) {
        if (response.status === 404) {
          return null; // 未找到学习进度
        }
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('客户端获取学习进度失败:', error);
      throw error;
    }
  }

  // 更新AI讲解内容
  static async updateAIExplanation(conversationId: string, aiExplanation: string) {
    try {
      const response = await fetch('/api/learning-progress', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId,
          aiExplanation,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('客户端更新AI讲解失败:', error);
      throw error;
    }
  }

  // 更新苏格拉底对话
  static async updateSocraticDialogue(conversationId: string, socraticDialogue: any) {
    try {
      const response = await fetch('/api/learning-progress', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId,
          socraticDialogue,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('客户端更新苏格拉底对话失败:', error);
      throw error;
    }
  }

  // 删除学习进度
  static async deleteLearningProgress(conversationId: string) {
    try {
      const response = await fetch(`/api/learning-progress?conversationId=${encodeURIComponent(conversationId)}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('客户端删除学习进度失败:', error);
      throw error;
    }
  }
}

export default LearningProgressClient;