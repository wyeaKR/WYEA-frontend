import { defineStore } from 'pinia'
import authService from '@/model/auth-service.js'
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  UserInfoResponse,
} from '@/interface/user-interface.js'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    auth: null as LoginResponse | null,
    userInfo: { nickname: '', role: '' } as UserInfoResponse,
  }),

  actions: {
    /**
     * 로그인 메서드
     * 이 메서드는 사용자 인증 정보를 받아서
     * userService의 login 메서드를 호출함
     * 로그인 성공 시, auth 상태를 업데이트하고
     * 로컬 스토리지에 토큰을 저장함
     *
     * @param loginrequest
     */
    async login(loginrequest: LoginRequest): Promise<void> {
      const res = await authService.login(loginrequest)

      this.auth = res

      localStorage.setItem('accesstoken', this.auth.accessToken)
      localStorage.setItem('refreshtoken', this.auth.refreshToken)
      localStorage.setItem('username', this.auth.username)
    },

    /**
     * 회원가입 메서드
     * 이 메서드는 사용자 정보를 받아서
     * userService의 register 메서드를 호출함
     *
     * @param registerrequest
     * @return Promise<void>
     */
    async register(registerrequest: RegisterRequest): Promise<void> {
      await authService.register(registerrequest)
    },
  },
})
