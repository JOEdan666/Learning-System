export interface MockQuestion {
  id: string;
  topicId: string; // 关联的知识点ID
  questions: any[];
}

export const MOCK_QUESTIONS_DATABASE: MockQuestion[] = [
  // 八年级上册 - 全等三角形
  {
    id: 'mock-triangle-basic',
    topicId: 'triangle-basic',
    questions: [
      {
        id: 'q1',
        type: 'multiple_choice',
        points: 10,
        question: '如图，已知 AB=AC，AD=AE，∠BAC=∠DAE，下列结论不正确的是（ ）',
        options: ['A. ∠BAD=∠CAE', 'B. △ABD≌△ACE', 'C. AB=AD', 'D. BD=CE'],
        correctAnswer: 'C',
        explanation: '由∠BAC=∠DAE可得∠BAD=∠CAE，结合AB=AC，AD=AE可证△ABD≌△ACE(SAS)，从而BD=CE。AB与AD的数量关系未知，故C不正确。'
      },
      {
        id: 'q2',
        type: 'multiple_choice',
        points: 10,
        question: '下列条件中，不能判定两个直角三角形全等的是（ ）',
        options: ['A. 两条直角边对应相等', 'B. 斜边和一条直角边对应相等', 'C. 斜边和一锐角对应相等', 'D. 两个锐角对应相等'],
        correctAnswer: 'D',
        explanation: '判定直角三角形全等的方法有HL, SAS, ASA, AAS。D选项两个锐角对应相等只能判定相似（AAA），不能判定全等。'
      },
      {
        id: 'q3',
        type: 'short_answer',
        points: 10,
        question: '如图，点B、F、C、E在一条直线上，FB=CE，AB∥ED，AC∥FD。求证：AB=DE。请写出证明思路的关键一步（判定三角形全等的依据）。',
        correctAnswer: 'ASA',
        explanation: '由平行线得角相等，由FB=CE得BC=EF，利用ASA证明△ABC≌△DEF。'
      }
    ]
  },
  // 八年级上册 - 轴对称
  {
    id: 'mock-axis-symmetry',
    topicId: 'axis-symmetry',
    questions: [
      {
        id: 'q1',
        type: 'multiple_choice',
        points: 10,
        question: '下列图形中，不是轴对称图形的是（ ）',
        options: ['A. 等腰三角形', 'B. 平行四边形', 'C. 圆', 'D. 矩形'],
        correctAnswer: 'B',
        explanation: '平行四边形是中心对称图形，但一般不是轴对称图形（菱形和矩形除外，但普通平行四边形不是）。'
      },
      {
        id: 'q2',
        type: 'multiple_choice',
        points: 10,
        question: '点P(2, -3)关于x轴对称的点的坐标是（ ）',
        options: ['A. (-2, -3)', 'B. (2, 3)', 'C. (-2, 3)', 'D. (2, -3)'],
        correctAnswer: 'B',
        explanation: '关于x轴对称，横坐标不变，纵坐标互为相反数。'
      },
      {
        id: 'q3',
        type: 'short_answer',
        points: 10,
        question: '等腰三角形的两边长分别为4和8，则其周长为______。',
        correctAnswer: '20',
        explanation: '根据三角形三边关系，腰只能是8（4+4=8不满足两边之和大于第三边），所以三边为8, 8, 4，周长为20。'
      }
    ]
  },
  // 八年级下册 - 平行四边形
  {
    id: 'mock-parallelogram',
    topicId: 'parallelogram',
    questions: [
      {
        id: 'q1',
        type: 'multiple_choice',
        points: 10,
        question: '在平行四边形ABCD中，∠A=50°，则∠C的度数是（ ）',
        options: ['A. 40°', 'B. 50°', 'C. 130°', 'D. 140°'],
        correctAnswer: 'B',
        explanation: '平行四边形对角相等，所以∠C=∠A=50°。'
      },
      {
        id: 'q2',
        type: 'multiple_choice',
        points: 10,
        question: '下列性质中，矩形具有而菱形不一定具有的是（ ）',
        options: ['A. 对角线互相平分', 'B. 对角线互相垂直', 'C. 对角线相等', 'D. 对边平行且相等'],
        correctAnswer: 'C',
        explanation: '矩形对角线相等，菱形对角线互相垂直。A和D是平行四边形共有的。'
      },
      {
        id: 'q3',
        type: 'short_answer',
        points: 10,
        question: '若一个多边形的内角和是外角和的2倍，则这个多边形的边数是______。',
        correctAnswer: '6',
        explanation: '外角和固定为360°，内角和为720°，(n-2)×180=720，解得n=6。'
      }
    ]
  }
  ,
  // 物理 - 压强与浮力
  {
    id: 'mock-physics-pressure',
    topicId: 'physics-pressure',
    questions: [
      {
        id: 'q1',
        type: 'multiple_choice',
        points: 10,
        question: '在同一深度处，液体对侧壁的压强（ ）',
        options: ['A. 随深度增大而增大', 'B. 与液体密度无关', 'C. 在同一深度处各方向相等', 'D. 与容器形状有关'],
        correctAnswer: 'C',
        explanation: '液体静止时，同一深度处的压强大小相等，方向与受力面垂直，大小与密度和深度有关，与容器形状无关。'
      },
      {
        id: 'q2',
        type: 'multiple_choice',
        points: 10,
        question: '下列关于浮力的说法正确的是（ ）',
        options: ['A. 漂浮物体不受浮力', 'B. 浮力来源于液体分子间引力', 'C. 浮力方向竖直向上', 'D. 浮力与物体材料无关'],
        correctAnswer: 'C',
        explanation: '浮力是液体对浸入其中的物体向上的作用力，方向竖直向上，大小取决于排开液体的重力（阿基米德原理）。'
      },
      {
        id: 'q3',
        type: 'short_answer',
        points: 10,
        question: '说明为什么在水下越深处，压强越大，并写出液体压强的表达式。',
        correctAnswer: 'p=ρgh，随深度h增大而增大',
        explanation: '液体静止时某深度处上方液体的重力作用导致压强，表达式 p=ρgh，其中ρ为液体密度，g为重力加速度，h为深度。'
      }
    ]
  },
  // 历史 - 鸦片战争
  {
    id: 'mock-history-opium-war',
    topicId: 'history-opium-war',
    questions: [
      {
        id: 'q1',
        type: 'multiple_choice',
        points: 10,
        question: '中国近代史的开端通常以（ ）为标志',
        options: ['A. 太平天国运动', 'B. 洋务运动', 'C. 鸦片战争', 'D. 甲午中日战争'],
        correctAnswer: 'C',
        explanation: '1840年鸦片战争爆发改变了中国历史发展进程，开启中国近代史。'
      },
      {
        id: 'q2',
        type: 'multiple_choice',
        points: 10,
        question: '《南京条约》不包括下列哪一项（ ）',
        options: ['A. 开放五处通商口岸', 'B. 割让香港岛', 'C. 允许外国公使进驻北京', 'D. 赔款2100万银元'],
        correctAnswer: 'C',
        explanation: '外国公使进驻北京属于《天津条约》内容，《南京条约》包括五口通商、割让香港、赔款等。'
      },
      {
        id: 'q3',
        type: 'short_answer',
        points: 10,
        question: '简述虎门销烟的历史意义。',
        correctAnswer: '显示中华民族反抗外来侵略的意志，是禁烟斗争伟大胜利',
        explanation: '1839年林则徐主持虎门销烟，体现反侵略决心，成为近代民族精神的重要体现。'
      }
    ]
  },
  // 历史 - 甲午中日战争与《马关条约》
  {
    id: 'mock-history-jiawu',
    topicId: '甲午中日战争与《马关条约》',
    questions: [
      {
        id: 'q1',
        type: 'multiple_choice',
        points: 10,
        question: '《马关条约》中，最能体现列强资本输出需求（对中国民族工业危害最大）的条款是（ ）',
        options: ['A. 赔偿军费二亿两白银', 'B. 开放沙市、重庆、苏州、杭州为商埠', 'C. 允许日本在通商口岸开设工厂', 'D. 割辽东半岛、台湾全岛及所有附属各岛屿、澎湖列岛'],
        correctAnswer: 'C',
        explanation: '允许开设工厂标志着列强侵略方式由商品输出转为资本输出，严重阻碍中国民族工业发展。'
      },
      {
        id: 'q2',
        type: 'multiple_choice',
        points: 10,
        question: '甲午中日战争中，致远舰管带（舰长）壮烈殉国的是（ ）',
        options: ['A. 左宗棠', 'B. 邓世昌', 'C. 林则徐', 'D. 丁汝昌'],
        correctAnswer: 'B',
        explanation: '黄海海战中，致远舰管带邓世昌在弹药用尽后欲撞沉日舰，不幸被鱼雷击中，壮烈殉国。'
      },
      {
        id: 'q3',
        type: 'short_answer',
        points: 10,
        question: '简述《马关条约》对中国社会性质和半殖民地化程度的影响。',
        correctAnswer: '大大加深了中国的半殖民地化程度',
        explanation: '《马关条约》使外国侵略势力进一步深入中国腹地，大大加深了中国的半殖民地化程度，引发了列强瓜分中国的狂潮。'
      }
    ]
  }
];
