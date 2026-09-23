// label(이름), amount(원)만 입력하면 색상이 자동 배정됩니다. color는 개별 지정할 때만 추가하세요.
export type Item = { label: string; amount: number; color?: string }

const palettes = {
  income: ['#1C77F2', '#60A5FA', '#1E40AF', '#38BDF8', '#3B82F6', '#93C5FD', '#075985', '#818CF8'],
  spending: ['#10B981', '#6EE7B7', '#065F46', '#34D399', '#15803D', '#A7F3D0', '#047857', '#4ADE80'],
} as const

// 순서대로 배정하며 팔레트를 모두 사용하면 처음부터 반복합니다. 원본 항목은 변경하지 않습니다.
export const withItemColors = (items: Item[], kind: keyof typeof palettes): Item[] =>
  items.map((item, index) => ({
    ...item,
    color: item.color ?? palettes[kind][index % palettes[kind].length] ?? palettes[kind][0],
  }))

export const incomeitems2025: Item[] = [
  { label: '행사 참가비 수입', amount: 350_000 },
]

export const incomeitems2026: Item[] = []
// #1C77F2 (진한 블루)2025 수입
// #2D99FF (중간 블루)
// #5EB1FF (밝은 블루)
// #7DC3FF (하늘색 톤)
// #A6C7F9 (파스텔 블루)
// #CFE4FF (아주 연한 블루)
// #525B61 (짙은 차콜)
// #6B7280 (미디엄 그레이)
// #9AA9B2 (밝은 그레이)
// #E2E8F0 (연한 실버톤)

export const spendingitems2025: Item[] = [
  { label: '봉사활동 장비', amount: 29_530 },
  { label: '운영비', amount: 83_228 },
  { label: '비상주 사무실 계약', amount: 396_000 },
  { label: '행사참가비', amount: 716_197 },
]

export const spendingitems2026: Item[] = [
  { label: '비상주 사무실 계약', amount: 330_000 },
]
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
