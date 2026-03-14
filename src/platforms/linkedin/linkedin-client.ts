import axios from 'axios'
import { HttpClient, bearerErrorParser } from '../../http/http-client.js'
import { ValidationError } from '../../errors/index.js'
import type { PostResult } from '../../types/index.js'
import type { LinkedInConfig } from '../../types/index.js'
import {
  LinkedInPostTextInputSchema,
  LinkedInPostImageInputSchema,
  LinkedInPostVideoInputSchema,
  type LinkedInPostTextInput,
  type LinkedInPostImageInput,
  type LinkedInPostVideoInput,
  type LinkedInRegisterUploadResponse,
  type LinkedInUgcPostResponse,
} from './linkedin.types.js'

export class LinkedInClient {
  readonly #http: HttpClient
  readonly #accessToken: string

  constructor(config: LinkedInConfig) {
    this.#accessToken = config.accessToken
    this.#http = new HttpClient({
      baseUrl: 'https://api.linkedin.com/v2',
      platform: 'linkedin',
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        'X-Restli-Protocol-Version': '2.0.0',
      },
      parseError: bearerErrorParser,
    })
  }

  async postText(input: LinkedInPostTextInput): Promise<PostResult> {
    const parsed = LinkedInPostTextInputSchema.safeParse(input)
    if (!parsed.success) throw new ValidationError('Invalid input for postText', parsed.error.errors.map(e => e.message))

    const { text, authorUrn, visibility } = parsed.data
    const response = await this.#http.post<LinkedInUgcPostResponse>('/ugcPosts', this.#buildPost(authorUrn, text, 'NONE', visibility))
    return { id: response.id, platform: 'linkedin', createdAt: new Date().toISOString() }
  }

  async postImage(input: LinkedInPostImageInput): Promise<PostResult> {
    const parsed = LinkedInPostImageInputSchema.safeParse(input)
    if (!parsed.success) throw new ValidationError('Invalid input for postImage', parsed.error.errors.map(e => e.message))

    const { imageUrl, text, title, authorUrn, visibility } = parsed.data
    const assetUrn = await this.#uploadAsset(authorUrn, imageUrl, 'feedshare-image')

    const media = [{ status: 'READY', media: assetUrn, title: { text: title ?? '' }, description: { text: '' } }]
    const body = this.#buildPost(authorUrn, text ?? '', 'IMAGE', visibility, media)
    const response = await this.#http.post<LinkedInUgcPostResponse>('/ugcPosts', body)
    return { id: response.id, platform: 'linkedin', createdAt: new Date().toISOString() }
  }

  async postVideo(input: LinkedInPostVideoInput): Promise<PostResult> {
    const parsed = LinkedInPostVideoInputSchema.safeParse(input)
    if (!parsed.success) throw new ValidationError('Invalid input for postVideo', parsed.error.errors.map(e => e.message))

    const { videoUrl, text, title, authorUrn, visibility } = parsed.data
    const assetUrn = await this.#uploadAsset(authorUrn, videoUrl, 'feedshare-video')

    const media = [{ status: 'READY', media: assetUrn, title: { text: title ?? '' }, description: { text: '' } }]
    const body = this.#buildPost(authorUrn, text ?? '', 'VIDEO', visibility, media)
    const response = await this.#http.post<LinkedInUgcPostResponse>('/ugcPosts', body)
    return { id: response.id, platform: 'linkedin', createdAt: new Date().toISOString() }
  }

  async #uploadAsset(authorUrn: string, mediaUrl: string, recipe: string): Promise<string> {
    // Step 1: Register upload
    const registerBody = {
      registerUploadRequest: {
        recipes: [`urn:li:digitalmediaRecipe:${recipe}`],
        owner: authorUrn,
        serviceRelationships: [{ relationshipType: 'OWNER', identifier: 'urn:li:userGeneratedContent' }],
      },
    }
    const reg = await this.#http.post<LinkedInRegisterUploadResponse>('/assets?action=registerUpload', registerBody)
    const uploadUrl = reg.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl
    const assetUrn = reg.value.asset

    // Step 2: Download and upload binary
    const mediaResp = await axios.get<ArrayBuffer>(mediaUrl, { responseType: 'arraybuffer' })
    await axios.put(uploadUrl, mediaResp.data, {
      headers: {
        Authorization: `Bearer ${this.#accessToken}`,
        'Content-Type': (mediaResp.headers['content-type'] as string | undefined) ?? 'application/octet-stream',
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    })

    return assetUrn
  }

  #buildPost(
    authorUrn: string,
    text: string,
    shareMediaCategory: string,
    visibility: string,
    media?: Record<string, unknown>[],
  ): Record<string, unknown> {
    const content: Record<string, unknown> = {
      shareCommentary: { text },
      shareMediaCategory,
    }
    if (media) content['media'] = media

    return {
      author: authorUrn,
      lifecycleState: 'PUBLISHED',
      specificContent: { 'com.linkedin.ugc.ShareContent': content },
      visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': visibility },
    }
  }
}
