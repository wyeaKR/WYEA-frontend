<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import NewsSectionNav from '@/components/NewsSectionNav.vue'
import NewsList from '@/components/NewsList.vue'
import { notices, noticePath } from '@/content/notices'

const route = useRoute()
const isDetail = computed(() => route.meta.noticeDetail === true)
const notice = computed(() => notices.find(item => noticePath(item) === route.path.replace(/\/$/, '')))
const noticeItems = notices.map(item => ({ path: noticePath(item), title: item.title, date: item.date, datetime: item.date, pinned: item.pinned ?? false }))
</script>

<template>
  <article class="notices-page">
    <NewsSectionNav />

    <template v-if="!isDetail">
      <header class="notices-heading">
        <p class="eyebrow">WYEA NOTICE</p>
        <h1>공지사항</h1>
        <p>세계청년교류연합의 공식 안내를 전합니다.</p>
      </header>

      <NewsList :items="noticeItems" list-label="공지사항 목록" date-label="게시일" empty-message="게시된 공지가 없습니다." />
    </template>

    <template v-else-if="notice">
      <nav class="breadcrumb" aria-label="현재 위치"><RouterLink to="/notices">공지사항</RouterLink><span aria-hidden="true"> / </span><span>공지 상세</span></nav>
      <header class="detail-heading">
        <p class="eyebrow">WYEA NOTICE</p>
        <h1>{{ notice.title }}</h1>
        <p class="notice-date">게시일 <time :datetime="notice.date">{{ notice.date }}</time></p>
      </header>
      <section class="notice-body" aria-label="공지 내용">
        <p v-for="(paragraph, index) in notice.paragraphs" :key="index">{{ paragraph }}</p>
        <div v-if="notice.attachments?.length" class="attachments">
          <h2>첨부파일</h2>
          <ul><li v-for="file in notice.attachments" :key="file.href"><a :href="file.href" download>{{ file.label }}</a></li></ul>
        </div>
      </section>
      <RouterLink class="back-link" to="/notices">← 공지사항 목록</RouterLink>
    </template>
  </article>
</template>

<style scoped>
.notices-page { max-width: 1100px; min-height: 80vh; margin: 0 auto; padding: 130px 24px 70px; color: #344052; font-family: 'PretendardFont', sans-serif; }
.notices-heading { text-align: center; margin-bottom: 44px; }
.eyebrow { color: #0d47a1; font-size: 13px; letter-spacing: .16em; font-weight: 700; margin-bottom: 12px; }
h1 { font-size: clamp(30px, 3vw, 44px); line-height: 1.4; font-weight: 700; margin: 0 0 12px; word-break: keep-all; }
.notices-heading > p:last-child { font-size: 17px; }
.breadcrumb { margin-bottom: 28px; font-size: 14px; }
.detail-heading { padding-bottom: 28px; border-bottom: 2px solid #344052; }
.notice-date { margin: 20px 0 0; color: #526b8a; font-size: 14px; }
.notice-body { min-height: 260px; padding: 38px 12px; border-bottom: 1px solid #dce7f5; }
.notice-body p { margin: 0 0 20px; line-height: 1.9; font-size: 17px; white-space: pre-line; word-break: keep-all; }
.attachments { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5edf8; }
.attachments h2 { margin-bottom: 12px; font-size: 17px; font-weight: 700; }
.attachments ul { margin: 0; padding-left: 20px; }
.back-link { display: inline-block; margin-top: 30px; font-weight: 700; }
a:focus-visible { outline: 2px solid #0d47a1; outline-offset: 3px; }
.breadcrumb a, .attachments a, .back-link { color: #0d47a1; text-underline-offset: 4px; }
@media (max-width: 600px) {
  .notices-page { padding: 115px 18px 42px; }
  .notices-heading { margin-bottom: 30px; }
  .notices-heading > p:last-child { font-size: 15px; }
  .notice-body { padding: 28px 2px; }
  .notice-body p { font-size: 15px; }
}
</style>
