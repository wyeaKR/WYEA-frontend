import axios from 'axios'
import type { LoginRequest, LoginResponse, RegisterRequest } from '@/interface/user-interface.js'

const config = {
  baseUrl: 'http://localhost:8080/',
}
const userService = {
  // 로그인 요청
  // res(전체 응답)는 api(axois 통신)를 통해 AuthResponse형식으로 백엔드에서 보낸 값을 들고옴
  // axios 통신 형태 = post, 엔드포인트 = config.baseUrl + 'login', 보낼 데이터 : LoginData형식인 credentials
  // 들고온 res(전체 응답)중에 AuthResponse형식인 데이터를 반환
  async login(loginrequest: LoginRequest): Promise<LoginResponse> {
    const res = await axios<LoginResponse>({
      method: 'post',
      url: config.baseUrl + 'login',
      data: loginrequest,
    })

    return res.data
  },

  // 회원가입 요청
  // axios 통신형태 = post, 엔드포인트 = config.baseUrl + 'register', 보낼 데이터 : RegisterData형식인 userData
  register: (registerrequest: RegisterRequest) =>
    axios<void>({
      method: 'post',
      url: config.baseUrl + 'register',
      data: registerrequest,
    }),
}

export default userService
