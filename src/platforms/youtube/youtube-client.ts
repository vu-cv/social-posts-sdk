import axios from 'axios'
import { AuthError, RateLimitError, SocialSDKError, ValidationError, type Platform } from '../../errors/index.js'
import type { PostResult } from '../../types/index.js'
import type { YouTubeConfig } from '../../types/index.js'
import {
  YouTubeUploadVideoInputSchema,
  type YouTubeUploadVideoInput,
  type YouTubeVideoResource,
} from './youtube.types.js'

const PLATFORM: Platform = 'youtube'
const UPLOAD_BASE = 'https://www.googleapis.com/upload/youtube/v3'

export class YouTubeClient {
  readonly #accessToken: string

  constructor(config: YouTubeConfig) {
    this.#accessToken = config.accessToken
  }

  /** Upload a video to YouTube via resumable upload. The SDK streams the video from `videoUrl`. */
  async uploadVideo(input: YouTubeUploadVideoInput): Promise<PostResult> {
    const parsed = YouTubeUploadVideoInputSchema.safeParse(input)
    if (!parsed.success) throw new ValidationError('Invalid input for uploadVideo', parsed.error.errors.map(e => e.message))

    const { videoUrl, title, description, tags, categoryId, privacyStatus, madeForKids } = parsed.data

    // Probe video metadata
    const headResp = await axios.head(videoUrl).catch(() => null)
    const contentType = (headResp?.headers['content-type'] as string | undefined) ?? 'video/mp4'
    const contentLength = headResp?.headers['content-length'] as string | undefined

    const metadata = {
      snippet: { title, description: description ?? '', tags: tags ?? [], categoryId },
      status: { privacyStatus, madeForKids, selfDeclaredMadeForKids: madeForKids },
    }

    // Step 1: Initiate resumable upload
    const initHeaders: Record<string, string> = {
      Authorization: `Bearer ${this.#accessToken}`,
      'Content-Type': 'application/json',
      'X-Upload-Content-Type': contentType,
    }
    if (contentLength) initHeaders['X-Upload-Content-Length'] = contentLength

    const initResp = await axios.post(
      `${UPLOAD_BASE}/videos?uploadType=resumable&part=snippet,status`,
      metadata,
      { headers: initHeaders },
    ).catch((err: unknown) => { throw this.#parseYouTubeError(err) })

    const uploadUrl = initResp.headers['location'] as string
    if (!uploadUrl) throw new SocialSDKError('YouTube did not return an upload URL', PLATFORM, 0)

    // Step 2: Stream video to upload URL
    const videoResp = await axios.get<NodeJS.ReadableStream>(videoUrl, { responseType: 'stream' })
    const uploadHeaders: Record<string, string> = { 'Content-Type': contentType }
    if (contentLength) uploadHeaders['Content-Length'] = contentLength

    const uploadResp = await axios.put<YouTubeVideoResource>(uploadUrl, videoResp.data, {
      headers: uploadHeaders,
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    }).catch((err: unknown) => { throw this.#parseYouTubeError(err) })

    return { id: uploadResp.data.id, platform: PLATFORM, createdAt: new Date().toISOString() }
  }

  #parseYouTubeError(err: unknown): SocialSDKError {
    if (axios.isAxiosError(err) && err.response) {
      const body = err.response.data as { error?: { code?: number; message?: string } }
      const code = body.error?.code ?? err.response.status
      const message = body.error?.message ?? `HTTP ${err.response.status}`
      if (err.response.status === 401) return new AuthError(message, PLATFORM, code, body)
      if (err.response.status === 429) return new RateLimitError(message, PLATFORM, code, body)
      return new SocialSDKError(message, PLATFORM, code, body)
    }
    return new SocialSDKError(String(err), PLATFORM, 0)
  }
}
