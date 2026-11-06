<script setup lang="ts">
import { computed, ref } from 'vue'
import FileDrop from '@/components/FileDrop.vue'
import ToolShell from '@/components/ToolShell.vue'
import { countText, readPlainText } from './countText'

const text = ref('')
const banner = ref('')
const fileName = ref('')

const stats = computed(() => countText(text.value))

async function onFiles(files: File[]) {
  const file = files[0]
  if (!file) return
  banner.value = ''
  try {
    text.value = await readPlainText(file)
    fileName.value = file.name
  } catch (error) {
    banner.value = error instanceof Error ? error.message : '无法读取文件'
  }
}
</script>

<template>
  <ToolShell
    title="字数统计"
    lede="统计粘贴或上传的文本。中文每个字计为一个词，其余内容按空白分词。计算只在这台浏览器里进行。"
  >
    <p v-if="banner" class="banner error">{{ banner }}</p>
    <FileDrop title="上传文本文件" hint="也可以直接在下面粘贴。支持 1.5 MB 以内的文本。" @files="onFiles" />
    <p v-if="fileName" class="note">当前文件：{{ fileName }}</p>
    <textarea v-model="text" rows="12" placeholder="在这里粘贴文本" spellcheck="false"></textarea>
    <dl class="stats">
      <div>
        <dt>字符（含空白）</dt>
        <dd>{{ stats.chars }}</dd>
      </div>
      <div>
        <dt>字符（不含空白）</dt>
        <dd>{{ stats.charsNoSpace }}</dd>
      </div>
      <div>
        <dt>词</dt>
        <dd>{{ stats.words }}</dd>
      </div>
      <div>
        <dt>行</dt>
        <dd>{{ stats.lines }}</dd>
      </div>
      <div>
        <dt>段落</dt>
        <dd>{{ stats.paragraphs }}</dd>
      </div>
    </dl>
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

.note {
  margin: 0;
  color: var(--muted);
  font-size: 0.92rem;
}

textarea {
  width: 100%;
  min-height: 220px;
  padding: 12px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: var(--surface);
  color: var(--ink);
  resize: vertical;
}

.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 10px;
  margin: 0;
}

.stats div {
  padding: 14px;
  border: 1px solid var(--line);
  border-radius: 16px;
  background: var(--surface);
}

dt {
  color: var(--muted);
  font-size: 0.86rem;
}

dd {
  margin: 4px 0 0;
  font-family: var(--serif);
  font-size: 1.8rem;
  line-height: 1.1;
}
</style>
