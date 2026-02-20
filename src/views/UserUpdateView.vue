<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useUserStore } from '@/stores/user-store.js'

const userStore = useUserStore()

const isPswUpdate = ref(false)

const newNickName = ref('')
const currentPassword = ref('')
const newPassword = ref('')
const newPasswordCheck = ref('')

const saving = ref(false)
const isCrPwd = ref(true)
const isNewPwd = ref(true)
const isNewPwdCK = ref(true)

onMounted(async () => {
  if (!userStore.userInfo?.nickname) {
    await userStore.getMyInfo()
  }
})
/**
 * userStore.userInfo.username 값이 변할 때 실시간으로 실행되는 감시 로직
 * immediate: true = 컴포넌트가 처음 마운트될 때도 실행되게
 */
watch(
  () => userStore.userInfo?.nickname,
  (v) => {
    newNickName.value = v
  },
  { immediate: true },
)

type RuleFn<T> = (val: T) => true | string

const required =
  (label: string): RuleFn<string> =>
  (v) =>
    v ? true : `${label}를 입력하세요.`

const equalTo =
  (getter: () => string, msg: string): RuleFn<string> =>
  (v) =>
    v === getter() ? true : msg

const nicknameRules = computed<RuleFn<string>[]>(() => [required('닉네임')])
const passwordRules = computed<RuleFn<string>[]>(() => [required('원본 비밀번호')])
const updatePasswordRules = computed<RuleFn<string>[]>(() => [required('변경할 비밀번호')])
const updatePasswordCheckRules = computed<RuleFn<string>[]>(() => [
  required('변경할 비밀번호 확인'),
  equalTo(() => newPassword.value, '비밀번호가 일치하지 않습니다.'),
])

const onNickNameupdate = async () => {
  const nv = newNickName.value?.trim()
  if (nv === userStore.userInfo?.nickname) {
    alert('변경사항이 없습니다.')
    return
  }
  saving.value = true
  try {
    await userStore.updateMyInfo({ nickname: nv })
    alert('저장 완료')
  } catch (err) {
    console.error(err)
    alert('닉네임 변경 실패')
  } finally {
    saving.value = false
  }
}

const onPasswordupdate = async () => {
  const opv = currentPassword.value?.trim()
  const npv = newPassword.value?.trim()

  try {
    await userStore.updateMyInfo({ currentPassword: opv, newPassword: npv })
    alert('저장 완료')
  } catch (err) {
    console.error(err)
    alert('비밀번호 변경 실패')
    return
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <q-layout view="lHh Lpr lFf">
    <q-page-container>
      <q-page class="flex flex-center">
        <div>
          <h1>사용자 정보 수정</h1>
          <div v-if="!isPswUpdate">
            <form @submit.prevent="onNickNameupdate">
              <p>
                <q-input
                  name="uid"
                  label="닉네임"
                  v-model.trim="newNickName"
                  filled
                  :rules="nicknameRules"
                />
              </p>

              <div id="updateBtn">
                <p>
                  <q-btn color="green" size="md" type="button" @click="isPswUpdate = true">
                    비밀번호 변경 으로</q-btn
                  >
                  <q-btn
                    color="green"
                    size="md"
                    class="q-ml-lg"
                    type="submit"
                    :loading="saving"
                    :disable="saving"
                  >
                    변경
                  </q-btn>
                </p>
              </div>
            </form>
          </div>
          <div v-else>
            <form @submit.prevent="onPasswordupdate">
              <p>
                <q-input
                  name="uid"
                  label="원본 비밀번호"
                  v-model="currentPassword"
                  filled
                  :type="isCrPwd ? 'password' : 'text'"
                  :rules="passwordRules"
                >
                  <template #append>
                    <q-icon
                      :name="isCrPwd ? 'visibility_off' : 'visibility'"
                      class="cursor-pointer"
                      @click="isCrPwd = !isCrPwd"
                    />
                  </template>
                </q-input>
              </p>
              <p>
                <q-input
                  name="uid"
                  label="변경할 비밀번호"
                  v-model="newPassword"
                  filled
                  :type="isNewPwd ? 'password' : 'text'"
                  :rules="updatePasswordRules"
                >
                  <template #append>
                    <q-icon
                      :name="isNewPwd ? 'visibility_off' : 'visibility'"
                      class="cursor-pointer"
                      @click="isNewPwd = !isNewPwd"
                    />
                  </template>
                </q-input>
              </p>
              <p>
                <q-input
                  name="uid"
                  label="변경할 비밀번호 확인"
                  v-model="newPasswordCheck"
                  filled
                  :type="isNewPwdCK ? 'password' : 'text'"
                  :rules="updatePasswordCheckRules"
                >
                  <template #append>
                    <q-icon
                      :name="isNewPwdCK ? 'visibility_off' : 'visibility'"
                      class="cursor-pointer"
                      @click="isNewPwdCK = !isNewPwdCK"
                    />
                  </template>
                </q-input>
              </p>
              <div id="updateBtn">
                <p>
                  <q-btn color="green" size="md" type="button" @click="isPswUpdate = false">
                    닉네임 변경 으로</q-btn
                  >
                  <q-btn
                    color="green"
                    size="md"
                    type="submit"
                    class="q-ml-lg"
                    :loading="saving"
                    :disable="saving"
                  >
                    변경
                  </q-btn>
                </p>
              </div>
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
</style>
