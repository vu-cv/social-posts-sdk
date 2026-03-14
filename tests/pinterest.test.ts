import { describe, it, expect, vi, beforeEach, type MockInstance } from 'vitest'
import axios from 'axios'
import { PinterestClient } from '../src/platforms/pinterest/pinterest-client.js'
import { ValidationError } from '../src/errors/index.js'

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
  return new PinterestClient({ accessToken: 'pin_token' })
}

describe('PinterestClient', () => {
  beforeEach(() => vi.clearAllMocks())

  it('createPin — posts to /pins with image_url source', async () => {
    const { postMock } = mockAxiosInstance()
    postMock.mockResolvedValueOnce({
      data: { id: 'pin1', link: null, title: 'My Pin', description: null, board_id: 'board1', media: { media_type: 'image' } },
    })

    const result = await makeClient().createPin({
      boardId: 'board1',
      imageUrl: 'https://example.com/img.jpg',
      title: 'My Pin',
      link: 'https://example.com',
    })

    expect(postMock).toHaveBeenCalledWith(
      '/pins',
      expect.objectContaining({
        board_id: 'board1',
        media_source: expect.objectContaining({ source_type: 'image_url', url: 'https://example.com/img.jpg' }),
      }),
      expect.anything(),
    )
    expect(result).toMatchObject({ id: 'pin1', platform: 'pinterest' })
  })

  it('throws ValidationError when imageUrl is missing', async () => {
    mockAxiosInstance()
    await expect(makeClient().createPin({ boardId: 'board1' } as never)).rejects.toThrow(ValidationError)
  })
})
