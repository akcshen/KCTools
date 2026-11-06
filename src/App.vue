<script setup lang="ts">
import { RouterView } from 'vue-router'
import SiteHeader from '@/components/SiteHeader.vue'
</script>

<template>
  <div class="app-shell">
    <SiteHeader />
    <main class="app-main">
      <RouterView />
    </main>
    <footer class="app-footer">
      <p>合页在浏览器本地处理文件，不会把文件发到服务器。</p>
    </footer>
  </div>
</template>

<style scoped>
.app-shell {
  width: min(1080px, calc(100% - 32px));
  margin: 0 auto;
  padding-bottom: 40px;
}

.app-main {
  padding-top: 8px;
}

.app-footer {
  margin-top: 48px;
  padding-top: 16px;
  border-top: 1px solid var(--line);
  color: var(--faint);
  font-size: 0.92rem;
}

@media (max-width: 640px) {
  .app-shell {
    width: min(1080px, calc(100% - 24px));
  }
}
</style>
