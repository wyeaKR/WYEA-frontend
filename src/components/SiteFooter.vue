<script setup lang="ts">
defineProps<{ floating?: boolean; visible?: boolean }>()

const year = new Date().getFullYear()
</script>

<template>
  <footer class="site-footer" :class="{ 'is-floating': floating, 'is-visible': visible }">
    <div class="site-footer-grid">
      <p class="site-footer-name">세계청년교류연합 (WYEA) · 대표 이창현</p>
      <p>(51436) 경남 창원시 성산구 용호동 73-19 · 고유번호 410-82-93357</p>
      <div class="site-footer-contact">
        <p>
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="m3.5 7 8.5 6 8.5-6"/></svg>
          E. <a href="mailto:wyea@wyea.info">wyea@wyea.info</a>
        </p>
        <p>
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3.5c-5.2 0-9.5 3.3-9.5 7.4 0 2.6 1.8 4.9 4.5 6.2l-1 3.4 4.3-2.4c.6.1 1.1.1 1.7.1 5.2 0 9.5-3.3 9.5-7.3S17.2 3.5 12 3.5Z"/></svg>
          카카오톡 채널 준비 중
        </p>
        <a class="site-footer-instagram" href="https://www.instagram.com/wyea_official/" target="_blank" rel="noopener noreferrer" aria-label="WYEA 인스타그램">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle class="instagram-dot" cx="17.5" cy="6.5" r="1"/></svg>
          인스타그램
        </a>
      </div>
    </div>
    <div class="site-footer-bottom">
      <span>© {{ year }} WYEA</span>
      <RouterLink to="/personalinformationprocessingpolicy">개인정보 처리방침</RouterLink>
      <RouterLink to="/report">참가 기록 제출</RouterLink>
    </div>
    <p class="site-footer-note">대학 로고와 명칭은 각 대학의 자산이며, 식별 목적에 한해 사용됩니다.</p>
  </footer>
</template>

<style scoped>
.site-footer {
  width: 100%;
  margin-top: 100px;
  padding: 24px max(20px, calc((100vw - 1280px) / 2));
  background: #fff;
  border-top: 1px solid #ddd;
  color: #303a45;
  font-family: 'PretendardFont', sans-serif;
  font-size: 14px;
  line-height: 1.55;
}
.site-footer p { margin: 0; }
.site-footer-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 1.5fr) minmax(0, 1fr);
  gap: 24px;
  align-items: start;
}
.site-footer-name { font-weight: 700; color: #172a3d; }
.site-footer a { color: inherit; text-decoration: none; }
.site-footer a:hover { color: #0d47a1; text-decoration: underline; }
.site-footer-contact { display: grid; gap: 7px; }
.site-footer-contact p,
.site-footer-instagram { display: inline-flex; align-items: center; gap: 6px; }
.site-footer-contact svg {
  width: 17px;
  height: 17px;
  flex: 0 0 auto;
  stroke: currentColor;
  stroke-width: 1.7;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.site-footer-contact .instagram-dot { fill: currentColor; stroke: none; }
.site-footer-bottom {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  max-width: 1280px;
  margin: 20px auto 0;
  padding-top: 14px;
  border-top: 1px solid #e7ebef;
  color: #52606e;
}
.site-footer-bottom > * + *::before { content: '·'; margin-right: 10px; }
.site-footer-note { max-width: 1280px; margin: 5px auto 0 !important; color: #667583; font-size: 12px; }
.site-footer.is-floating {
  position: fixed;
  left: 0;
  bottom: 0;
  z-index: 30;
  margin-top: 0;
  transform: translateY(100%);
  transition: transform .4s ease;
  border-radius: 16px 16px 0 0;
  box-shadow: 0 -8px 24px rgba(0,0,0,.1);
}
.site-footer.is-floating.is-visible { transform: translateY(0); }
@media (max-width: 1023px) {
  .site-footer-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .site-footer-contact { grid-column: 1 / -1; grid-template-columns: repeat(3, max-content); gap: 18px; }
}
@media (max-width: 767px) {
  .site-footer { padding: 22px 18px; text-align: center; }
  .site-footer-grid { grid-template-columns: 1fr; gap: 12px; }
  .site-footer-contact { grid-column: auto; grid-template-columns: 1fr; justify-items: center; gap: 8px; }
  .site-footer-bottom { justify-content: center; }
  .site-footer.is-floating { max-height: 70vh; overflow-y: auto; }
}
@media (prefers-reduced-motion: reduce) {
  .site-footer.is-floating { transition: none; }
}
</style>
