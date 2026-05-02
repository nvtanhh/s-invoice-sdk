import { z } from 'zod'
import type { GetInvoiceFilePortalResp } from '../../types/index.js'
import { ViettelValidationError } from '../../http/errors.js'
import { HttpClient } from '../../http/http-client.js'
import { PATH_FILE } from '../../http/paths.js'

const GetInvoiceFileInputSchema = z.object({
  supplierTaxCode: z.string(),
  invoiceNo: z.string(),
  templateCode: z.string(),
  fileType: z.enum(['PDF', 'ZIP'])
})

export class FileService {
  constructor(private readonly http: HttpClient) {}

  /**
   * @experimental Retrieve the PDF or ZIP representation of an invoice.
   * Returns fileBytes as base64 string.
   * Path verified against existing viettel-s-invoice TS package.
   */
  async getInvoiceFile(input: unknown): Promise<GetInvoiceFilePortalResp> {
    const parsed = GetInvoiceFileInputSchema.safeParse(input)
    if (!parsed.success) {
      throw new ViettelValidationError(
        parsed.error.issues.map(i => ({ path: i.path.join('.'), message: i.message }))
      )
    }
    return this.http.postJson<GetInvoiceFilePortalResp>(PATH_FILE, parsed.data)
  }
}
