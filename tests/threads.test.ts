import { describe, it, expect, vi, beforeEach, type MockInstance } from 'vitest'
import axios from 'axios'
import { ThreadsClient } from '../src/platforms/threads/threads-client.js'
import { ValidationError } from '../src/errors/index.js'

vi.mock('axios', async (importOriginal) => {
  const actual = await importOriginal<typeof import('axios')>()
  return { ...actual, default: { ...actual.default, create: vi.fn() } }
})

function mockAxiosInstance() {
  const postMock = vi.fn()
  const getMock = vi.fn()
  const instance = { post: postMock, get: getMock, interceptors: { response: { use: vi.fn() } } }
  ;(axios.create as unknown as MockInstance).mockReturnValue(instance)
  return { postMock, getMock }
}

function makeClient() {
  return new ThreadsClient({ userId: 'user1', accessToken: 'token', pollIntervalMs: 0, pollMaxAttempts: 2 })
}

describe('ThreadsClient', () => {
  beforeEach(() => vi.clearAllMocks())

  it('postText — creates container and publishes', async () => {
    const { postMock, getMock } = mockAxiosInstance()
    postMock.mockResolvedValueOnce({ data: { id: 'c1' } }).mockResolvedValueOnce({ data: { id: 'p1' } })
    getMock.mockResolvedValueOnce({ data: { status: 'FINISHED', id: 'c1' } })

    const result = await makeClient().postText({ text: 'Hello Threads!' })

    expect(postMock).toHaveBeenNthCalledWith(1, '/user1/threads', expect.objectContaining({ media_type: 'TEXT', text: 'Hello Threads!' }), expect.anything())
    expect(postMock).toHaveBeenNthCalledWith(2, '/user1/threads_publish', expect.objectContaining({ creation_id: 'c1' }), expect.anything())
    expect(result).toMatchObject({ id: 'p1', platform: 'threads' })
  })

  it('postImage — creates IMAGE container and publishes', async () => {
    const { postMock, getMock } = mockAxiosInstance()
    postMock.mockResolvedValueOnce({ data: { id: 'c2' } }).mockResolvedValueOnce({ data: { id: 'p2' } })
    getMock.mockResolvedValueOnce({ data: { status: 'FINISHED', id: 'c2' } })

    const result = await makeClient().postImage({ imageUrl: 'https://example.com/img.jpg', text: 'Caption' })
    expect(postMock).toHaveBeenNthCalledWith(1, '/user1/threads', expect.objectContaining({ media_type: 'IMAGE', image_url: 'https://example.com/img.jpg' }), expect.anything())
    expect(result.id).toBe('p2')
  })

  it('postCarousel — creates item containers then carousel', async () => {
    const { postMock, getMock } = mockAxiosInstance()
    postMock
      .mockResolvedValueOnce({ data: { id: 'i1' } })
      .mockResolvedValueOnce({ data: { id: 'i2' } })
      .mockResolvedValueOnce({ data: { id: 'cc' } })
      .mockResolvedValueOnce({ data: { id: 'pub' } })
    getMock.mockResolvedValueOnce({ data: { status: 'FINISHED', id: 'cc' } })

    const result = await makeClient().postCarousel({
      items: [{ type: 'IMAGE', imageUrl: 'https://a.com/1.jpg' }, { type: 'IMAGE', imageUrl: 'https://a.com/2.jpg' }],
      text: 'carousel',
    })

    expect(postMock).toHaveBeenNthCalledWith(3, '/user1/threads', expect.objectContaining({ media_type: 'CAROUSEL', children: ['i1', 'i2'] }), expect.anything())
    expect(result.id).toBe('pub')
  })

  it('throws ValidationError for empty text', async () => {
    mockAxiosInstance()
    await expect(makeClient().postText({ text: '' })).rejects.toThrow(ValidationError)
  })
})
