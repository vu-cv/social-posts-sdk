export type Platform = 'facebook' | 'instagram'

export class SocialSDKError extends Error {
  readonly platform: Platform
  readonly code: number
  readonly rawError?: unknown

  constructor(message: string, platform: Platform, code: number, rawError?: unknown) {
    super(message)
    this.name = 'SocialSDKError'
    this.platform = platform
    this.code = code
    this.rawError = rawError
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

/** Thrown when the access token is invalid or expired (Graph API error codes 190, 102) */
export class AuthError extends SocialSDKError {
  constructor(message: string, platform: Platform, code: number, rawError?: unknown) {
    super(message, platform, code, rawError)
    this.name = 'AuthError'
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

/** Thrown when the Graph API rate limit is hit (error code 613, 32, 4) */
export class RateLimitError extends SocialSDKError {
  constructor(message: string, platform: Platform, code: number, rawError?: unknown) {
    super(message, platform, code, rawError)
    this.name = 'RateLimitError'
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

/** Thrown when input validation fails before sending a request */
export class ValidationError extends Error {
  readonly issues: string[]

  constructor(message: string, issues: string[]) {
    super(message)
    this.name = 'ValidationError'
    this.issues = issues
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

const AUTH_CODES = new Set([190, 102, 2500])
const RATE_LIMIT_CODES = new Set([613, 32, 4, 17])

export function createGraphError(platform: Platform, code: number, message: string, raw?: unknown): SocialSDKError {
  if (AUTH_CODES.has(code)) return new AuthError(message, platform, code, raw)
  if (RATE_LIMIT_CODES.has(code)) return new RateLimitError(message, platform, code, raw)
  return new SocialSDKError(message, platform, code, raw)
}
