<template>
  <div class="marquee" :style="rootStyle" aria-label="partners">
    <div class="strip" ref="stripRef">
      <!-- 세트 단위로 repeat 번 반복 -->
      <div class="set" v-for="s in props.repeat" :key="s">
        <div v-for="(logo, i) in props.logos" :key="i" class="item">
          <img :src="logo.src" :alt="logo.alt || ''" :style="imgStyle(logo)" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'

type Logo = { src: string; alt?: string; width?: number; height?: number }

const props = withDefaults(defineProps<{
  logos: Logo[]
  /** 전체(모든 세트) 한 바퀴 시간(초). 세트당 시간은 duration/repeat */
  duration?: number
  gap?: number
  logoHeight?: number
  /** 마우스 올리면 멈춤(옵션) — RAF 방식이라 기본은 미사용 */
  pauseOnHover?: boolean
  repeat?: number
}>(), {
  duration: 30,
  gap: 48,
  logoHeight: 26,
  pauseOnHover: true,
  repeat: 4,
})

const rootStyle = {
  '--gap': `${props.gap}px`,
  '--h': `${props.logoHeight}px`,
} as Record<string, string>

const imgStyle = (l: Logo) => ({
  height: l.height ? `${l.height}px` : `var(--h)`,
  width: l.width ? `${l.width}px` : 'auto',
})

const stripRef = ref<HTMLDivElement | null>(null)
let rafId = 0
let lastTs = 0
let x = 0 // 현재 translateX
let pxPerSec = 0  // 초당 이동 픽셀
const EPS = 0.5 // 서브픽셀/안티알리아싱 보정

function measureFirstSetAdvance(): number {
  // 첫 세트가 완전히 빠져나가는 데 필요한 이동량 = 세트 폭 + 뒤쪽 gap
  const strip = stripRef.value
  if (!strip) return 0
  const firstSet = strip.querySelector<HTMLElement>('.set')
  if (!firstSet) return 0

  const cs = getComputedStyle(strip)
  const gap = parseFloat(cs.columnGap || cs.gap) || 0
  const w = firstSet.getBoundingClientRect().width
  return Math.ceil(w + gap)
}

function computeSpeed() {
  // 세트당 지속시간 = 전체 duration / repeat
  const oneSetDuration = (props.duration || 30) / Math.max(1, props.repeat || 1)
  const advance = measureFirstSetAdvance()
  if (advance > 0) {
    pxPerSec = advance / Math.max(0.001, oneSetDuration)
  }
}

function recycleFirstSet() {
  const strip = stripRef.value
  if (!strip) return
  const firstSet = strip.querySelector('.set')
  if (firstSet) strip.appendChild(firstSet)
}

function tick(ts: number) {
  const strip = stripRef.value
  if (!strip) {
    rafId = requestAnimationFrame(tick)
    return
  }
  if (!lastTs) lastTs = ts
  const dt = (ts - lastTs) / 1000
  lastTs = ts

  x -= pxPerSec * dt

  // 세트 폭 + gap 만큼 완전히 지나간 시점에만 재배치
  let advance = measureFirstSetAdvance()
  while (advance > 0 && x <= -advance + EPS) {
    x += advance
    recycleFirstSet()
    advance = measureFirstSetAdvance() // 반응형/이미지 로드 후 폭 변화를 반영
  }

  strip.style.transform = `translateX(${x}px)`
  rafId = requestAnimationFrame(tick)
}

function start() {
  stop()
  lastTs = 0
  x = 0
  computeSpeed()
  rafId = requestAnimationFrame(tick)
}
function stop() {
  if (rafId) cancelAnimationFrame(rafId)
  rafId = 0
}

onMounted(() => {
  // 이미지 레이아웃/폭 계산이 끝난 뒤 시작
  setTimeout(start, 0)

  const ro = new ResizeObserver(() => computeSpeed())
  if (stripRef.value) ro.observe(stripRef.value)

  onBeforeUnmount(() => {
    stop()
    ro.disconnect()
  })
})

watch(() => [props.duration, props.gap, props.logos, props.repeat], () => start(), { deep: true })
</script>

<style scoped>
.marquee{
  --gap: 48px;
  --h: 26px;

  position: relative;
  overflow: hidden;

  /* 선택: 끝단 페이드 */
  --fade: linear-gradient(to right, transparent 0, #000 8%, #000 92%, transparent 100%);
  mask-image: var(--fade);
  -webkit-mask-image: var(--fade);

  /* padding은 컨테이너로 옮겨 측정 오차 제거 */
  padding-block: 20px;
  padding-inline: calc(var(--gap) / 2);

  user-select: none;
  -webkit-user-drag: none;
}

/* strip은 JS로 translateX만 */
.strip{
  display: inline-flex;
  gap: var(--gap);
  will-change: transform;
}

/* 세트 컨테이너: 세트 단위로 이동/재배치 */
.set{
  display: inline-flex;
  gap: var(--gap);
  flex: none; /* 수축/줄바꿈 방지 */
}

.item{ flex: none; }
.item img{
  display: block;
  height: var(--h);
  width: auto;
  opacity: .65;
  filter: grayscale(100%);
  transition: opacity .2s ease;
}
.item img:hover{ opacity: 1; }
</style>
