import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import { isTokenExpired } from '@/utils/token-utils'

const routerInstance = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: {footer: false, bg: '#2d6a4f'}
    },
    {
      path: '/SG9tZVZpZXdQaG90bw==',
      name: 'homeviewphoto',
      component: () => import('../components/HomeViewPhoto.vue'),
      meta: {footer: false, bg: '#2d6a4f'}
    },
    {
      path: '/financialreport',
      name: 'financialreport',
      component: () => import('../views/FinancialReport.vue'),
      meta: {bg: '#ffffff'}
    },
    {
      path: '/personalinformationprocessingpolicy',
      name: 'personalinformationprocessingpolicy',
      component: () => import('../views/PersonalInformationProcessingPolicy.vue'),
      meta: {bg: '#ffffff'}
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/RegisterView.vue'),
    },
    {
      path: '/user/me',
      name: 'userme',
      component: () => import('../views/UserMeView.vue'),
    },
    {
      path: '/user/update',
      name: 'userupdate',
      component: () => import('../views/UserUpdateView.vue'),
    },

    {
      path: '/user/posts',
      name: 'posts',
      component: () => import('../views/PostView.vue'),
    },
  ],
  scrollBehavior() {
    // 항상 맨 위로 스크롤
    return { top: 0 }
  }
})

routerInstance.beforeEach((to, from, next) => {
  const accessToken = localStorage.getItem('accesstoken')

  if (to.meta.requiresAuth) {
    if (!accessToken || isTokenExpired(accessToken)) {
      next('/login')
    } else {
      next()
    }
  } else {
    next()
  }
})

export default routerInstance
