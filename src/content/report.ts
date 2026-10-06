// 홈과 푸터의 "참가 기록 제출" 진입 링크 노출 여부. /report 라우트와 기능은 그대로 둔다.
export const SHOW_REPORT_LINKS = false

export const REPORT_API_URL = 'https://script.google.com/macros/s/AKfycbxqAfHZmTqKh0ZVTW07BXDIJWawe4qMG1-Avcdy2tgTSve0tA9EsFmgtAtBMJenPDVv/exec'

export const reportRoles = ['참가', '스태프', '통역', '발표', '기타'] as const
export const reportSections = {
  publicity: {
    title: '② 후기와 사진, 홍보부',
    fields: [
      { key: 'p_scene', label: '인상 깊었던 장면', type: 'textarea' },
      { key: 'p_comment', label: '한 줄 소감', type: 'text' },
      { key: 'p_photo_link', label: '사진 링크 (드라이브, 인스타그램)', type: 'url' },
    ],
  },
  planning: {
    title: '③ 의견과 제안, 기획부',
    fields: [
      { key: 'k_issue', label: '불편했던 점', type: 'textarea' },
      { key: 'k_improvement', label: '개선 의견', type: 'textarea' },
      { key: 'k_next', label: '다음에 하고 싶은 것', type: 'textarea' },
      { key: 'k_partner_reaction', label: '교류 상대 반응', type: 'textarea' },
    ],
  },
  membership: {
    title: '④ 소속과 재참여, 회원부',
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

// 서버 응답(없으면 null = 연결 실패 또는 JSON 아님)을 화면 문구로 바꾼다. 회원 없음과 서버 오류를 섞지 않는다.
export const reportMessages = {
  lookupNotFound: '회원 기록을 찾지 못했습니다. 처음이면 회원 가입을 신청해 주세요. 기존 회원이면 회원 정보 갱신 폼을 소속 단과 동의 항목까지 모두 채워 다시 제출해 주세요.',
  lookupInvalid: '이름과 휴대전화 번호를 확인해 주세요.',
  lookupServerError: '회원 정보를 확인하는 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
  lookupNetwork: '서버에 연결하지 못했습니다. 인터넷 연결을 확인한 뒤 잠시 후 다시 시도해 주세요.',
  submitExpired: '회원 확인이 만료되었습니다. 다시 확인해 주세요.',
  submitInvalid: '입력 내용을 확인하고 다시 제출해 주세요.',
  submitUnconfirmed: '제출 결과를 확인하지 못했습니다. 이미 접수되었을 수 있습니다. 이 화면을 새로고침하거나 닫지 말고 입력 내용을 그대로 둔 채 다시 제출하면 한 번만 접수됩니다. 새로고침했거나 계속 안 되면 다시 제출하지 말고 wyea@wyea.info로 문의해 주세요.',
} as const

type ApiResult = Record<string, unknown> | null

// 빈 문자열이면 확인 성공
export function lookupMessage(result: ApiResult): string {
  if (!result) return reportMessages.lookupNetwork
  if (result.ok === true) return ''
  if (result.error === 'not_found') return reportMessages.lookupNotFound
  if (result.error === 'validation_failed') return reportMessages.lookupInvalid
  return reportMessages.lookupServerError
}

// 빈 문자열이면 접수 성공(같은 submission_id 재전송의 duplicate 응답 포함)
export function submitMessage(result: ApiResult): string {
  if (result && result.ok === true) return ''
  if (result && result.error === 'not_found') return reportMessages.submitExpired
  if (result && result.error === 'validation_failed') return reportMessages.submitInvalid
  return reportMessages.submitUnconfirmed
}

export function newSubmissionId(cryptoApi: Crypto | undefined = globalThis.crypto): string {
  if (cryptoApi && typeof cryptoApi.randomUUID === 'function') return cryptoApi.randomUUID()
  const bytes = new Uint8Array(16)
  if (cryptoApi && typeof cryptoApi.getRandomValues === 'function') cryptoApi.getRandomValues(bytes)
  else for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256)
  bytes[6] = (bytes[6]! & 0x0f) | 0x40
  bytes[8] = (bytes[8]! & 0x3f) | 0x80
  const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

// 제출 ID. 직전 시도와 같은 내용(제출 순간 고정한 JSON)으로 다시 보내면 같은 ID, 내용이 바뀌었으면 새 ID.
// 메모리에만 두므로 새로고침이나 창 닫기 뒤에는 이어지지 않는다. 성공하면 reset 한다.
export function createSubmissionAttempt(generate: () => string = () => newSubmissionId()) {
  let id: string | null = null
  let lastContent: string | null = null
  return {
    idFor(content: string): string {
      if (id === null || content !== lastContent) {
        id = generate()
        lastContent = content
      }
      return id
    },
    reset() {
      id = null
      lastContent = null
    },
  }
}
