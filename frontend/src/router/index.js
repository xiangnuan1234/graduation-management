import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/store/user'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue')
  },
  {
    path: '/',
    component: () => import('@/views/Layout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue')
      },
      {
        path: 'users',
        name: 'Users',
        component: () => import('@/views/Users.vue'),
        meta: { roles: ['admin'] }
      },
      {
        path: 'topics',
        name: 'Topics',
        component: () => import('@/views/Topics.vue')
      },
      {
        path: 'applications',
        name: 'Applications',
        component: () => import('@/views/Applications.vue')
      },
      {
        path: 'proposals',
        name: 'Proposals',
        component: () => import('@/views/Proposals.vue')
      },
      {
        path: 'midterms',
        name: 'Midterms',
        component: () => import('@/views/Midterms.vue')
      },
      {
        path: 'documents',
        name: 'Documents',
        component: () => import('@/views/Documents.vue')
      },
      {
        path: 'notifications',
        name: 'Notifications',
        component: () => import('@/views/Notifications.vue')
      },
      {
        path: 'statistics',
        name: 'Statistics',
        component: () => import('@/views/Statistics.vue'),
        meta: { roles: ['admin', 'teacher'] }
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('@/views/Profile.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  const token = userStore.token

  if (to.meta.requiresAuth && !token) {
    next('/login')
  } else if (to.path === '/login' && token) {
    next('/')
  } else if (to.meta.roles && !to.meta.roles.includes(userStore.user?.role)) {
    next('/')
  } else {
    next()
  }
})

export default router