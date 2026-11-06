<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <header class="site-header">
    <RouterLink class="brand" to="/">
      <span class="brand-mark" aria-hidden="true">K</span>
      <span class="brand-text">
        <span class="brand-name">KCTools</span>
        <span class="brand-sub">本地工具</span>
      </span>
    </RouterLink>
    <p class="header-note">文件不上传</p>
  </header>
</template>

<style scoped>
.site-header {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 0 12px;
  background: color-mix(in srgb, var(--bg) 88%, transparent);
  backdrop-filter: blur(12px);
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
}

.brand-mark {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: var(--ink);
  color: #f6efe4;
  font-family: var(--serif);
  font-weight: 700;
}

.brand-text {
  display: flex;
  flex-direction: column;
  line-height: 1.15;
}

.brand-name {
  font-size: 1.15rem;
  font-weight: 700;
  letter-spacing: -0.03em;
}

.brand-sub,
.header-note {
  color: var(--muted);
  font-size: 0.82rem;
}

.header-note {
  margin: 0;
  padding: 4px 10px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: rgba(255, 250, 243, 0.7);
}
</style>
