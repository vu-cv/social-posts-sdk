import { describe, it, expect, vi, beforeEach, type MockInstance } from 'vitest'
import axios from 'axios'
import { TwitterClient } from '../src/platforms/twitter/twitter-client.js'
import { SocialSDKError, ValidationError } from '../src/errors/index.js'

vi.mock('axios', async (importOriginal) => {
  const actual = await importOriginal<typeof import('axios')>()
  return { ...actual, default: { ...actual.default, create: vi.fn(), get: vi.fn(), post: vi.fn() } }
})

function mockAxiosInstance() {
  const postMock = vi.fn()
  const instance = { post: postMock, interceptors: { response: { use: vi.fn() } } }
  ;(axios.create as unknown as MockInstance).mockReturnValue(instance)
  return { postMock }
}

function makeClient() {
  return new TwitterClient({ accessToken: 'oauth2_token' })
}

describe('TwitterClient', () => {
  beforeEach(() => vi.clearAllMocks())

  it('postText — calls POST /tweets with text', async () => {
    const { postMock } = mockAxiosInstance()
    postMock.mockResolvedValueOnce({ data: { data: { id: 'tweet1', text: 'Hello!' } } })

    const result = await makeClient().postText({ text: 'Hello Twitter!' })

    expect(postMock).toHaveBeenCalledWith('/tweets', expect.objectContaining({ text: 'Hello Twitter!' }), expect.anything())
    expect(result).toMatchObject({ id: 'tweet1', platform: 'twitter' })
  })

  it('postText — includes reply_to when replyToTweetId provided', async () => {
    const { postMock } = mockAxiosInstance()
    postMock.mockResolvedValueOnce({ data: { data: { id: 'reply1', text: 'Reply' } } })

    await makeClient().postText({ text: 'Reply!', replyToTweetId: 'orig123' })

    expect(postMock).toHaveBeenCalledWith('/tweets', expect.objectContaining({ reply: { in_reply_to_tweet_id: 'orig123' } }), expect.anything())
  })

  it('throws ValidationError for text over 280 chars', async () => {
    mockAxiosInstance()
    await expect(makeClient().postText({ text: 'x'.repeat(281) })).rejects.toThrow(ValidationError)
  })

  it('postImages — throws SocialSDKError when oauth1 not configured', async () => {
    mockAxiosInstance()
    await expect(makeClient().postImages({ imageUrls: ['https://example.com/img.jpg'] })).rejects.toThrow(SocialSDKError)
  })
})
