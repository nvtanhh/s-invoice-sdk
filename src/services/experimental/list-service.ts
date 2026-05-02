import { GetInvoiceInputSchema } from '../../schemas/index.js'
import type { InvoiceSearch } from '../../types/index.js'
import { ViettelValidationError } from '../../http/errors.js'
import { HttpClient } from '../../http/http-client.js'
import { PATH_LIST } from '../../http/paths.js'

export class ListService {
  constructor(private readonly http: HttpClient) {}

  /**
   * @experimental Retrieve invoices within a date range.
   * fromDate/toDate must be 'dd/MM/yyyy' — the only endpoint using string dates.
   * Path verified against existing viettel-s-invoice TS package.
   */
  async listInvoices(input: unknown): Promise<InvoiceSearch> {
    const parsed = GetInvoiceInputSchema.safeParse(input)
    if (!parsed.success) {
      throw new ViettelValidationError(
        parsed.error.issues.map(i => ({ path: i.path.join('.'), message: i.message }))
      )
    }
    return this.http.postJson<InvoiceSearch>(PATH_LIST, parsed.data)
  }
}
