import axios, { isAxiosError, type AxiosInstance, type AxiosResponse } from 'axios'
import { createGraphError, type Platform } from '../errors/index.js'

interface GraphErrorBody {
  error?: {
    message?: string
    code?: number
    error_subcode?: number
    type?: string
  }
}

export class HttpClient {
  readonly #client: AxiosInstance
  readonly #platform: Platform

  constructor(baseUrl: string, accessToken: string, platform: Platform) {
    this.#platform = platform
    this.#client = axios.create({
      baseURL: baseUrl.replace(/\/$/, ''),
      params: { access_token: accessToken },
    })

    // Normalize Graph API errors into our typed error classes
    this.#client.interceptors.response.use(
      (response: AxiosResponse) => {
        // The Graph API sometimes returns 200 with an `error` field
        const body = response.data as GraphErrorBody
        if (body.error) {
          const code = body.error.code ?? 0
          const message = body.error.message ?? 'Unknown Graph API error'
          throw createGraphError(this.#platform, code, message, body)
        }
        return response
      },
      (rawError: unknown) => {
        if (isAxiosError(rawError) && rawError.response) {
          const body = rawError.response.data as GraphErrorBody
          const code = body.error?.code ?? rawError.response.status
          const message = body.error?.message ?? `HTTP ${rawError.response.status}`
          throw createGraphError(this.#platform, code, message, body)
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
}
