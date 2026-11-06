import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import NotFoundView from '@/views/NotFoundView.vue'
import { buildToolRoutes } from '@/tools/registry'

const router = createRouter({
  history: createWebHistory(),
  scrollBehavior() {
    return { top: 0 }
  },
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { title: '合页' },
    },
    ...buildToolRoutes(),
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: NotFoundView,
      meta: { title: '页面不存在' },
    },
  ],
})

router.afterEach((to) => {
  const title = typeof to.meta.title === 'string' ? to.meta.title : '合页'
  document.title = title === '合页' ? '合页 · 本地小工具' : `${title} · 合页`
})

export default router
