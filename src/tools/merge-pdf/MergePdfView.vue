<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { RouterLink } from 'vue-router'
import {
  formatBytes,
  isPdfFile,
  mergePdfBuffers,
  mergedFileName,
  pdfBytesToBlob,
  readPdf,
} from './mergePdfs'

type ItemStatus = 'reading' | 'ready' | 'error'

interface PdfItem {
  id: string
  file: File
  data: ArrayBuffer | null
  pageCount: number | null
  status: ItemStatus
  message: string
}

interface Notice {
  tone: 'error' | 'ok'
  text: string
}

interface MergeResult {
  name: string
  url: string
  bytes: number
  pages: number
}

const items = ref<PdfItem[]>([])
const banner = ref<Notice | null>(null)
const result = ref<MergeResult | null>(null)
const merging = ref(false)
const dropActive = ref(false)
const draggingId = ref<string | null>(null)
const overId = ref<string | null>(null)

let dropDepth = 0

const reading = computed(() => items.value.some((item) => item.status === 'reading'))
const busy = computed(() => merging.value || reading.value)
const errorCount = computed(() => items.value.filter((item) => item.status === 'error').length)
const totalPages = computed(() =>
  items.value.reduce((sum, item) => sum + (item.status === 'ready' ? (item.pageCount ?? 0) : 0), 0),
)
const totalBytes = computed(() => items.value.reduce((sum, item) => sum + item.file.size, 0))
const mergeLabel = computed(() => {
  if (merging.value) return '正在合并…'
  if (reading.value) return '正在读取文件…'
  return '合并并下载'
})

onBeforeUnmount(() => {
  clearResult()
})

function addFiles(fileList: FileList | readonly File[]) {
  if (merging.value) return

  const files = Array.from(fileList)
  if (files.length === 0) {
    banner.value = { tone: 'error', text: '没有读到文件，请改用选择文件' }
    return
  }

  const rejected: string[] = []
  const accepted: File[] = []
  for (const file of files) {
    if (isPdfFile(file)) accepted.push(file)
    else rejected.push(file.name || '未命名文件')
  }

  if (accepted.length > 0) {
    invalidateResult()
    for (const file of accepted) {
      const item: PdfItem = {
        id: crypto.randomUUID(),
        file,
        data: null,
        pageCount: null,
        status: 'reading',
        message: '正在读取页数…',
      }
      items.value.push(item)
      void inspect(item.id, file)
    }
  }

  if (rejected.length > 0) {
    banner.value = { tone: 'error', text: formatRejected(rejected) }
  } else if (accepted.length > 0) {
    banner.value = null
  }
}

async function inspect(id: string, file: File) {
  try {
    const loaded = await readPdf(file)
    patch(id, {
      status: 'ready',
      data: loaded.data,
      pageCount: loaded.pageCount,
      message: '',
    })
  } catch (error) {
    patch(id, {
      status: 'error',
      data: null,
      pageCount: null,
      message: error instanceof Error ? error.message : `「${file.name}」无法读取，文件可能已损坏`,
    })
  }
}

function patch(id: string, partial: Partial<PdfItem>) {
  const index = items.value.findIndex((item) => item.id === id)
  const current = items.value[index]
  if (!current) return
  items.value.splice(index, 1, { ...current, ...partial })
}

function onFileInput(event: Event) {
  const input = event.target
  if (!(input instanceof HTMLInputElement) || !input.files) return
  addFiles(input.files)
  input.value = ''
}

async function mergeAndDownload() {
  if (busy.value) return

  if (items.value.length === 0) {
    banner.value = { tone: 'error', text: '请先添加 PDF 文件' }
    return
  }
  if (items.value.some((item) => item.status === 'error')) {
    banner.value = { tone: 'error', text: '请先移除无法读取的文件，再合并' }
    return
  }

  const ready = items.value.filter((item) => item.status === 'ready' && item.data)
  if (ready.length === 0) {
    banner.value = { tone: 'error', text: '请先添加 PDF 文件' }
    return
  }

  merging.value = true
  banner.value = null
  try {
    const merged = await mergePdfBuffers(
      ready.map((item) => ({
        name: item.file.name,
        data: item.data as ArrayBuffer,
      })),
    )
    const blob = pdfBytesToBlob(merged.bytes)
    const name = mergedFileName()
    clearResult()
    const url = URL.createObjectURL(blob)
    result.value = {
      name,
      url,
      bytes: blob.size,
      pages: merged.pageCount,
    }
    banner.value = {
      tone: 'ok',
      text: `已合并 ${ready.length} 个文件，共 ${merged.pageCount} 页`,
    }
    triggerDownload(url, name)
  } catch (error) {
    banner.value = {
      tone: 'error',
      text: error instanceof Error ? error.message : '合并失败，请重试',
    }
  } finally {
    merging.value = false
  }
}

function downloadResult() {
  if (!result.value) return
  triggerDownload(result.value.url, result.value.name)
}

function removeItem(id: string) {
  if (merging.value) return
  items.value = items.value.filter((item) => item.id !== id)
  invalidateResult()
}

function clearAll() {
  if (merging.value) return
  items.value = []
  draggingId.value = null
  overId.value = null
  banner.value = null
  clearResult()
}

function moveItem(from: number, to: number) {
  if (merging.value) return
  if (from < 0 || to < 0 || from >= items.value.length || to >= items.value.length || from === to) return
  const next = items.value.slice()
  const [moved] = next.splice(from, 1)
  if (!moved) return
  next.splice(to, 0, moved)
  items.value = next
  invalidateResult()
}

function onDragStart(id: string, event: DragEvent) {
  if (merging.value) {
    event.preventDefault()
    return
  }
  draggingId.value = id
  overId.value = null
  if (!event.dataTransfer) return
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('application/x-heye-item', id)
  event.dataTransfer.setData('text/plain', id)
}

function onDragEnd() {
  draggingId.value = null
  overId.value = null
}

function onRowDragOver(id: string, event: DragEvent) {
  if (hasFiles(event) || merging.value) return
  if (draggingId.value && draggingId.value !== id) overId.value = id
}

function onRowDrop(index: number, event: DragEvent) {
  if (hasFiles(event)) {
    onDropFiles(event)
    return
  }
  const fromId = draggingId.value
  draggingId.value = null
  overId.value = null
  if (!fromId) return
  const from = items.value.findIndex((item) => item.id === fromId)
  moveItem(from, index)
}

function onDragEnter(event: DragEvent) {
  if (!hasFiles(event) || merging.value) return
  dropDepth += 1
  dropActive.value = true
}

function onDragLeave(event: DragEvent) {
  if (!hasFiles(event)) return
  dropDepth = Math.max(0, dropDepth - 1)
  if (dropDepth === 0) dropActive.value = false
}

function onDropFiles(event: DragEvent) {
  dropDepth = 0
  dropActive.value = false
  if (merging.value) return
  const files = event.dataTransfer?.files
  if (files && files.length > 0) addFiles(files)
}

function hasFiles(event: DragEvent): boolean {
  const types = event.dataTransfer?.types
  if (!types) return false
  return Array.from(types).includes('Files')
}

function invalidateResult() {
  clearResult()
  if (banner.value?.tone === 'ok') banner.value = null
}

function clearResult() {
  if (!result.value) return
  URL.revokeObjectURL(result.value.url)
  result.value = null
}

function triggerDownload(url: string, name: string) {
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = name
  anchor.rel = 'noopener'
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
}

function formatRejected(names: string[]): string {
  const shown = names
    .slice(0, 3)
    .map((name) => `「${name}」`)
    .join('、')
  if (names.length === 1) return `${shown}不是 PDF 文件`
  if (names.length <= 3) return `${shown}不是 PDF 文件`
  return `${shown}等 ${names.length} 个文件不是 PDF`
}
</script>

<template>
  <section class="merge-page">
    <RouterLink class="back" to="/">← 全部工具</RouterLink>
    <header class="page-head">
      <h1>合并 PDF</h1>
      <p>
        排在上面的文件会先出现在结果里。可以拖动左侧把手调整顺序，也可以用上移、下移。文件只在这台浏览器里处理。
      </p>
    </header>

    <div class="notice-slot" aria-live="polite">
      <p v-if="banner" class="banner" :class="banner.tone">{{ banner.text }}</p>
    </div>

    <div
      class="workbench"
      :class="{ 'is-dropping': dropActive, 'is-busy': busy }"
      @dragenter.prevent="onDragEnter"
      @dragover.prevent
      @dragleave="onDragLeave"
      @drop.prevent="onDropFiles"
    >
      <label class="dropzone" :class="{ compact: items.length > 0 }">
        <input
          class="sr-only"
          type="file"
          accept=".pdf,application/pdf"
          multiple
          aria-label="选择一个或多个 PDF 文件"
          :disabled="merging"
          @change="onFileInput"
        />
        <svg v-if="items.length === 0" class="drop-icon" viewBox="0 0 64 48" aria-hidden="true">
          <rect x="8" y="6" width="28" height="36" rx="3" fill="#fffaf3" stroke="#c9b6a4" />
          <rect x="24" y="10" width="28" height="36" rx="3" fill="#f8e4d8" stroke="#9d3d22" />
        </svg>
        <span class="drop-title">{{ items.length ? '继续添加 PDF' : '把 PDF 拖到这里' }}</span>
        <span class="drop-hint">
          {{ items.length ? '也可以把文件拖进这个区域' : '或点击选择，可一次选多个。只接受 PDF。' }}
        </span>
      </label>

      <p v-if="items.length === 0" class="empty-copy">还没有文件。添加之后可以调整顺序，再合并下载。</p>

      <ol v-else class="file-list">
        <li
          v-for="(item, index) in items"
          :key="item.id"
          class="file-row"
          :class="{
            'is-over': overId === item.id,
            'is-dragging': draggingId === item.id,
            'is-error': item.status === 'error',
            'is-reading': item.status === 'reading',
          }"
          @dragover.prevent="onRowDragOver(item.id, $event)"
          @drop.prevent.stop="onRowDrop(index, $event)"
        >
          <span
            class="grip"
            :draggable="!merging"
            title="按住拖动排序"
            aria-hidden="true"
            @dragstart.stop="onDragStart(item.id, $event)"
            @dragend="onDragEnd"
          >
            <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
              <circle cx="6" cy="4" r="1.15" />
              <circle cx="10" cy="4" r="1.15" />
              <circle cx="6" cy="8" r="1.15" />
              <circle cx="10" cy="8" r="1.15" />
              <circle cx="6" cy="12" r="1.15" />
              <circle cx="10" cy="12" r="1.15" />
            </svg>
          </span>
          <span class="file-index">{{ String(index + 1).padStart(2, '0') }}</span>
          <div class="file-copy">
            <p class="file-name" :title="item.file.name">{{ item.file.name }}</p>
            <p class="file-meta">
              <template v-if="item.status === 'ready'">
                {{ item.pageCount }} 页 · {{ formatBytes(item.file.size) }}
              </template>
              <template v-else>{{ item.message }}</template>
            </p>
          </div>
          <div class="row-actions">
            <button type="button" :disabled="merging || index === 0" @click="moveItem(index, index - 1)">
              上移
            </button>
            <button
              type="button"
              :disabled="merging || index === items.length - 1"
              @click="moveItem(index, index + 1)"
            >
              下移
            </button>
            <button type="button" class="danger" :disabled="merging" @click="removeItem(item.id)">移除</button>
          </div>
        </li>
      </ol>

      <div v-if="busy" class="progress" aria-hidden="true"><span></span></div>

      <section v-if="result" class="result">
        <h2>合并完成</h2>
        <p class="result-name">{{ result.name }}</p>
        <p>{{ result.pages }} 页 · {{ formatBytes(result.bytes) }}</p>
        <button class="button-ghost" type="button" @click="downloadResult">再次下载</button>
        <p class="fine-print">如果浏览器没有自动下载，点「再次下载」。</p>
      </section>

      <div class="merge-bar">
        <button class="button-primary" type="button" :disabled="busy" @click="mergeAndDownload">
          {{ mergeLabel }}
        </button>
        <button v-if="items.length" class="button-ghost" type="button" :disabled="merging" @click="clearAll">
          清空
        </button>
        <p v-if="items.length" class="summary">
          共 {{ items.length }} 个文件
          <template v-if="totalPages"> · {{ totalPages }} 页</template>
          · {{ formatBytes(totalBytes) }}
          <template v-if="errorCount"> · {{ errorCount }} 个无法读取</template>
        </p>
      </div>
      <p class="fine-print">文件较大时，读取和合并会久一点。请留在这个页面，直到下载开始。</p>
    </div>
  </section>
</template>

<style scoped>
.merge-page {
  display: grid;
  gap: 14px;
  padding-top: 12px;
}

.back {
  width: fit-content;
  color: var(--muted);
  font-weight: 700;
  text-decoration: none;
}

.back:hover {
  color: var(--accent);
}

.page-head {
  display: grid;
  gap: 8px;
  max-width: 42rem;
}

h1,
h2 {
  font-family: var(--serif);
}

h1 {
  font-size: clamp(2rem, 4vw, 2.8rem);
  line-height: 1.2;
}

.page-head p,
.fine-print,
.empty-copy,
.summary {
  color: var(--muted);
}

.workbench {
  display: grid;
  gap: 14px;
  max-width: 860px;
}

.dropzone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 196px;
  padding: 28px 18px;
  border: 1.5px dashed #c9b6a4;
  border-radius: 20px;
  background: rgba(255, 250, 243, 0.78);
  text-align: center;
  cursor: pointer;
}

.dropzone.compact {
  min-height: 92px;
  padding: 16px;
}

.dropzone:hover,
.workbench.is-dropping .dropzone {
  border-color: var(--accent);
  background: var(--accent-soft);
}

.drop-icon {
  width: 64px;
  height: 48px;
  margin-bottom: 4px;
}

.drop-title {
  font-weight: 700;
}

.drop-hint,
.fine-print,
.file-meta,
.summary {
  font-size: 0.92rem;
}

.file-list {
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.file-row {
  display: grid;
  grid-template-columns: auto auto minmax(0, 1fr);
  grid-template-areas:
    "grip index copy"
    "actions actions actions";
  gap: 8px 10px;
  align-items: center;
  padding: 12px;
  border: 1px solid var(--line);
  border-radius: 16px;
  background: var(--surface);
}

.file-row.is-over {
  border-color: var(--accent);
  background: var(--accent-soft);
}

.file-row.is-dragging {
  opacity: 0.55;
}

.file-row.is-error {
  border-color: #efc2c8;
  background: var(--danger-soft);
}

.grip {
  grid-area: grip;
  display: grid;
  place-items: center;
  width: 36px;
  height: 44px;
  border-radius: 10px;
  color: var(--faint);
  cursor: grab;
  touch-action: none;
}

.grip:active {
  cursor: grabbing;
}

.grip svg {
  fill: currentColor;
}

.file-index {
  grid-area: index;
  font-family: var(--serif);
  color: var(--accent);
}

.file-copy {
  grid-area: copy;
  min-width: 0;
}

.file-meta {
  margin: 0;
}

.file-name {
  overflow: hidden;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-row.is-error .file-meta,
.file-row.is-reading .file-meta {
  color: var(--danger);
}

.file-row.is-reading .file-meta {
  color: var(--muted);
}

.row-actions {
  grid-area: actions;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: flex-end;
}

.row-actions button {
  min-height: 40px;
  padding: 0 12px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: white;
  cursor: pointer;
}

.row-actions button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.row-actions .danger {
  color: var(--danger);
}

.progress {
  overflow: hidden;
  height: 3px;
  border-radius: 999px;
  background: var(--line);
}

.progress span {
  display: block;
  width: 38%;
  height: 100%;
  background: var(--accent);
  animation: slide 1s ease-in-out infinite;
}

.merge-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 14px;
  align-items: center;
}

.summary {
  margin: 0;
}

.notice-slot:empty,
.banner {
  min-height: 0;
}

.banner {
  margin: 0;
  padding: 12px 14px;
  border-radius: 14px;
}

.banner.error {
  color: var(--danger);
  background: var(--danger-soft);
}

.banner.ok {
  color: var(--ok);
  background: var(--ok-soft);
}

.result {
  display: grid;
  justify-items: start;
  gap: 8px;
  padding: 16px;
  border-radius: 16px;
  background: var(--ok-soft);
}

.result-name {
  font-weight: 700;
  overflow-wrap: anywhere;
}

@keyframes slide {
  from {
    transform: translateX(-70%);
  }
  to {
    transform: translateX(280%);
  }
}

@media (min-width: 760px) {
  .file-row {
    grid-template-columns: auto auto minmax(0, 1fr) auto;
    grid-template-areas: "grip index copy actions";
  }
}

@media (max-width: 759px) {
  .merge-bar {
    position: sticky;
    bottom: 10px;
    padding: 10px;
    border: 1px solid var(--line);
    border-radius: 16px;
    background: color-mix(in srgb, var(--bg) 92%, white);
  }

  .merge-bar .button-primary {
    flex: 1;
  }

  .summary {
    flex-basis: 100%;
  }
}
</style>
