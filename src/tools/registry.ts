import type { Component } from 'vue'
import type { RouteRecordRaw } from 'vue-router'

export type ToolStatus = 'ready' | 'soon'

export interface ToolDefinition {
  id: string
  name: string
  summary: string
  status: ToolStatus
  /** 可用工具的路径。即将推出的工具先不填。 */
  path?: string
  load?: () => Promise<{ default: Component }>
}

/**
 * 工具登记表。
 * 新增可用工具时在这里追加一项，并提供 path 与页面加载函数。
 * 首页卡片和路由都从这份列表生成。
 */
export const tools: ToolDefinition[] = [
  {
    id: 'merge-pdf',
    name: '合并 PDF',
    summary: '按你排好的顺序，把多份 PDF 合成一份，然后下载。',
    status: 'ready',
    path: '/tools/merge-pdf',
    load: () => import('@/tools/merge-pdf/MergePdfView.vue'),
  },
  {
    id: 'encrypt',
    name: '加密文件',
    summary: '用密码把任意文件锁成 .kct，只在这台浏览器里完成。',
    status: 'ready',
    path: '/tools/encrypt',
    load: () => import('@/tools/crypto/EncryptView.vue'),
  },
  {
    id: 'decrypt',
    name: '解密文件',
    summary: '用同一条密码解开 KCTools 生成的 .kct 文件。',
    status: 'ready',
    path: '/tools/decrypt',
    load: () => import('@/tools/crypto/DecryptView.vue'),
  },
  {
    id: 'diff',
    name: '文本对比',
    summary: '并排或按统一格式查看两段文本的差异。',
    status: 'ready',
    path: '/tools/diff',
    load: () => import('@/tools/diff-text/DiffTextView.vue'),
  },
  {
    id: 'compress-image',
    name: '压缩图片',
    summary: '调整质量和尺寸，缩小 JPEG、PNG 或 WebP。',
    status: 'ready',
    path: '/tools/compress-image',
    load: () => import('@/tools/compress-image/CompressImageView.vue'),
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
