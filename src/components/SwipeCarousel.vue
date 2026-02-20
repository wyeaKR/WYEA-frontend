<template>
  <div class="swipe-wrap" ref="wrap" tabindex="0"
       @keydown.left.prevent="go(-1)"
       @keydown.right.prevent="go(1)">
    <!-- 좌우 화살표 -->
    <button class="nav prev" @click="go(-1)" :class="{disabled: index===0}" aria-label="이전">‹</button>

    <!-- 슬라이드 트랙 -->
    <div class="swipe-track" ref="track" @scroll.passive="onScroll">
      <div v-for="name in slideNames" :key="name" class="slide">
        <slot :name="name" />
      </div>
    </div>

    <button class="nav next" @click="go(1)" :class="{disabled: index===slideNames.length-1}" aria-label="다음">›</button>

    <!-- 점 네비 -->
    <div class="dots">
      <button v-for="(name,i) in slideNames" :key="name"
              :class="{ active: index === i }"
              @click="scrollTo(i)"
              :aria-label="`${i+1}번째`" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, useSlots, onMounted } from 'vue'

const slots = useSlots()

// "item-0", "item-1", ...만 집계 + 숫자순 정렬
const slideNames = computed(() =>
  Object.keys(slots)
    .filter(k => /^item-\d+$/.test(k))
    .sort((a, b) => Number(a.split('-')[1]) - Number(b.split('-')[1]))
)

const track = ref<HTMLDivElement | null>(null)
const wrap  = ref<HTMLDivElement | null>(null)
const index = ref(0)
let animating = false  // 스무스 스크롤 중 onScroll 무시용

/** ===== 전역 DOM 타입명을 쓰지 않는 로컬 타입 ===== */
type Listener =
  | ((evt: Event) => void)
  | { handleEvent: (evt: Event) => void }

type AddOpts = {
  capture?: boolean
  once?: boolean
  passive?: boolean
  signal?: AbortSignal
}

type ScrollEndTarget = EventTarget & {
  addEventListener(type: 'scrollend', listener: Listener, options?: boolean | AddOpts): void
}
/** ============================================== */

const scrollTo = (i: number) => {
  const el = track.value!
  const child = el.children[i] as HTMLElement | undefined
  if (!child) return

  animating = true
  index.value = i // 점 즉시 갱신
  el.scrollTo({ left: child.offsetLeft, behavior: 'smooth' })

  // 스크롤 종료 처리
  const end = () => { animating = false }

    // 지원되면 scrollend 사용(타입 안전, any 불필요)
  ;(el as unknown as ScrollEndTarget).addEventListener?.('scrollend', end, { once: true })

  // 폴백 타임아웃
  window.setTimeout(() => {
    if (animating) end()
  }, 600)
}

const onScroll = () => {
  if (animating) return
  const el = track.value!
  const w = el.clientWidth || 1
  index.value = Math.round(el.scrollLeft / w)
}

const go = (dir: number) => {
  const last = slideNames.value.length - 1
  const next = Math.max(0, Math.min(index.value + dir, last))
  scrollTo(next)
}

onMounted(() => { wrap.value?.focus?.() })
</script>



<style scoped>
/* 카드 내부 배치 기준 + dot 공간 확보 */
.swipe-wrap {
  position: relative;
  width: 100%;
  outline: none;
  padding-bottom: 37%;; /* dot 영역 높이 */
}

/* 수평 스와이프 영역 */
.swipe-track {
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}
.swipe-track::-webkit-scrollbar { display: none; }

/* 각 슬라이드(문단 1개씩) */
.slide {
  flex: 0 0 100%;
  min-width: 100%;
  scroll-snap-align: start;
  scroll-snap-stop: always;  /* 중간에서 멈추지 않게 */
}

/* 좌우 버튼: 카드 내부 세로 중앙 */
.nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 36px;
  height: 36px;
  border-radius: 999px;
  border: 0;
  background: rgba(255,255,255,.95);
  box-shadow: 0 2px 8px rgba(0,0,0,.15);
  cursor: pointer;
  z-index: 10;
  display: none; /* 모바일에선 숨기고 데스크톱에서 표시 */
}
.nav.prev { left: -10px; }
.nav.next { right: -10px; }
.nav.disabled { opacity: .35; pointer-events: none; }
@media (min-width: 1025px) {
  .nav { display: inline-flex; align-items: center; justify-content: center; }
}

/* 점: 카드 내부 하단 중앙 */
.dots {
  position: absolute;
  left: 50%;
  bottom: 8px;
  transform: translateX(-50%);
  display: flex;
  gap: .5rem;
  justify-content: center;
}
.dots > button {
  width: 8px; height: 8px;
  border-radius: 50%;
  border: 0;
  background: #cfd8dc;
  cursor: pointer;
}
.dots > button.active { background: #0d47a1; }
@media (min-width: 2560px) {
  /* 좌우 네비 버튼 확대 */
  .nav {
    width: 48px;
    height: 48px;
  }

  /* 도트 크기 확대 */
  .dots > button {
    width: 11px;
    height: 11px;
  }

  /* 도트 간격도 살짝 늘려주면 자연스러움 */
  .dots {
    gap: 0.75rem; /* 기본 .5rem → 약간 넓게 */
  }
}


</style>
