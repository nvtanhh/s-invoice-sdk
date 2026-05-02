# Codebase Summary

## Directory Structure

```
invoice-sdk/
├── src/                          # Source code (1,184 LOC)
│   ├── index.ts                  # Public exports
│   ├── client.ts                 # ViettelInvoiceClient class
│   ├── config.ts                 # ClientConfig & Logger interfaces
│   ├── http/                     # HTTP layer (215 LOC)
│   │   ├── http-client.ts        # Axios wrapper, token injection, 401-retry
│   │   ├── token-manager.ts      # Bearer token cache & auto-refresh
│   │   ├── errors.ts             # Error hierarchy & mapping
│   │   └── paths.ts              # All API path constants
│   ├── services/                 # Business logic services
│   │   ├── invoice-service.ts    # createInvoice()
│   │   ├── cancel-service.ts     # cancelInvoice()
│   │   ├── search-service.ts     # searchByTransactionUuid()
│   │   ├── usb-token-service.ts  # getHash(), submitSignedHash()
│   │   └── experimental/         # Unverified services
│   │       ├── list-service.ts
│   │       ├── file-service.ts
│   │       ├── template-service.ts
│   │       ├── payment-service.ts
│   │       └── batch-service.ts
│   ├── schemas/                  # Zod validation schemas (source of truth)
│   │   ├── invoice-input.schema.ts  # CreateInvoiceWSDTOSchema + others
│   │   └── index.ts
│   ├── types/                    # TypeScript interfaces & enums
│   │   ├── common.ts             # InvoiceType, AdjustmentType, etc.
│   │   ├── invoice-input.ts      # Request DTOs
│   │   ├── invoice-output.ts     # Response DTOs
│   │   └── index.ts
│   ├── factories/                # Default invoice builders
│   │   └── invoice-defaults.ts   # newGtgtDefaults(), newPxkDefaults(), etc.
│   └── utils/                    # Utilities
│       ├── date.ts               # toEpochMs(), toDmy(), fromDmy()
│       └── form-encode.ts        # Documentation of form-encoded endpoints
├── test/                         # Tests (1,936 LOC)
│   ├── unit/
│   │   ├── schemas.spec.ts       # Zod schema validation (568 LOC)
│   │   ├── invoice-service.spec.ts
│   │   ├── token-manager.spec.ts
│   │   ├── cancel-service.spec.ts
│   │   ├── errors.spec.ts
│   │   ├── paths.spec.ts
│   │   └── config.spec.ts
│   ├── integration/              # Live API tests (VINVOICE_LIVE=1)
│   └── fixtures/
│       └── create-invoice.gtgt.json  # Sample invoice payload
├── scripts/
│   └── generate-openapi.ts       # OpenAPI schema generator (281 LOC)
├── dist/                         # Compiled output (generated)
├── openapi.yaml                  # Generated API spec (723 LOC)
├── jest.config.ts
├── tsconfig.json
├── tsconfig.build.json
├── tsconfig.test.json
├── package.json
├── .prettierrc                   # Prettier config
├── .eslintrc.cjs                # ESLint config
└── docs/                         # Documentation
    └── api-auth.md               # Authentication endpoint details
```

## Module Breakdown

### Core Modules

#### `src/client.ts` (41 LOC)
**Purpose:** Main entry point and service orchestrator.

**Exports:**
- `ViettelInvoiceClient(cfg: ClientConfig)` — constructor

**Public Properties:**
- `invoices: InvoiceService` — invoice creation
- `cancel: CancelService` — cancellation
- `search: SearchService` — search by UUID
- `usbToken: UsbTokenService` — token signing
- `experimental: { list, file, templates, payments, batch }` — unverified APIs

**Responsibilities:**
- Accept user config
- Instantiate HttpClient once
- Wire all services to shared HttpClient
- Expose stable APIs prominently, experimental in namespace

#### `src/config.ts` (34 LOC)
**Purpose:** Configuration interfaces and defaults.

**Exports:**
- `ClientConfig` interface
  - `baseUrl: string` — API root (e.g., `https://vinvoice.viettel.vn/api`)
  - `taxCode: string` — supplier tax code
  - `username: string` — account username
  - `password: string` — account password
  - `tokenSkewMs?: number` — buffer before refresh (default 30000)
  - `timeoutMs?: number` — HTTP timeout (default 30000)
  - `authPath?: string` — login endpoint (default `/auth/login`)
  - `logger?: Logger` — optional custom logger
- `Logger` interface with `debug`, `info`, `warn`, `error` methods
- `noopLogger` — default silent logger

**Responsibilities:**
- Define configuration contract
- Provide sensible defaults (30s skew, 30s timeout)
- Allow custom logging

### HTTP Layer (`src/http/`)

#### `http-client.ts` (90 LOC)
**Purpose:** Axios wrapper with authentication and error handling.

**Exports:**
- `HttpClient` class with methods:
  - `postJson<T>(path: string, data: unknown): Promise<T>`
  - `postForm<T>(path: string, data: Record<string, unknown>): Promise<T>`
  - `get<T>(path: string): Promise<T>`

**Interceptors:**
1. **Request:** Inject `Authorization: Bearer <token>` on all non-auth endpoints
2. **Response:** On 401, invalidate token, retry once with fresh token

**Responsibilities:**
- Manage axios instance with base configuration
- Handle token injection transparently
- Implement 401-retry logic
- Map axios errors to SDK error types via `mapError()`

#### `token-manager.ts` (55 LOC)
**Purpose:** Bearer token lifecycle management.

**Exports:**
- `TokenManager` class with:
  - `getToken(): Promise<string>` — acquire or refresh token
  - `invalidate(): void` — clear cache on 401

**Features:**
- Cache token until near-expiry (uses `tokenSkewMs` buffer)
- Deduplicate concurrent refresh calls (in-flight promise pattern)
- Extract TTL from `/auth/login` response `expires_in` field
- Handle token refresh errors by throwing `ViettelAuthError`

**Responsibilities:**
- Own token lifecycle entirely
- Prevent thundering herd on expiry
- Log auth events to custom logger

#### `errors.ts` (50 LOC)
**Purpose:** Error classification and transformation.

**Exports:**
- `ViettelApiError` — base, has `errorCode`, `httpStatus`, `raw`
- `ViettelAuthError extends ViettelApiError` — 401/403
- `ViettelNetworkError extends Error` — no HTTP response
- `ViettelValidationError extends Error` — Zod failures
- `mapError(e: unknown): never` — axios error transformer

**Responsibilities:**
- Classify errors by type and HTTP status
- Preserve original response data in `raw` property
- Format validation errors with field paths
- Ensure all errors are thrown consistently

#### `paths.ts` (20 LOC)
**Purpose:** Centralized API path constants.

**Exports:**
- `PATH_AUTH_LOGIN` — `/auth/login`
- `PATH_CREATE_INVOICE(taxCode)` → `/services/einvoiceapplication/api/InvoiceAPI/createInvoice/{taxCode}`
- `PATH_CANCEL` — `/services/einvoiceapplication/api/InvoiceAPI/cancelTransactionInvoice`
- `PATH_SEARCH_BY_UUID` — `/services/einvoiceapplication/api/InvoiceAPI/searchInvoiceByTransactionUuid`
- Experimental: `PATH_LIST`, `PATH_FILE`, `PATH_TEMPLATES`, etc.

**Responsibilities:**
- Single source of truth for all endpoints
- Support parameterized paths (taxCode)
- Document stable vs. experimental paths

### Services (`src/services/`)

#### `invoice-service.ts` (≈30 LOC)
**Purpose:** Invoice creation with validation.

**Method:**
- `async createInvoice(dto: unknown): Promise<CreateInvoiceResp>`

**Flow:**
1. Parse DTO against `CreateInvoiceWSDTOSchema`
2. If invalid, throw `ViettelValidationError` with field paths
3. POST JSON to `createInvoice/{taxCode}`
4. Return `CreateInvoiceResp` (includes invoiceNumber, transactionUuid, pdfUrl)

#### `cancel-service.ts` (≈30 LOC)
**Purpose:** Invoice cancellation.

**Method:**
- `async cancelInvoice(payload: unknown): Promise<CancelResp>`

**Flow:**
1. Validate against `CancelTransactionWSDTOSchema`
2. POST form-encoded to `cancelTransactionInvoice`
3. Return cancellation response

#### `search-service.ts` (≈30 LOC)
**Purpose:** Invoice search by transaction UUID.

**Method:**
- `async searchByTransactionUuid(payload: unknown): Promise<SearchResp>`

**Flow:**
1. Validate against `SearchByTransUUIDDTOSchema`
2. POST form-encoded to `searchInvoiceByTransactionUuid`
3. Return invoice metadata

#### `usb-token-service.ts` (≈44 LOC)
**Purpose:** USB token signing workflow.

**Methods:**
- `async getHash(dto: unknown): Promise<GetHashResp>` → `{ hash, transactionUuid }`
- `async submitSignedHash(input: unknown): Promise<SubmitHashResp>`

**Flow:**
1. `getHash()`: Validate input, POST to generate hash for external signing
2. External signing (app responsibility, hardware USB token)
3. `submitSignedHash()`: Submit signed hash back to API

#### Experimental Services (`src/services/experimental/`)

| Service | Method | Endpoint | Status |
|---------|--------|----------|--------|
| `ListService` | `list(payload)` | `/...list` | Wire format inferred |
| `FileService` | `getFile(payload)` | `/...file` | Not verified |
| `TemplateService` | `getTemplates()` | `/...templates` | Limited |
| `PaymentService` | `getPayments(payload)` | `/...payment` | Uncertain |
| `BatchService` | `createBatch(payload)` | `/...batch/{taxCode}` | Not sandbox-tested |

All marked with `@experimental` JSDoc comment.

### Schemas (`src/schemas/invoice-input.schema.ts`, 229 LOC)

**Purpose:** Zod schemas for validation AND OpenAPI generation.

**Key Schemas:**
- `CreateInvoiceWSDTOSchema` — main invoice structure
  - Cross-field validation: adjustmentType=3 or 5 requires extra fields
  - Money-adjust (type=5, invoiceType=1) requires `isIncreaseItem` on each item
- `CancelTransactionWSDTOSchema` — cancellation payload
- `SearchByTransUUIDDTOSchema` — search query
- `GetInvoiceInputSchema` — USB token hash input
- Others for experimental endpoints

**Responsibilities:**
- Define all input shapes as Zod schemas
- Include all validation rules (required, types, ranges)
- Generate OpenAPI spec via `@asteasolutions/zod-to-openapi`
- Source of truth for request DTOs

### Types (`src/types/`)

#### `common.ts` (15 LOC)
**Purpose:** Enums and constants for Vietnamese invoicing.

**Exports:**
- `InvoiceType = { GTGT: '1', BAN_HANG: '2', PXK: '6' }`
- `AdjustmentType = { NEW: '1', REPLACE: '3', ADJUST: '5' }`
- `AdjustmentInvoiceType = { MONEY: '1', INFO: '2' }`
- `MetaValueType = { TEXT, NUMBER, DATE }`
- `PaymentMethod = { CASH, TM_CK, CK }`
- `Currency = { VND, USD }`

#### `invoice-input.ts`
**Purpose:** Request DTOs mirroring Zod schemas.

**Key Types:**
- `GeneralInvoiceInfo` — header (templateCode, invoiceSeries, adjustmentType, etc.)
- `InvoiceItemInfo` — line items (product, quantity, unitPrice, isIncreaseItem for adjustments)
- `CreateInvoiceReq` — full invoice request
- `CancelTransactionWSDTO` — cancellation request
- `SearchByTransUUIDDTO` — search request

#### `invoice-output.ts`
**Purpose:** Response DTOs from API.

**Key Types:**
- `CreateInvoiceResp` — { invoiceNumber, transactionUuid, pdfUrl, ... }
- `CancelResp` — cancellation confirmation
- `SearchResp` — { invoiceList, status, ... }
- `GetHashResp` — { hash, transactionUuid }

### Factories (`src/factories/invoice-defaults.ts`, 44 LOC)

**Purpose:** Pre-populated invoice starters for common Vietnamese invoice types.

**Functions:**
- `newGtgtDefaults()` → `{ invoiceType: '1', templateCode: '1/0230', invoiceSeries: 'K25TII', currencyCode: 'VND', adjustmentType: '1' }`
- `newPxkDefaults()` → `{ invoiceType: '6', templateCode: '6/0026', ... }`
- `newBanHangDefaults()` → `{ invoiceType: '2', templateCode: '2/0022', ... }`

**Usage:**
```typescript
const partialInvoice = { ...newGtgtDefaults(), invoiceNumber: '001' }
```

### Utilities (`src/utils/`)

#### `date.ts`
**Purpose:** Date format conversions.

**Functions:**
- `toEpochMs(date: Date): number` — epoch milliseconds
- `toDmy(date: Date): string` — `dd/MM/yyyy` format (for GetInvoiceInput.fromDate/toDate only)
- `fromDmy(str: string): Date` — parse `dd/MM/yyyy`

**Note:** Most date fields use epoch ms; only search filters use `dd/MM/yyyy`.

#### `form-encode.ts`
**Purpose:** Documentation of form-encoded endpoints.

**Details:**
- Two endpoints use form-encoding (via `qs` library):
  1. `cancelTransactionInvoice`
  2. `searchInvoiceByTransactionUuid`
- All others use JSON

## Test Structure

**Total: 1,936 LOC**

### Unit Tests (`test/unit/`)

| File | LOC | Coverage |
|------|-----|----------|
| `schemas.spec.ts` | 568 | Zod validation rules, cross-field, edge cases |
| `invoice-service.spec.ts` | 348 | Mock HTTP, validation, response parsing |
| `token-manager.spec.ts` | 317 | Token cache, refresh, dedup, expiry |
| `cancel-service.spec.ts` | 295 | Form-encoding, error handling |
| `errors.spec.ts` | 220 | Error classification, mapping |
| `paths.spec.ts` | 152 | Path generation, parameterization |
| `config.spec.ts` | 36 | Config validation |

**Tools:** Jest, ts-jest, axios-mock-adapter

### Integration Tests (`test/integration/`)

**Gate:** `VINVOICE_LIVE=1` environment variable required

**Purpose:** Verify against live Viettel API

**Responsibility:** Disabled in CI by default; manual or nightly runs only

### Fixtures

- `test/fixtures/create-invoice.gtgt.json` — Real GTGT invoice payload

## Build & Publish

### Scripts

```json
{
  "build": "tsc -p tsconfig.build.json",
  "test": "jest",
  "test:int": "VINVOICE_LIVE=1 jest test/integration",
  "lint": "eslint src test",
  "format": "prettier --write .",
  "openapi": "tsx scripts/generate-openapi.ts",
  "prepublishOnly": "npm run lint && npm test && npm run build"
}
```

### Compilation

**Input:** TypeScript (`src/`, `scripts/`)

**Output:** `dist/index.js` + types (`dist/index.d.ts`)

**tsconfig.json:**
- Target: ES2022
- Module: NodeNext (ESM)
- Strict: true
- `noUncheckedIndexedAccess`: true
- All `.js` extensions preserved in imports

### OpenAPI Generation

**Script:** `scripts/generate-openapi.ts` (281 LOC)

**Process:**
1. Extract Zod schemas from `src/schemas/`
2. Use `@asteasolutions/zod-to-openapi` to generate OpenAPI spec
3. Write to `openapi.yaml` (723 LOC)

**Run:** `npm run openapi`

## Dependency Graph

```
ViettelInvoiceClient
├── HttpClient
│   ├── axios
│   ├── TokenManager
│   │   └── axios
│   └── mapError (errors.ts)
├── InvoiceService
│   ├── HttpClient
│   └── CreateInvoiceWSDTOSchema (zod)
├── CancelService
│   ├── HttpClient
│   └── CancelTransactionWSDTOSchema (zod)
├── SearchService
│   ├── HttpClient
│   └── SearchByTransUUIDDTOSchema (zod)
├── UsbTokenService
│   ├── HttpClient
│   └── Zod schemas
└── Experimental services
    └── HttpClient
```

## Code Statistics

| Area | LOC | Notes |
|------|-----|-------|
| **src/** | 1,184 | Source code |
| **test/unit/** | 1,936 | Test suite |
| **scripts/** | 281 | OpenAPI generation |
| **openapi.yaml** | 723 | Generated API spec |
| **Total (tracked)** | 4,124 | Excludes node_modules, dist |

## Configuration Files

| File | Purpose |
|------|---------|
| `.prettierrc` | Single quotes, no semicolons, 100 char width, no trailing commas |
| `.eslintrc.cjs` | TypeScript recommended, `no-explicit-any` as warning |
| `tsconfig.json` | Strict, NodeNext modules, ES2022 target |
| `tsconfig.build.json` | Excludes test files |
| `tsconfig.test.json` | Jest-specific config |
| `tsconfig.scripts.json` | Generate-openapi config |
| `jest.config.ts` | ts-jest preset, 75/80/80/80 coverage thresholds |
| `package.json` | ESM-only, node >=18.18, exports both import and types |

---

**Document Version:** 1.0 | **Last Updated:** 2026-05-02
