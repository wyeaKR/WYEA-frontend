import api from '@/plugins/axios.js'
import type { PostRequest, PostResponse } from '@/interface/post-interface.js'

const config = {
  baseUrl: 'http://localhost:8080/',
}

const postService = {
  async savePost(postrequest: PostRequest): Promise<PostResponse> {
    const res = await api<PostResponse>({
      method: 'post',
      url: config.baseUrl + 'user/posts',
      data: postrequest,
    })
    return res.data
  },
}

export default postService
