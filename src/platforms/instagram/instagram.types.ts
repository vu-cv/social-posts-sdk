import { z } from 'zod'

// ─── Media types ──────────────────────────────────────────────────────────────

export type InstagramMediaType = 'IMAGE' | 'VIDEO' | 'REELS' | 'CAROUSEL_ALBUM'

// ─── Input schemas ─────────────────────────────────────────────────────────────

export const PostImageInputSchema = z.object({
  /** Publicly accessible URL of the image */
  imageUrl: z.string().url(),
  /** Caption for the post (max 2200 chars) */
  caption: z.string().max(2200).optional(),
  /** Location tag ID */
  locationId: z.string().optional(),
  /** Array of user tags ({ username, x, y }) */
  userTags: z
    .array(
      z.object({
        username: z.string(),
        x: z.number().min(0).max(1),
        y: z.number().min(0).max(1),
      }),
    )
    .optional(),
})

export const PostVideoInputSchema = z.object({
  /** Publicly accessible URL of the video */
  videoUrl: z.string().url(),
  /** Caption for the post */
  caption: z.string().max(2200).optional(),
  /** VIDEO (regular video) or REELS */
  mediaType: z.enum(['VIDEO', 'REELS']).default('VIDEO'),
  /** URL of the cover/thumbnail image */
  thumbOffset: z.number().int().nonnegative().optional(),
})

export const CarouselItemSchema = z.union([
  z.object({ type: z.literal('IMAGE'), imageUrl: z.string().url() }),
  z.object({ type: z.literal('VIDEO'), videoUrl: z.string().url() }),
])

export const PostCarouselInputSchema = z.object({
  /** 2–10 carousel items (images or videos) */
  items: z.array(CarouselItemSchema).min(2).max(10),
  /** Caption for the carousel post */
  caption: z.string().max(2200).optional(),
  /** Location tag ID */
  locationId: z.string().optional(),
})

// ─── Inferred input types ─────────────────────────────────────────────────────

export type PostImageInput = z.infer<typeof PostImageInputSchema>
export type PostVideoInput = z.infer<typeof PostVideoInputSchema>
export type CarouselItem = z.infer<typeof CarouselItemSchema>
export type PostCarouselInput = z.infer<typeof PostCarouselInputSchema>

// ─── Graph API response shapes ────────────────────────────────────────────────

export interface MediaContainerResponse {
  id: string
}

export interface MediaPublishResponse {
  id: string
}

export type MediaStatusCode = 'EXPIRED' | 'ERROR' | 'FINISHED' | 'IN_PROGRESS' | 'PUBLISHED'

export interface MediaStatusResponse {
  status_code: MediaStatusCode
  id: string
}

export interface InstagramMediaResponse {
  id: string
  caption?: string
  permalink?: string
  timestamp?: string
  like_count?: number
  comments_count?: number
  media_type?: string
}
