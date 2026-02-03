## 现象与结论
- 现在表格已恢复解析（说明 `|:---|` 分隔行不再被预处理破坏）。
- 但 `<br> 换行渲染 (td br=0, all br=1)` 仍失败，代表页面确实出现了一个 `<br>`，但它没有落在 `td` 里面。

## 根因定位
- 当前 `remarkHtmlBrToBreak` 的实现有一个稳定性 bug：
  - 使用了全局正则 `/<br\s*\/?>/gi` 并用 `BR_RE.test(value)` 做判断。
  - 全局正则的 `test()` 会推进 `lastIndex`，导致同一个正则在多次调用时“时而命中、时而不命中”，从而漏拆某些文本节点里的 `<br />`。
  - 代码位置：[remarkHtmlBrToBreak.ts](file:///Users/fangyuan/Desktop/%E4%BA%A7%E5%93%81%E3%80%90%E8%87%AA%E5%AD%A6%E7%B3%BB%E7%BB%9F%E3%80%91/app/components/markdown/remarkHtmlBrToBreak.ts#L4-L20)
- 另外一个可能情况：在表格单元格里，`<br />` 有时会被 parser 产出为 `html` 节点且包含前后文本（不是“纯 `<br>`”节点）。目前代码只处理“纯 `<br>` 的 html 节点”，这种情况也会漏掉。

## 实施改动
1) 修复全局正则 `test()` 的 lastIndex 问题
- 将判断用的正则改成非全局版本（例如 `const BR_TEST = /<br\s*\/?>/i`），split 用 `BR_SPLIT = /<br\s*\/?>/gi`。
- 或者每次 `test` 前重置 `BR_RE.lastIndex = 0`（更不推荐）。

2) 支持拆分“包含 `<br>` 的 html 节点”
- 当 `child.type === 'html'` 且 `child.value` 中包含 `<br>`，并且去掉 `<br>` 后不再含其它 HTML 标签（避免误处理复杂 HTML），则将该 `html` 节点拆成 `text + break + text` 的 mdast 序列。
- 保留原逻辑：纯 `<br>` 的 html 节点直接替换为 `{ type: 'break' }`。

## 验证方式
- 打开 `markdown-test`：
  - 预期：`<br> 换行渲染 (td br>0, all br>0)` 通过
  - 同时确保：`表格渲染` 仍通过。
- 若仍失败，我会在测试页临时把表格单元格内容改成更“强制触发”形式（例如同时包含 `<br>` 与普通换行），以确认 AST 形态（text/html）并再补一条兼容分支。