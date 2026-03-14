import { HttpClient } from '../../http/http-client.js'
import { AuthError, SocialSDKError, ValidationError, type Platform } from '../../errors/index.js'
import type { PostResult } from '../../types/index.js'
import type { TelegramConfig } from '../../types/index.js'
import {
  TelegramSendMessageInputSchema,
  TelegramSendPhotoInputSchema,
  TelegramSendVideoInputSchema,
  TelegramSendAlbumInputSchema,
  type TelegramSendMessageInput,
  type TelegramSendPhotoInput,
  type TelegramSendVideoInput,
  type TelegramSendAlbumInput,
  type TelegramApiResponse,
  type TelegramMessage,
} from './telegram.types.js'

const PLATFORM: Platform = 'telegram'

export class TelegramClient {
  readonly #http: HttpClient

  constructor(config: TelegramConfig) {
    this.#http = new HttpClient({
      baseUrl: `https://api.telegram.org/bot${config.botToken}`,
      platform: PLATFORM,
      parseError: (platform, status, body) => {
        const b = body as { description?: string; error_code?: number }
        const message = b.description ?? `HTTP ${status}`
        const code = b.error_code ?? status
        if (status === 401) throw new AuthError(message, platform, code, body)
        throw new SocialSDKError(message, platform, code, body)
      },
    })
  }

  /** Send a text message to a chat or channel */
  async sendMessage(input: TelegramSendMessageInput): Promise<PostResult> {
    const parsed = TelegramSendMessageInputSchema.safeParse(input)
    if (!parsed.success) throw new ValidationError('Invalid input for sendMessage', parsed.error.errors.map(e => e.message))

    const { chatId, text, parseMode, disableWebPagePreview, disableNotification, replyToMessageId } = parsed.data
    const body: Record<string, unknown> = { chat_id: chatId, text }
    if (parseMode) body['parse_mode'] = parseMode
    if (disableWebPagePreview) body['disable_web_page_preview'] = disableWebPagePreview
    if (disableNotification) body['disable_notification'] = disableNotification
    if (replyToMessageId) body['reply_to_message_id'] = replyToMessageId

    const response = await this.#http.post<TelegramApiResponse<TelegramMessage>>('/sendMessage', body)
    return this.#toResult(response)
  }

  /** Send a photo to a chat or channel */
  async sendPhoto(input: TelegramSendPhotoInput): Promise<PostResult> {
    const parsed = TelegramSendPhotoInputSchema.safeParse(input)
    if (!parsed.success) throw new ValidationError('Invalid input for sendPhoto', parsed.error.errors.map(e => e.message))

    const { chatId, photoUrl, caption, parseMode, disableNotification } = parsed.data
    const body: Record<string, unknown> = { chat_id: chatId, photo: photoUrl }
    if (caption) body['caption'] = caption
    if (parseMode) body['parse_mode'] = parseMode
    if (disableNotification) body['disable_notification'] = disableNotification

    const response = await this.#http.post<TelegramApiResponse<TelegramMessage>>('/sendPhoto', body)
    return this.#toResult(response)
  }

  /** Send a video to a chat or channel */
  async sendVideo(input: TelegramSendVideoInput): Promise<PostResult> {
    const parsed = TelegramSendVideoInputSchema.safeParse(input)
    if (!parsed.success) throw new ValidationError('Invalid input for sendVideo', parsed.error.errors.map(e => e.message))

    const { chatId, videoUrl, caption, parseMode, width, height, duration, disableNotification } = parsed.data
    const body: Record<string, unknown> = { chat_id: chatId, video: videoUrl }
    if (caption) body['caption'] = caption
    if (parseMode) body['parse_mode'] = parseMode
    if (width) body['width'] = width
    if (height) body['height'] = height
    if (duration) body['duration'] = duration
    if (disableNotification) body['disable_notification'] = disableNotification

    const response = await this.#http.post<TelegramApiResponse<TelegramMessage>>('/sendVideo', body)
    return this.#toResult(response)
  }

  /** Send a media group (album) of 2–10 photos/videos */
  async sendAlbum(input: TelegramSendAlbumInput): Promise<PostResult> {
    const parsed = TelegramSendAlbumInputSchema.safeParse(input)
    if (!parsed.success) throw new ValidationError('Invalid input for sendAlbum', parsed.error.errors.map(e => e.message))

    const { chatId, media, disableNotification } = parsed.data
    const mediaItems = media.map((item, i) =>
      item.type === 'photo'
        ? { type: 'photo', media: item.photoUrl, ...(i === 0 && item.caption ? { caption: item.caption } : {}) }
        : { type: 'video', media: item.videoUrl, ...(i === 0 && item.caption ? { caption: item.caption } : {}) },
    )

    const body: Record<string, unknown> = { chat_id: chatId, media: mediaItems }
    if (disableNotification) body['disable_notification'] = disableNotification

    const response = await this.#http.post<TelegramApiResponse<TelegramMessage[]>>('/sendMediaGroup', body)

    if (!response.ok) {
      throw new SocialSDKError(response.description ?? 'sendMediaGroup failed', PLATFORM, response.error_code ?? 0)
    }

    const firstMsg = response.result?.[0]
    return {
      id: String(firstMsg?.message_id ?? 'unknown'),
      platform: PLATFORM,
      createdAt: new Date().toISOString(),
    }
  }

  #toResult(response: TelegramApiResponse<TelegramMessage>): PostResult {
    if (!response.ok) {
      throw new SocialSDKError(response.description ?? 'Telegram API error', PLATFORM, response.error_code ?? 0)
    }
    return {
      id: String(response.result?.message_id ?? 'unknown'),
      platform: PLATFORM,
      createdAt: new Date().toISOString(),
    }
  }
}
