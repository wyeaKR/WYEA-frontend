// 공개가 확정된 공지만 이 배열에 추가합니다. slug는 중복 없는 영문 소문자·숫자·하이픈으로 작성하세요.
// 첨부파일은 public/에 둔 뒤 href에 /로 시작하는 공개 경로를 적습니다.
export type Notice = {
  slug: string
  title: string
  date: string // YYYY-MM-DD
  pinned?: boolean
  paragraphs: string[]
  attachments?: { label: string; href: string }[]
}

export const notices: Notice[] = []

export const noticePath = (notice: Notice) => `/notices/${notice.slug}`
