<script setup lang="ts">
import { ref } from 'vue'
import { useUserStore } from '@/stores/user-store.js'
import { onMounted } from 'vue'
const userStore = useUserStore()
const username = ref('')
const role = ref('')
/**
 * onMounted = 컴포넌트가 화면에 처음 나타난 직후 실행되는 함수
 * 컴포넌트가 마운트될 때 사용자 정보를 가져옴
 * 사용자 정보는 userStore에서 관리되며
 * getMyInfo 메서드를 호출하여 서버에서 데이터를 가져옴.
 * 가져온 데이터는 username과 role 변수에 저장됨
 */
onMounted(async () => {
  try {
    await userStore.getMyInfo()
    username.value = userStore.userInfo.nickname
    role.value = userStore.userInfo.role
  } catch (error) {
    console.error('사용자 정보를 불러오는데 실패했습니다:', error)
  }
})
</script>

<template>
  <q-layout view="lHh Lpr lFf">
    <q-page-container>
      <q-page class="flex flex-center">
        <div>
          <h1>사용자 정보</h1>
          <q-card flat bordered class="q-pa-md">
            <q-card-section>
              <p>사용자명: {{ username }}</p>
              <p>역할: {{ role }}</p>
            </q-card-section>
          </q-card>
          <div id="updateBtn">
            <q-btn color="green" size="md" to="/user/update"> 사용자 정보 수정 </q-btn>
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
#updateBtn {
  text-align: center;
  margin-top: 20px;
}
</style>
