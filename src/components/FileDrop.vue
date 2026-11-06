<script setup lang="ts">
import { ref } from 'vue'

const props = withDefaults(
  defineProps<{
    accept?: string
    title: string
    hint: string
    disabled?: boolean
  }>(),
  { accept: '', disabled: false },
)

const emit = defineEmits<{
  files: [files: File[]]
}>()

const active = ref(false)
let depth = 0

function emitFiles(list: FileList | null | undefined) {
  const files = Array.from(list ?? [])
  if (!files.length || props.disabled) return
  emit('files', files.slice(0, 1))
}

function onEnter() {
  if (props.disabled) return
  depth += 1
  active.value = true
}

function onLeave() {
  depth = Math.max(0, depth - 1)
  if (depth === 0) active.value = false
}

function onDrop(event: DragEvent) {
  depth = 0
  active.value = false
  emitFiles(event.dataTransfer?.files)
}

function onInput(event: Event) {
  const input = event.target
  if (!(input instanceof HTMLInputElement)) return
  emitFiles(input.files)
  input.value = ''
}
</script>

<template>
  <label
    class="file-drop"
    :class="{ active, disabled }"
    @dragenter.prevent="onEnter"
    @dragover.prevent
    @dragleave="onLeave"
    @drop.prevent="onDrop"
  >
    <input class="sr-only" type="file" :accept="accept" :disabled="disabled" @change="onInput" />
    <span class="drop-title">{{ title }}</span>
    <span class="drop-hint">{{ hint }}</span>
  </label>
</template>

<style scoped>
.file-drop {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 132px;
  padding: 22px 16px;
  border: 1.5px dashed #c9b6a4;
  border-radius: 18px;
  background: rgba(255, 250, 243, 0.78);
  text-align: center;
  cursor: pointer;
}

.file-drop:hover,
.file-drop.active {
  border-color: var(--accent);
  background: var(--accent-soft);
}

.file-drop.disabled {
  cursor: progress;
  opacity: 0.7;
}

.drop-title {
  color: var(--ink);
  font-weight: 700;
}

.drop-hint {
  color: var(--muted);
  font-size: 0.92rem;
}
</style>
