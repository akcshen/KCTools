<script setup lang="ts">
import { ref } from 'vue'
import FileDrop from '@/components/FileDrop.vue'
import ToolShell from '@/components/ToolShell.vue'
import { copyText } from '@/lib/copyText'
import { downloadBlob } from '@/lib/download'
import { formatBytes } from '@/lib/format'
import { decodeBytes, decodeText, encodeBytes, encodeText } from './base64'

const input = ref('')
const output = ref('')
const banner = ref('')
const bannerTone = ref<'error' | 'ok'>('error')
const fileName = ref('')

function showError(error: unknown) {
  output.value = ''
  banner.value = error instanceof Error ? error.message : '处理失败'
  bannerTone.value = 'error'
}

function encodeInput() {
  try {
    output.value = encodeText(input.value)
    banner.value = '已按 UTF-8 编码'
    bannerTone.value = 'ok'
  } catch (error) {
    showError(error)
  }
}

function decodeInput() {
  try {
    output.value = decodeText(input.value)
    banner.value = '已按 UTF-8 解码'
    bannerTone.value = 'ok'
  } catch (error) {
    showError(error)
  }
}

function downloadDecoded() {
  try {
    const bytes = decodeBytes(input.value)
    const copy = new Uint8Array(new ArrayBuffer(bytes.byteLength))
    copy.set(bytes)
    downloadBlob(new Blob([copy]), fileName.value ? `${fileName.value}.bin` : '解码结果.bin')
    banner.value = '已开始下载解码文件'
    bannerTone.value = 'ok'
  } catch (error) {
    showError(error)
  }
}

async function onFiles(files: File[]) {
  const file = files[0]
  if (!file) return
  try {
    const bytes = new Uint8Array(await file.arrayBuffer())
    output.value = encodeBytes(bytes)
    fileName.value = file.name
    input.value = ''
    banner.value = `已编码「${file.name}」· ${formatBytes(file.size)}`
    bannerTone.value = 'ok'
  } catch (error) {
    showError(error)
  }
}

async function copyOutput() {
  try {
    await copyText(output.value)
    banner.value = '已复制结果'
    bannerTone.value = 'ok'
  } catch (error) {
    banner.value = error instanceof Error ? error.message : '复制失败'
    bannerTone.value = 'error'
  }
}
</script>

<template>
  <ToolShell
    title="Base64"
    lede="文本按 UTF-8 编码或解码。文件会编成 Base64；二进制内容请用「解码为文件」下载。处理不会上传。"
  >
    <p v-if="banner" class="banner" :class="bannerTone">{{ banner }}</p>
    <FileDrop title="把文件编成 Base64" hint="适合图片或其他二进制文件。" @files="onFiles" />
    <label class="field">
      <span>文本或 Base64</span>
      <textarea v-model="input" rows="8" placeholder="输入要编码的文本，或要解码的 Base64" spellcheck="false"></textarea>
    </label>
    <div class="actions">
      <button class="button-primary" type="button" @click="encodeInput">编码文本</button>
      <button class="button-ghost" type="button" @click="decodeInput">解码为文本</button>
      <button class="button-ghost" type="button" @click="downloadDecoded">解码为文件</button>
      <button class="button-ghost" type="button" @click="copyOutput">复制结果</button>
    </div>
    <label class="field">
      <span>结果</span>
      <textarea :value="output" rows="8" readonly placeholder="结果会出现在这里" spellcheck="false"></textarea>
    </label>
  </ToolShell>
</template>

<style scoped>
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

.field {
  display: grid;
  gap: 6px;
  color: var(--ink);
  font-weight: 700;
}

textarea {
  width: 100%;
  min-height: 160px;
  padding: 12px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: var(--surface);
  color: var(--ink);
  font-weight: 400;
  resize: vertical;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
