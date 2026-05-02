import { CreateInvoiceWSDTOSchema } from '../schemas/index.js'
import type { CreateInvoiceResp } from '../types/index.js'
import { ViettelValidationError } from '../http/errors.js'
import { HttpClient } from '../http/http-client.js'
import { PATH_CREATE_INVOICE } from '../http/paths.js'

export class InvoiceService {
  constructor(
    private readonly http: HttpClient,
    private readonly taxCode: string
  ) {}

  async createInvoice(dto: unknown): Promise<CreateInvoiceResp> {
    const parsed = CreateInvoiceWSDTOSchema.safeParse(dto)
    if (!parsed.success) {
      throw new ViettelValidationError(
        parsed.error.issues.map(i => ({ path: i.path.join('.'), message: i.message }))
      )
    }
    return this.http.postJson<CreateInvoiceResp>(PATH_CREATE_INVOICE(this.taxCode), parsed.data)
  }
}
