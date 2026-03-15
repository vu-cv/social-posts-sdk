import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'
import {
  getMetaAuthUrl,
  exchangeMetaCode,
  getTwitterAuthUrl,
  exchangeTwitterCode,
  getLinkedInAuthUrl,
  exchangeLinkedInCode,
  getGoogleAuthUrl,
  exchangeGoogleCode,
  getTikTokAuthUrl,
  getPinterestAuthUrl,
  getZaloAuthUrl,
} from '../src/oauth/index.js'

vi.mock('axios')
const axiosMock = vi.mocked(axios)

beforeEach(() => vi.clearAllMocks())

// ─── URL generators ──────────────────────────────────────────────────────────

describe('getMetaAuthUrl()', () => {
  it('includes client_id, redirect_uri, and scope', () => {
    const url = getMetaAuthUrl({
      clientId: 'app_123',
      redirectUri: 'https://myapp.com/callback',
      scopes: ['pages_manage_posts', 'instagram_content_publish'],
    })

    expect(url).toContain('facebook.com')
    expect(url).toContain('client_id=app_123')
    expect(url).toContain('pages_manage_posts')
    expect(url).toContain(encodeURIComponent('https://myapp.com/callback'))
  })

  it('includes state when provided', () => {
    const url = getMetaAuthUrl({
      clientId: 'app_123',
      redirectUri: 'https://myapp.com/callback',
      scopes: ['pages_manage_posts'],
      state: 'csrf_token',
    })
    expect(url).toContain('state=csrf_token')
  })
})

describe('getTwitterAuthUrl()', () => {
  it('returns url, codeVerifier, and codeChallenge', async () => {
    const result = await getTwitterAuthUrl({
      clientId: 'tw_client',
      redirectUri: 'https://myapp.com/callback',
      scopes: ['tweet.read', 'tweet.write'],
      state: 'tw_state',
    })

    expect(result.url).toContain('twitter.com')
    expect(result.url).toContain('code_challenge_method=S256')
    expect(result.codeVerifier).toBeTruthy()
    expect(result.codeChallenge).toBeTruthy()
    expect(result.codeVerifier).not.toBe(result.codeChallenge)
  })
})

describe('getLinkedInAuthUrl()', () => {
  it('builds correct LinkedIn auth URL', () => {
    const url = getLinkedInAuthUrl({
      clientId: 'li_app',
      redirectUri: 'https://myapp.com/li/callback',
      scopes: ['w_member_social'],
      state: 'li_state',
    })

    expect(url).toContain('linkedin.com/oauth')
    expect(url).toContain('client_id=li_app')
    expect(url).toContain('state=li_state')
  })
})

describe('getGoogleAuthUrl()', () => {
  it('includes access_type=offline by default', () => {
    const url = getGoogleAuthUrl({
      clientId: 'goog_client',
      redirectUri: 'https://myapp.com/callback',
      scopes: ['https://www.googleapis.com/auth/youtube.upload'],
    })

    expect(url).toContain('accounts.google.com')
    expect(url).toContain('access_type=offline')
    expect(url).toContain('prompt=consent')
  })

  it('respects explicit access_type=online', () => {
    const url = getGoogleAuthUrl({
      clientId: 'goog_client',
      redirectUri: 'https://myapp.com/callback',
      scopes: ['youtube.upload'],
      accessType: 'online',
    })
    expect(url).toContain('access_type=online')
  })
})

describe('getTikTokAuthUrl()', () => {
  it('builds TikTok auth URL', () => {
    const url = getTikTokAuthUrl({
      clientKey: 'tt_key',
      redirectUri: 'https://myapp.com/tt/callback',
      scopes: ['user.info.basic', 'video.publish'],
      state: 'tt_state',
    })

    expect(url).toContain('tiktok.com')
    expect(url).toContain('client_key=tt_key')
    expect(url).toContain('state=tt_state')
  })
})

describe('getPinterestAuthUrl()', () => {
  it('builds Pinterest auth URL', () => {
    const url = getPinterestAuthUrl({
      clientId: 'pin_client',
      redirectUri: 'https://myapp.com/pin/callback',
      scopes: ['pins:write', 'boards:read'],
      state: 'pin_state',
    })

    expect(url).toContain('pinterest.com/oauth')
    expect(url).toContain('client_id=pin_client')
  })
})

describe('getZaloAuthUrl()', () => {
  it('builds Zalo auth URL', () => {
    const url = getZaloAuthUrl({
      appId: 'zalo_app',
      redirectUri: 'https://myapp.com/zalo/callback',
    })

    expect(url).toContain('zaloapp.com')
    expect(url).toContain('app_id=zalo_app')
  })
})

// ─── Code exchange ───────────────────────────────────────────────────────────

describe('exchangeMetaCode()', () => {
  it('calls Graph API and returns token', async () => {
    axiosMock.get = vi.fn().mockResolvedValue({ data: { access_token: 'meta_tok', token_type: 'bearer' } })

    const result = await exchangeMetaCode({
      clientId: 'app_id',
      clientSecret: 'app_secret',
      redirectUri: 'https://myapp.com/callback',
      code: 'auth_code',
    })

    expect(result.access_token).toBe('meta_tok')
    expect(axiosMock.get).toHaveBeenCalledWith(
      expect.stringContaining('oauth/access_token'),
      expect.objectContaining({ params: expect.objectContaining({ code: 'auth_code' }) }),
    )
  })
})

describe('exchangeTwitterCode()', () => {
  it('posts with authorization_code grant', async () => {
    axiosMock.post = vi.fn().mockResolvedValue({
      data: { access_token: 'tw_tok', token_type: 'bearer', refresh_token: 'tw_refresh' },
    })

    const result = await exchangeTwitterCode({
      clientId: 'tw_client',
      clientSecret: 'tw_secret',
      redirectUri: 'https://myapp.com/callback',
      code: 'tw_code',
      codeVerifier: 'verifier_123',
    })

    expect(result.access_token).toBe('tw_tok')
    expect(axiosMock.post).toHaveBeenCalledWith(
      expect.stringContaining('oauth2/token'),
      expect.stringContaining('grant_type=authorization_code'),
      expect.anything(),
    )
  })
})

describe('exchangeLinkedInCode()', () => {
  it('posts to LinkedIn token endpoint', async () => {
    axiosMock.post = vi.fn().mockResolvedValue({
      data: { access_token: 'li_tok', expires_in: 5184000 },
    })

    const result = await exchangeLinkedInCode({
      clientId: 'li_client',
      clientSecret: 'li_secret',
      redirectUri: 'https://myapp.com/callback',
      code: 'li_code',
    })

    expect(result.access_token).toBe('li_tok')
  })
})

describe('exchangeGoogleCode()', () => {
  it('posts to Google token endpoint', async () => {
    axiosMock.post = vi.fn().mockResolvedValue({
      data: { access_token: 'goog_tok', expires_in: 3600, token_type: 'Bearer' },
    })

    const result = await exchangeGoogleCode({
      clientId: 'goog_client',
      clientSecret: 'goog_secret',
      redirectUri: 'https://myapp.com/callback',
      code: 'goog_code',
    })

    expect(result.access_token).toBe('goog_tok')
  })
})
