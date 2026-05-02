import { CancelTransactionWSDTOSchema } from '../schemas/index.js'
import type { CancelInvoiceResp } from '../types/index.js'
import { ViettelValidationError } from '../http/errors.js'
import { HttpClient } from '../http/http-client.js'
import { PATH_CANCEL } from '../http/paths.js'

export class CancelService {
  constructor(private readonly http: HttpClient) {}

  async cancelInvoice(payload: unknown): Promise<CancelInvoiceResp> {
    const parsed = CancelTransactionWSDTOSchema.safeParse(payload)
    if (!parsed.success) {
      throw new ViettelValidationError(
        parsed.error.issues.map(i => ({ path: i.path.join('.'), message: i.message }))
      )
    }
    return this.http.postForm<CancelInvoiceResp>(PATH_CANCEL, parsed.data as Record<string, unknown>)
  }
}
