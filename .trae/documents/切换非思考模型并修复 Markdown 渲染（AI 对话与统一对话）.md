## 目标
- 将模型切换为非思考模式（DeepSeek 的 `deepseek-chat`）。
- 彻底修复 AI 对话与统一对话中的 Markdown 渲染：换行、粗体、一级标题、列表、表格与代码块均正常显示。

## 拟改动
### 模型切换
- 修改 `.env.local`：`OPENAI_MODEL=deepseek-chat`（保持 `NEXT_PUBLIC_AI_PROVIDER=openai` 与 `OPENAI_BASE_URL=https://api.deepseek.com/v1` 不变）。
- 后端 `app/api/openai-chat/route.ts`：
  - 移除或保留“reasoning_content 标记追加”的逻辑均可；在非思考模式下不会出现推理字段，逻辑不再触发。为简化可删除标记追加（[[REASONING_START]]/[[REASONING_END]]）。
  - 流式与非流式解析统一读取 `message.content`/`delta.content`，不再兜底 `reasoning_content`。

### 渲染修复（主应用）
- `app/components/UnifiedChat.tsx`：
  - 将 “AI智能讲解”块的 `selectedConversation.aiExplanation` 渲染改为 `<TableRenderer content={selectedConversation.aiExplanation} />`（当前是纯文本 `whitespace-pre-wrap`）。
  - 助手消息保持使用 `<TableRenderer content={message.content} />`；流式阶段继续走纯文本增量，结束后再渲染为 Markdown（当前已实现）。
- `app/components/AIChat.tsx`：
  - 维持“流式阶段 -> 纯文本，完成 -> TableRenderer”的切换，避免片段期 Markdown 塌缩。

### 渲染修复（github-upload 目录）
- 同步 `github-upload/app/components/UnifiedChat.tsx` 的“AI智能讲解”块改为 TableRenderer（当前主仓已改，需同步检查）。
- 同步保留助手消息的“流式阶段纯文本/完成后 Markdown”切换（当前已实现）。

### 渲染器增强（已存在的基础上再补强）
- `TableRenderer.tsx`（主应用与 github-upload 均已引入）：
  - 继续保留：
    - 将 `<br/>` 归一化为 `\n`，自动为标题/引用/列表/数字列表补空行。
    - 中文结构转 Markdown：`一、二、三、` -> `##` 标题；`（1）（2）` -> `1.` 列表；`•、–、—、◦、▪` -> `-` 列表。
  - GFM 表格分段与对齐渲染、代码块语言标签与复制按钮保持不变。

## 验证步骤
1. `.env.local` 改为 `deepseek-chat` 后重启开发服务。
2. 在 AI 对话中发送包含：
   - `# 一级标题`、`**加粗**`、`> 引用`、`- 列表`、`1. 列表`
   - GFM 表格：`| A | B |` + 对齐行
   - 代码块：```py ... ```
   完成后应渲染清晰（流式过程中显示纯文本，结束后渲染为 Markdown）。
3. 打开统一对话页，检查“AI智能讲解”块是否按 Markdown 渲染（标题/列表/表格/代码块均正常）。
4. 连续发送 ≥3 条消息，确认自动标题生成（默认/日期/临时截断标题均能被替换）。

## 回滚与风险
- 模型切换仅修改环境变量，可随时改回；后端解析逻辑保持对标准 OpenAI 兼容接口。
- 渲染器预处理只对文本做非破坏性规范化，不影响标准 Markdown；若遇到少数边缘格式，可在渲染器中微调规则。

## 需要你确认
- 是否同意将模型切换为 `deepseek-chat`（非思考模式），并按上述方案更新渲染与统一对话的讲解展示？
- 确认后我将直接实施并自测，确保无回归。