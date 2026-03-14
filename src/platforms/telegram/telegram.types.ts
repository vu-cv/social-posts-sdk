import { z } from 'zod'

export const TelegramSendMessageInputSchema = z.object({
  chatId: z.union([z.string(), z.number()]),
  text: z.string().min(1).max(4096),
  parseMode: z.enum(['HTML', 'Markdown', 'MarkdownV2']).optional(),
  disableWebPagePreview: z.boolean().optional(),
  disableNotification: z.boolean().optional(),
  replyToMessageId: z.number().optional(),
})

export const TelegramSendPhotoInputSchema = z.object({
  chatId: z.union([z.string(), z.number()]),
  photoUrl: z.string().url(),
  caption: z.string().max(1024).optional(),
  parseMode: z.enum(['HTML', 'Markdown', 'MarkdownV2']).optional(),
  disableNotification: z.boolean().optional(),
})

export const TelegramSendVideoInputSchema = z.object({
  chatId: z.union([z.string(), z.number()]),
  videoUrl: z.string().url(),
  caption: z.string().max(1024).optional(),
  parseMode: z.enum(['HTML', 'Markdown', 'MarkdownV2']).optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  duration: z.number().optional(),
  disableNotification: z.boolean().optional(),
})

export const TelegramAlbumItemSchema = z.union([
  z.object({ type: z.literal('photo'), photoUrl: z.string().url(), caption: z.string().max(1024).optional() }),
  z.object({ type: z.literal('video'), videoUrl: z.string().url(), caption: z.string().max(1024).optional() }),
])

export const TelegramSendAlbumInputSchema = z.object({
  chatId: z.union([z.string(), z.number()]),
  media: z.array(TelegramAlbumItemSchema).min(2).max(10),
  disableNotification: z.boolean().optional(),
})

export type TelegramSendMessageInput = z.infer<typeof TelegramSendMessageInputSchema>
export type TelegramSendPhotoInput = z.infer<typeof TelegramSendPhotoInputSchema>
export type TelegramSendVideoInput = z.infer<typeof TelegramSendVideoInputSchema>
export type TelegramAlbumItem = z.infer<typeof TelegramAlbumItemSchema>
export type TelegramSendAlbumInput = z.infer<typeof TelegramSendAlbumInputSchema>

export interface TelegramApiResponse<T> {
  ok: boolean
  result?: T
  error_code?: number
  description?: string
}

export interface TelegramMessage {
  message_id: number
  chat: { id: number | string }
  date: number
}
