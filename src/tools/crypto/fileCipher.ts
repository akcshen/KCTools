const MAGIC = new Uint8Array([0x4b, 0x43, 0x54, 0x31])
const VERSION = 1
const SALT_BYTES = 16
const IV_BYTES = 12
const HEADER_BYTES = 4 + 1 + 1 + 4 + SALT_BYTES + IV_BYTES
const ITERATIONS = 150_000
const MAX_ITERATIONS = 600_000

export class CipherError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CipherError'
  }
}

export interface CipherMeta {
  name: string
  mime: string
}

export function encryptedFileName(name: string): string {
  const base = name.trim() || '未命名文件'
  return base.toLowerCase().endsWith('.kct') ? base : `${base}.kct`
}

export async function encryptBytes(
  input: Uint8Array,
  password: string,
  meta: CipherMeta,
): Promise<Uint8Array> {
  assertPassword(password)
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES))
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES))
  const key = await deriveKey(password, salt, ITERATIONS, ['encrypt'])
  const plaintext = encodePayload(input, meta)
  const cipher = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv: bytesCopy(iv) }, key, bytesCopy(plaintext)),
  )

  const header = new Uint8Array(HEADER_BYTES)
  const view = new DataView(header.buffer)
  header.set(MAGIC, 0)
  header[4] = VERSION
  header[5] = 0
  view.setUint32(6, ITERATIONS, false)
  header.set(salt, 10)
  header.set(iv, 26)
  return concat(header, cipher)
}

export async function decryptBytes(
  input: Uint8Array,
  password: string,
): Promise<{ bytes: Uint8Array; name: string; mime: string }> {
  assertPassword(password)
  if (input.byteLength < HEADER_BYTES + 16 || !startsWithMagic(input)) {
    throw new CipherError('这不是 KCTools 加密文件。请使用「加密文件」下载的 .kct 文件。')
  }
  if (input[4] !== VERSION) {
    throw new CipherError('无法识别这个加密文件的版本。')
  }

  const view = new DataView(input.buffer, input.byteOffset, input.byteLength)
  const iterations = view.getUint32(6, false)
  if (iterations < 1 || iterations > MAX_ITERATIONS) {
    throw new CipherError('这个加密文件的参数不受支持。')
  }

  const salt = input.slice(10, 26)
  const iv = input.slice(26, 38)
  const cipher = input.slice(38)
  const key = await deriveKey(password, salt, iterations, ['decrypt'])

  let plain: Uint8Array
  try {
    plain = new Uint8Array(
      await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytesCopy(iv) }, key, bytesCopy(cipher)),
    )
  } catch {
    throw new CipherError('密码不正确，或文件已损坏。')
  }

  return decodePayload(plain)
}

export async function encryptFile(file: File, password: string): Promise<Uint8Array> {
  if (file.size === 0) throw new CipherError(`「${file.name || '未命名文件'}」是空文件`)
  const bytes = new Uint8Array(await file.arrayBuffer())
  return encryptBytes(bytes, password, {
    name: file.name || '未命名文件',
    mime: file.type || 'application/octet-stream',
  })
}

export async function decryptFile(
  file: File,
  password: string,
): Promise<{ bytes: Uint8Array; name: string; mime: string }> {
  if (file.size === 0) throw new CipherError(`「${file.name || '未命名文件'}」是空文件`)
  return decryptBytes(new Uint8Array(await file.arrayBuffer()), password)
}

function assertPassword(password: string) {
  if (password.length === 0) throw new CipherError('请输入密码')
}

async function deriveKey(
  password: string,
  salt: Uint8Array,
  iterations: number,
  usages: KeyUsage[],
): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveKey'],
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: bytesCopy(salt), iterations, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    usages,
  )
}

function encodePayload(input: Uint8Array, meta: CipherMeta): Uint8Array {
  const json = new TextEncoder().encode(
    JSON.stringify({
      name: (meta.name || '未命名文件').slice(0, 180),
      mime: (meta.mime || 'application/octet-stream').slice(0, 120),
    }),
  )
  const length = new Uint8Array(4)
  new DataView(length.buffer).setUint32(0, json.byteLength, false)
  return concat(length, json, input)
}

function decodePayload(plain: Uint8Array): { bytes: Uint8Array; name: string; mime: string } {
  if (plain.byteLength < 4) throw new CipherError('文件已损坏。')
  const jsonLength = new DataView(plain.buffer, plain.byteOffset, 4).getUint32(0, false)
  if (jsonLength < 2 || 4 + jsonLength > plain.byteLength) throw new CipherError('文件已损坏。')
  let meta: { name?: unknown; mime?: unknown }
  try {
    meta = JSON.parse(new TextDecoder().decode(plain.slice(4, 4 + jsonLength))) as {
      name?: unknown
      mime?: unknown
    }
  } catch {
    throw new CipherError('文件已损坏。')
  }
  const name = typeof meta.name === 'string' && meta.name.trim() ? meta.name : '未命名文件'
  const mime = typeof meta.mime === 'string' && meta.mime.trim() ? meta.mime : 'application/octet-stream'
  return { bytes: plain.slice(4 + jsonLength), name, mime }
}

function startsWithMagic(input: Uint8Array): boolean {
  return MAGIC.every((byte, index) => input[index] === byte)
}

function bytesCopy(bytes: Uint8Array): Uint8Array<ArrayBuffer> {
  const copy = new Uint8Array(new ArrayBuffer(bytes.byteLength))
  copy.set(bytes)
  return copy
}

function concat(...parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((sum, part) => sum + part.byteLength, 0)
  const out = new Uint8Array(total)
  let offset = 0
  for (const part of parts) {
    out.set(part, offset)
    offset += part.byteLength
  }
  return out
}
