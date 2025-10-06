const { PrismaClient } = require('./app/generated/prisma');

async function testDatabaseSave() {
  const prisma = new PrismaClient();
  
  try {
    console.log('连接数据库...');
    
    // 测试保存学习会话
    const testSession = await prisma.learningSession.create({
      data: {
        conversationId: 'test-conversation-' + Date.now(),
        subject: '数学',
        topic: '二次函数',
        region: '北京',
        grade: '高一',
        aiExplanation: '这是一个测试AI讲解',
        socraticDialogue: JSON.stringify([
          { role: 'user', content: '什么是二次函数？' },
          { role: 'assistant', content: '二次函数是形如 f(x) = ax² + bx + c 的函数...' }
        ]),
        currentStep: 'EXPLAIN',
        isCompleted: false
      }
    });
    
    console.log('✅ 成功保存学习会话:', testSession);
    
    // 查询所有学习会话
    const allSessions = await prisma.learningSession.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    
    console.log('📚 最近的学习会话数量:', allSessions.length);
    allSessions.forEach((session, index) => {
      console.log(`${index + 1}. ${session.subject} - ${session.topic} (${session.createdAt})`);
    });
    
  } catch (error) {
    console.error('❌ 数据库操作失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabaseSave();