import { diffLines } from 'diff'

export interface SideRow {
  kind: 'same' | 'add' | 'del' | 'change'
  left: string
  right: string
}

export interface UnifiedLine {
  kind: 'same' | 'add' | 'del'
  text: string
}

export interface TextDiff {
  rows: SideRow[]
  unified: UnifiedLine[]
  added: number
  removed: number
  same: boolean
}

const MAX_TEXT_BYTES = 1_500_000

export async function readTextFile(file: File): Promise<string> {
  if (file.size === 0) throw new Error(`「${file.name || '未命名文件'}」是空文件`)
  if (file.size > MAX_TEXT_BYTES) {
    throw new Error(`「${file.name}」太大，请换成 1.5 MB 以内的文本`)
  }
  const text = await file.text()
  if (text.includes('\u0000')) throw new Error(`「${file.name}」不像文本文件`)
  return text
}

export function buildDiff(left: string, right: string): TextDiff {
  const changes = diffLines(left, right)
  const rows: SideRow[] = []
  const unified: UnifiedLine[] = []
  let pending: string[] = []
  let added = 0
  let removed = 0

  const flushPending = () => {
    for (const line of pending) rows.push({ kind: 'del', left: line, right: '' })
    pending = []
  }

  for (const change of changes) {
    const lines = splitLines(change.value)
    if (change.removed) {
      removed += lines.length
      pending.push(...lines)
      for (const line of lines) unified.push({ kind: 'del', text: `-${line}` })
      continue
    }
    if (change.added) {
      added += lines.length
      const paired = Math.min(pending.length, lines.length)
      for (let index = 0; index < paired; index += 1) {
        rows.push({ kind: 'change', left: pending[index] ?? '', right: lines[index] ?? '' })
      }
      for (let index = paired; index < pending.length; index += 1) {
        rows.push({ kind: 'del', left: pending[index] ?? '', right: '' })
      }
      for (let index = paired; index < lines.length; index += 1) {
        rows.push({ kind: 'add', left: '', right: lines[index] ?? '' })
      }
      pending = []
      for (const line of lines) unified.push({ kind: 'add', text: `+${line}` })
      continue
    }
    flushPending()
    for (const line of lines) {
      rows.push({ kind: 'same', left: line, right: line })
      unified.push({ kind: 'same', text: ` ${line}` })
    }
  }
  flushPending()

  return {
    rows,
    unified,
    added,
    removed,
    same: added === 0 && removed === 0,
  }
}

function splitLines(value: string): string[] {
  if (value === '') return []
  const parts = value.split('\n')
  if (parts[parts.length - 1] === '') parts.pop()
  return parts
}
