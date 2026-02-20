// 토큰이 유효한지 검사하는 함수
// 토큰이 문자열 or null or undefined으로 인자를 받아서 true, false를 반환함
// 토큰이 null or undefined or ''(빈 문자열)이면 만료된 것으로 true반환
// try -> .을 기준으로 토큰을 헤더, 페이팔로드, 사인으로 나눔, 3개로 나눠지지 않으면 true반환
//     -> payload만 추출
//     -> 디코딩
//     -> json객체로 변환
//     -> 현재시간을 구하기 Date.now() = ms라서 1000을 나눠 초로 표기
//     -> payload의 만료시간 이 현재보다 작다면? 이미 만료된 토큰 true반환

export function isTokenExpired(token: string | null | undefined): boolean {
  if (!token) return true

  try {
    const parts = token.split('.')
    if (parts.length !== 3) return true

    const payloadBase64 = parts[1]
    if (!payloadBase64) return true

    const payloadJson = atob(payloadBase64)
    const payload = JSON.parse(payloadJson)
    const now = Math.floor(Date.now() / 1000)

    return payload.exp < now
  } catch (e) {
    console.error('토큰 파싱 실패:', e)
    return true
  }
}
