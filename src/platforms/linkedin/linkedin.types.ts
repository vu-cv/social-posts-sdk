import { z } from 'zod'

export const LinkedInPostTextInputSchema = z.object({
  text: z.string().min(1).max(3000),
  /** URN of the author. e.g. "urn:li:organization:12345" or "urn:li:person:xxxx" */
  authorUrn: z.string().min(1),
  visibility: z.enum(['PUBLIC', 'CONNECTIONS', 'LOGGED_IN']).default('PUBLIC'),
})

export const LinkedInPostImageInputSchema = z.object({
  imageUrl: z.string().url(),
  text: z.string().max(3000).optional(),
  title: z.string().optional(),
  authorUrn: z.string().min(1),
  visibility: z.enum(['PUBLIC', 'CONNECTIONS', 'LOGGED_IN']).default('PUBLIC'),
})

export const LinkedInPostVideoInputSchema = z.object({
  videoUrl: z.string().url(),
  text: z.string().max(3000).optional(),
  title: z.string().optional(),
  authorUrn: z.string().min(1),
  visibility: z.enum(['PUBLIC', 'CONNECTIONS', 'LOGGED_IN']).default('PUBLIC'),
})

export type LinkedInPostTextInput = z.infer<typeof LinkedInPostTextInputSchema>
export type LinkedInPostImageInput = z.infer<typeof LinkedInPostImageInputSchema>
export type LinkedInPostVideoInput = z.infer<typeof LinkedInPostVideoInputSchema>

export interface LinkedInRegisterUploadResponse {
  value: {
    asset: string
    uploadMechanism: {
      'com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest': {
        uploadUrl: string
      }
    }
  }
}

export interface LinkedInUgcPostResponse {
  id: string
}

export interface LinkedInGetPostResponse {
  id: string
  specificContent?: {
    'com.linkedin.ugc.ShareContent'?: {
      shareCommentary?: { text?: string }
    }
  }
  created?: { time?: number }
}
