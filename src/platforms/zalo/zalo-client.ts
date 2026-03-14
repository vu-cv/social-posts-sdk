import { HttpClient } from '../../http/http-client.js'
import { AuthError, SocialSDKError, ValidationError, type Platform } from '../../errors/index.js'
import type { PostResult } from '../../types/index.js'
import type { ZaloConfig } from '../../types/index.js'
import {
  ZaloPostFeedInputSchema,
  type ZaloPostFeedInput,
  type ZaloApiResponse,
  type ZaloFeedData,
} from './zalo.types.js'

const PLATFORM: Platform = 'zalo'

export class ZaloClient {
  readonly #http: HttpClient

  constructor(config: ZaloConfig) {
    this.#http = new HttpClient({
      baseUrl: 'https://openapi.zalo.me/v2.0/oa',
      platform: PLATFORM,
      headers: { access_token: config.accessToken },
      parseError: (platform, status, body) => {
        const b = body as { message?: string; error?: number }
        const message = b.message ?? `HTTP ${status}`
        const code = b.error ?? status
        if (status === 401 || code === -124) throw new AuthError(message, platform, code, body)
        throw new SocialSDKError(message, platform, code, body)
      },
    })
  }

  /** Post a feed update (text + optional photos) to the Zalo Official Account */
  async postFeed(input: ZaloPostFeedInput): Promise<PostResult> {
    const parsed = ZaloPostFeedInputSchema.safeParse(input)
    if (!parsed.success) throw new ValidationError('Invalid input for postFeed', parsed.error.errors.map(e => e.message))

    const { message, photoUrls } = parsed.data

    const body: Record<string, unknown> = { message }

    if (photoUrls && photoUrls.length > 0) {
      body['attachment'] = {
        type: 'photo',
        payload: {
          elements: photoUrls.map((url) => ({ image_url: url, type: 'banner' })),
        },
      }
    }

    const response = await this.#http.post<ZaloApiResponse<ZaloFeedData>>('/feed', body)

    // Zalo uses error: 0 for success, negative numbers for errors
    if (response.error !== 0) {
      throw new SocialSDKError(response.message, PLATFORM, response.error)
    }

    return {
      id: response.data?.post_id ?? 'unknown',
      platform: PLATFORM,
      createdAt: new Date().toISOString(),
    }
  }
}
