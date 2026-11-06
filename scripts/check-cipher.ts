import { decryptBytes, encryptBytes, encryptedFileName } from '../src/tools/crypto/fileCipher.ts'
import { buildDiff } from '../src/tools/diff-text/diffText.ts'

const plain = new TextEncoder().encode('你好 KCTools')
const packed = await encryptBytes(plain, 'secret-pass', { name: '笔记.txt', mime: 'text/plain' })
const opened = await decryptBytes(packed, 'secret-pass')
const text = new TextDecoder().decode(opened.bytes)
if (text !== '你好 KCTools' || opened.name !== '笔记.txt' || opened.mime !== 'text/plain') {
  throw new Error(`解密结果不正确: ${text} ${opened.name} ${opened.mime}`)
}
if (encryptedFileName('笔记.txt') !== '笔记.txt.kct') throw new Error('加密文件名不正确')
if (!packed.subarray(0, 4).every((byte, index) => byte === [0x4b, 0x43, 0x54, 0x31][index])) {
  throw new Error('缺少 KCT1 文件头')
}

await expectReject(decryptBytes(packed, 'wrong-pass'), '密码不正确')
await expectReject(decryptBytes(new Uint8Array([1, 2, 3, 4]), 'secret-pass'), '不是 KCTools')
await expectReject(encryptBytes(plain, '', { name: 'a.txt', mime: 'text/plain' }), '请输入密码')

const diff = buildDiff('a\nb\n', 'a\nc\n')
if (diff.same || diff.removed !== 1 || diff.added !== 1) {
  throw new Error(`对比结果不正确: +${diff.added} -${diff.removed}`)
}
const same = buildDiff('相同\n', '相同\n')
if (!same.same) throw new Error('相同文本应判定为无差异')

console.log(`cipher and diff checks ok (${packed.byteLength} encrypted bytes)`)

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
