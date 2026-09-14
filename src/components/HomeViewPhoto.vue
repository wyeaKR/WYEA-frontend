<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

defineProps<{
  hidden?: boolean
}>()

const photos = [
  {
    src: new URL('@/assets/picture/LINE_ALBUM_2日目_251209_16.jpg', import.meta.url).href,
    alt: '2025년 상반기 정모1'
  },
  {
    src: new URL('@/assets/picture/KakaoTalk_20251210_171433166.jpg', import.meta.url).href,
    alt: '2025년 상반기 정모2'
  },
  {
    src: new URL('@/assets/picture/260829_1720_1_조영우.jpg', import.meta.url).href,
    alt: '260829_제2회한일음악교류회_WYEA_1'
  },
  {
    src: new URL('@/assets/picture/LINE_ALBUM_260829_260901_102.jpg', import.meta.url).href,
    alt: '260829_제2회한일음악교류회_WYEA_2'
  },
].map(photo => ({
  ...photo,
  // Pick once per mount so autoplay and re-renders keep each photo steady.
  tilt: `${(Math.random() < 0.5 ? -1 : 1) * (2 + Math.random() * 2)}deg`,
}))

const activeIndex = ref(0)
const leavingIndex = ref<number | null>(null)
const nextIndex = computed(() => photos.length > 1 ? (activeIndex.value + 1) % photos.length : -1)
let autoplay: ReturnType<typeof setInterval> | undefined
let transitionEnd: ReturnType<typeof setTimeout> | undefined

function showPhoto(index: number) {
  if (index === activeIndex.value || leavingIndex.value !== null) return
  leavingIndex.value = activeIndex.value
  activeIndex.value = index
  transitionEnd = setTimeout(() => { leavingIndex.value = null }, 850)
}
function startAutoplay() {
  clearInterval(autoplay)
  if (photos.length > 1) autoplay = setInterval(() => showPhoto(nextIndex.value), 5300)
}
function selectPhoto(index: number) {
  showPhoto(index)
  startAutoplay()
}
onMounted(startAutoplay)
onBeforeUnmount(() => {
  clearInterval(autoplay)
  clearTimeout(transitionEnd)
})
</script>

<template>
  <section class="hero">
    <div class="mat-ruler mat-ruler-top" aria-hidden="true">
      <span v-for="mark in 81" :key="mark" class="ruler-mark">
        <span v-if="(mark - 1) % 5 === 0">{{ mark - 1 }}</span>
      </span>
    </div>
    <div class="mat-ruler mat-ruler-left" aria-hidden="true">
      <span v-for="mark in 61" :key="mark" class="ruler-mark">
        <span v-if="(mark - 1) % 5 === 0">{{ mark - 1 }}</span>
      </span>
    </div>
    <div class="mat-label" aria-hidden="true">WYEA · CUTTING MAT</div>
    <section class="hvpsection1">
      <h1>활동 사진</h1>
    </section>

    <section class="hvpsection2">
      <div class="photo-swiper" role="region" aria-label="활동 사진">
        <div class="photo-item">
          <img
            v-for="(photo, idx) in photos"
            :key="photo.src"
            :src="photo.src"
            :alt="idx === activeIndex ? photo.alt : ''"
            :aria-hidden="idx !== activeIndex"
            :style="{ '--photo-tilt': photo.tilt }"
            :class="{
              'is-current': idx === activeIndex,
              'is-leaving': idx === leavingIndex,
              'is-next': idx === nextIndex && idx !== leavingIndex,
            }"
          />
        </div>
        <div v-if="photos.length > 1" class="photo-pagination">
          <button
            v-for="(photo, idx) in photos"
            :key="photo.src"
            type="button"
            :aria-label="`${idx + 1}번째 사진 보기`"
            :aria-current="idx === activeIndex"
            :class="{ active: idx === activeIndex }"
            @click="selectPhoto(idx)"
          />
        </div>
      </div>

      <p v-if="photos.length === 0" class="empty-text">
        아직 등록된 사진이 없습니다. 활동이 시작되면 사진이 추가될 예정입니다.
      </p>
    </section>
  </section>
</template>

<style scoped>
:global(.homeviewphoto.page) {
  background: #fff !important;
}

/* ================= Hero & Background ================= */
.hero > * { position: relative; z-index: 0; }
.hero {
  --cell: clamp(32px, calc(1.04vw + 12px), 42px);
  --ruler-inset: 24px;
  position: fixed;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  inset: var(--header-h, 64px) 0 0 0;
  z-index: -1;
  pointer-events: none;
}
.hero > section {
  width: 100%;
  flex-shrink: 0;
  /* Raise the content together without moving the background. */
  top: calc(-96 * var(--photo-unit, 1px));
}
.hero::before {
  --thin: rgba(255,255,255,.08);
  --bold: rgba(255,255,255,.14);
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: -1;
  background-image:
    linear-gradient(transparent calc(100% - 1px), var(--thin) 0),
    linear-gradient(90deg, transparent calc(100% - 1px), var(--thin) 0),
    linear-gradient(transparent calc(100% - 1px), var(--bold) 0),
    linear-gradient(90deg, transparent calc(100% - 1px), var(--bold) 0);
  background-size:
    var(--cell) var(--cell),
    var(--cell) var(--cell),
    calc(var(--cell) * 5) calc(var(--cell) * 5),
    calc(var(--cell) * 5) calc(var(--cell) * 5);
  background-position: var(--ruler-inset) var(--ruler-inset);
  opacity: .9;
  mix-blend-mode: overlay;
}
.hero::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  background-image: url('@/assets/noise.svg');
  opacity: .18;
  mix-blend-mode: soft-light;
}

/* ================= Title ================= */
.mat-ruler {
  position: absolute;
  display: flex;
  overflow: hidden;
  pointer-events: none;
  color: rgba(231, 239, 209, .48);
  font: 10px/1 ui-monospace, monospace;
  font-variant-numeric: tabular-nums;
}
.mat-ruler-top {
  top: 0;
  left: var(--ruler-inset);
  right: 0;
  height: var(--ruler-inset);
  align-items: flex-end;
  background: repeating-linear-gradient(90deg, rgba(231, 239, 209, .22) 0 1px, transparent 1px calc(var(--cell) / 5)) bottom / 100% 4px no-repeat;
}
.mat-ruler-left {
  top: var(--ruler-inset);
  left: 0;
  bottom: 0;
  width: var(--ruler-inset);
  flex-direction: column;
  align-items: flex-end;
  background: repeating-linear-gradient(180deg, rgba(231, 239, 209, .22) 0 1px, transparent 1px calc(var(--cell) / 5)) right / 4px 100% no-repeat;
}
.ruler-mark {
  position: relative;
  flex: 0 0 var(--cell);
}
.mat-ruler-top .ruler-mark {
  height: 8px;
  border-left: 1px solid rgba(231, 239, 209, .35);
}
.mat-ruler-left .ruler-mark {
  width: 8px;
  border-top: 1px solid rgba(231, 239, 209, .35);
}
.mat-ruler-top .ruler-mark:nth-child(5n + 1) { height: 13px; }
.mat-ruler-left .ruler-mark:nth-child(5n + 1) { width: 13px; }
.mat-ruler-top .ruler-mark > span {
  position: absolute;
  left: 4px;
  top: -8px;
}
.mat-ruler-left .ruler-mark > span {
  position: absolute;
  right: 6px;
  top: 7px;
}

.mat-label {
  position: absolute;
  right: calc(28 * var(--photo-unit, 1px));
  bottom: calc(24 * var(--photo-unit, 1px));
  color: rgba(231, 239, 209, .38);
  font: 10px/1.4 ui-monospace, monospace;
  letter-spacing: .16em;
  pointer-events: none;
  user-select: none;
}

@media (max-width: 1500px) {
  .mat-label {
    display: none;
  }
}

.hvpsection1 {
  font-family: 'PretendardFont', sans-serif;
}
.hvpsection1 h1 {
  margin-top: -10px;
  font-weight: 600;
  font-size: 60px;
  position: relative;
  background: #2d6a4f;
  box-shadow: 0 0 10px 3px #2d6a4f;
  padding: 0.5em 1em;
  display: inline-block;
}
@media (max-width: 1024px) {
  .hvpsection1 h1 {
    font-size: 30px;
  }
}
/* ================= Swiper Section ================= */
.hvpsection2 {
  margin-top: 0px;
  display: flex;
  justify-content: center;
}

/* Swiper 크기 */
/* A fixed stage keeps the title and pagination still between orientations. */
.photo-swiper {
  --frame-unit: var(--photo-unit, 1px);
  margin-top: -10px;
  position: relative;
  background: transparent;
  width: calc(820 * var(--frame-unit));
  max-width: 90%;
  padding-bottom: calc(40 * var(--frame-unit));
}
.photo-item {
  position: relative;
  isolation: isolate;
  height: min(calc(461.25 * var(--frame-unit)), 45vh);
}

/* Each print stays mounted and moves from the back to the front. */
.photo-item img {
  position: absolute;
  left: 50%;
  top: 50%;
  display: block;
  box-sizing: border-box;
  width: auto;
  height: auto;
  max-width: calc(100% - 64 * var(--frame-unit));
  max-height: calc(min(calc(461.25 * var(--frame-unit)), 45vh) - 64 * var(--frame-unit));
  object-fit: contain;
  border: calc(14 * var(--frame-unit)) solid #f7f5ed;
  border-bottom-width: calc(48 * var(--frame-unit));
  border-radius: calc(2 * var(--frame-unit));
  background: #f7f5ed;
  box-shadow: 0 calc(5 * var(--frame-unit)) calc(12 * var(--frame-unit)) rgba(10, 25, 18, .28);
  opacity: 0;
  z-index: 0;
  transform: translate(-50%, calc(-50% - 24 * var(--frame-unit))) rotate(var(--photo-tilt)) scale(.94);
  transition: transform 800ms cubic-bezier(.22,.61,.36,1), opacity 650ms ease, filter 800ms ease;
}
.photo-item img.is-next {
  opacity: 1;
  z-index: 1;
  filter: brightness(.92);
  transition-delay: 180ms;
}
.photo-item img.is-current {
  opacity: 1;
  z-index: 2;
  filter: brightness(1);
  transform: translate(-50%, -50%) rotate(var(--photo-tilt)) scale(1);
}
.photo-item img.is-leaving {
  opacity: 0;
  z-index: 3;
  transform: translate(calc(-50% - 80 * var(--frame-unit)), calc(-50% + 12 * var(--frame-unit))) rotate(calc(var(--photo-tilt) - 6deg));
}
.photo-pagination {
  position: absolute;
  bottom: calc(8 * var(--frame-unit));
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  gap: calc(8 * var(--frame-unit));
  pointer-events: auto;
}
.photo-pagination button {
  width: calc(8 * var(--frame-unit));
  height: calc(8 * var(--frame-unit));
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: #e7efd1;
  opacity: .35;
  cursor: pointer;
}
.photo-pagination button.active { opacity: .95; }
.photo-pagination button:focus-visible { outline: 2px solid #fff; outline-offset: 4px; }
@media (prefers-reduced-motion: reduce) {
  .photo-item img { transition-duration: 1ms; transition-delay: 0ms; }
}
@media (max-width: 1024px) {
  .photo-swiper { margin-top: 30px; }
}

/* Keep the FHD composition proportional at larger desktop widths. */
@media (min-width: 1025px) {
  .hero {
    --photo-unit: max(0.65px, 0.0520833333vw);
    --cell: calc(32 * var(--photo-unit));
    --ruler-inset: calc(24 * var(--photo-unit));
    inset: calc(64 * var(--photo-unit)) 0 0;
  }

  .hero::before {
    --cell: calc(32 * var(--photo-unit));
  }

  .hvpsection1 h1 {
    margin-top: calc(-10 * var(--photo-unit));
    font-size: calc(60 * var(--photo-unit));
    line-height: 1.6;
    letter-spacing: calc(-0.9375 * var(--photo-unit));
  }

  .photo-swiper {
    width: calc(820 * var(--photo-unit));
    margin-top: calc(-10 * var(--photo-unit));
    padding-bottom: calc(40 * var(--photo-unit));
  }

  .hvpsection1 h1 {
    box-shadow: 0 0 calc(10 * var(--photo-unit)) calc(3 * var(--photo-unit)) #2d6a4f;
  }

}
</style>
