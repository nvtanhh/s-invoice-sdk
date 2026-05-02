import { z } from 'zod'
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'

extendZodWithOpenApi(z)

export const BuyerInfoSchema = z.object({
  buyerName: z.string().max(400).optional(),
  buyerLegalName: z.string().max(400).optional(),
  buyerTaxCode: z.string().regex(/^[0-9-]{10,14}$/).optional(),
  buyerAddressLine: z.string().max(400).optional(),
  buyerEmail: z.string().email().optional(),
  buyerPhoneNumber: z.string().max(50).optional(),
  buyerBankAccount: z.string().max(50).optional(),
  buyerBankName: z.string().max(255).optional(),
  buyerCode: z.string().max(50).optional(),
  buyerIdNo: z.string().max(50).optional(),
  buyerIdType: z.number().int().optional(),
  buyerBirthDay: z.string().optional(),
  buyerNotGetInvoice: z.number().int().min(0).max(1).optional()
}).openapi('BuyerInfo')

export const SellerInfoSchema = z.object({
  sellerLegalName: z.string().max(400).optional(),
  sellerTaxCode: z.string().optional(),
  sellerAddressLine: z.string().max(400).optional(),
  sellerPhoneNumber: z.string().max(50).optional(),
  sellerEmail: z.string().email().optional(),
  sellerBankAccount: z.string().max(50).optional(),
  sellerBankName: z.string().max(255).optional(),
  sellerWebsite: z.string().max(255).optional()
}).openapi('SellerInfo')

export const ItemInfoSchema = z.object({
  lineNumber: z.number().int().positive(),
  itemCode: z.string().max(50).optional(),
  itemName: z.string().min(1).max(500),
  unitCode: z.string().max(20).optional(),
  unitName: z.string().max(50).optional(),
  unitPrice: z.number(),
  quantity: z.number(),
  itemTotalAmountWithoutTax: z.number(),
  taxPercentage: z.number(),
  taxAmount: z.number(),
  itemTotalAmountWithTax: z.number().optional(),
  itemTotalAmountAfterDiscount: z.number().optional(),
  discount: z.number().optional(),
  discount2: z.number().optional(),
  itemDiscount: z.number().optional(),
  selection: z.number().int().optional(),
  isIncreaseItem: z.enum(['0', '1']).optional(),
  itemNote: z.string().max(500).optional(),
  batchNo: z.string().max(50).optional(),
  expDate: z.string().optional()
}).openapi('ItemInfo')

export const TaxBreakDownsInfoSchema = z.object({
  taxPercentage: z.number(),
  taxableAmount: z.number(),
  taxAmount: z.number()
}).openapi('TaxBreakDownsInfo')

export const SummarizeInfoSchema = z.object({
  sumOfTotalLineAmountWithoutTax: z.number().optional(),
  totalAmountWithoutTax: z.number(),
  totalTaxAmount: z.number().optional(),
  totalAmountWithTax: z.number(),
  totalAmountAfterDiscount: z.number().optional(),
  totalAmountWithTaxFrn: z.number().optional(),
  discountAmount: z.number().optional(),
  taxPercentage: z.number().optional(),
  totalAmountWithTaxInWords: z.string().optional()
}).openapi('SummarizeInfo')

export const MetaDataInfoSchema = z.object({
  keyTag: z.string(),
  valueType: z.enum(['text', 'number', 'date']),
  keyLabel: z.string().optional(),
  stringValue: z.string().optional(),
  numberValue: z.number().optional(),
  dateValue: z.number().optional()
}).openapi('MetaDataInfo')

export const MeterReadingInfoSchema = z.object({
  periodFrom: z.string().optional(),
  periodTo: z.string().optional(),
  previousReading: z.number().optional(),
  currentReading: z.number().optional(),
  utilizationTime: z.string().optional(),
  cumulativeQuantity: z.number().optional(),
  multiplier: z.number().optional(),
  powerFactor: z.number().optional(),
  reactivePower: z.number().optional()
}).openapi('MeterReadingInfo')

export const FuelReadingInfoSchema = z.object({
  periodFrom: z.string().optional(),
  periodTo: z.string().optional(),
  previousReading: z.number().optional(),
  currentReading: z.number().optional(),
  quantity: z.number().optional(),
  unitName: z.string().optional()
}).openapi('FuelReadingInfo')

export const QrCodeInfoSchema = z.object({
  qrCode: z.string().optional()
}).openapi('QrCodeInfo')

export const PaymentInfoSchema = z.object({
  paymentMethodName: z.string(),
  paymentTime: z.number().optional(),
  payee: z.string().optional(),
  amount: z.number().optional()
}).openapi('PaymentInfo')

export const GeneralInvoiceInfoSchema = z.object({
  invoiceType: z.enum(['1', '2', '6']),
  templateCode: z.string().min(1),
  invoiceSeries: z.string().min(1),
  currencyCode: z.string().min(1),
  exchangeRate: z.number().optional(),
  adjustmentType: z.enum(['1', '3', '5']),
  paymentStatus: z.boolean().optional(),
  paymentMethodName: z.string().optional(),
  cusGetInvoiceRight: z.boolean().optional(),
  invoiceIssuedDate: z.number().optional(),
  transactionUuid: z.string().uuid().optional(),
  originalInvoiceId: z.string().optional(),
  originalInvoiceIssueDate: z.number().optional(),
  originalTemplateCode: z.string().optional(),
  additionalReferenceDesc: z.string().optional(),
  additionalReferenceDate: z.number().optional(),
  adjustedNote: z.string().optional(),
  adjustmentInvoiceType: z.enum(['1', '2']).optional(),
  invoiceNote: z.string().optional(),
  contractNumber: z.string().optional(),
  contractDate: z.number().optional(),
  reservationCode: z.string().optional(),
  buyerNotGetInvoice: z.number().int().optional(),
  buyerCode: z.string().optional()
}).openapi('GeneralInvoiceInfo')

export const CreateInvoiceWSDTOSchema = z.object({
  generalInvoiceInfo: GeneralInvoiceInfoSchema,
  buyerInfo: BuyerInfoSchema.optional(),
  sellerInfo: SellerInfoSchema.optional(),
  itemInfo: z.array(ItemInfoSchema).optional(),
  taxBreakdowns: z.array(TaxBreakDownsInfoSchema).optional(),
  summarizeInfo: SummarizeInfoSchema.optional(),
  payments: z.array(PaymentInfoSchema).optional(),
  metadata: z.array(MetaDataInfoSchema).optional(),
  meterReading: z.array(MeterReadingInfoSchema).optional(),
  fuelReading: z.array(FuelReadingInfoSchema).optional(),
  qrCodeInfo: QrCodeInfoSchema.optional()
}).superRefine((dto, ctx) => {
  const g = dto.generalInvoiceInfo
  if (g.adjustmentType === '3' || g.adjustmentType === '5') {
    const required = [
      'originalInvoiceId', 'originalInvoiceIssueDate', 'originalTemplateCode',
      'additionalReferenceDesc', 'additionalReferenceDate', 'adjustedNote'
    ] as const
    for (const f of required) {
      if (g[f] == null) {
        ctx.addIssue({
          code: 'custom',
          path: ['generalInvoiceInfo', f],
          message: `${f} is required for adjustmentType=${g.adjustmentType}`
        })
      }
    }
  }
  if (g.adjustmentType === '5' && !g.adjustmentInvoiceType) {
    ctx.addIssue({
      code: 'custom',
      path: ['generalInvoiceInfo', 'adjustmentInvoiceType'],
      message: 'adjustmentInvoiceType is required when adjustmentType=5'
    })
  }
  if (g.adjustmentType === '5' && g.adjustmentInvoiceType === '1' && !dto.itemInfo?.length) {
    ctx.addIssue({
      code: 'custom',
      path: ['itemInfo'],
      message: 'itemInfo required for money-adjust (adjustmentInvoiceType=1)'
    })
  }
  if (g.adjustmentType === '5' && g.adjustmentInvoiceType === '1') {
    for (const [i, it] of (dto.itemInfo ?? []).entries()) {
      if (!it.isIncreaseItem) {
        ctx.addIssue({
          code: 'custom',
          path: ['itemInfo', i, 'isIncreaseItem'],
          message: 'isIncreaseItem (0|1) required on money-adjust line items'
        })
      }
    }
  }
}).openapi('CreateInvoiceWSDTO')

export type CreateInvoiceWSDTO = z.infer<typeof CreateInvoiceWSDTOSchema>

export const CancelTransactionWSDTOSchema = z.object({
  supplierTaxCode: z.string(),
  templateCode: z.string(),
  invoiceNo: z.string(),
  strIssueDate: z.number().int(),   // epoch ms
  additionalReferenceDesc: z.string(),
  additionalReferenceDate: z.number().int(), // epoch ms
  reasonDelete: z.string().optional()
}).openapi('CancelTransactionWSDTO')

export type CancelTransactionWSDTO = z.infer<typeof CancelTransactionWSDTOSchema>

export const SearchByTransUUIDDTOSchema = z.object({
  supplierTaxCode: z.string(),
  transactionUuid: z.string()
}).openapi('SearchByTransUUIDDTO')

export type SearchByTransUUIDDTO = z.infer<typeof SearchByTransUUIDDTOSchema>

export const GetInvoiceInputSchema = z.object({
  supplierTaxCode: z.string(),
  fromDate: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Must be dd/MM/yyyy'),
  toDate: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Must be dd/MM/yyyy'),
  invoiceType: z.enum(['1', '2', '6']).optional(),
  rowPerPage: z.number().int().positive().optional(),
  pageNum: z.number().int().min(0).optional(),
  status: z.number().int().optional()
}).openapi('GetInvoiceInput')

export type GetInvoiceInput = z.infer<typeof GetInvoiceInputSchema>
