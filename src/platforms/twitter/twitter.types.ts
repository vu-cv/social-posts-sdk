import { z } from 'zod'

export const TwitterPostTextInputSchema = z.object({
  text: z.string().min(1).max(280),
  replyToTweetId: z.string().optional(),
})

export const TwitterPostImagesInputSchema = z.object({
  text: z.string().max(280).optional(),
  /** Up to 4 image URLs. SDK will download each and upload to Twitter. Requires oauth1 config. */
  imageUrls: z.array(z.string().url()).min(1).max(4),
})

export const TwitterPostVideoInputSchema = z.object({
  text: z.string().max(280).optional(),
  /** Publicly accessible video URL. SDK will download and upload. Requires oauth1 config. */
  videoUrl: z.string().url(),
})

export type TwitterPostTextInput = z.infer<typeof TwitterPostTextInputSchema>
export type TwitterPostImagesInput = z.infer<typeof TwitterPostImagesInputSchema>
export type TwitterPostVideoInput = z.infer<typeof TwitterPostVideoInputSchema>

export interface TweetResponse {
  data: { id: string; text: string }
}

export interface MediaUploadInitResponse {
  media_id_string: string
}

export interface MediaUploadFinalizeResponse {
  media_id_string: string
  processing_info?: { state: string; check_after_secs?: number }
}

export interface MediaUploadStatusResponse {
  media_id_string: string
  processing_info: { state: 'pending' | 'in_progress' | 'failed' | 'succeeded'; error?: { message: string } }
}
