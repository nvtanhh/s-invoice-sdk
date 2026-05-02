import type { ItemInfo } from './invoice-input.js'

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

export interface InvoicesOutput {
  invoiceNo: string
  templateCode: string
  invoiceSeries: string
  invoiceType: string
  currencyCode: string
  totalAmountWithoutTax: number
  totalTaxAmount: number
  totalAmountWithTax: number
  buyerName?: string
  buyerLegalName?: string
  buyerTaxCode?: string
  issueDate: number
  status: number
  transactionID?: string
  reservationCode?: string
  adjustmentType?: string
  originalInvoiceId?: string
  codeOfTax?: string
}

export interface InvoicesAll extends InvoicesOutput {
  listProduct?: ItemInfo[]
  buyerCode?: string
  exchangeRate?: number
}

export interface InvoiceSearch {
  invoices: InvoicesAll[]
  total: number
  pageNum: number
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
