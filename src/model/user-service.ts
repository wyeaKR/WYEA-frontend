import api from '@/plugins/axios.js'
import type { UserInfoResponse, UserUpdateRequest } from '@/interface/user-interface.js'

const config = {
  baseUrl: 'http://localhost:8080/',
}

const userService = {
  // 내 정보 조회
  getMyInfo: () =>
    api<UserInfoResponse>({
      method: 'post',
      url: config.baseUrl + 'user/me',
    }),

  // 내 정보 수정
  updateMyInfo: (userUpdateRequest: UserUpdateRequest) =>
    api<void>({
      method: 'post',
      url: config.baseUrl + 'user/update',
      data: userUpdateRequest,
    }),
}

export default userService
