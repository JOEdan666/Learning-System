// 全国各地区最新教学大纲数据库
// 更新时间：2024年1月
// 集成全局考纲配置系统

import { CurriculumStandard } from '../types/curriculum';
import { 
  GLOBAL_CURRICULUM_CONFIG, 
  getRegionConfig, 
  getSubjectConfig, 
  checkCurriculumUpdateStatus,
  getExamInfo 
} from '../config/globalCurriculum';

export const CURRICULUM_DATABASE: CurriculumStandard[] = [
  // ==================== 广东省 ====================
  {
    id: 'guangdong-math-grade9-2024',
    region: '广东',
    grade: '九年级',
    subject: '数学',
    topics: [
      {
        id: 'quadratic-function',
        name: '二次函数',
        description: '二次函数的图像、性质及应用',
        difficulty: 'intermediate',
        keyPoints: [
          '二次函数的概念',
          '二次函数的图像和性质',
          '二次函数的解析式',
          '二次函数与一元二次方程的关系',
          '二次函数的实际应用'
        ],
        learningObjectives: [
          '理解二次函数的概念，掌握二次函数的图像和性质',
          '会求二次函数的解析式',
          '能运用二次函数解决实际问题',
          '理解二次函数与一元二次方程的关系'
        ],
        examWeight: 25,
        prerequisites: ['一次函数', '一元二次方程'],
        relatedTopics: ['抛物线', '最值问题']
      },
      {
        id: 'circle',
        name: '圆',
        description: '圆的基本性质、圆周角、切线等',
        difficulty: 'intermediate',
        keyPoints: [
          '圆的基本性质',
          '圆周角定理',
          '圆的切线性质',
          '圆内接四边形',
          '圆与直线的位置关系'
        ],
        learningObjectives: [
          '掌握圆的基本性质',
          '理解并应用圆周角定理',
          '掌握切线的性质和判定',
          '能解决与圆相关的计算和证明问题'
        ],
        examWeight: 20,
        prerequisites: ['角的概念', '三角形'],
        relatedTopics: ['相似三角形', '解直角三角形']
      }
    ],
    examRequirements: [
      {
        id: 'quadratic-req-1',
        topicId: 'quadratic-function',
        requirement: '能根据实际问题建立二次函数模型，求最值',
        level: 'apply',
        examples: [
          '利润最大化问题',
          '抛物线运动轨迹问题',
          '几何图形面积最值问题'
        ],
        commonMistakes: [
          '混淆开口方向与a的符号关系',
          '求最值时忘记考虑定义域',
          '配方法计算错误'
        ]
      },
      {
        id: 'circle-req-1',
        topicId: 'circle',
        requirement: '掌握圆周角定理及其推论，能进行相关计算和证明',
        level: 'apply',
        examples: [
          '利用圆周角定理求角度',
          '证明四点共圆',
          '切线长定理的应用'
        ],
        commonMistakes: [
          '混淆圆周角和圆心角',
          '切线性质应用错误',
          '辅助线添加不当'
        ]
      }
    ],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },

  // ==================== 北京市 ====================
  {
    id: 'beijing-math-grade9-2024',
    region: '北京',
    grade: '九年级',
    subject: '数学',
    topics: [
      {
        id: 'quadratic-function-beijing',
        name: '二次函数',
        description: '二次函数的图像、性质及应用（北京版）',
        difficulty: 'intermediate',
        keyPoints: [
          '二次函数的概念和图像',
          '二次函数的性质（单调性、最值）',
          '二次函数解析式的求法',
          '二次函数与方程、不等式的关系',
          '二次函数的实际应用（重点：优化问题）'
        ],
        learningObjectives: [
          '深入理解二次函数的概念和本质',
          '熟练掌握二次函数图像的画法和性质分析',
          '能够灵活运用二次函数解决综合性问题',
          '培养数形结合和函数思想'
        ],
        examWeight: 30,
        prerequisites: ['函数概念', '一元二次方程', '不等式'],
        relatedTopics: ['相似三角形', '解析几何初步']
      }
    ],
    examRequirements: [
      {
        id: 'beijing-quadratic-req-1',
        topicId: 'quadratic-function-beijing',
        requirement: '重点考查二次函数与几何图形的综合应用',
        level: 'analyze',
        examples: [
          '二次函数与三角形面积问题',
          '动点问题中的函数关系',
          '二次函数在坐标系中的应用'
        ],
        commonMistakes: [
          '几何条件转化为代数条件时出错',
          '动点问题中函数关系建立错误',
          '综合题中思路不清晰'
        ]
      }
    ],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },

  // ==================== 上海市 ====================
  {
    id: 'shanghai-math-grade9-2024',
    region: '上海',
    grade: '九年级',
    subject: '数学',
    topics: [
      {
        id: 'quadratic-function-shanghai',
        name: '二次函数',
        description: '二次函数及其应用（上海版）',
        difficulty: 'advanced',
        keyPoints: [
          '二次函数的标准形式和一般形式',
          '二次函数图像的平移变换',
          '二次函数的零点和判别式',
          '二次函数的最值问题',
          '二次函数与其他函数的复合'
        ],
        learningObjectives: [
          '掌握二次函数的多种表示方法',
          '理解函数变换的几何意义',
          '能够解决复杂的二次函数应用问题',
          '培养抽象思维和逻辑推理能力'
        ],
        examWeight: 28,
        prerequisites: ['函数的概念', '坐标系', '方程与不等式'],
        relatedTopics: ['解析几何', '数列', '概率统计']
      }
    ],
    examRequirements: [
      {
        id: 'shanghai-quadratic-req-1',
        topicId: 'quadratic-function-shanghai',
        requirement: '强调二次函数的数学思想方法和创新应用',
        level: 'evaluate',
        examples: [
          '二次函数模型的建立和优化',
          '函数性质的探究和证明',
          '跨学科的应用问题'
        ],
        commonMistakes: [
          '对函数性质理解不深入',
          '建模能力不足',
          '缺乏创新思维'
        ]
      }
    ],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },

  // ==================== 江苏省 ====================
  {
    id: 'jiangsu-math-grade9-2024',
    region: '江苏',
    grade: '九年级',
    subject: '数学',
    topics: [
      {
        id: 'quadratic-function-jiangsu',
        name: '二次函数',
        description: '二次函数的图像与性质（江苏版）',
        difficulty: 'intermediate',
        keyPoints: [
          '二次函数的定义和表达式',
          '抛物线的开口方向和对称轴',
          '二次函数的最值',
          '二次函数图像的平移',
          '二次函数与一元二次方程的关系',
          '实际问题中的二次函数模型'
        ],
        learningObjectives: [
          '理解二次函数的概念和基本性质',
          '会画二次函数的图像',
          '能用二次函数解决实际问题',
          '掌握数形结合的思想方法'
        ],
        examWeight: 22,
        prerequisites: ['一次函数', '一元二次方程'],
        relatedTopics: ['相似', '锐角三角函数']
      }
    ],
    examRequirements: [
      {
        id: 'jiangsu-quadratic-req-1',
        topicId: 'quadratic-function-jiangsu',
        requirement: '注重基础知识的扎实掌握和基本技能的熟练运用',
        level: 'apply',
        examples: [
          '根据条件求二次函数解析式',
          '利用二次函数求最值',
          '二次函数图像的识别和应用'
        ],
        commonMistakes: [
          '顶点坐标公式记忆错误',
          '图像平移方向判断错误',
          '实际问题中变量关系建立不准确'
        ]
      }
    ],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },

  // ==================== 浙江省 ====================
  {
    id: 'zhejiang-math-grade9-2024',
    region: '浙江',
    grade: '九年级',
    subject: '数学',
    topics: [
      {
        id: 'quadratic-function-zhejiang',
        name: '二次函数',
        description: '二次函数及其应用（浙江版）',
        difficulty: 'intermediate',
        keyPoints: [
          '二次函数的概念',
          '二次函数y=ax²的图像和性质',
          '二次函数y=a(x-h)²+k的图像和性质',
          '二次函数y=ax²+bx+c的图像和性质',
          '用二次函数解决实际问题'
        ],
        learningObjectives: [
          '理解二次函数的概念',
          '掌握二次函数的图像特征和性质',
          '会用待定系数法求二次函数解析式',
          '能建立二次函数模型解决实际问题'
        ],
        examWeight: 24,
        prerequisites: ['函数', '一元二次方程'],
        relatedTopics: ['反比例函数', '几何图形的性质']
      }
    ],
    examRequirements: [
      {
        id: 'zhejiang-quadratic-req-1',
        topicId: 'quadratic-function-zhejiang',
        requirement: '重视数学思维过程和解题方法的多样性',
        level: 'apply',
        examples: [
          '多种方法求二次函数解析式',
          '二次函数性质的多角度分析',
          '实际问题的多种建模方法'
        ],
        commonMistakes: [
          '解析式形式选择不当',
          '图像性质分析不全面',
          '实际问题理解偏差'
        ]
      }
    ],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  }
];

// 根据地区、年级、学科获取考纲数据
export function getCurriculumByRegion(region: string, grade: string, subject: string): CurriculumStandard | null {
  return CURRICULUM_DATABASE.find(
    curriculum => 
      curriculum.region === region && 
      curriculum.grade === grade && 
      curriculum.subject === subject
  ) || null;
}

// 获取特定主题的考纲要求
export function getTopicRequirements(region: string, grade: string, subject: string, topicName: string) {
  const curriculum = getCurriculumByRegion(region, grade, subject);
  if (!curriculum) return null;

  const topic = curriculum.topics.find(t => 
    t.name.includes(topicName) || topicName.includes(t.name)
  );
  
  const requirements = curriculum.examRequirements.filter(req => 
    req.topicId === topic?.id
  );

  return { topic, requirements };
}

// 获取所有支持的地区
export function getSupportedRegions(): string[] {
  return Array.from(new Set(CURRICULUM_DATABASE.map(c => c.region)));
}

// 获取特定地区支持的年级
export function getSupportedGrades(region: string): string[] {
  return Array.from(new Set(
    CURRICULUM_DATABASE
      .filter(c => c.region === region)
      .map(c => c.grade)
  ));
}

// 获取特定地区和年级支持的科目
export function getSupportedSubjects(region: string, grade: string): string[] {
  return Array.from(new Set(
    CURRICULUM_DATABASE
      .filter(c => c.region === region && c.grade === grade)
      .map(c => c.subject)
  ));
}

// ==================== 增强功能函数 ====================

// 获取考纲更新状态
export function getCurriculumUpdateStatus() {
  return checkCurriculumUpdateStatus();
}

// 获取地区详细信息
export function getRegionDetails(regionId: string) {
  const config = getRegionConfig(regionId);
  const supportedGrades = getSupportedGrades(regionId);
  
  return {
    ...config,
    supportedGrades,
    totalCurriculum: CURRICULUM_DATABASE.filter(c => c.region === regionId).length
  };
}

// 获取科目详细信息
export function getSubjectDetails(subjectId: string) {
  const config = getSubjectConfig(subjectId);
  const regions = getSupportedRegions();
  
  return {
    ...config,
    availableRegions: regions.filter(region => 
      CURRICULUM_DATABASE.some(c => c.subject === config?.name && c.region === region)
    )
  };
}

// 获取完整的考纲信息（包含地区和科目配置）
export function getEnhancedCurriculumInfo(region: string, grade: string, subject: string, topicName: string) {
  const curriculum = getCurriculumByRegion(region, grade, subject);
  const topicRequirements = getTopicRequirements(region, grade, subject, topicName);
  const regionConfig = getRegionConfig(region);
  const subjectConfig = getSubjectConfig(subject.toLowerCase());
  const examInfo = getExamInfo(region, grade);
  
  if (!curriculum) return null;
  
  return {
    curriculum,
    topicRequirements,
    regionConfig,
    subjectConfig,
    examInfo,
    metadata: {
      lastUpdated: curriculum.updatedAt,
      curriculumId: curriculum.id,
      dataVersion: GLOBAL_CURRICULUM_CONFIG.version
    }
  };
}

// 获取地区特色和考试特点
export function getRegionExamFeatures(regionId: string) {
  const config = getRegionConfig(regionId);
  if (!config) return null;
  
  return {
    region: config.name,
    examSystem: config.examSystem,
    specialFeatures: config.specialFeatures,
    curriculumStandard: config.curriculumStandard,
    lastReform: config.lastReformYear,
    officialWebsite: config.officialWebsite
  };
}

// 比较不同地区的考纲差异
export function compareCurriculumByRegions(regions: string[], grade: string, subject: string, topicName: string) {
  const comparisons = regions.map(region => {
    const info = getEnhancedCurriculumInfo(region, grade, subject, topicName);
    return {
      region,
      info,
      available: !!info
    };
  });
  
  return {
    comparisons,
    summary: {
      totalRegions: regions.length,
      availableRegions: comparisons.filter(c => c.available).length,
      missingRegions: comparisons.filter(c => !c.available).map(c => c.region)
    }
  };
}

// 获取推荐学习路径
export function getRecommendedLearningPath(region: string, grade: string, subject: string, currentTopic: string) {
  const curriculum = getCurriculumByRegion(region, grade, subject);
  if (!curriculum) return null;
  
  const currentTopicData = curriculum.topics.find(t => 
    t.name.includes(currentTopic) || currentTopic.includes(t.name)
  );
  
  if (!currentTopicData) return null;
  
  // 找到前置知识点
  const prerequisites = currentTopicData.prerequisites || [];
  
  // 找到相关知识点
  const relatedTopics = currentTopicData.relatedTopics || [];
  
  // 找到后续可能的知识点
  const nextTopics = curriculum.topics.filter(t => 
    t.prerequisites?.some(prereq => 
      prereq.includes(currentTopic) || currentTopic.includes(prereq)
    )
  );
  
  return {
    currentTopic: currentTopicData,
    prerequisites,
    relatedTopics,
    nextTopics: nextTopics.map(t => t.name),
    learningPath: {
      previous: prerequisites,
      current: currentTopic,
      next: nextTopics.map(t => t.name),
      related: relatedTopics
    }
  };
}

// 获取考试重点分析
export function getExamFocusAnalysis(region: string, grade: string, subject: string) {
  const curriculum = getCurriculumByRegion(region, grade, subject);
  if (!curriculum) return null;
  
  const topicsByWeight = curriculum.topics
    .sort((a, b) => (b.examWeight || 0) - (a.examWeight || 0))
    .map(topic => ({
      name: topic.name,
      weight: topic.examWeight || 0,
      difficulty: topic.difficulty,
      keyPoints: topic.keyPoints?.length || 0
    }));
  
  const totalWeight = curriculum.topics.reduce((sum, topic) => sum + (topic.examWeight || 0), 0);
  
  const highPriorityTopics = topicsByWeight.filter(t => t.weight >= totalWeight * 0.2);
  const mediumPriorityTopics = topicsByWeight.filter(t => t.weight >= totalWeight * 0.1 && t.weight < totalWeight * 0.2);
  const lowPriorityTopics = topicsByWeight.filter(t => t.weight < totalWeight * 0.1);
  
  return {
    totalWeight,
    topicsByWeight,
    priorityAnalysis: {
      high: highPriorityTopics,
      medium: mediumPriorityTopics,
      low: lowPriorityTopics
    },
    recommendations: {
      focusTopics: highPriorityTopics.map(t => t.name),
      reviewTopics: mediumPriorityTopics.map(t => t.name),
      supplementaryTopics: lowPriorityTopics.map(t => t.name)
    }
  };
}