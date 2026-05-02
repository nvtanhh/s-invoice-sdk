import { InvoiceService } from '../../src/services/invoice-service'
import { ViettelValidationError } from '../../src/http/errors'
import { HttpClient } from '../../src/http/http-client'
import type { CreateInvoiceResp } from '../../src/types/invoice-output'

describe('InvoiceService', () => {
  let service: InvoiceService
  let mockHttp: jest.Mocked<HttpClient>

  beforeEach(() => {
    mockHttp = {
      postJson: jest.fn(),
      postForm: jest.fn(),
      get: jest.fn()
    } as unknown as jest.Mocked<HttpClient>
  })

  it('should POST to correct path with service prefix', async () => {
    const taxCode = '0123456789'
    service = new InvoiceService(mockHttp, taxCode)

    const dto = {
      generalInvoiceInfo: {
        invoiceType: '1',
        templateCode: '1/0230',
        invoiceSeries: 'K25TII',
        currencyCode: 'VND',
        adjustmentType: '1'
      },
      buyerInfo: { buyerTaxCode: '9876543210' },
      itemInfo: [
        {
          lineNumber: 1,
          itemName: 'Service',
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
    }

    const response: CreateInvoiceResp = {
      result: {
        invoiceNo: 'INV-001',
        transactionID: 'txn-123'
      }
    }

    mockHttp.postJson.mockResolvedValue(response)

    const result = await service.createInvoice(dto)

    expect(result).toEqual(response)
    expect(mockHttp.postJson).toHaveBeenCalledWith(
      '/services/einvoiceapplication/api/InvoiceAPI/InvoiceWS/createInvoice/0123456789',
      expect.objectContaining({
        generalInvoiceInfo: dto.generalInvoiceInfo,
        buyerInfo: dto.buyerInfo,
        itemInfo: dto.itemInfo
      })
    )
  })

  it('should throw ViettelValidationError on invalid input', async () => {
    service = new InvoiceService(mockHttp, '0123456789')

    const invalidDto = {
      generalInvoiceInfo: {
        invoiceType: '1',
        templateCode: '1/0230',
        invoiceSeries: 'K25TII',
        currencyCode: 'VND',
        adjustmentType: '3'
        // Missing required fields for adjustmentType=3
      }
    }

    await expect(service.createInvoice(invalidDto)).rejects.toBeInstanceOf(ViettelValidationError)
  })

  it('should validate and include validation error details', async () => {
    service = new InvoiceService(mockHttp, '0123456789')

    const invalidDto = {
      generalInvoiceInfo: {
        invoiceType: '1',
        templateCode: '1/0230',
        invoiceSeries: 'K25TII',
        currencyCode: 'VND',
        adjustmentType: '3'
        // Missing required fields
      }
    }

    try {
      await service.createInvoice(invalidDto)
      fail('Should have thrown ViettelValidationError')
    } catch (err) {
      expect(err).toBeInstanceOf(ViettelValidationError)
      if (err instanceof ViettelValidationError) {
        expect(err.issues.length).toBeGreaterThan(0)
        expect(err.issues[0]).toHaveProperty('path')
        expect(err.issues[0]).toHaveProperty('message')
      }
    }
  })

  it('should use correct field names: payments, meterReading, fuelReading', async () => {
    const taxCode = '9876543210'
    service = new InvoiceService(mockHttp, taxCode)

    const dto = {
      generalInvoiceInfo: {
        invoiceType: '1',
        templateCode: '1/0230',
        invoiceSeries: 'K25TII',
        currencyCode: 'VND',
        adjustmentType: '1'
      },
      buyerInfo: { buyerTaxCode: '0123456789' },
      itemInfo: [
        {
          lineNumber: 1,
          itemName: 'Service',
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
      payments: [
        { paymentMethodName: 'TM/CK', amount: 1100000 }
      ],
      meterReading: [
        {
          previousReading: 1000,
          currentReading: 1100
        }
      ],
      fuelReading: [
        {
          previousReading: 100,
          currentReading: 110,
          quantity: 10
        }
      ]
    }

    mockHttp.postJson.mockResolvedValue({
      result: { invoiceNo: 'INV-002' }
    })

    await service.createInvoice(dto)

    const callArgs = mockHttp.postJson.mock.calls[0]?.[1]
    expect(callArgs).toHaveProperty('payments')
    expect(callArgs).toHaveProperty('meterReading')
    expect(callArgs).toHaveProperty('fuelReading')
  })

  it('should accept money-adjust invoice with isIncreaseItem on items', async () => {
    service = new InvoiceService(mockHttp, '0123456789')

    const dto = {
      generalInvoiceInfo: {
        invoiceType: '1',
        templateCode: '1/0230',
        invoiceSeries: 'K25TII',
        currencyCode: 'VND',
        adjustmentType: '5',
        adjustmentInvoiceType: '1',
        originalInvoiceId: 'INV-001',
        originalInvoiceIssueDate: Date.now(),
        originalTemplateCode: '1/0230',
        additionalReferenceDesc: 'Money adjust',
        additionalReferenceDate: Date.now(),
        adjustedNote: 'Update pricing'
      },
      itemInfo: [
        {
          lineNumber: 1,
          itemName: 'Service',
          unitPrice: 500000,
          quantity: 1,
          itemTotalAmountWithoutTax: 500000,
          taxPercentage: 10,
          taxAmount: 50000,
          isIncreaseItem: '1'
        }
      ],
      summarizeInfo: {
        totalAmountWithoutTax: 500000,
        totalAmountWithTax: 550000
      },
      payments: [{ paymentMethodName: 'TM/CK' }]
    }

    mockHttp.postJson.mockResolvedValue({
      result: { invoiceNo: 'INV-002' }
    })

    const result = await service.createInvoice(dto)
    expect(result).toBeDefined()
    expect(mockHttp.postJson).toHaveBeenCalled()
  })

  it('should accept info-adjust invoice without itemInfo', async () => {
    service = new InvoiceService(mockHttp, '0123456789')

    const dto = {
      generalInvoiceInfo: {
        invoiceType: '1',
        templateCode: '1/0230',
        invoiceSeries: 'K25TII',
        currencyCode: 'VND',
        adjustmentType: '5',
        adjustmentInvoiceType: '2',
        originalInvoiceId: 'INV-001',
        originalInvoiceIssueDate: Date.now(),
        originalTemplateCode: '1/0230',
        additionalReferenceDesc: 'Info adjust',
        additionalReferenceDate: Date.now(),
        adjustedNote: 'Correct buyer name'
      },
      summarizeInfo: {
        totalAmountWithoutTax: 1000000,
        totalAmountWithTax: 1100000
      },
      payments: [{ paymentMethodName: 'TM/CK' }]
    }

    mockHttp.postJson.mockResolvedValue({
      result: { invoiceNo: 'INV-003' }
    })

    const result = await service.createInvoice(dto)
    expect(result).toBeDefined()
    expect(mockHttp.postJson).toHaveBeenCalled()
  })

  it('should pass through HttpClient response as-is', async () => {
    service = new InvoiceService(mockHttp, '0123456789')

    const expectedResponse: CreateInvoiceResp = {
      result: {
        invoiceNo: 'INV-999',
        transactionID: 'txn-abc',
        reservationCode: 'RES-123',
        codeOfTax: 'TAX-001'
      }
    }

    mockHttp.postJson.mockResolvedValue(expectedResponse)

    const dto = {
      generalInvoiceInfo: {
        invoiceType: '1',
        templateCode: '1/0230',
        invoiceSeries: 'K25TII',
        currencyCode: 'VND',
        adjustmentType: '1'
      },
      summarizeInfo: {
        totalAmountWithoutTax: 1000000,
        totalAmountWithTax: 1100000
      }
    }

    const result = await service.createInvoice(dto)
    expect(result).toEqual(expectedResponse)
    expect(result.result?.invoiceNo).toBe('INV-999')
    expect(result.result?.transactionID).toBe('txn-abc')
  })

  it('should handle error response from HttpClient', async () => {
    service = new InvoiceService(mockHttp, '0123456789')

    const error = new Error('Network error')
    mockHttp.postJson.mockRejectedValue(error)

    const dto = {
      generalInvoiceInfo: {
        invoiceType: '1',
        templateCode: '1/0230',
        invoiceSeries: 'K25TII',
        currencyCode: 'VND',
        adjustmentType: '1'
      },
      summarizeInfo: {
        totalAmountWithoutTax: 1000000,
        totalAmountWithTax: 1100000
      }
    }

    await expect(service.createInvoice(dto)).rejects.toThrow('Network error')
  })

  it('should validate before calling postJson', async () => {
    service = new InvoiceService(mockHttp, '0123456789')

    const invalidDto = { generalInvoiceInfo: { invoiceType: 'invalid' } }

    await expect(service.createInvoice(invalidDto)).rejects.toBeInstanceOf(ViettelValidationError)
    expect(mockHttp.postJson).not.toHaveBeenCalled()
  })

  it('should use different tax codes for different service instances', async () => {
    const service1 = new InvoiceService(mockHttp, '0000000001')
    const service2 = new InvoiceService(mockHttp, '0000000002')

    mockHttp.postJson.mockResolvedValue({ result: { invoiceNo: 'INV' } })

    const dto = {
      generalInvoiceInfo: {
        invoiceType: '1',
        templateCode: '1/0230',
        invoiceSeries: 'K25TII',
        currencyCode: 'VND',
        adjustmentType: '1'
      },
      summarizeInfo: {
        totalAmountWithoutTax: 1000000,
        totalAmountWithTax: 1100000
      }
    }

    await service1.createInvoice(dto)
    await service2.createInvoice(dto)

    const call1 = mockHttp.postJson.mock.calls[0]?.[0]
    const call2 = mockHttp.postJson.mock.calls[1]?.[0]

    expect(call1).toContain('0000000001')
    expect(call2).toContain('0000000002')
  })
})
