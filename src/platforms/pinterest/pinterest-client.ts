import { HttpClient, bearerErrorParser } from '../../http/http-client.js'
import { ValidationError } from '../../errors/index.js'
import type { PostResult } from '../../types/index.js'
import type { PinterestConfig } from '../../types/index.js'
import {
  PinterestCreatePinInputSchema,
  type PinterestCreatePinInput,
  type PinterestPinResponse,
} from './pinterest.types.js'

export class PinterestClient {
  readonly #http: HttpClient

  constructor(config: PinterestConfig) {
    this.#http = new HttpClient({
      baseUrl: 'https://api.pinterest.com/v5',
      platform: 'pinterest',
      headers: { Authorization: `Bearer ${config.accessToken}` },
      parseError: bearerErrorParser,
    })
  }

  /** Create a pin on a board. */
  async createPin(input: PinterestCreatePinInput): Promise<PostResult> {
    const parsed = PinterestCreatePinInputSchema.safeParse(input)
    if (!parsed.success) throw new ValidationError('Invalid input for createPin', parsed.error.errors.map(e => e.message))

    const { boardId, imageUrl, title, description, link, altText, boardSectionId } = parsed.data

    const body: Record<string, unknown> = {
      board_id: boardId,
      media_source: { source_type: 'image_url', url: imageUrl },
    }
    if (title) body['title'] = title
    if (description) body['description'] = description
    if (link) body['link'] = link
    if (altText) body['alt_text'] = altText
    if (boardSectionId) body['board_section_id'] = boardSectionId

    const response = await this.#http.post<PinterestPinResponse>('/pins', body)
    return { id: response.id, platform: 'pinterest', createdAt: new Date().toISOString() }
  }
}
