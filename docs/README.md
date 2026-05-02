# viettel-vinvoice-sdk Documentation

Welcome to the official documentation for the **viettel-vinvoice-sdk** — a TypeScript SDK for the Viettel VinInvoice e-invoice API.

## Quick Navigation

### For Project Overview
- **[Project Overview & PDR](./project-overview-pdr.md)** — Executive summary, functional requirements, non-functional requirements, roadmap, success metrics

### For Understanding the Code
- **[Codebase Summary](./codebase-summary.md)** — Directory structure, module breakdown, 1,184 LOC overview, test structure
- **[System Architecture](./system-architecture.md)** — Layered architecture, data flows, error handling, token management, validation patterns
- **[Code Standards](./code-standards.md)** — TypeScript rules, naming conventions, testing patterns, linting/formatting rules

### For Deploying
- **[Deployment Guide](./deployment-guide.md)** — Building, publishing to npm, versioning, troubleshooting

### For Current Status
- **[Project Roadmap](./project-roadmap.md)** — Stability matrix, what's stable vs. experimental, future plans, known limitations

### API Reference
- **[Auth API](./api-auth.md)** — Viettel login endpoint, verified from network tab, Postman script

---

## Document Quick Reference

| Document | Purpose | Audience | LOC |
|----------|---------|----------|-----|
| **Project Overview & PDR** | Feature list, requirements, constraints | Project managers, product leads | 259 |
| **Codebase Summary** | Code organization, module responsibilities | Developers joining project | 448 |
| **System Architecture** | Layers, flows, error handling, design patterns | Architects, senior developers | 588 |
| **Code Standards** | Formatting, naming, testing, linting rules | All developers | 718 |
| **Deployment Guide** | Build, test, version, publish to npm | DevOps, release engineers | 639 |
| **Project Roadmap** | Stable APIs, experimental features, future work | Project leads, stakeholders | 331 |
| **Auth API** | Viettel login endpoint details | Developers integrating auth | 90 |

**Total Documentation:** 3,073 LOC

---

## Project Overview at a Glance

**Package:** `viettel-vinvoice-sdk` v1.0.0  
**Type:** Unofficial TypeScript SDK for Viettel VinInvoice API  
**Runtime:** Node.js ≥18.18, ESM-only  
**Status:** Stable (core) + Experimental (unverified wire formats)

### What It Does
- ✅ Create invoices (GTGT, BanHang, PXK types)
- ✅ Cancel invoices
- ✅ Search invoices by UUID
- ✅ Handle USB token signing
- ✅ Manage authentication automatically
- ✅ Validate inputs with comprehensive Zod schemas
- ✅ Classify errors clearly (auth, validation, network, API)
- 🔶 Experimental: Batch, list, file, template, payment APIs (wire format unverified)

### Key Stats
- **Source Code:** 1,184 LOC
- **Test Coverage:** ≥75% branches, ≥80% functions/lines/statements
- **Dependencies:** axios, zod, qs (minimal, stable)
- **Type Safety:** Strict TypeScript, zero `any` types

---

## Getting Started

### Installation
```bash
npm install viettel-vinvoice-sdk
```

### Basic Usage
```typescript
import { ViettelInvoiceClient } from 'viettel-vinvoice-sdk'

const client = new ViettelInvoiceClient({
  baseUrl: 'https://vinvoice.viettel.vn/api',
  taxCode: 'YOUR_TAX_CODE',
  username: 'your_username',
  password: 'your_password'
})

// Create an invoice
const response = await client.invoices.createInvoice({
  generalInvoiceInfo: {
    invoiceType: '1',           // GTGT
    invoiceNumber: '001',
    invoiceSeries: 'K25TII',
    templateCode: '1/0230',
    currencyCode: 'VND',
    adjustmentType: '1'         // NEW
  },
  sellerInfo: { /* ... */ },
  buyerInfo: { /* ... */ },
  itemInfo: [ /* ... */ ]
})

console.log(`Invoice created: ${response.invoiceNumber}`)
console.log(`Download PDF: ${response.pdfUrl}`)
```

### Error Handling
```typescript
import {
  ViettelValidationError,
  ViettelAuthError,
  ViettelApiError,
  ViettelNetworkError
} from 'viettel-vinvoice-sdk'

try {
  await client.invoices.createInvoice(payload)
} catch (e) {
  if (e instanceof ViettelValidationError) {
    console.error('Input validation failed:', e.issues)
  } else if (e instanceof ViettelAuthError) {
    console.error('Authentication failed:', e.errorCode)
  } else if (e instanceof ViettelNetworkError) {
    console.error('Network error:', e.message)
  } else if (e instanceof ViettelApiError) {
    console.error('API error:', e.errorCode, e.httpStatus)
  }
}
```

---

## Core Features

### Invoice Types
```typescript
import { InvoiceType, newGtgtDefaults, newBanHangDefaults } from 'viettel-vinvoice-sdk'

// GTGT (VAT invoice)
const gtgtDefaults = newGtgtDefaults()  // → { invoiceType: '1', ... }

// BanHang (sales invoice)
const banHangDefaults = newBanHangDefaults()  // → { invoiceType: '2', ... }

// PXK (delivery note)
const pxkDefaults = newPxkDefaults()  // → { invoiceType: '6', ... }
```

### Adjustment Invoices
```typescript
// REPLACE adjustment (corrects entire invoice)
{
  adjustmentType: '3',
  adjustedInvoiceNumber: '001',
  adjustedInvoiceSeries: 'K25TII'
}

// ADJUST (money or info adjustment)
{
  adjustmentType: '5',
  adjustmentInvoiceType: '1',  // '1' = money, '2' = info
  adjustedInvoiceNumber: '001'
}

// Money adjust (requires isIncreaseItem on items)
{
  adjustmentType: '5',
  adjustmentInvoiceType: '1',
  itemInfo: [
    { productName: 'Service', quantity: 1, unitPrice: 100, isIncreaseItem: true }
  ]
}
```

### USB Token Signing
```typescript
// Step 1: Generate hash
const hashResp = await client.usbToken.getHash({
  invoiceType: '1',
  invoiceNumber: '001',
  // ... invoice data
})
console.log(hashResp.hash)
console.log(hashResp.transactionUuid)

// Step 2: Sign externally (application responsibility)
const signedHash = await externalUSBTokenDevice.sign(hashResp.hash)

// Step 3: Submit signed hash
const finalResp = await client.usbToken.submitSignedHash({
  signedHash,
  transactionUuid: hashResp.transactionUuid
})
```

### Search Invoices
```typescript
const results = await client.search.searchByTransactionUuid({
  transactionUuid: 'abc-123-def'
})
console.log(results.invoiceList)
```

### Cancel Invoice
```typescript
const cancelResp = await client.cancel.cancelInvoice({
  invoiceNumber: '001',
  invoiceSeries: 'K25TII',
  invoiceType: '1'
})
```

---

## Configuration

### Required Fields
```typescript
interface ClientConfig {
  baseUrl: string          // e.g., "https://vinvoice.viettel.vn/api"
  taxCode: string          // Supplier tax code (used in requests)
  username: string         // Viettel account username
  password: string         // Viettel account password
}
```

### Optional Fields
```typescript
interface ClientConfig {
  tokenSkewMs?: number     // Buffer before token refresh (default: 30000 ms)
  timeoutMs?: number       // HTTP timeout (default: 30000 ms)
  authPath?: string        // Auth endpoint path (default: "/auth/login")
  logger?: Logger          // Custom logger (default: silent)
}
```

### Custom Logger
```typescript
const client = new ViettelInvoiceClient({
  baseUrl: 'https://...',
  taxCode: '...',
  username: '...',
  password: '...',
  logger: {
    debug: (msg, meta) => console.log(`[DEBUG] ${msg}`, meta),
    info: (msg, meta) => console.log(`[INFO] ${msg}`, meta),
    warn: (msg, meta) => console.warn(`[WARN] ${msg}`, meta),
    error: (msg, meta) => console.error(`[ERROR] ${msg}`, meta)
  }
})
```

---

## API Stability

### ✅ Stable APIs (Production-Ready)
- `InvoiceService.createInvoice()` — Verified against live API
- `CancelService.cancelInvoice()` — Verified against live API
- `SearchService.searchByTransactionUuid()` — Verified against live API
- `UsbTokenService.getHash()` & `submitSignedHash()` — Verified against live API
- Token management (auto-refresh, 401-retry, deduplication) — Verified
- All input validation (Zod schemas) — Verified

### 🔶 Experimental APIs (Use at Your Risk)
- `BatchService.createBatch()` — Wire format inferred from Java, not verified
- `ListService.list()` — Endpoint uncertain
- `FileService.getFile()` — Not sandbox-verified
- `TemplateService` — Limited coverage
- `PaymentService` — Signature uncertain

See [Project Roadmap](./project-roadmap.md) for verification status and plans.

---

## Testing

### Running Tests
```bash
npm test                    # Unit tests
npm test -- --coverage      # With coverage report
VINVOICE_LIVE=1 npm run test:int  # Integration tests (live API)
```

### Test Coverage
- Branches: ≥75%
- Functions: ≥80%
- Lines: ≥80%
- Statements: ≥80%

All tests must pass before publishing.

---

## Deployment

### Local Development
```bash
npm install
npm run format              # Format code
npm run lint                # Lint
npm test                    # Test
npm run build               # Compile
```

### Publishing to npm
```bash
npm version patch           # Bump version, create git tag
npm publish                 # Publishes (runs: lint → test → build)
```

See [Deployment Guide](./deployment-guide.md) for full details.

---

## Troubleshooting

### "Validation failed: field.path: error message"
- Check input against schema
- See [Code Standards](./code-standards.md) for validation examples
- Review specific schema in `src/schemas/invoice-input.schema.ts`

### "ViettelAuthError: 401 Unauthorized"
- Verify credentials in `ClientConfig`
- Check baseUrl is correct (`https://vinvoice.viettel.vn/api`)
- Token TTL is ~20 minutes; SDK auto-refreshes

### "ViettelNetworkError: timeout"
- Network latency or Viettel API down
- Increase `timeoutMs` in config if needed
- Check internet connection

### "Cannot find module 'viettel-vinvoice-sdk'"
- Verify package is installed: `npm list viettel-vinvoice-sdk`
- Check Node.js version: `node --version` (require ≥18.18)
- Verify import: `import { ViettelInvoiceClient } from 'viettel-vinvoice-sdk'`

---

## Contributing & Support

### Reporting Issues
- Include Node.js version, SDK version, and minimal reproducible example
- Describe expected vs. actual behavior
- Share error stack trace (sanitize credentials)

### Feature Requests
- Link to Viettel API documentation if applicable
- Explain use case and business impact
- Check experimental services first

### Pull Requests
- Include tests (coverage ≥ thresholds)
- Pass linting and formatting
- Update documentation if needed

---

## Related Resources

### Within This Documentation
- [Project Overview & PDR](./project-overview-pdr.md) — Requirements and vision
- [Codebase Summary](./codebase-summary.md) — Code organization
- [System Architecture](./system-architecture.md) — Design patterns and flows
- [Code Standards](./code-standards.md) — Development rules

### External Links
- **Viettel VinInvoice:** https://vinvoice.viettel.vn/
- **npm Package:** https://www.npmjs.com/package/viettel-vinvoice-sdk (after publish)
- **GitHub Repository:** (TBD)

---

## License

See repository root for license details.

---

## Support

For questions or issues:
1. Check this documentation
2. Review [Codebase Summary](./codebase-summary.md) for code organization
3. Check [System Architecture](./system-architecture.md) for design patterns
4. Review test files (`test/unit/`) for usage examples
5. Contact project maintainers

---

**Documentation Version:** 1.0  
**Last Updated:** 2026-05-02  
**SDK Version:** 1.0.0
