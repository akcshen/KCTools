import { PDFDocument } from 'pdf-lib'

export class PdfToolError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PdfToolError'
  }
}

export interface PdfSource {
  name: string
  data: ArrayBuffer
}

export function isPdfFile(file: File): boolean {
  const name = file.name.trim().toLowerCase()
  const type = file.type.toLowerCase()
  return type === 'application/pdf' || name.endsWith('.pdf')
}

export async function readPdf(file: File): Promise<{ data: ArrayBuffer; pageCount: number }> {
  if (!isPdfFile(file)) {
    throw new PdfToolError(`「${file.name}」不是 PDF 文件`)
  }
  if (file.size === 0) {
    throw new PdfToolError(`「${file.name}」是空文件`)
  }

  const data = await file.arrayBuffer()
  const doc = await openPdf(file.name, data)
  const pageCount = doc.getPageCount()
  if (pageCount === 0) {
    throw new PdfToolError(`「${file.name}」没有可合并的页面`)
  }

  return { data, pageCount }
}

export async function mergePdfBuffers(
  sources: PdfSource[],
): Promise<{ bytes: Uint8Array; pageCount: number }> {
  if (sources.length === 0) {
    throw new PdfToolError('请先添加 PDF 文件')
  }

  const merged = await PDFDocument.create()
  let pageCount = 0

  for (const source of sources) {
    const doc = await openPdf(source.name, source.data)
    const indices = doc.getPageIndices()
    if (indices.length === 0) {
      throw new PdfToolError(`「${source.name}」没有可合并的页面`)
    }

    const pages = await merged.copyPages(doc, indices)
    for (const page of pages) merged.addPage(page)
    pageCount += indices.length
  }

  merged.setTitle('合并 PDF')
  merged.setProducer('KCTools')
  merged.setCreator('KCTools')

  const bytes = await merged.save()
  return { bytes, pageCount }
}

export function formatBytes(size: number): string {
  if (!Number.isFinite(size) || size < 0) return '—'
  if (size < 1024) return `${Math.round(size)} B`
  const kb = size / 1024
  if (kb < 1024) return `${trimNumber(kb)} KB`
  const mb = kb / 1024
  if (mb < 1024) return `${trimNumber(mb)} MB`
  return `${trimNumber(mb / 1024)} GB`
}

export function pdfBytesToBlob(bytes: Uint8Array): Blob {
  const copy = new Uint8Array(bytes.byteLength)
  copy.set(bytes)
  return new Blob([copy], { type: 'application/pdf' })
}

export function mergedFileName(date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, '0')
  const stamp = [
    `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`,
    `${pad(date.getHours())}${pad(date.getMinutes())}`,
  ].join('-')
  return `合并-${stamp}.pdf`
}

async function openPdf(name: string, data: ArrayBuffer): Promise<PDFDocument> {
  if (data.byteLength === 0) {
    throw new PdfToolError(`「${name}」是空文件`)
  }

  try {
    return await PDFDocument.load(data.slice(0), { ignoreEncryption: false })
  } catch (error) {
    const message = error instanceof Error ? error.message : ''
    if (/encrypt/i.test(message)) {
      throw new PdfToolError(`「${name}」已加密，暂不支持合并`)
    }
    throw new PdfToolError(`「${name}」无法读取，文件可能已损坏`)
  }
}

function trimNumber(value: number): string {
  return value >= 10 ? value.toFixed(0) : value.toFixed(1)
}
