import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory('/admin/'),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/login/index.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/',
      component: () => import('@/layouts/MainLayout.vue'),
      redirect: '/dashboard',
      meta: { requiresAuth: true },
      children: [
        {
          path: 'dashboard',
          name: 'Dashboard',
          component: () => import('@/views/dashboard/index.vue'),
          meta: { title: '仪表盘', icon: 'DataLine' },
        },
        {
          path: 'users',
          name: 'Users',
          component: () => import('@/views/users/index.vue'),
          meta: { title: '用户管理', icon: 'User' },
        },
        {
          path: 'orders',
          name: 'Orders',
          component: () => import('@/views/orders/index.vue'),
          meta: { title: '订单管理', icon: 'Document' },
        },
        {
          path: 'tasks',
          name: 'Tasks',
          component: () => import('@/views/tasks/index.vue'),
          meta: { title: '任务管理', icon: 'List' },
        },
        {
          path: 'managers',
          name: 'Managers',
          component: () => import('@/views/managers/index.vue'),
          meta: { title: '管理员管理', icon: 'UserFilled' },
        },
        {
          path: 'verifications',
          name: 'Verifications',
          component: () => import('@/views/verifications/index.vue'),
          meta: { title: '实名认证', icon: 'Stamp' },
        },
      ],
    },
  ],
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  if (to.meta.requiresAuth !== false && !authStore.token) {
    next('/login')
  } else if (to.path === '/login' && authStore.token) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router
