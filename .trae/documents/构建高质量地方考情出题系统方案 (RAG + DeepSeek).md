# 系统架构设计方案：高质量地方考情出题系统 (RAG + DeepSeek)

基于您的需求，我为您设计了一套完整的 RAG 出题系统方案。该方案利用 Next.js + Prisma + PostgreSQL (pgvector) 技术栈，通过 DeepSeek 模型生成符合地方考情的高质量题目。

我们选择 **初中历史** 作为 MVP 切入点，因为历史学科的考情特征（如特定史实侧重、材料题风格）非常适合 RAG 检索，且文本处理比数学公式更容易快速落地验证。

---

## A. 总体架构图

系统分为四层，数据流从下往上：

1.  **数据层 (Data Layer)**
    *   **PostgreSQL**: 核心数据库。
    *   **pgvector**: 向量扩展，用于知识片段的语义检索。
    *   **Prisma ORM**: 数据访问接口。

2.  **RAG 引擎层 (RAG Engine)**
    *   **Retriever (检索器)**: 负责根据出题请求，从数据库中召回“考纲标准”、“考情统计”、“设问模板”和“易错点”。
    *   **Vector Service**: 负责文本 Embedding（可调用 DeepSeek 或 OpenAI Embedding API）。

3.  **生成与质检层 (Generation & QC Layer)**
    *   **DeepSeek Provider**: 封装 DeepSeek API，提供生成能力。
    *   **Prompt Assembler**: 将检索到的上下文 (Context) 和出题规格 (Spec) 组装成结构化 Prompt。
    *   **QC Chain (质检链)**: 包含规则校验（JSON 结构、选项完整性）和模型审题（语义歧义、超纲检查）。

4.  **业务接口层 (Service Layer)**
    *   `QuestionGenerator`: 对外暴露统一的出题接口 `generateQuestion(spec)`。

---

## B. 数据库 Schema 设计 (Prisma)

我们需要新增 4 个核心模型。请在 `prisma/schema.prisma` 中添加：

```prisma
// 1. 知识片段库：存储考纲、模板、易错点等
model KnowledgeChunk {
  id        String   @id @default(cuid())
  content   String   // 文本内容：如“广东中考历史侧重考察岭南文化...”
  vector    Unsupported("vector(1536)")? // 向量数据 (需手动开启 pgvector 扩展)
  
  // 元数据标签，用于精确过滤
  type      ChunkType // 枚举：SYLLABUS(考纲), EXAM_PROFILE(考情), TEMPLATE(模板), PITFALL(易错点)
  subject   String    // 学科：history
  grade     String    // 年级
  region    String    // 地区：guangdong
  tags      String[]  // 细分标签：["经济史", "选择题"]
  
  createdAt DateTime @default(now())
  
  @@map("knowledge_chunks")
}

// 2. 地方考情画像：结构化的统计数据
model LocalExamProfile {
  id        String   @id @default(cuid())
  region    String   // 地区：guangdong
  subject   String   // 学科
  year      Int      // 年份：2024
  
  // 统计画像 (JSON)
  // 包含：知识点频率 map、题型占比 map、能力层级占比 map
  profileData Json 
  
  @@unique([region, subject, year])
  @@map("local_exam_profiles")
}

// 3. 题目库
model QuestionBank {
  id          String   @id @default(cuid())
  content     Json     // 完整题目结构 (题干、选项、答案、解析)
  hash        String   @unique // 内容哈希，用于去重
  
  // 索引字段
  subject     String
  grade       String
  region      String
  difficulty  Float    // 0.0-1.0
  knowledgePoints String[] // 关联知识点
  
  // 质量状态
  qcStatus    QCStatus @default(PENDING) // PENDING, PASSED, FAILED
  qcLog       Json?    // 质检日志
  
  createdAt   DateTime @default(now())
  
  @@map("question_bank")
}

// 枚举定义
enum ChunkType {
  SYLLABUS
  EXAM_PROFILE
  TEMPLATE
  PITFALL
}

enum QCStatus {
  PENDING
  PASSED
  FAILED
}
```

---

## C. RAG 检索策略

当用户请求生成一道“广东中考-八年级历史-洋务运动-材料分析题”时：

1.  **精确检索 (Filter)**:
    *   从 `LocalExamProfile` 获取“广东中考历史”的**题型分布**和**难度偏好**。
    *   从 `KnowledgeChunk` 过滤 `type=TEMPLATE` AND `tags contains "材料题"`，获取**设问模板**。
    *   从 `KnowledgeChunk` 过滤 `type=SYLLABUS`，获取该知识点的**考纲边界**。

2.  **语义检索 (Vector Search)**:
    *   Query: "洋务运动 易错点 广东考情"
    *   从 `KnowledgeChunk` (`type=PITFALL` OR `type=EXAM_PROFILE`) 中检索最相关的 3-5 条片段（例如：“广东中考常考洋务运动对民族资本主义的诱导作用...”）。

3.  **上下文组装**:
    *   将上述 retrieved context 放入 Prompt 的 `[Local Context]` 区块。

---

## D. 出题 Spec (JSON Schema)

这是传给 DeepSeek 的输入要求，也是 API 的入参：

```typescript
interface QuestionSpec {
  subject: string;      // "history"
  grade: string;        // "8"
  region: string;       // "guangdong"
  knowledgePoints: string[]; // ["洋务运动", "李鸿章"]
  questionType: string; // "material_analysis" (材料分析题)
  difficulty: number;   // 0.7 (0-1，越大越难)
  bloomLevel: string;   // "analyze" (布鲁姆认知层级：识记/理解/应用/分析/评价)
}
```

DeepSeek 的**输出格式**要求 (JSON):

```json
{
  "stem": "材料一：...（题目材料）...",
  "questions": [
    {
      "sub_question": "根据材料一，指出...",
      "score": 4,
      "answer": "...",
      "grading_points": ["提到'自强'得2分", "提到'求富'得2分"]
    }
  ],
  "analysis": "...",
  "difficulty_assessed": 0.7,
  "pitfalls": "学生容易混淆...",
  "tags": ["洋务运动", "近代化"]
}
```

---

## E. Prompt 组装 (Template)

```markdown
Role: 你是#{region}地区资深的中考#{subject}命题专家。
Task: 请根据提供的[地方考情]和[知识点]，创作一道符合#{grade}年级水平的#{questionType}。

[Constraints]
1. 严格遵守以下考纲边界，禁止超纲：#{syllabus_context}
2. 模仿以下设问风格（不要直接复制）：#{template_context}
3. 难度系数控制在 #{difficulty} 左右。
4. 必须以 JSON 格式输出，不要包含 Markdown 标记。

[Local Context - 广东考情]
#{retrieved_exam_profile}
#{retrieved_pitfalls}

[Input Spec]
知识点: #{knowledgePoints}
能力层级: #{bloomLevel}

[Output JSON Structure]
...
```

---

## F. 自动质检链 (QC Chain)

质检通过率必须达到 100% 才能入库。

1.  **FormatCheck (规则)**:
    *   `JSON.parse` 是否成功？
    *   必要字段 (`stem`, `answer`, `analysis`) 是否非空？
    *   分值总和是否匹配？

2.  **ConstraintCheck (模型)**:
    *   **审题 Prompt**: "请检查这道题是否包含#{region}地区未涉及的超纲词汇？是否存在逻辑歧义？只回答 YES/NO 及原因。"
    *   如果模型回答 YES，则标记为 FAILED，并记录原因。

3.  **DuplicationCheck (向量)**:
    *   计算新题目 `stem` 的向量，与 `QuestionBank` 中已有题目比对。
    *   相似度 > 0.9 则判定为重复，拒绝入库。

4.  **Retry Strategy**:
    *   如果 FAILED，将“错误原因”追加到 Prompt 的 `[Correction]` 区块，降低 `temperature`，重新生成。最多重试 3 次。

---

## G. MVP 任务清单 (3天计划)

**Day 1: 基础设施搭建**
1.  [Database] 修改 `schema.prisma`，添加 pgvector 支持（或使用模拟向量表），执行迁移。
2.  [AI Service] 扩展 `app/services/ai/providers`，新增 `DeepSeekProvider`，实现 OpenAI 兼容接口调用。
3.  [Script] 编写 `seed_knowledge.ts`，支持导入 Markdown 格式的考纲和考情数据到 `KnowledgeChunk` 表。

**Day 2: 核心 RAG 实现**
1.  [RAG] 实现 `KnowledgeRetriever` 类，编写混合检索逻辑（关键词+向量）。
2.  [Prompt] 编写 `PromptBuilder`，实现上下文组装。
3.  [Generator] 开发 `QuestionGenerator` 服务，串联 Retrieve -> Assemble -> Call LLM 流程。

**Day 3: 质检与接口**
1.  [QC] 实现 `QCChain` 类，包含 JSON 校验和 DeepSeek 审题逻辑。
2.  [API] 开发 `/api/generate-question` 接口，对接前端。
3.  [UI] 编写一个简单的调试页面，输入 Spec，展示生成的题目和质检结果。

---

### 关于 DeepSeek 调用
我们将复用现有的 `AIProvider` 架构。由于 DeepSeek API 完全兼容 OpenAI SDK，我们只需在 `createProviderFromEnv` 中增加配置即可，无需引入新 SDK。

请确认是否开始执行 **Day 1** 任务：修改 Schema 并封装 DeepSeek Provider？
