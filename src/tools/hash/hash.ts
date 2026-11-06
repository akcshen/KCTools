const SHIFTS = [
  7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14,
  20, 5, 9, 14, 20, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6, 10,
  15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
]

const CONSTANTS = new Uint32Array(64)
for (let index = 0; index < 64; index += 1) {
  CONSTANTS[index] = Math.floor(Math.abs(Math.sin(index + 1)) * 2 ** 32)
}

export function md5Hex(message: Uint8Array): string {
  const bitLength = message.length * 8
  const zeroPad = (56 - ((message.length + 1) % 64) + 64) % 64
  const data = new Uint8Array(message.length + 1 + zeroPad + 8)
  data.set(message)
  data[message.length] = 0x80
  const view = new DataView(data.buffer)
  view.setUint32(data.length - 8, bitLength >>> 0, true)
  view.setUint32(data.length - 4, Math.floor(bitLength / 2 ** 32), true)

  let a0 = 0x67452301
  let b0 = 0xefcdab89
  let c0 = 0x98badcfe
  let d0 = 0x10325476

  for (let offset = 0; offset < data.length; offset += 64) {
    const words = new Uint32Array(16)
    for (let index = 0; index < 16; index += 1) {
      words[index] = view.getUint32(offset + index * 4, true)
    }
    let a = a0
    let b = b0
    let c = c0
    let d = d0
    for (let index = 0; index < 64; index += 1) {
      let value = 0
      let wordIndex = 0
      if (index < 16) {
        value = (b & c) | (~b & d)
        wordIndex = index
      } else if (index < 32) {
        value = (d & b) | (~d & c)
        wordIndex = (5 * index + 1) % 16
      } else if (index < 48) {
        value = b ^ c ^ d
        wordIndex = (3 * index + 5) % 16
      } else {
        value = c ^ (b | ~d)
        wordIndex = (7 * index) % 16
      }
      const sum = (value + a + (CONSTANTS[index] ?? 0) + (words[wordIndex] ?? 0)) >>> 0
      const shift = SHIFTS[index] ?? 0
      a = d
      d = c
      c = b
      b = (b + (((sum << shift) | (sum >>> (32 - shift))) >>> 0)) >>> 0
    }
    a0 = (a0 + a) >>> 0
    b0 = (b0 + b) >>> 0
    c0 = (c0 + c) >>> 0
    d0 = (d0 + d) >>> 0
  }

  const output = new DataView(new ArrayBuffer(16))
  output.setUint32(0, a0, true)
  output.setUint32(4, b0, true)
  output.setUint32(8, c0, true)
  output.setUint32(12, d0, true)
  return toHex(new Uint8Array(output.buffer))
}

export async function sha256Hex(message: Uint8Array): Promise<string> {
  const copy = new Uint8Array(new ArrayBuffer(message.byteLength))
  copy.set(message)
  const digest = await crypto.subtle.digest('SHA-256', copy)
  return toHex(new Uint8Array(digest))
}

export function textBytes(text: string): Uint8Array {
  return new TextEncoder().encode(text)
}

function toHex(bytes: Uint8Array): string {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}
