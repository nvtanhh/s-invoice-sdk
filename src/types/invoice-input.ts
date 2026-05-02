import type { InvoiceTypeCode, AdjustmentTypeCode, AdjustmentInvoiceTypeCode, MetaValueTypeCode } from './common.js'

export interface BuyerInfo {
  buyerName?: string
  buyerLegalName?: string
  buyerTaxCode?: string
  buyerAddressLine?: string
  buyerEmail?: string
  buyerPhoneNumber?: string
  buyerBankAccount?: string
  buyerBankName?: string
  buyerCode?: string
  buyerIdNo?: string
  buyerIdType?: number
  buyerBirthDay?: string
  buyerNotGetInvoice?: number  // 1 = no invoice issued to buyer
}

export interface SellerInfo {
  sellerLegalName?: string
  sellerTaxCode?: string
  sellerAddressLine?: string
  sellerPhoneNumber?: string
  sellerEmail?: string
  sellerBankAccount?: string
  sellerBankName?: string
  sellerWebsite?: string
}

export interface ItemInfo {
  lineNumber: number
  itemCode?: string
  itemName: string
  unitCode?: string
  unitName?: string
  unitPrice: number
  quantity: number
  itemTotalAmountWithoutTax: number
  taxPercentage: number  // -1 = no tax, 0 = 0%, 5/8/10 etc.
  taxAmount: number
  itemTotalAmountWithTax?: number
  itemTotalAmountAfterDiscount?: number
  discount?: number
  discount2?: number  // line-level secondary discount from Java sample
  itemDiscount?: number
  selection?: number
  isIncreaseItem?: '0' | '1'  // money-adjust only: '1' = increase, '0' = decrease
  itemNote?: string
  batchNo?: string
  expDate?: string
}

export interface TaxBreakDownsInfo {
  taxPercentage: number
  taxableAmount: number
  taxAmount: number
}

export interface SummarizeInfo {
  sumOfTotalLineAmountWithoutTax?: number
  totalAmountWithoutTax: number
  totalTaxAmount?: number
  totalAmountWithTax: number
  totalAmountAfterDiscount?: number
  totalAmountWithTaxFrn?: number
  discountAmount?: number
  taxPercentage?: number
  totalAmountWithTaxInWords?: string
}

export interface MetaDataInfo {
  keyTag: string
  valueType: MetaValueTypeCode
  keyLabel?: string
  stringValue?: string
  numberValue?: number  // Java Long; may exceed MAX_SAFE_INTEGER for large IDs
  dateValue?: number    // epoch ms
}

export interface MeterReadingInfo {
  periodFrom?: string
  periodTo?: string
  previousReading?: number
  currentReading?: number
  utilizationTime?: string
  cumulativeQuantity?: number
  multiplier?: number
  powerFactor?: number
  reactivePower?: number
}

export interface FuelReadingInfo {
  periodFrom?: string
  periodTo?: string
  previousReading?: number
  currentReading?: number
  quantity?: number
  unitName?: string
}

export interface QrCodeInfo {
  qrCode?: string
}

// Wire field name is `payments` on CreateInvoiceWSDTO (verified: Java setPayments)
export interface PaymentInfo {
  paymentMethodName: string
  paymentTime?: number  // epoch ms
  payee?: string
  amount?: number
}

export interface GeneralInvoiceInfo {
  invoiceType: InvoiceTypeCode
  templateCode: string
  invoiceSeries: string
  currencyCode: 'VND' | 'USD' | string
  exchangeRate?: number
  adjustmentType: AdjustmentTypeCode
  paymentStatus?: boolean
  paymentMethodName?: string
  cusGetInvoiceRight?: boolean
  invoiceIssuedDate?: number        // epoch ms
  transactionUuid?: string          // client-generated idempotency key
  originalInvoiceId?: string
  originalInvoiceIssueDate?: number // epoch ms
  originalTemplateCode?: string
  additionalReferenceDesc?: string
  additionalReferenceDate?: number  // epoch ms
  adjustedNote?: string
  adjustmentInvoiceType?: AdjustmentInvoiceTypeCode
  invoiceNote?: string
  contractNumber?: string
  contractDate?: number             // epoch ms
  reservationCode?: string
  buyerNotGetInvoice?: number
  buyerCode?: string
}

export interface CreateInvoiceWSDTO {
  generalInvoiceInfo: GeneralInvoiceInfo
  buyerInfo?: BuyerInfo
  sellerInfo?: SellerInfo
  itemInfo?: ItemInfo[]
  taxBreakdowns?: TaxBreakDownsInfo[]
  summarizeInfo?: SummarizeInfo
  payments?: PaymentInfo[]          // wire field: `payments` (Java setPayments)
  metadata?: MetaDataInfo[]
  meterReading?: MeterReadingInfo[] // wire field: `meterReading` (Java setMeterReading)
  fuelReading?: FuelReadingInfo[]   // wire field: `fuelReading` (Java setFuelReading)
  qrCodeInfo?: QrCodeInfo
}

export interface CancelTransactionWSDTO {
  supplierTaxCode: string
  templateCode: string
  invoiceNo: string
  strIssueDate: number              // epoch ms (Java Long; sample: 1736818200000)
  additionalReferenceDesc: string
  additionalReferenceDate: number   // epoch ms
  reasonDelete?: string
}

export interface SearchByTransUUIDDTO {
  supplierTaxCode: string
  transactionUuid: string
}

export interface GetInvoiceInput {
  supplierTaxCode: string
  fromDate: string                  // 'dd/MM/yyyy' — ONLY this endpoint uses string dates
  toDate: string
  invoiceType?: InvoiceTypeCode
  rowPerPage?: number
  pageNum?: number
  status?: number
}
