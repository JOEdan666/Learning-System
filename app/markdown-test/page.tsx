'use client'
import React, { useEffect, useMemo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'

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
  math: `
公式: $a^2 + b^2 = c^2$\n\n
矩阵: $$\begin{bmatrix}1 & 2\\3 & 4\end{bmatrix}$$
`,
  mindmap: `
【知识导图】\n主题\n  子概念\n    方法\n    应用\n  易错点
`
}

type Result = { name: string, ok: boolean, message?: string }

export default function MarkdownTestPage() {
  const [results, setResults] = useState<Result[]>([])

  const content = useMemo(() => (
    samples.basicTable + '\n' + samples.headings + '\n' + samples.list + '\n' + samples.math + '\n' + samples.mindmap
  ), [])

  useEffect(() => {
    const rs: Result[] = []
    const tableCells = document.querySelectorAll('table td')
    rs.push({ name: '表格存在', ok: tableCells.length > 0 })
    const hasCenter = Array.from(document.querySelectorAll('table th, table td')).some(el => el.classList.contains('text-center'))
    rs.push({ name: '表格居中对齐', ok: hasCenter })
    const hasRight = Array.from(document.querySelectorAll('table th, table td')).some(el => el.classList.contains('text-right'))
    rs.push({ name: '表格右对齐', ok: hasRight })
    const h1 = document.querySelector('h1')
    rs.push({ name: '一级标题渲染', ok: !!h1 })
    const listItems = document.querySelectorAll('li')
    rs.push({ name: '列表渲染', ok: listItems.length >= 3 })
    const katexEl = document.querySelector('.katex')
    rs.push({ name: '数学公式渲染', ok: !!katexEl })
    const mindmapTitle = Array.from(document.querySelectorAll('div')).some(el => el.textContent?.includes('知识导图'))
    rs.push({ name: '知识导图渲染', ok: mindmapTitle })
    setResults(rs)
  }, [])

  const passed = results.every(r => r.ok)

  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Markdown渲染自动化测试</h1>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-xl border p-4">
          <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
            {content}
          </ReactMarkdown>
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

