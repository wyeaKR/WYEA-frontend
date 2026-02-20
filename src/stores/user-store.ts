import { defineStore } from 'pinia'
import userService from '@/model/user-service.js'
import type {
  LoginResponse,
  UserInfoResponse,
  UserUpdateRequest,
} from '@/interface/user-interface.js'

//Pinia에서 'user'라는 이름의 스토어 정의
//useUserStore: 컴포넌트(.vue)에서 useUserStore()로 호출해 사용하기 위한 함수
export const useUserStore = defineStore('user', {
  state: () => ({
    auth: null as LoginResponse | null,
    userInfo: { nickname: '', role: '' } as UserInfoResponse,
  }),

  getters: {
    role: (state) => String(state.userInfo?.role || 'USER'), // 사용자 역할
    isLoggedIn: (state) => !!state.auth, // 로그인 상태 유무
  },

  actions: {
    /**
     * 로컬 스토리지에 저장된 토큰을 기반으로
     * 사용자 인증 정보를 초기화하는 메서드
     */
    initializeAuth() {
      const accesstoken = localStorage.getItem('accesstoken')
      const refreshtoken = localStorage.getItem('refreshtoken')
      const username = localStorage.getItem('username')
      if (accesstoken && refreshtoken && username) {
        this.auth = { accessToken: accesstoken, refreshToken: refreshtoken, username: username }
      }
    },
    /**
     * 사용자 정보 조회 메서드
     * 이 메서드는 사용자 정보를 가져와서
     * Pinia 스토어의 userInfo 상태를 업데이트함
     *
     * @return Promise<void>
     */
    async getMyInfo(): Promise<void> {
      const res = await userService.getMyInfo()
      this.userInfo = res.data
    },

    /**
     * 사용자 정보 수정 메서드
     *
     * @param userUpdateRequest
     */
    async updateMyInfo(userUpdateRequest: UserUpdateRequest): Promise<void> {
      await userService.updateMyInfo(userUpdateRequest)
    },

    /**
     * 로그아웃 메서드
     * 이 메서드는 사용자 인증 정보를 초기화하고
     * 로컬 스토리지의 토큰을 제거함
     */
    async logout() {
      try {
        localStorage.getItem('refreshtoken')
      } finally {
        this.auth = null
        localStorage.clear()
      }
    },
  },
})
