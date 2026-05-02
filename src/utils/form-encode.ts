/**
 * Endpoints that use application/x-www-form-urlencoded (verified from Java samples):
 * - cancelTransactionInvoice
 * - searchInvoiceByTransactionUuid
 *
 * All other endpoints use application/json.
 */
export const FORM_ENCODED_ENDPOINTS = [
  '/InvoiceAPI/InvoiceWS/cancelTransactionInvoice',
  '/InvoiceAPI/InvoiceWS/searchInvoiceByTransactionUuid'
] as const

export type FormEncodedEndpoint = typeof FORM_ENCODED_ENDPOINTS[number]
