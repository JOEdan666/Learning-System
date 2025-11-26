## 问题定位
- 客户端在保存 `userAnswers` 时，使用的是前端生成的 `questionId`（数字或本地ID），而服务端在保存题目后会生成新的 `QuizQuestion.id`（cuid）。
- 当前 API 直接使用前端 `questionId` 写入 `UserAnswer.questionId`，触发外键约束错误（P2003），导致“保存学习进度失败”，页面刷新也无法回显。

## 修复思路
- 在服务端 `/api/learning-progress` 的 POST 流程中，先保存 `LearningSession`，再保存 `quizQuestions`，拿到真实题目列表。
- 对 `userAnswers` 做映射：
  - 支持两种来源：`questionOrder`（推荐）或 `questionText`（兜底），将其匹配到刚创建的题目，得到真实 `QuizQuestion.id`。
  - 只有在拿到真实 `id` 后才批量写入 `UserAnswer`。
- 客户端调整：
  - `QuizStep` 的 `onComplete` 结果内为每道题携带 `order`（或文本），`learning-interface` 构建 `userAnswers` 时改为传 `questionOrder`，不再传临时 `questionId`。
- 回显与恢复：
  - 学习历史查询已包含 `quizQuestions` 与 `userAnswers`，修复后刷新即可看到之前测验与结果。

## 具体改动
1. 服务端 `POST /api/learning-progress`：
  - 在 `saveQuizQuestions` 后查询该 `sessionId` 所有题目 `[{id, order, question}]`。
  - 遍历 `userAnswers`：
    - 若包含 `questionOrder`，按 `order` 匹配；
    - 否则使用 `questionText` 近似匹配；
    - 将匹配到的 `id` 写入后再调用 `saveUserAnswers`。
  - 对无法匹配的答案，记录日志并跳过，返回半成功但不中断保存。
2. 客户端 `learning-interface`：
  - `handleQuizComplete` 与 `handleReviewComplete` 组装 `userAnswers` 时，传 `questionOrder`（和 `questionText` 作为兜底），不再使用本地 `questionId`。
  - 手动保存 `handleManualSave` 同步改造。
3. 反馈与重试：
  - 保存失败时显示友好提示（含“外键映射失败”），并提供“一键重试”按钮。

## 验证
- 做一次测验并保存，服务端日志无外键错误；刷新后在“学习历史”可看到题目与答案。
- 手动保存按钮成功；再次进入 `learning-interface` 能恢复 `quizResults` 与统计。

如确认，我将按以上方案改动服务端映射与客户端传参，并进行端到端验证。