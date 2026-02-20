export interface PostRequest {
  title: string
  content: string
  notice?: boolean
}

export interface PostResponse {
  id: number
}
