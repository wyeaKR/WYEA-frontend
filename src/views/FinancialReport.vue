<script setup lang="ts">
import { computed, ref } from 'vue'


type Item = { label: string; amount: number; color?: string }
type ItemWithPct = Item & { pct: number }

// 포맷터
const fmtKRW = (n: number) => new Intl.NumberFormat('ko-KR').format(n)
const fmtPct = (n: number) => `${n.toFixed(1)}%`

// 아크 유틸
const polar = (cx: number, cy: number, r: number, angle: number) => {
  const rad = (angle - 90) * (Math.PI / 180)
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}
const arcPath = (cx: number, cy: number, r: number, start: number, end: number) => {
  const s = polar(cx, cy, r, end)
  const e = polar(cx, cy, r, start)
  const large = end - start <= 180 ? 0 : 1
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 0 ${e.x} ${e.y}`
}

const incomeitems2025 = ref<Item[]>([
  { label: '지원금', amount: 0, color: '#1C77F2' },
])

const incomeitems2026 = ref<Item[]>([
  { label: '지원금', amount: 0, color: '#1C77F2' },
])
// #1C77F2 (진한 블루)
// #2D99FF (중간 블루)
// #5EB1FF (밝은 블루)
// #7DC3FF (하늘색 톤)
// #A6C7F9 (파스텔 블루)
// #CFE4FF (아주 연한 블루)
// #525B61 (짙은 차콜)
// #6B7280 (미디엄 그레이)
// #9AA9B2 (밝은 그레이)
// #E2E8F0 (연한 실버톤)

const spendingitems2025 = ref<Item[]>([
  { label: '봉사활동 장비', amount: 29_530, color: '#6EE7B7' },
  { label: '운영비', amount: 83_228, color: '#065F46' },
  { label: '비상주 사무실 계약', amount: 396_000, color: '#15803D' },
  { label: '행사참가비', amount: 332_397, color: '#34D399' },
])

const spendingitems2026 = ref<Item[]>([

])
// #065F46 (딥 그린·짙은 초록)
// #047857 (청록빛 중간 초록)
// #10B981 (밝은 에메랄드)
// #34D399 (민트 톤 밝은 초록)
// #6EE7B7 (파스텔 민트)
// #A7F3D0 (아주 연한 민트)
// #064E3B (딥 포레스트·짙은 차콜 초록)
// #15803D (리치 그린·미디엄 톤)
// #4ADE80 (라이트 그린)
// #BBF7D0 (연한 실버톤 그린)

/**********************************수입**************************************/
const activeIncomeYear = ref<'2025' | '2026'>('2025')

/* 선택된 연도의 수입 아이템 */
const incomeItems = computed<Item[]>(() =>
  activeIncomeYear.value === '2025' ? incomeitems2025.value : incomeitems2026.value
)

/* === (수입) 합계/비율/세그먼트 등은 incomeItems 기준으로 재계산 === */
const total = computed(() => incomeItems.value.reduce((s, i) => s + i.amount, 0))
const withPct = computed<ItemWithPct[]>(() =>
  incomeItems.value.map(i => ({ ...i, pct: total.value ? (i.amount / total.value) * 100 : 0 }))
)
const accumAngles = computed<number[]>(() => {
  const a: number[] = [0]; let acc = 0
  for (const it of withPct.value) { acc += it.pct || 0; a.push((acc / 100) * 360) }
  return a
})
const segments = computed(() =>
  withPct.value.map((i, idx) => ({
    item: i,
    start: accumAngles.value[idx] ?? 0,
    end:   accumAngles.value[idx + 1] ?? 0,
  }))
)
const hoverIdx = ref<number | null>(null)
const centerTitle = computed(() =>
  hoverIdx.value == null ? '총 수입' : (segments.value[hoverIdx.value]?.item.label ?? '총 수입')
)
const centerSub = computed(() => {
  if (hoverIdx.value == null) return fmtKRW(total.value)
  const seg = segments.value[hoverIdx.value]
  return seg ? `${fmtPct(seg.item.pct)} · ${fmtKRW(seg.item.amount)}` : ''
})
/**********************************지출**************************************/
const activeSpendingYear = ref<'2025' | '2026'>('2025')
// 선택된 연도의 지출 아이템
const spendingItems = computed<Item[]>(() =>
  activeSpendingYear.value === '2025' ? spendingitems2025.value : spendingitems2026.value
)
// 남은금액은 "선택된 수입 합계 - 선택된 지출 합계"
const total2 = computed(() => spendingItems.value.reduce((sum, i) => sum + i.amount, 0))
const remaining = computed(() => total.value - total2.value)

const withPct2 = computed<ItemWithPct[]>(() =>
  spendingItems.value.map(i => ({ ...i, pct: total2.value ? (i.amount / total2.value) * 100 : 0 }))
)

const accumAngles2 = computed<number[]>(() => {
  const a: number[] = [0]; let acc = 0
  for (const it of withPct2.value) { acc += it.pct || 0; a.push((acc / 100) * 360) }
  return a
})

const segments2 = computed(() =>
  withPct2.value.map((i, idx) => ({
    item: i,
    start: accumAngles2.value[idx] ?? 0,
    end:   accumAngles2.value[idx + 1] ?? 0,
  }))
)

const hoverIdx2 = ref<number | null>(null)
const centerTitle2 = computed(() =>
  hoverIdx2.value == null ? '총 지출' : (segments2.value[hoverIdx2.value]?.item.label ?? '총 지출')
)
const centerSub2 = computed(() => {
  if (hoverIdx2.value == null) return fmtKRW(total2.value)
  const seg = segments2.value[hoverIdx2.value]
  return seg ? `${fmtPct(seg.item.pct)} · ${fmtKRW(seg.item.amount)}` : ''
})

</script>

<template>
  <section class="frsection1">
    <header class="pageHead">
      <h1>재정보고</h1>
      <p class="sub1">재원 사용 보고</p>
      <!-- 👇 연도 전환 탭 -->
      <div class="year-tabs">
        <button
          :class="{ active: activeIncomeYear === '2025' }"
          @click="activeIncomeYear = '2025'">
          2025 수입
        </button>
<!--        <button
          :class="{ active: activeIncomeYear === '2026' }"
          @click="activeIncomeYear = '2026'">
          2026 수입
        </button>-->
      </div>
    </header>

    <div class="grid">
      <!-- 표 -->
      <div class="card">
        <h2>수입 내역</h2>
        <table class="tbl" :aria-label="`${activeIncomeYear} 수입 내역`">
          <thead>
          <tr>
            <th scope="col">구분</th>
            <th scope="col" class="num">금액(원)</th>
            <th scope="col" class="num">비율(%)</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="i in withPct" :key="i.label">
            <th scope="row">
              <span class="dot" :style="{ background: i.color ?? '#999' }" aria-hidden="true" ></span>
              {{ i.label }}
            </th>
            <td class="num">{{ fmtKRW(i.amount) }}</td>
            <td class="num">{{ fmtPct(i.pct as number) }}</td>
          </tr>
          </tbody>
          <tfoot>
          <tr>
            <th scope="row">합계</th>
            <td class="num">{{ fmtKRW(total) }}</td>
            <td class="num">100.0%</td>
          </tr>
          </tfoot>
        </table>
      </div>

      <!-- 도넛 차트 -->
      <div class="card chartCard">
        <h2>수입 비율</h2>
        <svg viewBox="0 0 300 300" role="img" aria-label="수입 비율 도넛 차트">
          <!-- 도넛 베이스 -->
          <circle cx="150" cy="150" r="110" class="ring" />
          <circle cx="150" cy="150" r="75" fill="#fff" />

          <!-- 세그먼트 -->
          <g v-for="(seg, idx) in segments" :key="seg.item.label">
            <path
              :d="arcPath(150,150,110, seg.start, seg.end)"
              :stroke="seg.item.color ?? '#999'"
              :stroke-width="hoverIdx === idx ? 40 : 30"
              fill="none"
              class="seg"
              @mouseenter="hoverIdx = idx"
              @mouseleave="hoverIdx = null"
            />
          </g>

          <!-- 중앙 라벨 -->
          <text x="150" y="138" text-anchor="middle" class="centerTitle">
            {{ centerTitle }}
          </text>
          <text x="150" y="160" text-anchor="middle" class="centerSub">
            {{ centerSub }}
          </text>
        </svg>

        <ul class="legend">
          <li v-for="(i, idx) in withPct" :key="i.label" :class="{ active: hoverIdx === idx }"
              @mouseenter="hoverIdx = idx" @mouseleave="hoverIdx = null">
            <span class="swatch" :style="{ background: i.color ?? '#999' }" />
            <span class="name">{{ i.label }}</span>
            <span class="val">{{ fmtPct(i.pct as number) }}</span>
          </li>
        </ul>
      </div>
    </div>
  </section>
  <!-- ▼▼ 섹션 2: 지출 (item2) ▼▼ -->
  <section class="frsection2">
    <header class="pageHead">
      <p class="sub2">재원 사용 보고</p>
      <div class="year-tabs">
        <button
          :class="{ active: activeSpendingYear === '2025' }"
          @click="activeSpendingYear = '2025'">
          2025 지출
        </button>
<!--        <button
          :class="{ active: activeSpendingYear === '2026' }"
          @click="activeSpendingYear = '2026'">
          2026 지출
        </button>-->
      </div>
    </header>

    <div class="grid">
      <!-- 표 -->
      <div class="card">
        <h2>지출 내역</h2>
        <table class="tbl" :aria-label="`${activeSpendingYear} 지출 내역`">
          <thead>
          <tr>
            <th scope="col">구분</th>
            <th scope="col" class="num">금액(원)</th>
            <th scope="col" class="num">비율(%)</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="(i, idx) in withPct2" :key="`${i.label}-${idx}`">
            <th scope="row">
              <span class="dot" :style="{ background: i.color ?? '#999' }" aria-hidden="true" />
              {{ i.label }}
            </th>
            <td class="num">{{ fmtKRW(i.amount) }}</td>
            <td class="num">{{ fmtPct(i.pct as number) }}</td>
          </tr>
          </tbody>
          <tfoot>
          <tr>
            <th scope="row">합계</th>
            <td class="num">{{ fmtKRW(total2) }}</td>
            <td class="num">100.0%</td>
          </tr>
          <tr>
            <th scope="row">남은금액</th>
            <td class="num" :class="{ neg: remaining < 0 }">
              {{ fmtKRW(remaining) }}
            </td>
          </tr>
          </tfoot>
        </table>
      </div>

      <!-- 도넛 차트 -->
      <div class="card chartCard">
        <h2>지출 비율</h2>
        <svg viewBox="0 0 300 300" role="img" aria-label="지출 비율 도넛 차트">
          <!-- 도넛 베이스 -->
          <circle cx="150" cy="150" r="110" class="ring" />
          <circle cx="150" cy="150" r="75" fill="#fff" />

          <!-- 세그먼트 -->
          <g v-for="(seg, idx) in segments2" :key="`${seg.item.label}-${idx}`">
            <path
              :d="arcPath(150,150,110, seg.start, seg.end)"
              :stroke="seg.item.color ?? '#999'"
              :stroke-width="hoverIdx2 === idx ? 40 : 30"
              fill="none"
              class="seg"
              @mouseenter="hoverIdx2 = idx"
              @mouseleave="hoverIdx2 = null"
            />
          </g>

          <!-- 중앙 라벨 -->
          <text x="150" y="138" text-anchor="middle" class="centerTitle">
            {{ centerTitle2 }}
          </text>
          <text x="150" y="160" text-anchor="middle" class="centerSub">
            {{ centerSub2 }}
          </text>
        </svg>

        <ul class="legend">
          <li v-for="(i, idx) in withPct2" :key="`${i.label}-legend-${idx}`"
              :class="{ active: hoverIdx2 === idx }"
              @mouseenter="hoverIdx2 = idx" @mouseleave="hoverIdx2 = null">
            <span class="swatch" :style="{ background: i.color ?? '#999' }" />
            <span class="name">{{ i.label }}</span>
            <span class="val">{{ fmtPct(i.pct as number) }}</span>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>

<style scoped>
:global(html), :global(body), :global(#app) { background:#fff; }
:root { --bg:#ffffff; --ink:#0f172a; --muted:#667085; --line:#e7eef7; }
.frsection1 {
  max-width: 1100px;
  margin: 40px auto;
  padding: 0 20px;
}

.frsection2 {
  max-width: 1100px;
  margin: 40px auto;
  padding: 0 20px;
}
.pageHead h1 {
  font-size: 36px;
  margin: 100px 0 8px;
  font-weight: 700;
}

.pageHead .sub1 {
  color: var(--muted);
  font-size: 20px;
  font-weight: 500;
}

.pageHead .sub2 {
  color: var(--muted);
  font-size: 20px;
  font-weight: 500;
  margin-top: 80px;
}

.grid { display: grid; grid-template-columns: 1.1fr 1fr; gap: 24px; }
.card { background: var(--bg); border: 1px solid var(--line); border-radius: 16px; padding: 20px; box-shadow: 0 2px 10px rgba(15,23,42,.06); }
.card h2 {
  margin: 0 0 16px;
  font-size: 18px;
  font-weight: 500;
}

/* 음수면 색만 살짝 경고톤 */
.neg { color: #b91c1c; }

.tbl { width: 100%; border-collapse: collapse; font-size: 14px; }
.tbl th, .tbl td { padding: 10px 12px; border-bottom: 1px solid var(--line); }
.tbl thead th { background: #f8fbff; text-align: left; }
.tbl .num { text-align: right; font-variant-numeric: tabular-nums; }
.tbl tfoot th, .tbl tfoot td { font-weight: 700; }
.dot { display:inline-block; width:10px; height:10px; border-radius:50%; margin-right:8px; vertical-align:middle; }

.chartCard { display:flex; flex-direction: column; align-items:center; }
.ring { fill: none; stroke: #f1f5f9; stroke-width: 30; }

.seg { cursor: pointer; transition: stroke-width .18s ease, opacity .18s ease; opacity: .95; }

.legend { list-style: none; display:grid; grid-template-columns: 1fr 1fr; gap: 8px 12px; padding: 0; margin: 8px 0 0; width:100%; }
.legend li { display:flex; align-items:center; justify-content:space-between; gap:10px; border-bottom:1px dashed var(--line); padding:6px 0; transition: color .15s ease; }
.legend li.active .name { color: #0f172a; font-weight: 600; }
.legend .swatch { width:10px; height:10px; border-radius:50%; }
.legend .name { flex:1; margin-left:8px; color: var(--muted); }
.legend .val { font-variant-numeric: tabular-nums; }

.centerTitle { font-size: 13px; font-weight: 600; fill: #64748b; }
.centerSub { font-size: 14px; font-weight: 700; fill: #1C77F2; }
@media (max-width: 1024px) { .grid { grid-template-columns: 1fr; } }

.year-tabs {
  display: inline-flex;
  gap: 8px;
  margin: 6px 0 10px;
}

.year-tabs button {
  appearance: none;
  border: 1px solid var(--line);
  background: #fff;
  color: #334155;
  padding: 6px 10px;
  font-size: 13px;
  border-radius: 10px;
  cursor: pointer;
}

.year-tabs button.active {
  border-color: #1C77F2;
  color: #1C77F2;
  font-weight: 700;
  box-shadow: 0 2px 6px rgba(28,119,242,.12);
}

@media (min-width: 2560px) {
  .frsection1,
  .frsection2 {
    max-width: 1463px;   /* 1100px × 1.33 */
    margin: 53px auto;   /* 40px × 1.33 */
    padding: 0 27px;     /* 20px × 1.33 */
  }

  .pageHead h1 {
    font-size: 48px;     /* 36px × 1.33 */
    margin: 133px 0 11px;/* 100px × 1.33 */
  }

  .pageHead .sub1,
  .pageHead .sub2 {
    font-size: 26px;     /* 20px × 1.33 */
  }
  .pageHead .sub2 {
    margin-top: 106px;   /* 80px × 1.33 */
  }

  .card h2 {
    font-size: 24px;     /* 18px × 1.33 */
    margin-bottom: 21px; /* 16px × 1.33 */
  }

  .tbl {
    font-size: 18px;     /* 14px × 1.33 */
  }
  .tbl th, .tbl td {
    padding: 13px 16px;  /* 10×1.33 / 12×1.33 */
  }

  .legend {
    gap: 10px 16px;      /* 8×1.33 / 12×1.33 */
    margin-top: 11px;    /* 8px × 1.33 */
  }
  .legend li {
    padding: 8px 0;      /* 6px × 1.33 */
  }
  .legend .name {
    font-size: 1.2rem;   /* 글씨 조금 키움 */
  }

  .centerTitle {
    font-size: 17px;     /* 13px × 1.33 */
  }
  .centerSub {
    font-size: 19px;     /* 14px × 1.33 */
  }

  .year-tabs button {
    padding: 8px 13px;   /* 6×1.33 / 10×1.33 */
    font-size: 17px;     /* 13px × 1.33 */
    border-radius: 13px; /* 10px × 1.33 */
  }
}

</style>
