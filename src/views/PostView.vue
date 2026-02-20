<script setup lang="ts">
import { ref } from 'vue'
import { usePostStore } from '@/stores/post-store.js'
import { useUserStore } from '@/stores/user-store.js'
import type { PostRequest } from '@/interface/post-interface.js'

const title = ref<string>('')
const contents = ref<string>('')
const postStore = usePostStore()
const userStore = useUserStore()
const isNotice = ref(false)
const onPostSave = async () => {
  if (!title.value || !contents.value) {
    alert('제목과 내용을 입력해주세요.')
    return
  }
  const postRequest: PostRequest = {
    title: title.value,
    content: contents.value,
    notice: isNotice.value,
  }

  try {
    await postStore.savePost(postRequest)
    title.value = ''
    contents.value = ''

    alert('저장 완료')
  } catch (err) {
    console.error(err)
    alert('게시물 저장 실패')
  }
}
</script>
<template>
  <q-layout>
    <q-page-container>
      <q-page class="flex flex-center">
        <div>
          <h1>게시글 작성</h1>
          <div id="postForm">
            <form @submit.prevent="onPostSave">
              <p>
                <q-input v-model="title" label="제목" filled class="q-mb-md" />
              </p>
              <p>
                <q-editor v-model="contents" content-class="text-left" spellcheck="false" />
              </p>
              <p id="btnForm">
                <q-btn color="green" size="large" type="submit"> 게시글 저장 </q-btn>
              </p>
            </form>
          </div>
          <div id="checkbox">
            <q-checkbox
              v-if="userStore.role == 'ADMIN'"
              size="sm"
              v-model="isNotice"
              label="공지"
              color="green"
            />
          </div>
        </div>
      </q-page>
    </q-page-container>
  </q-layout>
</template>
<style scoped>
h1 {
  font-weight: 500;
  font-size: 2.6rem;
  position: relative;
  top: -10px;
  text-align: center;
}
#postForm {
  position: relative;
  left: -50%;
  width: 200%;
}
#btnForm {
  text-align: center;
}
#checkbox {
  position: relative;
  text-align: center;
}
</style>
