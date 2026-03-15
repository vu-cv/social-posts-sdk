import axios from 'axios'
import { AuthError } from '../errors/index.js'

// ─── Meta (Facebook / Instagram / Threads) ───────────────────────────────────

export interface MetaTokenResponse {
  access_token: string
  token_type: string
  /** Only present for long-lived tokens */
  expires_in?: number
}

/**
 * Exchange a short-lived Meta user access token for a long-lived one (60 days).
 * @see https://developers.facebook.com/docs/facebook-login/guides/access-tokens/get-long-lived
 */
export async function refreshMetaToken(opts: {
  clientId: string
  clientSecret: string
  /** Short-lived user access token obtained from login */
  shortLivedToken: string
}): Promise<MetaTokenResponse> {
  const resp = await axios
    .get<MetaTokenResponse>('https://graph.facebook.com/v22.0/oauth/access_token', {
      params: {
        grant_type: 'fb_exchange_token',
        client_id: opts.clientId,
        client_secret: opts.clientSecret,
        fb_exchange_token: opts.shortLivedToken,
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

/**
 * Extend a Page access token — it never expires when the user long-lived token is valid.
 * Alternatively this fetches a fresh permanent page token.
 */
export async function refreshMetaPageToken(opts: {
  pageId: string
  userLongLivedToken: string
}): Promise<{ access_token: string }> {
  const resp = await axios
    .get<{ access_token: string; id: string }>(
      `https://graph.facebook.com/v22.0/${opts.pageId}`,
      {
        params: {
          fields: 'access_token',
          access_token: opts.userLongLivedToken,
        },
      },
    )
    .catch((err: unknown) => {
      if (axios.isAxiosError(err)) {
        const msg =
          (err.response?.data as { error?: { message?: string } })?.error?.message ??
          `HTTP ${err.response?.status}`
        throw new AuthError(msg, 'facebook', err.response?.status ?? 0)
      }
      throw err
    })
  return { access_token: resp.data.access_token }
}

// ─── Twitter / X ─────────────────────────────────────────────────────────────

export interface TwitterTokenResponse {
  access_token: string
  refresh_token?: string
  expires_in?: number
  scope?: string
  token_type: string
}

/**
 * Refresh a Twitter OAuth 2.0 access token using a refresh token.
 * Requires a confidential OAuth 2.0 app (client_id + client_secret).
 * @see https://developer.twitter.com/en/docs/authentication/oauth-2-0/authorization-code
 */
export async function refreshTwitterToken(opts: {
  clientId: string
  clientSecret: string
  refreshToken: string
}): Promise<TwitterTokenResponse> {
  const credentials = Buffer.from(`${opts.clientId}:${opts.clientSecret}`).toString('base64')
  const resp = await axios
    .post<TwitterTokenResponse>(
      'https://api.twitter.com/2/oauth2/token',
      new URLSearchParams({ grant_type: 'refresh_token', refresh_token: opts.refreshToken }).toString(),
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
        throw new AuthError(b?.error_description ?? b?.error ?? `HTTP ${err.response?.status}`, 'twitter', err.response?.status ?? 0)
      }
      throw err
    })
  return resp.data
}

// ─── LinkedIn ────────────────────────────────────────────────────────────────

export interface LinkedInTokenResponse {
  access_token: string
  expires_in: number
  refresh_token?: string
  refresh_token_expires_in?: number
}

/**
 * Refresh a LinkedIn OAuth 2.0 access token.
 * Only works if `offline_access` scope was requested during the initial auth.
 * @see https://learn.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow
 */
export async function refreshLinkedInToken(opts: {
  clientId: string
  clientSecret: string
  refreshToken: string
}): Promise<LinkedInTokenResponse> {
  const resp = await axios
    .post<LinkedInTokenResponse>(
      'https://www.linkedin.com/oauth/v2/accessToken',
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: opts.refreshToken,
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

export interface GoogleTokenResponse {
  access_token: string
  expires_in: number
  token_type: string
  scope?: string
  refresh_token?: string
}

/**
 * Refresh a Google OAuth 2.0 access token (used for YouTube).
 * @see https://developers.google.com/identity/protocols/oauth2/web-server#offline
 */
export async function refreshGoogleToken(opts: {
  clientId: string
  clientSecret: string
  refreshToken: string
}): Promise<GoogleTokenResponse> {
  const resp = await axios
    .post<GoogleTokenResponse>(
      'https://oauth2.googleapis.com/token',
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: opts.refreshToken,
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

export interface TikTokTokenResponse {
  access_token: string
  expires_in: number
  open_id: string
  refresh_expires_in: number
  refresh_token: string
  scope: string
  token_type: string
}

/**
 * Refresh a TikTok OAuth 2.0 access token.
 * @see https://developers.tiktok.com/doc/oauth-user-access-token-management
 */
export async function refreshTikTokToken(opts: {
  clientKey: string
  clientSecret: string
  refreshToken: string
}): Promise<TikTokTokenResponse> {
  const resp = await axios
    .post<{ data: TikTokTokenResponse; error: { code: string; message: string } }>(
      'https://open.tiktokapis.com/v2/oauth/token/',
      new URLSearchParams({
        grant_type: 'refresh_token',
        client_key: opts.clientKey,
        client_secret: opts.clientSecret,
        refresh_token: opts.refreshToken,
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

export interface PinterestTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token?: string
  refresh_token_expires_in?: number
  scope?: string
}

/**
 * Refresh a Pinterest OAuth 2.0 access token.
 * @see https://developers.pinterest.com/docs/getting-started/authentication/
 */
export async function refreshPinterestToken(opts: {
  clientId: string
  clientSecret: string
  refreshToken: string
}): Promise<PinterestTokenResponse> {
  const credentials = Buffer.from(`${opts.clientId}:${opts.clientSecret}`).toString('base64')
  const resp = await axios
    .post<PinterestTokenResponse>(
      'https://api.pinterest.com/v5/oauth/token',
      new URLSearchParams({ grant_type: 'refresh_token', refresh_token: opts.refreshToken }).toString(),
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
