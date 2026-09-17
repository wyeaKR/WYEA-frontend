import placeholderPhoto from '@/assets/picture/251102서울교류회1.jpg'
import samwonPhoto from '@/assets/picture/260304삼원가정봉사원파견센터봉사활동.jpg'
import musicPhoto1 from '@/assets/picture/260829제2회한일음악교류회1.jpg'
import musicPhoto2 from '@/assets/picture/260829제2회한일음악교류회2.jpg'

// Temporary photos selected by the user; replace per activity when confirmed.
export const seoulExchange = {
  path: '/activities/2025-seoul-exchange',
  title: '재일본대한민국청년회와 서울 교류회',
  date: '2025년 11월 1~3일',
  startDate: '2025-11-01',
  endDate: '2025-11-03',
  location: '서울',
  heading: '서울에서 함께한 교류',
  photo: placeholderPhoto,
  partner: '재일본대한민국청년회',
  summary: '세계청년교류연합(WYEA)는 2025년 11월 1일부터 3일까지 서울에서 재일본대한민국청년회와 교류회를 진행했습니다.',
  paragraphs: [
    '재일본대한민국청년회 멤버들과 처음으로 직접 만나 서로를 알아가고 교류하는 시간을 가졌습니다. 함께 다양한 한국 음식을 맛보며 자연스럽게 이야기를 나누었고, 전통시장 탐방과 한약방 체험 등을 통해 한국의 일상적인 문화와 전통을 함께 경험했습니다. 또한 방탈출과 같은 활동을 함께하며 친밀감을 쌓고, 북카페에서는 한국어로 된 책을 살펴보며 한국의 언어와 문화에 대해서도 이야기를 나눴습니다.',
    '문화 체험뿐만 아니라 재일한국인 청년으로서 일본에서 생활하며 겪었던 경험과 여러 이슈에 대한 이야기도 직접 들어볼 수 있었습니다. 서로 다른 환경에서 살아온 청년들이 각자의 경험과 생각을 공유하면서, 평소에는 쉽게 접하기 어려웠던 재일한국인 청년들의 시각과 고민을 이해해볼 수 있는 시간이었습니다.',
    '이번 서울 교류회는 단순히 함께 활동하는 것을 넘어 서로의 문화와 경험을 직접 나누며 가까워질 수 있었던 첫 만남이었습니다. 이를 계기로 앞으로도 한국과 일본의 청년들이 지속적으로 만나 서로를 이해하고 교류할 수 있는 관계를 이어가고자 합니다.',
  ],
}

export const tokyoPicnic = {
  path: '/activities/2026-tokyo-picnic',
  title: '재일본대한민국청년회와 도쿄 피크닉',
  date: '2026년 4월 18일',
  startDate: '2026-04-18',
  endDate: '2026-04-18',
  location: '도쿄',
  heading: '도쿄에서 함께한 피크닉',
  partner: '재일본대한민국청년회',
  summary: '세계청년교류연합(WYEA)는 2026년 4월 18일 도쿄에서 재일본대한민국청년회와 피크닉을 함께했습니다.',
  photo: placeholderPhoto,
}

export const osakaExchange = {
  path: '/activities/2026-osaka-exchange',
  title: '재일본대한민국청년회 오사카지부와 교류회',
  date: '2026년 4월 21일',
  startDate: '2026-04-21',
  endDate: '2026-04-21',
  location: '오사카',
  heading: '오사카에서 함께한 교류',
  partner: '재일본대한민국청년회',
  summary: '세계청년교류연합(WYEA)는 2026년 4월 21일 오사카에서 재일본대한민국청년회 오사카지부와 교류회를 진행했습니다.',
  photo: placeholderPhoto,
}

export const samwonVolunteering = {
  path: '/activities/2026-samwon-volunteering',
  title: '삼원가정봉사원파견센터 봉사활동',
  date: '2026년 3월 4일',
  startDate: '2026-03-04',
  endDate: '2026-03-04',
  location: '삼원가정봉사원파견센터',
  heading: '삼원가정봉사원파견센터에서의 봉사활동',
  category: 'VOLUNTEERING',
  partnerLabel: '활동 기관',
  partner: '삼원가정봉사원파견센터',
  summary: '세계청년교류연합(WYEA)은 2026년 3월 4일 삼원가정봉사원파견센터에서 봉사활동을 진행했습니다.',
  photo: samwonPhoto,
}

export const musicExchange = {
  path: '/activities/2026-korea-japan-music-exchange',
  title: '제2회 한일음악교류회',
  date: '2026년 8월 29일',
  startDate: '2026-08-29',
  endDate: '2026-08-29',
  location: '오사카',
  heading: '제2회 한일음악교류회 활동 기록',
  partner: '재일본대한민국청년회',
  summary: '2026년 8월 29일 제2회 한일음악교류회가 열렸습니다.',
  photo: musicPhoto1,
  photos: [musicPhoto1, musicPhoto2],
}

export const activities: Array<{
  path: string; title: string; date: string; startDate: string; endDate: string;
  location?: string; heading: string; partner?: string; summary: string; paragraphs?: string[];
  photo: string | null; photos?: string[]; category?: string; partnerLabel?: string;
}> = [musicExchange, osakaExchange, tokyoPicnic, samwonVolunteering, seoulExchange]
