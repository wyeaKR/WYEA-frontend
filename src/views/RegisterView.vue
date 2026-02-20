<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth-store.js'
import type { RegisterRequest } from '@/interface/user-interface.js'

const authStore = useAuthStore()
const router = useRouter()

const loginid = ref('')
const password = ref('')
const passwordCheck = ref('')
const username = ref('')
const isPwd = ref(true)
const isPwdCk = ref(true)

// 입력값 val를 받아서 ture, 아니면 string을 반환하는 타입
type RuleFn<T> = (val: T) => true | string

/**
 * label을 매개변수로으로 받음, 반환하는 타입이 RuleFn<string>
 * ~를 입력하세요 메시지 생성
 *
 * @param label
 */
const required =
  (label: string): RuleFn<string> =>
  (v) =>
    v ? true : `${label}를 입력하세요.`

/**
 * 비밀번호, 비밀번호 확인이 같은지 확인하는 함수
 *
 * @param getter
 * @param msg
 */
const equalTo =
  (getter: () => string, msg: string): RuleFn<string> =>
  (v) =>
    v === getter() ? true : msg

const uidRules = computed<RuleFn<string>[]>(() => [required('아이디')])
const passwordRules = computed<RuleFn<string>[]>(() => [required('비밀번호')])
const passwordCheckRules = computed<RuleFn<string>[]>(() => [
  required('비밀번호 확인'),
  equalTo(() => password.value, '비밀번호가 일치하지 않습니다.'),
])
const usernameRules = computed<RuleFn<string>[]>(() => [required('닉네임')])

const onRegister = async () => {
  const payload: RegisterRequest = {
    username: loginid.value,
    password: password.value,
    nickname: username.value,
  }

  try {
    await authStore.register(payload)
    router.push('/login')
  } catch (err) {
    console.error(err)
    alert('회원가입 실패')
  }
}
</script>

<template>
  <q-layout view="lHh Lpr lFf">
    <q-page-container>
      <q-page class="flex flex-center">
        <div>
          <h1>Please Register</h1>
          <br />
          <div id="registerForm">
            <form @submit.prevent="onRegister">
              <p>
                <q-input name="uid" label="아이디" v-model="loginid" filled :rules="uidRules" />
              </p>

              <p>
                <q-input
                  name="password"
                  label="비밀번호"
                  v-model="password"
                  filled
                  :type="isPwd ? 'password' : 'text'"
                  :rules="passwordRules"
                >
                  <template #append>
                    <q-icon
                      :name="isPwd ? 'visibility_off' : 'visibility'"
                      class="cursor-pointer"
                      @click="isPwd = !isPwd"
                    />
                  </template>
                </q-input>
              </p>

              <p>
                <q-input
                  name="passwordCheck"
                  label="비밀번호 확인"
                  v-model="passwordCheck"
                  filled
                  :type="isPwdCk ? 'password' : 'text'"
                  :rules="passwordCheckRules"
                >
                  <template #append>
                    <q-icon
                      :name="isPwdCk ? 'visibility_off' : 'visibility'"
                      class="cursor-pointer"
                      @click="isPwdCk = !isPwdCk"
                    />
                  </template>
                </q-input>
              </p>

              <p>
                <q-input
                  name="username"
                  label="닉네임"
                  v-model="username"
                  filled
                  :rules="usernameRules"
                />
              </p>

              <p>
                <q-btn color="green" size="large" type="submit">회원가입</q-btn>
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
#registerForm {
  font-weight: 500;
  font-size: 1.5rem;
  position: relative;
  top: -10px;
  text-align: center;
}
</style>
