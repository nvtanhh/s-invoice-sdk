# Code Standards & Conventions

## Language & Runtime

| Standard | Requirement |
|----------|-------------|
| **Language** | TypeScript 5.7+ |
| **Runtime** | Node.js 18.18+ |
| **Module System** | ESM only (no CommonJS) |
| **Target** | ES2022 |
| **Declaration Files** | Required (`.d.ts` generated) |
| **Strict Mode** | Enforced (`strict: true` in tsconfig) |

## TypeScript Configuration

### Compiler Options

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": false,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "dist",
    "resolveJsonModule": true
  }
}
```

### Key Rules

1. **Strict Mode** — All strict checks enabled
   - `noImplicitAny: true`
   - `strictNullChecks: true`
   - `strictFunctionTypes: true`
   - `strictBindCallApply: true`
   - `strictPropertyInitialization: true`
   - `noImplicitThis: true`
   - `alwaysStrict: true`

2. **Unchecked Index Access** — Disallow `obj[key]` without `unknown`-casting first
   - Prevents silent `undefined` bugs on missing keys

3. **Module Resolution** — NodeNext for Node.js native ESM support

4. **.js Extension Required** — All internal imports must use `.js` extension
   ```typescript
   // ✅ Correct
   import { HttpClient } from './http-client.js'
   
   // ❌ Wrong
   import { HttpClient } from './http-client'
   import { HttpClient } from './http-client.ts'
   ```

## Code Style & Formatting

### Prettier Configuration

```json
{
  "singleQuote": true,
  "semi": false,
  "trailingComma": "none",
  "printWidth": 100
}
```

### Rules

| Style | Rule | Example |
|-------|------|---------|
| **Quotes** | Single quotes only | `'string'` not `"string"` |
| **Semicolons** | None at end of statements | `const x = 1` not `const x = 1;` |
| **Trailing Commas** | None in any context | `{ a, b }` not `{ a, b, }` |
| **Line Width** | 100 characters max | Configure editor to 100 char width |

### Enforcement

- **Run before commit:** `npm run format`
- **Pre-commit hook recommended** (not enforced, user responsibility)
- All code must pass `prettier --check .`

## Linting Rules

### ESLint Configuration

```javascript
{
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint"],
  "extends": ["plugin:@typescript-eslint/recommended"],
  "rules": {
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/explicit-module-boundary-types": "off"
  }
}
```

### Enforced Rules

| Rule | Severity | Why | Allowed Exception |
|------|----------|-----|-------------------|
| `@typescript-eslint/no-explicit-any` | Warning | Prefer `unknown` + type guards | Error mappers (checked at call site) |
| Unused variables | Recommended | Catch typos, dead code | Prefix with `_` if intentional |
| Unused imports | Recommended | Keep imports clean | N/A |
| No `var` | Recommended | Use `const`/`let` only | N/A |

### Run Linting

```bash
npm run lint              # Check all files
npm run lint -- --fix    # Auto-fix some issues
```

## Naming Conventions

### Files & Directories

| Type | Convention | Example |
|------|-----------|---------|
| Source files | kebab-case | `http-client.ts`, `invoice-service.ts` |
| Directories | kebab-case | `src/services/experimental/` |
| Test files | Same as source + `.spec.ts` | `invoice-service.spec.ts` |
| Config files | Preserve framework names | `jest.config.ts`, `.eslintrc.cjs` |

### Variables & Functions

| Type | Convention | Example |
|------|-----------|---------|
| Constants | UPPER_SNAKE_CASE | `PATH_CREATE_INVOICE`, `HTTP_TIMEOUT_MS` |
| Variables | camelCase | `invoiceNumber`, `taxCode`, `isValid` |
| Functions | camelCase | `createInvoice()`, `getToken()`, `mapError()` |
| Classes | PascalCase | `ViettelInvoiceClient`, `HttpClient`, `TokenManager` |
| Interfaces | PascalCase | `ClientConfig`, `Logger`, `CreateInvoiceResp` |
| Types | PascalCase | `InvoiceTypeCode`, `AdjustmentTypeCode` |
| Enums (const objects) | PascalCase | `InvoiceType`, `AdjustmentType` |
| Private fields | `#fieldName` (hash prefix) | `#tokenManager`, `#axiosInstance` |
| Readonly properties | camelCase | `public readonly invoices: InvoiceService` |

### Abbreviations

- Avoid except in established contexts (HTTP, UUID, URL, JWT, API)
- Prefer full words: `taxCode` not `tc`, `adjustmentType` not `adjType`

## Import/Export Patterns

### Public Exports

```typescript
// src/index.ts — main barrel export
export { ViettelInvoiceClient } from './client.js'
export type { ClientConfig, Logger } from './config.js'
export * from './types/index.js'
export * from './http/errors.js'
export { newGtgtDefaults, newPxkDefaults, newBanHangDefaults } from './factories/invoice-defaults.js'
export { InvoiceType, AdjustmentType, AdjustmentInvoiceType } from './types/common.js'
```

**Rules:**
- One export file per module (`index.ts`)
- Re-export from `src/index.ts` for public API
- Type-only exports use `export type`
- .js extensions required in all internal paths

### Internal Imports

```typescript
// ✅ Correct
import { HttpClient } from './http/http-client.js'
import type { ClientConfig } from '../config.js'
import { ViettelApiError } from './errors.js'

// ❌ Wrong
import { HttpClient } from './http/http-client'     // Missing .js
import { HttpClient } from './http/http-client.ts'  // Too explicit
import HttpClient from './http/http-client.js'      // Default export (use named)
```

## Error Handling

### Error Types

All errors must inherit from SDK error hierarchy:

```typescript
// Base API error
class ViettelApiError extends Error {
  constructor(
    public readonly errorCode: string,
    message: string,
    public readonly httpStatus?: number,
    public readonly raw?: unknown
  )
}

// Auth-specific (401, 403)
class ViettelAuthError extends ViettelApiError {}

// Network issues (no response)
class ViettelNetworkError extends Error {}

// Input validation (Zod failures)
class ViettelValidationError extends Error {
  constructor(public readonly issues: { path: string; message: string }[])
}
```

### Error Throwing

```typescript
// ✅ Correct: throw SDK errors
throw new ViettelValidationError(
  parsed.error.issues.map(i => ({
    path: i.path.join('.'),
    message: i.message
  }))
)

throw new ViettelAuthError('401', 'Unauthorized', 401, response.data)

// ❌ Wrong: throw plain Error
throw new Error('Something went wrong')  // No errorCode or classification
```

### Error Logging

```typescript
// Use provided logger (never console.log in library)
this.log.error('Token refresh failed', { statusCode: err.response?.status })
this.log.info('Invoice created', { transactionUuid })
this.log.warn('Token near expiry', { skewMs: this.tokenSkewMs })

// Never log passwords, tokens, or credentials
this.log.debug('Config loaded')  // ❌ Don't log cfg.password
```

## Schema & Validation

### Zod Schemas (Source of Truth)

All input validation defined via Zod in `src/schemas/invoice-input.schema.ts`:

```typescript
import { z } from 'zod'

export const CreateInvoiceWSDTOSchema = z.object({
  generalInvoiceInfo: z.object({
    templateCode: z.string(),
    invoiceNumber: z.string(),
    invoiceSeries: z.string(),
    invoiceType: z.enum(['1', '2', '6']),
    adjustmentType: z.enum(['1', '3', '5']),
    // ... more fields
  }),
  sellerInfo: z.object({}),
  buyerInfo: z.object({}),
  itemInfo: z.array(z.object({})),
  // Cross-field validation
}).superRefine((data, ctx) => {
  if (data.generalInvoiceInfo.adjustmentType === '5') {
    // Money adjust requires isIncreaseItem on items
    if (!data.itemInfo?.some(item => item.isIncreaseItem === true)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['itemInfo'],
        message: 'Money adjust requires isIncreaseItem on at least one item'
      })
    }
  }
})
```

**Rules:**
- Schemas are source of truth for request DTOs
- Use `z.enum()` for string enums, not union types
- Include all validation rules (required, ranges, patterns)
- Document cross-field validation in `superRefine()`
- Generate OpenAPI spec from schemas (not manually)

### Validation in Services

```typescript
async createInvoice(dto: unknown): Promise<CreateInvoiceResp> {
  const parsed = CreateInvoiceWSDTOSchema.safeParse(dto)
  if (!parsed.success) {
    throw new ViettelValidationError(
      parsed.error.issues.map(i => ({
        path: i.path.join('.'),
        message: i.message
      }))
    )
  }
  return this.http.postJson<CreateInvoiceResp>(
    PATH_CREATE_INVOICE(this.taxCode),
    parsed.data
  )
}
```

## Class Structure

### Service Classes

```typescript
export class InvoiceService {
  // Constructor with DI
  constructor(
    private readonly http: HttpClient,
    private readonly taxCode: string
  ) {}

  // Public async methods
  async createInvoice(dto: unknown): Promise<CreateInvoiceResp> {
    // Validate, call HTTP, return response
  }

  // Private helper methods (if needed)
  private sanitizeInput(data: unknown): unknown {
    // ...
  }
}
```

**Rules:**
- Private fields use `#` or `private readonly`
- Constructor receives all dependencies
- Async methods return `Promise<T>`
- No static methods (prefer functions)
- One responsibility per service

### HTTP Client Class

```typescript
export class HttpClient {
  private readonly axiosInstance: AxiosInstance
  private readonly tokenManager: TokenManager
  private readonly log: Logger

  constructor(cfg: ClientConfig) {
    // Setup axios instance
    // Setup token manager
    // Setup interceptors
  }

  async postJson<T>(path: string, data: unknown): Promise<T> {
    // Implementation
  }

  async postForm<T>(path: string, data: Record<string, unknown>): Promise<T> {
    // Implementation
  }

  async get<T>(path: string): Promise<T> {
    // Implementation
  }
}
```

**Rules:**
- Generic `<T>` for response type
- Private fields for internal state
- All methods async (consistent error handling)
- Error mapping via `mapError()` on catch

## Documentation & Comments

### JSDoc Comments

Required on all public exports:

```typescript
/**
 * Creates a new invoice in the Viettel VinInvoice system.
 *
 * @param dto - Invoice data object, validated against CreateInvoiceWSDTOSchema
 * @returns Promise resolving to invoice response with number, UUID, and PDF URL
 * @throws ViettelValidationError if dto fails schema validation
 * @throws ViettelApiError if API returns error response
 * @throws ViettelAuthError if 401/403 received
 * @throws ViettelNetworkError if no HTTP response
 *
 * @example
 * ```typescript
 * const client = new ViettelInvoiceClient(config)
 * const resp = await client.invoices.createInvoice({
 *   generalInvoiceInfo: { ... },
 *   sellerInfo: { ... },
 *   buyerInfo: { ... },
 *   itemInfo: [ ... ]
 * })
 * console.log(resp.invoiceNumber, resp.pdfUrl)
 * ```
 */
async createInvoice(dto: unknown): Promise<CreateInvoiceResp>
```

### Experimental Marker

```typescript
export class BatchService {
  /**
   * @experimental
   * Wire format not verified against Java samples or sandbox.
   * Use at your own risk.
   */
  async createBatch(payload: unknown): Promise<BatchResp> {
    // ...
  }
}
```

### Inline Comments

- Explain *why*, not *what* (code explains what)
- Use sparingly; prefer clear code over comments

```typescript
// ✅ Explains intent
// Subtract skew to prevent 401 on near-expiry token
const refreshAt = expiryTime - this.tokenSkewMs

// ❌ Redundant
// Get the token
const token = await this.getToken()
```

## Testing Standards

### Test File Naming

- One test file per source file
- Append `.spec.ts` to source name

```
src/services/invoice-service.ts → test/unit/invoice-service.spec.ts
src/http/token-manager.ts       → test/unit/token-manager.spec.ts
```

### Test Structure

```typescript
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { InvoiceService } from '../src/services/invoice-service.js'
import { HttpClient } from '../src/http/http-client.js'
import { ViettelValidationError, ViettelApiError } from '../src/http/errors.js'

describe('InvoiceService', () => {
  let service: InvoiceService
  let mockHttp: jest.Mocked<HttpClient>

  beforeEach(() => {
    mockHttp = {
      postJson: jest.fn()
    } as any
    service = new InvoiceService(mockHttp, 'TAX123')
  })

  describe('createInvoice()', () => {
    it('should create invoice with valid payload', async () => {
      const payload = { /* ... */ }
      const response = { invoiceNumber: '001', transactionUuid: 'uuid-1' }
      mockHttp.postJson.mockResolvedValueOnce(response)

      const result = await service.createInvoice(payload)

      expect(result).toEqual(response)
      expect(mockHttp.postJson).toHaveBeenCalledWith(
        '/services/einvoiceapplication/api/InvoiceAPI/createInvoice/TAX123',
        expect.any(Object)
      )
    })

    it('should throw ViettelValidationError for invalid payload', async () => {
      const invalidPayload = { /* missing required fields */ }

      await expect(service.createInvoice(invalidPayload)).rejects.toThrow(
        ViettelValidationError
      )
    })

    it('should throw ViettelApiError for API failure', async () => {
      const payload = { /* ... */ }
      mockHttp.postJson.mockRejectedValueOnce(
        new ViettelApiError('ERR_001', 'Server error', 500)
      )

      await expect(service.createInvoice(payload)).rejects.toThrow(ViettelApiError)
    })
  })
})
```

### Coverage Requirements

- **Branches:** ≥75%
- **Functions:** ≥80%
- **Lines:** ≥80%
- **Statements:** ≥80%

Enforced via Jest `coverageThreshold`:

```json
{
  "coverageThreshold": {
    "global": {
      "branches": 75,
      "functions": 80,
      "lines": 80,
      "statements": 80
    }
  }
}
```

### Mocking Pattern

Use `axios-mock-adapter` for HTTP tests:

```typescript
import MockAdapter from 'axios-mock-adapter'
import axios from 'axios'

describe('HttpClient', () => {
  let mock: MockAdapter

  beforeEach(() => {
    const axiosInstance = axios.create()
    mock = new MockAdapter(axiosInstance)
  })

  afterEach(() => {
    mock.reset()
  })

  it('should retry on 401', async () => {
    mock.onPost('/auth/login').replyOnce(200, { access_token: 'token1' })
    mock.onPost('/endpoint').replyOnce(401).replyOnce(200, { success: true })

    // ...
  })
})
```

## Async/Await & Promises

### Rules

- Always use `async`/`await`, not `.then()`
- Mark all functions that may throw/async with `async`
- Never mix `async`/`await` with `.catch()` at top level
- Always catch or propagate errors

```typescript
// ✅ Correct
async function getInvoice(uuid: string): Promise<Invoice> {
  try {
    const resp = await http.get<Invoice>(`/invoice/${uuid}`)
    return resp
  } catch (e) {
    throw mapError(e)
  }
}

// ❌ Wrong
function getInvoice(uuid: string): Promise<Invoice> {
  return http.get(`/invoice/${uuid}`).then(r => r).catch(mapError)
}
```

## Type Safety & Generics

### Generic Constraints

```typescript
// ✅ Constrained generic
async postJson<T extends Record<string, unknown>>(
  path: string,
  data: T
): Promise<T> {
  // T is object-like
}

// ❌ Unconstrained
async postJson<T>(path: string, data: unknown): Promise<T> {
  // T could be anything; defeats type safety
}
```

### Type Narrowing

```typescript
// ✅ Type guard
function isViettelApiError(e: unknown): e is ViettelApiError {
  return e instanceof ViettelApiError
}

if (isViettelApiError(err)) {
  console.log(err.errorCode)  // Type narrowed
}

// ❌ Type assertion (less safe)
const err = e as ViettelApiError
console.log(err.errorCode)  // Could fail at runtime
```

## Dependency Injection

All major classes accept dependencies in constructor:

```typescript
// ✅ Testable: http is dependency
export class InvoiceService {
  constructor(private readonly http: HttpClient, private readonly taxCode: string) {}
}

// ❌ Hard-coded: can't mock
export class InvoiceService {
  private http = new HttpClient(config)
}
```

## Environment Variables

No hardcoded configuration. All user-provided values come from `ClientConfig`:

```typescript
// ✅ User controls config
const client = new ViettelInvoiceClient({
  baseUrl: process.env.VIETTEL_BASE_URL!,
  taxCode: process.env.TAX_CODE!,
  username: process.env.VIETTEL_USERNAME!,
  password: process.env.VIETTEL_PASSWORD!
})

// ❌ Hidden dependency
const baseUrl = process.env.VIETTEL_BASE_URL  // Not obvious to user
```

## Constants

All path and default constants in dedicated files:

```typescript
// src/http/paths.ts
export const PATH_AUTH_LOGIN = '/auth/login'
export const PATH_CREATE_INVOICE = (taxCode: string) =>
  `/services/einvoiceapplication/api/InvoiceAPI/createInvoice/${taxCode}`

// src/types/common.ts
export const InvoiceType = { GTGT: '1', BAN_HANG: '2', PXK: '6' } as const
```

## Build & Distribution

### Build Command

```bash
npm run build
# Compiles src/ → dist/
# Generates dist/index.d.ts for types
# Generates source maps (*.js.map)
```

### Package Entry Points

```json
{
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  }
}
```

### Pre-publish Hook

```json
{
  "prepublishOnly": "npm run lint && npm test && npm run build"
}
```

Ensures all tests pass and code is formatted before publishing to npm.

## Changelog & Versioning

**Semver versioning:**
- **MAJOR:** Breaking API changes
- **MINOR:** New features (backward-compatible)
- **PATCH:** Bug fixes

**Breaking changes:**
- Removed/renamed exports
- Changed method signatures
- Changed error types thrown
- Changed response types

**Non-breaking:**
- New optional properties
- New methods on services
- New experimental services

---

**Document Version:** 1.0 | **Last Updated:** 2026-05-02
