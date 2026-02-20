import axios, { AxiosError, AxiosHeaders, type AxiosRequestHeaders } from 'axios'
import router from '@/router/index.js'
import { isTokenExpired } from '@/utils/token-utils.js'
import type { ReissueResponse, CustomAxiosRequestConfig } from '@/interface/user-interface.js'

const BASE_URL = 'http://localhost:8080'
let redirectedAfterRefresh = false
const REDIRECT_ON_REFRESH = true // 리다이렉트 끄고 싶으면 false

/**
 * Axios 인스턴스 생성
 * 기본 URL 설정
 */
const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: false,
})

/**
 * 헤더에 Authorization 토큰을 추가하는 함수
 *
 * @param headers 3개 타입 중 하나: AxiosHeaders, AxiosRequestHeaders, Record<string, unknown>
 * @param token   Bearer 토큰 문자열
 * @returns void
 * @description AxiosHeaders: set 메서드 사용하고,
 *              Record<string, unknown>: 직접 키값 추가
 */
function setAuthHeader(
  headers: AxiosHeaders | AxiosRequestHeaders | Record<string, unknown>,
  token: string,
) {
  if (headers && typeof (headers as AxiosHeaders).set === 'function') {
    ;(headers as AxiosHeaders).set('Authorization', `Bearer ${token}`)
    return
  }
  ;(headers as Record<string, unknown>)['Authorization'] = `Bearer ${token}`
}

/**
 * 요청 인터셉터에서 Authorization 헤더에 추가여부 체크 유효하지 않으면 백엔드에서 401 에러를 띄우고
 * 이후 응답 인터셉터 401에러가 떳을시 엑세스 토큰 재발급 로직을 처리함.
 */

/**
 * Axios 요청 인터셉터
 *
 * @param AxiosRequestConfig Axios 요청 설정
 * @returns AxiosRequestConfig
 * @description .api로 호촐된 매 axios 요청 전에 Authorization 헤더를 추가
 *              로컬 스토리지에서 액세스 토큰을 가져와서
 *              config.headers가 없으면 빈 객체로 초기화
 *              토큰이 유효하지 않으면 헤더에 Authorization 추가하지 않음
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accesstoken')

    if (!config.headers) config.headers = {} as AxiosRequestHeaders
    if (token && !isTokenExpired(token)) {
      setAuthHeader(config.headers, token)
    }
    return config
  },
  (error) => Promise.reject(error),
)

/**
 * Axios 응답 인터셉터
 *
 * @param error AxiosError
 * @return Promise<AxiosError>
 * @description 응답 오류가 발생했을 때, 401 상태 코드인 경우
 *              리프레시 토큰을 사용하여 액세스 토큰을 재발급하고
 *              재시도하는 로직을 구현
 */

api.interceptors.response.use(
  (response) => response, // 성공적인 응답은 그대로 반환
  async (error: AxiosError) => {
    // 요청실패 했을시
    const failedConfig = error.config as CustomAxiosRequestConfig | undefined // 실패한 Axios 요청 설정
    const status = error.response?.status // 실패한 응답 상태 코드
    const failedUrl = failedConfig?.url || '' // 실패한 요청의 URL

    // 리프레시 토큰 재발급 엔드포인트 재시도 막기
    if (failedUrl.includes('/reissueaccesstokens')) {
      console.warn('[RES ERR] reissue endpoint error; stop retry.')
      return Promise.reject(error)
    }
    // 401 상태 코드인 경우(401 = 토큰이 이상할때), axios요청을 실패했나 ,리프레쉬 토큰 재시도 안했나
    if (status === 401 && failedConfig && !failedConfig._retry) {
      failedConfig._retry = true // 토큰 발급 시도 했다고 표시

      try {
        const refreshToken = localStorage.getItem('refreshtoken') // 로컬 스토리지에서 리프레시 토큰 가져오기
        if (!refreshToken) {
          throw new Error('Refresh token not found')
        }
        const { data } = await api.post<ReissueResponse>('/reissueaccesstokens', {
          refreshToken,
        }) // 리프레시 토큰을 사용하여 액세스 토큰 재발급 요청 -> /reissueaccesstokens api 호출

        const newAccessToken = data.accessToken // Response 데이터에서 새 액세스 토큰 추출
        if (!newAccessToken) throw new Error('No accessToken in response')

        localStorage.setItem('accesstoken', newAccessToken)

        if (!failedConfig.headers) {
          failedConfig.headers = {} as AxiosRequestHeaders // 백엔드 이상해서 토큰 발급을 못받았을 경우 헤더가 없으면 헤더를 비어있는 객체로 초기화
        }
        setAuthHeader(failedConfig.headers, newAccessToken) // 새 액세스 토큰을 요청 헤더에 추가

        if (REDIRECT_ON_REFRESH && !redirectedAfterRefresh) {
          // 아직 리다이렉트하지 않았다면 리다이렉트
          redirectedAfterRefresh = true
          const currentPath = router.currentRoute.value.path // 현재 경로를 가져옴
          if (currentPath !== '/' && currentPath !== '/login') {
            // 현재 경로가 홈이나 로그인 페이지가 아니면
            router.replace('/') // 홈으로 리다이렉트
          }
        }

        return api(failedConfig) // 새 액세스 토큰을 사용하여 실패한 요청을 재시도
      } catch (reissueErr) {
        // 리프레시 토큰 재발급 실패
        localStorage.clear() // 로컬 스토리지의 토큰 제거
        router.push('/login') // 로그인 페이지로 리다이렉트
        return Promise.reject(reissueErr) // 재발급 실패 에러를 반환
      }
    }

    return Promise.reject(error)
  },
)

export default api
