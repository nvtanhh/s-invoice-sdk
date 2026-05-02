import { CreateInvoiceWSDTOSchema, CancelTransactionWSDTOSchema, GetInvoiceInputSchema } from '../../src/schemas/invoice-input.schema'
import type { CreateInvoiceWSDTO, CancelTransactionWSDTO } from '../../src/schemas/invoice-input.schema'

describe('Invoice Input Schemas', () => {
  describe('CreateInvoiceWSDTOSchema', () => {
    // Helper: minimal valid new invoice (adjustmentType=1)
    const minimalNewInvoice = (): CreateInvoiceWSDTO => ({
      generalInvoiceInfo: {
        invoiceType: '1',
        templateCode: '1/0230',
        invoiceSeries: 'K25TII',
        currencyCode: 'VND',
        adjustmentType: '1'
      },
      buyerInfo: {
        buyerName: 'Test Buyer',
        buyerTaxCode: '0123456789'
      },
      itemInfo: [
        {
          lineNumber: 1,
          itemName: 'Test Service',
          unitName: 'service',
          unitPrice: 1000000,
          quantity: 1,
          itemTotalAmountWithoutTax: 1000000,
          taxPercentage: 10,
          taxAmount: 100000
        }
      ],
      summarizeInfo: {
        totalAmountWithoutTax: 1000000,
        totalAmountWithTax: 1100000
      },
      payments: [{ paymentMethodName: 'TM/CK' }]
    })

    it('should accept valid new invoice (adjustmentType=1)', () => {
      const dto = minimalNewInvoice()
      const result = CreateInvoiceWSDTOSchema.safeParse(dto)
      expect(result.success).toBe(true)
    })

    it('should reject adjustmentType=3 without originalInvoiceId', () => {
      const dto = minimalNewInvoice()
      dto.generalInvoiceInfo.adjustmentType = '3'
      delete dto.generalInvoiceInfo.originalInvoiceId

      const result = CreateInvoiceWSDTOSchema.safeParse(dto)
      expect(result.success).toBe(false)
      if (!result.success) {
        const issue = result.error.issues.find(i => i.path.includes('originalInvoiceId'))
        expect(issue).toBeDefined()
        expect(issue?.message).toContain('originalInvoiceId is required for adjustmentType=3')
      }
    })

    it('should reject adjustmentType=3 without originalInvoiceIssueDate', () => {
      const dto = minimalNewInvoice()
      dto.generalInvoiceInfo.adjustmentType = '3'
      dto.generalInvoiceInfo.originalInvoiceId = 'INV-001'
      delete dto.generalInvoiceInfo.originalInvoiceIssueDate

      const result = CreateInvoiceWSDTOSchema.safeParse(dto)
      expect(result.success).toBe(false)
      if (!result.success) {
        const issue = result.error.issues.find(i => i.path.includes('originalInvoiceIssueDate'))
        expect(issue).toBeDefined()
      }
    })

    it('should reject adjustmentType=5 without adjustmentInvoiceType', () => {
      const dto = minimalNewInvoice()
      dto.generalInvoiceInfo.adjustmentType = '5'
      dto.generalInvoiceInfo.originalInvoiceId = 'INV-001'
      dto.generalInvoiceInfo.originalInvoiceIssueDate = Date.now()
      dto.generalInvoiceInfo.originalTemplateCode = '1/0230'
      dto.generalInvoiceInfo.additionalReferenceDesc = 'Adjust'
      dto.generalInvoiceInfo.additionalReferenceDate = Date.now()
      dto.generalInvoiceInfo.adjustedNote = 'Note'
      delete dto.generalInvoiceInfo.adjustmentInvoiceType

      const result = CreateInvoiceWSDTOSchema.safeParse(dto)
      expect(result.success).toBe(false)
      if (!result.success) {
        const issue = result.error.issues.find(i => i.path.includes('adjustmentInvoiceType'))
        expect(issue).toBeDefined()
        expect(issue?.message).toContain('adjustmentInvoiceType is required when adjustmentType=5')
      }
    })

    it('should reject money-adjust (adjustmentType=5, adjustmentInvoiceType=1) without itemInfo', () => {
      const dto = minimalNewInvoice()
      dto.generalInvoiceInfo.adjustmentType = '5'
      dto.generalInvoiceInfo.originalInvoiceId = 'INV-001'
      dto.generalInvoiceInfo.originalInvoiceIssueDate = Date.now()
      dto.generalInvoiceInfo.originalTemplateCode = '1/0230'
      dto.generalInvoiceInfo.additionalReferenceDesc = 'Adjust'
      dto.generalInvoiceInfo.additionalReferenceDate = Date.now()
      dto.generalInvoiceInfo.adjustedNote = 'Note'
      dto.generalInvoiceInfo.adjustmentInvoiceType = '1'
      dto.itemInfo = []

      const result = CreateInvoiceWSDTOSchema.safeParse(dto)
      expect(result.success).toBe(false)
      if (!result.success) {
        const issue = result.error.issues.find(i => i.path[0] === 'itemInfo')
        expect(issue).toBeDefined()
        expect(issue?.message).toContain('itemInfo required for money-adjust')
      }
    })

    it('should reject money-adjust items without isIncreaseItem', () => {
      const dto = minimalNewInvoice()
      dto.generalInvoiceInfo.adjustmentType = '5'
      dto.generalInvoiceInfo.originalInvoiceId = 'INV-001'
      dto.generalInvoiceInfo.originalInvoiceIssueDate = Date.now()
      dto.generalInvoiceInfo.originalTemplateCode = '1/0230'
      dto.generalInvoiceInfo.additionalReferenceDesc = 'Adjust'
      dto.generalInvoiceInfo.additionalReferenceDate = Date.now()
      dto.generalInvoiceInfo.adjustedNote = 'Note'
      dto.generalInvoiceInfo.adjustmentInvoiceType = '1'
      dto.itemInfo = [
        {
          lineNumber: 1,
          itemName: 'Test Item',
          unitName: 'service',
          unitPrice: 100000,
          quantity: 1,
          itemTotalAmountWithoutTax: 100000,
          taxPercentage: 10,
          taxAmount: 10000
          // Missing isIncreaseItem
        }
      ]

      const result = CreateInvoiceWSDTOSchema.safeParse(dto)
      expect(result.success).toBe(false)
      if (!result.success) {
        const issue = result.error.issues.find(i => i.path.includes('isIncreaseItem'))
        expect(issue).toBeDefined()
        expect(issue?.message).toContain('isIncreaseItem (0|1) required on money-adjust line items')
      }
    })

    it('should accept money-adjust items with isIncreaseItem=0', () => {
      const dto = minimalNewInvoice()
      dto.generalInvoiceInfo.adjustmentType = '5'
      dto.generalInvoiceInfo.originalInvoiceId = 'INV-001'
      dto.generalInvoiceInfo.originalInvoiceIssueDate = Date.now()
      dto.generalInvoiceInfo.originalTemplateCode = '1/0230'
      dto.generalInvoiceInfo.additionalReferenceDesc = 'Adjust'
      dto.generalInvoiceInfo.additionalReferenceDate = Date.now()
      dto.generalInvoiceInfo.adjustedNote = 'Note'
      dto.generalInvoiceInfo.adjustmentInvoiceType = '1'
      dto.itemInfo = [
        {
          lineNumber: 1,
          itemName: 'Test Item',
          unitName: 'service',
          unitPrice: 100000,
          quantity: 1,
          itemTotalAmountWithoutTax: 100000,
          taxPercentage: 10,
          taxAmount: 10000,
          isIncreaseItem: '0'
        }
      ]

      const result = CreateInvoiceWSDTOSchema.safeParse(dto)
      expect(result.success).toBe(true)
    })

    it('should accept money-adjust items with isIncreaseItem=1', () => {
      const dto = minimalNewInvoice()
      dto.generalInvoiceInfo.adjustmentType = '5'
      dto.generalInvoiceInfo.originalInvoiceId = 'INV-001'
      dto.generalInvoiceInfo.originalInvoiceIssueDate = Date.now()
      dto.generalInvoiceInfo.originalTemplateCode = '1/0230'
      dto.generalInvoiceInfo.additionalReferenceDesc = 'Adjust'
      dto.generalInvoiceInfo.additionalReferenceDate = Date.now()
      dto.generalInvoiceInfo.adjustedNote = 'Note'
      dto.generalInvoiceInfo.adjustmentInvoiceType = '1'
      dto.itemInfo = [
        {
          lineNumber: 1,
          itemName: 'Test Item',
          unitName: 'service',
          unitPrice: 100000,
          quantity: 1,
          itemTotalAmountWithoutTax: 100000,
          taxPercentage: 10,
          taxAmount: 10000,
          isIncreaseItem: '1'
        }
      ]

      const result = CreateInvoiceWSDTOSchema.safeParse(dto)
      expect(result.success).toBe(true)
    })

    it('should accept info-adjust (adjustmentType=5, adjustmentInvoiceType=2) without itemInfo', () => {
      const dto = minimalNewInvoice()
      dto.generalInvoiceInfo.adjustmentType = '5'
      dto.generalInvoiceInfo.originalInvoiceId = 'INV-001'
      dto.generalInvoiceInfo.originalInvoiceIssueDate = Date.now()
      dto.generalInvoiceInfo.originalTemplateCode = '1/0230'
      dto.generalInvoiceInfo.additionalReferenceDesc = 'Adjust'
      dto.generalInvoiceInfo.additionalReferenceDate = Date.now()
      dto.generalInvoiceInfo.adjustedNote = 'Note'
      dto.generalInvoiceInfo.adjustmentInvoiceType = '2'
      delete dto.itemInfo

      const result = CreateInvoiceWSDTOSchema.safeParse(dto)
      expect(result.success).toBe(true)
    })

    it('should validate all items in money-adjust and reject partial coverage', () => {
      const dto = minimalNewInvoice()
      dto.generalInvoiceInfo.adjustmentType = '5'
      dto.generalInvoiceInfo.originalInvoiceId = 'INV-001'
      dto.generalInvoiceInfo.originalInvoiceIssueDate = Date.now()
      dto.generalInvoiceInfo.originalTemplateCode = '1/0230'
      dto.generalInvoiceInfo.additionalReferenceDesc = 'Adjust'
      dto.generalInvoiceInfo.additionalReferenceDate = Date.now()
      dto.generalInvoiceInfo.adjustedNote = 'Note'
      dto.generalInvoiceInfo.adjustmentInvoiceType = '1'
      dto.itemInfo = [
        {
          lineNumber: 1,
          itemName: 'Item 1',
          unitName: 'service',
          unitPrice: 100000,
          quantity: 1,
          itemTotalAmountWithoutTax: 100000,
          taxPercentage: 10,
          taxAmount: 10000,
          isIncreaseItem: '1'
        },
        {
          lineNumber: 2,
          itemName: 'Item 2',
          unitName: 'service',
          unitPrice: 50000,
          quantity: 1,
          itemTotalAmountWithoutTax: 50000,
          taxPercentage: 10,
          taxAmount: 5000
          // Missing isIncreaseItem on second item
        }
      ]

      const result = CreateInvoiceWSDTOSchema.safeParse(dto)
      expect(result.success).toBe(false)
      if (!result.success) {
        const issue = result.error.issues.find(
          i => i.path[0] === 'itemInfo' && i.path[1] === 1 && i.path[2] === 'isIncreaseItem'
        )
        expect(issue).toBeDefined()
      }
    })

    it('should handle empty itemInfo array for money-adjust (loops over zero items)', () => {
      const dto = minimalNewInvoice()
      dto.generalInvoiceInfo.adjustmentType = '5'
      dto.generalInvoiceInfo.originalInvoiceId = 'INV-001'
      dto.generalInvoiceInfo.originalInvoiceIssueDate = Date.now()
      dto.generalInvoiceInfo.originalTemplateCode = '1/0230'
      dto.generalInvoiceInfo.additionalReferenceDesc = 'Adjust'
      dto.generalInvoiceInfo.additionalReferenceDate = Date.now()
      dto.generalInvoiceInfo.adjustedNote = 'Note'
      dto.generalInvoiceInfo.adjustmentInvoiceType = '1'
      dto.itemInfo = [] // Empty array - should fail because itemInfo is required for money-adjust

      const result = CreateInvoiceWSDTOSchema.safeParse(dto)
      expect(result.success).toBe(false)
      if (!result.success) {
        const issue = result.error.issues.find(i => i.path[0] === 'itemInfo')
        expect(issue).toBeDefined()
      }
    })

    it('should accept optional meterReading array', () => {
      const dto = minimalNewInvoice()
      dto.meterReading = [
        {
          periodFrom: '2024-01-01',
          periodTo: '2024-01-31',
          previousReading: 1000,
          currentReading: 1500
        }
      ]

      const result = CreateInvoiceWSDTOSchema.safeParse(dto)
      expect(result.success).toBe(true)
    })

    it('should accept optional fuelReading array', () => {
      const dto = minimalNewInvoice()
      dto.fuelReading = [
        {
          periodFrom: '2024-01-01',
          periodTo: '2024-01-31',
          previousReading: 100,
          currentReading: 150,
          quantity: 50,
          unitName: 'liter'
        }
      ]

      const result = CreateInvoiceWSDTOSchema.safeParse(dto)
      expect(result.success).toBe(true)
    })

    it('should accept optional payments array with multiple methods', () => {
      const dto = minimalNewInvoice()
      dto.payments = [
        { paymentMethodName: 'TM/CK', amount: 500000 },
        { paymentMethodName: 'Cash', amount: 600000 }
      ]

      const result = CreateInvoiceWSDTOSchema.safeParse(dto)
      expect(result.success).toBe(true)
    })
  })

  describe('CancelTransactionWSDTOSchema', () => {
    const minimalCancelPayload = (): CancelTransactionWSDTO => ({
      supplierTaxCode: '0123456789',
      templateCode: '1/0230',
      invoiceNo: 'INV-001',
      strIssueDate: Date.now(),
      additionalReferenceDesc: 'Cancel reason',
      additionalReferenceDate: Date.now()
    })

    it('should accept strIssueDate as number (epoch ms)', () => {
      const payload = minimalCancelPayload()
      const result = CancelTransactionWSDTOSchema.safeParse(payload)
      expect(result.success).toBe(true)
    })

    it('should reject strIssueDate as string', () => {
      const payload = minimalCancelPayload()
      ;(payload as any).strIssueDate = '2024-01-01'

      const result = CancelTransactionWSDTOSchema.safeParse(payload)
      expect(result.success).toBe(false)
      if (!result.success) {
        const issue = result.error.issues.find(i => i.path.includes('strIssueDate'))
        expect(issue).toBeDefined()
      }
    })

    it('should reject additionalReferenceDate as string', () => {
      const payload = minimalCancelPayload()
      ;(payload as any).additionalReferenceDate = '2024-01-01'

      const result = CancelTransactionWSDTOSchema.safeParse(payload)
      expect(result.success).toBe(false)
      if (!result.success) {
        const issue = result.error.issues.find(i => i.path.includes('additionalReferenceDate'))
        expect(issue).toBeDefined()
      }
    })

    it('should require supplierTaxCode', () => {
      const payload = minimalCancelPayload()
      delete (payload as any).supplierTaxCode

      const result = CancelTransactionWSDTOSchema.safeParse(payload)
      expect(result.success).toBe(false)
    })

    it('should require templateCode', () => {
      const payload = minimalCancelPayload()
      delete (payload as any).templateCode

      const result = CancelTransactionWSDTOSchema.safeParse(payload)
      expect(result.success).toBe(false)
    })

    it('should require invoiceNo', () => {
      const payload = minimalCancelPayload()
      delete (payload as any).invoiceNo

      const result = CancelTransactionWSDTOSchema.safeParse(payload)
      expect(result.success).toBe(false)
    })

    it('should require additionalReferenceDesc', () => {
      const payload = minimalCancelPayload()
      delete (payload as any).additionalReferenceDesc

      const result = CancelTransactionWSDTOSchema.safeParse(payload)
      expect(result.success).toBe(false)
    })

    it('should accept optional reasonDelete', () => {
      const payload = minimalCancelPayload()
      payload.reasonDelete = 'Invoice issued by mistake'

      const result = CancelTransactionWSDTOSchema.safeParse(payload)
      expect(result.success).toBe(true)
    })

    it('should accept large numeric epoch values', () => {
      const payload = minimalCancelPayload()
      payload.strIssueDate = 1735689600000 // 2025-01-01
      payload.additionalReferenceDate = 1735689600000

      const result = CancelTransactionWSDTOSchema.safeParse(payload)
      expect(result.success).toBe(true)
    })
  })

  describe('GetInvoiceInputSchema', () => {
    const minimalSearchPayload = () => ({
      supplierTaxCode: '0123456789',
      fromDate: '01/01/2024',
      toDate: '31/01/2024'
    })

    it('should accept valid dates in dd/MM/yyyy format', () => {
      const payload = minimalSearchPayload()
      const result = GetInvoiceInputSchema.safeParse(payload)
      expect(result.success).toBe(true)
    })

    it('should reject dates not matching dd/MM/yyyy', () => {
      const payload = minimalSearchPayload()
      ;(payload as any).fromDate = '2024-01-01' // Wrong format

      const result = GetInvoiceInputSchema.safeParse(payload)
      expect(result.success).toBe(false)
      if (!result.success) {
        const issue = result.error.issues.find(i => i.path.includes('fromDate'))
        expect(issue?.message).toContain('Must be dd/MM/yyyy')
      }
    })

    it('should reject toDate not in dd/MM/yyyy format', () => {
      const payload = minimalSearchPayload()
      ;(payload as any).toDate = '01-01-2024' // Wrong format

      const result = GetInvoiceInputSchema.safeParse(payload)
      expect(result.success).toBe(false)
      if (!result.success) {
        const issue = result.error.issues.find(i => i.path.includes('toDate'))
        expect(issue?.message).toContain('Must be dd/MM/yyyy')
      }
    })

    it('should require supplierTaxCode', () => {
      const payload = minimalSearchPayload()
      delete (payload as any).supplierTaxCode

      const result = GetInvoiceInputSchema.safeParse(payload)
      expect(result.success).toBe(false)
    })

    it('should require fromDate', () => {
      const payload = minimalSearchPayload()
      delete (payload as any).fromDate

      const result = GetInvoiceInputSchema.safeParse(payload)
      expect(result.success).toBe(false)
    })

    it('should require toDate', () => {
      const payload = minimalSearchPayload()
      delete (payload as any).toDate

      const result = GetInvoiceInputSchema.safeParse(payload)
      expect(result.success).toBe(false)
    })

    it('should accept optional invoiceType', () => {
      const payload = minimalSearchPayload()
      ;(payload as any).invoiceType = '1'

      const result = GetInvoiceInputSchema.safeParse(payload)
      expect(result.success).toBe(true)
    })

    it('should accept optional rowPerPage', () => {
      const payload = minimalSearchPayload()
      ;(payload as any).rowPerPage = 50

      const result = GetInvoiceInputSchema.safeParse(payload)
      expect(result.success).toBe(true)
    })

    it('should reject non-positive rowPerPage', () => {
      const payload = minimalSearchPayload()
      ;(payload as any).rowPerPage = 0

      const result = GetInvoiceInputSchema.safeParse(payload)
      expect(result.success).toBe(false)
    })

    it('should accept optional pageNum >= 0', () => {
      const payload = minimalSearchPayload()
      ;(payload as any).pageNum = 0

      const result = GetInvoiceInputSchema.safeParse(payload)
      expect(result.success).toBe(true)
    })

    it('should reject negative pageNum', () => {
      const payload = minimalSearchPayload()
      ;(payload as any).pageNum = -1

      const result = GetInvoiceInputSchema.safeParse(payload)
      expect(result.success).toBe(false)
    })

    it('should accept optional status', () => {
      const payload = minimalSearchPayload()
      ;(payload as any).status = 1

      const result = GetInvoiceInputSchema.safeParse(payload)
      expect(result.success).toBe(true)
    })

    it('should accept valid invoiceType enum values', () => {
      const payload = minimalSearchPayload()
      for (const type of ['1', '2', '6']) {
        ;(payload as any).invoiceType = type
        const result = GetInvoiceInputSchema.safeParse(payload)
        expect(result.success).toBe(true)
      }
    })

    it('should reject invalid invoiceType', () => {
      const payload = minimalSearchPayload()
      ;(payload as any).invoiceType = '9'

      const result = GetInvoiceInputSchema.safeParse(payload)
      expect(result.success).toBe(false)
    })

    it('should handle edge case dates (31st of months)', () => {
      const payload = minimalSearchPayload()
      payload.fromDate = '31/12/2023'
      payload.toDate = '31/12/2024'

      const result = GetInvoiceInputSchema.safeParse(payload)
      expect(result.success).toBe(true)
    })

    it('should reject date with single digit day without leading zero', () => {
      const payload = minimalSearchPayload()
      payload.fromDate = '1/01/2024' // Missing leading zero

      const result = GetInvoiceInputSchema.safeParse(payload)
      expect(result.success).toBe(false)
    })

    it('should reject date with single digit month without leading zero', () => {
      const payload = minimalSearchPayload()
      payload.fromDate = '01/1/2024' // Missing leading zero

      const result = GetInvoiceInputSchema.safeParse(payload)
      expect(result.success).toBe(false)
    })
  })
})
