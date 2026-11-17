<template>
  <div class="app">
    <header id="site-header" ref="headerRef" class="glass-header" :class="{ scrolled: isScrolled }" @keydown.esc="mobileMenuOpen = false">
      <div class="inner">
        <div class="brand">
          <RouterLink to="/">
            <img src="@/assets/image/wyea-logo-home.png" alt="WYEA" height="24" />
          </RouterLink>
        </div>
        <nav id="site-navigation" class="nav" :class="{ 'is-open': mobileMenuOpen }" aria-label="주요 메뉴" @click="mobileMenuOpen = false">
          <RouterLink to="/about">단체소개</RouterLink>
          <RouterLink to="/notices" :class="{ 'news-active': isNewsSection }">알림공간</RouterLink>
          <RouterLink class="report-menu" to="/financialreport">재정보고</RouterLink>
<!--          <RouterLink to="/blog">Blog</RouterLink>-->
<!--          <RouterLink to="/guides">Guides</RouterLink>-->
        </nav>
        <div class="actions">
          <RouterLink class="join-action" to="/join"><span class="join-label-full">회원 가입 신청</span><span class="join-label-mobile">가입 신청</span></RouterLink>
<!--          <RouterLink class="btn ghost" to="/login">Log in</RouterLink>-->
<!--          <RouterLink class="btn solid" to="/register">Sign up</RouterLink>-->
        </div>
        <button class="menu-toggle" type="button" aria-controls="site-navigation" :aria-expanded="mobileMenuOpen" :aria-label="mobileMenuOpen ? '메뉴 닫기' : '메뉴 열기'" @click="mobileMenuOpen = !mobileMenuOpen">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
        <div class="language-switch" :class="{ 'is-korean': language === 'ko' }" role="group" :aria-label="language === 'ko' ? '언어 선택' : 'Language selection'">
          <button type="button" aria-label="English" :aria-pressed="language === 'en'" @click="setLanguage('en')">EN</button>
          <button type="button" aria-label="Korean" :aria-pressed="language === 'ko'" @click="setLanguage('ko')">KO</button>
        </div>
      </div>
    </header>
    <main
      class="page"
      :class="routeName"
      :style="{ background: pageBg }"
    >

      <RouterView v-slot="{ Component, route: pageRoute }">
        <div
          v-if="pageRoute.name === 'about' || pageRoute.name === 'financialreport' || pageRoute.name === 'activities' || pageRoute.name === 'notices' || pageRoute.meta.activityDetail || pageRoute.meta.noticeDetail"
          :key="pageRoute.path"
          class="page-entrance"
        >
          <component :is="Component" />
        </div>
        <component :is="Component" v-else />
      </RouterView>
    </main>
    <SiteFooter v-if="footerVisible" />
  </div>
</template>


<script setup lang="ts">
import SiteFooter from '@/components/SiteFooter.vue'
import { useRoute } from 'vue-router'
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue'
import { language, setLanguage, restoreLanguage, installPageTranslation } from '@/i18n/language'

const route = useRoute()
let pageTranslation: ReturnType<typeof installPageTranslation> | null = null
watch(language, () => pageTranslation?.render())
const headerRef = ref<HTMLElement | null>(null)
const mobileMenuOpen = ref(false)
const onOutsidePointerDown = (event: PointerEvent) => {
  if (!headerRef.value?.contains(event.target as Node)) mobileMenuOpen.value = false
}
watch(() => route.fullPath, () => { mobileMenuOpen.value = false })
const isNewsSection = computed(() => /^\/(?:notices|activities)(?:\/|$)/.test(route.path))
// 라우트 이름 -> 기존처럼 class에 써서 페이지별 CSS도 가능
const routeName = computed(() => String(route.name ?? ''))

// ✅ 메타에 bg가 문자열이면 그대로, 없으면 기본값(#fff)
type PageMeta = { bg?: string } // 배경은 문자열(단색/그라디언트 모두 가능)
const pageBg = computed(() => {
  const m = route.meta as PageMeta
  return typeof m.bg === 'string' ? m.bg : '#fff'
})

const footerVisible = computed(() => route.meta.footer !== false)

const isScrolled = ref(false)
const onScroll = () => (isScrolled.value = window.scrollY > 6)

onMounted(() => {
  pageTranslation = installPageTranslation()
  void restoreLanguage()
  window.addEventListener('scroll', onScroll, { passive: true })
  document.addEventListener('pointerdown', onOutsidePointerDown)
})
onBeforeUnmount(() => {
  pageTranslation?.disconnect()
  window.removeEventListener('scroll', onScroll)
  document.removeEventListener('pointerdown', onOutsidePointerDown)
})
</script>

<style scoped>
@keyframes pageEntrance {
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: translateY(0); }
}

.page-entrance {
  display: flow-root;
  animation: pageEntrance 480ms cubic-bezier(.22, .61, .36, 1) both;
}

@media (prefers-reduced-motion: reduce) {
  .page-entrance { animation: none; }
}

:global(:root) {
  --header-h: 64px;
}
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

:global(html),
:global(body),
:global(#app) {
  height: 100%;
  margin: 0;
}

* {
  box-sizing: border-box;
}

.glass-header {
  position: fixed;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  width: min(clamp(1100px, 57.15vw, 1463px), calc(100% - 28px));
  z-index: 1000;

  background: linear-gradient(180deg, rgba(255,255,255,.7), rgba(255,255,255,.6));
  backdrop-filter: blur(10px) saturate(160%);
  -webkit-backdrop-filter: blur(10px) saturate(160%);

  border-radius: 999px;
  border: 1px solid rgba(0,0,0,.06);
  box-shadow: 0 10px 30px rgba(0,0,0,.12), inset 0 1px 0 rgba(255,255,255,.7);
  transition: background .25s ease, box-shadow .25s ease;
}

.glass-header.scrolled {
  background: rgba(255,255,255,.9);
  box-shadow: 0 12px 34px rgba(0,0,0,.16), inset 0 1px 0 rgba(255,255,255,.9);
}

.inner {
  height: clamp(56px, 3.52vw, 90px);
  padding: 0 16px;
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  align-items: center;
  gap: 12px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 800;
  color: #0d47a1;
  text-decoration: none;
}

.brand img {
  margin-top: 10px;
  width: clamp(90px, 4.65vw, 119px);
  height: auto;
}

.nav {
  display: flex;
  justify-content: flex-start;
  gap: 22px;
}

.nav a {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: clamp(16px, .94vw, 24px);   /* 데스크톱 폰트 */
  line-height: 1;
  height: 40px;      /* 클릭 영역 높이 */
  padding: 0 14px;
  border-radius: 12px;
  font-weight: 700;
  color: #1f2937;
  opacity: .95;
  letter-spacing: .01em;
}

.nav a.router-link-active,
.nav a.news-active {
  color: #0d47a1;
  background: rgba(13,71,161,.08);
  box-shadow: inset 0 0 0 1px rgba(13,71,161,.12);
  opacity: 1;
}

.nav a:hover {
  opacity: 1;
  background: rgba(13,71,161,.06);
}

.actions {
  display: flex;
  gap: 10px;
  align-items: center;
}
.language-switch {
  position: relative;
  flex: none;
  display: grid;
  grid-template-columns: 1fr 1fr;
  width: 84px;
  height: 40px;
  padding: 3px;
  border: 1px solid rgba(13,71,161,.22);
  border-radius: 999px;
  background: rgba(255,255,255,.72);
}
.language-switch::before {
  content: '';
  position: absolute;
  top: 3px;
  bottom: 3px;
  left: 3px;
  width: calc((100% - 6px) / 2);
  border-radius: 999px;
  background: #0d47a1;
  box-shadow: 0 2px 6px rgba(13,71,161,.2);
  transition: transform .2s ease;
}
.language-switch.is-korean::before { transform: translateX(100%); }
.language-switch button {
  position: relative;
  z-index: 1;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: #0d47a1;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
}
.language-switch button[aria-pressed="true"] { color: #fff; }
.language-switch button:focus-visible { outline: 2px solid #0d47a1; outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) {
  .language-switch::before { transition: none; }
}
.join-label-mobile { display: none; }
.join-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  width: 200px;
  padding: 0 16px;
  border-radius: 999px;
  background: #0d47a1;
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  text-decoration: none;
  white-space: nowrap;
}
.join-action:hover { background: #083776; }
.join-action:focus-visible { outline: 2px solid #0d47a1; outline-offset: 3px; }
.menu-toggle { display: none; }
@media (max-width: 600px) {
  .glass-header { top: 10px; width: calc(100% - 24px); border-radius: 999px; }
  .inner { height: 56px; padding: 0 12px; grid-template-columns: auto 1fr auto auto; gap: 8px; }
  .brand { grid-column: 1; }
  .brand img { width: 88px; margin-top: 0; }
  .actions { grid-column: 2; justify-self: end; }
  .language-switch { grid-column: 4; width: 70px; height: 32px; }
  .language-switch button { font-size: 10px; }
  .join-label-full { display: none; }
  .join-label-mobile { display: inline; }
  .join-action { width: 76px; min-height: 32px; padding: 0 6px; font-size: 12px; }
  .menu-toggle { display: grid; grid-column: 3; place-items: center; width: 40px; height: 40px; padding: 0; border: 0; border-radius: 12px; background: transparent; color: #1f2937; cursor: pointer; }
  .menu-toggle svg { width: 24px; height: 24px; stroke: currentColor; stroke-width: 2; stroke-linecap: round; }
  .menu-toggle:hover, .menu-toggle[aria-expanded="true"] { background: rgba(13,71,161,.08); color: #0d47a1; }
  .menu-toggle:focus-visible { outline: 2px solid #0d47a1; outline-offset: 2px; }
  .nav { display: none; position: absolute; top: calc(100% + 8px); left: 0; right: 0; flex-direction: column; gap: 2px; padding: 8px; border: 1px solid rgba(0,0,0,.06); border-radius: 18px; background: rgba(255,255,255,.97); box-shadow: 0 12px 30px rgba(0,0,0,.14); }
  .nav.is-open { display: flex; }
  .nav a { width: 100%; min-height: 44px; height: auto; justify-content: flex-start; padding: 0 14px; font-size: 15px; white-space: nowrap; }
}
@media (max-width: 380px) {
  .brand img { width: 72px; }
  .join-action { width: 64px; font-size: 11px; }
  .actions { gap: 5px; }
}

/* 페이지 컨텐츠 영역 */
.page {
  position: relative;
  z-index: 0;
  min-height: 120vh; /* 충분히 길게 */
}

</style>
