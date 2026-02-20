<script setup lang="ts">
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Pagination, Autoplay } from 'swiper/modules'

import 'swiper/css'
import 'swiper/css/pagination'

defineProps<{
  hidden?: boolean
}>()

const photos = [
  {
    src: new URL('@/assets/picture/LINE_ALBUM_2日目_251209_16.jpg', import.meta.url).href,
    alt: '2025년 상반기 정모'
  },
  {
    src: new URL('@/assets/picture/KakaoTalk_20251210_171433166.jpg', import.meta.url).href,
    alt: '2025년 상반기 정모'
  },
]
</script>

<template>
  <section class="hero">
    <section class="hvpsection1">
      <h1>활동 사진</h1>
    </section>

    <section class="hvpsection2">
      <Swiper
        class="photo-swiper"
        :modules="[Pagination, Autoplay]"
        :slides-per-view="1"
        :pagination="{ clickable: true }"
        :loop="true"
        :autoplay="{ delay: 3000, disableOnInteraction: false }"
      >
        <SwiperSlide v-for="(photo, idx) in photos" :key="idx">
          <div class="photo-item">
            <img :src="photo.src" :alt="photo.alt" />
          </div>
        </SwiperSlide>
      </Swiper>

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
  position: fixed;
  justify-content: center;
  align-items: center;
  text-align: center;
  inset: var(--header-h, 64px) 0 0 0;
  z-index: -1;
  pointer-events: none;
}
.hero::before {
  --cell: 32px;
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
  background-position: 50% 50%;
  opacity: .9;
  mix-blend-mode: overlay;
}
@media (min-width: 2560px) {
  .hero::before { --cell: 42px; }
}
.hero::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  background-image: url('@/assets/noise.svg');
  opacity: .4;
  mix-blend-mode: soft-light;
}

/* ================= Title ================= */
.hvpsection1 {
  font-family: 'PretendardFont', sans-serif;
}
.hvpsection1 h1 {
  margin-top: -10px;
  font-weight: 600;
  font-size: 60px;
  position: relative;
  background: #2d6a4f;
  box-shadow: 0 0 30px 15px #2d6a4f;
  padding: 0.5em 1em;
  display: inline-block;
}
@media (max-width: 1024px) {
  .hvpsection1 h1 {
    font-size: 30px;
  }
}
@media (min-width: 2560px) {
  .hvpsection1 h1 {
    margin-top: 20px;
    font-size: 70px;
  }
}
/* ================= Swiper Section ================= */
.hvpsection2 {
  margin-top: 0px;
  display: flex;
  justify-content: center;
}

/* Swiper 크기 */
.photo-swiper {
  margin-top: -10px;
  position: relative;
  background: #2d6a4f;
  box-shadow: 0 0 30px 15px #2d6a4f;
  display: inline-block;
  width: 820px;
  max-width: 90%;
  padding-bottom: 40px;
}
@media (max-width: 1024px) {
  .photo-swiper {
    margin-top: 30px;
  }
}
@media (min-width: 2560px) {
  .photo-swiper {
    position: relative;
    background: #2d6a4f;
    box-shadow: 0 0 50px 15px #2d6a4f;
    display: inline-block;
    width: 1600px;
    max-width: 90%;
    padding-bottom: 40px;
  }
}

/* 개별 사진 카드 */
.photo-item {
  background: #2d6a4f;
  box-shadow: 0 0 30px 15px #2d6a4f;
  padding: 0.5em 1em;
  border-radius: 20px;
  overflow: hidden;
}

/* 사진 */
.photo-item img {
  width: 100%;
  aspect-ratio: 16 / 9;
  object-fit: contain;
  border-radius: 12px;
}

/* 점 표시 */
.swiper-pagination-bullet {
  background: white !important;
  opacity: 0.5;
}
.swiper-pagination-bullet-active {
  opacity: 1;
}
</style>
