export const REPORT_API_URL = 'https://script.google.com/macros/s/AKfycbxqAfHZmTqKh0ZVTW07BXDIJWawe4qMG1-Avcdy2tgTSve0tA9EsFmgtAtBMJenPDVv/exec'

export const reportRoles = ['참가', '스태프', '통역', '발표', '기타'] as const
export const reportSections = {
  publicity: {
    title: '② 후기·사진 · 홍보부',
    fields: [
      { key: 'p_scene', label: '인상 깊었던 장면', type: 'textarea' },
      { key: 'p_comment', label: '한 줄 소감', type: 'text' },
      { key: 'p_photo_link', label: '사진 링크 (드라이브·인스타그램)', type: 'url' },
    ],
  },
  planning: {
    title: '③ 의견·제안 · 기획부',
    fields: [
      { key: 'k_issue', label: '불편했던 점', type: 'textarea' },
      { key: 'k_improvement', label: '개선 의견', type: 'textarea' },
      { key: 'k_next', label: '다음에 하고 싶은 것', type: 'textarea' },
      { key: 'k_partner_reaction', label: '교류 상대 반응', type: 'textarea' },
    ],
  },
  membership: {
    title: '④ 소속·재참여 · 회원부',
    fields: [
      { key: 'm_club_topic', label: '소모임 희망 주제', type: 'text' },
      { key: 'm_companions', label: '함께 활동한 사람', type: 'text' },
      { key: 'm_rejoin', label: '다음 참여 의사', type: 'select' },
    ],
  },
} as const

export type ReportSectionKey = keyof typeof reportSections
export const reportSectionOrder: ReportSectionKey[] = ['publicity', 'planning', 'membership']
export function orderedReportSections(team: string): ReportSectionKey[] {
  const first: ReportSectionKey = team === '기록단' ? 'publicity' : team === '소모임' ? 'membership' : 'planning'
  return [first, ...reportSectionOrder.filter(section => section !== first)]
}
