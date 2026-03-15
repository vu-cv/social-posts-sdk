import axios from 'axios'
import { AuthError } from '../errors/index.js'

// ─── Meta (Facebook / Instagram / Threads) ───────────────────────────────────

/**
 * Build the URL to redirect users to for Meta OAuth login.
 * @see https://developers.facebook.com/docs/facebook-login/guides/advanced/manual-flow
 */
export function getMetaAuthUrl(opts: {
  clientId: string
  redirectUri: string
  scopes: string[]
  state?: string
}): string {
  const params = new URLSearchParams({
    client_id: opts.clientId,
    redirect_uri: opts.redirectUri,
    scope: opts.scopes.join(','),
    response_type: 'code',
  })
  if (opts.state) params.set('state', opts.state)
  return `https://www.facebook.com/v22.0/dialog/oauth?${params.toString()}`
}

export interface MetaCodeExchangeResponse {
  access_token: string
  token_type: string
  expires_in?: number
}

/**
 * Exchange a Meta authorization code for an access token.
 */
export async function exchangeMetaCode(opts: {
  clientId: string
  clientSecret: string
  redirectUri: string
  code: string
}): Promise<MetaCodeExchangeResponse> {
  const resp = await axios
    .get<MetaCodeExchangeResponse>('https://graph.facebook.com/v22.0/oauth/access_token', {
      params: {
        client_id: opts.clientId,
        client_secret: opts.clientSecret,
        redirect_uri: opts.redirectUri,
        code: opts.code,
      },
    })
    .catch((err: unknown) => {
      if (axios.isAxiosError(err)) {
        const msg =
          (err.response?.data as { error?: { message?: string } })?.error?.message ??
          `HTTP ${err.response?.status}`
        throw new AuthError(msg, 'facebook', err.response?.status ?? 0)
      }
      throw err
    })
  return resp.data
}

// ─── Twitter / X ─────────────────────────────────────────────────────────────

/**
 * Build the Twitter OAuth 2.0 authorization URL (PKCE flow).
 * Store `codeVerifier` securely — you'll need it to exchange the code.
 * @see https://developer.twitter.com/en/docs/authentication/oauth-2-0/authorization-code
 */
export async function getTwitterAuthUrl(opts: {
  clientId: string
  redirectUri: string
  scopes: string[]
  state: string
}): Promise<{ url: string; codeVerifier: string; codeChallenge: string }> {
  const { randomBytes, createHash } = await import('node:crypto')
  const codeVerifier = randomBytes(32).toString('base64url')
  const codeChallenge = createHash('sha256').update(codeVerifier).digest('base64url')

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: opts.clientId,
    redirect_uri: opts.redirectUri,
    scope: opts.scopes.join(' '),
    state: opts.state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  })
  return {
    url: `https://twitter.com/i/oauth2/authorize?${params.toString()}`,
    codeVerifier,
    codeChallenge,
  }
}

export interface TwitterCodeExchangeResponse {
  access_token: string
  token_type: string
  expires_in?: number
  scope?: string
  refresh_token?: string
}

/**
 * Exchange a Twitter OAuth 2.0 authorization code for tokens.
 */
export async function exchangeTwitterCode(opts: {
  clientId: string
  clientSecret: string
  redirectUri: string
  code: string
  codeVerifier: string
}): Promise<TwitterCodeExchangeResponse> {
  const credentials = Buffer.from(`${opts.clientId}:${opts.clientSecret}`).toString('base64')
  const resp = await axios
    .post<TwitterCodeExchangeResponse>(
      'https://api.twitter.com/2/oauth2/token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code: opts.code,
        redirect_uri: opts.redirectUri,
        code_verifier: opts.codeVerifier,
      }).toString(),
      {
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    )
    .catch((err: unknown) => {
      if (axios.isAxiosError(err)) {
        const b = err.response?.data as { error_description?: string; error?: string }
        throw new AuthError(b?.error_description ?? b?.error ?? `HTTP ${err.response?.status}`, 'twitter', err.response?.status ?? 0)
      }
      throw err
    })
  return resp.data
}

// ─── LinkedIn ────────────────────────────────────────────────────────────────

/**
 * Build the LinkedIn OAuth 2.0 authorization URL.
 * @see https://learn.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow
 */
export function getLinkedInAuthUrl(opts: {
  clientId: string
  redirectUri: string
  scopes: string[]
  state: string
}): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: opts.clientId,
    redirect_uri: opts.redirectUri,
    scope: opts.scopes.join(' '),
    state: opts.state,
  })
  return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`
}

export interface LinkedInCodeExchangeResponse {
  access_token: string
  expires_in: number
  refresh_token?: string
  refresh_token_expires_in?: number
  scope?: string
}

/**
 * Exchange a LinkedIn authorization code for an access token.
 */
export async function exchangeLinkedInCode(opts: {
  clientId: string
  clientSecret: string
  redirectUri: string
  code: string
}): Promise<LinkedInCodeExchangeResponse> {
  const resp = await axios
    .post<LinkedInCodeExchangeResponse>(
      'https://www.linkedin.com/oauth/v2/accessToken',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code: opts.code,
        redirect_uri: opts.redirectUri,
        client_id: opts.clientId,
        client_secret: opts.clientSecret,
      }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    )
    .catch((err: unknown) => {
      if (axios.isAxiosError(err)) {
        const b = err.response?.data as { error_description?: string; error?: string }
        throw new AuthError(b?.error_description ?? b?.error ?? `HTTP ${err.response?.status}`, 'linkedin', err.response?.status ?? 0)
      }
      throw err
    })
  return resp.data
}

// ─── Google (YouTube) ─────────────────────────────────────────────────────────

/**
 * Build the Google OAuth 2.0 authorization URL.
 * Use `access_type: 'offline'` to get a refresh token.
 * @see https://developers.google.com/identity/protocols/oauth2/web-server
 */
export function getGoogleAuthUrl(opts: {
  clientId: string
  redirectUri: string
  scopes: string[]
  state?: string
  accessType?: 'online' | 'offline'
}): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: opts.clientId,
    redirect_uri: opts.redirectUri,
    scope: opts.scopes.join(' '),
    access_type: opts.accessType ?? 'offline',
    prompt: 'consent',
  })
  if (opts.state) params.set('state', opts.state)
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

export interface GoogleCodeExchangeResponse {
  access_token: string
  expires_in: number
  token_type: string
  scope?: string
  refresh_token?: string
}

/**
 * Exchange a Google authorization code for tokens.
 */
export async function exchangeGoogleCode(opts: {
  clientId: string
  clientSecret: string
  redirectUri: string
  code: string
}): Promise<GoogleCodeExchangeResponse> {
  const resp = await axios
    .post<GoogleCodeExchangeResponse>(
      'https://oauth2.googleapis.com/token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code: opts.code,
        redirect_uri: opts.redirectUri,
        client_id: opts.clientId,
        client_secret: opts.clientSecret,
      }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    )
    .catch((err: unknown) => {
      if (axios.isAxiosError(err)) {
        const b = err.response?.data as { error_description?: string; error?: string }
        throw new AuthError(b?.error_description ?? b?.error ?? `HTTP ${err.response?.status}`, 'youtube', err.response?.status ?? 0)
      }
      throw err
    })
  return resp.data
}

// ─── TikTok ──────────────────────────────────────────────────────────────────

/**
 * Build the TikTok OAuth 2.0 authorization URL.
 * @see https://developers.tiktok.com/doc/oauth-user-access-token-management
 */
export function getTikTokAuthUrl(opts: {
  clientKey: string
  redirectUri: string
  scopes: string[]
  state: string
}): string {
  const params = new URLSearchParams({
    client_key: opts.clientKey,
    redirect_uri: opts.redirectUri,
    scope: opts.scopes.join(','),
    state: opts.state,
    response_type: 'code',
  })
  return `https://www.tiktok.com/v2/auth/authorize/?${params.toString()}`
}

export interface TikTokCodeExchangeResponse {
  access_token: string
  expires_in: number
  open_id: string
  refresh_expires_in: number
  refresh_token: string
  scope: string
  token_type: string
}

/**
 * Exchange a TikTok authorization code for tokens.
 */
export async function exchangeTikTokCode(opts: {
  clientKey: string
  clientSecret: string
  redirectUri: string
  code: string
}): Promise<TikTokCodeExchangeResponse> {
  const resp = await axios
    .post<{ data: TikTokCodeExchangeResponse; error: { code: string; message: string } }>(
      'https://open.tiktokapis.com/v2/oauth/token/',
      new URLSearchParams({
        grant_type: 'authorization_code',
        client_key: opts.clientKey,
        client_secret: opts.clientSecret,
        redirect_uri: opts.redirectUri,
        code: opts.code,
      }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    )
    .catch((err: unknown) => {
      if (axios.isAxiosError(err)) {
        throw new AuthError(`HTTP ${err.response?.status}`, 'tiktok', err.response?.status ?? 0)
      }
      throw err
    })

  if (resp.data.error?.code && resp.data.error.code !== 'ok') {
    throw new AuthError(resp.data.error.message, 'tiktok', 0)
  }
  return resp.data.data
}

// ─── Pinterest ────────────────────────────────────────────────────────────────

/**
 * Build the Pinterest OAuth 2.0 authorization URL.
 * @see https://developers.pinterest.com/docs/getting-started/authentication/
 */
export function getPinterestAuthUrl(opts: {
  clientId: string
  redirectUri: string
  scopes: string[]
  state: string
}): string {
  const params = new URLSearchParams({
    client_id: opts.clientId,
    redirect_uri: opts.redirectUri,
    scope: opts.scopes.join(','),
    state: opts.state,
    response_type: 'code',
  })
  return `https://www.pinterest.com/oauth/?${params.toString()}`
}

export interface PinterestCodeExchangeResponse {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token?: string
  refresh_token_expires_in?: number
  scope?: string
}

/**
 * Exchange a Pinterest authorization code for tokens.
 */
export async function exchangePinterestCode(opts: {
  clientId: string
  clientSecret: string
  redirectUri: string
  code: string
}): Promise<PinterestCodeExchangeResponse> {
  const credentials = Buffer.from(`${opts.clientId}:${opts.clientSecret}`).toString('base64')
  const resp = await axios
    .post<PinterestCodeExchangeResponse>(
      'https://api.pinterest.com/v5/oauth/token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code: opts.code,
        redirect_uri: opts.redirectUri,
      }).toString(),
      {
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    )
    .catch((err: unknown) => {
      if (axios.isAxiosError(err)) {
        const b = err.response?.data as { error?: string; error_description?: string }
        throw new AuthError(b?.error_description ?? b?.error ?? `HTTP ${err.response?.status}`, 'pinterest', err.response?.status ?? 0)
      }
      throw err
    })
  return resp.data
}

// ─── Zalo ─────────────────────────────────────────────────────────────────────

/**
 * Build the Zalo OAuth 2.0 authorization URL.
 * @see https://developers.zalo.me/docs/api/official-account-api/xac-thuc-va-uy-quyen/yeu-cau-cap-quyen-truy-cap-v2-post-4307
 */
export function getZaloAuthUrl(opts: {
  appId: string
  redirectUri: string
  state?: string
}): string {
  const params = new URLSearchParams({
    app_id: opts.appId,
    redirect_uri: opts.redirectUri,
  })
  if (opts.state) params.set('state', opts.state)
  return `https://oauth.zaloapp.com/v4/permission?${params.toString()}`
}

export interface ZaloCodeExchangeResponse {
  access_token: string
  refresh_token: string
  expires_in: string
}

/**
 * Exchange a Zalo authorization code for tokens.
 */
export async function exchangeZaloCode(opts: {
  appId: string
  appSecret: string
  code: string
}): Promise<ZaloCodeExchangeResponse> {
  const resp = await axios
    .post<ZaloCodeExchangeResponse>(
      'https://oauth.zaloapp.com/v4/oa/access_token',
      new URLSearchParams({
        app_id: opts.appId,
        app_secret: opts.appSecret,
        code: opts.code,
        grant_type: 'authorization_code',
      }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    )
    .catch((err: unknown) => {
      if (axios.isAxiosError(err)) {
        throw new AuthError(`HTTP ${err.response?.status}`, 'zalo', err.response?.status ?? 0)
      }
      throw err
    })
  return resp.data
}
