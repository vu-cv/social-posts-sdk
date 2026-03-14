import { describe, it, expect, vi, beforeEach, type MockInstance } from 'vitest'
import axios from 'axios'
import { TelegramClient } from '../src/platforms/telegram/telegram-client.js'
import { ValidationError } from '../src/errors/index.js'

vi.mock('axios', async (importOriginal) => {
  const actual = await importOriginal<typeof import('axios')>()
  return { ...actual, default: { ...actual.default, create: vi.fn() } }
})

function mockAxiosInstance(responseData: unknown) {
  const postMock = vi.fn().mockResolvedValue({ data: responseData })
  const instance = { post: postMock, interceptors: { response: { use: vi.fn() } } }
  ;(axios.create as unknown as MockInstance).mockReturnValue(instance)
  return { postMock }
}

function makeClient() {
  return new TelegramClient({ botToken: 'bot123:TOKEN' })
}

const OK_MSG = { ok: true, result: { message_id: 42, chat: { id: -100123 }, date: 1700000000 } }

describe('TelegramClient', () => {
  beforeEach(() => vi.clearAllMocks())

  it('sendMessage — calls /sendMessage', async () => {
    const { postMock } = mockAxiosInstance(OK_MSG)
    const result = await makeClient().sendMessage({ chatId: '@mychannel', text: 'Hello!' })
    expect(postMock).toHaveBeenCalledWith('/sendMessage', expect.objectContaining({ chat_id: '@mychannel', text: 'Hello!' }), expect.anything())
    expect(result).toMatchObject({ id: '42', platform: 'telegram' })
  })

  it('sendPhoto — calls /sendPhoto with photo URL', async () => {
    const { postMock } = mockAxiosInstance(OK_MSG)
    const result = await makeClient().sendPhoto({ chatId: '-1001234', photoUrl: 'https://example.com/img.jpg', caption: 'Caption' })
    expect(postMock).toHaveBeenCalledWith('/sendPhoto', expect.objectContaining({ photo: 'https://example.com/img.jpg' }), expect.anything())
    expect(result.platform).toBe('telegram')
  })

  it('sendVideo — calls /sendVideo', async () => {
    const { postMock } = mockAxiosInstance(OK_MSG)
    await makeClient().sendVideo({ chatId: '@chan', videoUrl: 'https://example.com/v.mp4' })
    expect(postMock).toHaveBeenCalledWith('/sendVideo', expect.objectContaining({ video: 'https://example.com/v.mp4' }), expect.anything())
  })

  it('sendAlbum — calls /sendMediaGroup with media array', async () => {
    const { postMock } = mockAxiosInstance({ ok: true, result: [{ message_id: 10 }, { message_id: 11 }] })
    const result = await makeClient().sendAlbum({
      chatId: '@chan',
      media: [
        { type: 'photo', photoUrl: 'https://example.com/a.jpg' },
        { type: 'photo', photoUrl: 'https://example.com/b.jpg' },
      ],
    })
    expect(postMock).toHaveBeenCalledWith('/sendMediaGroup', expect.objectContaining({ media: expect.any(Array) }), expect.anything())
    expect(result.id).toBe('10')
  })

  it('throws ValidationError for empty text', async () => {
    mockAxiosInstance(OK_MSG)
    await expect(makeClient().sendMessage({ chatId: '@chan', text: '' })).rejects.toThrow(ValidationError)
  })

  it('throws ValidationError for album with only 1 item', async () => {
    mockAxiosInstance(OK_MSG)
    await expect(
      makeClient().sendAlbum({ chatId: '@chan', media: [{ type: 'photo', photoUrl: 'https://example.com/a.jpg' }] }),
    ).rejects.toThrow(ValidationError)
  })
})
