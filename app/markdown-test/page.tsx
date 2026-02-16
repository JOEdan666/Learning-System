'use client'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import MarkdownRenderer from '../components/MarkdownRenderer'

const samples = {
  basicTable: `
| 姓名 | 分数 | 备注 |
|:-----|:---:|----:|
| 张三 |  95 | 优秀 |
| 李四 |  82 | 良好 |
`,
  headings: `
# 一级标题
## 二级标题
### 三级标题
`,
  list: `
- 第一项\n- 第二项\n  - 子项A\n  - 子项B
`,
  softBreaks: `
软换行A
软换行B
软换行C
`,
  math: String.raw`
公式: $a^2 + b^2 = c^2$

矩阵: $$\begin{bmatrix}1 & 2\\3 & 4\end{bmatrix}$$
`,
  mindmap: `
【知识导图】\n主题\n  子概念\n    方法\n    应用\n  易错点
`,
  gluedHeadingAndList: `
菱形和矩形都是特殊的平行四边形。我们可以从定义、性质和判定三个方面来对比。它们都是平行四边形。### 二、性质对比
菱形对角线“垂直”。-矩形对角线“相等”。
`,
  gluedTableAndBr: `
| 图形 | 定义 |
|------|------|
| 菱形 | 四条边都相等<br>的平行四边形 |
| 矩形 | 四个角都是直角的平行四边形 |
`
}

type Result = { name: string, ok: boolean, message?: string }

export default function MarkdownTestPage() {
  const [results, setResults] = useState<Result[]>([])
  const renderRootRef = useRef<HTMLDivElement | null>(null)

  const content = useMemo(() => (
    samples.basicTable +
    '\n' + samples.headings +
    '\n' + samples.list +
    '\n' + samples.softBreaks +
    '\n' + samples.math +
    '\n' + samples.mindmap +
    '\n' + samples.gluedHeadingAndList +
    '\n' + samples.gluedTableAndBr
  ), [])

  useEffect(() => {
    let cancelled = false

    const runTests = () => {
      const root = renderRootRef.current
      if (!root) return false

      const rs: Result[] = []
      const tableCount = root.querySelectorAll('table').length
      const tdCount = root.querySelectorAll('table td').length
      rs.push({ name: `表格渲染 (table=${tableCount}, td=${tdCount})`, ok: tableCount > 0 && tdCount > 0 })

      const headingsCount = root.querySelectorAll('h1, h2, h3').length
      rs.push({ name: `标题渲染 (h=${headingsCount})`, ok: headingsCount >= 3 })

      const liCount = root.querySelectorAll('li').length
      rs.push({ name: `列表渲染 (li=${liCount})`, ok: liCount >= 3 })

      // 注意：remarkTypographyFixes 会在中英文之间添加空格，所以用 "软换行" 查找
      const softBreakParagraph = Array.from(root.querySelectorAll('p')).find(el => el.textContent?.includes('软换行'))
      const softBreakBrCount = softBreakParagraph ? softBreakParagraph.querySelectorAll('br').length : 0
      rs.push({ name: `软换行渲染 (br=${softBreakBrCount})`, ok: softBreakBrCount >= 2 })

      const katexCount = root.querySelectorAll('.katex').length
      rs.push({ name: `数学公式渲染 (katex=${katexCount})`, ok: katexCount > 0 })

      const hasMindmap = (root.textContent || '').includes('知识导图')
      rs.push({ name: '知识导图渲染', ok: hasMindmap })

      const gluedH3Ok = Array.from(root.querySelectorAll('h3')).some(el => el.textContent?.includes('二、性质对比'))
      rs.push({ name: '粘连标题修复', ok: gluedH3Ok })

      const brInTd = root.querySelectorAll('td br').length
      const brAll = root.querySelectorAll('br').length
      rs.push({ name: `<br> 换行渲染 (td br=${brInTd}, all br=${brAll})`, ok: brInTd > 0 })

      setResults(rs)
      return rs.every(r => r.ok)
    }

    const maxAttempts = 120
    let attempts = 0
    const tick = () => {
      if (cancelled) return
      attempts += 1
      const ok = runTests()
      if (ok || attempts >= maxAttempts) return
      window.setTimeout(tick, 100)
    }

    tick()
    return () => { cancelled = true }
  }, [])

  const passed = results.every(r => r.ok)

  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Markdown渲染自动化测试</h1>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-xl border p-4">
          <div ref={renderRootRef}>
            <MarkdownRenderer content={content} />
          </div>
        </div>
        <div className="rounded-xl border p-4">
          <div className="text-lg font-semibold mb-3">测试结果</div>
          <ul className="space-y-2">
            {results.map((r,i)=> (
              <li key={i} className={`flex items-center justify-between px-3 py-2 rounded border ${r.ok? 'border-green-300 bg-green-50':'border-red-300 bg-red-50'}`}>
                <span className="text-sm">{r.name}</span>
                <span className={`text-sm font-bold ${r.ok? 'text-green-700':'text-red-700'}`}>{r.ok? '通过':'失败'}</span>
              </li>
            ))}
          </ul>
          <div className={`mt-4 p-3 rounded ${passed? 'bg-green-100 text-green-800':'bg-yellow-100 text-yellow-800'}`}>
            总体：{passed? '全部通过':'存在失败项'}
          </div>
        </div>
      </div>
    </main>
  )
}
