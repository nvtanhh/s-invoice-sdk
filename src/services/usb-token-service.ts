import { CreateInvoiceWSDTOSchema } from '../schemas/index.js'
import type { HashResultResp, AfterSignResp, AfterSignInvoiceUSBInput } from '../types/index.js'
import { ViettelValidationError } from '../http/errors.js'
import { HttpClient } from '../http/http-client.js'
import { PATH_USB_HASH } from '../http/paths.js'

export class UsbTokenService {
  constructor(
    private readonly http: HttpClient,
    private readonly taxCode: string
  ) {}

  async getHash(dto: unknown): Promise<HashResultResp> {
    const parsed = CreateInvoiceWSDTOSchema.safeParse(dto)
    if (!parsed.success) {
      throw new ViettelValidationError(
        parsed.error.issues.map(i => ({ path: i.path.join('.'), message: i.message }))
      )
    }
    return this.http.postJson<HashResultResp>(PATH_USB_HASH(this.taxCode), parsed.data)
  }

  /**
   * @experimental AfterSignInvoiceUSB — endpoint name/path not verified against samples.
   * Submit the client-signed hash back to Viettel to finalize the invoice.
   */
  async submitSignedHash(input: AfterSignInvoiceUSBInput): Promise<AfterSignResp> {
    return this.http.postJson<AfterSignResp>(
      '/services/einvoiceapplication/api/InvoiceAPI/InvoiceWS/AfterSignInvoiceUSB',
      input
    )
  }
}
