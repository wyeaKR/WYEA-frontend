// 회원 가입 신청(/join) 설정과 문구입니다.
// 서버 검증 규칙은 apps-script/join/Code.gs와 같아야 합니다. 한쪽을 바꾸면 다른 쪽도 바꿉니다.

// Apps Script 웹 앱 배포의 /exec 주소입니다. 비어 있으면 제출 버튼이 비활성화됩니다.
export const JOIN_API_URL = 'https://script.google.com/macros/s/AKfycbw8Td0GHKezuBM2Xdrafk0tqf8dPTfpv7UxeEA72wLnn1UzGhfGRldDqdALvBicV0n7aw/exec'

// 동의문을 고치면 날짜를 바꿉니다. 신청 시트에 이 버전이 함께 저장됩니다.
export const CONSENT_VERSION = '2026-09-25'

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
  '우송정보대학',
] as const

export const occupations = ['대학생(재학)', '대학생(휴학)', '대학원생', '졸업생'] as const

// 관심 활동은 조직도(부서·단)와 지금까지 해 온 활동을 기준으로 정리했습니다. 1개 이상 골라야 합니다. interestMapping과 짝입니다.
export const interestOptions = [
  '해외 청년 교류회 참가',
  '교류회·행사 기획과 현장 운영',
  '지역사회 봉사활동',
  '음악·문화 교류',
  '외국어 회화·언어 교환',
  'SNS·콘텐츠 제작 (사진·영상·글)',
  '디자인·홍보물 제작',
  '글쓰기·기사 작성 (단체 신문)',
  '청년 정책 제안·간담회',
  '창업·공모전 프로젝트',
  '해외 단체·지역 기관과의 대외협력',
  '행정·문서 (회의록·서류)',
  '재무·회계',
  '대학 지부 운영·회원 모집',
] as const

export const referralOptions = ['에브리타임', '인스타그램', '지인 소개', '홈페이지'] as const

export type Track = 'member' | 'staff'

// ── 조직도(2026-09-26 확정) 기준 활동 분야 ──────────────────────
// 일반 트랙: 회원은 반드시 1개 단에 속합니다(5개 단 중 1개 필수). 집행부 트랙: 4개 부서 중 1지망 필수, 2지망 선택.
// 여기와 apps-script/join/Code.gs의 MEMBER_UNITS·DEPARTMENTS는 같아야 합니다.
export type MemberUnit = '기록단' | '행사지원단' | '통번역단' | '정책제안단' | '소모임'
export type Department = '총무부' | '기획부' | '홍보부' | '회원부'

export const memberUnits: { name: MemberUnit; desc: string; extra?: 'languages' | 'clubTopic' }[] = [
  { name: '기록단', desc: '활동을 사진·영상·글로 기록하고 홍보부와 함께 콘텐츠를 만듭니다.' },
  { name: '행사지원단', desc: '교류회와 행사 현장에서 기획부와 함께 운영을 돕습니다.' },
  { name: '통번역단', desc: '해외 청년과의 교류에서 통역·번역을 맡습니다.', extra: 'languages' },
  { name: '정책제안단', desc: '청년 문제를 정책 제안과 간담회로 풀어 갑니다.' },
  { name: '소모임', desc: '관심 주제로 소모임을 만들거나 참여합니다.', extra: 'clubTopic' },
]

export const departments: { name: Department; desc: string }[] = [
  { name: '총무부', desc: '회원 명부, 회의록, 공문과 재정을 관리합니다.' },
  { name: '기획부', desc: '교류회·봉사·행사를 기획하고 해외 단체·지역 기관과 협력합니다.' },
  { name: '홍보부', desc: 'SNS·콘텐츠, 디자인·홍보물, 단체 신문을 만듭니다.' },
  { name: '회원부', desc: '회원을 관리하고 대학 지부를 운영하며 새 회원을 모집합니다.' },
]

// 관심 활동 → 부서·단 매핑입니다. 집행부 트랙에서 1지망을 고르기 전 부서 추천에 씁니다.
// '해외 청년 교류회 참가'는 전 회원 공통이라 어느 단에도 매핑하지 않습니다.
export const interestMapping: Partial<Record<(typeof interestOptions)[number], Department | MemberUnit>> = {
  '행정·문서 (회의록·서류)': '총무부',
  '재무·회계': '총무부',
  '교류회·행사 기획과 현장 운영': '기획부',
  '해외 단체·지역 기관과의 대외협력': '기획부',
  '지역사회 봉사활동': '기획부',
  'SNS·콘텐츠 제작 (사진·영상·글)': '홍보부',
  '디자인·홍보물 제작': '홍보부',
  '글쓰기·기사 작성 (단체 신문)': '홍보부',
  '대학 지부 운영·회원 모집': '회원부',
  '외국어 회화·언어 교환': '통번역단',
  '청년 정책 제안·간담회': '정책제안단',
  '음악·문화 교류': '소모임',
  '창업·공모전 프로젝트': '소모임',
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
  address: 120,
  campus: 40,
  department: 60,
  studentId: 20,
  email: 120,
  other: 60,
  motivation: 1000,
  hopes: 1000,
  competencies: 1000,
  experience: 1000,
  capabilities: 1000,
  languages: 60,
  clubTopic: 60,
} as const

export const MIN_MOTIVATION = 20
// 집행부 지원서의 역량·할 수 있는 것 최소 글자 수입니다.
export const MIN_DETAIL = 20
export const MIN_AGE = 14

export type ConsentKey = 'collect' | 'thirdParty' | 'portrait'

export const consents: { key: ConsentKey; title: string; summary: string; details: string[] }[] = [
  {
    key: 'collect',
    title: '개인정보 수집·이용',
    summary: '회원 관리와 단체 등록용 회원명부 작성에 쓰며, 탈퇴 시까지 보관합니다.',
    details: [
      '목적: 회원 가입 및 관리, 활동 안내·연락, 비영리민간단체 등록 및 비영리법인 설립허가 신청을 위한 회원명부 작성',
      '항목: 성명, 생년월일, 성별, 휴대전화, 주소(도로명주소까지), 직업, 소속 대학·캠퍼스·학과·학번, 이메일, 지원 동기, 관심 활동, 활동 분야(소속 단 또는 희망 부서 1·2지망), 가능 언어(통번역단 선택 시), 관심 주제(소모임 선택 시), 해 보고 싶은 활동(선택), 가입 경로(선택). 집행부 지원 시 본인의 역량, 해 온 활동(선택), 할 수 있는 일',
      '보유 기간: 회원 탈퇴 시까지 (관계 법령에 보존 의무가 있는 경우 그 기간)',
    ],
  },
  {
    key: 'thirdParty',
    title: '개인정보 제3자 제공',
    summary: '단체 등록·설립허가 관할 행정기관에 회원명부 항목을 제공합니다.',
    details: [
      '제공받는 자: 비영리민간단체 등록 및 비영리법인 설립허가 관할 행정기관(주무관청, 시·도 등)',
      '제공 목적: 단체 등록·설립허가 신청 및 회원 요건 확인',
      '제공 항목: 성명, 생년월일, 직업, 연락처, 주소, 가입일',
      '보유 기간: 제공받는 기관의 문서 보존 기간',
    ],
  },
  {
    key: 'portrait',
    title: '초상권(사진·영상) 활용',
    summary: '활동 사진·영상을 보고서·웹사이트·SNS에 게시하며, 게시 전 거부하면 얼굴을 가려 드립니다.',
    details: [
      '목적: 원활한 활동 운영 및 활동 기록·보고',
      '내용: 행사와 활동 중에는 기록을 위해 촬영이 이루어지며, 촬영한 사진·영상을 활동 보고서, 단체 웹사이트·소셜 미디어에 게시·활용합니다.',
      '게시 시 얼굴 가림 요청: 행사 참여 신청 때 또는 활동 후 게시 전까지, 게시물에 본인 얼굴이 나오지 않기를 원하면 거부할 수 있습니다. 거부하면 업로드 전에 본인 얼굴을 블러 등으로 알아볼 수 없게 처리합니다. 거부 시 단체 운영을 위하여 거부 사유 기재를 요청할 수 있습니다.',
      '보유 기간: 게시물 게시 기간',
    ],
  },
]

export const consentNotice =
  '위 3개 항목은 가입에 필요한 필수 동의입니다. 동의를 거부할 권리가 있으나, 거부하면 가입할 수 없습니다. 이 동의와 관계없이 개인정보 보호법 등 관계 법령에 따른 정보주체의 권리는 보장됩니다.'

// ── "WYEA 알아보기" 화면 문구 ─────────────────────────────────────
// 가치관·앞으로의 계획은 대표가 확인한 문구입니다(2026-09-25). 확인되지 않은 계획을 확정된 것처럼 쓰지 않습니다.
export const about = {
  vision: {
    title: '국경을 넘어, 청년과 청년을 연결합니다',
    body: '서로 다른 언어와 문화를 가진 청년들이 직접 만나 경험을 나누고, 함께 배우며 관계를 이어 가는 것. 지금은 일본 청년들과의 교류로 시작했지만, WYEA가 바라보는 것은 전 세계의 청년입니다.',
  },
  // 가치관은 대표가 정한 문구입니다. body는 대표가 준 설명이 있을 때만 씁니다.
  values: [
    { title: '준비된 사람에게 기회가 찾아옵니다', body: '완벽히 준비되지 않아도 됩니다.' },
    { title: '같이 성장합니다', body: '' },
    { title: '수평적 문화를 위해 노력합니다', body: '' },
    { title: '자율적으로 움직입니다', body: '' },
  ],
  future: [
    { when: '2026년 안', what: '비영리민간단체 등록' },
    { when: '2026년 겨울방학', what: '새 교류회 개최 (일본 외 다른 나라·단체와의 교류도 추진)' },
    { when: '2027년 1월', what: '도쿄 교류회' },
  ],
} as const

// ── "알고 있어요" 확인 퀴즈 ──────────────────────────────────────
// 모두 맞히면 지원서로 넘어갑니다. 정답은 "WYEA 알아보기" 화면과 홈페이지에서 확인할 수 있어야 합니다.
export const quiz: { question: string; options: string[]; answer: number; explain: string }[] = [
  {
    question: 'WYEA가 지금까지 가장 많이 해 온 활동은 무엇일까요?',
    options: ['해외 청년들과의 교류회', '어학 자격증 강의', '해외 취업 알선', '창업 지원'],
    answer: 0,
    explain: '서울 교류회, 도쿄 피크닉, 오사카 교류회, 한일음악교류회처럼 해외 청년들과 직접 만나는 교류회를 가장 많이 열었습니다.',
  },
  {
    question: 'WYEA가 교류를 이어 온 해외 청년 단체는 어디일까요?',
    options: ['재일본대한민국청년회', '국제연합(UN) 청년위원회', '일본 대학 총학생회', '해외 한인 유학생회'],
    answer: 0,
    explain: '2025년 6월 재일본대한민국청년회와 협력 관계를 맺고 서울·도쿄·오사카에서 교류해 왔습니다.',
  },
  {
    question: 'WYEA가 교류하려는 대상은 누구일까요?',
    options: ['한국과 일본 청년만', '전 세계의 청년', '해외 취업을 준비하는 사람만', '같은 대학 학생만'],
    answer: 1,
    explain: '지금은 일본 청년들과의 교류로 시작했지만, WYEA가 바라보는 것은 전 세계의 청년입니다.',
  },
]
