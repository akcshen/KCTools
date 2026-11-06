<script setup lang="ts">
import { ref } from 'vue'
import FileDrop from '@/components/FileDrop.vue'
import ToolShell from '@/components/ToolShell.vue'
import { downloadBlob } from '@/lib/download'
import { formatBytes } from '@/lib/format'
import { encryptFile, encryptedFileName } from './fileCipher'

interface Notice {
  tone: 'error' | 'ok'
  text: string
}

const selected = ref<File | null>(null)
const password = ref('')
const confirmPassword = ref('')
const busy = ref(false)
const banner = ref<Notice | null>(null)
const result = ref<{ name: string; bytes: number } | null>(null)
const resultBlob = ref<Blob | null>(null)

function onFiles(files: File[]) {
  const file = files[0]
  if (!file) return
  selected.value = file
  result.value = null
  resultBlob.value = null
  banner.value = null
}

async function encrypt() {
  if (busy.value) return
  const file = selected.value
  if (!file) {
    banner.value = { tone: 'error', text: '请先选择要加密的文件' }
    return
  }
  if (!password.value) {
    banner.value = { tone: 'error', text: '请输入密码' }
    return
  }
  if (password.value !== confirmPassword.value) {
    banner.value = { tone: 'error', text: '两次输入的密码不一致' }
    return
  }

  busy.value = true
  banner.value = null
  try {
    const bytes = await encryptFile(file, password.value)
    const name = encryptedFileName(file.name)
    const blob = new Blob([toArrayBuffer(bytes)], { type: 'application/octet-stream' })
    resultBlob.value = blob
    result.value = { name, bytes: blob.size }
    banner.value = { tone: 'ok', text: '加密完成。请记住密码，KCTools 不会保存它。' }
    downloadBlob(blob, name)
  } catch (error) {
    banner.value = { tone: 'error', text: error instanceof Error ? error.message : '加密失败，请重试' }
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
    title="加密文件"
    lede="用密码给任意文件加锁。加密在这台浏览器里完成，密码不会被保存，文件也不会上传。"
  >
    <div class="notice" aria-live="polite">
      <p v-if="banner" class="banner" :class="banner.tone">{{ banner.text }}</p>
    </div>

    <FileDrop
      title="把文件拖到这里，或点击选择"
      hint="任意格式都可以。加密结果是 .kct 文件。"
      :disabled="busy"
      @files="onFiles"
    />
    <p v-if="selected" class="picked">已选择 {{ selected.name }} · {{ formatBytes(selected.size) }}</p>

    <label class="field">
      <span>密码</span>
      <input v-model="password" type="password" autocomplete="new-password" :disabled="busy" />
    </label>
    <label class="field">
      <span>再输入一次密码</span>
      <input v-model="confirmPassword" type="password" autocomplete="new-password" :disabled="busy" />
    </label>
    <p class="fine">建议至少 8 个字符。忘记密码后无法恢复原文件。</p>

    <div class="actions">
      <button class="button-primary" type="button" :disabled="busy" @click="encrypt">
        {{ busy ? '正在加密…' : '加密并下载' }}
      </button>
    </div>

    <section v-if="result" class="result">
      <h2>加密完成</h2>
      <p class="result-name">{{ result.name }} · {{ formatBytes(result.bytes) }}</p>
      <button class="button-ghost" type="button" @click="downloadAgain">再次下载</button>
      <ol>
        <li>打开「解密文件」。</li>
        <li>选择刚下载的 .kct 文件。</li>
        <li>输入刚才的同一条密码，即可下载还原后的文件。</li>
      </ol>
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
.fine {
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
  flex-wrap: wrap;
  gap: 10px;
}

.result {
  display: grid;
  justify-items: start;
  gap: 8px;
  max-width: 40rem;
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

ol {
  margin: 0;
  padding-left: 1.2rem;
  color: var(--ink);
}
</style>
