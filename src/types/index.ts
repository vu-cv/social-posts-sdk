import type { Platform } from '../errors/index.js'

export type { Platform }

/** Returned by all post methods */
export interface PostResult {
  /** The platform-assigned post/media ID */
  id: string
  /** Which platform this was posted to */
  platform: Platform
  /** ISO 8601 timestamp of when the post was created */
  createdAt: string
}

// ─── Facebook config ──────────────────────────────────────────────────────────

export interface FacebookConfig {
  /** Facebook Page ID */
  pageId: string
  /** Page Access Token with publish_pages / pages_manage_posts permission */
  accessToken: string
  /**
   * Graph API version to use.
   * @default 'v22.0'
   */
  apiVersion?: string
}

// ─── Instagram config ─────────────────────────────────────────────────────────

export interface InstagramConfig {
  /** Instagram Business / Creator Account user ID */
  igUserId: string
  /**
   * Access token with instagram_basic, instagram_content_publish permissions.
   * Usually the same Page Access Token used for Facebook.
   */
  accessToken: string
  /**
   * Graph API version to use.
   * @default 'v22.0'
   */
  apiVersion?: string
  /**
   * How long (ms) to wait between status polling attempts for Instagram media.
   * @default 3000
   */
  pollIntervalMs?: number
  /**
   * Maximum number of status polling attempts before giving up.
   * @default 20
   */
  pollMaxAttempts?: number
}

// ─── Top-level SDK config ─────────────────────────────────────────────────────

export interface SocialPostsConfig {
  facebook?: FacebookConfig
  instagram?: InstagramConfig
}
