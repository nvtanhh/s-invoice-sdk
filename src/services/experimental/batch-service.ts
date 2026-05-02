import { z } from 'zod'
import { CreateInvoiceWSDTOSchema } from '../../schemas/index.js'
import type { CreateMultiInvoiceResp } from '../../types/index.js'
import { ViettelValidationError } from '../../http/errors.js'
import { HttpClient } from '../../http/http-client.js'
import { API_PATH_PREFIX } from '../../http/paths.js'

// Path inferred — confirm against sandbox before promoting to stable
const PATH_BATCH = `${API_PATH_PREFIX}/InvoiceAPI/InvoiceWS/createMultiInvoice`

const BatchInputSchema = z.object({
  taxCode: z.string(),
  invoiceList: z.array(CreateInvoiceWSDTOSchema).min(1)
})

export class BatchService {
  constructor(
    private readonly http: HttpClient,
    private readonly taxCode: string
  ) {}

  /**
   * @experimental Create multiple invoices in a single request.
   * Path inferred from Java DTO — confirm against sandbox before use.
   */
  async createMultiInvoice(invoices: unknown[]): Promise<CreateMultiInvoiceResp> {
    const parsed = BatchInputSchema.safeParse({ taxCode: this.taxCode, invoiceList: invoices })
    if (!parsed.success) {
      throw new ViettelValidationError(
        parsed.error.issues.map(i => ({ path: i.path.join('.'), message: i.message }))
      )
    }
    return this.http.postJson<CreateMultiInvoiceResp>(PATH_BATCH, parsed.data)
  }
}
