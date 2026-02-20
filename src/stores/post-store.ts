import { defineStore } from 'pinia'
import postService from '@/model/post-service.js'
import type { PostRequest, PostResponse } from '@/interface/post-interface.js'

export const usePostStore = defineStore('post', {
  state: () => ({
    currentPost: null as PostResponse | null,
  }),
  actions: {
    async savePost(postrequest: PostRequest): Promise<PostResponse> {
      const created = await postService.savePost(postrequest)
      this.currentPost = created
      return created
    },
  },
})
