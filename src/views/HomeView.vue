<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import FloatingDecor, { type DecorItem } from '@/components/FloatingDecor.vue'

import backpack from '@/assets/image/backpack.png'
import camera from '@/assets/image/camera.png'
import carrier from '@/assets/image/carrier.png'
import charger from '@/assets/image/charger.png'
import coin from '@/assets/image/coin.png'
import compass from '@/assets/image/compass.png'
import headphones from '@/assets/image/headphones.png'
import mobile from '@/assets/image/mobile.png'
import passport from '@/assets/image/passport.png'
import pens from '@/assets/image/pens.png'
import sunglasses from '@/assets/image/sunglasses.png'
import wallet from '@/assets/image/wallet.png'
import sticker from '@/assets/image/sticker.png'
import bill from '@/assets/image/bill.png'
import map from '@/assets/image/map.png'
import LogoMarquee from '@/components/LogoMarquee.vue'

import busan from '@/assets/image/busan.svg'
import kyungnam from '@/assets/image/kyungnam.svg'
import inje from '@/assets/image/inje.svg'
import gyeongsang from '@/assets/image/gyeongsang.svg'
import yonsei from '@/assets/image/yonsei.svg'
import kyunghee from '@/assets/image/kyunghee.svg'
import woosongcollege from '@/assets/image/woosongcollege.svg'
import seoul from '@/assets/image/seoul.webp'
import masan from '@/assets/image/masan.png'

import HomeViewPhoto from '@/components/HomeViewPhoto.vue'
import SwipeCarousel from '@/components/SwipeCarousel.vue'
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

const QHD_DECOR: DecorItem[] = [
  { src: coin,     from: 'right',       right: '0%',   top: '30%', width: 186, rotZ: 70,  delay: .25 },
  { src: carrier,  from: 'top-right',   right: '-12%', top: '-30%', width: 944, rotZ: 70,  delay: .25 },
  { src: passport, from: 'right',       right: '7%',   top: '40%',  width: 266, rotZ: 20,  delay: .25 },
  { src: charger,  from: 'right',       right: '-3%',  top: '34%',  width: 399, rotZ: 30,  delay: .30 },
  { src: compass,  from: 'down',        right: '20%',  top: '0%',   width: 199, rotZ: 30,  delay: .25 },
  { src: bill,     from: 'up',          right: '6%',   top: '80%',  width: 266, rotZ: 30,  delay: .25 },
  { src: map,      from: 'bottom-right',right: '-17%', top: '40%',  width: 931, rotZ: 100, delay: .25 },

  { src: coin,     from: 'left',        left: '0%',    top: '50%',  width: 133, rotZ: 170, delay: .30 },
  { src: backpack, from: 'top-left',    left: '-6%',   top: '-5%',  width: 532, rotZ: 30,  delay: .25 },
  { src: camera,   from: 'down',        left: '8%',    top: '0%',   width: 292, rotZ: 110, delay: .25 },
  { src: pens,     from: 'left',        left: '6%',    top: '55%',  width: 199, rotZ: 0,   delay: .23 },
  { src: headphones,from:'left',        left: '0%',    top: '30%',  width: 332, rotZ: -50, delay: .27 },
  { src: mobile,   from: 'left',        left: '-4%',   top: '55%',  width: 266, rotZ: 45,  delay: .25 },
  { src: wallet,   from: 'bottom-left', left: '0%',    top: '80%',  width: 199, rotZ: -10, delay: .27 },
  { src: sunglasses,from:'left',        left: '1%',    top: '65%',  width: 266, rotZ: -10, delay: .23 },
  { src: sticker,  from: 'up',          left: '5%',    top: '80%',  width: 399, rotZ: 30,  delay: .25 },

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
  { src: woosongcollege },
  { src: masan },
]

const section1Ref = ref<HTMLElement | null>(null)
const section2Ref = ref<HTMLElement | null>(null)
const decorHidden = ref(false)
const footerVisible = ref(false)
const logoHeight = ref(60)
const marqueeGap = ref(56)
const decorItems = ref<DecorItem[]>(BASE_DECOR)

const year = new Date().getFullYear()

let section1IO: IntersectionObserver | null = null
let section2IO: IntersectionObserver | null = null
let section3IO: IntersectionObserver | null = null
let prevHidden = decorHidden.value
let initialized = false // 초기 1회 콜백 무시
let mql: MediaQueryList

const apply = () => {
  const isQHD = mql.matches
  decorItems.value = isQHD ? QHD_DECOR : BASE_DECOR
  logoHeight.value = isQHD ? 100 : 60  // QHD에서 크게
  marqueeGap.value = isQHD ? 90 : 56
}

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

    mql = window.matchMedia('(min-width: 2560px)')
    apply()
    mql.addEventListener('change', apply)
  }

  /* ===== 타임라인 1회 등장 IO ===== */
  // 항목별 스태거 지연 주입
  document.querySelectorAll<HTMLElement>('.section3-div2 li')
    .forEach((el, i) => el.style.setProperty('--d', `${i * 80}ms`))
  document.querySelectorAll<HTMLElement>('.section3-div3 li')
    .forEach((el, i) => el.style.setProperty('--d', `${i * 80}ms`))

  // 섹션 진입 시 한 번만 클래스 추가
  const section3 = document.querySelector('.section3')
  if (section3) {
    section3IO?.disconnect()
    section3IO = new IntersectionObserver((entries, obs) => {
      const e = entries[0]
      if (e?.isIntersecting) {
        section3.classList.add('reveal-start')
        obs.disconnect() // 한 번만 실행
      }
    }, {
      threshold: 0.3,
      rootMargin: '0px 0px -10% 0px',
    })
    section3IO.observe(section3)
  }
})

onBeforeUnmount(() => {
  section1IO?.disconnect()
  section2IO?.disconnect()
  section3IO?.disconnect()
  section1IO = null
  section2IO = null
  section3IO = null
  window.removeEventListener('scroll', onScroll)
  mql?.removeEventListener('change', apply)
})
</script>

<template>
  <HomeViewPhoto/>
  <section class="section1" ref="section1Ref">
    <div class="section1-div1">
      <img src="@/assets/image/wyea-logo.png" width="300" alt="wyea-logo">
      <h3>World Youth<br>Exchange Association</h3>
      <p>세계 청년 교류회</p>
      <a href="https://docs.google.com/forms/d/1hiR6G3eOuM7Ytx6ksI5VIW_4rrTz9FG2ee5IPoU6OgQ/edit" target="_blank" rel="noopener noreferrer">
        <button>가입하러 가기</button>
      </a>
    </div>
    <div class="section1-div2">
      <p>연합 지부</p>
      <LogoMarquee class="university-logo" :logos="logos" :duration="60" :gap="marqueeGap" :repeat="4" :logoHeight="logoHeight" :key="`${logoHeight}-${marqueeGap}`"
                   style="max-width: 800px; width: 100%; margin: 10px auto 0;"/>
    </div>
    <div class="section1-div3">
      <p>스크롤 해서 계속 보기 ↓</p>
    </div>
  </section>

  <FloatingDecor class="decor" :items="decorItems" :hidden="decorHidden"/>

  <section class="section2" ref="section2Ref">
    <div class="section2-div1">
      <h3>WYEA에서는 무엇을 하나요?</h3>
    </div>
    <div class="section2-div2">
      <div class="section2-card1">
        <img src="@/assets/image/clip.png" class="clip" alt="clip" style="--rot: 38deg;" />
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
        <img src="@/assets/image/clip.png" class="clip" alt="clip" style="--rot: 48deg;" />
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
  </section>

  <section class="section3">
    <div class="section3-div1">
      <h1>설립 역사</h1>
    </div>
    <div class="section3-divcontainer">
      <div class="section3-div2">
        <ul>
          <li>
            <span class="date">2025년 6월 25일</span>
            <span class="event">세계 청년 교류회 결성</span>
          </li>
          <li>
            <span class="date">2025년 6월 26일</span>
            <span class="event">경상국립대학교 지부 설립</span>
          </li>
          <li>
            <span class="date">2025년 6월 30일</span>
            <span class="event">인제대학교 지부 설립</span>
          </li>
          <li>
            <span class="date">2025년 7월 2일</span>
            <span class="event">미국 유학생 네트워크와 협력 체결</span>
          </li>
          <li>
            <span class="date">2025년 7월 3일</span>
            <span class="event">Kent Universtiy 지부 설립</span>
          </li>
          <li>
            <span class="date">2025년 7월 4일</span>
            <span class="event">경희대학교 지부 설립</span>
          </li>
          <li>
            <span class="date">2025년 7월 5일</span>
            <span class="event">서울대학교 지부 설립</span>
          </li>
        </ul>
      </div>
      <div class="section3-div3">
        <ul>
          <li>
            <span class="date">2025년 7월 7일</span>
            <span class="event">연세대학교 지부 설립</span>
          </li>
          <li>
            <span class="date">2025년 7월 14일</span>
            <span class="event">재일한국청년동맹과 협력 관계 체결</span>
          </li>
          <li>
            <span class="date">2025년 7월 17일</span>
            <span class="event">경남대학교 지부 설립</span>
          </li>
          <li>
            <span class="date">2025년 7월 25일</span>
            <span class="event">부산대학교 지부 설립</span>
          </li>
          <li>
            <span class="date">2025년 9월 2일</span>
            <span class="event">우송정보대학교 지부 설립</span>
          </li>
          <li>
            <span class="date">2025년 9월 17일</span>
            <span class="event">마산대학교 지부 설립</span>
          </li>
        </ul>
      </div>
    </div>
  </section>

  <section class="section4">
  </section>

  <footer class="footer" :class="{ show: footerVisible }">
    <div class="footer-top">
      <p>Address: 중구 명덕로 179, 2층 202-J153호</p>
      <p>
        Contact us: wyea@wyea.info · Fax: 053-289-2625
      </p>
    </div>
    <div class="footer-middle">
      <p>
        © {{ year }} WYEA · Icons by Freepik (flaticon.com) · <RouterLink to="/personalinformationprocessingpolicy">개인정보 처리방침</RouterLink> <br>
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
}

/* 섹션1 World Youth Exchange Association */
.section1-div1 h3 {
  line-height: 1.5;
  animation-delay: .12s;
  font-weight: 700;
  margin-bottom: 5%;
}

/* 섹션1 세계 청년 교류회 */
.section1-div1 p {
  animation-delay: .24s;
  font-weight: 700;
  font-size: 1.25rem;
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
  font-size:16px;
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
  font-size:12px;
}

/* ===== QHD 이상 (2560px 이상) ===== */
@media (min-width: 2560px) {
  .section1-div1 img {
    width: 50%;
  }

  .section1-div1 h3 {
    font-size: 500%;
  }

  .section1-div1 p {
    font-size: 225%;
  }

  .section1-div1 button {
    font-size: 150%;
  }

  .section1-div2 p {
    font-size: 150%;
  }

  .university-logo {
    width: 200% !important;
    max-width: 1200px !important; /* max-width 때문에 안 늘어나면 제거 가능 */
  }

  .section1-div3 p {
    font-size: 125%;
  }
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
    margin-top: 80px; /* 모바일에서 더 여백 */
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
  gap: 4rem;        /* 카드 사이 간격 */
  padding: 4rem;    /* 화면 테두리와 카드 사이 여백 */
  font-family: 'PretendardFont', sans-serif;
  z-index: 0;
}

.section2-div1 h3 {
  font-weight: 700;
  margin-bottom: 60px;
}

.section2-div2 {
  display: flex;
  justify-content: center; /* 가운데 정렬 */
  gap: 20px;               /* 카드 사이 간격 */
  flex-wrap: wrap;         /* 화면이 좁으면 줄바꿈 */
}

/* 카드1 이미지 */
.section2-card1 img {
  position: absolute;
  width: 200px;
  top: -16%;
  left: -12%;
  z-index: 2;
  user-select: none;
  -webkit-user-drag: none;
}

/* 카드1 본체 */
.section2-card1 {
  flex: 1 1 450px;   /* 최소 450px, 공간 있으면 늘어남 */
  max-width: 550px;  /* 카드 최대 폭 */
  min-height: 400px; /* 세로 최소 높이 */
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  padding: 2rem;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  position: relative;
  z-index: 1;
}

.section2-card1:hover {
  transform: translateY(-6px);
  box-shadow: 0 8px 20px rgba(0,0,0,0.15);
}

.section2-card1 h4 {
  text-align: center;
  font-weight: 700;
}

.section2-card1 h4::after {
  content: '';
  display: block;
  width: 40px;
  height: 4px;
  background: #0d47a1; /* 포인트 색상 */
  margin: 0.5rem auto 0;
  border-radius: 2px;
}

.section2-card1 p {
  text-align: left;
  margin-top: 25px;
  margin-left: 40px;
  margin-right: 40px;
  font-weight: 400;
  font-size: 1.1rem;
  line-height: 1.8;
}

/* 카드2 이미지 */
.section2-card2 img {
  position: absolute;
  width: 200px;
  top: -16%;
  left: -11%;
  user-select: none;
  -webkit-user-drag: none;
}

/* 카드2 본체 */
.section2-card2 {
  flex: 1 1 450px;   /* 최소 450px, 공간 있으면 늘어남 */
  max-width: 550px;  /* 카드 최대 폭 */
  min-height: 400px; /* 세로 최소 높이 */
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  padding: 2rem;
  text-align: left;  /* 가운데 정렬 (원하면 left로 변경) */
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  position: relative;
  z-index: 1;
}

.section2-card2:hover {
  transform: translateY(-6px);
  box-shadow: 0 8px 20px rgba(0,0,0,0.15);
}

.section2-card2 h4 {
  text-align: center;
  font-weight: 700;
}

.section2-card2 h4::after {
  content: '';
  display: block;
  width: 40px;
  height: 4px;
  background: #0d47a1; /* 포인트 색상 */
  margin: 0.5rem auto 0;
  border-radius: 2px;
}

.section2-card2 ul {
  padding-left: 1.2rem;
  line-height: 1.8;
}

.section2-card2 li {
  list-style: "✔ ";
  color: #333;
  margin-top: 15px;
  font-weight: 400;
  font-size: 1.1rem;
}

/* 클립 애니메이션 초기 상태 */
.section2 .clip {
  --clip-d: 0ms;
  opacity: 0;
  transform: rotate(var(--rot, 0deg)) translateY(-24px);
  transition:
    transform .7s cubic-bezier(.2,.8,.2,1),
    opacity   .7s cubic-bezier(.2,.8,.2,1);
  transition-delay: var(--clip-d, 0ms);
  will-change: transform, opacity;
}

/* 섹션2가 보이면 1회만 아래로 내려오며 나타남 */
.section2.clip-start .clip {
  opacity: 1;
  transform: rotate(var(--rot, 0deg)) translateY(0);
}

/* ===== QHD 이상 (2560px 이상) ===== */
@media (min-width: 2560px) {

  .section2 {
    min-height: calc(80vh - var(--header-h, 64px));
    gap: 5.32rem;
    padding: 5.32rem;
  }

  .section2-div1 h3 {
    font-size: 63px;
    margin-bottom: 80px;
    margin-top: 60px;
  }

  .section2-card1 img {
    width: 266px;
  }

  .section2-card1 {
    flex: 1 1 598px;
    max-width: 731px;
    min-height: 532px;
    padding: 2.66rem;
  }

  .section2-card1 h4 {
    font-size: 45px;
  }

  .section2-card1 h4::after {
    width: 53px;
    margin: 0.665rem auto 0;
  }

  .section2-card1 p {
    font-size: 30px;
  }

  .section2-card2 img {
    width: 266px;
  }

  .section2-card2 {
    flex: 1 1 598px;
    max-width: 731px;
    min-height: 532px;
    padding: 2.66rem;
  }

  .section2-card2 h4 {
    font-size: 45px;
  }

  .section2-card2 h4::after {
    width: 53px;
    margin: 0.665rem auto 0;
  }

  .section2-card2 li {
    margin-top: 20px;
    font-size: 25px;
  }
}

/* ===== 모바일 (1024px 이하) ===== */
@media (max-width: 1024px) {

  .section2-div1 h3 {
    font-size: 28px;
  }

  .section2-card1 img {
    display: none;
  }

  .section2-card1 {
    min-height: 300px;
  }

  .section2-card1 p {
    margin-left: 10px;
    margin-right: 10px;
  }

  .section2-card2 img {
    display: none;
  }

  .section2-card2 {
    min-height: 300px;
  }

  .section2-div2 h4 {
    font-size: 28px;
  }

  .section2-div2 p {
    font-size: 14px;
  }

  .section2-div2 li {
    font-size: 14px;
  }
}

/*-------------------------------section3---------------------------------*/
:root {
  --d: 0ms;
}

.section3 {
  background: linear-gradient(180deg, #f9fcff 0%, #ffffff 30%, #f0f7ff 100%);
  padding: 60px 20px;
  text-align: center;
  border-bottom-left-radius: 20px;   /* 왼쪽 아래만 둥글게 */
  border-bottom-right-radius: 20px;  /* 오른쪽 아래만 둥글게 */
  box-shadow: 0 18px 32px rgba(0,0,0,.18);
  font-family: 'PretendardFont', sans-serif;
}

.section3-div1 h1 {
  font-size: 4rem;
  font-weight: 700;
  margin-bottom: 60px;
  color: #0d47a1;
}

.section3-divcontainer {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  max-width: 1200px;
  margin: 0 auto;
  text-align: left;
}

.section3-div2 {
  display: flex;
  align-items: center; /* 세로 중앙 */
  padding-right: clamp(16px, 6vw, 200px); /* 오른쪽 여백 */
}

.section3-div2 ul li {
  opacity: 0;
  transform: translateY(22px);
  filter: blur(2px);
  transition:
    opacity .6s ease,
    transform .6s ease,
    filter .6s ease;
  transition-delay: var(--d, 0ms);
  margin-bottom: 30px;
  padding-left: 50px;
  position: relative;
}

.section3-div3 {
  display: flex;
  align-items: center;  /* 세로 중앙 */
}

.section3-div3 ul li {
  opacity: 0;
  transform: translateY(22px);
  filter: blur(2px);
  transition:
    opacity .6s ease,
    transform .6s ease,
    filter .6s ease;
  transition-delay: calc(var(--d, 0ms) + 800ms);  /* 늦게 작동 */
  margin-bottom: 30px;
  padding-left: 50px;
  position: relative;
}

.section3 ul {
  list-style: none;
  margin: 0 auto;
  padding: 0;
  max-width: 600px;
  text-align: left;
  position: relative;
}

.section3 ul::before {
  content: '';
  position: absolute;
  left: 19px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #d0e2f7;
}

/* 트리거 후: 자연스럽게 나타남 */
.section3.reveal-start li {
  opacity: 1;
  transform: translateY(0);
  filter: blur(0);
}

.section3 ul li::before {
  content: '';
  position: absolute;
  left: 12px;
  top: 5px;
  width: 16px;
  height: 16px;
  background: #0d47a1;
  border-radius: 50%;
}

/* 왼쪽 타임라인 점 색상 단계 */
.section3-div2 ul li:nth-child(1)::before { background: #0d47a1; }
.section3-div2 ul li:nth-child(2)::before { background: #1c59af; }
.section3-div2 ul li:nth-child(3)::before { background: #2a6cbd; }
.section3-div2 ul li:nth-child(4)::before { background: #387ecc; }
.section3-div2 ul li:nth-child(5)::before { background: #4790da; }
.section3-div2 ul li:nth-child(6)::before { background: #56a3e8; }
.section3-div2 ul li:nth-child(7)::before { background: #64b5f6; }

/* 오른쪽 타임라인 점 색상 단계 */
.section3-div3 ul li:nth-child(1)::before { background: #64b5f6; }
.section3-div3 ul li:nth-child(2)::before { background: #42a5f5; }
.section3-div3 ul li:nth-child(3)::before { background: #2196f3; }
.section3-div3 ul li:nth-child(4)::before { background: #1e88e5; }
.section3-div3 ul li:nth-child(5)::before { background: #1976d2; }
.section3-div3 ul li:nth-child(6)::before { background: #0d47a1; }

.section3 ul .date {
  display: block;
  font-weight: 600;
  color: #0d47a1;
  margin-bottom: 4px;
}

.section3 ul .event {
  color: #333;
  line-height: 1.4;
}

.section3 ul span {
  text-align: left;
  font-size: 17px;
  font-weight: 500;
}

/* ===== QHD 이상 (2560px 이상) ===== */
@media (min-width: 2560px) {
  .section3-div1 h1 {
    font-size: 5.32rem;
  }

  .section3-divcontainer {
    max-width: 1596px;
  }


  .section3-div2 ul li,
  .section3-div3 ul li {
    margin-bottom: 40px;
    padding-left: 66px;
  }

  .section3 ul span {
    font-size: 30px;
  }
}

/* ===== 모바일 (1024px 이하) ===== */
@media (max-width: 1024px) {
  .section3-div1 h1 {
    font-size: 30px; /* 모바일에서 다른 크기 */
  }

  .section3-divcontainer {
    grid-template-columns: 1fr;
  }

  .section3-div3 {
    padding-right: clamp(16px, 3vw, 200px); /* 오른쪽 여백 */
  }

  .section3 ul span {
    font-size: 15px;
    font-weight: 500;
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
  font-size: 14px;
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
}

/* ===== middle 영역 ===== */
.footer .footer-middle p {
  margin: 4px 0;
  font-size: 12px;
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
  height: 30px;
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

/* ===== QHD 이상 (2560px 이상) ===== */
@media (min-width: 2560px) {

  .footer .footer-top p {
    font-size: 19px;
  }

  .footer .footer-middle p {
    font-size: 16px;
  }

  .footer .footer-logo {
    height: 40px;
  }
}

/* ===== 모바일 (1024px 이하) ===== */
@media (max-width: 1500px) {
  .footer {
    clip-path: inset(0 0 0 0 round 0 0 0 0);
  }
}
</style>
