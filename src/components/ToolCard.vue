<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import type { ToolDefinition } from '@/tools/registry'

const props = defineProps<{
  tool: ToolDefinition
  index: number
}>()

const indexLabel = computed(() => String(props.index).padStart(2, '0'))
const isReady = computed(() => props.tool.status === 'ready' && Boolean(props.tool.path))
</script>

<template>
  <RouterLink v-if="isReady && tool.path" class="tool-card ready" :to="tool.path">
    <div class="tool-top">
      <span class="tool-index">{{ indexLabel }}</span>
      <span class="tool-status">可用</span>
    </div>
    <h3>{{ tool.name }}</h3>
    <p>{{ tool.summary }}</p>
    <span class="tool-go">进入</span>
  </RouterLink>
  <article v-else class="tool-card soon">
    <div class="tool-top">
      <span class="tool-index">{{ indexLabel }}</span>
      <span class="tool-status">即将推出</span>
    </div>
    <h3>{{ tool.name }}</h3>
    <p>{{ tool.summary }}</p>
    <span class="tool-wait">做好之后会出现在这里</span>
  </article>
</template>

<style scoped>
.tool-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  width: 100%;
  height: 100%;
  min-height: 196px;
  padding: 18px;
  border: 1px solid var(--line);
  border-radius: 18px;
  background: var(--surface);
  box-shadow: var(--shadow);
  color: inherit;
  text-decoration: none;
}

.tool-card.ready:hover {
  border-color: #e2b5a4;
  transform: translateY(-2px);
}

.tool-card.soon {
  background: transparent;
  box-shadow: none;
  border-style: dashed;
}

.tool-top,
.tool-go,
.tool-wait {
  display: flex;
  align-items: center;
}

.tool-top {
  width: 100%;
  justify-content: space-between;
  gap: 12px;
}

.tool-index {
  font-family: var(--serif);
  font-size: 1.3rem;
  color: var(--accent);
}

.tool-status,
.tool-wait {
  color: var(--muted);
  font-size: 0.82rem;
}

.tool-status {
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.7);
}

.ready .tool-status {
  color: var(--ok);
  background: var(--ok-soft);
}

h3 {
  font-family: var(--serif);
  font-size: 1.45rem;
  font-weight: 700;
  line-height: 1.3;
}

p {
  color: var(--muted);
  flex: 1;
}

.tool-go {
  margin-top: auto;
  color: var(--accent);
  font-weight: 700;
}

.tool-go::after {
  content: " →";
}
</style>
