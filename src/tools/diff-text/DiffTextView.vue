<script setup lang="ts">
import { computed, ref } from 'vue'
import ToolShell from '@/components/ToolShell.vue'
import { buildDiff, readTextFile, type TextDiff } from './diffText'

interface Notice {
  tone: 'error' | 'ok'
  text: string
}

const left = ref('')
const right = ref('')
const leftName = ref('左侧')
const rightName = ref('右侧')
const banner = ref<Notice | null>(null)
const result = ref<TextDiff | null>(null)
const mode = ref<'side' | 'unified'>('side')
const reading = ref(false)

const summary = computed(() => {
  if (!result.value) return ''
  if (result.value.same) return '两段内容相同'
  return `删除 ${result.value.removed} 行 · 新增 ${result.value.added} 行`
})

async function loadSide(side: 'left' | 'right', event: Event) {
  const input = event.target
  if (!(input instanceof HTMLInputElement) || !input.files?.[0]) return
  const file = input.files[0]
  reading.value = true
  banner.value = null
  try {
    const text = await readTextFile(file)
    if (side === 'left') {
      left.value = text
      leftName.value = file.name
    } else {
      right.value = text
      rightName.value = file.name
    }
    result.value = null
  } catch (error) {
    banner.value = { tone: 'error', text: error instanceof Error ? error.message : '无法读取文件' }
  } finally {
    reading.value = false
    input.value = ''
  }
}

function compare() {
  if (!left.value && !right.value) {
    banner.value = { tone: 'error', text: '请先粘贴文本，或选择两个文本文件' }
    result.value = null
    return
  }
  result.value = buildDiff(left.value, right.value)
  banner.value = result.value.same
    ? { tone: 'ok', text: '两段内容相同' }
    : { tone: 'ok', text: summary.value }
}

function swap() {
  const text = left.value
  const name = leftName.value
  left.value = right.value
  leftName.value = rightName.value
  right.value = text
  rightName.value = name
  result.value = null
  banner.value = null
}
</script>

<template>
  <ToolShell
    title="文本对比"
    lede="比较两段文本或两个文本文件。差异只在这台浏览器里计算，内容不会上传。"
  >
    <div class="notice" aria-live="polite">
      <p v-if="banner" class="banner" :class="banner.tone">{{ banner.text }}</p>
    </div>

    <div class="editors">
      <div class="editor">
        <div class="editor-head">
          <span>{{ leftName }}</span>
          <label>
            选择文件
            <input class="sr-only" type="file" accept=".txt,.md,.json,.csv,.log,.xml,.html,.css,.js,.ts,text/plain" :disabled="reading" @change="loadSide('left', $event)" />
          </label>
        </div>
        <textarea v-model="left" rows="12" placeholder="粘贴左侧文本，或选择文件" spellcheck="false"></textarea>
      </div>
      <div class="editor">
        <div class="editor-head">
          <span>{{ rightName }}</span>
          <label>
            选择文件
            <input class="sr-only" type="file" accept=".txt,.md,.json,.csv,.log,.xml,.html,.css,.js,.ts,text/plain" :disabled="reading" @change="loadSide('right', $event)" />
          </label>
        </div>
        <textarea v-model="right" rows="12" placeholder="粘贴右侧文本，或选择文件" spellcheck="false"></textarea>
      </div>
    </div>

    <div class="actions">
      <button class="button-primary" type="button" :disabled="reading" @click="compare">
        {{ reading ? '正在读取…' : '开始对比' }}
      </button>
      <button class="button-ghost" type="button" :disabled="reading" @click="swap">左右对调</button>
    </div>

    <section v-if="result" class="diff-panel">
      <div class="diff-bar">
        <p>{{ summary }}</p>
        <div class="modes">
          <button type="button" :aria-pressed="mode === 'side'" @click="mode = 'side'">并排</button>
          <button type="button" :aria-pressed="mode === 'unified'" @click="mode = 'unified'">统一</button>
        </div>
      </div>

      <div v-if="mode === 'side'" class="side">
        <div class="side-head">
          <span>{{ leftName }}</span>
          <span>{{ rightName }}</span>
        </div>
        <div v-for="(row, index) in result.rows" :key="index" class="side-row">
          <pre :class="row.kind === 'add' ? 'empty' : row.kind">{{ row.left || ' ' }}</pre>
          <pre :class="row.kind === 'del' ? 'empty' : row.kind">{{ row.right || ' ' }}</pre>
        </div>
        <p v-if="result.rows.length === 0" class="empty-note">没有可显示的行。</p>
      </div>

      <div v-else class="unified">
        <pre
          v-for="(line, index) in result.unified"
          :key="index"
          :class="line.kind"
        >{{ line.text }}</pre>
        <p v-if="result.unified.length === 0" class="empty-note">没有可显示的行。</p>
      </div>
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

.editors {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.editor {
  display: grid;
  gap: 8px;
  min-width: 0;
}

.editor-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  color: var(--ink);
  font-weight: 700;
}

.editor-head label {
  min-height: 36px;
  padding: 6px 12px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: white;
  color: var(--ink);
  font-size: 0.86rem;
  cursor: pointer;
}

textarea {
  width: 100%;
  min-height: 240px;
  padding: 12px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: var(--surface);
  color: var(--ink);
  resize: vertical;
}

.actions,
.diff-bar,
.modes {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.diff-bar {
  justify-content: space-between;
}

.diff-bar p {
  margin: 0;
  font-weight: 700;
}

.modes button,
.diff-panel {
  border: 1px solid var(--line);
}

.modes button {
  min-height: 36px;
  padding: 0 12px;
  border-radius: 999px;
  background: white;
  cursor: pointer;
}

.modes button[aria-pressed='true'] {
  border-color: transparent;
  background: var(--ink);
  color: #fffaf6;
}

.diff-panel {
  display: grid;
  gap: 10px;
  padding: 12px;
  border-radius: 16px;
  background: rgba(255, 250, 243, 0.72);
}

.side,
.unified {
  max-height: 520px;
  overflow: auto;
  border-radius: 12px;
  background: white;
}

.side-head,
.side-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
}

.side-head {
  position: sticky;
  top: 0;
  z-index: 1;
  padding: 8px 10px;
  border-bottom: 1px solid var(--line);
  background: #fffaf3;
  color: var(--muted);
  font-size: 0.82rem;
  font-weight: 700;
}

.side-row pre,
.unified pre {
  margin: 0;
  padding: 2px 10px;
  overflow: auto;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.82rem;
  line-height: 1.45;
  white-space: pre-wrap;
  word-break: break-word;
}

.del,
.change {
  background: var(--danger-soft);
}

.add {
  background: var(--ok-soft);
}

.side-row .change:first-child {
  background: var(--danger-soft);
}

.side-row .change:last-child {
  background: var(--ok-soft);
}

.empty,
.same {
  background: transparent;
}

.empty-note {
  margin: 0;
  padding: 12px;
  color: var(--muted);
}

@media (max-width: 760px) {
  .editors,
  .side-head,
  .side-row {
    grid-template-columns: 1fr;
  }
}
</style>
