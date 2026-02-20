import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

import { Quasar } from 'quasar'
import '@quasar/extras/material-icons/material-icons.css'
import 'quasar/src/css/index.sass'

import { useUserStore } from '@/stores/user-store.ts'

const app = createApp(App)

app.use(Quasar, {
  plugins: {},
})

app.use(createPinia())
app.use(router)

// 앱이 시작될때 initializeAuth로 로그인 복원시도
//const userStore = useUserStore()
const userStore = useUserStore()
userStore.initializeAuth()
// 로그인 상태라면 사용자 정보를 가져옴
async function bootstrap() {
  if (userStore.isLoggedIn) {
    await userStore.getMyInfo()
  }
  app.mount('#app')
}

void bootstrap()
