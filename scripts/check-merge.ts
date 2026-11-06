import { PDFDocument } from 'pdf-lib'
import { isPdfFile, mergePdfBuffers, readPdf } from '../src/tools/merge-pdf/mergePdfs.ts'

const first = await PDFDocument.create()
first.addPage([200, 220])
const firstBytes = await first.save()

const second = await PDFDocument.create()
second.addPage([320, 400])
second.addPage([340, 420])
const secondBytes = await second.save()

const firstFile = new File([toBlobPart(firstBytes)], '封面.PDF', { type: '' })
const secondFile = new File([toBlobPart(secondBytes)], '正文.pdf', { type: 'application/pdf' })
const notes = new File(['hello'], '备注.txt', { type: 'text/plain' })
const broken = new File([Uint8Array.from([1, 2, 3, 4])], '损坏.pdf', { type: 'application/pdf' })
const empty = new File([Uint8Array.from([])], '空.pdf', { type: 'application/pdf' })

if (!isPdfFile(firstFile) || !isPdfFile(secondFile) || isPdfFile(notes)) {
  throw new Error('isPdfFile 判断不正确')
}

const loadedFirst = await readPdf(firstFile)
const loadedSecond = await readPdf(secondFile)
if (loadedFirst.pageCount !== 1 || loadedSecond.pageCount !== 2) {
  throw new Error(`页数不正确: ${loadedFirst.pageCount}, ${loadedSecond.pageCount}`)
}

await expectReject(readPdf(broken), '无法读取')
await expectReject(readPdf(empty), '空文件')

const noPages = new TextEncoder().encode(`%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Count 0 /Kids [] >>
endobj
trailer
<< /Root 1 0 R >>
%%EOF
`)
const emptyPdf = new File([noPages], '无页面.pdf', { type: 'application/pdf' })
await expectReject(readPdf(emptyPdf), '没有可合并的页面')

const merged = await mergePdfBuffers([
  { name: secondFile.name, data: loadedSecond.data },
  { name: firstFile.name, data: loadedFirst.data },
])
if (merged.pageCount !== 3) throw new Error(`合并页数不正确: ${merged.pageCount}`)

const header = new TextDecoder().decode(merged.bytes.slice(0, 5))
if (header !== '%PDF-') throw new Error(`结果不是 PDF: ${header}`)

const output = await PDFDocument.load(merged.bytes)
const pages = output.getPages()
expectSize(pages[0], 320, 400)
expectSize(pages[1], 340, 420)
expectSize(pages[2], 200, 220)

await expectReject(mergePdfBuffers([]), '请先添加 PDF 文件')

console.log(`merge checks ok (${merged.bytes.byteLength} bytes, ${merged.pageCount} pages)`)

function toBlobPart(bytes: Uint8Array): Uint8Array {
  return Uint8Array.from(bytes)
}

function expectSize(
  page: ReturnType<PDFDocument['getPages']>[number] | undefined,
  width: number,
  height: number,
) {
  if (!page) throw new Error('缺少页面')
  if (page.getWidth() !== width || page.getHeight() !== height) {
    throw new Error(`页面尺寸不正确: ${page.getWidth()} x ${page.getHeight()}`)
  }
}

async function expectReject(task: Promise<unknown>, snippet: string) {
  try {
    await task
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (!message.includes(snippet)) {
      throw new Error(`错误文案不含「${snippet}」: ${message}`)
    }
    return
  }
  throw new Error(`预期失败，但成功了: ${snippet}`)
}
