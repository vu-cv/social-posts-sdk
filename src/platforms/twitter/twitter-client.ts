import { randomBytes, createHmac } from 'node:crypto'
import axios from 'axios'
import { HttpClient, bearerErrorParser } from '../../http/http-client.js'
import { AuthError, RateLimitError, SocialSDKError, ValidationError, type Platform } from '../../errors/index.js'
import type { PostResult } from '../../types/index.js'
import type { TwitterConfig } from '../../types/index.js'
import type { PostInfo } from '../../types/post-info.js'
import {
  TwitterPostTextInputSchema,
  TwitterPostImagesInputSchema,
  TwitterPostVideoInputSchema,
  type TwitterPostTextInput,
  type TwitterPostImagesInput,
  type TwitterPostVideoInput,
  type TweetResponse,
  type MediaUploadInitResponse,
  type MediaUploadFinalizeResponse,
  type MediaUploadStatusResponse,
  type TwitterGetTweetResponse,
  type TwitterDeleteTweetResponse,
} from './twitter.types.js'

const PLATFORM: Platform = 'twitter'

function twitterErrorParser(platform: Platform, status: number, body: unknown): never {
  const b = body as { title?: string; detail?: string; errors?: Array<{ message?: string }> }
  const message = b.detail ?? b.errors?.[0]?.message ?? b.title ?? `HTTP ${status}`
  if (status === 401) throw new AuthError(message, platform, status, body)
  if (status === 429) throw new RateLimitError(message, platform, status, body)
  throw new SocialSDKError(message, platform, status, body)
}

function percentEncode(str: string): string {
  return encodeURIComponent(str).replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase())
}

function buildOAuth1Header(
  method: string,
  url: string,
  oauth: NonNullable<TwitterConfig['oauth1']>,
  extraParams: Record<string, string> = {},
): string {
  const nonce = randomBytes(16).toString('hex')
  const timestamp = Math.floor(Date.now() / 1000).toString()

  const oauthParams: Record<string, string> = {
    oauth_consumer_key: oauth.consumerKey,
    oauth_nonce: nonce,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: timestamp,
    oauth_token: oauth.accessToken,
    oauth_version: '1.0',
  }

  const allParams: Record<string, string> = { ...oauthParams, ...extraParams }
  const sortedParams = Object.keys(allParams)
    .sort()
    .map((k) => `${percentEncode(k)}=${percentEncode(allParams[k] ?? '')}`)
    .join('&')

  const signatureBase = [method.toUpperCase(), percentEncode(url), percentEncode(sortedParams)].join('&')
  const signingKey = `${percentEncode(oauth.consumerSecret)}&${percentEncode(oauth.accessTokenSecret)}`
  const signature = createHmac('sha1', signingKey).update(signatureBase).digest('base64')

  oauthParams['oauth_signature'] = signature

  const headerValue = Object.keys(oauthParams)
    .sort()
    .map((k) => `${k}="${percentEncode(oauthParams[k] ?? '')}"`)
    .join(', ')

  return `OAuth ${headerValue}`
}

export class TwitterClient {
  readonly #http: HttpClient
  readonly #oauth1?: TwitterConfig['oauth1']

  constructor(config: TwitterConfig) {
    this.#oauth1 = config.oauth1
    this.#http = new HttpClient({
      baseUrl: 'https://api.twitter.com/v2',
      platform: PLATFORM,
      headers: { Authorization: `Bearer ${config.accessToken}` },
      parseError: twitterErrorParser,
    })
  }

  /** Post a text-only tweet */
  async postText(input: TwitterPostTextInput): Promise<PostResult> {
    const parsed = TwitterPostTextInputSchema.safeParse(input)
    if (!parsed.success) throw new ValidationError('Invalid input for postText', parsed.error.errors.map(e => e.message))

    const body: Record<string, unknown> = { text: parsed.data.text }
    if (parsed.data.replyToTweetId) body['reply'] = { in_reply_to_tweet_id: parsed.data.replyToTweetId }

    const response = await this.#http.post<TweetResponse>('/tweets', body)
    return { id: response.data.id, platform: PLATFORM, createdAt: new Date().toISOString() }
  }

  /** Post a tweet with up to 4 images. Requires oauth1 config. */
  async postImages(input: TwitterPostImagesInput): Promise<PostResult> {
    const parsed = TwitterPostImagesInputSchema.safeParse(input)
    if (!parsed.success) throw new ValidationError('Invalid input for postImages', parsed.error.errors.map(e => e.message))
    if (!this.#oauth1) throw new SocialSDKError('oauth1 config is required for media uploads', PLATFORM, 0)

    const mediaIds = await Promise.all(parsed.data.imageUrls.map((url) => this.#uploadMedia(url, 'tweet_image')))

    const body: Record<string, unknown> = { media: { media_ids: mediaIds } }
    if (parsed.data.text) body['text'] = parsed.data.text

    const response = await this.#http.post<TweetResponse>('/tweets', body)
    return { id: response.data.id, platform: PLATFORM, createdAt: new Date().toISOString() }
  }

  /** Post a tweet with a video. Requires oauth1 config. */
  async postVideo(input: TwitterPostVideoInput): Promise<PostResult> {
    const parsed = TwitterPostVideoInputSchema.safeParse(input)
    if (!parsed.success) throw new ValidationError('Invalid input for postVideo', parsed.error.errors.map(e => e.message))
    if (!this.#oauth1) throw new SocialSDKError('oauth1 config is required for media uploads', PLATFORM, 0)

    const mediaId = await this.#uploadMedia(parsed.data.videoUrl, 'tweet_video')

    const body: Record<string, unknown> = { media: { media_ids: [mediaId] } }
    if (parsed.data.text) body['text'] = parsed.data.text

    const response = await this.#http.post<TweetResponse>('/tweets', body)
    return { id: response.data.id, platform: PLATFORM, createdAt: new Date().toISOString() }
  }

  /** Fetch a tweet by its ID and return normalised PostInfo. */
  async getTweet(tweetId: string): Promise<PostInfo> {
    const raw = await this.#http.get<TwitterGetTweetResponse>(`/tweets/${tweetId}`, {
      'tweet.fields': 'text,created_at,public_metrics',
    })
    return {
      id: raw.data.id,
      platform: PLATFORM,
      content: raw.data.text,
      url: `https://twitter.com/i/web/status/${raw.data.id}`,
      createdAt: raw.data.created_at ?? null,
      metrics: {
        likes: raw.data.public_metrics?.like_count ?? null,
        comments: raw.data.public_metrics?.reply_count ?? null,
        shares: raw.data.public_metrics?.retweet_count ?? null,
        views: raw.data.public_metrics?.impression_count ?? null,
      },
      raw,
    }
  }

  /** Delete a tweet by its ID. */
  async deleteTweet(tweetId: string): Promise<void> {
    await this.#http.delete<TwitterDeleteTweetResponse>(`/tweets/${tweetId}`)
  }

  async #uploadMedia(mediaUrl: string, mediaCategory: string): Promise<string> {
    const oauth1 = this.#oauth1!
    const uploadBase = 'https://upload.twitter.com/1.1/media/upload.json'

    // Download the media
    const mediaResp = await axios.get<ArrayBuffer>(mediaUrl, { responseType: 'arraybuffer' })
    const mediaBuffer = Buffer.from(mediaResp.data)
    const totalBytes = mediaBuffer.length
    const mimeType = (mediaResp.headers['content-type'] as string | undefined) ?? 'application/octet-stream'

    // INIT
    const initParams = { command: 'INIT', total_bytes: String(totalBytes), media_type: mimeType, media_category: mediaCategory }
    const initAuth = buildOAuth1Header('POST', uploadBase, oauth1, initParams)
    const initResp = await axios.post<MediaUploadInitResponse>(
      uploadBase,
      new URLSearchParams(initParams).toString(),
      { headers: { Authorization: initAuth, 'Content-Type': 'application/x-www-form-urlencoded' } },
    )
    const mediaId = initResp.data.media_id_string

    // APPEND
    const appendFormData = new FormData()
    appendFormData.append('command', 'APPEND')
    appendFormData.append('media_id', mediaId)
    appendFormData.append('segment_index', '0')
    appendFormData.append('media_data', mediaBuffer.toString('base64'))

    const appendParams = { command: 'APPEND', media_id: mediaId, segment_index: '0' }
    const appendAuth = buildOAuth1Header('POST', uploadBase, oauth1, appendParams)
    await axios.post(uploadBase, appendFormData, { headers: { Authorization: appendAuth } })

    // FINALIZE
    const finalizeParams = { command: 'FINALIZE', media_id: mediaId }
    const finalizeAuth = buildOAuth1Header('POST', uploadBase, oauth1, finalizeParams)
    const finalizeResp = await axios.post<MediaUploadFinalizeResponse>(
      uploadBase,
      new URLSearchParams(finalizeParams).toString(),
      { headers: { Authorization: finalizeAuth, 'Content-Type': 'application/x-www-form-urlencoded' } },
    )

    if (finalizeResp.data.processing_info) {
      await this.#waitForMediaProcessing(mediaId, oauth1)
    }

    return mediaId
  }

  async #waitForMediaProcessing(mediaId: string, oauth1: NonNullable<TwitterConfig['oauth1']>): Promise<void> {
    const uploadBase = 'https://upload.twitter.com/1.1/media/upload.json'

    for (let i = 0; i < 30; i++) {
      const params = { command: 'STATUS', media_id: mediaId }
      const auth = buildOAuth1Header('GET', uploadBase, oauth1, params)
      const resp = await axios.get<MediaUploadStatusResponse>(uploadBase, {
        params,
        headers: { Authorization: auth },
      })

      const state = resp.data.processing_info.state
      if (state === 'succeeded') return
      if (state === 'failed') {
        const msg = resp.data.processing_info.error?.message ?? 'Media processing failed'
        throw new SocialSDKError(msg, PLATFORM, 0)
      }

      const waitSecs = 5
      await new Promise<void>((r) => setTimeout(r, waitSecs * 1000))
    }

    throw new SocialSDKError('Media processing timed out', PLATFORM, 0)
  }
}
