import { HttpClient } from '../../http/http-client.js'
import { AuthError, RateLimitError, SocialSDKError, ValidationError, type Platform } from '../../errors/index.js'
import type { PostResult } from '../../types/index.js'
import type { TikTokConfig } from '../../types/index.js'
import {
  TikTokPostVideoInputSchema,
  TikTokPostPhotosInputSchema,
  type TikTokPostVideoInput,
  type TikTokPostPhotosInput,
  type TikTokApiResponse,
  type TikTokVideoInitData,
  type TikTokPhotoInitData,
  type TikTokStatusData,
} from './tiktok.types.js'

const PLATFORM: Platform = 'tiktok'

function tiktokErrorParser(platform: Platform, status: number, body: unknown): never {
  const b = body as { error?: { code?: string; message?: string } }
  const message = b.error?.message ?? `HTTP ${status}`
  if (status === 401 || b.error?.code === 'access_token_invalid') throw new AuthError(message, platform, status, body)
  if (status === 429) throw new RateLimitError(message, platform, status, body)
  throw new SocialSDKError(message, platform, status, body)
}

export class TikTokClient {
  readonly #http: HttpClient
  readonly #pollIntervalMs: number
  readonly #pollMaxAttempts: number

  constructor(config: TikTokConfig) {
    this.#pollIntervalMs = config.pollIntervalMs ?? 5000
    this.#pollMaxAttempts = config.pollMaxAttempts ?? 24
    this.#http = new HttpClient({
      baseUrl: 'https://open.tiktokapis.com/v2',
      platform: PLATFORM,
      headers: { Authorization: `Bearer ${config.accessToken}` },
      parseError: tiktokErrorParser,
    })
  }

  /** Publish a video to TikTok using a public URL (PULL_FROM_URL). */
  async postVideo(input: TikTokPostVideoInput): Promise<PostResult> {
    const parsed = TikTokPostVideoInputSchema.safeParse(input)
    if (!parsed.success) throw new ValidationError('Invalid input for postVideo', parsed.error.errors.map(e => e.message))

    const { videoUrl, title, description, privacyLevel, disableComment, disableDuet, disableStitch } = parsed.data

    const body = {
      post_info: {
        title: title ?? '',
        description: description ?? '',
        privacy_level: privacyLevel,
        disable_comment: disableComment,
        disable_duet: disableDuet,
        disable_stitch: disableStitch,
      },
      source_info: { source: 'PULL_FROM_URL', video_url: videoUrl },
    }

    const response = await this.#http.post<TikTokApiResponse<TikTokVideoInitData>>(
      '/post/publish/video/init/',
      body,
    )
    this.#checkTikTokError(response)

    const publishId = response.data.publish_id
    await this.#pollStatus(publishId)
    return { id: publishId, platform: PLATFORM, createdAt: new Date().toISOString() }
  }

  /** Publish a photo carousel to TikTok using public image URLs. */
  async postPhotos(input: TikTokPostPhotosInput): Promise<PostResult> {
    const parsed = TikTokPostPhotosInputSchema.safeParse(input)
    if (!parsed.success) throw new ValidationError('Invalid input for postPhotos', parsed.error.errors.map(e => e.message))

    const { photoUrls, title, description, privacyLevel, disableComment, coverIndex } = parsed.data

    const body = {
      media_type: 'PHOTO',
      post_info: {
        title: title ?? '',
        description: description ?? '',
        privacy_level: privacyLevel,
        disable_comment: disableComment,
      },
      source_info: {
        source: 'PULL_FROM_URL',
        photo_images: photoUrls,
        photo_cover_index: coverIndex,
      },
    }

    const response = await this.#http.post<TikTokApiResponse<TikTokPhotoInitData>>(
      '/post/publish/content/init/',
      body,
    )
    this.#checkTikTokError(response)

    const publishId = response.data.publish_id
    return { id: publishId, platform: PLATFORM, createdAt: new Date().toISOString() }
  }

  #checkTikTokError(response: TikTokApiResponse<unknown>): void {
    if (response.error.code !== 'ok') {
      throw new SocialSDKError(response.error.message, PLATFORM, 0, response)
    }
  }

  async #pollStatus(publishId: string): Promise<void> {
    for (let i = 0; i < this.#pollMaxAttempts; i++) {
      const response = await this.#http.post<TikTokApiResponse<TikTokStatusData>>(
        '/post/publish/status/fetch/',
        { publish_id: publishId },
      )
      this.#checkTikTokError(response)

      const { status, fail_reason } = response.data
      if (status === 'PUBLISH_COMPLETE') return
      if (status === 'FAILED') {
        throw new SocialSDKError(fail_reason ?? 'TikTok publish failed', PLATFORM, 0)
      }

      await new Promise<void>((r) => setTimeout(r, this.#pollIntervalMs))
    }
    throw new SocialSDKError(`TikTok publish ${publishId} did not complete after ${this.#pollMaxAttempts} attempts`, PLATFORM, 0)
  }
}
