import { z } from 'zod'

export type YouTubePrivacyStatus = 'public' | 'private' | 'unlisted'

export const YouTubeUploadVideoInputSchema = z.object({
  /** Publicly accessible video URL — SDK will download and stream to YouTube */
  videoUrl: z.string().url(),
  title: z.string().min(1).max(100),
  description: z.string().max(5000).optional(),
  tags: z.array(z.string()).max(500).optional(),
  /** YouTube category ID. 22 = People & Blogs, 10 = Music, 17 = Sports, etc. */
  categoryId: z.string().default('22'),
  privacyStatus: z.enum(['public', 'private', 'unlisted']).default('public'),
  madeForKids: z.boolean().default(false),
})

export type YouTubeUploadVideoInput = z.infer<typeof YouTubeUploadVideoInputSchema>

export interface YouTubeVideoResource {
  id: string
  snippet: { title: string; description: string }
  status: { privacyStatus: YouTubePrivacyStatus }
}
