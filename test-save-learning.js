// 测试保存学习记录功能
const testSaveLearningRecord = async () => {
  console.log('🧪 开始测试保存学习记录功能...');
  
  try {
    // 准备测试数据
    const learningData = {
      conversationId: `test_session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      subject: '语文',
      topic: '静夜思',
      region: '全国',
      grade: '初中',
      aiExplanation: '这是一首表达思乡之情的古诗...',
      socraticDialogue: [
        {
          question: '这首诗表达了什么情感？',
          answer: '思乡之情',
          feedback: '回答正确！'
        }
      ],
      currentStep: 'EXPLAIN',
      isCompleted: false
    };

    console.log('📤 发送保存请求...');
    console.log('数据:', JSON.stringify(learningData, null, 2));

    // 调用API保存数据
    const response = await fetch('http://localhost:3001/api/learning-progress', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(learningData)
    });

    console.log('📥 响应状态:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`保存失败: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ 保存成功!');
    console.log('返回结果:', JSON.stringify(result, null, 2));

    // 验证保存的数据
    console.log('🔍 验证保存的数据...');
    const verifyResponse = await fetch(`http://localhost:3001/api/learning-progress?conversationId=${learningData.conversationId}`);
    
    if (verifyResponse.ok) {
      const savedData = await verifyResponse.json();
      console.log('✅ 数据验证成功!');
      console.log('保存的数据:', JSON.stringify(savedData, null, 2));
    } else {
      console.log('❌ 数据验证失败');
    }

    // 检查学习历史页面是否能显示新数据
    console.log('🔍 检查学习历史页面...');
    const historyResponse = await fetch('http://localhost:3001/api/learning-progress?getAllSessions=true&limit=10&offset=0');
    
    if (historyResponse.ok) {
      const historyData = await historyResponse.json();
      console.log('✅ 学习历史获取成功!');
      console.log(`📊 总共有 ${historyData.sessions?.length || 0} 个学习会话`);
      
      // 检查我们刚保存的数据是否在列表中
      const ourSession = historyData.sessions?.find(s => s.conversationId === learningData.conversationId);
      if (ourSession) {
        console.log('✅ 新保存的学习记录已出现在历史列表中!');
      } else {
        console.log('⚠️ 新保存的学习记录未在历史列表中找到');
      }
    } else {
      console.log('❌ 学习历史获取失败');
    }

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error('错误详情:', error);
  }
};

// 运行测试
testSaveLearningRecord();