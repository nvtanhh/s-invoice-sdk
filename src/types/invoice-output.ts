export interface CreateInvoiceDTO {
  invoiceNo: string
  transactionID?: string
  reservationCode?: string
  codeOfTax?: string
}

export interface CreateInvoiceResp {
  errorCode?: string
  description?: string
  result?: CreateInvoiceDTO
}

export interface CancelInvoiceResp {
  errorCode?: string
  description?: string
  result?: boolean
}

export interface SearchUUIDInvoiceResult {
  invoiceNo: string
  status: number
  issueDate: number
  reservationCode?: string
  exchangeStatus?: number
  codeOfTax?: string
}

export interface SearchUUIDResp {
  errorCode?: string
  description?: string
  result?: SearchUUIDInvoiceResult
}

/** One invoice row as returned by getListInvoiceDataControl. Verified from live response. */
export interface InvoicesAll {
  invoiceId: number
  invoiceType: string
  adjustmentType: string
  templateCode: string
  invoiceSeri: string           // API spells it "Seri", not "Series"
  invoiceNumber: string
  invoiceNo: string
  currency: string
  total: number
  issueDate: number | null      // epoch ms
  issueDateStr: string | null
  state: number
  stateCode: number
  requestDate: string | null
  description: string | null
  buyerIdNo: string | null
  subscriberNumber: string | null
  paymentStatus: number | null
  viewStatus: unknown
  downloadStatus: unknown
  exchangeStatus: number
  numOfExchange: number | null
  createTime: number            // epoch ms
  contractId: unknown
  contractNo: string | null
  supplierTaxCode: string
  buyerTaxCode: string | null
  totalBeforeTax: number
  taxAmount: number
  taxRate: number | null
  paymentMethod: string
  paymentTime: number | null
  customerId: unknown
  no: unknown
  paymentStatusName: string | null
  buyerName: string | null
  transactionUuid: string | null
  originalInvoiceId: number | null
}

export interface InvoiceSearch {
  errorCode: string | null
  description: string | null
  totalRows: number
  invoices: InvoicesAll[]
}

export interface HashResultResp {
  errorCode?: string
  description?: string
  result?: { hash: string; transactionUuid: string }
}

export interface AfterSignInvoiceUSBInput {
  transactionUuid: string
  supplierTaxCode: string
  signedData: string
}

export interface AfterSignResp {
  errorCode?: string
  description?: string
  result?: CreateInvoiceDTO
}

export interface GetInvoiceFilePortalResp {
  fileBytes: string  // base64
  fileName: string
}

export interface InvoiceTemplateItem {
  templateCode: string
  templateName: string
  invoiceSeries: string
}

export interface GetInvoiceTemplatesResp {
  errorCode?: string
  description?: string
  result?: InvoiceTemplateItem[]
}

export interface CreateMultiInvoiceDetail {
  transactionUuid: string
  invoiceNo?: string
  error?: string
}

export interface CreateMultiInvoiceDTO {
  totalSuccess: number
  totalFail: number
  details: CreateMultiInvoiceDetail[]
}

export interface CreateMultiInvoiceResp {
  errorCode?: string
  description?: string
  result?: CreateMultiInvoiceDTO
}
