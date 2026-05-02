import { z } from 'zod'
import { HttpClient } from '../../http/http-client.js'
import { API_PATH_PREFIX } from '../../http/paths.js'
import { ViettelValidationError } from '../../http/errors.js'

// Paths unconfirmed — TODO confirm against sandbox before promoting to stable
const PATH_UPDATE_PAYMENT = `${API_PATH_PREFIX}/InvoiceAPI/InvoiceWS/updatePayment`
const PATH_CANCEL_PAYMENT = `${API_PATH_PREFIX}/InvoiceAPI/InvoiceWS/cancelPayment`

const UpdatePaymentInputSchema = z.object({
  supplierTaxCode: z.string(),
  invoiceNo: z.string(),
  paymentStatus: z.boolean()
})

const CancelPaymentInputSchema = z.object({
  supplierTaxCode: z.string(),
  invoiceNo: z.string()
})

export class PaymentService {
  constructor(private readonly http: HttpClient) {}

  /**
   * @experimental Update payment status of an invoice.
   * Path TBD — confirm against sandbox before use.
   */
  async updatePayment(input: unknown): Promise<unknown> {
    const parsed = UpdatePaymentInputSchema.safeParse(input)
    if (!parsed.success) {
      throw new ViettelValidationError(
        parsed.error.issues.map(i => ({ path: i.path.join('.'), message: i.message }))
      )
    }
    return this.http.postJson<unknown>(PATH_UPDATE_PAYMENT, parsed.data)
  }

  /**
   * @experimental Cancel payment status of an invoice.
   * Path TBD — confirm against sandbox before use.
   */
  async cancelPayment(input: unknown): Promise<unknown> {
    const parsed = CancelPaymentInputSchema.safeParse(input)
    if (!parsed.success) {
      throw new ViettelValidationError(
        parsed.error.issues.map(i => ({ path: i.path.join('.'), message: i.message }))
      )
    }
    return this.http.postJson<unknown>(PATH_CANCEL_PAYMENT, parsed.data)
  }
}
