# viettel-vinvoice-sdk

> [!WARNING]
> **This is NOT an official Viettel product or documentation.**
> This is a personal project built for my own use. It has no affiliation with, endorsement from, or connection to Viettel in any way.
>
> The author takes **no responsibility** for any issues, data loss, or damages arising from using this library. **Use at your own risk.**

---

Unofficial TypeScript SDK for the Viettel VinInvoice e-invoice API. ESM-only, Node.js ≥18.18, Zod validation, token caching.

## Requirements

- Node.js ≥18.18
- ESM only (`"type": "module"` in `package.json`)

## Installation

```bash
npm install viettel-vinvoice-sdk
```

## Quick Start

```typescript
import { ViettelInvoiceClient } from 'viettel-vinvoice-sdk'

const client = new ViettelInvoiceClient({
  baseUrl: 'https://vinvoice.viettel.vn/api',
  taxCode: '0100000000',
  username: 'your-username',
  password: 'your-password'
})

// Create invoice
const invoice = await client.invoices.createInvoice({ ... })

// Search by UUID
const result = await client.search.searchByTransactionUuid({
  transactionUuid: invoice.result?.transactionID
})

// Cancel invoice
await client.cancel.cancelInvoice({ ... })
```

## Services

| Service | Method | Status | Description |
|---------|--------|--------|-------------|
| `invoices` | `createInvoice()` | Stable | Create / replace / adjust an invoice |
| `cancel` | `cancelInvoice()` | Stable | Cancel an invoice |
| `search` | `searchByTransactionUuid()` | Stable | Find invoice by transaction UUID |
| `usbToken` | `getHash()` | Stable | Get hash for USB token signing |
| `usbToken` | `submitSignedHash()` | Stable | Submit signed hash |
| `experimental.*` | — | Experimental | list / file / templates / payments / batch |

## Configuration

```typescript
const client = new ViettelInvoiceClient({
  baseUrl: string       // 'https://vinvoice.viettel.vn/api'
  taxCode: string       // Supplier tax code
  username: string
  password: string
  tokenSkewMs?: number  // default 30_000 ms
  timeoutMs?: number    // default 30_000 ms
  authPath?: string     // default '/auth/login'
  logger?: Logger       // custom logger
})
```

## Error Handling

```typescript
import {
  ViettelApiError,
  ViettelAuthError,
  ViettelNetworkError,
  ViettelValidationError
} from 'viettel-vinvoice-sdk'

try {
  await client.invoices.createInvoice(data)
} catch (err) {
  if (err instanceof ViettelValidationError) { /* invalid input */ }
  if (err instanceof ViettelAuthError)       { /* 401/403 */ }
  if (err instanceof ViettelNetworkError)    { /* timeout / no response */ }
  if (err instanceof ViettelApiError)        { /* API-level error */ }
}
```

## License

MIT
