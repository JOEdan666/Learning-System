## 导航与主页
- 在 `app/layout.tsx` 的导航中新增 `主页` 链接：指向 `/`，与现有“学习记录/知识库/统一对话”并列。
- 主页轻量化：移除全局 `bg-astronaut` 背景；主页使用 `bg-white`/`bg-slate-50` 普通背景。

## 分页背景管理
- 在 `app/globals.css` 增加 `.bg-learn`（仿照现有 `.bg-astronaut`）但背景图为 `/learn.jpg`。
- 在页面层面启用背景：
  - `app/learning-history/page.tsx` 与 `app/knowledge-base/page.tsx` 中通过 `useEffect` 切换 `document.body` 的 `bg-learn` 类（进入时添加，卸载时移除），确保仅这两页显示学习主题背景。
- 同时在 `app/layout.tsx` 将 `body` 的默认类从 `bg-astronaut` 改为普通背景，避免主页背景图。

## Markdown 渲染恢复
- 学习记录：
  - 在 `app/learning-history/page.tsx` 将 `session.aiExplanation` 的展示改用 `react-markdown` 渲染，启用 `remark-gfm`、`remark-math`、`rehype-katex`，保留段落、标题、列表、表格与 LaTeX 公式渲染。
  - 列表卡片的摘要仍裁剪，但改为从渲染后的纯文本生成预览，避免 Markdown 语法裸露。
- AI对话：
  - 在 `app/components/ConversationView.tsx` 用 `react-markdown` 渲染 `message.content`，同样启用 `remark-gfm`、`remark-math`、`rehype-katex`，用户与助手消息都支持 Markdown/公式。
  - 在 `app/layout.tsx` 全局引入 `katex/dist/katex.min.css` 以保证公式样式。

## 资源文件
- 向 `public/learn.jpg` 添加新背景图片（用于学习历史与知识库）。

## 验证步骤
- 启动开发服务器后，检查：
  - 顶部导航含 `主页` 并可返回 `/`；主页背景为普通白/浅灰。
  - `/learning-history` 与 `/knowledge-base` 的页面显示 `learn.jpg` 背景；返回主页后背景移除。
  - 学习记录详情与对话消息的 Markdown（标题、列表、表格）及 LaTeX 公式正确渲染。
  - 无控制台/样式报错。

如确认，上述改动将按此方案实施。