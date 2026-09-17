<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import FloatingDecor, { type DecorItem } from '@/components/FloatingDecor.vue'

import LogoMarquee from '@/components/LogoMarquee.vue'

import busan from '@/assets/image/busan.svg'
import kyungnam from '@/assets/image/kyungnam.svg'
import inje from '@/assets/image/inje.svg'
import gyeongsang from '@/assets/image/gyeongsang.svg'
import yonsei from '@/assets/image/yonsei.svg'
import kyunghee from '@/assets/image/kyunghee.svg'
import seoul from '@/assets/image/seoul.webp'
import masan from '@/assets/image/masan.png'

import HomeViewPhoto from '@/components/HomeViewPhoto.vue'
import SwipeCarousel from '@/components/SwipeCarousel.vue'

const decorativeImage = (name: string) => `${import.meta.env.BASE_URL}images/decorative/${name}`
const backpack = decorativeImage('backpack.png')
const camera = decorativeImage('camera.png')
const carrier = decorativeImage('carrier.png')
const charger = decorativeImage('charger.png')
const coin = decorativeImage('coin.png')
const compass = decorativeImage('compass.png')
const headphones = decorativeImage('headphones.png')
const mobile = decorativeImage('mobile.png')
const passport = decorativeImage('passport.png')
const pens = decorativeImage('pens.png')
const sunglasses = decorativeImage('sunglasses.png')
const wallet = decorativeImage('wallet.png')
const sticker = decorativeImage('sticker.png')
const bill = decorativeImage('bill.png')
const map = decorativeImage('map.png')
const clip = decorativeImage('clip.png')

/**
 * 홈 메인 이미지
 */
const BASE_DECOR: DecorItem[] = [
  { src: coin, from: 'right', right: '0%', top: '30%', width: 140, rotZ:70, delay: .25 },
  { src: carrier, from: 'top-right', right: '-12%', top: '-30%', width: 710, rotZ:70, delay: .25 },
  { src: passport, from: 'right',  right: '7%', top: '40%',  width: 200, rotZ:20, delay: .25 },
  { src: charger, from: 'right',  right: '-3%', top: '34%', width: 300, rotZ:30, delay: .30 },
  { src: compass, from: 'down',  right: '20%', top: '0%',  width: 150, rotZ:30, delay: .25 },
  { src: bill, from: 'up',  right: '6%', top: '80%',  width: 200, rotZ:30, delay: .25 },
  { src: map, from: 'bottom-right',  right: '-17%', top: '40%',  width: 700, rotZ:100, delay: .25 },

  { src: coin, from: 'left', left: '0%', top: '50%', width: 100, rotZ:170, delay: .30 },
  { src: backpack, from: 'top-left',  left: '-6%', top: '-5%',  width: 400, rotZ:30, delay: .25 },
  { src: camera, from: 'down',  left: '8%', top: '0%',  width: 220, rotZ:110, delay: .25 },
  { src: pens, from: 'left',  left: '6%', top: '55%',  width: 150, rotZ:0, delay: .23 },
  { src: headphones, from: 'left',  left: '0%', top: '30%',  width: 250, rotZ:-50, delay: .27 },
  { src: mobile, from: 'left',  left: '-4%', top: '55%',  width: 200, rotZ:45, delay: .25 },
  { src: wallet, from: 'bottom-left',  left: '0%', top: '80%',  width: 150, rotZ:-10, delay: .27 },
  { src: sunglasses, from: 'left',  left: '1%', top: '65%',  width: 200, rotZ:-10, delay: .23 },
  { src: sticker, from: 'up',  left: '5%', top: '80%',  width: 300, rotZ:30, delay: .25 },
]
/**
 * 협력 대학 로고
 */
const logos = [
  { src: gyeongsang },
  { src: inje },
  { src: kyunghee },
  { src: seoul },
  { src: yonsei },
  { src: kyungnam },
  { src: busan },
  { src: masan },
]

const section1Ref = ref<HTMLElement | null>(null)
const section2Ref = ref<HTMLElement | null>(null)
const decorHidden = ref(false)
const footerVisible = ref(false)
const decorItems = ref<DecorItem[]>(BASE_DECOR)

const year = new Date().getFullYear()
const handleJoinClick = () => {
  window.alert('지금은 가입 시즌이 아닙니다.')
}

let section1IO: IntersectionObserver | null = null
let section2IO: IntersectionObserver | null = null
let prevHidden = decorHidden.value
let initialized = false // 초기 1회 콜백 무시
const onScroll = () => {
  const scrollTop = window.scrollY
  const windowHeight = window.innerHeight
  const docHeight = document.documentElement.scrollHeight
  const scrollable = docHeight - windowHeight // 전체 스크롤 가능 높이
  const progress = scrollTop / scrollable // 스크롤 진행률 (0~1)
  footerVisible.value = progress >= 0.95  // 95% 이상 내려오면 footer 보이기
}

onMounted(async () => {
  /* ===== 배경데코 토글 IO ===== */
  const rootStyles = getComputedStyle(document.documentElement)
  const headerH = parseFloat(rootStyles.getPropertyValue('--header-h')) || 64

  const HIDE_AT = 0.8
  const SHOW_AT = 0.7

  await nextTick() // DOM 렌더 보장

  section1IO?.disconnect()
  section1IO = new IntersectionObserver(
    (entries: IntersectionObserverEntry[]) => {
      const entry = entries[0]
      if (!entry) return

      const r = entry.intersectionRatio
      if (!initialized) { initialized = true; return }

      let nextHidden = prevHidden
      if (!prevHidden && r < HIDE_AT) nextHidden = true
      else if (prevHidden && r > SHOW_AT) nextHidden = false

      if (nextHidden !== prevHidden) {
        decorHidden.value = nextHidden
        prevHidden = nextHidden
      }
    },
    {
      threshold: [0, 0.5, 0.8, 0.9, 1],
      rootMargin: `-${headerH}px 0px 0px 0px`,
    }
  )
  if (section1Ref.value) section1IO.observe(section1Ref.value)
  window.addEventListener('scroll', onScroll, { passive: true })

  /* ===== (B) 클립1회 등장 IO ===== */
  // 스태거 지연값 주입
  section2Ref.value?.querySelectorAll<HTMLElement>('.clip')
    .forEach((el, i) => el.style.setProperty('--clip-d', `${i * 120}ms`))
  // IO 등록 (1회만)
  if (section2Ref.value) {
    section2IO?.disconnect()
    section2IO = new IntersectionObserver((entries, obs) => {
      const e = entries[0]
      if (e?.isIntersecting) {
        section2Ref.value!.classList.add('clip-start')
        obs.disconnect() // 한 번만
      }
    }, {
      threshold: 0.4,
      rootMargin: '0px 0px 0px 0px' // 아래쪽 여유 주기
    })
    section2IO.observe(section2Ref.value)

  }


})

onBeforeUnmount(() => {
  section1IO?.disconnect()
  section2IO?.disconnect()
  section1IO = null
  section2IO = null
  window.removeEventListener('scroll', onScroll)
})
</script>

<template>
  <HomeViewPhoto/>
  <section class="section1" ref="section1Ref">
    <div class="section1-div1">
      <img src="@/assets/image/wyea-logo.png" width="300" alt="wyea-logo">
      <h3>World Youth<br>Exchange Association</h3>
      <p class="organization-name">세계청년교류연합</p>
      <p class="organization-intro">청년들의 국제 교류와 협력을 위한 <strong>비영리단체</strong></p>
      <!-- 가입 시즌 재개 시 아래 Google Forms 링크를 다시 사용할 수 있습니다.
      <a href="https://docs.google.com/forms/d/1hiR6G3eOuM7Ytx6ksI5VIW_4rrTz9FG2ee5IPoU6OgQ/edit" target="_blank" rel="noopener noreferrer">
        <button>가입하러 가기</button>
      </a>
      -->
      <button type="button" @click="handleJoinClick">가입하러 가기</button>
    </div>
    <div class="section1-div2">
      <p>연합 지부</p>
      <LogoMarquee class="university-logo" :logos="logos" :duration="60" :repeat="4"
                   :gap="'clamp(36px, 3vw, 90px)'"
                   :logoHeight="'clamp(48px, 4vw, 100px)'"
                   style="max-width: 800px; width: 100%; margin: 10px auto 0;"/>
    </div>
    <div class="section1-div3">
      <p>스크롤 해서 계속 보기 ↓</p>
    </div>
  </section>

  <FloatingDecor class="decor" :items="decorItems" :hidden="decorHidden"/>

  <section class="section2" ref="section2Ref">
    <div class="section2-inner">
      <div class="section2-div1">
        <h3>WYEA에서는 무엇을 하나요?</h3>
      </div>
      <div class="section2-div2">
      <div class="section2-card1">
        <img :src="clip" class="clip" alt="clip" style="--rot: 38deg;" />
          <h4>설립 배경</h4>
        <SwipeCarousel>
          <template #item-0>
            <p>
              21세기는 IT 기술의 눈부신 발전으로 인해,
              소통의 범위가 국가와 개인을 넘어 전 세계로 확대되었습니다.
            </p>
          </template>

          <template #item-1>
            <p>
              이제 우리는 언제 어디서든 쉽게 연락할 수 있지만,
              여전히 언어 장벽과 물리적 거리라는 한계를 실감합니다.
            </p>
          </template>

          <template #item-2>
            <p>
              이러한 글로벌 시대에 걸맞은 단체가 필요하다고 느껴,
              세계청년교류연합을 설립하게 되었습니다.
            </p>
          </template>
        </SwipeCarousel>
      </div>
      <div class="section2-card2">
        <img :src="clip" class="clip" alt="clip" style="--rot: 48deg;" />
        <h4>주요 활동</h4>
        <ul>
          <li>해외 봉사 프로젝트</li>
          <li>어학, 자격증, 취업 등 스터디와 튜터링</li>
          <li>해외 취업 컨설팅</li>
          <li>공동 프로젝트</li>
          <li>정기 총회·오픈 포럼</li>
        </ul>
      </div>
    </div>
    </div>
  </section>

  <section class="section4">
  </section>

  <footer class="footer" :class="{ show: footerVisible }">
    <div class="footer-top">
      <p>비영리단체 세계청년교류연합(WYEA)</p>
      <p><a class="footer-email" href="mailto:wyea@wyea.info">wyea@wyea.info</a> · 고유번호: 410-82-93357</p>
    </div>
    <div class="footer-middle">
      <p>
        © {{ year }} WYEA · <RouterLink to="/about">단체소개</RouterLink> · <RouterLink to="/personalinformationprocessingpolicy">개인정보 처리방침</RouterLink> <br>
        Icons by Freepik (flaticon.com)<br>
        대학 로고와 명칭은 각 대학의 자산이며, 식별 목적에 한해 사용됩니다.
      </p>
    </div>
    <div class="footer-bottom">
      <a href="https://www.instagram.com/wyea_official/" target="_blank" rel="noopener noreferrer">
        <img src="@/assets/image/instaricon.png" class="footer-logo" alt="instagram"/>
      </a>
      <a href="mailto:wyea@wyea.info" target="_blank" rel="noopener noreferrer">
        <img src="@/assets/image/mailicon.png" class="footer-logo" alt="maili"/>
      </a>
      <a href="https://open.kakao.com/o/sFkgaWQh" target="_blank" rel="noopener noreferrer">
        <img src="@/assets/image/kakaoicon.png" class="footer-logo" alt="kakao"/>
      </a>
      <a href="https://x.com/wyea_official" target="_blank" rel="noopener noreferrer">
        <img src="@/assets/image/twitter.png" class="footer-logo" alt="kakao"/>
      </a>
    </div>
  </footer>

</template>

<style scoped>
* {
  box-sizing: border-box;
}

/* 공통 애니메이션 */
@keyframes slidePop {
  0%   { opacity:0; transform: translateY(24px) scale(0.98); }
  60%  { opacity:1; transform: translateY(-4px) scale(1.02); }
  100% { opacity:1; transform: translateY(0) scale(1); }
}

.section1 {
  background: linear-gradient(180deg, #f0f7ff 0%, #ffffff 50%, #f9fcff 100%);
  position: relative;
  display: flex;
  flex-direction: column;          /* 아이템을 세로 방향으로 쌓음 */
  place-items: center;
  justify-content: center;         /* 가로 중앙 */
  align-items: center;             /* 세로 중앙 */
  text-align: center;              /* 텍스트 가운데 정렬 */
  min-height: calc(100vh - var(--header-h, 64px));  /* 화면 높이 - 헤더 높이 */
  pointer-events: none;            /* 버튼만 클릭 가능하게 다시 켜줘도 됨 */
  padding: 16px;                   /* 안쪽 여백 */
  overflow-x: clip;                /* 섹션 안에서 넘침 차단 */
  font-family: 'PretendardFont', sans-serif;
}

/* 중앙 카피 애니메이션 (슬라이드 튀어나옴) */
.section1-div1 {
  --intro-font-size: clamp(15px, .9375vw, 24px);
  --intro-line-height: calc(var(--intro-font-size) * 1.5);
  max-width: 100%;
}

.section1-div1 > * {
  opacity: 0;
  transform: translateY(24px) scale(0.98);
  animation: slidePop .6s cubic-bezier(.2,.8,.2,1) forwards;
}

/* 섹션1 로고 이미지 */
.section1-div1 img {
  animation-delay: .10s;
  user-select: none;
  -webkit-user-drag: none;
  margin-top: 50px;
  width: clamp(300px, 17vw, 600px);
}

/* 섹션1 World Youth Exchange Association */
.section1-div1 h3 {
  line-height: 1.5;
  animation-delay: .12s;
  font-weight: 700;
  /* Use the existing title gap to make room for the introduction. */
  margin-bottom: max(0px, calc(5% - var(--intro-line-height) - 4px));
  font-size: clamp(30px, 2.6vw, 80px);
}

/* 섹션1 세계청년교류연합 */
.section1-div1 p {
  animation-delay: .24s;
  font-weight: 700;
  font-size: clamp(20px, 1.5vw, 42px);
}

.section1-div1 .organization-name {
  margin-bottom: 4px;
}

.section1-div1 .organization-intro {
  margin: 0 auto 16px;
  max-width: 100%;
  font-size: var(--intro-font-size);
  line-height: var(--intro-line-height);
  font-weight: 500;
  color: #3f4d60;
  word-break: keep-all;
  text-wrap: balance;
}

.section1-div1 .organization-intro strong {
  font-weight: 700;
  color: #2d6a4f;
}

/* 섹션1 가입하러 가기 버튼 */
.section1-div1 button {
  animation-delay: .36s;
  pointer-events: auto;
  background:#000;
  color:#fff;
  padding:12px 20px;
  border-radius:999px;
  font-weight:700;
  border:none;
  cursor:pointer;
  box-shadow:0 6px 18px rgba(0,0,0,.12);
  font-size: clamp(14px, 1vw, 24px);
}

/* 섹션1 연합 지부 영역 전체 */
.section1-div2 > * {
  opacity: 0;
  transform: translateY(24px) scale(0.98);
  animation: slidePop .6s cubic-bezier(.2,.8,.2,1) forwards;
}

.section1-div2 {
  margin-top: 60px;
}

/* 섹션1 연합 지부 텍스트 */
.section1-div2 p {
  color:#7a7a7a;
  font-weight: 700;
  font-size: clamp(15px, 1vw, 24px);
  margin-bottom: 8px;
}

/* 섹션1 스크롤 안내 */
.section1-div3 {
  margin-top: 60px;
}

/* 섹션1 스크롤 해서 계속 보기 */
.section1-div3 p {
  color: #afafaf;
  font-weight: 500;
  font-size: clamp(12px, .8vw, 20px);
}

/* ===== 모바일 (1024px 이하) ===== */
@media (max-width: 1024px) {
  /* 모바일에서 데코 비활성화 */
  .decor {
    display: none !important;
  }

  .section1-div1 h3 {
    font-size: 30px;  /* 모바일용 헤더 크기 */
  }

  .section1-div1 p {
    font-size: 20px;  /* 모바일용 서브텍스트 크기 */
  }

  .section1-div2 {
    margin-top: 48px; /* Reserve room for the introduction wrapping on mobile. */
  }

  .section1-div2 p {
    font-size: 15px;
  }

  .section1-div3 {
    margin-bottom: 10px;
  }
}

/*-------------------------------section2---------------------------------*/
.section2 {
  background: linear-gradient(180deg, #f9fcff 0%, #ffffff 30%, #f0f7ff 100%);
  display: block;
  text-align: center;
  min-height: calc(100vh - var(--header-h, 64px));
  /* One CSS pixel at FHD; every card dimension shares this scale. */
  --section2-unit: max(0.65px, 0.0520833333vw);
  border-radius: 0 0 calc(20 * var(--section2-unit)) calc(20 * var(--section2-unit));
  box-shadow: 0 18px 32px rgba(0,0,0,.18);
  padding: calc(64 * var(--section2-unit)) 24px;
  font-family: 'PretendardFont', sans-serif;
  z-index: 0;
}

.section2-inner {
  width: calc(1120 * var(--section2-unit));
  max-width: 100%;
  margin: 0 auto;
}

.section2-div1 h3 {
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: calc(60 * var(--section2-unit));
  margin-top: 0;
  font-size: calc(42.24 * var(--section2-unit));
}

.section2-div2 {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: calc(20 * var(--section2-unit));
}

/* 카드1 이미지 */
.section2-card1 img {
  position: absolute;
  width: calc(200 * var(--section2-unit));
  top: -16%;
  left: -12%;
  z-index: 2;
  user-select: none;
  -webkit-user-drag: none;
}

/* 카드1 본체 */
.section2-card1 {
  width: 100%;
  max-width: none;
  min-height: calc(400 * var(--section2-unit));
  background: #fff;
  border-radius: calc(12 * var(--section2-unit));
  box-shadow: 0 calc(4 * var(--section2-unit)) calc(12 * var(--section2-unit)) rgba(0,0,0,0.08);
  padding: calc(32 * var(--section2-unit));
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  position: relative;
  z-index: 1;
}

.section2-card1:hover {
  transform: translateY(-6px);
  box-shadow: 0 8px calc(20 * var(--section2-unit)) rgba(0,0,0,0.15);
}

.section2-card1 h4 {
  text-align: center;
  font-weight: 700;
  line-height: 1.2;
  font-size: calc(29.952 * var(--section2-unit));
}

.section2-card1 h4::after {
  content: '';
  display: block;
  width: calc(40 * var(--section2-unit));
  height: calc(4 * var(--section2-unit));
  background: #0d47a1;
  margin: calc(8 * var(--section2-unit)) auto 0;
  border-radius: calc(2 * var(--section2-unit));
}

.section2-card1 p {
  text-align: center;
  line-height: 1.5;
  margin-bottom: calc(16 * var(--section2-unit));
  margin-top: calc(25 * var(--section2-unit));
  margin-left: calc(40 * var(--section2-unit));
  margin-right: calc(40 * var(--section2-unit));
  font-weight: 400;
  font-size: calc(19.968 * var(--section2-unit));
}

/* 카드2 이미지 */
.section2-card2 img {
  position: absolute;
  width: calc(200 * var(--section2-unit));
  top: -16%;
  left: -11%;
  user-select: none;
  -webkit-user-drag: none;
}

/* 카드2 본체 */
.section2-card2 {
  width: 100%;
  max-width: none;
  min-height: calc(400 * var(--section2-unit));
  background: #fff;
  border-radius: calc(12 * var(--section2-unit));
  box-shadow: 0 calc(4 * var(--section2-unit)) calc(12 * var(--section2-unit)) rgba(0,0,0,0.08);
  padding: calc(32 * var(--section2-unit));
  text-align: left;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  position: relative;
  z-index: 1;
}

.section2-card2:hover {
  transform: translateY(-6px);
  box-shadow: 0 8px calc(20 * var(--section2-unit)) rgba(0,0,0,0.15);
}

.section2-card2 h4 {
  text-align: center;
  font-weight: 700;
  line-height: 1.2;
  font-size: calc(29.952 * var(--section2-unit));
}

.section2-card2 h4::after {
  content: '';
  display: block;
  width: calc(40 * var(--section2-unit));
  height: calc(4 * var(--section2-unit));
  background: #0d47a1;
  margin: calc(8 * var(--section2-unit)) auto 0;
  border-radius: calc(2 * var(--section2-unit));
}

.section2-card2 ul {
  padding-left: calc(19.2 * var(--section2-unit));
  line-height: 1.8;
}

.section2-card2 li {
  list-style: "✔ ";
  color: #333;
  margin-top: calc(15 * var(--section2-unit));
  font-weight: 400;
  font-size: calc(17.6 * var(--section2-unit));
}

/* 클립 애니메이션 초기 상태 */
.section2 .clip {
  --clip-d: 0ms;
  opacity: 0;
  transform: rotate(var(--rot, 0deg)) translateY(-24px);
  transition:
    transform .7s cubic-bezier(.2,.8,.2,1),
    opacity .7s cubic-bezier(.2,.8,.2,1);
  transition-delay: var(--clip-d, 0ms);
  will-change: transform, opacity;
}

/* 섹션2가 보이면 1회만 아래로 내려오며 나타남 */
.section2.clip-start .clip {
  opacity: 1;
  transform: rotate(var(--rot, 0deg)) translateY(0);
}

/* ===== 모바일 (1024px 이하) ===== */
.section2 :deep(.nav) {
  width: calc(36.096 * var(--section2-unit));
  height: calc(36.096 * var(--section2-unit));
  font-size: calc(13.333 * var(--section2-unit));
}
.section2 :deep(.nav.prev) { left: calc(-10 * var(--section2-unit)); }
.section2 :deep(.nav.next) { right: calc(-10 * var(--section2-unit)); }
.section2 :deep(.dots) {
  bottom: calc(8 * var(--section2-unit));
  gap: calc(8 * var(--section2-unit));
}
.section2 :deep(.dots > button) {
  width: calc(8.256 * var(--section2-unit));
  height: calc(8.256 * var(--section2-unit));
  padding: 0;
}

@media (max-width: 1024px) {
  .section2 {
    --section2-unit: 1px;
    padding: 4rem 24px;
  }

  .section2-inner {
    width: calc(100% - 32px);
    transform: none;
  }

  .section2-div2 {
    grid-template-columns: 1fr;
  }

  .section2-div1 h3 {
    font-size: 28px;
  }

  .section2-card1 img,
  .section2-card2 img {
    display: none;
  }

  .section2-card1,
  .section2-card2 {
    min-height: 300px;
  }

  .section2-card1 p {
    margin-left: 10px;
    margin-right: 10px;
  }

  .section2-div2 h4 {
    font-size: 28px;
  }

  .section2-div2 p,
  .section2-div2 li {
    font-size: 14px;
  }
}

/*-------------------------------section4---------------------------------*/
.section4 {
  position: relative;
  min-height: calc(100vh - var(--header-h, 64px));
  pointer-events: none;
}
/*-------------------------------footer---------------------------------*/
.footer {
  background: #fff;
  padding: 20px;
  text-align: center;
  border-top: 1px solid #ddd;
  font-size: calc((14px) * 0.93);
  line-height: 1.6;

  position: fixed;
  bottom: -200px; /* footer 높이보다 더 아래 */
  left: 0;
  width: 100%;
  transition: bottom 0.4s ease; /* 애니메이션 */
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  clip-path: inset(0 37% 0 37% round 64px 64px 0 0);
}

.footer.show {
  bottom: 0; /* show 클래스가 붙으면 나타남 */
}

/* ===== top 영역 ===== */
.footer .footer-top p {
  color: #000;
  margin: 2px 0;
  font-weight: bold;
  font-size: calc((clamp(14px, calc(.72vw + .18px), 19px)) * 0.93);
}

/* ===== middle 영역 ===== */
.footer .footer-top .registration-number {
  font-weight: bold;
}

.footer .footer-email { color: inherit; font-weight: inherit; text-decoration: none; }
.footer .footer-email:hover { text-decoration: underline; }

.footer .footer-middle p {
  margin: 4px 0;
  font-size: calc((clamp(12px, .625vw, 16px)) * 0.93);
  color: #666;
  line-height: 1.6;
}

.footer .footer-middle a {
  color: inherit;
  text-decoration: none;
  position: relative;
  padding: 0 2px;
  transition: color 0.2s ease;
}

.footer .footer-middle a::after {
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

.footer .footer-middle a:hover {
  color: #000;
}

.footer .footer-middle a:hover::after {
  transform: scaleX(1);
  transform-origin: left;
}

/* ===== bottom 영역 ===== */
.footer .footer-bottom {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 32px;
  user-select: none;
  -webkit-user-drag: none;

  position: relative;
  max-width: 720px;
  margin: 16px auto 0;
  padding: 0 20px;
  z-index: 1;
}

.footer .footer-logo {
  height: clamp(30px, 1.5625vw, 40px);
  filter: grayscale(100%);
  opacity: 0.9;
}

.footer .footer-links a {
  color: #444;
  text-decoration: none;
}

.footer .footer-links a:hover {
  text-decoration: underline;
}

.footer .footer-links a:visited {
  color: #444;
}

/* ===== 모바일 (1024px 이하) ===== */
@media (max-width: 1500px) {
  .footer {
    clip-path: inset(0 0 0 0 round 0 0 0 0);
  }
}

/* The desktop footer uses the same FHD scale as the activity photos. */
@media (min-width: 1501px) {
  .footer {
    --footer-unit: calc(100vw / 1920);
    padding: calc(20 * var(--footer-unit));
    bottom: calc(-200 * var(--footer-unit));
    font-size: calc((calc(14 * var(--footer-unit))) * 0.93);
    clip-path: inset(0 37% 0 37% round calc(64 * var(--footer-unit)) calc(64 * var(--footer-unit)) 0 0);
  }

  .footer.show { bottom: 0; }

  .footer .footer-top p {
    margin: calc(2 * var(--footer-unit)) 0;
    font-size: calc((calc(14.004 * var(--footer-unit))) * 0.93);
  }

  .footer .footer-middle p {
    margin: calc(4 * var(--footer-unit)) 0;
    font-size: calc((calc(12 * var(--footer-unit))) * 0.93);
  }

  .footer .footer-bottom {
    gap: calc(32 * var(--footer-unit));
    max-width: calc(720 * var(--footer-unit));
    margin-top: calc(16 * var(--footer-unit));
    padding: 0 calc(20 * var(--footer-unit));
  }

  .footer .footer-logo { height: calc(30 * var(--footer-unit)); }
}
</style>
