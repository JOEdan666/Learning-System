const { PrismaClient } = require('../app/generated/prisma');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding knowledge base...');

  // 1. 考情画像：广东中考历史
  await prisma.localExamProfile.upsert({
    where: {
      region_subject_year: {
        region: 'guangdong',
        subject: 'history',
        year: 2024
      }
    },
    update: {},
    create: {
      region: 'guangdong',
      subject: 'history',
      year: 2024,
      profileData: {
        knowledgeDistribution: {
          '中国近代史': 0.35,
          '中国现代史': 0.25,
          '世界历史': 0.40
        },
        questionTypeRatio: {
          'choice': 0.46, // 选择题 30题 x 2分
          'material': 0.54 // 非选择题 3题 x 40分
        },
        difficulty: 0.65 // 平均难度
      }
    }
  });

  // 2. 知识片段：考纲
  const syllabusData = [
    {
      content: '了解洋务派为“自强”“求富”而创办的主要军事工业和民用工业，初步认识洋务运动的作用和局限性。',
      tags: ['洋务运动', '中国近代史', '八年级上册'],
      type: 'SYLLABUS'
    },
    {
      content: '知道康有为、梁启超等维新派代表，了解“百日维新”的主要史实。',
      tags: ['戊戌变法', '中国近代史', '八年级上册'],
      type: 'SYLLABUS'
    }
  ];

  // 3. 知识片段：易错点
  const pitfallData = [
    {
      content: '易错点：洋务运动是中国近代化的开端，但不是中国近代史的开端（鸦片战争才是）。',
      tags: ['洋务运动', '概念辨析'],
      type: 'PITFALL'
    },
    {
      content: '易错点：洋务运动的主观目的是维护清朝统治，客观上促进了民族资本主义的产生。不要混淆主观目的与客观影响。',
      tags: ['洋务运动', '影响评价'],
      type: 'PITFALL'
    }
  ];

  // 4. 知识片段：设问模板（材料题）
  const templateData = [
    {
      content: '材料设问模板：根据材料[X]，概括[事件]的[特点/原因/影响]。',
      tags: ['材料题', '概括能力'],
      type: 'TEMPLATE'
    },
    {
      content: '材料设问模板：综合上述材料并结合所学知识，谈谈你对[主题]的认识。',
      tags: ['材料题', '综合分析'],
      type: 'TEMPLATE'
    }
  ];

  const allChunks = [...syllabusData, ...pitfallData, ...templateData];

  for (const chunk of allChunks) {
    await prisma.knowledgeChunk.create({
      data: {
        content: chunk.content,
        type: chunk.type,
        subject: 'history',
        grade: '8',
        region: 'guangdong',
        tags: chunk.tags,
        // vector: ... (skip for MVP, or we need to generate embeddings here)
      }
    });
  }

  console.log(`Seeded ${allChunks.length} knowledge chunks and 1 exam profile.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
