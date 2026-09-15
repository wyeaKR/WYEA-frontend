import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import { seoulExchange } from '@/content/activities'
import { isTokenExpired } from '@/utils/token-utils'

if ('scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual'
}

const routerInstance = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/activities',
      name: 'activities',
      component: () => import('../views/ActivitiesView.vue'),
      meta: { bg: '#f9fcff', title: '활동소식 | 세계청년교류회(WYEA)', description: '세계청년교류회(WYEA)의 만남과 교류 활동을 기록합니다.' },
    },
    {
      path: seoulExchange.path,
      name: 'activity-detail',
      component: () => import('../views/ActivitiesView.vue'),
      meta: { bg: '#f9fcff', activityDetail: true, title: `${seoulExchange.title} | WYEA`, description: seoulExchange.summary },
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('../views/AboutView.vue'),
      meta: {
        bg: '#f9fcff',
        title: '단체소개 | 세계청년교류회(WYEA)',
        description: '세계청년교류회(WYEA)의 설립 배경, 국제 교류와 협력을 위한 목적, 단체 기본정보와 문의 방법을 안내합니다.',
      },
    },
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
  scrollBehavior(to) {
    if (to.name === 'about' && to.hash === '#history') {
      return { el: '#history', top: 120 }
    }
    // 항상 맨 위로 스크롤
    return { top: 0, left: 0 }
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

const defaultTitle = 'WYEA'
const defaultDescription = '세계청년교류회(WYEA)는 청년들의 국제 교류와 협력을 위한 비영리단체입니다. 단체 소개와 활동, 재정보고를 안내합니다.'
routerInstance.afterEach((to) => {
  document.title = typeof to.meta.title === 'string' ? to.meta.title : defaultTitle
  document.querySelector('meta[name="description"]')?.setAttribute(
    'content', typeof to.meta.description === 'string' ? to.meta.description : defaultDescription,
  )
  const canonical = document.querySelector('link[rel="canonical"]')
  if (canonical) canonical.setAttribute('href', `https://wyea.info${to.path === '/about' ? '/about/' : to.path}`)
})

export default routerInstance
