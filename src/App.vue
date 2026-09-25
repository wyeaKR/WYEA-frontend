<template>
  <div class="app">
    <header id="site-header" class="glass-header" :class="{ scrolled: isScrolled }">
      <div class="inner">
        <div class="brand">
          <RouterLink to="/">
            <img src="@/assets/image/wyea-logo-home.png" alt="WYEA" height="24" />
          </RouterLink>
        </div>
        <nav class="nav">
          <RouterLink to="/about">단체소개</RouterLink>
          <RouterLink to="/activities">활동소식</RouterLink>
          <RouterLink class="report-menu" to="/FinancialReport">재정보고</RouterLink>
<!--          <RouterLink to="/blog">Blog</RouterLink>-->
<!--          <RouterLink to="/guides">Guides</RouterLink>-->
        </nav>
        <div class="actions">
<!--          <RouterLink class="btn ghost" to="/login">Log in</RouterLink>-->
<!--          <RouterLink class="btn solid" to="/register">Sign up</RouterLink>-->
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
          v-if="pageRoute.name === 'about' || pageRoute.name === 'financialreport' || pageRoute.name === 'activities' || pageRoute.meta.activityDetail"
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
import { useRoute } from 'vue-router'
import { ref, onMounted, onBeforeUnmount, computed  } from 'vue'
import SiteFooter from '@/components/SiteFooter.vue'

const route = useRoute()
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
  window.addEventListener('scroll', onScroll, { passive: true })
})
onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
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
  grid-template-columns: auto 1fr auto;
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

.nav a.router-link-active {
  color: #0d47a1;
  background: rgba(13,71,161,.08);
  box-shadow: inset 0 0 0 1px rgba(13,71,161,.12);
  opacity: 1;
}

.nav a:hover {
  opacity: 1;
  background: rgba(13,71,161,.06);
}

@media (max-width: 600px) {
  .inner { padding: 0 10px; gap: 4px; }
  .nav { gap: 2px; }
  .nav a { padding: 0 8px; font-size: 14px; white-space: nowrap; }
}

@media (max-width: 380px) {
  .nav a { padding: 0 5px; font-size: 12px; }
  .brand img { width: 72px; }
}

.actions {
  display: flex;
  gap: 10px;
}

/* 페이지 컨텐츠 영역 */
.page {
  position: relative;
  z-index: 0;
  min-height: 120vh; /* 충분히 길게 */
}


</style>
