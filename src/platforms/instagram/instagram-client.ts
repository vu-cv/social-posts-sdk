import { HttpClient, graphErrorParser } from '../../http/http-client.js'
import { ValidationError, SocialSDKError } from '../../errors/index.js'
import type { InstagramConfig, PostResult } from '../../types/index.js'
import type { PostInfo } from '../../types/post-info.js'
import {
  PostImageInputSchema,
  PostVideoInputSchema,
  PostCarouselInputSchema,
  type PostImageInput,
  type PostVideoInput,
  type PostCarouselInput,
  type MediaContainerResponse,
  type MediaPublishResponse,
  type MediaStatusResponse,
  type InstagramMediaResponse,
} from './instagram.types.js'

export class InstagramClient {
  readonly #http: HttpClient
  readonly #igUserId: string
  readonly #pollIntervalMs: number
  readonly #pollMaxAttempts: number

  constructor(config: InstagramConfig) {
    const apiVersion = config.apiVersion ?? 'v22.0'
    this.#igUserId = config.igUserId
    this.#pollIntervalMs = config.pollIntervalMs ?? 3000
    this.#pollMaxAttempts = config.pollMaxAttempts ?? 20
    this.#http = new HttpClient({
      baseUrl: `https://graph.facebook.com/${apiVersion}`,
      platform: 'instagram',
      defaultParams: { access_token: config.accessToken },
      parseError: graphErrorParser,
      checkGraphApiErrors: true,
    })
  }

  /**
   * Publish a single image to Instagram.
   */
  async postImage(input: PostImageInput): Promise<PostResult> {
    const parsed = PostImageInputSchema.safeParse(input)
    if (!parsed.success) {
      throw new ValidationError('Invalid input for postImage', parsed.error.errors.map(e => e.message))
    }

    const { imageUrl, caption, locationId, userTags } = parsed.data

    const body: Record<string, unknown> = {
      image_url: imageUrl,
      media_type: 'IMAGE',
    }
    if (caption) body['caption'] = caption
    if (locationId) body['location_id'] = locationId
    if (userTags) body['user_tags'] = userTags

    const container = await this.#http.post<MediaContainerResponse>(
      `/${this.#igUserId}/media`,
      body,
    )

    return this.#publishContainer(container.id)
  }

  /**
   * Publish a video or Reel to Instagram.
   */
  async postVideo(input: PostVideoInput): Promise<PostResult> {
    const parsed = PostVideoInputSchema.safeParse(input)
    if (!parsed.success) {
      throw new ValidationError('Invalid input for postVideo', parsed.error.errors.map(e => e.message))
    }

    const { videoUrl, caption, mediaType, thumbOffset } = parsed.data

    const body: Record<string, unknown> = {
      video_url: videoUrl,
      media_type: mediaType,
    }
    if (caption) body['caption'] = caption
    if (thumbOffset !== undefined) body['thumb_offset'] = thumbOffset

    const container = await this.#http.post<MediaContainerResponse>(
      `/${this.#igUserId}/media`,
      body,
    )

    return this.#publishContainer(container.id)
  }

  /**
   * Publish a carousel (album) of 2–10 images or videos to Instagram.
   */
  async postCarousel(input: PostCarouselInput): Promise<PostResult> {
    const parsed = PostCarouselInputSchema.safeParse(input)
    if (!parsed.success) {
      throw new ValidationError('Invalid input for postCarousel', parsed.error.errors.map(e => e.message))
    }

    const { items, caption, locationId } = parsed.data

    // Step 1: Create a container for each item
    const itemContainerIds = await Promise.all(
      items.map(async (item) => {
        const body: Record<string, unknown> =
          item.type === 'IMAGE'
            ? { image_url: item.imageUrl, media_type: 'IMAGE', is_carousel_item: true }
            : { video_url: item.videoUrl, media_type: 'VIDEO', is_carousel_item: true }

        const res = await this.#http.post<MediaContainerResponse>(
          `/${this.#igUserId}/media`,
          body,
        )
        return res.id
      }),
    )

    // Step 2: Create the carousel container
    const carouselBody: Record<string, unknown> = {
      media_type: 'CAROUSEL_ALBUM',
      children: itemContainerIds,
    }
    if (caption) carouselBody['caption'] = caption
    if (locationId) carouselBody['location_id'] = locationId

    const container = await this.#http.post<MediaContainerResponse>(
      `/${this.#igUserId}/media`,
      carouselBody,
    )

    return this.#publishContainer(container.id)
  }

  /** Fetch a media object by its ID and return normalised PostInfo. */
  async getPost(mediaId: string): Promise<PostInfo> {
    const raw = await this.#http.get<InstagramMediaResponse>(`/${mediaId}`, {
      fields: 'id,caption,permalink,timestamp,like_count,comments_count,media_type',
    })
    return {
      id: raw.id,
      platform: 'instagram',
      content: raw.caption ?? null,
      url: raw.permalink ?? null,
      createdAt: raw.timestamp ?? null,
      metrics: {
        likes: raw.like_count ?? null,
        comments: raw.comments_count ?? null,
        shares: null,
        views: null,
      },
      raw,
    }
  }

  /** Delete a media object by its ID. */
  async deletePost(mediaId: string): Promise<void> {
    await this.#http.delete<{ success: boolean }>(`/${mediaId}`)
  }

  /**
   * Polls the container status until FINISHED, then publishes it.
   */
  async #publishContainer(containerId: string): Promise<PostResult> {
    await this.#waitUntilFinished(containerId)

    const result = await this.#http.post<MediaPublishResponse>(
      `/${this.#igUserId}/media_publish`,
      { creation_id: containerId },
    )

    return {
      id: result.id,
      platform: 'instagram',
      createdAt: new Date().toISOString(),
    }
  }

  async #waitUntilFinished(containerId: string): Promise<void> {
    for (let attempt = 0; attempt < this.#pollMaxAttempts; attempt++) {
      const status = await this.#http.get<MediaStatusResponse>(
        `/${containerId}`,
        { fields: 'status_code' },
      )

      if (status.status_code === 'FINISHED') return

      if (status.status_code === 'ERROR' || status.status_code === 'EXPIRED') {
        throw new SocialSDKError(
          `Instagram media container ${containerId} entered status: ${status.status_code}`,
          'instagram',
          0,
        )
      }

      await new Promise<void>((resolve) => setTimeout(resolve, this.#pollIntervalMs))
    }

    throw new SocialSDKError(
      `Instagram media container ${containerId} did not finish processing after ${this.#pollMaxAttempts} attempts`,
      'instagram',
      0,
    )
  }
}
