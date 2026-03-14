import { describe, it, expect, vi, beforeEach, type MockInstance } from 'vitest'
import axios from 'axios'
import { ZaloClient } from '../src/platforms/zalo/zalo-client.js'
import { SocialSDKError, ValidationError } from '../src/errors/index.js'

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
  return new ZaloClient({ accessToken: 'zalo_oa_token' })
}

describe('ZaloClient', () => {
  beforeEach(() => vi.clearAllMocks())

  it('postFeed — calls /feed with message only', async () => {
    const { postMock } = mockAxiosInstance({ error: 0, message: 'Success', data: { post_id: 'zalo1' } })
    const result = await makeClient().postFeed({ message: 'Xin chào từ Zalo OA!' })
    expect(postMock).toHaveBeenCalledWith('/feed', expect.objectContaining({ message: 'Xin chào từ Zalo OA!' }), expect.anything())
    expect(result).toMatchObject({ id: 'zalo1', platform: 'zalo' })
  })

  it('postFeed — includes photo attachment when photoUrls provided', async () => {
    const { postMock } = mockAxiosInstance({ error: 0, message: 'Success', data: { post_id: 'zalo2' } })
    await makeClient().postFeed({ message: 'Bài với ảnh', photoUrls: ['https://example.com/img.jpg'] })
    expect(postMock).toHaveBeenCalledWith(
      '/feed',
      expect.objectContaining({ attachment: expect.objectContaining({ type: 'photo' }) }),
      expect.anything(),
    )
  })

  it('throws SocialSDKError when API returns non-zero error', async () => {
    mockAxiosInstance({ error: -200, message: 'Invalid token' })
    await expect(makeClient().postFeed({ message: 'test' })).rejects.toThrow(SocialSDKError)
  })

  it('throws ValidationError for empty message', async () => {
    mockAxiosInstance({})
    await expect(makeClient().postFeed({ message: '' })).rejects.toThrow(ValidationError)
  })
})
