import { SearchByTransUUIDDTOSchema } from '../schemas/index.js'
import type { SearchUUIDResp } from '../types/index.js'
import { ViettelValidationError } from '../http/errors.js'
import { HttpClient } from '../http/http-client.js'
import { PATH_SEARCH_BY_UUID } from '../http/paths.js'

export class SearchService {
  constructor(private readonly http: HttpClient) {}

  async searchByTransactionUuid(payload: unknown): Promise<SearchUUIDResp> {
    const parsed = SearchByTransUUIDDTOSchema.safeParse(payload)
    if (!parsed.success) {
      throw new ViettelValidationError(
        parsed.error.issues.map(i => ({ path: i.path.join('.'), message: i.message }))
      )
    }
    return this.http.postForm<SearchUUIDResp>(PATH_SEARCH_BY_UUID, parsed.data as Record<string, unknown>)
  }
}
