# System Architecture

## High-Level Overview

The SDK is organized in **layered architecture** with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────┐
│  Public API Layer                                       │
│  ViettelInvoiceClient                                   │
│  ├── invoices: InvoiceService                           │
│  ├── cancel: CancelService                              │
│  ├── search: SearchService                              │
│  ├── usbToken: UsbTokenService                          │
│  └── experimental: { list, file, templates, ... }       │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  Service Layer (Business Logic)                         │
│  ├── InvoiceService → createInvoice()                   │
│  ├── CancelService → cancelInvoice()                    │
│  ├── SearchService → searchByTransactionUuid()          │
│  ├── UsbTokenService → getHash(), submitSignedHash()    │
│  └── Experimental services (unverified)                 │
│                                                          │
│  Responsibilities:                                       │
│  • Validate input via Zod schemas                       │
│  • Map business methods to HTTP calls                   │
│  • Handle service-level errors                          │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  HTTP Layer (Communication & Auth)                      │
│  ┌───────────────────────────────────────────────────┐  │
│  │ HttpClient (Axios wrapper)                        │  │
│  │ ├── postJson<T>(path, data): Promise<T>           │  │
│  │ ├── postForm<T>(path, data): Promise<T>           │  │
│  │ └── get<T>(path): Promise<T>                       │  │
│  │                                                    │  │
│  │ Responsibilities:                                 │  │
│  │ • Manage Axios instance                           │  │
│  │ • Inject Bearer token on all non-auth requests    │  │
│  │ • Handle 401 responses (invalidate + retry once)  │  │
│  │ • Map Axios errors to SDK error types             │  │
│  └───────────────────────────────────────────────────┘  │
│                          ↓                               │
│  ┌───────────────────────────────────────────────────┐  │
│  │ TokenManager (Bearer Token Lifecycle)             │  │
│  │ ├── getToken(): Promise<string>                   │  │
│  │ └── invalidate(): void                            │  │
│  │                                                    │  │
│  │ Responsibilities:                                 │  │
│  │ • Fetch /auth/login on first call                 │  │
│  │ • Cache token until near-expiry (with skew)       │  │
│  │ • Auto-refresh on near-expiry                     │  │
│  │ • Deduplicate concurrent refresh calls            │  │
│  │ • Handle auth failures                            │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  Validation & Types Layer                               │
│  ├── Zod Schemas (src/schemas/)                         │
│  │   └── Source of truth for input validation           │
│  ├── TypeScript Types (src/types/)                      │
│  │   └── Request/Response DTOs                          │
│  └── Enums (InvoiceType, AdjustmentType, ...)           │
│      └── Vietnamese invoice type constants              │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  External: Viettel VinInvoice API                       │
│  https://vinvoice.viettel.vn/api/services/...           │
└─────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

### Invoice Creation Flow

```
User Code
   ↓
client.invoices.createInvoice(dto)
   ↓
InvoiceService.createInvoice()
   ├─ 1. Parse DTO against CreateInvoiceWSDTOSchema
   │     ├─ Valid → continue
   │     └─ Invalid → throw ViettelValidationError
   ├─ 2. Call HttpClient.postJson()
   │     ├─ Token not cached → TokenManager.getToken()
   │     │     └─ POST /auth/login → receive access_token
   │     ├─ Inject Authorization: Bearer <token>
   │     └─ POST /createInvoice/{taxCode}
   │          ├─ 200 → return response
   │          ├─ 401 → invalidate token, retry (once)
   │          └─ Other error → throw ViettelApiError
   ↓
CreateInvoiceResp { invoiceNumber, transactionUuid, pdfUrl, ... }
   ↓
User Code
```

### Token Refresh Flow

```
Request #1
   ↓
TokenManager.getToken()
   ├─ Token cached and not expired? → return it
   └─ No token or expired (now > expiryTime - tokenSkewMs)
        ├─ In-flight refresh? → wait for it
        └─ No in-flight refresh
             ├─ POST /auth/login { username, password }
             ├─ Parse response: { access_token, expires_in, ... }
             ├─ Calculate expiryTime = now + expires_in * 1000
             ├─ Cache: { token, expiryTime }
             └─ return token

Request #2 (immediately after, token still cached)
   ↓
TokenManager.getToken()
   ├─ Token cached and not expired? → return it (fast path)
   ↓
Reuse cached token
```

### 401 Retry Flow

```
Request
   ↓
HttpClient makes request with Bearer token
   ├─ Response 200 → success
   ├─ Response 401 → error response + interceptor
   │     ├─ Mark: _retried = false (first time)
   │     ├─ TokenManager.invalidate() → clear cache
   │     ├─ Retry same request
   │     │     └─ TokenManager.getToken() → fresh token
   │     │          └─ POST /auth/login
   │     ├─ Response 200 (retry) → success
   │     └─ Response 401 (retry) → throw ViettelAuthError
   └─ Other error → throw mapped error
```

## Error Handling Architecture

### Error Hierarchy

```
Error (JavaScript)
├── ViettelApiError (HTTP responses with error info)
│   ├── errorCode: string (from API)
│   ├── httpStatus?: number (e.g., 400, 500)
│   ├── raw?: unknown (original response body)
│   └── ViettelAuthError (401, 403 responses)
│       ├── errorCode: string
│       ├── httpStatus: 401 | 403
│       └── raw: AuthErrorResponse
├── ViettelNetworkError (no HTTP response)
│   └── message: string (timeout, DNS failure, etc.)
└── ViettelValidationError (Zod validation failures)
    ├── issues: { path: string, message: string }[]
    └── message: formatted summary
```

### Error Throwing Rules

| Scenario | Error Type | When |
|----------|-----------|------|
| Input validation fails | `ViettelValidationError` | Before HTTP call, in service |
| API returns 401/403 | `ViettelAuthError` | After HTTP response, in mapError() |
| API returns other error | `ViettelApiError` | After HTTP response, in mapError() |
| No HTTP response | `ViettelNetworkError` | Axios error without response |
| Unknown error | Rethrow original | Last resort, should not reach users |

### Error Mapping Flow

```
Axios request
   ├─ Success (2xx) → return parsed response
   ├─ Error (status) → AxiosError with response
   │     └─ mapError()
   │          ├─ Extract errorCode from response.data.errorCode
   │          ├─ Extract message from response.data.description
   │          ├─ Check status: 401/403? → ViettelAuthError
   │          └─ Else → ViettelApiError
   └─ Error (no response) → AxiosError without response
        └─ mapError()
             └─ ViettelNetworkError
```

## Authentication Architecture

### Authentication Flow (First Request)

```
1. User creates ViettelInvoiceClient(config)
   └─ Config includes: baseUrl, username, password, optional authPath

2. User calls client.invoices.createInvoice(dto)

3. InvoiceService calls HttpClient.postJson()

4. HttpClient request interceptor:
   ├─ Is this the auth endpoint? → skip bearer injection
   └─ Else → await TokenManager.getToken()

5. TokenManager.getToken():
   ├─ Token cached and not near-expiry? → return it
   └─ Else:
        ├─ POST {authPath} (default /auth/login)
        ├─ Body: { username, password, rememberMe: false, captcha: '' }
        ├─ Response: { access_token, expires_in, ... }
        ├─ Cache token with expiry = now + (expires_in * 1000 - tokenSkewMs)
        └─ return access_token

6. HttpClient injects Authorization: Bearer <access_token>

7. POST /createInvoice/{taxCode} with Bearer header

8. Response 200 → success
```

### Token Expiry Handling

```
Cached Token Lifecycle:

Time 0: Token acquired
├─ access_token = "eyJ..."
├─ expires_in = 1198 (seconds, from API response)
├─ tokenSkewMs = 30000 (milliseconds, from config)
├─ expiryTime = now + (1198 * 1000) = now + 1,198,000ms
├─ refreshAt = expiryTime - tokenSkewMs = now + 1,168,000ms

Time 1,100s: Token still valid
├─ now < refreshAt? → yes
└─ Continue using cached token

Time 1,170s: Token near expiry (skew triggered)
├─ now > refreshAt? → yes
├─ Fetch new token on next call
└─ TokenManager.getToken() → POST /auth/login

Time 1,200s: Token would be expired
├─ Already refreshed before this time
└─ New token in use
```

### Password Security

- Password provided by user in `ClientConfig`
- SDK **never** logs password (use custom logger to prevent logging)
- Password used only in POST body to `/auth/login`
- Access token is short-lived (~20 minutes)
- No password caching; only Bearer token cached

```typescript
// ✅ Safe: password hidden from logs
client.info('Token refreshed', { expiryTime })

// ❌ Unsafe: password leaked
client.info('Login attempt', { username, password })  // Never do this
```

## Validation Architecture

### Zod Schema-First Design

```
Zod Schemas (Single Source of Truth)
       ↓
   ┌───┴─────────────────────────────┐
   ↓                                  ↓
Input Validation               OpenAPI Generation
(Runtime Type Guard)           (Documentation)

CreateInvoiceWSDTOSchema
├─ Validates user input at runtime
├─ Throws ZodError on failure
├─ Maps to TypeScript types (invoice-input.ts)
└─ Generates OpenAPI operation schema
```

### Validation Rules (Example: CreateInvoiceWSDTOSchema)

```
GeneralInvoiceInfo
├─ templateCode: required string (e.g., "1/0230")
├─ invoiceNumber: required string (e.g., "001")
├─ invoiceSeries: required string (e.g., "K25TII")
├─ invoiceType: required '1' | '2' | '6'
│   ├─ '1' = GTGT (VAT invoice)
│   ├─ '2' = BanHang (sales invoice)
│   └─ '6' = PXK (delivery note)
├─ adjustmentType: required '1' | '3' | '5'
│   ├─ '1' = NEW (original)
│   ├─ '3' = REPLACE (replacement)
│   └─ '5' = ADJUST (adjustment)
│
├─ Cross-field Rules (superRefine):
│  ├─ adjustmentType='3' (REPLACE) requires:
│  │   └─ adjustedInvoiceNumber, adjustedInvoiceSeries
│  │
│  ├─ adjustmentType='5' (ADJUST) requires:
│  │   ├─ adjustmentInvoiceType: '1' | '2'
│  │   └─ If adjustmentInvoiceType='1' (MONEY_ADJUST):
│  │       └─ adjustedInvoiceNumber, adjustedInvoiceSeries
│  │
│  └─ Money-adjust (type='5', invoiceType='1', adjInvType='1'):
│      └─ itemInfo[] must have at least one isIncreaseItem=true
│
├─ itemInfo: required array
│   └─ Each item:
│      ├─ productName: required string
│      ├─ quantity: required number
│      ├─ unitPrice: required number
│      ├─ isIncreaseItem?: boolean (for adjustments)
│      └─ more fields...
│
└─ sellerInfo, buyerInfo, etc.
```

### Custom Refinement Example

```typescript
export const CreateInvoiceWSDTOSchema = z.object({
  generalInvoiceInfo: GeneralInvoiceInfoSchema,
  itemInfo: z.array(InvoiceItemInfoSchema)
}).superRefine((data, ctx) => {
  const adj = data.generalInvoiceInfo.adjustmentType
  const adjInv = data.generalInvoiceInfo.adjustmentInvoiceType
  const invType = data.generalInvoiceInfo.invoiceType

  // Money adjust rule
  if (adj === '5' && adjInv === '1' && invType === '1') {
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

## HTTP Communication Layer

### Axios Instance Configuration

```typescript
const axiosInstance = axios.create({
  baseURL: cfg.baseUrl,  // e.g., "https://vinvoice.viettel.vn/api"
  timeout: cfg.timeoutMs ?? 30000  // Default 30 seconds
})
```

### Request Interceptor (Token Injection)

```typescript
axiosInstance.interceptors.request.use(async (req) => {
  // Never inject on auth endpoint itself
  if (req.url === this.authPath) return req

  // Get current token (uses cache if valid)
  const token = await this.tokenManager.getToken()

  // Inject Bearer header
  req.headers.set('Authorization', `Bearer ${token}`)

  return req
})
```

### Response Interceptor (401 Handling)

```typescript
axiosInstance.interceptors.response.use(undefined, async (err: AxiosError) => {
  const reqCfg = err.config as RetryConfig | undefined

  // Only retry on 401 AND first time (not retried)
  if (err.response?.status === 401 && reqCfg && !reqCfg._retried) {
    // Invalidate cached token
    this.tokenManager.invalidate()

    // Mark as retried (prevent infinite loop)
    reqCfg._retried = true

    // Retry same request (will get fresh token)
    return this.axiosInstance.request(reqCfg)
  }

  // All other errors: map to SDK error type
  mapError(err)
})
```

### Content-Type Handling

| Endpoint | Method | Content-Type | Encoding |
|----------|--------|--------------|----------|
| `/createInvoice/{taxCode}` | POST | application/json | JSON |
| `/cancelTransactionInvoice` | POST | application/x-www-form-urlencoded | Form (via `qs`) |
| `/searchInvoiceByTransactionUuid` | POST | application/x-www-form-urlencoded | Form (via `qs`) |
| `/getHash` | POST | application/json | JSON |
| Others | POST/GET | application/json | JSON |

## Concurrency & Race Conditions

### Token Refresh Deduplication

Problem: If 2+ requests arrive during token expiry, both would trigger refresh, causing duplicate auth calls.

Solution: In-flight promise caching in TokenManager:

```typescript
private inFlightRefresh: Promise<string> | null = null

async getToken(): Promise<string> {
  // 1. Token valid? → return it
  if (this.token && !this.isExpired()) {
    return this.token
  }

  // 2. Refresh in flight? → wait for it
  if (this.inFlightRefresh) {
    return this.inFlightRefresh
  }

  // 3. Start new refresh
  this.inFlightRefresh = this.refresh()

  try {
    const token = await this.inFlightRefresh
    return token
  } finally {
    this.inFlightRefresh = null  // Clear for next refresh
  }
}
```

### Thread Safety

Node.js is single-threaded (event loop), so:
- No explicit locks needed
- `async`/`await` guarantees consistent ordering
- Race conditions only possible on clock skew or timing bugs

## USB Token Signing Workflow

### Two-Step Signing Process

```
User Application
       ↓
Step 1: client.usbToken.getHash(invoiceData)
       ├─ SDK validates input
       ├─ POST to /getHash
       ├─ Receive: { hash: "abc123...", transactionUuid: "uuid-x" }
       └─ Return to user
       ↓
User Application (with hardware USB token)
       ├─ User signs hash externally: signedHash = USBToken.sign(hash)
       └─ Return signedHash to SDK call
       ↓
Step 2: client.usbToken.submitSignedHash(signedHash, transactionUuid)
       ├─ SDK validates input
       ├─ POST signed hash to API
       ├─ API verifies signature, creates invoice
       └─ Return response
       ↓
User Application
       └─ Invoice created (if signature valid)
```

### Separation of Concerns

- SDK handles validation and HTTP communication
- Application handles USB token hardware access
- No secrets leak between steps (hash is public, signature is public)

## Logging Architecture

### Custom Logger Interface

```typescript
interface Logger {
  debug: (msg: string, meta?: unknown) => void
  info:  (msg: string, meta?: unknown) => void
  warn:  (msg: string, meta?: unknown) => void
  error: (msg: string, meta?: unknown) => void
}
```

### Logging Guidelines

- Default: `noopLogger` (silent, no performance impact)
- User can provide custom logger: `ClientConfig.logger`
- SDK logs:
  - Token refresh events (debug/info level)
  - Auth failures (warn/error level)
  - Network timeouts (warn level)
  - Never logs credentials, tokens, or secrets

### Example Integration

```typescript
const client = new ViettelInvoiceClient({
  // ...config...
  logger: {
    debug: (msg, meta) => console.log(`[DEBUG] ${msg}`, meta),
    info:  (msg, meta) => console.log(`[INFO]  ${msg}`, meta),
    warn:  (msg, meta) => console.warn(`[WARN]  ${msg}`, meta),
    error: (msg, meta) => console.error(`[ERROR] ${msg}`, meta)
  }
})
```

## Scalability Considerations

### What Scales
- Requests are independent (no shared mutable state except token cache)
- Token cache is per-client instance (isolated)
- Concurrent requests deduplicate auth via promise caching

### What Doesn't Scale
- SDK is client-side library (not a server)
- Designed for single-threaded Node.js
- Token cache is in-memory (lost on process restart)

### Deployment Pattern

```
Application Server (Node.js)
   ├─ ViettelInvoiceClient instance (per process or pooled)
   ├─ Token cache (in-memory)
   └─ Requests to Viettel API (1 token per application)
```

If multiple app servers, each has own token cache (OK, tokens are cheap to refresh).

## Dependencies

### Direct Dependencies

| Package | Version | Purpose | Risk |
|---------|---------|---------|------|
| `axios` | ^1.7.9 | HTTP client | Stable, widely used |
| `zod` | ^3.23.8 | Validation schemas | Stable, open-source |
| `qs` | ^6.13.0 | Form encoding | Stable, npm standard |

### Dev Dependencies

| Package | Purpose |
|---------|---------|
| `@asteasolutions/zod-to-openapi` | Schema → OpenAPI conversion |
| `@types/jest`, `jest`, `ts-jest` | Unit testing |
| `axios-mock-adapter` | HTTP mocking in tests |
| `eslint`, `prettier`, `typescript` | Tooling |

### No Heavy External Deps
- No crypto/signing libraries (USB token is external)
- No database or persistence (in-memory token only)
- No event emitters or observables

## Future Architecture Considerations

### Potential Improvements (Not Implemented)

1. **Token Persistence** — Save token to disk/cache for faster restarts
2. **Batch Operations** — More efficient bulk invoice creation
3. **Event Emitters** — Allow consumers to listen to token refresh events
4. **Retry Policies** — Configurable exponential backoff for transient failures
5. **Observability** — Tracing/metrics hooks for APM integration

### Backward Compatibility

Any future changes must:
- Maintain current `ViettelInvoiceClient` constructor signature
- Keep all stable services and methods available
- Only add new methods or optional parameters
- Mark breaking changes in major version bump

---

**Document Version:** 1.0 | **Last Updated:** 2026-05-02
