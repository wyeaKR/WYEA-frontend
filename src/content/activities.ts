import seoulPhoto1 from '@/assets/picture/251102서울교류회1.jpg'
import seoulPhoto2 from '@/assets/picture/251102서울교류회2.jpg'
import tokyoPhoto from '@/assets/picture/260418도쿄피크닉.jpg'
import osakaPhoto from '@/assets/picture/260421오사카교류회.jpg'
import samwonPhoto from '@/assets/picture/260304삼원가정봉사원파견센터봉사활동.jpg'
import musicPhoto1 from '@/assets/picture/260829제2회한일음악교류회1.jpg'
import musicPhoto2 from '@/assets/picture/260829제2회한일음악교류회2.jpg'

export const activityCategories = {
  EXCHANGE: '국제교류',
  VOLUNTEERING: '봉사활동',
} as const

export const seoulExchange = {
  path: '/activities/2025-seoul-exchange',
  title: '재일본대한민국청년회와 서울 교류회',
  date: '2025년 11월 1~3일',
  startDate: '2025-11-01',
  endDate: '2025-11-03',
  location: '서울',
  category: 'EXCHANGE' as const,
  partnerLabel: '교류 단체',
  partner: '재일본대한민국청년회',
  paragraphs: [
    '재일본대한민국청년회 멤버들과 처음으로 직접 만나 서로를 알아가고 교류하는 시간을 가졌습니다. 함께 다양한 한국 음식을 맛보며 자연스럽게 이야기를 나누었고, 전통시장 탐방과 한약방 체험 등을 통해 한국의 일상적인 문화와 전통을 함께 경험했습니다. 또한 방탈출과 같은 활동을 함께하며 친밀감을 쌓고, 북카페에서는 한국어로 된 책을 살펴보며 한국의 언어와 문화에 대해서도 이야기를 나눴습니다.',
    '문화 체험뿐만 아니라 재일한국인 청년으로서 일본에서 생활하며 겪었던 경험과 여러 이슈에 대한 이야기도 직접 들어볼 수 있었습니다. 서로 다른 환경에서 살아온 청년들이 각자의 경험과 생각을 공유하면서, 평소에는 쉽게 접하기 어려웠던 재일한국인 청년들의 시각과 고민을 이해해볼 수 있는 시간이었습니다.',
    '이번 서울 교류회는 단순히 함께 활동하는 것을 넘어 서로의 문화와 경험을 직접 나누며 가까워질 수 있었던 첫 만남이었습니다. 이를 계기로 앞으로도 한국과 일본의 청년들이 지속적으로 만나 서로를 이해하고 교류할 수 있는 관계를 이어가고자 합니다.',
  ],
  photos: [seoulPhoto1, seoulPhoto2],
}

export const tokyoPicnic = {
  path: '/activities/2026-tokyo-picnic',
  title: '재일본대한민국청년회와 도쿄 피크닉',
  date: '2026년 4월 18일',
  startDate: '2026-04-18',
  endDate: '2026-04-18',
  location: '도쿄',
  category: 'EXCHANGE' as const,
  partnerLabel: '교류 단체',
  partner: '재일본대한민국청년회',
  paragraphs: [
    '세계청년교류연합(WYEA)은 2026년 4월 18일 도쿄에서 재일본대한민국청년회와 피크닉을 함께했습니다.',
    '이번 피크닉에서는 간단한 간식을 함께 나누며 서로의 일상과 관심사에 대해 이야기하고, 자유로운 분위기 속에서 교류하는 시간을 가졌습니다. 한국과 일본에서 활동하는 청년들이 서로를 알아가고 친목을 다질 수 있는 뜻깊은 자리였습니다.',
  ],
  photos: [tokyoPhoto],
}

export const osakaExchange = {
  path: '/activities/2026-osaka-exchange',
  title: '재일본대한민국청년회 오사카지부와 교류회',
  date: '2026년 4월 21일',
  startDate: '2026-04-21',
  endDate: '2026-04-21',
  location: '오사카',
  category: 'EXCHANGE' as const,
  partnerLabel: '교류 단체',
  partner: '재일본대한민국청년회',
  paragraphs: [
    '세계청년교류연합(WYEA)은 2026년 4월 21일 오사카에서 재일본대한민국청년회 오사카지부와 교류회를 진행했습니다',
    '이번 교류회는 양 단체 구성원들이 처음으로 함께한 자리로, 서로의 단체와 활동을 소개하고 다양한 이야기를 나누며 알아가는 시간을 가졌습니다. 편안한 분위기 속에서 서로의 활동과 관심사를 공유하며 앞으로의 교류를 위한 첫 인연을 만들었습니다.',
  ],
  photos: [osakaPhoto],
}

export const samwonVolunteering = {
  path: '/activities/2026-samwon-volunteering',
  title: '삼원가정봉사원파견센터 봉사활동',
  date: '2026년 3월 4일',
  startDate: '2026-03-04',
  endDate: '2026-03-04',
  location: '삼원가정봉사원파견센터',
  category: 'VOLUNTEERING' as const,
  partnerLabel: '활동 기관',
  partner: '삼원가정봉사원파견센터',
  paragraphs: [
    '세계청년교류연합(WYEA)은 삼원가정봉사원파견센터와 협력 관계를 체결하고, 지역사회에 도움이 될 수 있는 활동을 함께 이어가기 위한 첫걸음을 시작했습니다.',
    '협력 관계 체결과 함께 센터를 방문하여 필요한 일손을 돕는 봉사활동도 진행했습니다. 센터에서 사용할 책상과 의자를 직접 조립하고 필요한 위치로 옮기는 등 시설 정리를 도우며, 현장에서 실제로 필요한 업무에 힘을 보탰습니다. 크고 특별한 활동보다는 당장 필요한 일을 함께 해결하는 데 집중하며 직접 몸을 움직여 봉사에 참여했습니다.',
    '이번 활동을 통해 단순히 협력 관계를 맺는 것에서 그치지 않고, 직접 현장을 방문해 함께 활동하며 지역사회와 연결되는 시간을 가질 수 있었습니다. 앞으로도 삼원가정봉사원파견센터와 지속적으로 소통하며 청년들이 직접 참여할 수 있는 다양한 봉사와 협력 활동을 이어가고자 합니다.'
  ],
  photos: [samwonPhoto],
}

export const musicExchange = {
  path: '/activities/2026-korea-japan-music-exchange',
  title: '제2회 한일음악교류회',
  date: '2026년 8월 29일',
  startDate: '2026-08-29',
  endDate: '2026-08-29',
  location: '오사카',
  category: 'EXCHANGE' as const,
  partnerLabel: '교류 단체',
  partner: '재일본대한민국청년회',
  paragraphs: [
    '이번 교류회는 한국과 일본의 청년들이 음악을 매개로 함께 소통하고 교류하기 위해 마련되었습니다. 참가자들은 다양한 음악과 공연을 함께 즐기며 서로의 문화를 가까이에서 경험하고, 국경을 넘어 하나가 되는 시간을 가졌습니다',
    '음악이라는 공통의 관심사를 통해 자연스럽게 어울리고 서로를 이해할 수 있었던 뜻깊은 교류의 자리였습니다.',
  ],
  photos: [musicPhoto1, musicPhoto2],
}

export const activities: Array<{
  path: string;
  title: string;
  date: string;
  startDate: string;
  endDate: string;
  location: string;
  category: keyof typeof activityCategories;
  partnerLabel: string;
  partner: string;
  paragraphs: string[];
  photos: string[];
}> = [musicExchange, osakaExchange, tokyoPicnic, samwonVolunteering, seoulExchange]
