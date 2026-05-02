import axios from 'axios'
import { ViettelApiError, ViettelAuthError, ViettelNetworkError, ViettelValidationError, mapError } from '../../src/http/errors'

describe('Error Classes', () => {
  describe('ViettelApiError', () => {
    it('should create error with all properties', () => {
      const error = new ViettelApiError('ERR-001', 'API Error', 500, { raw: 'data' })

      expect(error.message).toBe('API Error')
      expect(error.errorCode).toBe('ERR-001')
      expect(error.httpStatus).toBe(500)
      expect(error.raw).toEqual({ raw: 'data' })
      expect(error.name).toBe('ViettelApiError')
      expect(error).toBeInstanceOf(Error)
    })

    it('should create error with minimal properties', () => {
      const error = new ViettelApiError('ERR-002', 'Error')

      expect(error.message).toBe('Error')
      expect(error.errorCode).toBe('ERR-002')
      expect(error.httpStatus).toBeUndefined()
      expect(error.raw).toBeUndefined()
    })

    it('should be stackable', () => {
      const error = new ViettelApiError('ERR-003', 'Nested')
      expect(error.stack).toBeDefined()
      expect(error.stack).toContain('ViettelApiError')
    })
  })

  describe('ViettelAuthError', () => {
    it('should inherit from ViettelApiError', () => {
      const error = new ViettelAuthError('AUTH-401', 'Unauthorized', 401)

      expect(error).toBeInstanceOf(ViettelApiError)
      expect(error).toBeInstanceOf(ViettelAuthError)
      expect(error.name).toBe('ViettelAuthError')
      expect(error.errorCode).toBe('AUTH-401')
      expect(error.httpStatus).toBe(401)
    })

    it('should support raw response data', () => {
      const rawData = { errorCode: 'INVALID_TOKEN', description: 'Token expired' }
      const error = new ViettelAuthError('AUTH-403', 'Forbidden', 403, rawData)

      expect(error.raw).toEqual(rawData)
    })
  })

  describe('ViettelNetworkError', () => {
    it('should create network error', () => {
      const error = new ViettelNetworkError('Connection timeout')

      expect(error.message).toBe('Connection timeout')
      expect(error.name).toBe('ViettelNetworkError')
      expect(error).toBeInstanceOf(Error)
    })

    it('should not have errorCode property', () => {
      const error = new ViettelNetworkError('Network failed')

      expect((error as any).errorCode).toBeUndefined()
    })
  })

  describe('ViettelValidationError', () => {
    it('should format validation issues into message', () => {
      const issues = [
        { path: 'generalInvoiceInfo.invoiceType', message: 'Invalid enum value' },
        { path: 'itemInfo.0.itemName', message: 'String too short' }
      ]
      const error = new ViettelValidationError(issues)

      expect(error.message).toContain('generalInvoiceInfo.invoiceType: Invalid enum value')
      expect(error.message).toContain('itemInfo.0.itemName: String too short')
      expect(error.issues).toEqual(issues)
      expect(error.name).toBe('ViettelValidationError')
    })

    it('should handle single issue', () => {
      const issues = [{ path: 'field', message: 'Required' }]
      const error = new ViettelValidationError(issues)

      expect(error.message).toBe('Validation failed: field: Required')
    })

    it('should handle empty issues array', () => {
      const error = new ViettelValidationError([])

      expect(error.message).toBe('Validation failed: ')
      expect(error.issues).toEqual([])
    })
  })

  describe('mapError function', () => {
    it('should throw ViettelAuthError on 401 response', () => {
      const axiosError = new axios.AxiosError('Unauthorized')
      axiosError.response = {
        status: 401,
        data: { errorCode: 'INVALID_TOKEN', description: 'Token expired' },
        statusText: 'Unauthorized',
        headers: {},
        config: { url: '/' } as any
      }

      expect(() => mapError(axiosError)).toThrow(ViettelAuthError)
      try {
        mapError(axiosError)
      } catch (e) {
        expect(e).toBeInstanceOf(ViettelAuthError)
        if (e instanceof ViettelAuthError) {
          expect(e.httpStatus).toBe(401)
          expect(e.errorCode).toBe('INVALID_TOKEN')
        }
      }
    })

    it('should throw ViettelAuthError on 403 response', () => {
      const axiosError = new axios.AxiosError('Forbidden')
      axiosError.response = {
        status: 403,
        data: { errorCode: 'FORBIDDEN', description: 'Access denied' },
        statusText: 'Forbidden',
        headers: {},
        config: { url: '/' } as any
      }

      try {
        mapError(axiosError)
      } catch (e) {
        expect(e).toBeInstanceOf(ViettelAuthError)
        if (e instanceof ViettelAuthError) {
          expect(e.httpStatus).toBe(403)
        }
      }
    })

    it('should throw ViettelApiError on 4xx/5xx response', () => {
      const axiosError = new axios.AxiosError('Bad Request')
      axiosError.response = {
        status: 400,
        data: { errorCode: 'BAD_INPUT', description: 'Invalid field' },
        statusText: 'Bad Request',
        headers: {},
        config: { url: '/' } as any
      }

      try {
        mapError(axiosError)
      } catch (e) {
        expect(e).toBeInstanceOf(ViettelApiError)
        expect(e).not.toBeInstanceOf(ViettelAuthError)
        if (e instanceof ViettelApiError) {
          expect(e.errorCode).toBe('BAD_INPUT')
          expect(e.httpStatus).toBe(400)
        }
      }
    })

    it('should use status code as errorCode when missing in response', () => {
      const axiosError = new axios.AxiosError('Server Error')
      axiosError.response = {
        status: 500,
        data: { description: 'Internal server error' }, // No errorCode
        statusText: 'Internal Server Error',
        headers: {},
        config: { url: '/' } as any
      }

      try {
        mapError(axiosError)
      } catch (e) {
        if (e instanceof ViettelApiError) {
          expect(e.errorCode).toBe('500')
        }
      }
    })

    it('should throw ViettelNetworkError on network failure without response', () => {
      const axiosError = new axios.AxiosError('Network Error')
      axiosError.response = undefined

      try {
        mapError(axiosError)
      } catch (e) {
        expect(e).toBeInstanceOf(ViettelNetworkError)
        if (e instanceof ViettelNetworkError) {
          expect(e.message).toBe('Network Error')
        }
      }
    })

    it('should rethrow non-axios errors', () => {
      const originalError = new Error('Custom error')

      expect(() => mapError(originalError)).toThrow('Custom error')
    })

    it('should use error message from axios error when description missing', () => {
      const axiosError = new axios.AxiosError('Connection timeout')
      axiosError.response = {
        status: 502,
        data: {}, // No description
        statusText: 'Bad Gateway',
        headers: {},
        config: { url: '/' } as any
      }

      try {
        mapError(axiosError)
      } catch (e) {
        if (e instanceof ViettelApiError) {
          expect(e.message).toBe('Connection timeout')
        }
      }
    })
  })
})
