import { z } from 'zod'

// ─── Input schemas ─────────────────────────────────────────────────────────────

export const PostTextInputSchema = z.object({
  /** The text message of the post */
  message: z.string().min(1),
  /** Optional URL to attach as a link preview */
  link: z.string().url().optional(),
  /** Schedule the post (Unix timestamp). Requires scheduling_type in some setups. */
  scheduledPublishTime: z.number().int().positive().optional(),
  /** Set to true to create a draft instead of publishing immediately */
  published: z.boolean().default(true),
})

export const PostPhotoInputSchema = z.object({
  /** URL of the image to upload */
  imageUrl: z.string().url(),
  /** Caption for the photo */
  message: z.string().optional(),
  /** Whether to publish immediately */
  published: z.boolean().default(true),
})

export const PostAlbumInputSchema = z.object({
  /** Array of image URLs (min 2, max 10) */
  imageUrls: z.array(z.string().url()).min(2).max(10),
  /** Caption for the album post */
  message: z.string().optional(),
})

export const PostVideoInputSchema = z.object({
  /** Publicly accessible URL of the video */
  videoUrl: z.string().url(),
  /** Title of the video */
  title: z.string().optional(),
  /** Description / caption of the video */
  description: z.string().optional(),
  /** Whether to publish immediately */
  published: z.boolean().default(true),
})

// ─── Inferred input types ─────────────────────────────────────────────────────

export type PostTextInput = z.infer<typeof PostTextInputSchema>
export type PostPhotoInput = z.infer<typeof PostPhotoInputSchema>
export type PostAlbumInput = z.infer<typeof PostAlbumInputSchema>
export type PostVideoInput = z.infer<typeof PostVideoInputSchema>

// ─── Graph API response shapes ────────────────────────────────────────────────

export interface FeedPostResponse {
  id: string
  post_id?: string
}

export interface PhotoPostResponse {
  id: string
  post_id?: string
}

export interface VideoPostResponse {
  id: string
}

export interface FacebookPostResponse {
  id: string
  message?: string
  story?: string
  permalink_url?: string
  created_time?: string
  likes?: { summary?: { total_count?: number } }
  comments?: { summary?: { total_count?: number } }
  shares?: { count?: number }
}
