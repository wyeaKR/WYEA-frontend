<script setup lang="ts">
const history: { date: string; label: string; event: string; path?: string }[] = [
  {
    "date": "2025-06-25",
    "label": "2025년 6월 25일",
    "event": "세계청년교류연합 결성"
  },
  {
    "date": "2025-06-26",
    "label": "2025년 6월 26일",
    "event": "경상국립대학교 지부 설립"
  },
  {
    "date": "2025-06-30",
    "label": "2025년 6월 30일",
    "event": "인제대학교 지부 설립"
  },
  {
    "date": "2025-07-05",
    "label": "2025년 7월 5일",
    "event": "서울대학교 지부 설립"
  },
  {
    "date": "2025-07-07",
    "label": "2025년 7월 7일",
    "event": "연세대학교 지부 설립"
  },
  {
    "date": "2025-07-14",
    "label": "2025년 7월 14일",
    "event": "재일본대한민국청년회와 협력 관계 체결"
  },
  {
    "date": "2025-07-17",
    "label": "2025년 7월 17일",
    "event": "경남대학교 지부 설립"
  },
  {
    "date": "2025-07-25",
    "label": "2025년 7월 25일",
    "event": "부산대학교 지부 설립"
  },
  {
    "date": "2025-09-17",
    "label": "2025년 9월 17일",
    "event": "마산대학교 지부 설립"
  },
  {
    date: '2026-03-04',
    label: '2026년 3월 4일',
    event: '삼원가정봉사원파견센터와 협력 관계 체결',
  },
]
</script>

<template>
  <article class="about-page">
    <header class="about-heading">
      <p class="eyebrow">ABOUT WYEA</p>
      <h1>세계청년교류연합</h1>
      <p class="english-name">World Youth Exchange Association</p>
      <p class="lead">청년들의 국제 교류와 협력을 위한 비영리단체입니다.</p>
    </header>

    <section class="about-card" aria-labelledby="mission-heading">
      <span class="section-label">01 · 우리의 목적</span>
      <h2 id="mission-heading">국경을 넘어, 청년과 청년을 연결합니다</h2>
      <p>세계청년교류연합(WYEA)는 청년들이 서로 교류하고 협력할 수 있는 기회를 만들고자 합니다. 서로 다른 언어와 문화적 배경을 가진 청년들이 만나 경험을 나누고, 함께 배우며 관계를 이어가는 것을 지향합니다.</p>
      <p>국제 교류와 공동 활동을 통해 서로에 대한 이해를 넓히고, 청년들이 더 넓은 세계와 연결될 수 있도록 하는 것이 우리의 목적입니다.</p>
    </section>

    <section class="about-card" aria-labelledby="background-heading">
      <span class="section-label">02 · 설립 배경</span>
      <h2 id="background-heading">연결이 쉬워진 시대에도, 만남은 필요합니다</h2>
      <p>정보통신 기술의 발전으로 소통의 범위는 국가와 개인을 넘어 전 세계로 확대되었습니다. 언제 어디서든 연락할 수 있게 되었지만, 언어 장벽과 물리적 거리는 여전히 교류의 어려움으로 남아 있습니다.</p>
      <p>이러한 배경에서 청년들의 국제 교류와 협력을 위한 단체의 필요성을 느껴 세계청년교류연합을 결성했습니다.</p>
    </section>

    <section id="history" class="about-card history-card" aria-labelledby="history-heading">
      <span class="section-label">03 · 연혁</span>
      <h2 id="history-heading">세계청년교류연합이 걸어온 길</h2>
      <ol class="history-list">
        <li v-for="entry in history" :key="entry.date" class="history-entry">
          <time :datetime="entry.date">{{ entry.label }}</time>
          <span>{{ entry.event }}<RouterLink v-if="entry.path" class="history-link" :to="entry.path">활동 기록 보기 →</RouterLink></span>
        </li>
      </ol>
    </section>

    <section class="about-card" aria-labelledby="information-heading">
      <span class="section-label">04 · 단체 기본정보</span>
      <h2 id="information-heading">세계청년교류연합을 소개합니다</h2>
      <dl class="organization-details">
        <div><dt>단체명</dt><dd>세계청년교류연합</dd></div>
        <div><dt>약어</dt><dd>WYEA</dd></div>
        <div><dt>단체 성격</dt><dd>비영리단체</dd></div>
        <div><dt>고유번호</dt><dd>410-82-93357</dd></div>
        <div><dt>소재지</dt><dd>중구 명덕로 179, 2층 202-J153호</dd></div>
        <div><dt>이메일</dt><dd><a href="mailto:wyea@wyea.info">wyea@wyea.info</a></dd></div>
        <div><dt>팩스</dt><dd>053-289-2625</dd></div>
      </dl>
    </section>

    <section class="about-contact" aria-labelledby="contact-heading">
      <h2 id="contact-heading">세계청년교류연합과 이야기 나누세요</h2>
      <p>단체 활동이나 참여, 교류·협력에 관한 문의는 공식 이메일로 보내주세요.</p>
      <div class="about-actions">
        <a class="contact-button" href="mailto:wyea@wyea.info">이메일로 문의하기 <span aria-hidden="true">↗</span></a>
        <RouterLink to="/financialreport">재정보고 보기 →</RouterLink>
      </div>
    </section>
  </article>
</template>

<style scoped>
.about-page {
  max-width: 1080px;
  margin: 0 auto;
  padding: 140px 32px 48px;
  font-family: 'PretendardFont', sans-serif;
  color: #344052;
}
.about-heading { text-align: center; margin-bottom: 56px; }
.eyebrow { color: #0d47a1; letter-spacing: .18em; font-size: 13px; font-weight: 700; margin-bottom: 14px; }
h1 { font-size: clamp(32px, 3vw, 48px); line-height: 1.3; font-weight: 700; margin: 0 0 12px; }
.english-name { font-size: 16px; color: #697586; margin-bottom: 22px; }
.lead { font-size: clamp(17px, 1.3vw, 21px); line-height: 1.7; margin: 0; word-break: keep-all; }
.about-card { background: #fff; border: 1px solid #dce7f5; border-radius: 16px; padding: 36px 40px; margin-bottom: 24px; box-shadow: 0 5px 20px rgba(35, 53, 70, .04); }
.section-label { display: block; color: #0d47a1; font-size: 13px; font-weight: 600; margin-bottom: 14px; }
h2 { font-size: clamp(21px, 1.6vw, 27px); line-height: 1.5; font-weight: 700; margin: 0 0 20px; word-break: keep-all; }
.about-card p, .about-contact p { font-size: 17px; line-height: 1.9; word-break: keep-all; overflow-wrap: anywhere; }
.about-card p:last-child { margin-bottom: 0; }
.history-card { scroll-margin-top: 120px; }
.history-list { list-style: none; padding: 0; margin: 28px 0 0; }
.history-entry { position: relative; display: grid; grid-template-columns: 165px 1fr; gap: 24px; margin-left: 6px; padding: 0 0 26px 28px; border-left: 2px solid #d0e2f7; font-size: 16px; line-height: 1.7; }
.history-entry:last-child { padding-bottom: 0; }
.history-entry::before { content: ''; position: absolute; left: -6px; top: 8px; width: 10px; height: 10px; border-radius: 50%; background: #0d47a1; }
.history-entry time { color: #0d47a1; font-weight: 600; }
.history-link { display: block; margin-top: 6px; font-size: 14px; }
.history-entry span { word-break: keep-all; overflow-wrap: anywhere; }
.organization-details { margin: 0; }
.organization-details > div { display: grid; grid-template-columns: 130px 1fr; gap: 20px; padding: 15px 0; border-bottom: 1px solid #e5edf8; font-size: 16px; line-height: 1.7; }
.organization-details > div:last-child { border-bottom: 0; }
dt { font-weight: 600; color: #526b8a; }
dd { margin: 0; overflow-wrap: anywhere; }
a { color: #0d47a1; text-underline-offset: 4px; }
a:focus-visible { outline: 2px solid #0d47a1; outline-offset: 5px; }
.about-contact { text-align: center; padding: 40px 12px 0; }
.about-actions { display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 24px; margin-top: 24px; }
.contact-button { background: #0d47a1; color: #fff; padding: 13px 24px; border-radius: 999px; text-decoration: none; font-weight: 600; }
.contact-button:hover { background: #093579; }
@media (max-width: 600px) {
  .about-page { padding: 112px 18px 32px; }
  .about-heading { margin-bottom: 32px; }
  .about-card { padding: 25px 22px; }
  .about-card p, .about-contact p { font-size: 15px; line-height: 1.85; }
  .organization-details > div { grid-template-columns: 80px 1fr; gap: 12px; font-size: 14px; }
  .history-entry { grid-template-columns: 1fr; gap: 4px; padding-left: 22px; font-size: 14px; }
}
</style>
