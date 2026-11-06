<script setup lang="ts">
import { ref } from 'vue'
import ToolShell from '@/components/ToolShell.vue'
import { copyText } from '@/lib/copyText'
import { formatJson } from './formatJson'

const input = ref('')
const output = ref('')
const banner = ref('')
const bannerTone = ref<'error' | 'ok'>('error')

function run(space: 0 | 2) {
  try {
    output.value = formatJson(input.value, space)
    banner.value = space === 0 ? '已压缩为一行' : '已格式化'
    bannerTone.value = 'ok'
  } catch (error) {
    output.value = ''
    banner.value = error instanceof Error ? error.message : 'JSON 无法解析'
    bannerTone.value = 'error'
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
  <ToolShell title="JSON 格式化" lede="把 JSON 排成易读的缩进，或压成一行。解析失败时会指出大致行号。内容不会上传。">
    <p v-if="banner" class="banner" :class="bannerTone">{{ banner }}</p>
    <label class="field">
      <span>输入</span>
      <textarea v-model="input" rows="10" placeholder='例如 {"name":"KCTools"}' spellcheck="false"></textarea>
    </label>
    <div class="actions">
      <button class="button-primary" type="button" @click="run(2)">格式化</button>
      <button class="button-ghost" type="button" @click="run(0)">压缩为一行</button>
      <button class="button-ghost" type="button" @click="copyOutput">复制结果</button>
    </div>
    <label class="field">
      <span>结果</span>
      <textarea :value="output" rows="10" readonly placeholder="格式化结果会出现在这里" spellcheck="false"></textarea>
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
  min-height: 180px;
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
