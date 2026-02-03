## 现状结论（问题根因）
1. 渲染入口分裂：同一项目里同时存在多套 Markdown 渲染（MarkdownRenderer / TableRenderer / 多处 ReactMarkdown 直用），导致“同样的内容在不同页面表现不一致”。
2. 预处理方式不专业：当前在 [MarkdownRenderer.tsx](file:///Users/fangyuan/Desktop/产品【自学系统】/app/components/MarkdownRenderer.tsx) 里用正则对整段文本全局改写（标题/列表/中英空格/代码围栏），会误伤代码块、LaTeX、URL，出现你看到的粘连、断行、错位。
3. 代码/样式层面确有明确缺陷：
   - [ConversationView.tsx](file:///Users/fangyuan/Desktop/产品【自学系统】/app/components/ConversationView.tsx) 使用 rehype-katex 但缺 KaTeX CSS，公式会不可读。
   - 学习归档详情页 [learning-history/[id]/page.tsx](file:///Users/fangyuan/Desktop/产品【自学系统】/app/learning-history/%5Bid%5D/page.tsx) 直接使用 ReactMarkdown 但缺 import（属于确定的逻辑/代码错误，会导致运行/编译问题）。
   - AIChat 内存在未使用且潜在危险的“把 Markdown 替换成 HTML”的函数 [AIChat.tsx:L435-L465](file:///Users/fangyuan/Desktop/产品【自学系统】/app/components/AIChat.tsx#L435-L465)，未来如果开启 raw HTML 会有注入风险。
   - 全局样式里对 markdown 表头 sticky 的规则可能在聊天滚动容器里造成遮挡/抖动（[globals.css:L186-L215](file:///Users/fangyuan/Desktop/产品【自学系统】/app/globals.css#L186-L215)）。

## 修复目标（你要的“看得很舒服”）
- AI 对话/学习流/历史页面：统一排版规则（标题、列表、换行、表格、代码块、公式、链接），一致且稳定。
- 彻底杜绝“模型输出不规范导致渲染炸裂”的场景（例如 ```json{...}、###紧贴、1.**紧贴** 等）。

## 实施方案（分 4 组变更）
### 1) 统一渲染入口（只留一个 MarkdownRenderer）
- 将这些文件中直接使用 ReactMarkdown 的地方统一替换为 MarkdownRenderer：
  - [ConversationView.tsx](file:///Users/fangyuan/Desktop/产品【自学系统】/app/components/ConversationView.tsx)
  - [ExplainStep.tsx](file:///Users/fangyuan/Desktop/产品【自学系统】/app/components/LearningFlow/ExplainStep.tsx)
  - [learning-history/[id]/page.tsx](file:///Users/fangyuan/Desktop/产品【自学系统】/app/learning-history/%5Bid%5D/page.tsx)
- 删除 ConfirmStep / ReAskModal 里“表格拆分再渲染”的重复逻辑，直接 MarkdownRenderer 一次渲染：
  - [ConfirmStep.tsx](file:///Users/fangyuan/Desktop/产品【自学系统】/app/components/LearningFlow/ConfirmStep.tsx)
  - [ReAskModal.tsx](file:///Users/fangyuan/Desktop/产品【自学系统】/app/components/LearningFlow/ReAskModal.tsx)

### 2) 把“字符串正则预处理”升级为“AST 安全处理”（关键）
- 新增一个 remark 插件（放在 app/components/markdown/ 目录），只对普通文本节点生效，并明确跳过 code/inlineCode/math/inlineMath/link/url。
- 用它替代当前 preprocessContent 里高风险的：
  - 中英数字自动插空格
  - 粘连代码围栏修复
  - 标题/列表修复
- 这样可保证：你想要的自动纠错保留，但不会再污染代码/公式/链接。

### 3) 专业化代码块与目录树显示
- 代码块策略：
  - 真代码（多行/有语言/包含符号密集）：SyntaxHighlighter + copy + 自动换行
  - “目录树/命令行/短片段”：用轻量 pre 样式（不强行变 inline，也不做夸张头部条）
- 同时修复 [TableRenderer.tsx](file:///Users/fangyuan/Desktop/产品【自学系统】/app/components/TableRenderer.tsx) 里的表格解析函数潜在错列问题（或直接停止使用该解析，避免空单元格被 filter 掉）。

### 4) 样式收敛（避免 prose 与 markdown-body 冲突）
- KaTeX CSS：在全局统一引入一次，避免有的页面公式正常、有的不正常。
- 调整全局 sticky 表头规则：把 [globals.css](file:///Users/fangyuan/Desktop/产品【自学系统】/app/globals.css) 中对 markdown-body 的 sticky 行为限制到“特定页面容器类”下，避免聊天区滚动时遮挡。
- 统一链接、表格、标题间距，让阅读节奏更像 ChatGPT/Notion。

## 验证方式
- 增加一个“渲染回归测试页”（仅开发用），包含：标题粘连、列表粘连、表格空单元格、目录树、无语言代码块、```json{...}、LaTeX 混排。
- 本地打开 AI 对话与学习流页面，逐条确认：换行/代码块/表格/公式/标题都稳定且美观。

确认后我将开始按上述 4 组改动逐项落地，并在每一步都用你给的“坏输入样例”做回归。