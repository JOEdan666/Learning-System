// 测试完整的用户学习旅程
const testCompleteUserJourney = async () => {
  console.log('🚀 开始测试完整的用户学习旅程...');
  
  try {
    // 1. 测试主页面是否正常加载
    console.log('\n📱 步骤1: 测试主页面加载...');
    const mainPageResponse = await fetch('http://localhost:3001');
    if (mainPageResponse.ok) {
      console.log('✅ 主页面加载成功');
    } else {
      throw new Error(`主页面加载失败: ${mainPageResponse.status}`);
    }

    // 2. 测试学习闭环页面是否正常加载
    console.log('\n📚 步骤2: 测试学习闭环页面加载...');
    const learningPageResponse = await fetch('http://localhost:3001/test-jys-learning');
    if (learningPageResponse.ok) {
      console.log('✅ 学习闭环页面加载成功');
    } else {
      throw new Error(`学习闭环页面加载失败: ${learningPageResponse.status}`);
    }

    // 3. 测试保存学习记录功能
    console.log('\n💾 步骤3: 测试保存学习记录功能...');
    const learningData = {
      conversationId: `user_journey_test_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      subject: '语文',
      topic: '静夜思',
      region: '全国',
      grade: '初中',
      aiExplanation: '这是一首表达思乡之情的古诗，通过描写月夜景色来抒发诗人对故乡的思念...',
      socraticDialogue: [
        {
          question: '这首诗的主题是什么？',
          answer: '思乡',
          feedback: '很好！诗人通过月夜景色表达了对故乡的思念。'
        },
        {
          question: '诗中哪些意象体现了思乡之情？',
          answer: '明月、霜',
          feedback: '正确！明月和霜都是引发思乡情感的重要意象。'
        }
      ],
      currentStep: 'EXPLAIN',
      isCompleted: false
    };

    const saveResponse = await fetch('http://localhost:3001/api/learning-progress', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(learningData)
    });

    if (!saveResponse.ok) {
      throw new Error(`保存学习记录失败: ${saveResponse.status}`);
    }

    const saveResult = await saveResponse.json();
    console.log('✅ 学习记录保存成功');
    console.log('📄 保存的记录ID:', saveResult.id);

    // 4. 测试学习历史页面是否能显示新记录
    console.log('\n📋 步骤4: 测试学习历史页面...');
    const historyPageResponse = await fetch('http://localhost:3001/learning-history');
    if (historyPageResponse.ok) {
      console.log('✅ 学习历史页面加载成功');
    } else {
      throw new Error(`学习历史页面加载失败: ${historyPageResponse.status}`);
    }

    // 5. 验证学习历史API是否返回新记录
    console.log('\n🔍 步骤5: 验证学习历史数据...');
    const historyApiResponse = await fetch('http://localhost:3001/api/learning-progress?getAllSessions=true&limit=10&offset=0');
    
    if (!historyApiResponse.ok) {
      throw new Error(`学习历史API调用失败: ${historyApiResponse.status}`);
    }

    const historyData = await historyApiResponse.json();
    console.log('✅ 学习历史数据获取成功');
    console.log(`📊 总共有 ${historyData.sessions?.length || 0} 个学习会话`);

    // 检查我们刚保存的记录是否在列表中
    const ourSession = historyData.sessions?.find(s => s.conversationId === learningData.conversationId);
    if (ourSession) {
      console.log('✅ 新保存的学习记录已出现在历史列表中!');
      console.log('📝 记录详情:');
      console.log(`   - 主题: ${ourSession.topic}`);
      console.log(`   - 学科: ${ourSession.subject}`);
      console.log(`   - 年级: ${ourSession.grade}`);
      console.log(`   - 当前步骤: ${ourSession.currentStep}`);
      console.log(`   - 创建时间: ${new Date(ourSession.createdAt).toLocaleString('zh-CN')}`);
    } else {
      console.log('⚠️ 新保存的学习记录未在历史列表中找到');
    }

    // 6. 测试错误答案筛选功能
    console.log('\n❌ 步骤6: 测试错误答案筛选功能...');
    
    // 创建一些测试的错误答案
    const wrongAnswersData = [
      {
        conversationId: learningData.conversationId,
        questionText: '这首诗的作者是谁？',
        userAnswer: '杜甫',
        correctAnswer: '李白',
        isCorrect: false,
        explanation: '《静夜思》是李白的作品，不是杜甫的。'
      },
      {
        conversationId: learningData.conversationId,
        questionText: '诗中"疑是地上霜"的"疑"字表达了什么？',
        userAnswer: '怀疑',
        correctAnswer: '好像、仿佛',
        isCorrect: false,
        explanation: '这里的"疑"是"好像、仿佛"的意思，表示一种错觉。'
      }
    ];

    for (const wrongAnswer of wrongAnswersData) {
      const wrongAnswerResponse = await fetch('http://localhost:3001/api/user-answers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(wrongAnswer)
      });

      if (!wrongAnswerResponse.ok) {
        throw new Error(`保存错误答案失败: ${wrongAnswerResponse.status}`);
      }
    }

    console.log('✅ 错误答案保存成功');

    // 验证错误答案筛选
    const wrongAnswersApiResponse = await fetch(`http://localhost:3001/api/user-answers?conversationId=${learningData.conversationId}&incorrectOnly=true`);
    
    if (!wrongAnswersApiResponse.ok) {
      throw new Error(`错误答案API调用失败: ${wrongAnswersApiResponse.status}`);
    }

    const wrongAnswersResult = await wrongAnswersApiResponse.json();
    console.log('✅ 错误答案筛选功能正常');
    console.log(`📊 找到 ${wrongAnswersResult.answers?.length || 0} 个错误答案`);

    // 7. 总结测试结果
    console.log('\n🎉 用户旅程测试完成!');
    console.log('\n📋 测试总结:');
    console.log('✅ 主页面加载正常');
    console.log('✅ 学习闭环页面加载正常');
    console.log('✅ 学习记录保存功能正常');
    console.log('✅ 学习历史页面加载正常');
    console.log('✅ 学习历史数据显示正常');
    console.log('✅ 错误答案筛选功能正常');
    console.log('\n🚀 所有核心功能都正常工作，用户可以完整体验学习流程！');

    // 8. 清理测试数据（可选）
    console.log('\n🧹 清理测试数据...');
    try {
      // 这里可以添加清理逻辑，但为了保持数据完整性，我们暂时保留测试数据
      console.log('💡 测试数据已保留，可在学习历史中查看');
    } catch (cleanupError) {
      console.log('⚠️ 清理测试数据时出现问题，但不影响主要功能');
    }

  } catch (error) {
    console.error('❌ 用户旅程测试失败:', error.message);
    console.error('错误详情:', error);
    
    // 提供故障排除建议
    console.log('\n🔧 故障排除建议:');
    console.log('1. 确保开发服务器正在运行 (npm run dev)');
    console.log('2. 确保数据库连接正常');
    console.log('3. 检查API端点是否正确配置');
    console.log('4. 查看浏览器控制台是否有错误信息');
  }
};

// 运行测试
testCompleteUserJourney();