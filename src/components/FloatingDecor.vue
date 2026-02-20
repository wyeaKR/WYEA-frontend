<template>
  <section class="hero-decor" :class="hidden ? 'is-hide' : 'is-show'" aria-hidden="true">
    <img
      v-for="(it, i) in items"
      :key="i"
      :src="it.src"
      :alt="it.alt || ''"
      class="floating"
      :style="styleFor(it, i)"
    />
  </section>
</template>

<script setup lang="ts">
export type DecorItem = {
  src: string // 이미지 경로(필수)
  alt?: string  // 대체 텍스트

  from?: 'left' | 'right' | 'up' | 'down'
    | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' // 어느 방향에서 슬라이드 인 할지

  distance?: number // 얼마나 떨어진 지점에서 시작할지
  fromVec?: { x: number; y: number; unit?: 'px' | '%' | 'vw' | 'vh' } // 벡터로 시작 오프셋 지정
  fromPolar?: { deg: number; dist: number; unit?: 'px' | '%' | 'vw' | 'vh' }  // 각도/거리로 시작 오프셋 지정

  top?: string; bottom?: string; left?: string; right?: string  // 최종 도착 지점
  width?: number  // 이미지의 크기

  delay?: number  // 시작 지연초
  duration?: number // 재생 시간초
  easing?: string // 타이밍함수

  scale?: number  // 시작 크기
  blur?: number // 시작 블러

  rotZ?: number // Z축 회전(deg)
  rotX?: number // 3D 틸트 X(deg)
  rotY?: number // 3D 틸트 Y(deg)
  origin?: string // transform-origin (e.g. '30% 70%')
}

const styleFor = (it: DecorItem, i: number) => {
  let tx, ty
  if (it.fromVec) {
    const unit = it.fromVec.unit ?? 'px'
    tx = `${it.fromVec.x}${unit}`
    ty = `${it.fromVec.y}${unit}`
  } else if (it.fromPolar) {
    const unit = it.fromPolar.unit ?? 'px'
    const rad = (it.fromPolar.deg * Math.PI) / 180
    tx = `${Math.cos(rad) * it.fromPolar.dist}${unit}`
    ty = `${Math.sin(rad) * it.fromPolar.dist}${unit}`
  } else {
    const d = it.distance ?? 60
    const map: Record<string, [number, number]> = {
      left: [-d, 0], right: [d, 0], up: [0, d], down: [0, -d],
      'top-left': [-d, -d], 'top-right': [d, -d],
      'bottom-left': [-d, d], 'bottom-right': [d, d],
    }
    const [dx, dy] = map[it.from ?? 'left'] ?? [-d, 0]
    tx = `${dx}px`
    ty = `${dy}px`
  }

  return {
    top: it.top,
    bottom: it.bottom,
    left: it.left,
    right: it.right,
    width: it.width ? `${it.width}px` : undefined,

    animationDelay: `${it.delay ?? i * 0.15 + 0.1}s`,
    animationDuration: it.duration ? `${it.duration}s` : undefined,
    animationTimingFunction: it.easing,

    // 위치/스케일/블러
    '--tx': tx,
    '--ty': ty,
    '--scaleStart': it.scale != null ? String(it.scale) : undefined,
    '--blurStart': it.blur != null ? `${it.blur}px` : undefined,

    // 회전(처음부터 유지)
    '--rotZ': `${it.rotZ ?? 0}deg`,
    '--rotX': `${it.rotX ?? 0}deg`,
    '--rotY': `${it.rotY ?? 0}deg`,
    '--origin': it.origin,
  } as Record<string, string | undefined>
}

defineProps<{
  items: DecorItem[]
  hidden?: boolean  // 스크롤에 따라 토글할 플래그
}>()
</script>

<style scoped>
.hero-decor{
  position: fixed;
  inset: var(--header-h, 64px) 0 0 0;
  z-index: 0;
  pointer-events: none;
  perspective: 1000px; /* 3D 틸트 깊이감 (rotX/rotY 쓸 때 유효) */

  user-select: none;
  -webkit-user-drag: none;
}

/* 공용(초기) 상태: 화면 밖/작게/블러(변수) */
.floating{
  position: absolute;
  height: auto;
  opacity: 0;

  /* 기본값(IDE 경고 방지) */
  --tx: 0px;
  --ty: 0px;
  --scaleStart: 1;
  --blurStart: 0px;
  --rotZ: 0deg;
  --rotX: 0deg;
  --rotY: 0deg;
  --origin: 50% 50%;

  transform-origin: var(--origin);
  transform:
    translate(var(--tx), var(--ty))
    scale(var(--scaleStart))
    rotateZ(var(--rotZ))
    rotateX(var(--rotX))
    rotateY(var(--rotY));
  filter: drop-shadow(0 8px 20px rgba(0,0,0,.15)) drop-shadow(0 14px 28px rgba(0,0,0,.22)) blur(var(--blurStart));
  will-change: transform, filter, opacity;
}

/* 표시 상태 → popIn */
.is-show .floating {
  animation: popIn .7s cubic-bezier(.2,.8,.2,1) both;
}

/* 숨김 상태 → popOut */
.is-hide .floating {
  animation: popOut .45s cubic-bezier(.2,.8,.2,1) both;
  animation-delay: 0s !important;  /* ← 핵심: hide에는 지연 금지 */
}

/* 들어오기 */
@keyframes popIn {
  0%   {
    opacity: 0;
    transform:
      translate(var(--tx), var(--ty))
      scale(var(--scaleStart))
      rotateZ(var(--rotZ))
      rotateX(var(--rotX))
      rotateY(var(--rotY));
    filter: drop-shadow(0 8px 20px rgba(0,0,0,.15)) blur(var(--blurStart));
  }
  60%  {
    opacity: 1;
    transform:
      translate(calc(var(--tx) * .1), calc(var(--ty) * .1))
      scale(1.02)
      rotateZ(var(--rotZ))
      rotateX(var(--rotX))
      rotateY(var(--rotY));
  }
  100% {
    opacity: 1;
    transform:
      translate(0, 0)
      scale(1)
      rotateZ(var(--rotZ))
      rotateX(var(--rotX))
      rotateY(var(--rotY));
    filter: drop-shadow(0 8px 20px rgba(0,0,0,.15)) blur(0);
  }
}

/* 나가기(들어왔던 방향으로 되돌아감) */
@keyframes popOut {
  from {
    opacity: 1;
    transform:
      translate(0, 0)
      scale(1)
      rotateZ(var(--rotZ))
      rotateX(var(--rotX))
      rotateY(var(--rotY));
    filter: drop-shadow(0 8px 20px rgba(0,0,0,.15)) blur(0);
  }
  to {
    opacity: 0;
    transform:
      translate(var(--tx), var(--ty))
      scale(var(--scaleStart))
      rotateZ(var(--rotZ))
      rotateX(var(--rotX))
      rotateY(var(--rotY));
    filter: drop-shadow(0 8px 20px rgba(0,0,0,.15)) blur(var(--blurStart));
  }
}

/* 모션 민감 사용자 배려(선택) */
@media (prefers-reduced-motion: reduce) {
  .is-show .floating, .is-hide .floating { animation: none; }
  .floating {
    opacity: 1;
    transform: translate(0,0) scale(1) rotateZ(var(--rotZ)) rotateX(var(--rotX)) rotateY(var(--rotY));
    filter: drop-shadow(0 8px 20px rgba(0,0,0,.15)) blur(0);
  }
}
</style>
