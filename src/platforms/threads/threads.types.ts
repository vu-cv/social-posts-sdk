import { z } from 'zod'

export const ThreadsPostTextInputSchema = z.object({
  text: z.string().min(1).max(500),
  replyToId: z.string().optional(),
})

export const ThreadsPostImageInputSchema = z.object({
  imageUrl: z.string().url(),
  text: z.string().max(500).optional(),
  replyToId: z.string().optional(),
})

export const ThreadsPostVideoInputSchema = z.object({
  videoUrl: z.string().url(),
  text: z.string().max(500).optional(),
  replyToId: z.string().optional(),
})

export const ThreadsCarouselItemSchema = z.union([
  z.object({ type: z.literal('IMAGE'), imageUrl: z.string().url() }),
  z.object({ type: z.literal('VIDEO'), videoUrl: z.string().url() }),
])

export const ThreadsPostCarouselInputSchema = z.object({
  items: z.array(ThreadsCarouselItemSchema).min(2).max(20),
  text: z.string().max(500).optional(),
})

export type ThreadsPostTextInput = z.infer<typeof ThreadsPostTextInputSchema>
export type ThreadsPostImageInput = z.infer<typeof ThreadsPostImageInputSchema>
export type ThreadsPostVideoInput = z.infer<typeof ThreadsPostVideoInputSchema>
export type ThreadsCarouselItem = z.infer<typeof ThreadsCarouselItemSchema>
export type ThreadsPostCarouselInput = z.infer<typeof ThreadsPostCarouselInputSchema>

export interface ThreadsContainerResponse { id: string }
export interface ThreadsPublishResponse { id: string }
export type ThreadsStatusCode = 'IN_PROGRESS' | 'FINISHED' | 'EXPIRED' | 'ERROR' | 'PUBLISHED'
export interface ThreadsStatusResponse { status: ThreadsStatusCode; id: string }

export interface ThreadsPostResponse {
  id: string
  text?: string
  timestamp?: string
  permalink?: string
  like_count?: number
  replies_count?: number
}
