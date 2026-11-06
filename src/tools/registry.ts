import type { Component } from 'vue'
import type { RouteRecordRaw } from 'vue-router'

export type ToolStatus = 'ready' | 'soon'

export const categories = [
  { id: 'pdf', label: 'PDF' },
  { id: 'security', label: '安全' },
  { id: 'image', label: '图片' },
  { id: 'text', label: '文本' },
] as const

export type CategoryId = (typeof categories)[number]['id']

export interface ToolDefinition {
  id: string
  name: string
  summary: string
  category: CategoryId
  status: ToolStatus
  /** 可用工具的路径。即将推出的工具先不填。 */
  path?: string
  load?: () => Promise<{ default: Component }>
}

/**
 * 工具登记表。
 * 新增可用工具时在这里追加一项，并提供 category、path 与页面加载函数。
 * 首页按分类展示，路由也从这份列表生成。
 */
export const tools: ToolDefinition[] = [
  {
    id: 'merge-pdf',
    name: '合并 PDF',
    summary: '按你排好的顺序，把多份 PDF 合成一份，然后下载。',
    category: 'pdf',
    status: 'ready',
    path: '/tools/merge-pdf',
    load: () => import('@/tools/merge-pdf/MergePdfView.vue'),
  },
  {
    id: 'encrypt',
    name: '加密文件',
    summary: '用密码把任意文件锁成 .kct，只在这台浏览器里完成。',
    category: 'security',
    status: 'ready',
    path: '/tools/encrypt',
    load: () => import('@/tools/crypto/EncryptView.vue'),
  },
  {
    id: 'decrypt',
    name: '解密文件',
    summary: '用同一条密码解开 KCTools 生成的 .kct 文件。',
    category: 'security',
    status: 'ready',
    path: '/tools/decrypt',
    load: () => import('@/tools/crypto/DecryptView.vue'),
  },
  {
    id: 'hash',
    name: '哈希校验',
    summary: '计算文本或文件的 MD5 和 SHA-256。',
    category: 'security',
    status: 'ready',
    path: '/tools/hash',
    load: () => import('@/tools/hash/HashView.vue'),
  },
  {
    id: 'compress-image',
    name: '压缩图片',
    summary: '调整质量和尺寸，缩小 JPEG、PNG 或 WebP。',
    category: 'image',
    status: 'ready',
    path: '/tools/compress-image',
    load: () => import('@/tools/compress-image/CompressImageView.vue'),
  },
  {
    id: 'diff',
    name: '文本对比',
    summary: '并排或按统一格式查看两段文本的差异。',
    category: 'text',
    status: 'ready',
    path: '/tools/diff',
    load: () => import('@/tools/diff-text/DiffTextView.vue'),
  },
  {
    id: 'word-count',
    name: '字数统计',
    summary: '统计字符、词、行和段落。',
    category: 'text',
    status: 'ready',
    path: '/tools/word-count',
    load: () => import('@/tools/word-count/WordCountView.vue'),
  },
  {
    id: 'json-format',
    name: 'JSON 格式化',
    summary: '把 JSON 排版或压成一行，并指出语法错误。',
    category: 'text',
    status: 'ready',
    path: '/tools/json-format',
    load: () => import('@/tools/json-format/JsonFormatView.vue'),
  },
  {
    id: 'base64',
    name: 'Base64',
    summary: '按 UTF-8 编码或解码文本，也可以处理文件。',
    category: 'text',
    status: 'ready',
    path: '/tools/base64',
    load: () => import('@/tools/base64/Base64View.vue'),
  },
]

export function buildToolRoutes(): RouteRecordRaw[] {
  const routes: RouteRecordRaw[] = []

  for (const tool of tools) {
    if (tool.status !== 'ready' || !tool.path || !tool.load) continue

    routes.push({
      path: tool.path,
      name: tool.id,
      component: tool.load,
      meta: { title: tool.name },
    })
  }

  return routes
}
