import { CurriculumStandard, CurriculumTopic, ExamRequirement, REGION_CONFIGS, GRADE_CONFIGS } from '../types/curriculum';

// 教学大纲数据服务
export class CurriculumService {
  private static instance: CurriculumService;
  private curriculumData: Map<string, CurriculumStandard> = new Map();

  private constructor() {
    this.initializeCurriculumData();
  }

  public static getInstance(): CurriculumService {
    if (!CurriculumService.instance) {
      CurriculumService.instance = new CurriculumService();
    }
    return CurriculumService.instance;
  }

  // 初始化教学大纲数据
  private initializeCurriculumData() {
    // 东莞初二物理教学大纲
    const dongguanPhysicsGrade8: CurriculumStandard = {
      id: 'dongguan-physics-grade8',
      region: '东莞',
      grade: '初中二年级',
      subject: '物理',
      topics: [
        {
          id: 'mechanics-basic',
          name: '机械运动',
          description: '物体位置变化的描述',
          difficulty: 'basic',
          keyPoints: ['参照物', '运动和静止的相对性', '速度概念', '匀速直线运动'],
          learningObjectives: ['理解运动的相对性', '掌握速度的概念和计算', '能描述简单的机械运动'],
          examWeight: 15,
          prerequisites: ['长度和时间的测量'],
          relatedTopics: ['力和运动']
        },
        {
          id: 'sound-phenomena',
          name: '声现象',
          description: '声音的产生、传播和特性',
          difficulty: 'basic',
          keyPoints: ['声音的产生', '声音的传播', '声音的特性', '噪声的危害和控制'],
          learningObjectives: ['了解声音的产生和传播条件', '理解声音的三个特性', '认识噪声的危害'],
          examWeight: 10,
          prerequisites: ['物质的基本性质'],
          relatedTopics: ['波动现象']
        },
        {
          id: 'thermal-phenomena',
          name: '物态变化',
          description: '物质在固、液、气三态之间的变化',
          difficulty: 'intermediate',
          keyPoints: ['熔化和凝固', '汽化和液化', '升华和凝华', '温度计的使用'],
          learningObjectives: ['掌握物态变化的条件和特点', '理解温度和热量的区别', '能解释生活中的物态变化现象'],
          examWeight: 20,
          prerequisites: ['温度的概念'],
          relatedTopics: ['分子动理论']
        },
        {
          id: 'light-phenomena',
          name: '光现象',
          description: '光的传播、反射和折射',
          difficulty: 'intermediate',
          keyPoints: ['光的直线传播', '光的反射', '平面镜成像', '光的折射'],
          learningObjectives: ['理解光的传播规律', '掌握反射定律', '了解平面镜成像特点', '初步了解折射现象'],
          examWeight: 25,
          prerequisites: ['几何光学基础'],
          relatedTopics: ['透镜成像']
        }
      ],
      examRequirements: [
        {
          id: 'mechanics-req-1',
          topicId: 'mechanics-basic',
          requirement: '能用速度公式进行简单计算',
          level: 'apply',
          examples: ['计算匀速直线运动的速度', '根据速度和时间求路程'],
          commonMistakes: ['混淆速度和速率', '单位换算错误']
        },
        {
          id: 'light-req-1',
          topicId: 'light-phenomena',
          requirement: '了解光的反射现象，不要求掌握斯涅尔定律',
          level: 'understand',
          examples: ['解释镜面反射和漫反射', '画出光的反射光路图'],
          commonMistakes: ['混淆入射角和反射角的定义']
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // 广州初二物理教学大纲（稍有不同）
    const guangzhouPhysicsGrade8: CurriculumStandard = {
      id: 'guangzhou-physics-grade8',
      region: '广州',
      grade: '初中二年级',
      subject: '物理',
      topics: [
        {
          id: 'mechanics-basic',
          name: '机械运动',
          description: '物体位置变化的描述',
          difficulty: 'basic',
          keyPoints: ['参照物', '运动和静止的相对性', '速度概念', '匀速直线运动', '变速运动'],
          learningObjectives: ['理解运动的相对性', '掌握速度的概念和计算', '能描述简单的机械运动', '初步了解变速运动'],
          examWeight: 18,
          prerequisites: ['长度和时间的测量'],
          relatedTopics: ['力和运动']
        },
        {
          id: 'light-phenomena-advanced',
          name: '光现象',
          description: '光的传播、反射和折射（含简单折射定律）',
          difficulty: 'intermediate',
          keyPoints: ['光的直线传播', '光的反射', '平面镜成像', '光的折射', '折射定律的定性理解'],
          learningObjectives: ['理解光的传播规律', '掌握反射定律', '了解平面镜成像特点', '定性理解折射定律'],
          examWeight: 28,
          prerequisites: ['几何光学基础'],
          relatedTopics: ['透镜成像', '光学仪器']
        }
      ],
      examRequirements: [
        {
          id: 'light-req-guangzhou-1',
          topicId: 'light-phenomena-advanced',
          requirement: '定性理解光的折射定律，不要求定量计算',
          level: 'understand',
          examples: ['解释光从空气进入水中的偏折现象', '说明折射角与入射角的关系'],
          commonMistakes: ['过度深入折射定律的数学表达']
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // 存储教学大纲数据
    this.curriculumData.set('东莞-初中二年级-物理', dongguanPhysicsGrade8);
    this.curriculumData.set('广州-初中二年级-物理', guangzhouPhysicsGrade8);
  }

  // 获取特定地区、年级、学科的教学大纲
  public getCurriculumStandard(region: string, grade: string, subject: string): CurriculumStandard | null {
    const key = `${region}-${grade}-${subject}`;
    return this.curriculumData.get(key) || null;
  }

  // 获取特定主题的教学要求
  public getTopicRequirements(region: string, grade: string, subject: string, topicName: string): {
    topic: CurriculumTopic | null;
    requirements: ExamRequirement[];
  } {
    const curriculum = this.getCurriculumStandard(region, grade, subject);
    if (!curriculum) {
      return { topic: null, requirements: [] };
    }

    const topic = curriculum.topics.find(t => 
      t.name.includes(topicName) || topicName.includes(t.name)
    ) || null;

    const requirements = topic 
      ? curriculum.examRequirements.filter(req => req.topicId === topic.id)
      : [];

    return { topic, requirements };
  }

  // 检查主题是否在教学大纲中
  public isTopicInCurriculum(region: string, grade: string, subject: string, topicName: string): boolean {
    const { topic } = this.getTopicRequirements(region, grade, subject, topicName);
    return topic !== null;
  }

  // 获取主题的难度级别
  public getTopicDifficulty(region: string, grade: string, subject: string, topicName: string): string | null {
    const { topic } = this.getTopicRequirements(region, grade, subject, topicName);
    return topic ? topic.difficulty : null;
  }

  // 获取主题的考试权重
  public getTopicExamWeight(region: string, grade: string, subject: string, topicName: string): number {
    const { topic } = this.getTopicRequirements(region, grade, subject, topicName);
    return topic ? topic.examWeight : 0;
  }

  // 获取地区配置
  public getRegionConfig(region: string) {
    return REGION_CONFIGS.find(config => config.region === region);
  }

  // 获取年级配置
  public getGradeConfig(grade: string) {
    return GRADE_CONFIGS.find(config => config.grade === grade);
  }

  // 生成适合特定地区和年级的学习提示
  public generateLearningGuidance(region: string, grade: string, subject: string, topicName: string): string {
    const { topic, requirements } = this.getTopicRequirements(region, grade, subject, topicName);
    const regionConfig = this.getRegionConfig(region);
    const gradeConfig = this.getGradeConfig(grade);

    if (!topic) {
      return `注意：${topicName}可能不在${region}地区${grade}的${subject}教学大纲中，建议重新选择学习内容。`;
    }

    let guidance = `## ${region}地区${grade}${subject}学习指导\n\n`;
    guidance += `### 📚 ${topic.name}\n`;
    guidance += `**难度级别**: ${topic.difficulty === 'basic' ? '基础' : topic.difficulty === 'intermediate' ? '中等' : '高级'}\n`;
    guidance += `**考试权重**: ${topic.examWeight}%\n\n`;

    if (gradeConfig) {
      guidance += `### 🎯 ${gradeConfig.displayName}学习特点\n`;
      guidance += `- 年龄阶段: ${gradeConfig.ageRange}\n`;
      guidance += `- 认知水平: ${gradeConfig.cognitiveLevel}\n`;
      guidance += `- 学习特征: ${gradeConfig.learningCharacteristics.join('、')}\n\n`;
    }

    if (regionConfig) {
      guidance += `### 🏫 ${regionConfig.displayName}教育特色\n`;
      guidance += `- 教育体系: ${regionConfig.educationSystem}\n`;
      guidance += `- 考试类型: ${regionConfig.examTypes.join('、')}\n`;
      guidance += `- 特色要求: ${regionConfig.specialFeatures.join('、')}\n\n`;
    }

    guidance += `### 📋 学习要求\n`;
    guidance += `**核心知识点**: ${topic.keyPoints.join('、')}\n`;
    guidance += `**学习目标**: \n${topic.learningObjectives.map(obj => `- ${obj}`).join('\n')}\n\n`;

    if (requirements.length > 0) {
      guidance += `### ⚠️ 考试要求\n`;
      requirements.forEach(req => {
        guidance += `- ${req.requirement}\n`;
        if (req.commonMistakes.length > 0) {
          guidance += `  常见错误: ${req.commonMistakes.join('、')}\n`;
        }
      });
    }

    return guidance;
  }
}