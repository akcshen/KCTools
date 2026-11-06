<script setup lang="ts">
import { ref } from 'vue'
import FileDrop from '@/components/FileDrop.vue'
import ToolShell from '@/components/ToolShell.vue'
import { downloadBlob } from '@/lib/download'
import { formatBytes } from '@/lib/format'
import { decryptFile } from './fileCipher'

interface Notice {
  tone: 'error' | 'ok'
  text: string
}

const selected = ref<File | null>(null)
const password = ref('')
const busy = ref(false)
const banner = ref<Notice | null>(null)
const result = ref<{ name: string; bytes: number; mime: string } | null>(null)
const resultBlob = ref<Blob | null>(null)

function onFiles(files: File[]) {
  const file = files[0]
  if (!file) return
  selected.value = file
  result.value = null
  resultBlob.value = null
  banner.value = null
}

async function decrypt() {
  if (busy.value) return
  const file = selected.value
  if (!file) {
    banner.value = { tone: 'error', text: '请先选择要解密的 .kct 文件' }
    return
  }
  if (!password.value) {
    banner.value = { tone: 'error', text: '请输入密码' }
    return
  }

  busy.value = true
  banner.value = null
  try {
    const decoded = await decryptFile(file, password.value)
    const blob = new Blob([toArrayBuffer(decoded.bytes)], { type: decoded.mime })
    resultBlob.value = blob
    result.value = { name: decoded.name, bytes: blob.size, mime: decoded.mime }
    banner.value = { tone: 'ok', text: '解密完成，原文件已开始下载。' }
    downloadBlob(blob, decoded.name)
  } catch (error) {
    banner.value = { tone: 'error', text: error instanceof Error ? error.message : '解密失败，请重试' }
  } finally {
    busy.value = false
  }
}

function downloadAgain() {
  if (!result.value || !resultBlob.value) return
  downloadBlob(resultBlob.value, result.value.name)
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength)
  copy.set(bytes)
  return copy.buffer
}
</script>

<template>
  <ToolShell
    title="解密文件"
    lede="解开 KCTools「加密文件」生成的 .kct 文件。请使用加密时的同一条密码。解密只在这台浏览器里进行。"
  >
    <div class="notice" aria-live="polite">
      <p v-if="banner" class="banner" :class="banner.tone">{{ banner.text }}</p>
    </div>

    <FileDrop
      accept=".kct,application/octet-stream"
      title="把 .kct 文件拖到这里，或点击选择"
      hint="文件名通常以 .kct 结尾。"
      :disabled="busy"
      @files="onFiles"
    />
    <p v-if="selected" class="picked">已选择 {{ selected.name }} · {{ formatBytes(selected.size) }}</p>

    <label class="field">
      <span>密码</span>
      <input v-model="password" type="password" autocomplete="current-password" :disabled="busy" />
    </label>

    <div class="actions">
      <button class="button-primary" type="button" :disabled="busy" @click="decrypt">
        {{ busy ? '正在解密…' : '解密并下载' }}
      </button>
    </div>

    <section v-if="result" class="result">
      <h2>已还原</h2>
      <p class="result-name">{{ result.name }} · {{ formatBytes(result.bytes) }}</p>
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

.picked {
  margin: 0;
  color: var(--muted);
  font-size: 0.92rem;
}

.field {
  display: grid;
  gap: 6px;
  max-width: 28rem;
  color: var(--ink);
  font-weight: 600;
}

.field input {
  min-height: 46px;
  padding: 0 12px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: var(--surface);
  color: var(--ink);
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

.result-name {
  font-weight: 700;
  overflow-wrap: anywhere;
}
</style>
