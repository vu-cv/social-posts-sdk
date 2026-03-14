import { z } from 'zod'

export const ZaloPostFeedInputSchema = z.object({
  message: z.string().min(1).max(2000),
  /** Optional array of publicly accessible image URLs (max 10) */
  photoUrls: z.array(z.string().url()).max(10).optional(),
})

export type ZaloPostFeedInput = z.infer<typeof ZaloPostFeedInputSchema>

export interface ZaloApiResponse<T> {
  error: number
  message: string
  data?: T
}

export interface ZaloFeedData {
  post_id: string
}
