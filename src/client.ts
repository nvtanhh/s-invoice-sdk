import { HttpClient } from './http/http-client.js'
import type { ClientConfig } from './config.js'
import { InvoiceService } from './services/invoice-service.js'
import { UsbTokenService } from './services/usb-token-service.js'
import { CancelService } from './services/cancel-service.js'
import { SearchService } from './services/search-service.js'
import { ListService } from './services/experimental/list-service.js'
import { FileService } from './services/experimental/file-service.js'
import { TemplateService } from './services/experimental/template-service.js'
import { PaymentService } from './services/experimental/payment-service.js'
import { BatchService } from './services/experimental/batch-service.js'

export class ViettelInvoiceClient {
  public readonly invoices: InvoiceService
  public readonly cancel: CancelService
  public readonly search: SearchService
  public readonly usbToken: UsbTokenService
  /** Experimental: wire format not verified against Java samples. */
  public readonly experimental: {
    list: ListService
    file: FileService
    templates: TemplateService
    payments: PaymentService
    batch: BatchService
  }

  constructor(cfg: ClientConfig) {
    const http = new HttpClient(cfg)
    this.invoices = new InvoiceService(http, cfg.taxCode)
    this.cancel = new CancelService(http)
    this.search = new SearchService(http)
    this.usbToken = new UsbTokenService(http, cfg.taxCode)
    this.experimental = {
      list: new ListService(http),
      file: new FileService(http),
      templates: new TemplateService(http),
      payments: new PaymentService(http),
      batch: new BatchService(http, cfg.taxCode)
    }
  }
}
