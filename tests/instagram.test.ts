import { describe, it, expect, vi, beforeEach, type MockInstance } from 'vitest'
import axios from 'axios'
import { InstagramClient } from '../src/platforms/instagram/instagram-client.js'
import { SocialSDKError, ValidationError } from '../src/errors/index.js'

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

const IG_USER_ID = 'ig_user_123'
const ACCESS_TOKEN = 'token_xyz'

function makeClient(overrides?: Partial<ConstructorParameters<typeof InstagramClient>[0]>) {
  return new InstagramClient({
    igUserId: IG_USER_ID,
    accessToken: ACCESS_TOKEN,
    pollIntervalMs: 0, // no delay in tests
    pollMaxAttempts: 3,
    ...overrides,
  })
}

function mockAxiosInstance() {
  const postMock = vi.fn()
  const getMock = vi.fn()
  const deleteMock = vi.fn().mockResolvedValue({ data: { success: true } })
  const interceptorUse = vi.fn()

  const instance = {
    post: postMock,
    get: getMock,
    delete: deleteMock,
    interceptors: { response: { use: interceptorUse } },
  }

  ;(axios.create as unknown as MockInstance).mockReturnValue(instance)
  return { instance, postMock, getMock, deleteMock }
}

describe('InstagramClient', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('postImage()', () => {
    it('creates container, polls status, then publishes', async () => {
      const { postMock, getMock } = mockAxiosInstance()

      postMock
        .mockResolvedValueOnce({ data: { id: 'container_1' } })  // /media
        .mockResolvedValueOnce({ data: { id: 'published_1' } })  // /media_publish

      getMock.mockResolvedValueOnce({ data: { status_code: 'FINISHED', id: 'container_1' } })

      const client = makeClient()
      const result = await client.postImage({ imageUrl: 'https://example.com/photo.jpg', caption: 'Hello IG' })

      expect(postMock).toHaveBeenNthCalledWith(
        1,
        `/${IG_USER_ID}/media`,
        expect.objectContaining({ image_url: 'https://example.com/photo.jpg', media_type: 'IMAGE', caption: 'Hello IG' }),
        expect.anything(),
      )
      expect(getMock).toHaveBeenCalledWith(
        '/container_1',
        expect.objectContaining({ params: expect.objectContaining({ fields: 'status_code' }) }),
      )
      expect(postMock).toHaveBeenNthCalledWith(
        2,
        `/${IG_USER_ID}/media_publish`,
        expect.objectContaining({ creation_id: 'container_1' }),
        expect.anything(),
      )
      expect(result).toMatchObject({ id: 'published_1', platform: 'instagram' })
    })

    it('throws ValidationError for invalid image URL', async () => {
      mockAxiosInstance()
      const client = makeClient()

      await expect(client.postImage({ imageUrl: 'not-a-url' })).rejects.toThrow(ValidationError)
    })

    it('throws SocialSDKError when container enters ERROR status', async () => {
      const { postMock, getMock } = mockAxiosInstance()
      postMock.mockResolvedValueOnce({ data: { id: 'container_err' } })
      getMock.mockResolvedValueOnce({ data: { status_code: 'ERROR', id: 'container_err' } })

      const client = makeClient()

      await expect(client.postImage({ imageUrl: 'https://example.com/img.jpg' })).rejects.toThrow(SocialSDKError)
    })

    it('throws SocialSDKError after max polling attempts', async () => {
      const { postMock, getMock } = mockAxiosInstance()
      postMock.mockResolvedValueOnce({ data: { id: 'container_slow' } })
      getMock.mockResolvedValue({ data: { status_code: 'IN_PROGRESS', id: 'container_slow' } })

      const client = makeClient({ pollMaxAttempts: 2 })

      await expect(client.postImage({ imageUrl: 'https://example.com/img.jpg' })).rejects.toThrow(SocialSDKError)
    })
  })

  describe('postVideo()', () => {
    it('creates VIDEO container and publishes', async () => {
      const { postMock, getMock } = mockAxiosInstance()

      postMock
        .mockResolvedValueOnce({ data: { id: 'vid_container' } })
        .mockResolvedValueOnce({ data: { id: 'vid_published' } })
      getMock.mockResolvedValueOnce({ data: { status_code: 'FINISHED', id: 'vid_container' } })

      const client = makeClient()
      const result = await client.postVideo({ videoUrl: 'https://example.com/video.mp4' })

      expect(postMock).toHaveBeenNthCalledWith(
        1,
        `/${IG_USER_ID}/media`,
        expect.objectContaining({ video_url: 'https://example.com/video.mp4', media_type: 'VIDEO' }),
        expect.anything(),
      )
      expect(result.id).toBe('vid_published')
    })

    it('uses REELS media type when specified', async () => {
      const { postMock, getMock } = mockAxiosInstance()

      postMock
        .mockResolvedValueOnce({ data: { id: 'reel_c' } })
        .mockResolvedValueOnce({ data: { id: 'reel_p' } })
      getMock.mockResolvedValueOnce({ data: { status_code: 'FINISHED', id: 'reel_c' } })

      const client = makeClient()
      await client.postVideo({ videoUrl: 'https://example.com/reel.mp4', mediaType: 'REELS' })

      expect(postMock).toHaveBeenNthCalledWith(
        1,
        `/${IG_USER_ID}/media`,
        expect.objectContaining({ media_type: 'REELS' }),
        expect.anything(),
      )
    })
  })

  describe('getPost()', () => {
    it('fetches media fields and returns normalised PostInfo', async () => {
      const { getMock } = mockAxiosInstance()
      const raw = {
        id: 'media_123',
        caption: 'Great photo!',
        permalink: 'https://www.instagram.com/p/abc/',
        timestamp: '2024-06-01T10:00:00+0000',
        like_count: 100,
        comments_count: 12,
        media_type: 'IMAGE',
      }
      getMock.mockResolvedValue({ data: raw })
      const client = makeClient()

      const info = await client.getPost('media_123')

      expect(getMock).toHaveBeenCalledWith(
        '/media_123',
        expect.objectContaining({ params: expect.objectContaining({ fields: expect.stringContaining('caption') }) }),
      )
      expect(info).toMatchObject({
        id: 'media_123',
        platform: 'instagram',
        content: 'Great photo!',
        url: 'https://www.instagram.com/p/abc/',
        metrics: { likes: 100, comments: 12, shares: null, views: null },
      })
    })
  })

  describe('deletePost()', () => {
    it('calls DELETE /{mediaId}', async () => {
      const { deleteMock } = mockAxiosInstance()
      const client = makeClient()

      await client.deletePost('media_del')

      expect(deleteMock).toHaveBeenCalledWith('/media_del')
    })
  })

  describe('postCarousel()', () => {
    it('creates item containers, carousel container, then publishes', async () => {
      const { postMock, getMock } = mockAxiosInstance()

      postMock
        .mockResolvedValueOnce({ data: { id: 'item_1' } })       // item 1
        .mockResolvedValueOnce({ data: { id: 'item_2' } })       // item 2
        .mockResolvedValueOnce({ data: { id: 'carousel_c' } })   // carousel container
        .mockResolvedValueOnce({ data: { id: 'carousel_p' } })   // publish
      getMock.mockResolvedValueOnce({ data: { status_code: 'FINISHED', id: 'carousel_c' } })

      const client = makeClient()
      const result = await client.postCarousel({
        items: [
          { type: 'IMAGE', imageUrl: 'https://example.com/a.jpg' },
          { type: 'IMAGE', imageUrl: 'https://example.com/b.jpg' },
        ],
        caption: 'Carousel post',
      })

      // Item containers created with is_carousel_item: true
      expect(postMock).toHaveBeenNthCalledWith(
        1,
        `/${IG_USER_ID}/media`,
        expect.objectContaining({ is_carousel_item: true }),
        expect.anything(),
      )
      // Carousel container includes children
      expect(postMock).toHaveBeenNthCalledWith(
        3,
        `/${IG_USER_ID}/media`,
        expect.objectContaining({
          media_type: 'CAROUSEL_ALBUM',
          children: ['item_1', 'item_2'],
          caption: 'Carousel post',
        }),
        expect.anything(),
      )
      expect(result.id).toBe('carousel_p')
    })

    it('throws ValidationError for only 1 item', async () => {
      mockAxiosInstance()
      const client = makeClient()

      await expect(
        client.postCarousel({ items: [{ type: 'IMAGE', imageUrl: 'https://example.com/a.jpg' }] }),
      ).rejects.toThrow(ValidationError)
    })

    it('throws ValidationError for more than 10 items', async () => {
      mockAxiosInstance()
      const client = makeClient()

      const items = Array.from({ length: 11 }, (_, i) => ({
        type: 'IMAGE' as const,
        imageUrl: `https://example.com/${i}.jpg`,
      }))

      await expect(client.postCarousel({ items })).rejects.toThrow(ValidationError)
    })
  })
})
