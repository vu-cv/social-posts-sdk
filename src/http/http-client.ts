import axios, { isAxiosError, type AxiosInstance, type AxiosResponse } from 'axios'
import { createGraphError, SocialSDKError, AuthError, RateLimitError, type Platform } from '../errors/index.js'

export type ErrorParser = (platform: Platform, status: number, body: unknown) => never

/** Error parser for Meta Graph API (Facebook, Instagram, Threads) */
export function graphErrorParser(platform: Platform, status: number, body: unknown): never {
  const b = body as { error?: { code?: number; message?: string } }
  const code = b.error?.code ?? status
  const message = b.error?.message ?? `HTTP ${status}`
  throw createGraphError(platform, code, message, body)
}

/** Generic error parser for OAuth 2.0 Bearer platforms */
export function bearerErrorParser(platform: Platform, status: number, body: unknown): never {
  const b = body as Record<string, unknown>
  const message =
    (b['message'] as string | undefined) ??
    (b['detail'] as string | undefined) ??
    (b['description'] as string | undefined) ??
    `HTTP ${status}`
  const code = (b['code'] as number | undefined) ?? status
  if (status === 401 || status === 403) throw new AuthError(message, platform, code, body)
  if (status === 429) throw new RateLimitError(message, platform, code, body)
  throw new SocialSDKError(message, platform, code, body)
}

export interface HttpClientConfig {
  baseUrl: string
  platform: Platform
  /** Static headers on every request (e.g. Authorization: Bearer) */
  headers?: Record<string, string>
  /** Static query params on every request (e.g. access_token for Graph API) */
  defaultParams?: Record<string, string>
  /** Called when a non-2xx response is received */
  parseError?: ErrorParser
  /**
   * If true, also inspects 2xx responses for a `body.error` field and throws.
   * Used by Meta Graph API platforms.
   */
  checkGraphApiErrors?: boolean
}

export class HttpClient {
  readonly #client: AxiosInstance
  readonly #platform: Platform
  readonly #parseError: ErrorParser
  readonly #checkGraphApiErrors: boolean

  constructor(config: HttpClientConfig) {
    this.#platform = config.platform
    this.#parseError = config.parseError ?? bearerErrorParser
    this.#checkGraphApiErrors = config.checkGraphApiErrors ?? false

    this.#client = axios.create({
      baseURL: config.baseUrl.replace(/\/$/, ''),
      ...(config.headers !== undefined && { headers: config.headers }),
      ...(config.defaultParams !== undefined && { params: config.defaultParams }),
    })

    this.#client.interceptors.response.use(
      (response: AxiosResponse) => {
        if (this.#checkGraphApiErrors) {
          const body = response.data as { error?: unknown }
          if (body.error) {
            this.#parseError(this.#platform, response.status, body)
          }
        }
        return response
      },
      (rawError: unknown) => {
        if (isAxiosError(rawError) && rawError.response) {
          this.#parseError(this.#platform, rawError.response.status, rawError.response.data)
        }
        throw rawError
      },
    )
  }

  async get<T>(path: string, params?: Record<string, string | number | boolean>): Promise<T> {
    const response = await this.#client.get<T>(path, { params })
    return response.data
  }

  async post<T>(path: string, body: Record<string, unknown> | FormData, params?: Record<string, string | number | boolean>): Promise<T> {
    const response = await this.#client.post<T>(path, body, { params })
    return response.data
  }

  async put<R>(url: string, body: unknown, headers?: Record<string, string>): Promise<R> {
    const response = await axios.put<R>(url, body, {
      ...(headers !== undefined && { headers }),
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    })
    return response.data
  }

  async delete<T>(path: string): Promise<T> {
    const response = await this.#client.delete<T>(path)
    return response.data
  }
}
