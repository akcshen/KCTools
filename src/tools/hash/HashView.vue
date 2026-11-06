<script setup lang="ts">
import { ref } from 'vue'
import FileDrop from '@/components/FileDrop.vue'
import ToolShell from '@/components/ToolShell.vue'
import { copyText } from '@/lib/copyText'
import { formatBytes } from '@/lib/format'
import { md5Hex, sha256Hex, textBytes } from './hash'

interface Digests {
  label: string
  md5: string
  sha256: string
}

const text = ref('')
const banner = ref('')
const bannerTone = ref<'error' | 'ok'>('error')
const result = ref<Digests | null>(null)
const busy = ref(false)

async function hashText() {
  if (!text.value) {
    banner.value = '请先粘贴文本，或上传文件'
    bannerTone.value = 'error'
    result.value = null
    return
  }
  await publish('文本', textBytes(text.value))
}

async function onFiles(files: File[]) {
  const file = files[0]
  if (!file) return
  if (file.size === 0) {
    banner.value = `「${file.name}」是空文件`
    bannerTone.value = 'error'
    return
  }
  await publish(`${file.name} · ${formatBytes(file.size)}`, new Uint8Array(await file.arrayBuffer()))
}

async function publish(label: string, bytes: Uint8Array) {
  busy.value = true
  banner.value = ''
  try {
    result.value = {
      label,
      md5: md5Hex(bytes),
      sha256: await sha256Hex(bytes),
    }
    banner.value = '已计算 MD5 和 SHA-256'
    bannerTone.value = 'ok'
  } catch (error) {
    result.value = null
    banner.value = error instanceof Error ? error.message : '计算失败'
    bannerTone.value = 'error'
  } finally {
    busy.value = false
  }
}

async function copyValue(value: string) {
  try {
    await copyText(value)
    banner.value = '已复制'
    bannerTone.value = 'ok'
  } catch (error) {
    banner.value = error instanceof Error ? error.message : '复制失败'
    bannerTone.value = 'error'
  }
}
</script>

<template>
  <ToolShell
    title="哈希校验"
    lede="计算文本或文件的 MD5 与 SHA-256，结果是小写十六进制。SHA-256 使用浏览器的 Web Crypto，文件不会上传。"
  >
    <p v-if="banner" class="banner" :class="bannerTone">{{ banner }}</p>
    <FileDrop title="上传要校验的文件" hint="也可以只计算下面的文本。" :disabled="busy" @files="onFiles" />
    <label class="field">
      <span>文本</span>
      <textarea v-model="text" rows="8" placeholder="按 UTF-8 计算这段文本" spellcheck="false"></textarea>
    </label>
    <div class="actions">
      <button class="button-primary" type="button" :disabled="busy" @click="hashText">
        {{ busy ? '正在计算…' : '计算文本哈希' }}
      </button>
    </div>
    <section v-if="result" class="result">
      <h2>{{ result.label }}</h2>
      <div class="row">
        <span>MD5</span>
        <code>{{ result.md5 }}</code>
        <button class="button-ghost" type="button" @click="copyValue(result.md5)">复制</button>
      </div>
      <div class="row">
        <span>SHA-256</span>
        <code>{{ result.sha256 }}</code>
        <button class="button-ghost" type="button" @click="copyValue(result.sha256)">复制</button>
      </div>
    </section>
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
}

.result {
  display: grid;
  gap: 10px;
  padding: 16px;
  border-radius: 16px;
  background: var(--surface);
  border: 1px solid var(--line);
}

h2 {
  font-family: var(--serif);
  font-size: 1.25rem;
  overflow-wrap: anywhere;
}

.row {
  display: grid;
  grid-template-columns: 5.5rem minmax(0, 1fr) auto;
  gap: 8px;
  align-items: center;
}

code {
  overflow-wrap: anywhere;
  font-size: 0.86rem;
}

@media (max-width: 720px) {
  .row {
    grid-template-columns: 1fr;
  }
}
</style>
