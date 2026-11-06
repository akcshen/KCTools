export type ImageFormat = 'image/jpeg' | 'image/webp' | 'image/png'

export interface CompressOptions {
  format: ImageFormat
  quality: number
  maxEdge: number
}

export interface CompressResult {
  blob: Blob
  width: number
  height: number
}

const TYPES = new Set<ImageFormat>(['image/jpeg', 'image/png', 'image/webp'])

export function isSupportedImage(file: File): boolean {
  const type = file.type.toLowerCase()
  const name = file.name.toLowerCase()
  return TYPES.has(type as ImageFormat) || /\.(jpe?g|png|webp)$/.test(name)
}

export function formatFromFile(file: File): ImageFormat {
  const type = file.type.toLowerCase()
  if (type === 'image/png' || type === 'image/webp' || type === 'image/jpeg') return type
  const name = file.name.toLowerCase()
  if (name.endsWith('.png')) return 'image/png'
  if (name.endsWith('.webp')) return 'image/webp'
  return 'image/jpeg'
}

export function outputName(name: string, format: ImageFormat): string {
  const base = name.replace(/\.[^.]+$/, '') || '图片'
  const extension = format === 'image/jpeg' ? 'jpg' : format === 'image/webp' ? 'webp' : 'png'
  return `${base}-压缩.${extension}`
}

export async function compressImage(file: File, options: CompressOptions): Promise<CompressResult> {
  if (!isSupportedImage(file)) throw new Error(`「${file.name}」不是 JPEG、PNG 或 WebP`)
  if (file.size === 0) throw new Error(`「${file.name}」是空文件`)

  const bitmap = await createImageBitmap(file)
  try {
    const sourceEdge = Math.max(bitmap.width, bitmap.height)
    const scale = options.maxEdge > 0 && sourceEdge > options.maxEdge ? options.maxEdge / sourceEdge : 1
    const width = Math.max(1, Math.round(bitmap.width * scale))
    const height = Math.max(1, Math.round(bitmap.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    if (!context) throw new Error('这台浏览器无法处理图片')
    if (options.format === 'image/jpeg') {
      context.fillStyle = '#ffffff'
      context.fillRect(0, 0, width, height)
    }
    context.drawImage(bitmap, 0, 0, width, height)
    const blob = await canvasToBlob(canvas, options.format, options.quality)
    return { blob, width, height }
  } finally {
    bitmap.close()
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, format: ImageFormat, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('压缩失败，请换一种输出格式再试'))
          return
        }
        resolve(blob)
      },
      format,
      format === 'image/png' ? undefined : quality,
    )
  })
}
