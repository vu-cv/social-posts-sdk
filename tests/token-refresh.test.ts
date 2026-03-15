import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'
import {
  refreshMetaToken,
  refreshTwitterToken,
  refreshLinkedInToken,
  refreshGoogleToken,
} from '../src/token-refresh/index.js'
import { AuthError } from '../src/errors/index.js'

vi.mock('axios')
const axiosMock = vi.mocked(axios)

beforeEach(() => vi.clearAllMocks())

describe('refreshMetaToken()', () => {
  it('exchanges short-lived token for long-lived token', async () => {
    const responseData = { access_token: 'long_lived_token', token_type: 'bearer', expires_in: 5184000 }
    axiosMock.get = vi.fn().mockResolvedValue({ data: responseData })

    const result = await refreshMetaToken({
      clientId: 'app_id',
      clientSecret: 'app_secret',
      shortLivedToken: 'short_token',
    })

    expect(axiosMock.get).toHaveBeenCalledWith(
      expect.stringContaining('oauth/access_token'),
      expect.objectContaining({
        params: expect.objectContaining({
          grant_type: 'fb_exchange_token',
          fb_exchange_token: 'short_token',
        }),
      }),
    )
    expect(result.access_token).toBe('long_lived_token')
  })

  it('throws AuthError on API failure', async () => {
    axiosMock.get = vi.fn().mockRejectedValue(
      Object.assign(new Error('Unauthorized'), {
        isAxiosError: true,
        response: { status: 401, data: { error: { message: 'Invalid credentials' } } },
      }),
    )
    axiosMock.isAxiosError = vi.fn().mockReturnValue(true)

    await expect(
      refreshMetaToken({ clientId: 'id', clientSecret: 'sec', shortLivedToken: 'bad' }),
    ).rejects.toThrow(AuthError)
  })
})

describe('refreshTwitterToken()', () => {
  it('uses refresh_token grant and Basic auth', async () => {
    const responseData = { access_token: 'new_access', refresh_token: 'new_refresh', token_type: 'bearer' }
    axiosMock.post = vi.fn().mockResolvedValue({ data: responseData })

    const result = await refreshTwitterToken({
      clientId: 'client_id',
      clientSecret: 'client_secret',
      refreshToken: 'old_refresh',
    })

    expect(axiosMock.post).toHaveBeenCalledWith(
      expect.stringContaining('oauth2/token'),
      expect.stringContaining('grant_type=refresh_token'),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: expect.stringContaining('Basic ') }),
      }),
    )
    expect(result.access_token).toBe('new_access')
  })
})

describe('refreshLinkedInToken()', () => {
  it('posts to LinkedIn token endpoint', async () => {
    const responseData = { access_token: 'li_access', expires_in: 5184000 }
    axiosMock.post = vi.fn().mockResolvedValue({ data: responseData })

    const result = await refreshLinkedInToken({
      clientId: 'li_client',
      clientSecret: 'li_secret',
      refreshToken: 'li_refresh',
    })

    expect(axiosMock.post).toHaveBeenCalledWith(
      expect.stringContaining('linkedin.com/oauth'),
      expect.stringContaining('grant_type=refresh_token'),
      expect.anything(),
    )
    expect(result.access_token).toBe('li_access')
  })
})

describe('refreshGoogleToken()', () => {
  it('posts to Google token endpoint', async () => {
    const responseData = { access_token: 'goog_access', expires_in: 3600, token_type: 'Bearer' }
    axiosMock.post = vi.fn().mockResolvedValue({ data: responseData })

    const result = await refreshGoogleToken({
      clientId: 'goog_client',
      clientSecret: 'goog_secret',
      refreshToken: 'goog_refresh',
    })

    expect(axiosMock.post).toHaveBeenCalledWith(
      expect.stringContaining('googleapis.com/token'),
      expect.stringContaining('grant_type=refresh_token'),
      expect.anything(),
    )
    expect(result.access_token).toBe('goog_access')
  })
})
