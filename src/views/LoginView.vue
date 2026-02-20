<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth-store.js'
import { useUserStore } from '@/stores/user-store.js'
import type { LoginRequest } from '@/interface/user-interface.js'

//ref - 사용하면 값이 자동으로 반응함 = 동기화 .value 반드씨 써야댐
const loginid = ref<string>('')
const password = ref<string>('')
const isPwd = ref(true)
const authStore = useAuthStore()
const userStore = useUserStore()
const router = useRouter()

// LoginData 형식의 credentials에 아이디 비번드감
// authStore.login()에 credentials 값에 보내서 로그인 성공 or 실패
const onLogin = async (): Promise<void> => {
  // async () => {} : 비동기 함수 정의, 비동기면 반환 타입 : Promise<void>
  const credentials: LoginRequest = {
    username: loginid.value,
    password: password.value,
  }

  try {
    await authStore.login(credentials)
    window.location.href = '/'
  } catch (err) {
    console.error(err)
    alert('로그인 실패')
  }
}

// 걍 userStore에 있는 logout함수 불러옴
const onLogout = (): void => {
  userStore.logout()
  router.push('/')
}
</script>

<template>
  <q-layout view="lHh Lpr lFf">
    <q-page-container>
      <q-page class="flex flex-center">
        <div>
          <h1>Please Log In</h1>
          <br />
          <div id="loginForm">
            <form @submit.prevent="onLogin">
              <p>
                <q-input
                  v-if="!userStore.isLoggedIn"
                  v-model="loginid"
                  label="아이디"
                  filled
                  :rules="[(val: string) => !!val || '아이디를 입력하세요.']"
                  class="q-mb-md"
                />
              </p>
              <p>
                <q-input
                  v-if="!userStore.isLoggedIn"
                  name="password"
                  label="비밀번호"
                  v-model="password"
                  filled
                  :type="isPwd ? 'password' : 'text'"
                  :rules="[(val: string) => !!val || '비밀번호를 입력하세요.']"
                >
                  <template v-slot:append>
                    <q-icon
                      :name="isPwd ? 'visibility_off' : 'visibility'"
                      class="cursor-pointer"
                      @click="isPwd = !isPwd"
                    />
                  </template>
                </q-input>
              </p>
              <p>
                <q-btn
                  color="green"
                  size="large"
                  type="submit"
                  @click="userStore.isLoggedIn ? onLogout() : onLogin()"
                >
                  {{ userStore.isLoggedIn ? '로그아웃' : '로그인' }}
                  <!--삼진탐색 isLoggedIn이 true면 버튼이 onLogout으로 -->
                </q-btn>
              </p>
            </form>
          </div>
        </div>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<style>
h1 {
  font-weight: 500;
  font-size: 2.6rem;
  position: relative;
  top: -10px;
  text-align: center;
}
#loginForm {
  font-weight: 500;
  font-size: 1.5rem;
  position: relative;
  top: -10px;
  text-align: center;
}
</style>
