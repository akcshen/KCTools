<script setup lang="ts">
import { RouterLink } from 'vue-router'

defineProps<{
  title: string
  lede: string
}>()
</script>

<template>
  <section class="tool-page">
    <RouterLink class="back" to="/">← 全部工具</RouterLink>
    <header class="page-head">
      <h1>{{ title }}</h1>
      <p>{{ lede }}</p>
    </header>
    <slot />
  </section>
</template>

<style scoped>
.tool-page {
  display: grid;
  gap: 14px;
  padding-top: 12px;
}

.back {
  width: fit-content;
  color: var(--muted);
  font-weight: 700;
  text-decoration: none;
}

.back:hover {
  color: var(--accent);
}

.page-head {
  display: grid;
  gap: 8px;
  max-width: 42rem;
}

h1 {
  font-family: var(--serif);
  font-size: clamp(2rem, 4vw, 2.8rem);
  line-height: 1.2;
}

p {
  color: var(--muted);
}
</style>
