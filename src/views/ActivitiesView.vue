<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import NewsSectionNav from '@/components/NewsSectionNav.vue'
import NewsList from '@/components/NewsList.vue'
import { activities, activityCategories } from '@/content/activities'

const route = useRoute()
const isDetail = computed(() => route.meta.activityDetail === true)
const activity = computed(() => activities.find(item => item.path === route.path.replace(/\/$/, '')))
const activityPhotos = computed(() => activity.value?.photos ?? [])
const activityItems = activities.map(item => ({ path: item.path, title: item.title, date: item.startDate, datetime: item.startDate }))
</script>

<template>
  <article class="activities-page">
    <NewsSectionNav />
    <template v-if="!isDetail">
      <header class="activities-heading">
        <p class="eyebrow">WYEA STORIES</p>
        <h1>활동소식</h1>
        <p class="intro">세계청년교류연합의 만남과 교류를 기록합니다.</p>
      </header>
      <NewsList :items="activityItems" list-label="활동소식 목록" date-label="활동일" empty-message="게시된 활동소식이 없습니다." />
    </template>

    <template v-else-if="activity">
      <nav class="breadcrumb" aria-label="현재 위치"><RouterLink to="/activities">활동소식</RouterLink><span aria-hidden="true"> / </span><span>활동 기록</span></nav>
      <header class="activities-heading detail-heading">
        <p class="eyebrow">{{ activityCategories[activity.category] }}</p>
        <h1 id="activity-title" tabindex="-1">{{ activity.title }}</h1>
        <p class="story-meta"><time :datetime="activity.startDate">{{ activity.date }}</time></p>
      </header>
      <section class="story-card" aria-label="활동 내용">
        <img v-for="(photo, index) in activityPhotos" :key="photo" class="activity-photo" :src="photo" :alt="`${activity.title} 사진 ${index + 1}`" decoding="async" />
        <p v-for="(paragraph, index) in activity.paragraphs" :key="index">{{ paragraph }}</p>
        <dl class="event-facts">
          <div><dt>일정</dt><dd>{{ activity.date }}</dd></div>
          <div v-if="activity.location"><dt>지역</dt><dd>{{ activity.location }}</dd></div>
          <div v-if="activity.partner"><dt>{{ activity.partnerLabel ?? '교류 단체' }}</dt><dd>{{ activity.partner }}</dd></div>
        </dl>
      </section>
      <div class="story-links">
        <RouterLink to="/activities">← 활동소식 목록</RouterLink>
      </div>
      <div class="join-prompt">
        <h2>함께 활동해요</h2>
        <RouterLink class="join-cta" to="/join">함께 활동하기 (회원 가입 신청) →</RouterLink>
      </div>
    </template>
    <p class="contact-note">교류와 협력 문의 <a href="mailto:wyea@wyea.info">wyea@wyea.info</a></p>
  </article>
</template>

<style scoped>
.activities-page { max-width: 1100px; min-height: 80vh; margin: 0 auto; padding: 130px 24px 70px; color: #344052; font-family: 'PretendardFont', sans-serif; }
.activities-heading { text-align: center; margin-bottom: 44px; }
.eyebrow { font-size: 13px; letter-spacing: .16em; color: #0d47a1; font-weight: 700; margin-bottom: 14px; }
h1 { font-size: clamp(30px, 3vw, 44px); line-height: 1.4; font-weight: 700; margin: 0 0 12px; word-break: keep-all; }
.intro { font-size: 17px; }
.story-card { min-height: 260px; padding: 38px 12px; border-bottom: 1px solid #dce7f5; }
h2 { font-size: clamp(22px, 1.7vw, 28px); line-height: 1.5; font-weight: 700; margin: 0 0 18px; word-break: keep-all; }
h2 a { color: inherit; text-decoration: none; }
h2 a:hover { text-decoration: underline; }
.story-card p { margin: 0 0 20px; font-size: 17px; line-height: 1.9; word-break: keep-all; }
.story-meta, .story-card .story-meta { font-size: 14px; color: #526b8a; margin-bottom: 16px; }
a { color: #0d47a1; text-underline-offset: 4px; }
a:focus-visible { outline: 2px solid #0d47a1; outline-offset: 5px; }
.activity-photo { display: block; width: auto; max-width: 100%; height: auto; max-height: 560px; margin: 24px auto; border-radius: 10px; }
.breadcrumb { font-size: 14px; margin-bottom: 28px; }
.detail-heading { text-align: left; padding-bottom: 28px; border-bottom: 2px solid #344052; margin-bottom: 0; }
.event-facts { margin: 28px 0 0; }
.event-facts > div { display: grid; grid-template-columns: 110px 1fr; gap: 16px; padding: 14px 0; border-top: 1px solid #e5edf8; font-size: 16px; line-height: 1.7; }
dt { font-weight: 600; color: #526b8a; }
dd { margin: 0; overflow-wrap: anywhere; }
.story-links { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 20px; margin-top: 32px; }
.join-prompt { margin-top: 36px; text-align: center; }
.join-prompt h2 { margin-bottom: 16px; }
.join-cta { display: inline-block; padding: 12px 22px; border-radius: 999px; background: #0d47a1; color: #fff; font-weight: 700; text-decoration: none; }
.join-cta:hover { background: #083776; }
.contact-note { text-align: center; margin: 48px 0 0; font-size: 14px; color: #697586; }
.contact-note a { display: inline-block; margin-left: 10px; }
@media (max-width: 600px) {
  .activities-page { padding: 115px 18px 42px; }
  .activities-heading { margin-bottom: 30px; }
  .detail-heading { margin-bottom: 0; }
  .story-card { padding: 28px 2px; }
  .story-card p, .intro { font-size: 15px; }
  .event-facts > div { grid-template-columns: 74px 1fr; gap: 10px; font-size: 14px; }
}
</style>
