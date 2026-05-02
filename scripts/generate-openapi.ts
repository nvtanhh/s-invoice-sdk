import { OpenApiGeneratorV31, OpenAPIRegistry } from '@asteasolutions/zod-to-openapi'
import { writeFileSync } from 'node:fs'
import { z } from 'zod'
import * as YAML from 'yaml'
import {
  CreateInvoiceWSDTOSchema,
  CancelTransactionWSDTOSchema,
  SearchByTransUUIDDTOSchema,
  GetInvoiceInputSchema,
  BuyerInfoSchema,
  SellerInfoSchema,
  ItemInfoSchema,
  TaxBreakDownsInfoSchema,
  SummarizeInfoSchema,
  MetaDataInfoSchema,
  MeterReadingInfoSchema,
  FuelReadingInfoSchema,
  QrCodeInfoSchema,
  PaymentInfoSchema,
  GeneralInvoiceInfoSchema
} from '../src/schemas/invoice-input.schema.js'
import { API_PATH_PREFIX } from '../src/http/paths.js'

const registry = new OpenAPIRegistry()

// Register component schemas
registry.register('BuyerInfo', BuyerInfoSchema)
registry.register('SellerInfo', SellerInfoSchema)
registry.register('ItemInfo', ItemInfoSchema)
registry.register('TaxBreakDownsInfo', TaxBreakDownsInfoSchema)
registry.register('SummarizeInfo', SummarizeInfoSchema)
registry.register('MetaDataInfo', MetaDataInfoSchema)
registry.register('MeterReadingInfo', MeterReadingInfoSchema)
registry.register('FuelReadingInfo', FuelReadingInfoSchema)
registry.register('QrCodeInfo', QrCodeInfoSchema)
registry.register('PaymentInfo', PaymentInfoSchema)
registry.register('GeneralInvoiceInfo', GeneralInvoiceInfoSchema)
registry.register('CreateInvoiceWSDTO', CreateInvoiceWSDTOSchema)
registry.register('CancelTransactionWSDTO', CancelTransactionWSDTOSchema)
registry.register('SearchByTransUUIDDTO', SearchByTransUUIDDTOSchema)
registry.register('GetInvoiceInput', GetInvoiceInputSchema)

// Response schemas (inline — no separate Zod schema file for outputs yet)
const CreateInvoiceRespSchema = z.object({
  errorCode: z.string().optional(),
  description: z.string().optional(),
  result: z.object({
    invoiceNo: z.string(),
    transactionID: z.string().optional(),
    reservationCode: z.string().optional(),
    codeOfTax: z.string().optional()
  }).optional()
}).openapi('CreateInvoiceResp')

const CancelInvoiceRespSchema = z.object({
  errorCode: z.string().optional(),
  description: z.string().optional(),
  result: z.boolean().optional()
}).openapi('CancelInvoiceResp')

const SearchUUIDRespSchema = z.object({
  errorCode: z.string().optional(),
  description: z.string().optional(),
  result: z.object({
    invoiceNo: z.string(),
    status: z.number(),
    issueDate: z.number(),
    reservationCode: z.string().optional(),
    codeOfTax: z.string().optional()
  }).optional()
}).openapi('SearchUUIDResp')

const HashResultRespSchema = z.object({
  errorCode: z.string().optional(),
  description: z.string().optional(),
  result: z.object({
    hash: z.string(),
    transactionUuid: z.string()
  }).optional()
}).openapi('HashResultResp')

const InvoiceSearchRespSchema = z.object({
  invoices: z.array(z.record(z.unknown())),
  total: z.number(),
  pageNum: z.number()
}).openapi('InvoiceSearchResp')

const GetInvoiceFileRespSchema = z.object({
  fileBytes: z.string().describe('base64-encoded file content'),
  fileName: z.string()
}).openapi('GetInvoiceFileResp')

const GetInvoiceTemplatesRespSchema = z.object({
  errorCode: z.string().optional(),
  description: z.string().optional(),
  result: z.array(z.object({
    templateCode: z.string(),
    templateName: z.string(),
    invoiceSeries: z.string()
  })).optional()
}).openapi('GetInvoiceTemplatesResp')

registry.register('CreateInvoiceResp', CreateInvoiceRespSchema)
registry.register('CancelInvoiceResp', CancelInvoiceRespSchema)
registry.register('SearchUUIDResp', SearchUUIDRespSchema)
registry.register('HashResultResp', HashResultRespSchema)
registry.register('InvoiceSearchResp', InvoiceSearchRespSchema)
registry.register('GetInvoiceFileResp', GetInvoiceFileRespSchema)
registry.register('GetInvoiceTemplatesResp', GetInvoiceTemplatesRespSchema)

// ── Stable endpoints ─────────────────────────────────────────────────────────

registry.registerPath({
  method: 'post',
  path: `${API_PATH_PREFIX}/InvoiceAPI/InvoiceWS/createInvoice/{taxCode}`,
  tags: ['Invoice (Stable)'],
  summary: 'Create invoice (new / replace / adjust)',
  request: {
    params: z.object({ taxCode: z.string().describe('Supplier tax code') }),
    body: {
      content: { 'application/json': { schema: CreateInvoiceWSDTOSchema } },
      required: true
    }
  },
  responses: {
    200: {
      description: 'Invoice created',
      content: { 'application/json': { schema: CreateInvoiceRespSchema } }
    }
  }
})

registry.registerPath({
  method: 'post',
  path: `${API_PATH_PREFIX}/InvoiceAPI/InvoiceWS/cancelTransactionInvoice`,
  tags: ['Invoice (Stable)'],
  summary: 'Cancel an invoice',
  request: {
    body: {
      content: { 'application/x-www-form-urlencoded': { schema: CancelTransactionWSDTOSchema } },
      required: true
    }
  },
  responses: {
    200: {
      description: 'Cancel result',
      content: { 'application/json': { schema: CancelInvoiceRespSchema } }
    }
  }
})

registry.registerPath({
  method: 'post',
  path: `${API_PATH_PREFIX}/InvoiceAPI/InvoiceWS/searchInvoiceByTransactionUuid`,
  tags: ['Invoice (Stable)'],
  summary: 'Search invoice by transaction UUID',
  request: {
    body: {
      content: { 'application/x-www-form-urlencoded': { schema: SearchByTransUUIDDTOSchema } },
      required: true
    }
  },
  responses: {
    200: {
      description: 'Invoice detail',
      content: { 'application/json': { schema: SearchUUIDRespSchema } }
    }
  }
})

registry.registerPath({
  method: 'post',
  path: `${API_PATH_PREFIX}/InvoiceAPI/InvoiceWS/createInvoiceUsbTokenGetHash/{taxCode}`,
  tags: ['Invoice (Stable)'],
  summary: 'Get hash for USB-token signing',
  request: {
    params: z.object({ taxCode: z.string() }),
    body: {
      content: { 'application/json': { schema: CreateInvoiceWSDTOSchema } },
      required: true
    }
  },
  responses: {
    200: {
      description: 'Hash result',
      content: { 'application/json': { schema: HashResultRespSchema } }
    }
  }
})

// ── Experimental endpoints ────────────────────────────────────────────────────

registry.registerPath({
  method: 'post',
  path: `${API_PATH_PREFIX}/InvoiceAPI/InvoiceUtilsWS/getListInvoiceDataControl`,
  tags: ['Experimental'],
  summary: '[Experimental] List invoices by date range',
  description: 'Wire format verified against existing viettel-s-invoice TS package. fromDate/toDate must be dd/MM/yyyy.',
  request: {
    body: {
      content: { 'application/json': { schema: GetInvoiceInputSchema } },
      required: true
    }
  },
  responses: {
    200: {
      description: 'Invoice list',
      content: { 'application/json': { schema: InvoiceSearchRespSchema } }
    }
  }
})

registry.registerPath({
  method: 'post',
  path: `${API_PATH_PREFIX}/InvoiceAPI/InvoiceUtilsWS/getInvoiceRepresentationFile`,
  tags: ['Experimental'],
  summary: '[Experimental] Get invoice PDF/ZIP file',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            supplierTaxCode: z.string(),
            invoiceNo: z.string(),
            templateCode: z.string(),
            fileType: z.enum(['PDF', 'ZIP'])
          })
        }
      },
      required: true
    }
  },
  responses: {
    200: {
      description: 'File content (base64)',
      content: { 'application/json': { schema: GetInvoiceFileRespSchema } }
    }
  }
})

registry.registerPath({
  method: 'post',
  path: `${API_PATH_PREFIX}/InvoiceAPI/InvoiceUtilsWS/getInvoiceTemplates`,
  tags: ['Experimental'],
  summary: '[Experimental] Get invoice templates',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({ taxCode: z.string(), invoiceType: z.enum(['1', '2', '6']) })
        }
      },
      required: true
    }
  },
  responses: {
    200: {
      description: 'Template list',
      content: { 'application/json': { schema: GetInvoiceTemplatesRespSchema } }
    }
  }
})

// ── Generate ──────────────────────────────────────────────────────────────────

const generator = new OpenApiGeneratorV31(registry.definitions)
const doc = generator.generateDocument({
  openapi: '3.1.0',
  info: {
    title: 'Viettel VinInvoice SDK API',
    version: '1.0.0',
    description: 'TypeScript SDK for Viettel VinInvoice e-invoice API. Stable endpoints are verified against Java sample code; Experimental endpoints are sourced from DTO shapes and require sandbox confirmation.'
  },
  servers: [
    { url: 'https://vinvoice.viettel.vn/api', description: 'Production' },
    { url: 'https://api-vinvoice.viettel.vn', description: 'Production (alt)' }
  ]
})

writeFileSync('openapi.yaml', YAML.stringify(doc))
console.log('openapi.yaml generated')
