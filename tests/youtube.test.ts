import { describe, it, expect, vi, beforeEach, type MockInstance } from 'vitest'
import axios from 'axios'
import { YouTubeClient } from '../src/platforms/youtube/youtube-client.js'
import { ValidationError } from '../src/errors/index.js'

vi.mock('axios', async (importOriginal) => {
  const actual = await importOriginal<typeof import('axios')>()
  return {
    ...actual,
    default: {
      ...actual.default,
      head: vi.fn(),
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      isAxiosError: actual.default.isAxiosError,
    },
  }
})

function makeClient() {
  return new YouTubeClient({ accessToken: 'yt_token' })
}

describe('YouTubeClient', () => {
  beforeEach(() => vi.clearAllMocks())

  it('uploadVideo — probes URL, initiates resumable upload, streams video', async () => {
    ;(axios.head as unknown as MockInstance).mockResolvedValueOnce({
      headers: { 'content-type': 'video/mp4', 'content-length': '1024' },
    })
    ;(axios.post as unknown as MockInstance).mockResolvedValueOnce({
      headers: { location: 'https://upload.youtube.com/abc' },
    })
    ;(axios.get as unknown as MockInstance).mockResolvedValueOnce({
      data: { pipe: vi.fn() },
    })
    ;(axios.put as unknown as MockInstance).mockResolvedValueOnce({
      data: { id: 'yt_vid_1', snippet: { title: 'Test' }, status: { privacyStatus: 'public' } },
    })

    const result = await makeClient().uploadVideo({ videoUrl: 'https://example.com/v.mp4', title: 'Test Video' })
    expect(result).toMatchObject({ id: 'yt_vid_1', platform: 'youtube' })
    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining('resumable'),
      expect.objectContaining({ snippet: expect.objectContaining({ title: 'Test Video' }) }),
      expect.anything(),
    )
  })

  it('throws ValidationError for empty title', async () => {
    await expect(makeClient().uploadVideo({ videoUrl: 'https://example.com/v.mp4', title: '' })).rejects.toThrow(ValidationError)
  })

  it('throws ValidationError for invalid URL', async () => {
    await expect(makeClient().uploadVideo({ videoUrl: 'not-a-url', title: 'Test' })).rejects.toThrow(ValidationError)
  })
})
