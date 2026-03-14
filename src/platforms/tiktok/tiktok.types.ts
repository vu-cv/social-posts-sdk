import { z } from 'zod'

export type TikTokPrivacyLevel = 'PUBLIC_TO_EVERYONE' | 'MUTUAL_FOLLOW_FRIENDS' | 'FOLLOWER_OF_CREATOR' | 'SELF_ONLY'

export const TikTokPostVideoInputSchema = z.object({
  /** Publicly accessible video URL (PULL_FROM_URL) */
  videoUrl: z.string().url(),
  title: z.string().min(1).max(150).optional(),
  description: z.string().max(2200).optional(),
  privacyLevel: z.enum(['PUBLIC_TO_EVERYONE', 'MUTUAL_FOLLOW_FRIENDS', 'FOLLOWER_OF_CREATOR', 'SELF_ONLY']).default('SELF_ONLY'),
  disableComment: z.boolean().default(false),
  disableDuet: z.boolean().default(false),
  disableStitch: z.boolean().default(false),
})

export const TikTokPostPhotosInputSchema = z.object({
  /** 1–35 publicly accessible image URLs */
  photoUrls: z.array(z.string().url()).min(1).max(35),
  title: z.string().min(1).max(150).optional(),
  description: z.string().max(2200).optional(),
  privacyLevel: z.enum(['PUBLIC_TO_EVERYONE', 'MUTUAL_FOLLOW_FRIENDS', 'FOLLOWER_OF_CREATOR', 'SELF_ONLY']).default('SELF_ONLY'),
  disableComment: z.boolean().default(false),
  /** Index of the cover image (0-based) */
  coverIndex: z.number().int().nonnegative().default(0),
})

export type TikTokPostVideoInput = z.infer<typeof TikTokPostVideoInputSchema>
export type TikTokPostPhotosInput = z.infer<typeof TikTokPostPhotosInputSchema>

export interface TikTokApiResponse<T> {
  data: T
  error: { code: string; message: string; log_id: string }
}

export interface TikTokVideoInitData {
  publish_id: string
  upload_url: string | null
}

export interface TikTokPhotoInitData {
  publish_id: string
}

export interface TikTokStatusData {
  status: 'PROCESSING_UPLOAD' | 'SEND_TO_USER_INBOX' | 'PUBLISH_COMPLETE' | 'FAILED'
  fail_reason?: string
  publicaly_available_post_id?: string[]
}
