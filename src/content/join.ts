// 회원 가입 신청(/join) 설정과 문구입니다.
// 서버 검증 규칙은 apps-script/join/Code.gs와 같아야 합니다. 한쪽을 바꾸면 다른 쪽도 바꿉니다.

// Apps Script 웹 앱 배포의 /exec 주소입니다. 비어 있으면 제출 버튼이 비활성화됩니다.
export const JOIN_API_URL = 'https://script.google.com/macros/s/AKfycbw8Td0GHKezuBM2Xdrafk0tqf8dPTfpv7UxeEA72wLnn1UzGhfGRldDqdALvBicV0n7aw/exec'

// 동의문을 고치면 날짜를 바꿉니다. 신청 시트에 이 버전이 함께 저장됩니다.
export const CONSENT_VERSION = '2026-10-06-v4'

export const universities = [
  '국립창원대학교',
  '경상국립대학교',
  '경남대학교',
  '인제대학교',
  '부산대학교',
  '계명대학교',
  '대구대학교',
  '마산대학교',
  '경희대학교',
  '서울대학교',
  '서울시립대학교',
  '연세대학교',
] as const

export const occupations = ['대학생(재학)', '대학생(휴학)'] as const

// 관심 활동은 조직도(부서, 단)와 지금까지 해 온 활동을 기준으로 정리했습니다. interestMapping과 짝입니다.
export const interestOptions = [
  '해외 청년 교류회 참가',
  '교류회와 행사 기획 및 현장 운영',
  '지역사회 봉사활동',
  '음악과 문화 교류',
  '외국어 회화와 언어 교환',
  'SNS와 콘텐츠 제작 (사진, 영상, 글)',
  '디자인과 홍보물 제작',
  '글쓰기와 기사 작성 (단체 신문)',
  '청년 정책 제안과 간담회',
  '창업과 공모전 프로젝트',
  '해외 단체와 지역 기관과의 대외협력',
  '행정과 문서 (회의록, 서류)',
  '재무와 회계',
  '대학 지부 운영과 회원 모집',
] as const

export const referralOptions = ['에브리타임', '인스타그램', '지인 소개', '홈페이지'] as const

export type Track = 'member' | 'staff'

// ── 조직도(2026-09-26 확정) 기준 활동 분야 ──────────────────────
// 일반 가입은 단 1개 필수, 집행부는 희망 부서 1개 필수입니다.
// 여기와 apps-script/join/Code.gs의 MEMBER_UNITS, DEPARTMENTS는 같아야 합니다.
export type MemberUnit = '기록단' | '행사지원단' | '통번역단' | '정책제안단' | '소모임'
export type Department = '총무부' | '기획부' | '홍보부' | '회원부'

export const memberUnits: { name: MemberUnit; desc: string; extra?: 'languages' | 'clubTopic' }[] = [
  { name: '기록단', desc: '활동을 사진, 영상, 글로 기록하고 홍보부와 함께 콘텐츠를 만듭니다.' },
  { name: '행사지원단', desc: '교류회와 행사 현장에서 기획부와 함께 운영을 돕습니다.' },
  { name: '통번역단', desc: '해외 청년과의 교류에서 통역과 번역을 맡습니다.', extra: 'languages' },
  { name: '정책제안단', desc: '청년 문제를 정책 제안과 간담회로 풀어 갑니다.' },
  { name: '소모임', desc: '관심 주제로 소모임을 만들거나 참여합니다.', extra: 'clubTopic' },
]

export const departments: { name: Department; desc: string }[] = [
  { name: '총무부', desc: '회원 명부, 회의록, 공문과 재정을 관리합니다.' },
  { name: '기획부', desc: '교류회, 봉사, 행사를 기획하고 해외 단체와 지역 기관과 협력합니다.' },
  { name: '홍보부', desc: 'SNS와 콘텐츠, 디자인과 홍보물, 단체 신문을 만듭니다.' },
  { name: '회원부', desc: '회원을 관리하고 대학 지부를 운영하며 새 회원을 모집합니다.' },
]

// 관심 활동을 부서와 단에 매핑합니다. 집행부 트랙에서 희망 부서를 고르기 전 추천에 씁니다.
// '해외 청년 교류회 참가'는 전 회원 공통이라 어느 단에도 매핑하지 않습니다.
export const interestMapping: Partial<Record<(typeof interestOptions)[number], Department | MemberUnit>> = {
  '행정과 문서 (회의록, 서류)': '총무부',
  '재무와 회계': '총무부',
  '교류회와 행사 기획 및 현장 운영': '기획부',
  '해외 단체와 지역 기관과의 대외협력': '기획부',
  '지역사회 봉사활동': '기획부',
  'SNS와 콘텐츠 제작 (사진, 영상, 글)': '홍보부',
  '디자인과 홍보물 제작': '홍보부',
  '글쓰기와 기사 작성 (단체 신문)': '홍보부',
  '대학 지부 운영과 회원 모집': '회원부',
  '외국어 회화와 언어 교환': '통번역단',
  '청년 정책 제안과 간담회': '정책제안단',
  '음악과 문화 교류': '소모임',
  '창업과 공모전 프로젝트': '소모임',
}

// 고른 관심 활동 중 부서에 해당하는 것을 세어 가장 많은 부서를 돌려줍니다. 동점이면 모두 돌려줍니다.
export function recommendDepartments(interests: readonly string[]): Department[] {
  const counts = new Map<Department, number>()
  const names: string[] = departments.map((d) => d.name)
  for (const i of interests) {
    const target = interestMapping[i as (typeof interestOptions)[number]]
    if (target && names.includes(target)) counts.set(target as Department, (counts.get(target as Department) ?? 0) + 1)
  }
  const max = Math.max(0, ...counts.values())
  return max === 0 ? [] : departments.map((d) => d.name).filter((d) => counts.get(d) === max)
}

export const limits = {
  name: 30,
  campus: 40,
  department: 60,
  email: 120,
  other: 60,
  motivation: 1000,
  hopes: 100,
  competencies: 1000,
  experience: 1000,
  capabilities: 1000,
  languages: 60,
  clubTopic: 60,
} as const

export const MIN_MOTIVATION = 20
// 구버전 집행부 지원서의 역량과 할 수 있는 것 최소 글자 수입니다.
export const MIN_DETAIL = 20
export const MIN_AGE = 14

export type ConsentKey = 'collect'

export const consents: { key: ConsentKey; title: string; summary: string; details: string[] }[] = [
  {
    key: 'collect',
    title: '개인정보 수집 및 이용',
    summary: '회원 가입과 관리, 활동 안내와 연락에 쓰며, 탈퇴 시까지 보관합니다.',
    details: [
      '목적: 회원 가입 및 관리, 활동 안내와 연락',
      '일반 가입 필수 항목: 성명, 생년월일, 휴대전화, 소속 대학, 캠퍼스, 학과, 소속 단. 선택 항목: 이메일',
      '집행부 지원 필수 항목: 성명, 생년월일, 휴대전화, 성별, 직업, 소속 대학, 캠퍼스, 학과, 희망 부서. 선택 항목: 이메일, 관심 활동, 활동에서 얻어가고 싶은 것',
      '보유 기간: 회원 탈퇴 시까지 (관계 법령에 보존 의무가 있는 경우 그 기간)',
    ],
  },
]

export const consentNotice =
  '개인정보 수집 및 이용 동의는 가입에 필요한 필수 동의입니다. 동의를 거부할 권리가 있으나, 거부하면 가입할 수 없습니다. 이 동의와 관계없이 개인정보 보호법 등 관계 법령에 따른 정보주체의 권리는 보장됩니다.'
