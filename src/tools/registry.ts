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
    id: 'split-pdf',
    name: '拆分 PDF',
    summary: '按页码范围把一份 PDF 拆成多个文件。',
    status: 'soon',
  },
  {
    id: 'images-to-pdf',
    name: '图片转 PDF',
    summary: '把多张图片按顺序收成一份 PDF。',
    status: 'soon',
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
