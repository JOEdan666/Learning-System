// 全国各地区最新教学大纲数据库
// 更新时间：2024年1月
// 集成全局考纲配置系统
// 数据来源：人教版（PEP）2024年最新教材目录

import { CurriculumStandard } from '../types/curriculum';
import { 
  GLOBAL_CURRICULUM_CONFIG, 
  getRegionConfig, 
  getSubjectConfig, 
  checkCurriculumUpdateStatus,
  getExamInfo 
} from '../config/globalCurriculum';

export const CURRICULUM_DATABASE: CurriculumStandard[] = [
  // ==================== 八年级上册 数学 (人教版) ====================
  {
    id: 'guangdong-math-grade8-up-2024',
    region: '广东',
    grade: '八年级',
    semester: '上册',
    subject: '数学',
    topics: [
      {
        id: 'triangle-basic',
        name: '三角形',
        description: '三角形的边、角关系，多边形及其内角和',
        difficulty: 'basic',
        keyPoints: ['三角形的边角关系', '三角形的高、中线与角平分线', '多边形的内角和与外角和'],
        learningObjectives: ['理解三角形性质', '掌握多边形角度计算'],
        examWeight: 15,
        prerequisites: ['几何图形初步'],
        relatedTopics: ['全等三角形']
      },
      {
        id: 'congruent-triangles',
        name: '全等三角形',
        description: '全等三角形的性质与判定',
        difficulty: 'intermediate',
        keyPoints: ['SSS', 'SAS', 'ASA', 'AAS', 'HL', '角平分线的性质'],
        learningObjectives: ['掌握全等三角形判定', '能利用全等证明线段或角相等'],
        examWeight: 25,
        prerequisites: ['三角形'],
        relatedTopics: ['轴对称']
      },
      {
        id: 'axis-symmetry',
        name: '轴对称',
        description: '轴对称图形性质与最短路径问题',
        difficulty: 'intermediate',
        keyPoints: ['轴对称性质', '垂直平分线', '等腰三角形', '等边三角形', '最短路径问题(将军饮马)'],
        learningObjectives: ['理解轴对称变换', '解决几何最值问题'],
        examWeight: 20,
        prerequisites: ['全等三角形'],
        relatedTopics: ['全等三角形']
      },
      {
        id: 'polynomial-multiplication',
        name: '整式的乘法与因式分解',
        description: '幂的运算、整式乘法、因式分解',
        difficulty: 'intermediate',
        keyPoints: ['同底数幂乘除', '幂的乘方', '积的乘方', '整式乘法', '平方差公式', '完全平方公式', '提公因式法', '公式法'],
        learningObjectives: ['熟练进行整式运算', '掌握因式分解方法'],
        examWeight: 20,
        prerequisites: ['整式的加减'],
        relatedTopics: ['分式']
      },
      {
        id: 'fractions',
        name: '分式',
        description: '分式的概念、运算与分式方程',
        difficulty: 'intermediate',
        keyPoints: ['分式基本性质', '分式乘除加减', '整数指数幂', '分式方程及其应用'],
        learningObjectives: ['掌握分式运算', '能解分式方程', '解决工程/行程问题'],
        examWeight: 20,
        prerequisites: ['整式的乘法与因式分解', '一元一次方程'],
        relatedTopics: ['反比例函数']
      }
    ],
    examRequirements: [],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  // ==================== 八年级下册 数学 (人教版) ====================
  {
    id: 'guangdong-math-grade8-down-2024',
    region: '广东',
    grade: '八年级',
    semester: '下册',
    subject: '数学',
    topics: [
      {
        id: 'secondary-radicals',
        name: '二次根式',
        description: '二次根式的概念、性质与运算',
        difficulty: 'intermediate',
        keyPoints: ['二次根式概念', '最简二次根式', '二次根式的加减乘除'],
        learningObjectives: ['掌握二次根式化简', '熟练进行二次根式运算'],
        examWeight: 15,
        prerequisites: ['实数', '整式乘法'],
        relatedTopics: ['勾股定理']
      },
      {
        id: 'gougu',
        name: '勾股定理',
        description: '勾股定理及其逆定理',
        difficulty: 'intermediate',
        keyPoints: ['勾股定理', '勾股定理逆定理', '勾股数', '立体图形展开求最短路径'],
        learningObjectives: ['利用勾股定理计算', '判断直角三角形'],
        examWeight: 15,
        prerequisites: ['二次根式'],
        relatedTopics: ['四边形']
      },
      {
        id: 'parallelogram',
        name: '平行四边形',
        description: '平行四边形及特殊平行四边形的判定与性质',
        difficulty: 'intermediate',
        keyPoints: ['平行四边形性质与判定', '矩形', '菱形', '正方形', '三角形中位线'],
        learningObjectives: ['掌握判定定理', '几何证明', '综合几何计算'],
        examWeight: 25,
        prerequisites: ['全等三角形', '勾股定理'],
        relatedTopics: ['一次函数']
      },
      {
        id: 'linear-function',
        name: '一次函数',
        description: '一次函数的图像与性质',
        difficulty: 'intermediate',
        keyPoints: ['函数概念', '正比例函数', '一次函数图像与性质', '待定系数法', '一次函数与方程/不等式'],
        learningObjectives: ['能画一次函数图像', '解决实际应用问题(方案选择)'],
        examWeight: 25,
        prerequisites: ['平面直角坐标系', '二元一次方程组'],
        relatedTopics: ['二次函数']
      },
      {
        id: 'data-analysis',
        name: '数据的分析',
        description: '数据的集中趋势与波动程度',
        difficulty: 'basic',
        keyPoints: ['平均数(加权)', '中位数', '众数', '方差'],
        learningObjectives: ['会计算统计量', '能根据数据分析做出决策'],
        examWeight: 10,
        prerequisites: ['数据的收集与整理'],
        relatedTopics: ['概率']
      }
    ],
    examRequirements: [],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  // ==================== 九年级 数学 (人教版 - 补充) ====================
  {
    id: 'guangdong-math-grade9-2024',
    region: '广东',
    grade: '九年级',
    semester: '上册',
    subject: '数学',
    topics: [
      {
        id: 'quadratic-equation',
        name: '一元二次方程',
        description: '一元二次方程的解法与应用',
        difficulty: 'intermediate',
        keyPoints: ['直接开平方法', '配方法', '公式法', '因式分解法', '根与系数关系(韦达定理)'],
        learningObjectives: ['熟练解方程', '解决增长率/面积等实际问题'],
        examWeight: 20,
        prerequisites: ['一元一次方程', '因式分解'],
        relatedTopics: ['二次函数']
      },
      {
        id: 'quadratic-function',
        name: '二次函数',
        description: '二次函数的图像、性质及应用',
        difficulty: 'advanced',
        keyPoints: ['二次函数概念', '图像与性质', '解析式求法', '二次函数与一元二次方程', '最值问题与实际应用'],
        learningObjectives: ['掌握数形结合', '解决抛物线综合题'],
        examWeight: 30,
        prerequisites: ['一次函数', '一元二次方程'],
        relatedTopics: ['圆']
      },
      {
        id: 'rotation',
        name: '旋转',
        description: '图形的旋转与中心对称',
        difficulty: 'intermediate',
        keyPoints: ['旋转性质', '中心对称', '中心对称图形', '关于原点对称的点的坐标'],
        learningObjectives: ['理解旋转变换', '解决几何变换问题'],
        examWeight: 10,
        prerequisites: ['全等三角形', '轴对称'],
        relatedTopics: ['圆']
      },
      {
        id: 'circle',
        name: '圆',
        description: '圆的基本性质与位置关系',
        difficulty: 'advanced',
        keyPoints: ['垂径定理', '圆周角定理', '点/直线/圆与圆的位置关系', '切线性质与判定', '弧长与扇形面积', '正多边形与圆'],
        learningObjectives: ['掌握圆的几何证明', '计算阴影面积', '解决切线综合题'],
        examWeight: 25,
        prerequisites: ['旋转', '相似三角形(下册前置)'],
        relatedTopics: ['相似三角形']
      },
      {
        id: 'probability',
        name: '概率初步',
        description: '随机事件与概率计算',
        difficulty: 'basic',
        keyPoints: ['随机事件', '概率意义', '列举法/树状图/列表法求概率', '频率估计概率'],
        learningObjectives: ['能计算简单事件概率', '理解概率模型'],
        examWeight: 15,
        prerequisites: ['数据的分析'],
        relatedTopics: ['统计']
      }
    ],
    examRequirements: [],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  // ==================== 八年级上册 物理 (人教版) ====================
  {
    id: 'guangdong-physics-grade8-up-2024',
    region: '广东',
    grade: '八年级',
    semester: '上册',
    subject: '物理',
    topics: [
      {
        id: 'mechanical-motion',
        name: '机械运动',
        description: '长度时间测量、运动描述、速度',
        difficulty: 'basic',
        keyPoints: ['刻度尺使用', '参照物', '速度公式v=s/t', '匀速直线运动', '平均速度'],
        learningObjectives: ['掌握基本测量', '理解运动相对性', '会计算速度'],
        examWeight: 15,
        prerequisites: [],
        relatedTopics: ['力']
      },
      {
        id: 'acoustics',
        name: '声现象',
        description: '声音的产生、传播、特性与利用',
        difficulty: 'basic',
        keyPoints: ['声音产生与传播', '音调/响度/音色', '超声波与次声波', '噪声控制'],
        learningObjectives: ['区分声音三要素', '了解噪声防治'],
        examWeight: 10,
        prerequisites: ['机械运动'],
        relatedTopics: []
      },
      {
        id: 'state-change',
        name: '物态变化',
        description: '温度测量与六种物态变化',
        difficulty: 'intermediate',
        keyPoints: ['温度计', '熔化与凝固', '汽化与液化', '升华与凝华', '晶体与非晶体'],
        learningObjectives: ['掌握物态变化吸放热', '解释生活现象'],
        examWeight: 15,
        prerequisites: [],
        relatedTopics: ['内能']
      },
      {
        id: 'optics',
        name: '光现象',
        description: '光的直线传播、反射、折射',
        difficulty: 'intermediate',
        keyPoints: ['直线传播', '光的反射定律', '平面镜成像', '光的折射规律', '光的色散'],
        learningObjectives: ['会画光路图', '理解平面镜成像特点'],
        examWeight: 20,
        prerequisites: [],
        relatedTopics: ['透镜']
      },
      {
        id: 'lenses',
        name: '透镜及其应用',
        description: '凸透镜成像规律及其应用',
        difficulty: 'advanced',
        keyPoints: ['凸透镜/凹透镜', '凸透镜成像规律', '照相机/投影仪/放大镜原理', '眼睛与眼镜'],
        learningObjectives: ['熟记成像规律', '解决成像动态变化问题'],
        examWeight: 20,
        prerequisites: ['光现象'],
        relatedTopics: []
      },
      {
        id: 'mass-density',
        name: '质量与密度',
        description: '质量概念与密度计算',
        difficulty: 'intermediate',
        keyPoints: ['质量属性', '天平使用', '密度概念', '密度公式ρ=m/V', '测量物质密度'],
        learningObjectives: ['会测量密度', '利用密度鉴别物质'],
        examWeight: 20,
        prerequisites: [],
        relatedTopics: ['浮力', '压强']
      }
    ],
    examRequirements: [],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  // ==================== 八年级下册 物理 (人教版) ====================
  {
    id: 'guangdong-physics-grade8-down-2024',
    region: '广东',
    grade: '八年级',
    semester: '下册',
    subject: '物理',
    topics: [
      {
        id: 'force',
        name: '力',
        description: '力的概念、弹力、重力',
        difficulty: 'basic',
        keyPoints: ['力的作用效果', '力的示意图', '弹力与弹簧测力计', '重力G=mg'],
        learningObjectives: ['会画力的示意图', '掌握重力计算'],
        examWeight: 15,
        prerequisites: ['质量'],
        relatedTopics: ['运动和力']
      },
      {
        id: 'motion-force',
        name: '运动和力',
        description: '牛顿第一定律、二力平衡、摩擦力',
        difficulty: 'intermediate',
        keyPoints: ['牛顿第一定律', '惯性', '二力平衡条件', '摩擦力影响因素'],
        learningObjectives: ['理解惯性', '分析平衡状态', '判断摩擦力方向'],
        examWeight: 20,
        prerequisites: ['力', '机械运动'],
        relatedTopics: ['压强']
      },
      {
        id: 'pressure',
        name: '压强',
        description: '固体压强、液体压强、大气压强',
        difficulty: 'advanced',
        keyPoints: ['压强公式p=F/S', '液体压强p=ρgh', '连通器', '大气压强', '流体压强与流速'],
        learningObjectives: ['灵活运用压强公式', '解释流体现象'],
        examWeight: 20,
        prerequisites: ['运动和力', '密度'],
        relatedTopics: ['浮力']
      },
      {
        id: 'buoyancy',
        name: '浮力',
        description: '阿基米德原理与物体的浮沉条件',
        difficulty: 'advanced',
        keyPoints: ['浮力产生原因', '阿基米德原理', '物体的浮沉条件'],
        learningObjectives: ['会计算浮力(称重法/公式法/平衡法)', '解决浮沉综合题'],
        examWeight: 25,
        prerequisites: ['压强', '密度', '二力平衡'],
        relatedTopics: []
      },
      {
        id: 'work-energy',
        name: '功和机械能',
        description: '功、功率、动能与势能',
        difficulty: 'intermediate',
        keyPoints: ['功的计算W=Fs', '功率P=W/t', '动能/重力势能/弹性势能', '机械能转化与守恒'],
        learningObjectives: ['理解做功条件', '分析能量转化'],
        examWeight: 10,
        prerequisites: ['力', '运动'],
        relatedTopics: ['简单机械']
      },
      {
        id: 'simple-machines',
        name: '简单机械',
        description: '杠杆、滑轮、机械效率',
        difficulty: 'intermediate',
        keyPoints: ['杠杆平衡条件', '定滑轮/动滑轮/滑轮组', '机械效率η=W有/W总'],
        learningObjectives: ['画力臂', '计算滑轮组机械效率'],
        examWeight: 10,
        prerequisites: ['功', '力'],
        relatedTopics: []
      }
    ],
    examRequirements: [],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  // ==================== 八年级上册 历史 (人教版) ====================
  {
    id: 'guangdong-history-grade8-up-2024',
    region: '广东',
    grade: '八年级',
    semester: '上册',
    subject: '历史',
    topics: [
      {
        id: 'aggression-resistance',
        name: '中国开始沦为半殖民地半封建社会',
        description: '鸦片战争、第二次鸦片战争、太平天国运动',
        difficulty: 'intermediate',
        keyPoints: ['虎门销烟', '《南京条约》', '火烧圆明园', '太平天国兴衰'],
        learningObjectives: ['理解近代史开端', '分析半殖民地化过程'],
        examWeight: 15,
        prerequisites: ['清朝前期盛世'],
        relatedTopics: ['近代化探索']
      },
      {
        id: 'modernization',
        name: '近代化的早期探索与民族危机的加剧',
        description: '洋务运动、甲午中日战争、戊戌变法、八国联军侵华',
        difficulty: 'intermediate',
        keyPoints: ['自强求富', '甲午海战', '《马关条约》', '百日维新', '义和团', '《辛丑条约》'],
        learningObjectives: ['评价洋务运动', '理解民族危机加深过程'],
        examWeight: 20,
        prerequisites: ['鸦片战争'],
        relatedTopics: ['辛亥革命']
      },
      {
        id: 'revolution-1911',
        name: '资产阶级民主革命与中华民国的建立',
        description: '孙中山早期活动、武昌起义、中华民国成立、北洋政府统治',
        difficulty: 'intermediate',
        keyPoints: ['三民主义', '武昌起义', '《中华民国临时约法》', '袁世凯复辟', '军阀割据'],
        learningObjectives: ['理解辛亥革命意义', '认识民主共和的艰难'],
        examWeight: 20,
        prerequisites: ['戊戌变法'],
        relatedTopics: ['新民主主义革命']
      },
      {
        id: 'new-democratic-revolution',
        name: '新民主主义革命的开始',
        description: '新文化运动、五四运动、中国共产党成立',
        difficulty: 'intermediate',
        keyPoints: ['民主与科学', '五四精神', '红船精神', '中共一大'],
        learningObjectives: ['理解五四运动转折意义', '认识中共成立的开天辟地'],
        examWeight: 15,
        prerequisites: ['辛亥革命'],
        relatedTopics: ['国共合作']
      },
      {
        id: 'kmt-ccp',
        name: '从国共合作到国共对立',
        description: '北伐战争、南昌起义、井冈山会师、红军长征',
        difficulty: 'intermediate',
        keyPoints: ['黄埔军校', '四一二政变', '八一建军', '农村包围城市', '遵义会议', '长征精神'],
        learningObjectives: ['掌握建军历史', '理解革命道路的选择'],
        examWeight: 15,
        prerequisites: ['中共成立'],
        relatedTopics: ['抗日战争']
      },
      {
        id: 'anti-japanese-war',
        name: '中华民族的抗日战争',
        description: '九一八事变、西安事变、七七事变、南京大屠杀、台儿庄战役、百团大战、抗战胜利',
        difficulty: 'intermediate',
        keyPoints: ['局部抗战', '统一战线', '全民族抗战', '正面战场/敌后战场', '中共七大'],
        learningObjectives: ['铭记历史', '理解抗战胜利原因与伟大意义'],
        examWeight: 20,
        prerequisites: ['国共对立'],
        relatedTopics: ['解放战争']
      },
      {
        id: 'liberation-war',
        name: '人民解放战争',
        description: '重庆谈判、转战陕北、三大战役、渡江战役',
        difficulty: 'intermediate',
        keyPoints: ['双十协定', '挺进大别山', '辽沈/淮海/平津战役', '占领南京'],
        learningObjectives: ['分析国民党失败原因', '掌握解放战争进程'],
        examWeight: 15,
        prerequisites: ['抗日战争'],
        relatedTopics: ['新中国成立']
      },
      {
        id: 'modern-culture',
        name: '近代经济、社会生活与教育文化事业',
        description: '民族资本主义发展、社会习俗变化、科举废除、新闻出版',
        difficulty: 'basic',
        keyPoints: ['张謇实业救国', '剪辫易服', '京师大学堂', '申报/商务印书馆'],
        learningObjectives: ['了解近代社会变迁'],
        examWeight: 5,
        prerequisites: [],
        relatedTopics: []
      }
    ],
    examRequirements: [],
    createdAt: new Date(),
    updatedAt: new Date()
  },

  // ==================== 北京市 (保留原有) ====================
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

  // ==================== 上海市 (保留原有) ====================
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

  // ==================== 江苏省 (保留原有) ====================
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

  // ==================== 浙江省 (保留原有) ====================
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
