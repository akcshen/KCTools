<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <section class="not-found">
    <p class="eyebrow">404</p>
    <h1>没有这个页面</h1>
    <p>工具列表里暂时没有对应的入口。</p>
    <RouterLink class="button-primary" to="/">返回首页</RouterLink>
  </section>
</template>

<style scoped>
.not-found {
  display: grid;
  justify-items: start;
  gap: 12px;
  padding-top: 48px;
}

.eyebrow {
  color: var(--accent);
  font-weight: 700;
}

h1 {
  font-family: var(--serif);
  font-size: clamp(2rem, 4vw, 2.8rem);
}

p:last-of-type {
  color: var(--muted);
  margin-bottom: 8px;
}
</style>
