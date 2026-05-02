# viettel-vinvoice-sdk

> [!NOTE]
> This is an **UNOFFICIAL** project. It is not affiliated with or endorsed by Viettel.

A modern TypeScript SDK for the Viettel VinInvoice e-invoice API. ESM-only, with full Zod validation, token caching, and 100% test coverage.

## Requirements

- **Node.js** ≥18.18
- **ES Module** environments only

## Installation

```bash
npm install viettel-vinvoice-sdk
```

## Quick Start

```typescript
import { ViettelInvoiceClient } from 'viettel-vinvoice-sdk'

const client = new ViettelInvoiceClient({
  baseUrl: 'https://api-vinvoice.viettel.vn',
  taxCode: '0100000000',
  username: 'your-username',
  password: 'your-password'
})

// Create invoice
const invoice = await client.invoices.createInvoice({
  invoiceType: '01BLP',
  invoiceNo: 'HD001',
  invoiceDate: '01/05/2026',
  totalAmount: 1000000,
  items: [
    {
      itemName: 'Service A',
      quantity: 1,
      unitPrice: 1000000
    }
  ]
})
console.log('Created:', invoice.invoiceNo)

// Search by transaction UUID
const result = await client.search.searchByTransactionUuid({
  transactionUuid: invoice.uuid
})
console.log('Search result:', result)

// Cancel invoice
const cancel = await client.cancel.cancelInvoice({
  invoiceNo: invoice.invoiceNo,
  reason: 'Error in invoice'
})
console.log('Cancelled:', cancel.status)
```

## Core Services

| Service | Method | Tier | Purpose |
|---------|--------|------|---------|
| `invoices` | `createInvoice()` | Stable | Create a new e-invoice |
| `cancel` | `cancelInvoice()` | Stable | Cancel an existing invoice |
| `search` | `searchByTransactionUuid()` | Stable | Find invoice by UUID |
| `usbToken` | `getHash()` | Stable | USB token signing (hash generation) |
| `usbToken` | `submitSignedHash()` | Stable | Submit signed hash after signing |

## Configuration

### Required Options

```typescript
const client = new ViettelInvoiceClient({
  baseUrl: string      // API host: 'https://api-vinvoice.viettel.vn'
  taxCode: string      // Supplier tax code (e.g., '0100000000')
  username: string     // Account username
  password: string     // Account password
})
```

### Optional Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `tokenSkewMs` | number | `30000` | Buffer (ms) before token refresh |
| `timeoutMs` | number | `30000` | Axios request timeout |
| `authPath` | string | `'/auth/login'` | Custom authentication endpoint |
| `logger` | Logger | noop | Custom logger for debug output |

## Experimental Services

The following services are marked as **experimental** and may change:

- `client.experimental.list` – List invoices
- `client.experimental.file` – Retrieve invoice files
- `client.experimental.templates` – Get invoice templates
- `client.experimental.payments` – Payment information
- `client.experimental.batch` – Batch operations

Use only if you accept API instability.

## Features

- **Full Zod Validation** – All inputs and outputs validated
- **Token Caching** – Auto-refresh with configurable skew
- **TypeScript-First** – ESM build with inline `.d.ts` files
- **Comprehensive Tests** – 117 tests, 100% coverage
- **Error Handling** – Typed exceptions with detailed messages
- **Logging** – Optional structured logging support

## Error Handling

All service methods throw SDK-specific errors. Wrap calls in try/catch:

```typescript
try {
  await client.invoices.createInvoice(data)
} catch (err) {
  console.error('Failed:', err.message)
}
```

## License

MIT. See LICENSE file.
