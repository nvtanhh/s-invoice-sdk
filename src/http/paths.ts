export const API_PATH_PREFIX = '/services/einvoiceapplication/api'

export const PATH_CREATE_INVOICE = (taxCode: string) =>
  `${API_PATH_PREFIX}/InvoiceAPI/InvoiceWS/createInvoice/${taxCode}`

export const PATH_USB_HASH = (taxCode: string) =>
  `${API_PATH_PREFIX}/InvoiceAPI/InvoiceWS/createInvoiceUsbTokenGetHash/${taxCode}`

export const PATH_CANCEL = `${API_PATH_PREFIX}/InvoiceAPI/InvoiceWS/cancelTransactionInvoice`

export const PATH_SEARCH_BY_UUID = `${API_PATH_PREFIX}/InvoiceAPI/InvoiceWS/searchInvoiceByTransactionUuid`

// experimental — wire format not verified against samples
export const PATH_LIST = `${API_PATH_PREFIX}/InvoiceAPI/InvoiceUtilsWS/getListInvoiceDataControl`

export const PATH_FILE = `${API_PATH_PREFIX}/InvoiceAPI/InvoiceUtilsWS/getInvoiceRepresentationFile`

export const PATH_TEMPLATES = `${API_PATH_PREFIX}/InvoiceAPI/InvoiceUtilsWS/getInvoiceTemplates`

export const PATH_AUTH_LOGIN = '/auth/login'
