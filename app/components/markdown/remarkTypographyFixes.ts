import type { Plugin } from 'unified'
import type { Root } from 'mdast'

const SKIP_PARENT_TYPES = new Set([
  'code',
  'inlineCode',
  'math',
  'inlineMath',
  'link',
  'definition'
])

const fixCjkAsciiSpacing = (value: string) => {
  return value
    .replace(/([\u4e00-\u9fa5])([A-Za-z0-9])/g, '$1 $2')
    .replace(/([A-Za-z0-9])([\u4e00-\u9fa5])/g, '$1 $2')
}

const remarkTypographyFixes: Plugin<[], Root> = () => {
  return (tree: any) => {
    const walk = (node: any, parentType?: string) => {
      if (!node) return

      if (node.type === 'text' && typeof node.value === 'string') {
        if (!parentType || !SKIP_PARENT_TYPES.has(parentType)) {
          node.value = fixCjkAsciiSpacing(node.value)
        }
      }

      const children = node.children
      if (Array.isArray(children)) {
        for (const child of children) {
          walk(child, node.type)
        }
      }
    }

    walk(tree, undefined)
  }
}

export default remarkTypographyFixes
