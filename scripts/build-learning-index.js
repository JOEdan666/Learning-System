#!/usr/bin/env node
/**
 * 预处理本地“学习文件”并生成 data/learning-index.json
 * - 支持：pdf、docx、txt、xlsx、pptx（提取幻灯片文本）
 * - 不支持的格式会被跳过（如 jpg/png 需 OCR，可按需扩展）
 * 运行：node scripts/build-learning-index.js
 */

const fs = require('fs')
const path = require('path')
const mammoth = require('mammoth')
const XLSX = require('xlsx')
const JSZip = require('jszip')
const pdfjsLibPromise = import('pdfjs-dist/legacy/build/pdf.mjs')

const INPUT_DIR = path.join(process.cwd(), '学习文件')
const OUTPUT = path.join(process.cwd(), 'data', 'learning-index.json')
const CHUNK_SIZE = 500

const supportExt = ['.pdf', '.docx', '.txt', '.xlsx', '.pptx']

function chunkText(text) {
  const clean = text.replace(/\s+/g, ' ').trim()
  const chunks = []
  for (let i = 0; i < clean.length; i += CHUNK_SIZE) {
    chunks.push(clean.slice(i, i + CHUNK_SIZE))
  }
  return chunks
}

async function extractPdf(filePath) {
  const pdfjsLib = await pdfjsLibPromise
  const data = new Uint8Array(fs.readFileSync(filePath))
  const pdf = await pdfjsLib.getDocument({ data }).promise
  let text = ''
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    text += content.items.map((it) => it.str).join(' ') + '\n'
  }
  return text
}

async function extractDocx(filePath) {
  const buffer = fs.readFileSync(filePath)
  const result = await mammoth.extractRawText({ buffer })
  return result.value || ''
}

async function extractTxt(filePath) {
  return fs.readFileSync(filePath, 'utf-8')
}

async function extractXlsx(filePath) {
  const workbook = XLSX.readFile(filePath)
  const texts = []
  workbook.SheetNames.forEach((name) => {
    const sheet = workbook.Sheets[name]
    const json = XLSX.utils.sheet_to_json(sheet, { header: 1 })
    json.forEach((row) => {
      const line = row.filter(Boolean).join(' ')
      if (line) texts.push(line)
    })
  })
  return texts.join('\n')
}

async function extractPptx(filePath) {
  const buf = fs.readFileSync(filePath)
  const zip = await JSZip.loadAsync(buf)
  const slideKeys = Object.keys(zip.files)
    .filter((k) => k.startsWith('ppt/slides/slide') && k.endsWith('.xml'))
    .sort()
  const parts = []
  for (const key of slideKeys) {
    const xml = await zip.files[key].async('text')
    // 提取文本并去掉标签
    const text = xml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    if (text) parts.push(text)
  }
  return parts.join('\n')
}

async function extract(filePath) {
  const ext = path.extname(filePath).toLowerCase()
  if (ext === '.pdf') return extractPdf(filePath)
  if (ext === '.docx') return extractDocx(filePath)
  if (ext === '.txt') return extractTxt(filePath)
  if (ext === '.xlsx') return extractXlsx(filePath)
  if (ext === '.pptx') return extractPptx(filePath)
  return ''
}

async function main() {
  if (!fs.existsSync(INPUT_DIR)) {
    console.error(`未找到目录: ${INPUT_DIR}`)
    process.exit(1)
  }
  const entries = fs.readdirSync(INPUT_DIR)
  const index = []

  for (const name of entries) {
    const filePath = path.join(INPUT_DIR, name)
    const stat = fs.statSync(filePath)
    if (stat.isDirectory()) continue
    const ext = path.extname(name).toLowerCase()
    if (!supportExt.includes(ext)) {
      console.warn(`跳过不支持的格式: ${name}`)
      continue
    }
    console.log(`处理: ${name}`)
    try {
      const text = await extract(filePath)
      const chunks = chunkText(text)
      chunks.forEach((chunk, idx) => {
        index.push({
          id: `${name}-${idx}`,
          file: name,
          position: idx + 1,
          content: chunk
        })
      })
    } catch (e) {
      console.error(`处理失败 ${name}:`, e.message)
    }
  }

  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true })
  fs.writeFileSync(OUTPUT, JSON.stringify(index, null, 2), 'utf-8')
  console.log(`完成，生成 ${index.length} 条片段 -> ${OUTPUT}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
