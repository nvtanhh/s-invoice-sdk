import express from 'express'
import { fileURLToPath } from 'url'
import path from 'path'

let ViettelInvoiceClient, ViettelValidationError, ViettelAuthError, ViettelNetworkError, ViettelApiError, newGtgtDefaults

try {
  const sdk = await import('../../dist/index.js')
  ViettelInvoiceClient = sdk.ViettelInvoiceClient
  ViettelValidationError = sdk.ViettelValidationError
  ViettelAuthError = sdk.ViettelAuthError
  ViettelNetworkError = sdk.ViettelNetworkError
  ViettelApiError = sdk.ViettelApiError
  newGtgtDefaults = sdk.newGtgtDefaults
} catch (e) {
  if (e.code === 'ERR_MODULE_NOT_FOUND') {
    console.error('SDK not built. Run "npm run build" in repo root first.')
    process.exit(1)
  }
  throw e
}

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT ?? 3000

app.use(express.json({ limit: '1mb' }))
app.use(express.static(path.join(__dirname, 'public')))

function buildClient({ baseUrl, username, password, taxCode }) {
  if (!baseUrl || !username || !password || !taxCode) {
    throw new ViettelValidationError([{ path: 'creds', message: 'baseUrl, username, password, taxCode are required' }])
  }
  return new ViettelInvoiceClient({ baseUrl, username, password, taxCode })
}

function errorBody(err) {
  return {
    name: err.constructor.name,
    message: err.message,
    errorCode: err.errorCode ?? null,
    httpStatus: err.httpStatus ?? null,
    issues: err.issues ?? null
  }
}

async function runSdk(req, res, fn) {
  try {
    const { creds, payload } = req.body
    const client = buildClient(creds)
    const result = await fn(client, payload)
    res.json({ ok: true, response: result })
  } catch (err) {
    if (err instanceof ViettelAuthError) return res.status(401).json({ ok: false, error: errorBody(err) })
    if (err instanceof ViettelValidationError) return res.status(400).json({ ok: false, error: errorBody(err) })
    if (err instanceof ViettelNetworkError) return res.status(502).json({ ok: false, error: errorBody(err) })
    if (err instanceof ViettelApiError) return res.status(err.httpStatus ?? 502).json({ ok: false, error: errorBody(err) })
    res.status(500).json({ ok: false, error: errorBody(err) })
  }
}

// Probe-based connect: auth errors = failure, API errors = success (auth ok)
app.post('/api/connect', async (req, res) => {
  const { creds } = req.body
  try {
    const client = buildClient(creds)
    await client.search.searchByTransactionUuid({
      supplierTaxCode: creds.taxCode,
      transactionUuid: '00000000-0000-0000-0000-000000000000'
    })
    res.json({ ok: true, response: { message: 'Connected', baseUrl: creds.baseUrl } })
  } catch (err) {
    if (err instanceof ViettelAuthError) return res.status(401).json({ ok: false, error: errorBody(err) })
    if (err instanceof ViettelValidationError) return res.status(400).json({ ok: false, error: errorBody(err) })
    if (err instanceof ViettelNetworkError) return res.status(502).json({ ok: false, error: errorBody(err) })
    // Any other error (ViettelApiError, etc.) = auth succeeded, API rejected probe = connected
    res.json({
      ok: true,
      response: {
        message: 'Connected (auth ok, API rejected probe)',
        baseUrl: creds.baseUrl,
        probeError: { name: err.constructor.name, message: err.message, errorCode: err.errorCode ?? null }
      }
    })
  }
})

app.post('/api/invoices/create', (req, res) =>
  runSdk(req, res, (client, payload) => client.invoices.createInvoice(payload))
)

app.post('/api/invoices/search', (req, res) =>
  runSdk(req, res, (client, payload) => client.search.searchByTransactionUuid(payload))
)

app.post('/api/invoices/cancel', (req, res) =>
  runSdk(req, res, (client, payload) => client.cancel.cancelInvoice(payload))
)

app.post('/api/invoices/list', (req, res) =>
  runSdk(req, res, (client, payload) => client.experimental.list.listInvoices(payload))
)

app.get('/api/defaults/gtgt', (_req, res) => {
  res.json(newGtgtDefaults())
})

app.listen(PORT, () => console.log(`VinInvoice demo running at http://localhost:${PORT}`))
