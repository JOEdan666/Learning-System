import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

/**
 * 学习步骤类型
 */
export type LearningStep = 'EXPLAIN' | 'CONFIRM' | 'QUIZ' | 'REVIEW' | 'RESULT';

/**
 * 题目类型
 */
export interface Question {
  id: string;
  question: string;
  type: 'multiple_choice' | 'short_answer' | 'essay';
  options?: string[];
  correctAnswer: string;
  explanation?: string;
  points: number;
  difficulty: 'easy' | 'medium' | 'hard';
  order: number;
}

/**
 * 苏格拉底对话记录
 */
export interface SocraticDialogue {
  question: string;
  answer: string;
  feedback?: string;
  timestamp: Date;
}

/**
 * 学习状态接口
 */
export interface LearningState {
  // ========== 会话基础信息 ==========
  conversationId: string | null;
  subject: string;
  topic: string;
  region: string;
  grade: string;
  semester: string;
  topicId: string | null;

  // ========== 学习流程状态 ==========
  currentStep: LearningStep;
  aiExplanation: string;
  socraticDialogue: SocraticDialogue[];
  understandingLevel: number; // 1-5

  // ========== 测验状态 ==========
  questions: Question[];
  currentQuestionIndex: number;
  userAnswers: Record<string, string>; // questionId -> userAnswer
  quizResults: {
    score: number;
    totalScore: number;
    correctCount: number;
    totalCount: number;
  } | null;

  // ========== UI 状态 ==========
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;

  // ========== Actions：会话管理 ==========
  /**
   * 初始化学习会话
   */
  initializeSession: (params: {
    conversationId: string;
    subject: string;
    topic: string;
    region?: string;
    grade?: string;
    semester?: string;
    topicId?: string;
  }) => void;

  /**
   * 重置会话
   */
  resetSession: () => void;

  // ========== Actions：步骤管理 ==========
  /**
   * 设置当前步骤
   */
  setCurrentStep: (step: LearningStep) => void;

  /**
   * 进入下一步
   */
  nextStep: () => void;

  // ========== Actions：讲解阶段 ==========
  /**
   * 设置 AI 讲解内容
   */
  setAiExplanation: (content: string) => void;

  /**
   * 添加苏格拉底对话
   */
  addSocraticDialogue: (dialogue: Omit<SocraticDialogue, 'timestamp'>) => void;

  /**
   * 设置理解程度
   */
  setUnderstandingLevel: (level: number) => void;

  // ========== Actions：测验阶段 ==========
  /**
   * 设置题目列表
   */
  setQuestions: (questions: Question[]) => void;

  /**
   * 设置当前题目索引
   */
  setCurrentQuestionIndex: (index: number) => void;

  /**
   * 设置用户答案
   */
  setUserAnswer: (questionId: string, answer: string) => void;

  /**
   * 计算分数
   */
  calculateScore: () => void;

  /**
   * 设置测验结果
   */
  setQuizResults: (results: LearningState['quizResults']) => void;

  // ========== Actions：数据持久化 ==========
  /**
   * 保存到数据库
   */
  saveToDatabase: () => Promise<void>;

  /**
   * 从数据库加载
   */
  loadFromDatabase: (conversationId: string) => Promise<void>;

  // ========== Actions：UI 状态 ==========
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

/**
 * 学习状态 Store
 *
 * 使用 Zustand 管理学习流程的所有状态
 *
 * @example
 * ```tsx
 * import { useLearningStore } from '@/app/stores/learningStore';
 *
 * function MyComponent() {
 *   const { currentStep, setCurrentStep } = useLearningStore();
 *   return <div>Current Step: {currentStep}</div>;
 * }
 * ```
 */
export const useLearningStore = create<LearningState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // ========== 初始状态 ==========
        conversationId: null,
        subject: '',
        topic: '',
        region: '',
        grade: '',
        semester: '',
        topicId: null,
        currentStep: 'EXPLAIN',
        aiExplanation: '',
        socraticDialogue: [],
        understandingLevel: 3,
        questions: [],
        currentQuestionIndex: 0,
        userAnswers: {},
        quizResults: null,
        isLoading: false,
        isSaving: false,
        error: null,

        // ========== Actions 实现 ==========

        initializeSession: (params) =>
          set({
            conversationId: params.conversationId,
            subject: params.subject,
            topic: params.topic,
            region: params.region || '',
            grade: params.grade || '',
            semester: params.semester || '',
            topicId: params.topicId || null,
            currentStep: 'EXPLAIN',
            aiExplanation: '',
            socraticDialogue: [],
            understandingLevel: 3,
            questions: [],
            userAnswers: {},
            quizResults: null,
            error: null,
          }),

        resetSession: () =>
          set({
            conversationId: null,
            subject: '',
            topic: '',
            region: '',
            grade: '',
            semester: '',
            topicId: null,
            currentStep: 'EXPLAIN',
            aiExplanation: '',
            socraticDialogue: [],
            understandingLevel: 3,
            questions: [],
            currentQuestionIndex: 0,
            userAnswers: {},
            quizResults: null,
            isLoading: false,
            isSaving: false,
            error: null,
          }),

        setCurrentStep: (step) => set({ currentStep: step }),

        nextStep: () => {
          const state = get();
          const stepFlow: LearningStep[] = ['EXPLAIN', 'CONFIRM', 'QUIZ', 'REVIEW', 'RESULT'];
          const currentIndex = stepFlow.indexOf(state.currentStep);
          const nextIndex = currentIndex + 1;

          if (nextIndex < stepFlow.length) {
            set({ currentStep: stepFlow[nextIndex] });
          }
        },

        setAiExplanation: (content) => set({ aiExplanation: content }),

        addSocraticDialogue: (dialogue) =>
          set((state) => {
            state.socraticDialogue.push({
              ...dialogue,
              timestamp: new Date(),
            });
          }),

        setUnderstandingLevel: (level) => set({ understandingLevel: level }),

        setQuestions: (questions) => set({ questions }),

        setCurrentQuestionIndex: (index) => set({ currentQuestionIndex: index }),

        setUserAnswer: (questionId, answer) =>
          set((state) => {
            state.userAnswers[questionId] = answer;
          }),

        calculateScore: () => {
          const state = get();
          const { questions, userAnswers } = state;

          let correctCount = 0;
          let totalScore = 0;
          let maxScore = 0;

          questions.forEach((question) => {
            maxScore += question.points;
            const userAnswer = userAnswers[question.id];

            if (userAnswer === question.correctAnswer) {
              correctCount++;
              totalScore += question.points;
            }
          });

          set({
            quizResults: {
              score: totalScore,
              totalScore: maxScore,
              correctCount,
              totalCount: questions.length,
            },
          });
        },

        setQuizResults: (results) => set({ quizResults: results }),

        saveToDatabase: async () => {
          const state = get();
          set({ isSaving: true, error: null });

          try {
            const response = await fetch('/api/learning-progress', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                conversationId: state.conversationId,
                subject: state.subject,
                topic: state.topic,
                region: state.region,
                grade: state.grade,
                currentStep: state.currentStep,
                aiExplanation: state.aiExplanation,
                socraticDialogue: state.socraticDialogue,
                finalScore: state.quizResults?.score,
                isCompleted: state.currentStep === 'RESULT',
              }),
            });

            if (!response.ok) {
              throw new Error('保存失败');
            }

            set({ isSaving: false });
          } catch (error) {
            console.error('Failed to save to database:', error);
            set({
              error: error instanceof Error ? error.message : '保存失败',
              isSaving: false,
            });
          }
        },

        loadFromDatabase: async (conversationId) => {
          set({ isLoading: true, error: null });

          try {
            const response = await fetch(
              `/api/learning-progress?conversationId=${conversationId}`
            );

            if (!response.ok) {
              throw new Error('加载失败');
            }

            const data = await response.json();

            set({
              conversationId: data.conversationId,
              subject: data.subject,
              topic: data.topic,
              region: data.region || '',
              grade: data.grade || '',
              currentStep: data.currentStep || 'EXPLAIN',
              aiExplanation: data.aiExplanation || '',
              socraticDialogue: data.socraticDialogue || [],
              isLoading: false,
            });
          } catch (error) {
            console.error('Failed to load from database:', error);
            set({
              error: error instanceof Error ? error.message : '加载失败',
              isLoading: false,
            });
          }
        },

        setLoading: (loading) => set({ isLoading: loading }),
        setError: (error) => set({ error }),
      })),
      {
        name: 'learning-storage',
        // 只持久化关键数据，不持久化 UI 状态
        partialize: (state) => ({
          conversationId: state.conversationId,
          subject: state.subject,
          topic: state.topic,
          region: state.region,
          grade: state.grade,
          currentStep: state.currentStep,
        }),
      }
    ),
    {
      name: 'LearningStore',
    }
  )
);
