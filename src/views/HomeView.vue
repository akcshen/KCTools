<script setup lang="ts">
import { computed } from 'vue'
import ToolCard from '@/components/ToolCard.vue'
import { categories, tools } from '@/tools/registry'

const readyCount = computed(() => tools.filter((tool) => tool.status === 'ready').length)
const groups = computed(() =>
  categories
    .map((category) => ({
      ...category,
      tools: tools.filter((tool) => tool.category === category.id),
    }))
    .filter((group) => group.tools.length > 0),
)
</script>

<template>
  <section class="home">
    <div class="intro">
      <p class="eyebrow">浏览器里的本地工具</p>
      <h1>文件处理留在这台设备上。</h1>
      <p class="lead">
        KCTools 按 PDF、安全、图片和文本分组。不登录，文件也不上传。
      </p>
    </div>

    <div class="catalog">
      <p class="ready-count">{{ readyCount }} 个可用</p>
      <section v-for="group in groups" :key="group.id" class="category">
        <div class="catalog-head">
          <h2>{{ group.label }}</h2>
          <p>{{ group.tools.length }} 个</p>
        </div>
        <ul class="tool-list">
          <li v-for="(tool, index) in group.tools" :key="tool.id">
            <ToolCard :tool="tool" :index="index + 1" />
          </li>
        </ul>
      </section>
    </div>
  </section>
</template>

<style scoped>
.home {
  display: grid;
  gap: 28px;
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

.catalog-head p,
.ready-count {
  color: var(--faint);
  font-size: 0.92rem;
}

.ready-count {
  margin: 0 0 4px;
}

.category {
  display: grid;
  gap: 12px;
  margin-top: 22px;
}

.tool-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
  padding: 0;
  list-style: none;
}

.tool-list > li {
  min-width: 0;
}
</style>
