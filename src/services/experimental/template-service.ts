import { z } from 'zod'
import type { GetInvoiceTemplatesResp } from '../../types/index.js'
import { ViettelValidationError } from '../../http/errors.js'
import { HttpClient } from '../../http/http-client.js'
import { PATH_TEMPLATES } from '../../http/paths.js'

const GetTemplatesInputSchema = z.object({
  taxCode: z.string(),
  invoiceType: z.enum(['1', '2', '6'])
})

export class TemplateService {
  constructor(private readonly http: HttpClient) {}

  /**
   * @experimental Retrieve available invoice templates for a given invoice type.
   * Path verified against existing viettel-s-invoice TS package.
   */
  async getInvoiceTemplates(taxCode: string, invoiceType: string): Promise<GetInvoiceTemplatesResp> {
    const parsed = GetTemplatesInputSchema.safeParse({ taxCode, invoiceType })
    if (!parsed.success) {
      throw new ViettelValidationError(
        parsed.error.issues.map(i => ({ path: i.path.join('.'), message: i.message }))
      )
    }
    return this.http.postJson<GetInvoiceTemplatesResp>(PATH_TEMPLATES, parsed.data)
  }
}
