import { HttpClient, graphErrorParser } from '../../http/http-client.js'
import { SocialSDKError, ValidationError } from '../../errors/index.js'
import type { PostResult } from '../../types/index.js'
import type { ThreadsConfig } from '../../types/index.js'
import {
  ThreadsPostTextInputSchema,
  ThreadsPostImageInputSchema,
  ThreadsPostVideoInputSchema,
  ThreadsPostCarouselInputSchema,
  type ThreadsPostTextInput,
  type ThreadsPostImageInput,
  type ThreadsPostVideoInput,
  type ThreadsPostCarouselInput,
  type ThreadsContainerResponse,
  type ThreadsPublishResponse,
  type ThreadsStatusResponse,
} from './threads.types.js'

export class ThreadsClient {
  readonly #http: HttpClient
  readonly #userId: string
  readonly #pollIntervalMs: number
  readonly #pollMaxAttempts: number

  constructor(config: ThreadsConfig) {
    const apiVersion = config.apiVersion ?? 'v22.0'
    this.#userId = config.userId
    this.#pollIntervalMs = config.pollIntervalMs ?? 3000
    this.#pollMaxAttempts = config.pollMaxAttempts ?? 20
    this.#http = new HttpClient({
      baseUrl: `https://graph.threads.net/${apiVersion}`,
      platform: 'threads',
      defaultParams: { access_token: config.accessToken },
      parseError: graphErrorParser,
      checkGraphApiErrors: true,
    })
  }

  async postText(input: ThreadsPostTextInput): Promise<PostResult> {
    const parsed = ThreadsPostTextInputSchema.safeParse(input)
    if (!parsed.success) throw new ValidationError('Invalid input for postText', parsed.error.errors.map(e => e.message))

    const body: Record<string, unknown> = { media_type: 'TEXT', text: parsed.data.text }
    if (parsed.data.replyToId) body['reply_to_id'] = parsed.data.replyToId

    const container = await this.#http.post<ThreadsContainerResponse>(`/${this.#userId}/threads`, body)
    return this.#publish(container.id)
  }

  async postImage(input: ThreadsPostImageInput): Promise<PostResult> {
    const parsed = ThreadsPostImageInputSchema.safeParse(input)
    if (!parsed.success) throw new ValidationError('Invalid input for postImage', parsed.error.errors.map(e => e.message))

    const body: Record<string, unknown> = { media_type: 'IMAGE', image_url: parsed.data.imageUrl }
    if (parsed.data.text) body['text'] = parsed.data.text
    if (parsed.data.replyToId) body['reply_to_id'] = parsed.data.replyToId

    const container = await this.#http.post<ThreadsContainerResponse>(`/${this.#userId}/threads`, body)
    return this.#publish(container.id)
  }

  async postVideo(input: ThreadsPostVideoInput): Promise<PostResult> {
    const parsed = ThreadsPostVideoInputSchema.safeParse(input)
    if (!parsed.success) throw new ValidationError('Invalid input for postVideo', parsed.error.errors.map(e => e.message))

    const body: Record<string, unknown> = { media_type: 'VIDEO', video_url: parsed.data.videoUrl }
    if (parsed.data.text) body['text'] = parsed.data.text
    if (parsed.data.replyToId) body['reply_to_id'] = parsed.data.replyToId

    const container = await this.#http.post<ThreadsContainerResponse>(`/${this.#userId}/threads`, body)
    return this.#publish(container.id)
  }

  async postCarousel(input: ThreadsPostCarouselInput): Promise<PostResult> {
    const parsed = ThreadsPostCarouselInputSchema.safeParse(input)
    if (!parsed.success) throw new ValidationError('Invalid input for postCarousel', parsed.error.errors.map(e => e.message))

    const itemIds = await Promise.all(
      parsed.data.items.map(async (item) => {
        const body: Record<string, unknown> =
          item.type === 'IMAGE'
            ? { media_type: 'IMAGE', image_url: item.imageUrl, is_carousel_item: true }
            : { media_type: 'VIDEO', video_url: item.videoUrl, is_carousel_item: true }
        const res = await this.#http.post<ThreadsContainerResponse>(`/${this.#userId}/threads`, body)
        return res.id
      }),
    )

    const carouselBody: Record<string, unknown> = { media_type: 'CAROUSEL', children: itemIds }
    if (parsed.data.text) carouselBody['text'] = parsed.data.text

    const container = await this.#http.post<ThreadsContainerResponse>(`/${this.#userId}/threads`, carouselBody)
    return this.#publish(container.id)
  }

  async #publish(containerId: string): Promise<PostResult> {
    await this.#waitUntilFinished(containerId)
    const result = await this.#http.post<ThreadsPublishResponse>(
      `/${this.#userId}/threads_publish`,
      { creation_id: containerId },
    )
    return { id: result.id, platform: 'threads', createdAt: new Date().toISOString() }
  }

  async #waitUntilFinished(containerId: string): Promise<void> {
    for (let i = 0; i < this.#pollMaxAttempts; i++) {
      const status = await this.#http.get<ThreadsStatusResponse>(`/${containerId}`, { fields: 'status,id' })
      if (status.status === 'FINISHED') return
      if (status.status === 'ERROR' || status.status === 'EXPIRED') {
        throw new SocialSDKError(`Threads container ${containerId} status: ${status.status}`, 'threads', 0)
      }
      await new Promise<void>((r) => setTimeout(r, this.#pollIntervalMs))
    }
    throw new SocialSDKError(`Threads container ${containerId} did not finish after ${this.#pollMaxAttempts} attempts`, 'threads', 0)
  }
}
