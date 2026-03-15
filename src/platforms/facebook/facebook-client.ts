import { HttpClient, graphErrorParser } from '../../http/http-client.js'
import { ValidationError } from '../../errors/index.js'
import type { FacebookConfig, PostResult } from '../../types/index.js'
import type { PostInfo } from '../../types/post-info.js'
import {
  PostTextInputSchema,
  PostPhotoInputSchema,
  PostAlbumInputSchema,
  PostVideoInputSchema,
  type PostTextInput,
  type PostPhotoInput,
  type PostAlbumInput,
  type PostVideoInput,
  type FeedPostResponse,
  type PhotoPostResponse,
  type VideoPostResponse,
  type FacebookPostResponse,
} from './facebook.types.js'

export class FacebookClient {
  readonly #http: HttpClient
  readonly #pageId: string

  constructor(config: FacebookConfig) {
    const apiVersion = config.apiVersion ?? 'v22.0'
    this.#pageId = config.pageId
    this.#http = new HttpClient({
      baseUrl: `https://graph.facebook.com/${apiVersion}`,
      platform: 'facebook',
      defaultParams: { access_token: config.accessToken },
      parseError: graphErrorParser,
      checkGraphApiErrors: true,
    })
  }

  /**
   * Publish a text post (with optional link) to the Facebook Page.
   */
  async postText(input: PostTextInput): Promise<PostResult> {
    const parsed = PostTextInputSchema.safeParse(input)
    if (!parsed.success) {
      throw new ValidationError('Invalid input for postText', parsed.error.errors.map(e => e.message))
    }

    const { message, link, scheduledPublishTime, published } = parsed.data

    const body: Record<string, unknown> = { message, published }
    if (link) body['link'] = link
    if (scheduledPublishTime) body['scheduled_publish_time'] = scheduledPublishTime

    const response = await this.#http.post<FeedPostResponse>(
      `/${this.#pageId}/feed`,
      body,
    )

    return this.#toResult(response.id)
  }

  /**
   * Publish a single photo to the Facebook Page.
   */
  async postPhoto(input: PostPhotoInput): Promise<PostResult> {
    const parsed = PostPhotoInputSchema.safeParse(input)
    if (!parsed.success) {
      throw new ValidationError('Invalid input for postPhoto', parsed.error.errors.map(e => e.message))
    }

    const { imageUrl, message, published } = parsed.data

    const body: Record<string, unknown> = { url: imageUrl, published }
    if (message) body['message'] = message

    const response = await this.#http.post<PhotoPostResponse>(
      `/${this.#pageId}/photos`,
      body,
    )

    return this.#toResult(response.post_id ?? response.id)
  }

  /**
   * Publish a multi-photo album to the Facebook Page.
   * Each photo is first uploaded as an unpublished attachment,
   * then a single feed post is created with all attachments.
   */
  async postAlbum(input: PostAlbumInput): Promise<PostResult> {
    const parsed = PostAlbumInputSchema.safeParse(input)
    if (!parsed.success) {
      throw new ValidationError('Invalid input for postAlbum', parsed.error.errors.map(e => e.message))
    }

    const { imageUrls, message } = parsed.data

    // Step 1: Upload each photo as unpublished
    const photoIds = await Promise.all(
      imageUrls.map(async (url) => {
        const res = await this.#http.post<PhotoPostResponse>(
          `/${this.#pageId}/photos`,
          { url, published: false },
        )
        return res.id
      }),
    )

    // Step 2: Publish a feed post with attached_media
    const attached_media = photoIds.map((id) => ({ media_fbid: id }))
    const body: Record<string, unknown> = { attached_media }
    if (message) body['message'] = message

    const response = await this.#http.post<FeedPostResponse>(
      `/${this.#pageId}/feed`,
      body,
    )

    return this.#toResult(response.id)
  }

  /**
   * Publish a video to the Facebook Page.
   */
  async postVideo(input: PostVideoInput): Promise<PostResult> {
    const parsed = PostVideoInputSchema.safeParse(input)
    if (!parsed.success) {
      throw new ValidationError('Invalid input for postVideo', parsed.error.errors.map(e => e.message))
    }

    const { videoUrl, title, description, published } = parsed.data

    const body: Record<string, unknown> = { file_url: videoUrl, published }
    if (title) body['title'] = title
    if (description) body['description'] = description

    const response = await this.#http.post<VideoPostResponse>(
      `/${this.#pageId}/videos`,
      body,
    )

    return this.#toResult(response.id)
  }

  /** Fetch a post by its ID and return normalised PostInfo. */
  async getPost(postId: string): Promise<PostInfo> {
    const raw = await this.#http.get<FacebookPostResponse>(`/${postId}`, {
      fields: 'id,message,story,permalink_url,created_time,likes.summary(true),comments.summary(true),shares',
    })
    return {
      id: raw.id,
      platform: 'facebook',
      content: raw.message ?? raw.story ?? null,
      url: raw.permalink_url ?? null,
      createdAt: raw.created_time ?? null,
      metrics: {
        likes: raw.likes?.summary?.total_count ?? null,
        comments: raw.comments?.summary?.total_count ?? null,
        shares: raw.shares?.count ?? null,
        views: null,
      },
      raw,
    }
  }

  /** Delete a post by its ID. */
  async deletePost(postId: string): Promise<void> {
    await this.#http.delete<{ success: boolean }>(`/${postId}`)
  }

  /** Update the message of an existing post. */
  async updatePost(postId: string, update: { message: string }): Promise<void> {
    await this.#http.post<{ success: boolean }>(`/${postId}`, { message: update.message })
  }

  #toResult(id: string): PostResult {
    return {
      id,
      platform: 'facebook',
      createdAt: new Date().toISOString(),
    }
  }
}
