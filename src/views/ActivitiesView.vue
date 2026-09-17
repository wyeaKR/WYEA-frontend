<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { activities, activityCategories } from '@/content/activities'

const route = useRoute()
const isDetail = computed(() => route.meta.activityDetail === true)
const activity = computed(() => activities.find(item => item.path === route.path.replace(/\/$/, '')))
const activityPhotos = computed(() => activity.value?.photos ?? [])
</script>

<template>
  <article class="activities-page">
    <template v-if="!isDetail">
      <header class="activities-heading">
        <p class="eyebrow">WYEA STORIES</p>
        <h1>활동소식</h1>
        <p class="intro">세계청년교류연합의 만남과 교류를 기록합니다.</p>
      </header>
      <RouterLink v-for="(activity, index) in activities" :key="activity.path" :to="activity.path" class="story-card story-preview" :aria-labelledby="`story-title-${index}`">
        <div class="story-copy">
          <div class="story-topline">
            <span class="story-badge">{{ activityCategories[activity.category] }}</span>
            <p class="story-meta"><time :datetime="activity.startDate">{{ activity.date }}</time></p>
          </div>
          <h2 :id="`story-title-${index}`">{{ activity.title }}</h2>
        </div>
        <span class="story-arrow" aria-hidden="true">↗</span>
      </RouterLink>
    </template>

    <template v-else-if="activity">
      <nav class="breadcrumb" aria-label="현재 위치"><RouterLink to="/activities">활동소식</RouterLink><span aria-hidden="true"> / </span><span>활동 기록</span></nav>
      <header class="activities-heading detail-heading">
        <p class="eyebrow">{{ activity.category }}</p>
        <h1>{{ activity.title }}</h1>
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
    </template>
    <p class="contact-note">교류·협력 문의 <a href="mailto:wyea@wyea.info">wyea@wyea.info</a></p>
  </article>
</template>

<style scoped>
.activities-page { max-width: 1080px; margin: 0 auto; padding: 140px 32px 48px; color: #344052; font-family: 'PretendardFont', sans-serif; }
.activities-heading { text-align: center; margin-bottom: 48px; }
.eyebrow { font-size: 13px; letter-spacing: .16em; color: #0d47a1; font-weight: 700; margin-bottom: 14px; }
h1 { font-size: clamp(30px, 3vw, 44px); line-height: 1.4; font-weight: 700; margin: 0 0 20px; word-break: keep-all; }
.intro { font-size: 18px; line-height: 1.7; }
.story-card { padding: 36px 40px; border-radius: 16px; border: 1px solid #dce7f5; background: #fff; box-shadow: 0 5px 20px rgba(35,53,70,.04); }
.story-card + .story-card { margin-top: 24px; }
.story-preview { display: flex; align-items: center; justify-content: space-between; gap: 24px; padding: 26px 32px; color: inherit; text-decoration: none; transition: border-color .2s ease, background-color .2s ease, box-shadow .2s ease; }
.story-preview + .story-preview { margin-top: 16px; }
.story-copy { min-width: 0; }
.story-topline { display: flex; align-items: center; flex-wrap: wrap; gap: 10px 14px; margin-bottom: 14px; }
.story-preview .story-meta { margin: 0; }
.story-preview h2 { margin: 0; font-size: clamp(20px, 1.6vw, 26px); }
.story-badge { display: inline-flex; padding: 4px 10px; border-radius: 6px; background: #eaf2ff; color: #0d47a1; font-size: 12px; font-weight: 700; white-space: nowrap; }
.story-arrow { display: grid; place-items: center; flex-shrink: 0; width: 38px; height: 38px; border-radius: 50%; color: #0d47a1; background: #f0f5fc; font-size: 23px; }
.story-preview:focus-visible { background: #f5f9ff; border-color: #8bb3e4; }
@media (hover: hover) {
  .story-preview:hover { background: #f5f9ff; border-color: #8bb3e4; box-shadow: 0 6px 20px rgba(13,71,161,.08); }
}
@media (prefers-reduced-motion: reduce) {
  .story-preview { transition: none; }
}
h2 { font-size: clamp(22px, 1.7vw, 28px); line-height: 1.5; font-weight: 700; margin: 0 0 18px; word-break: keep-all; }
h2 a { color: inherit; text-decoration: none; }
h2 a:hover { text-decoration: underline; }
.story-card p { font-size: 17px; line-height: 1.9; word-break: keep-all; }
.story-meta, .story-card .story-meta { font-size: 14px; color: #526b8a; margin-bottom: 16px; }
a { color: #0d47a1; text-underline-offset: 4px; }
a:focus-visible { outline: 2px solid #0d47a1; outline-offset: 5px; }
.activity-photo { display: block; width: auto; max-width: 100%; height: auto; max-height: 560px; margin: 24px auto; border-radius: 10px; }
.breadcrumb { font-size: 14px; margin-bottom: 32px; }
.detail-heading { text-align: left; }
.event-facts { margin: 28px 0 0; }
.event-facts > div { display: grid; grid-template-columns: 110px 1fr; gap: 16px; padding: 14px 0; border-top: 1px solid #e5edf8; font-size: 16px; line-height: 1.7; }
dt { font-weight: 600; color: #526b8a; }
dd { margin: 0; overflow-wrap: anywhere; }
.story-links { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 20px; margin-top: 32px; }
.contact-note { text-align: center; margin: 48px 0 0; font-size: 14px; color: #697586; }
.contact-note a { display: inline-block; margin-left: 10px; }
@media (max-width: 600px) {
  .activities-page { padding: 112px 18px 32px; }
  .activities-heading { margin-bottom: 30px; }
  .story-card { padding: 24px 22px; }
  .story-preview { padding: 20px; gap: 12px; }
  .story-arrow { width: 30px; height: 30px; font-size: 20px; }
  .story-card p, .intro { font-size: 15px; }
  .event-facts > div { grid-template-columns: 74px 1fr; gap: 10px; font-size: 14px; }
}
</style>
