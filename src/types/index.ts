import type { Platform } from '../errors/index.js'

export type { Platform }

/** Returned by all post/upload methods */
export interface PostResult {
  id: string
  platform: Platform
  createdAt: string
}

// ─── Facebook ──────────────────────────────────────────────────────────────────
export interface FacebookConfig {
  pageId: string
  accessToken: string
  apiVersion?: string
}

// ─── Instagram ─────────────────────────────────────────────────────────────────
export interface InstagramConfig {
  igUserId: string
  accessToken: string
  apiVersion?: string
  pollIntervalMs?: number
  pollMaxAttempts?: number
}

// ─── Threads ───────────────────────────────────────────────────────────────────
export interface ThreadsConfig {
  userId: string
  accessToken: string
  apiVersion?: string
  pollIntervalMs?: number
  pollMaxAttempts?: number
}

// ─── Twitter / X ───────────────────────────────────────────────────────────────
export interface TwitterConfig {
  /** OAuth 2.0 user access token (for posting tweets) */
  accessToken: string
  /** OAuth 1.0a credentials — required for image/video uploads */
  oauth1?: {
    consumerKey: string
    consumerSecret: string
    accessToken: string
    accessTokenSecret: string
  }
}

// ─── LinkedIn ──────────────────────────────────────────────────────────────────
export interface LinkedInConfig {
  accessToken: string
}

// ─── TikTok ────────────────────────────────────────────────────────────────────
export interface TikTokConfig {
  accessToken: string
  pollIntervalMs?: number
  pollMaxAttempts?: number
}

// ─── YouTube ───────────────────────────────────────────────────────────────────
export interface YouTubeConfig {
  /** OAuth 2.0 access token with youtube.upload scope */
  accessToken: string
}

// ─── Pinterest ─────────────────────────────────────────────────────────────────
export interface PinterestConfig {
  accessToken: string
}

// ─── Telegram ──────────────────────────────────────────────────────────────────
export interface TelegramConfig {
  botToken: string
}

// ─── Zalo ──────────────────────────────────────────────────────────────────────
export interface ZaloConfig {
  /** OA Access Token */
  accessToken: string
}

// ─── Top-level SDK config ──────────────────────────────────────────────────────
export interface SocialPostsConfig {
  facebook?: FacebookConfig
  instagram?: InstagramConfig
  threads?: ThreadsConfig
  twitter?: TwitterConfig
  linkedin?: LinkedInConfig
  tiktok?: TikTokConfig
  youtube?: YouTubeConfig
  pinterest?: PinterestConfig
  telegram?: TelegramConfig
  zalo?: ZaloConfig
}
