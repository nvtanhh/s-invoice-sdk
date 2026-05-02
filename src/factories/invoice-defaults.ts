import type { GeneralInvoiceInfo } from '../types/invoice-input.js'

/**
 * Defaults for GTGT (VAT invoice, invoiceType='1').
 * Override templateCode/invoiceSeries to match your Viettel-issued template.
 */
export function newGtgtDefaults(): Partial<GeneralInvoiceInfo> {
  return {
    invoiceType: '1',
    templateCode: '1/0230',
    invoiceSeries: 'K25TII',
    currencyCode: 'VND',
    adjustmentType: '1'
  }
}

/**
 * Defaults for PXK (delivery note invoice, invoiceType='6').
 */
export function newPxkDefaults(): Partial<GeneralInvoiceInfo> {
  return {
    invoiceType: '6',
    templateCode: '6/0026',
    invoiceSeries: 'K24NAF',
    currencyCode: 'VND',
    adjustmentType: '1'
  }
}

/**
 * Defaults for BanHang (sales invoice, invoiceType='2').
 */
export function newBanHangDefaults(): Partial<GeneralInvoiceInfo> {
  return {
    invoiceType: '2',
    templateCode: '2/0022',
    invoiceSeries: 'K25TII',
    currencyCode: 'VND',
    adjustmentType: '1'
  }
}

// Milk variant: pass { templateCode: '1/0173', invoiceSeries: 'K24TJS' } over newGtgtDefaults()
// PXK-Milk: pass { templateCode: '6/0027', invoiceSeries: 'K24NAF' } over newPxkDefaults()
