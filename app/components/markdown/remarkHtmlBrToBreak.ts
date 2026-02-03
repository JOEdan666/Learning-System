import type { Plugin } from 'unified'
import type { Root } from 'mdast'

const BR_TEST = /<br\s*\/?>/i
const BR_SPLIT = /<br\s*\/?>/gi

const isOnlyBrHtml = (value: string) => /^\s*<br\s*\/?>\s*$/i.test(value)

const containsBr = (value: string) => BR_TEST.test(value)

const splitTextWithBr = (value: string) => {
  if (!containsBr(value)) return null
  const parts = value.split(BR_SPLIT)
  if (parts.length <= 1) return null

  const nodes: any[] = []
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]
    if (part) nodes.push({ type: 'text', value: part })
    if (i !== parts.length - 1) nodes.push({ type: 'break' })
  }
  return nodes
}

const splitHtmlWithBrIntoTextNodes = (value: string) => {
  if (!containsBr(value)) return null
  const withoutBr = value.replace(BR_SPLIT, '')
  if (/[<>]/.test(withoutBr)) return null
  return splitTextWithBr(value)
}

const remarkHtmlBrToBreak: Plugin<[], Root> = () => {
  return (tree: any) => {
    const walk = (node: any) => {
      if (!node) return

      const children = node.children
      if (!Array.isArray(children)) return

      for (let i = 0; i < children.length; i++) {
        const child = children[i]
        if (child?.type === 'html' && typeof child.value === 'string' && isOnlyBrHtml(child.value)) {
          children[i] = { type: 'break' }
          continue
        }
        if (child?.type === 'html' && typeof child.value === 'string') {
          const nodes = splitHtmlWithBrIntoTextNodes(child.value)
          if (nodes) {
            children.splice(i, 1, ...nodes)
            i += nodes.length - 1
            continue
          }
        }
        if (child?.type === 'text' && typeof child.value === 'string') {
          const nodes = splitTextWithBr(child.value)
          if (nodes) {
            children.splice(i, 1, ...nodes)
            i += nodes.length - 1
            continue
          }
        }
        walk(child)
      }
    }

    walk(tree)
  }
}

export default remarkHtmlBrToBreak
