import { isAxiosError } from 'axios'
import { SocialSDKError, RateLimitError, AuthError, ValidationError } from '../errors/index.js'

export interface RetryConfig {
  /** Max total attempts (including the first). Default: 3 */
  maxAttempts?: number
  /** Base delay in ms before the first retry. Default: 1000 */
  initialDelayMs?: number
  /** Hard cap on delay in ms. Default: 30_000 */
  maxDelayMs?: number
  /** Exponential factor. Default: 2 */
  factor?: number
}

function shouldRetry(error: unknown): boolean {
  if (error instanceof ValidationError) return false
  if (error instanceof AuthError) return false
  if (error instanceof RateLimitError) return true
  if (error instanceof SocialSDKError) return error.code >= 500
  if (isAxiosError(error)) return !error.response // network / timeout errors
  return false
}

function calcDelay(attempt: number, cfg: Required<RetryConfig>): number {
  const base = Math.min(cfg.initialDelayMs * Math.pow(cfg.factor, attempt), cfg.maxDelayMs)
  const jitter = Math.random() * base * 0.15
  return base + jitter
}

export async function withRetry<T>(fn: () => Promise<T>, config: RetryConfig): Promise<T> {
  const cfg: Required<RetryConfig> = {
    maxAttempts: config.maxAttempts ?? 3,
    initialDelayMs: config.initialDelayMs ?? 1000,
    maxDelayMs: config.maxDelayMs ?? 30_000,
    factor: config.factor ?? 2,
  }

  let lastError: unknown
  for (let attempt = 0; attempt < cfg.maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      if (attempt === cfg.maxAttempts - 1 || !shouldRetry(error)) throw error
      await new Promise<void>((r) => setTimeout(r, calcDelay(attempt, cfg)))
    }
  }
  throw lastError
}
