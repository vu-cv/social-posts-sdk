import { describe, it, expect, vi } from 'vitest'
import { withRetry } from '../src/http/retry.js'
import { RateLimitError, AuthError, SocialSDKError, ValidationError } from '../src/errors/index.js'

describe('withRetry()', () => {
  it('returns result on first success', async () => {
    const fn = vi.fn().mockResolvedValue('ok')
    const result = await withRetry(fn, { maxAttempts: 3, initialDelayMs: 0 })
    expect(result).toBe('ok')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('retries on RateLimitError and succeeds', async () => {
    const err = new RateLimitError('rate limit', 'facebook', 429)
    const fn = vi.fn().mockRejectedValueOnce(err).mockResolvedValue('ok')
    const result = await withRetry(fn, { maxAttempts: 3, initialDelayMs: 0 })
    expect(result).toBe('ok')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('retries on SocialSDKError with code >= 500', async () => {
    const err = new SocialSDKError('server error', 'facebook', 503)
    const fn = vi.fn()
      .mockRejectedValueOnce(err)
      .mockRejectedValueOnce(err)
      .mockResolvedValue('recovered')
    const result = await withRetry(fn, { maxAttempts: 3, initialDelayMs: 0 })
    expect(result).toBe('recovered')
    expect(fn).toHaveBeenCalledTimes(3)
  })

  it('does not retry SocialSDKError with code < 500', async () => {
    const err = new SocialSDKError('not found', 'facebook', 404)
    const fn = vi.fn().mockRejectedValue(err)
    await expect(withRetry(fn, { maxAttempts: 3, initialDelayMs: 0 })).rejects.toThrow(SocialSDKError)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('does not retry AuthError', async () => {
    const err = new AuthError('invalid token', 'facebook', 401)
    const fn = vi.fn().mockRejectedValue(err)
    await expect(withRetry(fn, { maxAttempts: 3, initialDelayMs: 0 })).rejects.toThrow(AuthError)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('does not retry ValidationError', async () => {
    const err = new ValidationError('bad input', [])
    const fn = vi.fn().mockRejectedValue(err)
    await expect(withRetry(fn, { maxAttempts: 3, initialDelayMs: 0 })).rejects.toThrow(ValidationError)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('exhausts all attempts and rethrows last error', async () => {
    const err = new RateLimitError('rate limit', 'twitter', 429)
    const fn = vi.fn().mockRejectedValue(err)
    await expect(withRetry(fn, { maxAttempts: 3, initialDelayMs: 0 })).rejects.toThrow(RateLimitError)
    expect(fn).toHaveBeenCalledTimes(3)
  })

  it('respects maxAttempts: 1 (no retries)', async () => {
    const err = new RateLimitError('rate limit', 'twitter', 429)
    const fn = vi.fn().mockRejectedValue(err)
    await expect(withRetry(fn, { maxAttempts: 1, initialDelayMs: 0 })).rejects.toThrow(RateLimitError)
    expect(fn).toHaveBeenCalledTimes(1)
  })
})
