<script setup lang="ts">
import { computed } from 'vue'
import ToolCard from '@/components/ToolCard.vue'
import { tools } from '@/tools/registry'

const readyCount = computed(() => tools.filter((tool) => tool.status === 'ready').length)
</script>

<template>
  <section class="home">
    <div class="intro">
      <p class="eyebrow">本地文件工具</p>
      <h1>常用的文件处理，留在这台设备上。</h1>
      <p class="lead">
        合页把小工具收在一起。不登录，文件也不上传。现在可以先把多份 PDF 按顺序合成一份。
      </p>
    </div>

    <div class="catalog">
      <div class="catalog-head">
        <h2>工具</h2>
        <p>{{ readyCount }} 个可用</p>
      </div>
      <ul class="tool-list">
        <li v-for="(tool, index) in tools" :key="tool.id">
          <ToolCard :tool="tool" :index="index + 1" />
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.home {
  display: grid;
  grid-template-columns: minmax(0, 0.92fr) minmax(280px, 1.08fr);
  gap: 42px;
  align-items: start;
  padding-top: 22px;
}

.eyebrow {
  margin-bottom: 10px;
  color: var(--accent);
  font-size: 0.86rem;
  font-weight: 700;
  letter-spacing: 0.08em;
}

h1 {
  font-family: var(--serif);
  font-size: clamp(2.05rem, 4vw, 3.35rem);
  font-weight: 700;
  line-height: 1.22;
  letter-spacing: -0.03em;
}

.lead {
  max-width: 38rem;
  margin-top: 16px;
  color: var(--muted);
  font-size: 1.05rem;
}

.catalog-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

h2 {
  font-family: var(--serif);
  font-size: 1.4rem;
}

.catalog-head p,
.tool-list {
  margin: 0;
}

.catalog-head p {
  color: var(--faint);
  font-size: 0.92rem;
}

.tool-list {
  display: grid;
  gap: 12px;
  padding: 0;
  list-style: none;
}

@media (max-width: 800px) {
  .home {
    grid-template-columns: 1fr;
    gap: 28px;
  }
}
</style>
