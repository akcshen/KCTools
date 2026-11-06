export interface TextStats {
  chars: number
  charsNoSpace: number
  words: number
  lines: number
  paragraphs: number
}

const CJK = /\p{Script=Han}|\p{Script=Hiragana}|\p{Script=Katakana}|\p{Script=Hangul}/gu
const WHITESPACE = /[\s\u3000\uFEFF]/gu

export function countText(text: string): TextStats {
  const chars = Array.from(text).length
  const charsNoSpace = Array.from(text.replace(WHITESPACE, '')).length
  const lines = text.length === 0 ? 0 : text.split(/\r\n|\r|\n/).length
  const paragraphs = text
    .split(/\r?\n\s*\r?\n/)
    .map((part) => part.trim())
    .filter(Boolean).length
  return {
    chars,
    charsNoSpace,
    words: countWords(text),
    lines,
    paragraphs,
  }
}

export async function readPlainText(file: File): Promise<string> {
  if (file.size === 0) throw new Error(`「${file.name || '未命名文件'}」是空文件`)
  if (file.size > 1_500_000) throw new Error(`「${file.name}」太大，请换成 1.5 MB 以内的文本`)
  const text = await file.text()
  if (text.includes('\u0000')) throw new Error(`「${file.name}」不像文本文件`)
  return text
}

function countWords(text: string): number {
  const cjk = text.match(CJK)?.length ?? 0
  const rest = text.replace(CJK, ' ').trim()
  const tokens = rest ? rest.split(/\s+/).filter(Boolean).length : 0
  return cjk + tokens
}
