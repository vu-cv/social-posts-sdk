import { describe, it, expect, vi, beforeEach, type MockInstance } from 'vitest'
import axios from 'axios'
import { LinkedInClient } from '../src/platforms/linkedin/linkedin-client.js'
import { ValidationError } from '../src/errors/index.js'

vi.mock('axios', async (importOriginal) => {
  const actual = await importOriginal<typeof import('axios')>()
  return { ...actual, default: { ...actual.default, create: vi.fn(), get: vi.fn(), put: vi.fn() } }
})

function mockAxiosInstance() {
  const postMock = vi.fn()
  const instance = { post: postMock, interceptors: { response: { use: vi.fn() } } }
  ;(axios.create as unknown as MockInstance).mockReturnValue(instance)
  return { postMock }
}

function makeClient() {
  return new LinkedInClient({ accessToken: 'li_token' })
}

const AUTHOR = 'urn:li:organization:12345'

describe('LinkedInClient', () => {
  beforeEach(() => vi.clearAllMocks())

  it('postText — calls POST /ugcPosts with NONE shareMediaCategory', async () => {
    const { postMock } = mockAxiosInstance()
    postMock.mockResolvedValueOnce({ data: { id: 'urn:li:ugcPost:1' } })

    const result = await makeClient().postText({ text: 'Hello LinkedIn!', authorUrn: AUTHOR })

    expect(postMock).toHaveBeenCalledWith(
      '/ugcPosts',
      expect.objectContaining({ author: AUTHOR, lifecycleState: 'PUBLISHED' }),
      expect.anything(),
    )
    expect(result).toMatchObject({ id: 'urn:li:ugcPost:1', platform: 'linkedin' })
  })

  it('postImage — registers asset then posts ugcPost', async () => {
    const { postMock } = mockAxiosInstance()
    postMock
      .mockResolvedValueOnce({
        data: {
          value: {
            asset: 'urn:li:digitalmediaAsset:abc',
            uploadMechanism: {
              'com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest': { uploadUrl: 'https://upload.li.com/abc' },
            },
          },
        },
      })
      .mockResolvedValueOnce({ data: { id: 'urn:li:ugcPost:2' } })

    ;(axios.get as unknown as MockInstance).mockResolvedValueOnce({ data: Buffer.from('img'), headers: { 'content-type': 'image/jpeg' } })
    ;(axios.put as unknown as MockInstance).mockResolvedValueOnce({ data: {} })

    const result = await makeClient().postImage({ imageUrl: 'https://example.com/img.jpg', authorUrn: AUTHOR })
    expect(result).toMatchObject({ platform: 'linkedin' })
  })

  it('throws ValidationError for empty text', async () => {
    mockAxiosInstance()
    await expect(makeClient().postText({ text: '', authorUrn: AUTHOR })).rejects.toThrow(ValidationError)
  })
})
