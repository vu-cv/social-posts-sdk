import { describe, it, expect, vi, beforeEach, type MockInstance } from 'vitest'
import axios from 'axios'
import { TikTokClient } from '../src/platforms/tiktok/tiktok-client.js'
import { SocialSDKError, ValidationError } from '../src/errors/index.js'

vi.mock('axios', async (importOriginal) => {
  const actual = await importOriginal<typeof import('axios')>()
  return { ...actual, default: { ...actual.default, create: vi.fn() } }
})

function mockAxiosInstance() {
  const postMock = vi.fn()
  const instance = { post: postMock, interceptors: { response: { use: vi.fn() } } }
  ;(axios.create as unknown as MockInstance).mockReturnValue(instance)
  return { postMock }
}

function makeClient() {
  return new TikTokClient({ accessToken: 'tt_token', pollIntervalMs: 0, pollMaxAttempts: 2 })
}

const OK_ERROR = { code: 'ok', message: '', log_id: 'x' }

describe('TikTokClient', () => {
  beforeEach(() => vi.clearAllMocks())

  it('postVideo — inits and polls until PUBLISH_COMPLETE', async () => {
    const { postMock } = mockAxiosInstance()
    postMock
      .mockResolvedValueOnce({ data: { data: { publish_id: 'pub1', upload_url: null }, error: OK_ERROR } })
      .mockResolvedValueOnce({ data: { data: { status: 'PUBLISH_COMPLETE' }, error: OK_ERROR } })

    const result = await makeClient().postVideo({ videoUrl: 'https://example.com/v.mp4' })
    expect(postMock).toHaveBeenNthCalledWith(1, '/post/publish/video/init/', expect.objectContaining({ source_info: expect.objectContaining({ source: 'PULL_FROM_URL' }) }), expect.anything())
    expect(result).toMatchObject({ id: 'pub1', platform: 'tiktok' })
  })

  it('postVideo — throws SocialSDKError on FAILED status', async () => {
    const { postMock } = mockAxiosInstance()
    postMock
      .mockResolvedValueOnce({ data: { data: { publish_id: 'pub2' }, error: OK_ERROR } })
      .mockResolvedValueOnce({ data: { data: { status: 'FAILED', fail_reason: 'Invalid video' }, error: OK_ERROR } })

    await expect(makeClient().postVideo({ videoUrl: 'https://example.com/v.mp4' })).rejects.toThrow(SocialSDKError)
  })

  it('postVideo — throws SocialSDKError when API returns non-ok code', async () => {
    const { postMock } = mockAxiosInstance()
    postMock.mockResolvedValueOnce({ data: { data: {}, error: { code: 'invalid_param', message: 'privacy_level is required', log_id: 'x' } } })

    await expect(makeClient().postVideo({ videoUrl: 'https://example.com/v.mp4' })).rejects.toThrow(SocialSDKError)
  })

  it('postPhotos — calls content init with PHOTO media type', async () => {
    const { postMock } = mockAxiosInstance()
    postMock.mockResolvedValueOnce({ data: { data: { publish_id: 'photo1' }, error: OK_ERROR } })

    const result = await makeClient().postPhotos({ photoUrls: ['https://example.com/a.jpg', 'https://example.com/b.jpg'] })
    expect(postMock).toHaveBeenCalledWith('/post/publish/content/init/', expect.objectContaining({ media_type: 'PHOTO' }), expect.anything())
    expect(result.id).toBe('photo1')
  })

  it('throws ValidationError for empty photoUrls', async () => {
    mockAxiosInstance()
    await expect(makeClient().postPhotos({ photoUrls: [] })).rejects.toThrow(ValidationError)
  })
})
