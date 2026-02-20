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
          <RouterLink class="report-menu" to="/FinancialReport">재정보고</RouterLink>
<!--          <RouterLink to="/about">About</RouterLink>-->
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

      <RouterView />
    </main>
    <footer v-if="footerVisible" class="frfooter">
      <div class="frfooter-top">
        <p>Address: 중구 명덕로 179, 2층 202-J153호</p>
        <p>contact us: wyea@wyea.info · Fax: 053-289-2625</p>
      </div>
      <div class="frfooter-middle">
        <p>
          © {{ year }} WYEA · Icons by Freepik (flaticon.com) · <RouterLink to="/personalinformationprocessingpolicy">개인정보 처리방침</RouterLink> <br>
          대학 로고와 명칭은 각 대학의 자산이며, 식별 목적에 한해 사용됩니다.
        </p>
      </div>
      <div class="frfooter-bottom">
        <a href="https://www.instagram.com/wyea_official/" target="_blank" rel="noopener noreferrer">
          <img src="@/assets/image/instaricon.png" class="frfooter-logo" alt="instagram"/>
        </a>
        <a href="mailto:wyea@wyea.info" target="_blank" rel="noopener noreferrer">
          <img src="@/assets/image/mailicon.png" class="frfooter-logo" alt="maili"/>
        </a>
        <a href="https://open.kakao.com/o/sFkgaWQh" target="_blank" rel="noopener noreferrer">
          <img src="@/assets/image/kakaoicon.png" class="frfooter-logo" alt="kakao"/>
        </a>
        <a href="https://x.com/wyea_official" target="_blank" rel="noopener noreferrer">
          <img src="@/assets/image/twitter.png" class="frfooter-logo" alt="kakao"/>
        </a>
      </div>
    </footer>
  </div>
</template>


<script setup lang="ts">
import { useRoute } from 'vue-router'
import { ref, onMounted, onBeforeUnmount, computed  } from 'vue'

const year = new Date().getFullYear()
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
  width: min(1100px, calc(100% - 28px));
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
  height: 56px;
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
  width: 90px;
  height: auto;
}

.nav {
  display: flex;
  justify-content: flex-end;
  gap: 22px;
}

.nav a {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;   /* 데스크톱 폰트 */
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

/* =========================
   Footer (Financial Report)
   ========================= */
.frfooter {
  background: #fff;
  padding: 20px;
  text-align: center;
  border-top: 1px solid #ddd;
  font-size: 14px;
  line-height: 1.6;

  position: static;
  width: 100%;
  margin-top: 100px;   /* 본문과 간격 */
}

.frfooter .frfooter-top p {
  color: #000;
  margin: 2px 0;
  font-weight: bold;
}

.frfooter .frfooter-middle p {
  margin: 4px 0;
  font-size: 12px;
  color: #666;
  line-height: 1.6;
}

.frfooter .frfooter-middle a {
  color: inherit;
  text-decoration: none;
  position: relative;
  padding: 0 2px;
  transition: color 0.2s ease;
}

.frfooter .frfooter-middle a::after {
  content: "";
  position: absolute;
  left: 0;
  bottom: -2px;
  width: 100%;
  height: 1px;
  background: currentColor;
  transform: scaleX(0);
  transform-origin: right;
  transition: transform 0.25s ease;
}

.frfooter .frfooter-middle a:hover {
  color: #000;
}

.frfooter .frfooter-middle a:hover::after {
  transform: scaleX(1);
  transform-origin: left;
}

.frfooter .frfooter-bottom {
  margin-top: 16px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 32px;
  user-select: none;
  -webkit-user-drag: none;
}

.frfooter .frfooter-logo {
  height: 30px;
  filter: grayscale(100%);
  opacity: .9;
}

/* ===== QHD 이상 (2560px 이상) ===== */
@media (min-width: 2560px) {
  .glass-header {
    width: min(1463px, calc(100% - 28px));
  }

  .nav .report-menu {
    font-size: 24px !important;
    font-weight: 800 !important;
  }

  .inner {
    height: 90px;  /* 세로 길이 늘리기 */
  }

  .brand img {
    width: 119px;
  }

  .frfooter .frfooter-top p {
    font-size: 18.62px;
  }

  .frfooter .frfooter-middle p {
    font-size: 16px;
  }

  .frfooter .frfooter-logo {
    height: 40px;
  }
}

/* ===== 모바일 (1500px 이하) ===== */
@media (max-width: 1500px) {
  .frfooter {
    clip-path: inset(0 0 0 0 round 0 0 0 0);
  }
}
</style>

