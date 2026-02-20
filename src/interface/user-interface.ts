import type { AxiosRequestConfig } from 'axios'

// 로그인용 보내기
export interface LoginRequest {
  username: string
  password: string
}

// 로그인 Response용 받기
export interface LoginResponse {
  accessToken: string
  refreshToken: string
  username: string
}

// 회원가입용 보내기
export interface RegisterRequest {
  username: string
  password: string
  nickname: string
}

// 사용자 정보 조회용 받기
export interface UserInfoResponse {
  username: string
  nickname: string
  role: string
}

// 사용자정보 수정용 보내기
export interface UserUpdateRequest {
  nickname?: string
  currentPassword?: string
  newPassword?: string
}

// 토큰 재발급 응답 형식
export interface ReissueResponse {
  accessToken: string
}

// 요청 중복 방지용 커스텀 에러 인터페이스
export interface CustomAxiosRequestConfig extends AxiosRequestConfig {
  _retry?: boolean
}
