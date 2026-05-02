import {
  API_PATH_PREFIX,
  PATH_CREATE_INVOICE,
  PATH_USB_HASH,
  PATH_CANCEL,
  PATH_SEARCH_BY_UUID,
  PATH_LIST,
  PATH_FILE,
  PATH_TEMPLATES,
  PATH_AUTH_LOGIN
} from '../../src/http/paths'

describe('HTTP Paths', () => {
  it('should define correct API_PATH_PREFIX', () => {
    expect(API_PATH_PREFIX).toBe('/services/einvoiceapplication/api')
  })

  describe('PATH_CREATE_INVOICE', () => {
    it('should format path with tax code', () => {
      const taxCode = '0123456789'
      const path = PATH_CREATE_INVOICE(taxCode)

      expect(path).toBe('/services/einvoiceapplication/api/InvoiceAPI/InvoiceWS/createInvoice/0123456789')
      expect(path).toContain(taxCode)
    })

    it('should work with different tax codes', () => {
      expect(PATH_CREATE_INVOICE('1111111111')).toContain('1111111111')
      expect(PATH_CREATE_INVOICE('9999999999')).toContain('9999999999')
    })

    it('should include service prefix', () => {
      const path = PATH_CREATE_INVOICE('0000000000')
      expect(path.startsWith(API_PATH_PREFIX)).toBe(true)
    })
  })

  describe('PATH_USB_HASH', () => {
    it('should format path with tax code', () => {
      const taxCode = '0123456789'
      const path = PATH_USB_HASH(taxCode)

      expect(path).toBe('/services/einvoiceapplication/api/InvoiceAPI/InvoiceWS/createInvoiceUsbTokenGetHash/0123456789')
      expect(path).toContain(taxCode)
    })

    it('should include service prefix', () => {
      const path = PATH_USB_HASH('0000000000')
      expect(path.startsWith(API_PATH_PREFIX)).toBe(true)
    })
  })

  describe('PATH_CANCEL', () => {
    it('should be static path', () => {
      expect(PATH_CANCEL).toBe('/services/einvoiceapplication/api/InvoiceAPI/InvoiceWS/cancelTransactionInvoice')
    })

    it('should include service prefix', () => {
      expect(PATH_CANCEL.startsWith(API_PATH_PREFIX)).toBe(true)
    })

    it('should not contain variable parts', () => {
      expect(PATH_CANCEL).not.toContain('{')
      expect(PATH_CANCEL).not.toContain('}')
    })
  })

  describe('PATH_SEARCH_BY_UUID', () => {
    it('should be static path', () => {
      expect(PATH_SEARCH_BY_UUID).toBe('/services/einvoiceapplication/api/InvoiceAPI/InvoiceWS/searchInvoiceByTransactionUuid')
    })

    it('should include service prefix', () => {
      expect(PATH_SEARCH_BY_UUID.startsWith(API_PATH_PREFIX)).toBe(true)
    })
  })

  describe('PATH_LIST', () => {
    it('should be static experimental path', () => {
      expect(PATH_LIST).toBe('/services/einvoiceapplication/api/InvoiceAPI/InvoiceUtilsWS/getListInvoiceDataControl')
    })

    it('should include service prefix', () => {
      expect(PATH_LIST.startsWith(API_PATH_PREFIX)).toBe(true)
    })
  })

  describe('PATH_FILE', () => {
    it('should be static experimental path', () => {
      expect(PATH_FILE).toBe('/services/einvoiceapplication/api/InvoiceAPI/InvoiceUtilsWS/getInvoiceRepresentationFile')
    })

    it('should include service prefix', () => {
      expect(PATH_FILE.startsWith(API_PATH_PREFIX)).toBe(true)
    })
  })

  describe('PATH_TEMPLATES', () => {
    it('should be static experimental path', () => {
      expect(PATH_TEMPLATES).toBe('/services/einvoiceapplication/api/InvoiceAPI/InvoiceUtilsWS/getInvoiceTemplates')
    })

    it('should include service prefix', () => {
      expect(PATH_TEMPLATES.startsWith(API_PATH_PREFIX)).toBe(true)
    })
  })

  describe('PATH_AUTH_LOGIN', () => {
    it('should be static auth path', () => {
      expect(PATH_AUTH_LOGIN).toBe('/auth/login')
    })

    it('should not include service prefix', () => {
      expect(PATH_AUTH_LOGIN).not.toContain(API_PATH_PREFIX)
    })
  })

  describe('Path consistency', () => {
    it('all paths should start with /', () => {
      const paths = [
        PATH_CREATE_INVOICE('000'),
        PATH_USB_HASH('000'),
        PATH_CANCEL,
        PATH_SEARCH_BY_UUID,
        PATH_LIST,
        PATH_FILE,
        PATH_TEMPLATES,
        PATH_AUTH_LOGIN
      ]

      paths.forEach(path => {
        expect(path.startsWith('/')).toBe(true)
      })
    })

    it('service prefix paths should be consistent', () => {
      const servicePaths = [
        PATH_CREATE_INVOICE('000'),
        PATH_USB_HASH('000'),
        PATH_CANCEL,
        PATH_SEARCH_BY_UUID,
        PATH_LIST,
        PATH_FILE,
        PATH_TEMPLATES
      ]

      servicePaths.forEach(path => {
        expect(path.startsWith(API_PATH_PREFIX)).toBe(true)
      })
    })
  })
})
