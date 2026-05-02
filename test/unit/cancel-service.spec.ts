import { CancelService } from '../../src/services/cancel-service'
import { ViettelValidationError } from '../../src/http/errors'
import { HttpClient } from '../../src/http/http-client'
import type { CancelInvoiceResp } from '../../src/types/invoice-output'

describe('CancelService', () => {
  let service: CancelService
  let mockHttp: jest.Mocked<HttpClient>

  beforeEach(() => {
    mockHttp = {
      postJson: jest.fn(),
      postForm: jest.fn(),
      get: jest.fn()
    } as unknown as jest.Mocked<HttpClient>
    service = new CancelService(mockHttp)
  })

  it('should call postForm (not postJson) for cancel', async () => {
    const now = Date.now()
    const payload = {
      supplierTaxCode: '0123456789',
      templateCode: '1/0230',
      invoiceNo: 'INV-001',
      strIssueDate: now,
      additionalReferenceDesc: 'Cancel invoice',
      additionalReferenceDate: now
    }

    const response: CancelInvoiceResp = {
      result: true
    }

    mockHttp.postForm.mockResolvedValue(response)

    const result = await service.cancelInvoice(payload)

    expect(result).toEqual(response)
    expect(mockHttp.postForm).toHaveBeenCalledWith(
      '/services/einvoiceapplication/api/InvoiceAPI/InvoiceWS/cancelTransactionInvoice',
      expect.objectContaining({
        supplierTaxCode: '0123456789',
        templateCode: '1/0230',
        invoiceNo: 'INV-001'
      })
    )
    expect(mockHttp.postJson).not.toHaveBeenCalled()
  })

  it('should pass strIssueDate as epoch ms number', async () => {
    const issueDate = 1704067200000 // 2024-01-01
    const referenceDate = 1704153600000 // 2024-01-02

    const payload = {
      supplierTaxCode: '0123456789',
      templateCode: '1/0230',
      invoiceNo: 'INV-002',
      strIssueDate: issueDate,
      additionalReferenceDesc: 'Duplicate invoice',
      additionalReferenceDate: referenceDate
    }

    mockHttp.postForm.mockResolvedValue({ result: true })

    await service.cancelInvoice(payload)

    const callArgs = mockHttp.postForm.mock.calls[0]?.[1]
    expect(callArgs?.strIssueDate).toBe(issueDate)
    expect(callArgs?.additionalReferenceDate).toBe(referenceDate)
  })

  it('should reject missing required fields', async () => {
    const incompletPayload = {
      supplierTaxCode: '0123456789'
      // Missing other required fields
    }

    await expect(service.cancelInvoice(incompletPayload)).rejects.toBeInstanceOf(
      ViettelValidationError
    )
    expect(mockHttp.postForm).not.toHaveBeenCalled()
  })

  it('should throw ViettelValidationError on invalid input', async () => {
    const invalidPayload = {
      supplierTaxCode: '0123456789',
      templateCode: '1/0230',
      invoiceNo: 'INV-001',
      strIssueDate: 'not-a-number', // Invalid: should be number
      additionalReferenceDesc: 'Cancel',
      additionalReferenceDate: Date.now()
    }

    await expect(service.cancelInvoice(invalidPayload)).rejects.toBeInstanceOf(
      ViettelValidationError
    )
  })

  it('should validate all required fields before calling postForm', async () => {
    const incompletePayload = {
      supplierTaxCode: '0123456789',
      templateCode: '1/0230'
      // Missing: invoiceNo, strIssueDate, additionalReferenceDesc, additionalReferenceDate
    }

    await expect(service.cancelInvoice(incompletePayload)).rejects.toBeInstanceOf(
      ViettelValidationError
    )
    expect(mockHttp.postForm).not.toHaveBeenCalled()
  })

  it('should accept optional reasonDelete', async () => {
    const payload = {
      supplierTaxCode: '0123456789',
      templateCode: '1/0230',
      invoiceNo: 'INV-003',
      strIssueDate: Date.now(),
      additionalReferenceDesc: 'Cancelled',
      additionalReferenceDate: Date.now(),
      reasonDelete: 'Issued by mistake'
    }

    mockHttp.postForm.mockResolvedValue({ result: true })

    const result = await service.cancelInvoice(payload)
    expect(result).toEqual({ result: true })
    expect(mockHttp.postForm).toHaveBeenCalled()
  })

  it('should pass through postForm response as-is', async () => {
    const expectedResponse: CancelInvoiceResp = {
      result: true
    }

    mockHttp.postForm.mockResolvedValue(expectedResponse)

    const payload = {
      supplierTaxCode: '0123456789',
      templateCode: '1/0230',
      invoiceNo: 'INV-004',
      strIssueDate: Date.now(),
      additionalReferenceDesc: 'Cancel',
      additionalReferenceDate: Date.now()
    }

    const result = await service.cancelInvoice(payload)
    expect(result).toEqual(expectedResponse)
  })

  it('should handle error response with errorCode and description', async () => {
    const errorResponse: CancelInvoiceResp = {
      errorCode: 'ERR-001',
      description: 'Invoice not found'
    }

    mockHttp.postForm.mockResolvedValue(errorResponse)

    const payload = {
      supplierTaxCode: '0123456789',
      templateCode: '1/0230',
      invoiceNo: 'INV-NOTFOUND',
      strIssueDate: Date.now(),
      additionalReferenceDesc: 'Cancel',
      additionalReferenceDate: Date.now()
    }

    const result = await service.cancelInvoice(payload)
    expect(result.errorCode).toBe('ERR-001')
    expect(result.description).toBe('Invoice not found')
  })

  it('should handle HttpClient network errors', async () => {
    const networkError = new Error('Connection timeout')
    mockHttp.postForm.mockRejectedValue(networkError)

    const payload = {
      supplierTaxCode: '0123456789',
      templateCode: '1/0230',
      invoiceNo: 'INV-005',
      strIssueDate: Date.now(),
      additionalReferenceDesc: 'Cancel',
      additionalReferenceDate: Date.now()
    }

    await expect(service.cancelInvoice(payload)).rejects.toThrow('Connection timeout')
  })

  it('should include validation error details in thrown exception', async () => {
    const invalidPayload = {
      supplierTaxCode: '0123456789'
      // Missing required fields
    }

    try {
      await service.cancelInvoice(invalidPayload)
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

  it('should reject strIssueDate as non-integer number', async () => {
    const payload = {
      supplierTaxCode: '0123456789',
      templateCode: '1/0230',
      invoiceNo: 'INV-006',
      strIssueDate: 1704067200000.5, // Float, should be int
      additionalReferenceDesc: 'Cancel',
      additionalReferenceDate: Date.now()
    }

    await expect(service.cancelInvoice(payload)).rejects.toBeInstanceOf(
      ViettelValidationError
    )
  })

  it('should reject additionalReferenceDate as non-integer number', async () => {
    const payload = {
      supplierTaxCode: '0123456789',
      templateCode: '1/0230',
      invoiceNo: 'INV-007',
      strIssueDate: Date.now(),
      additionalReferenceDesc: 'Cancel',
      additionalReferenceDate: Date.now() + 0.5 // Float, should be int
    }

    await expect(service.cancelInvoice(payload)).rejects.toBeInstanceOf(
      ViettelValidationError
    )
  })

  it('should post to correct cancel path', async () => {
    const payload = {
      supplierTaxCode: '0123456789',
      templateCode: '1/0230',
      invoiceNo: 'INV-008',
      strIssueDate: Date.now(),
      additionalReferenceDesc: 'Duplicate',
      additionalReferenceDate: Date.now()
    }

    mockHttp.postForm.mockResolvedValue({ result: true })

    await service.cancelInvoice(payload)

    const callPath = mockHttp.postForm.mock.calls[0]?.[0]
    expect(callPath).toBe('/services/einvoiceapplication/api/InvoiceAPI/InvoiceWS/cancelTransactionInvoice')
  })

  it('should cast payload to Record<string, unknown> before posting', async () => {
    const payload = {
      supplierTaxCode: '0123456789',
      templateCode: '1/0230',
      invoiceNo: 'INV-009',
      strIssueDate: Date.now(),
      additionalReferenceDesc: 'Cancel for real',
      additionalReferenceDate: Date.now(),
      reasonDelete: 'Testing cast'
    }

    mockHttp.postForm.mockResolvedValue({ result: true })

    await service.cancelInvoice(payload)

    expect(mockHttp.postForm).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        supplierTaxCode: '0123456789',
        invoiceNo: 'INV-009'
      })
    )
  })

  it('should handle large numeric values for date fields', async () => {
    const farFutureDate = 9999999999999 // Year 286,331
    const payload = {
      supplierTaxCode: '0123456789',
      templateCode: '1/0230',
      invoiceNo: 'INV-010',
      strIssueDate: farFutureDate,
      additionalReferenceDesc: 'Cancel',
      additionalReferenceDate: farFutureDate
    }

    mockHttp.postForm.mockResolvedValue({ result: true })

    const result = await service.cancelInvoice(payload)
    expect(result).toEqual({ result: true })
  })
})
