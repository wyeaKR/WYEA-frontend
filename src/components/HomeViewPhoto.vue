<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

const paperclipSrc = `${import.meta.env.BASE_URL}images/decorative/clip.png`

defineProps<{
  hidden?: boolean
}>()

const photos = [
  {
    src: new URL('@/assets/picture/251102서울교류회1.jpg', import.meta.url).href,
    alt: '251102_서울교류회_1'
  },
  {
    src: new URL('@/assets/picture/251102서울교류회2.jpg', import.meta.url).href,
    alt: '251102_서울교류회_2'
  },
    {
    src: new URL('@/assets/picture/260304삼원가정봉사원파견센터봉사활동.jpg', import.meta.url).href,
    alt: '260304_삼원가정봉사원파견센터봉사활동'
  },
  {
    src: new URL('@/assets/picture/260829제2회한일음악교류회1.jpg', import.meta.url).href,
    alt: '260829_제2회한일음악교류회_1'
  },
  {
    src: new URL('@/assets/picture/260829제2회한일음악교류회2.jpg', import.meta.url).href,
    alt: '260829_제2회한일음악교류회_2'
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
  if (index === activeIndex.value) return
  clearTimeout(transitionEnd)
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
function selectRelative(direction: number) {
  selectPhoto((activeIndex.value + direction + photos.length) % photos.length)
}

const SWIPE_THRESHOLD = 36
let pointerId: number | null = null
let pointerStartX = 0
let dragged = false
let suppressClick = false

function onPhotoPointerDown(event: PointerEvent) {
  if (event.pointerType === 'mouse' && event.button !== 0) return
  pointerId = event.pointerId
  pointerStartX = event.clientX
  dragged = false
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
}
function onPhotoPointerMove(event: PointerEvent) {
  if (event.pointerId !== pointerId) return
  if (Math.abs(event.clientX - pointerStartX) > 8) {
    dragged = true
    event.preventDefault()
  }
}
function onPhotoPointerUp(event: PointerEvent) {
  if (event.pointerId !== pointerId) return
  const delta = event.clientX - pointerStartX
  const target = event.currentTarget as HTMLElement
  if (target.hasPointerCapture(event.pointerId)) target.releasePointerCapture(event.pointerId)
  pointerId = null
  if (Math.abs(delta) >= SWIPE_THRESHOLD) selectRelative(delta < 0 ? 1 : -1)
  suppressClick = dragged
  window.setTimeout(() => { suppressClick = false }, 0)
}
function onPhotoPointerCancel() {
  pointerId = null
  dragged = false
}
function onPhotoClick(event: MouseEvent) {
  if (suppressClick) {
    event.preventDefault()
    event.stopPropagation()
    suppressClick = false
    return
  }
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
    <div class="desk-postcard" aria-hidden="true">
      <span class="postcard-heading">POSTCARD</span>
      <span class="postcard-stamp">WYEA<br>↗</span>
      <p>새로운 만남,<br>이어지는 이야기</p>
      <span class="postcard-address">TO. OUR NEXT CHAPTER</span>
    </div>
    <div class="desk-top-note" aria-hidden="true">
      <span class="note-tape"></span>
      <span class="top-note-caption">little moments</span>
      <p>오늘의 만남이<br>내일의 추억으로</p>
      <svg viewBox="0 0 110 20" fill="none">
        <path d="M5 12Q47 3 103 9M14 17Q57 9 97 13" />
      </svg>
    </div>
    <svg class="desk-arrow" viewBox="0 0 150 90" fill="none" aria-hidden="true">
      <path d="M8 72C35 82 66 65 65 43C64 26 41 28 49 45C60 67 105 57 137 21M116 26L139 18L136 42" />
    </svg>
    <div class="desk-ticket" aria-hidden="true">
      <span class="ticket-kicker">WORLD YOUTH EXCHANGE</span>
      <strong>모여서, 더 넓은 세계로</strong>
      <span class="ticket-rule"></span>
      <span class="ticket-bottom">WYEA <span>MEMORIES / KEEP</span></span>
    </div>
    <div class="desk-stamp" aria-hidden="true">
      <span>WORLD YOUTH</span>
      <strong>WYEA</strong>
      <span>EXCHANGE ASSOCIATION</span>
    </div>
    <aside class="desk-note">
      <span class="note-tape" aria-hidden="true"></span>
      <p>함께 만든<br>순간들</p>
      <span class="note-signature">with WYEA</span>
    </aside>
    <div class="desk-supplies" aria-hidden="true">
      <span class="spare-tape"></span>
      <img class="desk-clip desk-clip-one" :src="paperclipSrc" alt="" />
      <img class="desk-clip desk-clip-two" :src="paperclipSrc" alt="" />
    </div>
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
            draggable="false"
            :aria-hidden="idx !== activeIndex"
            :style="{ '--photo-tilt': photo.tilt }"
            :class="{
              'is-current': idx === activeIndex,
              'is-leaving': idx === leavingIndex,
              'is-next': idx === nextIndex && idx !== leavingIndex,
            }"
          />
          <RouterLink
            class="photo-link"
            to="/activities"
            aria-label="활동소식 보기"
            @pointerdown="onPhotoPointerDown"
            @pointermove="onPhotoPointerMove"
            @pointerup="onPhotoPointerUp"
            @pointercancel="onPhotoPointerCancel"
            @dragstart.prevent
            @click="onPhotoClick"
          />
        </div>
        <button v-if="photos.length > 1" class="photo-nav photo-prev" type="button" aria-label="이전 사진" @click="selectRelative(-1)">‹</button>
        <button v-if="photos.length > 1" class="photo-nav photo-next" type="button" aria-label="다음 사진" @click="selectRelative(1)">›</button>
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
@font-face {
  font-family: 'NanumPenScript';
  src: url('@/assets/fonts/NanumPenScript-Regular.ttf') format('truetype');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

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
  z-index: 0;
  user-select: none;
  -webkit-user-select: none;
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

.desk-note,
.desk-supplies,
.desk-arrow,
.desk-ticket,
.desk-stamp,
.desk-postcard,
.desk-top-note {
  display: none;
  position: absolute;
  pointer-events: none;
}

/* Keep the stationery in the outer desktop margins, away from the prints. */
@media (min-width: 1501px) and (min-height: 700px) {
  .desk-postcard {
    display: block;
    left: 5%;
    top: 9%;
    width: calc(250 * var(--photo-unit));
    padding: calc(20 * var(--photo-unit));
    background: #e7e1cf;
    color: #586052;
    text-align: left;
    transform: rotate(-11deg);
    box-shadow: 0 3px 5px rgba(12, 30, 20, .13);
  }
  .postcard-heading {
    font: calc(10 * var(--photo-unit))/1.4 ui-monospace, monospace;
    letter-spacing: .2em;
  }
  .postcard-stamp {
    position: absolute;
    right: calc(16 * var(--photo-unit));
    top: calc(14 * var(--photo-unit));
    padding: calc(5 * var(--photo-unit));
    border: 1px dashed rgba(88, 96, 82, .5);
    font: calc(10 * var(--photo-unit))/1.4 ui-monospace, monospace;
    text-align: center;
  }
  .desk-postcard p {
    margin: calc(24 * var(--photo-unit)) 0 calc(16 * var(--photo-unit));
    font: calc(25 * var(--photo-unit))/1.25 'NanumPenScript', sans-serif;
  }
  .postcard-address {
    display: block;
    padding-top: calc(8 * var(--photo-unit));
    border-top: 1px solid rgba(88, 96, 82, .2);
    font: calc(8 * var(--photo-unit))/1.4 ui-monospace, monospace;
    letter-spacing: .08em;
  }
  .desk-top-note {
    display: block;
    right: 6%;
    top: 23%;
    width: calc(195 * var(--photo-unit));
    padding: calc(24 * var(--photo-unit)) calc(16 * var(--photo-unit)) calc(12 * var(--photo-unit));
    background: #dedfc8;
    color: #4b5c4d;
    transform: rotate(8deg);
    box-shadow: 0 3px 5px rgba(12, 30, 20, .13);
  }
  .top-note-caption {
    font: calc(12 * var(--photo-unit))/1.4 'NanumPenScript', sans-serif;
    opacity: .65;
    letter-spacing: .12em;
  }
  .desk-top-note p {
    margin: calc(10 * var(--photo-unit)) 0 0;
    font: calc(25 * var(--photo-unit))/1.25 'NanumPenScript', sans-serif;
  }
  .desk-top-note svg {
    width: 70%;
    height: calc(20 * var(--photo-unit));
    stroke: rgba(75, 92, 77, .4);
    stroke-width: 1.5;
    stroke-linecap: round;
  }
  .desk-note {
    display: block;
    left: 17%;
    bottom: 29%;
    width: calc(210 * var(--photo-unit));
    padding: calc(30 * var(--photo-unit)) calc(20 * var(--photo-unit)) calc(18 * var(--photo-unit));
    background: #ece5cc;
    color: #425248;
    font-family: 'NanumPenScript', sans-serif;
    transform: rotate(5deg);
    box-shadow: 0 3px 6px rgba(12, 30, 20, .16);
  }
  .desk-note p {
    margin: 0;
    font-size: calc(29 * var(--photo-unit));
    line-height: 1.25;
  }
  .note-signature {
    display: block;
    margin-top: calc(14 * var(--photo-unit));
    font-size: calc(18 * var(--photo-unit));
    opacity: .65;
  }
  .note-tape,
  .spare-tape {
    position: absolute;
    width: calc(88 * var(--photo-unit));
    height: calc(26 * var(--photo-unit));
    background: rgba(232, 221, 183, .65);
    clip-path: polygon(2% 0, 99% 2%, 97% 22%, 100% 47%, 98% 72%, 100% 100%, 1% 98%, 3% 73%, 0 48%, 2% 24%);
  }
  .note-tape {
    top: calc(-9 * var(--photo-unit));
    left: 43%;
    width: calc(102 * var(--photo-unit));
    height: calc(23 * var(--photo-unit));
    background: rgba(216, 194, 145, .62);
    transform: translateX(-50%) rotate(-9deg);
    clip-path: polygon(0 4%, 98% 0, 100% 28%, 98% 54%, 100% 96%, 2% 100%, 0 70%, 2% 43%);
  }
  .desk-top-note .note-tape {
    top: calc(-13 * var(--photo-unit));
    left: 62%;
    width: calc(66 * var(--photo-unit));
    height: calc(31 * var(--photo-unit));
    background: repeating-linear-gradient(110deg, rgba(195, 209, 193, .72) 0 5px, rgba(218, 226, 203, .64) 5px 10px);
    transform: translateX(-50%) rotate(17deg);
    clip-path: polygon(3% 0, 97% 3%, 100% 20%, 97% 40%, 100% 67%, 98% 100%, 0 96%, 2% 72%, 0 46%, 3% 24%);
  }
  .desk-supplies {
    display: block;
    right: 10%;
    bottom: 24%;
    z-index: 1;
    width: calc(190 * var(--photo-unit));
    height: calc(155 * var(--photo-unit));
  }
  .spare-tape {
    top: 0;
    right: 0;
    width: calc(112 * var(--photo-unit));
    height: calc(20 * var(--photo-unit));
    background: rgba(214, 183, 158, .58);
    transform: rotate(28deg);
    clip-path: polygon(4% 0, 100% 5%, 98% 28%, 100% 58%, 96% 100%, 0 93%, 2% 62%, 0 33%);
  }
  .desk-clip {
    position: absolute;
    width: calc(125 * var(--photo-unit));
    height: auto;
    user-select: none;
    opacity: .85;
  }
  .desk-clip-one { left: 0; top: 15%; transform: rotate(24deg); }
  .desk-clip-two { left: 34%; top: 32%; transform: rotate(-18deg); }
  .desk-arrow {
    display: block;
    left: 24%;
    bottom: 49%;
    transform: rotate(-16deg);
    width: calc(135 * var(--photo-unit));
    height: auto;
    stroke: rgba(234, 231, 203, .65);
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .desk-ticket {
    display: block;
    right: 17%;
    bottom: 27%;
    width: calc(240 * var(--photo-unit));
    padding: calc(20 * var(--photo-unit));
    color: #4b5a4e;
    background: #e0d8bb;
    transform: rotate(-12deg);
    box-shadow: 1px 3px 5px rgba(12, 30, 20, .15);
    /* Punched edges suggest a kept ticket, without adding a large object. */
    clip-path: polygon(0 0, 100% 0, 100% 43%, 97% 50%, 100% 57%, 100% 100%, 0 100%, 0 57%, 3% 50%, 0 43%);
  }
  .ticket-kicker {
    display: block;
    font: calc(9 * var(--photo-unit))/1.4 ui-monospace, monospace;
    letter-spacing: .12em;
  }
  .desk-ticket strong {
    display: block;
    margin: calc(14 * var(--photo-unit)) 0;
    font: calc(25 * var(--photo-unit))/1.3 'NanumPenScript', sans-serif;
  }
  .ticket-rule { display: block; border-top: 1px dashed rgba(75, 90, 78, .35); }
  .ticket-bottom {
    display: flex;
    justify-content: space-between;
    margin-top: calc(10 * var(--photo-unit));
    font: calc(9 * var(--photo-unit))/1.4 ui-monospace, monospace;
  }
  .desk-stamp {
    display: flex;
    flex-direction: column;
    justify-content: center;
    left: 7%;
    bottom: 17%;
    width: calc(130 * var(--photo-unit));
    height: calc(130 * var(--photo-unit));
    border: 3px double currentColor;
    border-radius: 50%;
    color: rgba(223, 224, 190, .4);
    transform: rotate(-14deg);
    font: calc(8 * var(--photo-unit))/1.8 ui-monospace, monospace;
    letter-spacing: .08em;
  }
  .desk-stamp strong { font-size: calc(26 * var(--photo-unit)); font-weight: 600; }
}

.hvpsection1 {
  font-family: 'PretendardFont', sans-serif;
  padding-bottom: calc(40 * var(--photo-unit, 1px));
}
.hvpsection1 h1 {
  margin: 0;
  font-family: 'NanumPenScript', 'PretendardFont', sans-serif;
  font-weight: 400;
  font-size: calc(44 * var(--photo-unit, 1px));
  line-height: 1.35;
  letter-spacing: .08em;
  color: #354b40;
  position: relative;
  background: rgba(243, 234, 205, .78);
  border: 0;
  border-radius: 0;
  box-shadow: none;
  padding: calc(11.5 * var(--photo-unit, 1px)) calc(46 * var(--photo-unit, 1px));
  transform: rotate(-1deg);
  /* Slightly uneven torn ends, rather than a rounded card edge. */
  clip-path: polygon(1% 0, 99% 0, 98.5% 15%, 100% 30%, 99% 48%, 100% 66%, 98.8% 82%, 99.5% 100%, 0.5% 100%, 1.2% 83%, 0% 67%, 1% 49%, 0% 31%, 1.5% 15%);
  display: inline-block;
}
@media (max-width: 1024px) {
  .hvpsection1 h1 {
    font-size: 29px;
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
  user-select: none;
  -webkit-user-select: none;
}
.photo-item {
  position: relative;
  isolation: isolate;
  height: min(calc(461.25 * var(--frame-unit)), 45vh);
}
.photo-link {
  position: absolute;
  inset: 0;
  z-index: 4;
  display: block;
  cursor: pointer;
  touch-action: pan-y;
}
.photo-link:focus-visible { outline: 3px solid #fff; outline-offset: -3px; }
.photo-nav {
  position: absolute;
  z-index: 6;
  top: 50%;
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  padding: 0;
  border: 1px solid rgba(28, 55, 41, .16);
  border-radius: 50%;
  background: rgba(255, 255, 255, .94);
  color: #244436;
  box-shadow: 0 2px 10px rgba(10, 25, 18, .2);
  font-size: 30px;
  line-height: 1;
  cursor: pointer;
  transform: translateY(-50%);
}
.photo-prev { left: 0; }
.photo-next { right: 0; }
.photo-nav:focus-visible { outline: 3px solid #0d47a1; outline-offset: 2px; }

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
  pointer-events: none;
  user-select: none;
  -webkit-user-drag: none;
}
.photo-item img.is-next {
  opacity: 0;
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
  z-index: 6;
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

  .photo-swiper {
    width: calc(820 * var(--photo-unit));
    margin-top: calc(-10 * var(--photo-unit));
    padding-bottom: calc(40 * var(--photo-unit));
  }

}
</style>
