import { decodeBytes, decodeText, encodeText } from '../src/tools/base64/base64.ts'
import { formatJson } from '../src/tools/json-format/formatJson.ts'
import { md5Hex, sha256Hex, textBytes } from '../src/tools/hash/hash.ts'
import { countText } from '../src/tools/word-count/countText.ts'

const stats = countText('你好 world\n\n第二段')
if (stats.charsNoSpace !== 10) throw new Error(`不含空白字符数不对: ${stats.charsNoSpace}`)
if (stats.words !== 6) throw new Error(`词数不对: ${stats.words}`)
if (stats.lines !== 3) throw new Error(`行数不对: ${stats.lines}`)
if (stats.paragraphs !== 2) throw new Error(`段落数不对: ${stats.paragraphs}`)
if (countText('').lines !== 0) throw new Error('空文本行数应为 0')

const pretty = formatJson('{"b":1,"a":[2]}', 2)
if (!pretty.includes('\n')) throw new Error('格式化结果没有换行')
if (formatJson(pretty, 0) !== '{"b":1,"a":[2]}') throw new Error('压缩结果不正确')
await expectReject(Promise.resolve().then(() => formatJson('{', 2)), '无法解析')

const encoded = encodeText('你好')
if (decodeText(encoded) !== '你好') throw new Error(`Base64 往返失败: ${encoded}`)
const bytes = decodeBytes(encoded)
if (new TextDecoder().decode(bytes) !== '你好') throw new Error('Base64 字节解码失败')
await expectReject(Promise.resolve().then(() => decodeText('@@@@')), '不是有效的 Base64')

const abc = textBytes('abc')
if (md5Hex(abc) !== '900150983cd24fb0d6963f7d28e17f72') throw new Error(`MD5 不正确: ${md5Hex(abc)}`)
if (md5Hex(new Uint8Array()) !== 'd41d8cd98f00b204e9800998ecf8427e') throw new Error('空内容 MD5 不正确')
const sha = await sha256Hex(abc)
if (sha !== 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad') {
  throw new Error(`SHA-256 不正确: ${sha}`)
}

console.log('text tool checks ok')

async function expectReject(task: Promise<unknown>, snippet: string) {
  try {
    await task
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (!message.includes(snippet)) throw new Error(`错误文案不含「${snippet}」: ${message}`)
    return
  }
  throw new Error(`预期失败，但成功了: ${snippet}`)
}
