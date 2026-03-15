import type { Platform } from '../errors/index.js'

export interface PostMetrics {
  likes: number | null
  comments: number | null
  shares: number | null
  views: number | null
}

/** Normalised post info returned by getPost / getVideo / getPin / getTweet */
export interface PostInfo {
  id: string
  platform: Platform
  /** Text content — message / caption / text / title */
  content: string | null
  /** Direct link to the post */
  url: string | null
  /** ISO 8601 creation timestamp */
  createdAt: string | null
  metrics: PostMetrics
  /** Raw API response — for fields not normalised above */
  raw: unknown
}
