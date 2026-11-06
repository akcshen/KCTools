<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import FileDrop from '@/components/FileDrop.vue'
import ToolShell from '@/components/ToolShell.vue'
import { downloadBlob } from '@/lib/download'
import { formatBytes } from '@/lib/format'
import {
  compressImage,
  formatFromFile,
  isSupportedImage,
  outputName,
  type ImageFormat,
} from './compressImage'

interface Notice {
  tone: 'error' | 'ok'
  text: string
}

const selected = ref<File | null>(null)
const format = ref<ImageFormat>('image/jpeg')
const quality = ref(0.8)
const maxEdge = ref(0)
const busy = ref(false)
const banner = ref<Notice | null>(null)
const previewUrl = ref('')
const result = ref<{ name: string; bytes: number; width: number; height: number } | null>(null)
const resultBlob = ref<Blob | null>(null)

const qualityLabel = computed(() => `${Math.round(quality.value * 100)}%`)
const ratioLabel = computed(() => {
  if (!selected.value || !result.value || selected.value.size === 0) return ''
  const ratio = Math.round((result.value.bytes / selected.value.size) * 100)
  return `约为原来的 ${ratio}%`
})

onBeforeUnmount(() => revokePreview())

function onFiles(files: File[]) {
  const file = files[0]
  if (!file) return
  if (!isSupportedImage(file)) {
    banner.value = { tone: 'error', text: `「${file.name}」不是 JPEG、PNG 或 WebP` }
    return
  }
  selected.value = file
  format.value = formatFromFile(file)
  clearResult()
  banner.value = null
}

async function compress() {
  const file = selected.value
  if (!file) {
    banner.value = { tone: 'error', text: '请先选择一张图片' }
    return
  }
  busy.value = true
  banner.value = null
  try {
    const compressed = await compressImage(file, {
      format: format.value,
      quality: quality.value,
      maxEdge: maxEdge.value,
    })
    clearResult()
    resultBlob.value = compressed.blob
    previewUrl.value = URL.createObjectURL(compressed.blob)
    const name = outputName(file.name, format.value)
    result.value = {
      name,
      bytes: compressed.blob.size,
      width: compressed.width,
      height: compressed.height,
    }
    const larger = compressed.blob.size >= file.size
    banner.value = {
      tone: larger ? 'error' : 'ok',
      text: larger
        ? '压缩后没有变小。可以降低质量，或限制最长边后再试。'
        : `已从 ${formatBytes(file.size)} 压到 ${formatBytes(compressed.blob.size)}`,
    }
    downloadBlob(compressed.blob, name)
  } catch (error) {
    banner.value = { tone: 'error', text: error instanceof Error ? error.message : '压缩失败，请重试' }
  } finally {
    busy.value = false
  }
}

function downloadAgain() {
  if (!result.value || !resultBlob.value) return
  downloadBlob(resultBlob.value, result.value.name)
}

function clearResult() {
  revokePreview()
  result.value = null
  resultBlob.value = null
}

function revokePreview() {
  if (!previewUrl.value) return
  URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = ''
}
</script>

<template>
  <ToolShell
    title="压缩图片"
    lede="在浏览器里缩小 JPEG、PNG 或 WebP。可以调整质量和最长边。原图不会上传。"
  >
    <div class="notice" aria-live="polite">
      <p v-if="banner" class="banner" :class="banner.tone">{{ banner.text }}</p>
    </div>

    <FileDrop
      accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
      title="把图片拖到这里，或点击选择"
      hint="支持 JPEG、PNG、WebP。"
      :disabled="busy"
      @files="onFiles"
    />
    <p v-if="selected" class="picked">已选择 {{ selected.name }} · {{ formatBytes(selected.size) }}</p>

    <div class="controls">
      <label class="field">
        <span>输出格式</span>
        <select v-model="format" :disabled="busy">
          <option value="image/jpeg">JPEG</option>
          <option value="image/webp">WebP</option>
          <option value="image/png">PNG</option>
        </select>
      </label>
      <label class="field">
        <span>最长边</span>
        <select v-model.number="maxEdge" :disabled="busy">
          <option :value="0">保持原尺寸</option>
          <option :value="2560">2560 像素</option>
          <option :value="1920">1920 像素</option>
          <option :value="1280">1280 像素</option>
          <option :value="800">800 像素</option>
        </select>
      </label>
      <label class="field quality">
        <span>质量 {{ qualityLabel }}</span>
        <input v-model.number="quality" type="range" min="0.4" max="0.95" step="0.05" :disabled="busy || format === 'image/png'" />
        <small>{{ format === 'image/png' ? 'PNG 不使用质量滑块，主要靠缩小尺寸。' : '数值越低，文件越小，画面越柔。' }}</small>
      </label>
    </div>

    <div class="actions">
      <button class="button-primary" type="button" :disabled="busy" @click="compress">
        {{ busy ? '正在压缩…' : '压缩并下载' }}
      </button>
    </div>

    <section v-if="result" class="result">
      <h2>压缩结果</h2>
      <p>{{ result.width }} × {{ result.height }} · {{ formatBytes(result.bytes) }} <template v-if="ratioLabel">· {{ ratioLabel }}</template></p>
      <img v-if="previewUrl" :src="previewUrl" alt="压缩后的预览" />
      <button class="button-ghost" type="button" @click="downloadAgain">再次下载</button>
    </section>
  </ToolShell>
</template>

<style scoped>
.notice:empty {
  display: none;
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

.picked,
.field small {
  color: var(--muted);
  font-size: 0.92rem;
}

.picked {
  margin: 0;
}

.controls {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.field {
  display: grid;
  gap: 6px;
  align-content: start;
  color: var(--ink);
  font-weight: 600;
}

.field select,
.field input[type='range'] {
  width: 100%;
}

.field select {
  min-height: 46px;
  padding: 0 12px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: var(--surface);
  color: var(--ink);
}

.quality {
  grid-column: 1 / -1;
  max-width: 28rem;
}

.actions {
  display: flex;
}

.result {
  display: grid;
  justify-items: start;
  gap: 8px;
  padding: 16px;
  border-radius: 16px;
  background: var(--ok-soft);
}

h2 {
  font-family: var(--serif);
  font-size: 1.4rem;
}

img {
  max-width: min(100%, 420px);
  border-radius: 12px;
  background: white;
}
</style>
