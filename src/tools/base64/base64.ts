export function encodeText(text: string): string {
  return bytesToBase64(new TextEncoder().encode(text))
}

export function decodeText(value: string): string {
  const bytes = decodeBytes(value)
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  } catch {
    throw new Error('这段 Base64 不是 UTF-8 文本。可以改用「解码为文件」下载。')
  }
}

export function encodeBytes(bytes: Uint8Array): string {
  return bytesToBase64(bytes)
}

export function decodeBytes(value: string): Uint8Array {
  const cleaned = value.replace(/\s/g, '')
  if (!cleaned) throw new Error('请先输入 Base64')
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(cleaned) || cleaned.length % 4 === 1) {
    throw new Error('不是有效的 Base64')
  }
  const padded = cleaned.padEnd(cleaned.length + ((4 - (cleaned.length % 4)) % 4), '=')
  let binary: string
  try {
    binary = atob(padded)
  } catch {
    throw new Error('不是有效的 Base64')
  }
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)
  return bytes
}

function bytesToBase64(bytes: Uint8Array): string {
  const chunkSize = 0x8000
  let binary = ''
  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize)
    binary += String.fromCharCode(...chunk)
  }
  return btoa(binary)
}
