<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { seoulExchange as activity } from '@/content/activities'

const route = useRoute()
const isDetail = computed(() => route.meta.activityDetail === true)
</script>

<template>
  <article class="activities-page">
    <template v-if="!isDetail">
      <header class="activities-heading">
        <p class="eyebrow">WYEA STORIES</p>
        <h1>활동소식</h1>
        <p class="intro">세계청년교류회의 만남과 교류를 기록합니다.</p>
      </header>
      <section class="story-card" aria-labelledby="exchange-title">
        <p class="story-meta"><time :datetime="activity.startDate">{{ activity.date }}</time> · {{ activity.location }}</p>
        <h2 id="exchange-title"><RouterLink :to="activity.path">{{ activity.title }}</RouterLink></h2>
        <p>{{ activity.summary }}</p>
        <RouterLink class="read-more" :to="activity.path">활동 기록 보기 <span aria-hidden="true">→</span></RouterLink>
      </section>
    </template>

    <template v-else>
      <nav class="breadcrumb" aria-label="현재 위치"><RouterLink to="/activities">활동소식</RouterLink><span aria-hidden="true"> / </span><span>교류회 기록</span></nav>
      <header class="activities-heading detail-heading">
        <p class="eyebrow">EXCHANGE · SEOUL</p>
        <h1>{{ activity.title }}</h1>
        <p class="story-meta"><time :datetime="activity.startDate">2025년 11월 1일</time> – <time :datetime="activity.endDate">2일</time> · {{ activity.location }}</p>
      </header>
      <section class="story-card" aria-labelledby="record-heading">
        <h2 id="record-heading">서울에서 함께한 교류</h2>
        <p>{{ activity.summary }}</p>
        <dl class="event-facts">
          <div><dt>일정</dt><dd>{{ activity.date }}</dd></div>
          <div><dt>지역</dt><dd>{{ activity.location }}</dd></div>
          <div><dt>교류 단체</dt><dd>{{ activity.partner }}</dd></div>
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
.eyebrow { font-size: 13px; letter-spacing: .16em; color: #2d6a4f; font-weight: 700; margin-bottom: 14px; }
h1 { font-size: clamp(30px, 3vw, 44px); line-height: 1.4; font-weight: 700; margin: 0 0 20px; word-break: keep-all; }
.intro { font-size: 18px; line-height: 1.7; }
.story-card { padding: 36px 40px; border-radius: 16px; border: 1px solid #e7edf0; background: #fff; box-shadow: 0 5px 20px rgba(35,53,70,.04); }
h2 { font-size: clamp(22px, 1.7vw, 28px); line-height: 1.5; font-weight: 700; margin: 0 0 18px; word-break: keep-all; }
h2 a { color: inherit; text-decoration: none; }
h2 a:hover { text-decoration: underline; }
.story-card p { font-size: 17px; line-height: 1.9; word-break: keep-all; }
.story-meta, .story-card .story-meta { font-size: 14px; color: #657267; margin-bottom: 16px; }
a { color: #2d6a4f; text-underline-offset: 4px; }
a:focus-visible { outline: 2px solid #2d6a4f; outline-offset: 5px; }
.read-more { display: inline-block; margin-top: 12px; font-weight: 600; }
.breadcrumb { font-size: 14px; margin-bottom: 32px; }
.detail-heading { text-align: left; }
.event-facts { margin: 28px 0 0; }
.event-facts > div { display: grid; grid-template-columns: 110px 1fr; gap: 16px; padding: 14px 0; border-top: 1px solid #edf0f2; font-size: 16px; line-height: 1.7; }
dt { font-weight: 600; color: #647163; }
dd { margin: 0; overflow-wrap: anywhere; }
.story-links { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 20px; margin-top: 32px; }
.contact-note { text-align: center; margin: 48px 0 0; font-size: 14px; color: #697586; }
.contact-note a { display: inline-block; margin-left: 10px; }
@media (max-width: 600px) {
  .activities-page { padding: 112px 18px 32px; }
  .activities-heading { margin-bottom: 30px; }
  .story-card { padding: 24px 22px; }
  .story-card p, .intro { font-size: 15px; }
  .event-facts > div { grid-template-columns: 74px 1fr; gap: 10px; font-size: 14px; }
}
</style>
