## 现状与主要问题（已定位到代码点）
- 聊天消息主要用 [MarkdownRenderer.tsx](file:///Users/fangyuan/Desktop/产品【自学系统】/app/components/MarkdownRenderer.tsx) 渲染，但部分页面仍直接用 `react-markdown`，导致“同样内容不同页面观感不一致”（如 [QuizStep.tsx](file:///Users/fangyuan/Desktop/产品【自学系统】/app/components/LearningFlow/QuizStep.tsx)、[learning-history/page.tsx](file:///Users/fangyuan/Desktop/产品【自学系统】/app/learning-history/page.tsx)、[markdown-test/page.tsx](file:///Users/fangyuan/Desktop/产品【自学系统】/app/markdown-test/page.tsx)）。
- 你给的示例里出现了 LLM 常见“Markdown 断行/粘连”问题：
  - `它们都是平行四边形。### 二、性质对比`（标题不在行首）→ 当前预处理只修“行首标题”，所以 `###` 会当作普通字符显示。
  - `|图形|定义 ||------|------|`（表头行和分隔行被挤在同一行）→ GFM 表格无法解析，会把 `|` 全当文本。
  - 表格单元格里的 `<br>` → 目前不会被当作换行渲染，容易直接显示成字符。
- 当前默认启用了 `remark-breaks`（见 [MarkdownRenderer.tsx](file:///Users/fangyuan/Desktop/产品【自学系统】/app/components/MarkdownRenderer.tsx#L130-L133)），会把“单换行”都变成 `<br>`，对 AI 输出的中文段落会造成断句过碎、视觉很挤。
- 样式上 `MarkdownRenderer` 强制大量 `text-gray-*` 颜色（如 `text-gray-700`、`prose-headings:text-gray-900`、代码块背景白色），在不同容器（灰底气泡/白底卡片）下容易产生对比不舒服，且不利于未来暗色模式（项目已启用 `darkMode: 'class'`）。

## 目标
- 让你给的这类“结构化讲解 + 表格 + 小标题 + 列表 + <br>”在聊天里稳定渲染成：标题像标题、表格像表格、段落不碎、整体更好读。
- 统一全站的 Markdown 渲染入口，避免样式/功能割裂。

## 实施方案（我会按顺序落地）
1) 强化 Markdown 预处理（仅在非代码围栏内生效）
- 在 [MarkdownRenderer.tsx](file:///Users/fangyuan/Desktop/产品【自学系统】/app/components/MarkdownRenderer.tsx) 的 `preprocessContent()` 增加“结构分隔修复”：
  - 将“行内标题标记”规范化：遇到 `。###` / `！###` / `)###` 等，把 `###` 前插入 `\n\n`，并保证 `###` 后有空格。
  - 将“行内列表标记”规范化：遇到 `。-矩形...` 这种，把 `-` 前插入换行并补空格。
  - 修复“表头/分隔行粘连”：把形如 `|...| ||---|---|` 自动拆成两行。
  - 给表格块前后自动补空行（提高解析稳定性）。

2) 调整换行策略，解决“断句很碎”
- 从默认插件中移除 `remark-breaks`（避免把所有单换行强制变 `<br>`）。
- 新增一个自定义 remark 插件（与 [remarkTypographyFixes.ts](file:///Users/fangyuan/Desktop/产品【自学系统】/app/components/markdown/remarkTypographyFixes.ts) 同风格递归遍历实现），将 HTML 节点中的 `<br>` / `<br/>` 转换为 Markdown 的 `break` 节点：
  - 这样表格里写 `<br>` 会按换行展示，但又不需要开启危险的 raw HTML 渲染。

3) 改善可读性样式（不靠“强行染色”）
- 让正文颜色尽量继承父容器（对话气泡/卡片自己决定底色与前景色），减少 `text-gray-700` 这类硬编码。
- 使用 `prose` 的语义配色（如 `prose-slate`）并补 `dark:prose-invert`，同时针对：
  - 表格：增加更清晰的行高/内边距/分隔线、hover 与斑马纹策略，必要时为窄气泡启用横向滚动或最小宽度。
  - KaTeX：为展示公式加 `overflow-x-auto`，避免长公式溢出挤压。
  - 段落与列表：微调 `leading`/`margin`，减少“挤/散不均”。

4) 统一全站 Markdown 渲染入口
- 把仍在直接使用 `ReactMarkdown` 的页面/组件改为统一使用 `MarkdownRenderer`：
  - [QuizStep.tsx](file:///Users/fangyuan/Desktop/产品【自学系统】/app/components/LearningFlow/QuizStep.tsx)
  - [learning-history/page.tsx](file:///Users/fangyuan/Desktop/产品【自学系统】/app/learning-history/page.tsx)
  - [markdown-test/page.tsx](file:///Users/fangyuan/Desktop/产品【自学系统】/app/markdown-test/page.tsx)

5) 验证与回归
- 扩展 [markdown-test/page.tsx](file:///Users/fangyuan/Desktop/产品【自学系统】/app/markdown-test/page.tsx) 的样例与断言：加入你这段“标题粘连 + 表格粘连 + <br>”的用例，确保：
  - `###` 真变成标题（DOM 中出现 h3）。
  - `|...|` 真渲染成 table（DOM 中出现 td/th）。
  - `<br>` 真产生换行（table cell 内存在 br 或等效结构）。

## 交付物（改完你能直接感受到）
- 聊天页（[ConversationView.tsx](file:///Users/fangyuan/Desktop/产品【自学系统】/app/components/ConversationView.tsx)）里：你这段几何对比内容会按“标题/表格/列表/段落”正确排版。
- 全站渲染效果一致：学习历史、测验解析、测试页不再各自一套。

如果你确认这个方案，我会开始按以上步骤逐项修改代码并在本地跑通 `markdown-test` 页做回归。