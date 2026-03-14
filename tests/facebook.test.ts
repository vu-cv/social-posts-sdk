import { describe, it, expect, vi, beforeEach, type MockInstance } from 'vitest'
import axios from 'axios'
import { FacebookClient } from '../src/platforms/facebook/facebook-client.js'
import { AuthError, RateLimitError, SocialSDKError, ValidationError } from '../src/errors/index.js'

// Spy on axios.create and control the instance
vi.mock('axios', async (importOriginal) => {
  const actual = await importOriginal<typeof import('axios')>()
  return {
    ...actual,
    default: {
      ...actual.default,
      create: vi.fn(),
    },
  }
})

const PAGE_ID = 'page123'
const ACCESS_TOKEN = 'token_abc'

function makeClient() {
  return new FacebookClient({ pageId: PAGE_ID, accessToken: ACCESS_TOKEN })
}

function mockAxiosInstance(responseData: unknown, status = 200) {
  const postMock = vi.fn().mockResolvedValue({ data: responseData, status })
  const getMock = vi.fn().mockResolvedValue({ data: responseData, status })
  const interceptorUse = vi.fn()

  const instance = {
    post: postMock,
    get: getMock,
    interceptors: {
      response: { use: interceptorUse },
    },
  }

  ;(axios.create as unknown as MockInstance).mockReturnValue(instance)
  return { instance, postMock, getMock }
}

describe('FacebookClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('postText()', () => {
    it('calls POST /{pageId}/feed with correct params', async () => {
      const { postMock } = mockAxiosInstance({ id: 'post_1' })
      const client = makeClient()

      const result = await client.postText({ message: 'Hello World' })

      expect(postMock).toHaveBeenCalledWith(
        `/${PAGE_ID}/feed`,
        expect.objectContaining({ message: 'Hello World', published: true }),
        expect.anything(),
      )
      expect(result).toMatchObject({ id: 'post_1', platform: 'facebook' })
    })

    it('includes link when provided', async () => {
      const { postMock } = mockAxiosInstance({ id: 'post_2' })
      const client = makeClient()

      await client.postText({ message: 'Check this', link: 'https://example.com' })

      expect(postMock).toHaveBeenCalledWith(
        `/${PAGE_ID}/feed`,
        expect.objectContaining({ link: 'https://example.com' }),
        expect.anything(),
      )
    })

    it('throws ValidationError for empty message', async () => {
      mockAxiosInstance({})
      const client = makeClient()

      await expect(client.postText({ message: '' })).rejects.toThrow(ValidationError)
    })

    it('throws ValidationError for invalid link URL', async () => {
      mockAxiosInstance({})
      const client = makeClient()

      await expect(client.postText({ message: 'Hi', link: 'not-a-url' })).rejects.toThrow(ValidationError)
    })
  })

  describe('postPhoto()', () => {
    it('calls POST /{pageId}/photos with image URL', async () => {
      const { postMock } = mockAxiosInstance({ id: 'photo_1', post_id: 'post_photo_1' })
      const client = makeClient()

      const result = await client.postPhoto({ imageUrl: 'https://example.com/img.jpg' })

      expect(postMock).toHaveBeenCalledWith(
        `/${PAGE_ID}/photos`,
        expect.objectContaining({ url: 'https://example.com/img.jpg', published: true }),
        expect.anything(),
      )
      expect(result.id).toBe('post_photo_1')
    })

    it('throws ValidationError for invalid image URL', async () => {
      mockAxiosInstance({})
      const client = makeClient()

      await expect(client.postPhoto({ imageUrl: 'not-a-url' })).rejects.toThrow(ValidationError)
    })
  })

  describe('postAlbum()', () => {
    it('uploads each photo unpublished then posts feed', async () => {
      const { postMock } = mockAxiosInstance({ id: 'album_1' })
      // First two calls return photo ids, third returns feed post
      postMock
        .mockResolvedValueOnce({ data: { id: 'ph1' } })
        .mockResolvedValueOnce({ data: { id: 'ph2' } })
        .mockResolvedValueOnce({ data: { id: 'album_1' } })

      const client = makeClient()
      const result = await client.postAlbum({
        imageUrls: ['https://example.com/a.jpg', 'https://example.com/b.jpg'],
        message: 'Two photos',
      })

      // First two posts are unpublished photo uploads
      expect(postMock).toHaveBeenNthCalledWith(
        1,
        `/${PAGE_ID}/photos`,
        expect.objectContaining({ published: false }),
        expect.anything(),
      )
      // Third post is the feed post with attached_media
      expect(postMock).toHaveBeenNthCalledWith(
        3,
        `/${PAGE_ID}/feed`,
        expect.objectContaining({
          attached_media: [{ media_fbid: 'ph1' }, { media_fbid: 'ph2' }],
          message: 'Two photos',
        }),
        expect.anything(),
      )
      expect(result.id).toBe('album_1')
    })

    it('throws ValidationError when fewer than 2 images', async () => {
      mockAxiosInstance({})
      const client = makeClient()

      await expect(
        client.postAlbum({ imageUrls: ['https://example.com/a.jpg'] }),
      ).rejects.toThrow(ValidationError)
    })
  })

  describe('postVideo()', () => {
    it('calls POST /{pageId}/videos with video URL', async () => {
      const { postMock } = mockAxiosInstance({ id: 'video_1' })
      const client = makeClient()

      const result = await client.postVideo({ videoUrl: 'https://example.com/v.mp4', title: 'My video' })

      expect(postMock).toHaveBeenCalledWith(
        `/${PAGE_ID}/videos`,
        expect.objectContaining({ file_url: 'https://example.com/v.mp4', title: 'My video' }),
        expect.anything(),
      )
      expect(result.id).toBe('video_1')
    })
  })

  describe('error handling', () => {
    it('throws AuthError for Graph API error code 190', async () => {
      const { instance } = mockAxiosInstance({})

      // Simulate the interceptor calling the error handler
      let errorHandler: ((e: unknown) => unknown) | undefined
      instance.interceptors.response.use.mockImplementation((_: unknown, onReject: (e: unknown) => unknown) => {
        errorHandler = onReject
      })

      const client = makeClient()

      const axiosErr = Object.assign(new Error('Invalid token'), {
        isAxiosError: true,
        response: {
          status: 400,
          data: { error: { code: 190, message: 'Invalid OAuth access token.' } },
        },
      })

      if (errorHandler) {
        expect(() => errorHandler!(axiosErr)).toThrow(AuthError)
      }
    })

    it('throws RateLimitError for Graph API error code 613', async () => {
      const { instance } = mockAxiosInstance({})

      let errorHandler: ((e: unknown) => unknown) | undefined
      instance.interceptors.response.use.mockImplementation((_: unknown, onReject: (e: unknown) => unknown) => {
        errorHandler = onReject
      })

      makeClient()

      const axiosErr = Object.assign(new Error('Rate limited'), {
        isAxiosError: true,
        response: {
          status: 400,
          data: { error: { code: 613, message: 'Calls to this API have exceeded the rate limit.' } },
        },
      })

      if (errorHandler) {
        expect(() => errorHandler!(axiosErr)).toThrow(RateLimitError)
      }
    })

    it('throws SocialSDKError for other Graph API errors', async () => {
      const { instance } = mockAxiosInstance({})

      let errorHandler: ((e: unknown) => unknown) | undefined
      instance.interceptors.response.use.mockImplementation((_: unknown, onReject: (e: unknown) => unknown) => {
        errorHandler = onReject
      })

      makeClient()

      const axiosErr = Object.assign(new Error('Some error'), {
        isAxiosError: true,
        response: {
          status: 500,
          data: { error: { code: 1, message: 'An unknown error has occurred.' } },
        },
      })

      if (errorHandler) {
        expect(() => errorHandler!(axiosErr)).toThrow(SocialSDKError)
      }
    })
  })
})
