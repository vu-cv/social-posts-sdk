import { z } from 'zod'

export const PinterestCreatePinInputSchema = z.object({
  boardId: z.string().min(1),
  /** Image URL for an image pin */
  imageUrl: z.string().url().optional(),
  title: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
  /** Destination link when pin is clicked */
  link: z.string().url().optional(),
  altText: z.string().max(500).optional(),
  boardSectionId: z.string().optional(),
}).refine((d) => d.imageUrl !== undefined, {
  message: 'imageUrl is required',
})

export type PinterestCreatePinInput = z.infer<typeof PinterestCreatePinInputSchema>

export interface PinterestPinResponse {
  id: string
  link: string | null
  title: string | null
  description: string | null
  board_id: string
  media: { media_type: string }
}

export interface PinterestGetPinResponse {
  id: string
  title?: string | null
  description?: string | null
  link?: string | null
  created_at?: string
}
