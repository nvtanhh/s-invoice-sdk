# Project Overview & Product Development Requirements

## Executive Summary

**viettel-vinvoice-sdk** is an unofficial, community-maintained TypeScript SDK for the Viettel VinInvoice e-invoice API. It provides type-safe, validated access to electronic invoice operations for Vietnamese businesses. The SDK handles authentication, HTTP communication, error mapping, and input validation—allowing developers to focus on invoice logic.

| Property | Value |
|----------|-------|
| **Package** | `viettel-vinvoice-sdk` |
| **Version** | 1.0.0 |
| **License** | Proprietary/MIT (verify in repo) |
| **Runtime** | Node.js ≥18.18, ESM-only |
| **TypeScript** | ≥5.7, strict mode enabled |
| **Status** | Stable (core APIs), Experimental (wire-format unverified) |

## Use Cases

1. **Programmatic Invoice Generation** — Create GTGT (VAT), BanHang (sales), PXK (delivery) invoices without manual UI steps.
2. **Invoice Adjustments** — Issue adjustment invoices (corrections, replacements, money/info adjustments).
3. **Invoice Cancellation** — Cancel previously issued invoices.
4. **Invoice Search** — Query invoice records by transaction UUID or other criteria.
5. **USB Token Signing** — Integrate hardware USB token for digital signatures in air-gapped environments.

## Product Scope

### In Scope (Stable APIs)
- Invoice creation with comprehensive Vietnamese tax/regulatory validation
- Invoice cancellation and search functionality
- USB token hash generation and signed hash submission
- Token-based authentication with auto-refresh
- Rich error classification (auth, validation, network, API errors)
- Input schema validation via Zod with cross-field rules
- Automatic token refresh on expiry with deduplication

### Out of Scope (Experimental)
- Batch invoice operations (wire format not verified)
- Invoice list/file retrieval (endpoints inferred, not validated)
- Payment tracking (endpoint signature uncertain)
- Template management (limited verification)

## Functional Requirements

### FR-1: Client Initialization
**Requirement:** SDK users must initialize a `ViettelInvoiceClient` with credentials and connection parameters.

**Details:**
- Accept `ClientConfig` with `baseUrl`, `taxCode`, `username`, `password`
- Optional: `tokenSkewMs` (default 30000), `timeoutMs` (default 30000), `authPath` (default `/auth/login`), `logger`
- Load configuration from environment or config files (user responsibility)
- Validate required fields at init time

**Acceptance Criteria:**
- Client constructor accepts valid config and does not throw
- Client rejects missing required fields
- Client exposes services: `invoices`, `cancel`, `search`, `usbToken`, `experimental`

### FR-2: Token Management
**Requirement:** Automatically acquire and refresh Bearer tokens without explicit user calls.

**Details:**
- On first API call, fetch token from `/auth/login` endpoint
- Cache token until near expiry (subtract `tokenSkewMs`)
- On near-expiry, automatically refresh without client knowledge
- If 401 received, invalidate token and retry once
- Handle concurrent requests gracefully (deduplicate refresh calls)

**Acceptance Criteria:**
- Token acquired on first request
- Subsequent requests within TTL reuse cached token
- Token refreshed without client intervention on expiry
- Concurrent requests do not trigger duplicate auth calls
- 401 responses trigger single retry with fresh token

### FR-3: Invoice Creation
**Requirement:** Validate and submit invoice payloads to Viettel API.

**Details:**
- Accept `CreateInvoiceWSDTOSchema`-shaped objects
- Validate invoice structure before HTTP submission:
  - Required fields (general info, seller, buyer, items)
  - Adjustment rules: type=3 or 5 require extra fields
  - Money-adjust requires `isIncreaseItem` on each line item
- POST to `/services/einvoiceapplication/api/InvoiceAPI/createInvoice/{taxCode}`
- Return `CreateInvoiceResp` with invoice number, transaction UUID, PDF URL

**Acceptance Criteria:**
- Valid payloads create invoices and return response
- Invalid payloads throw `ViettelValidationError` before HTTP call
- Response includes `invoiceNumber`, `transactionUuid`, `pdfUrl`
- Error responses mapped to `ViettelApiError` with `errorCode`/`httpStatus`

### FR-4: Invoice Cancellation
**Requirement:** Cancel previously issued invoices via transaction UUID.

**Details:**
- Accept `CancelTransactionWSDTOSchema` (form-encoded payload)
- POST to `/services/einvoiceapplication/api/InvoiceAPI/cancelTransactionInvoice`
- Return cancellation confirmation

**Acceptance Criteria:**
- Valid cancellation request succeeds and returns response
- Invalid requests throw `ViettelValidationError`
- Errors include cancellation failure reasons

### FR-5: Invoice Search
**Requirement:** Query issued invoices by transaction UUID.

**Details:**
- Accept `SearchByTransUUIDDTOSchema` (form-encoded payload)
- POST to `/services/einvoiceapplication/api/InvoiceAPI/searchInvoiceByTransactionUuid`
- Return invoice metadata and status

**Acceptance Criteria:**
- Valid search returns matching invoice(s)
- Invalid requests throw `ViettelValidationError`
- Response includes invoice details, status, issue date

### FR-6: USB Token Support
**Requirement:** Support two-step USB token signing for air-gapped environments.

**Details:**
- `getHash()`: Generate hash for external signing (returns `hash`, `transactionUuid`)
- `submitSignedHash()`: Submit signed hash back to API
- Compatible with hardware USB token devices

**Acceptance Criteria:**
- Hash generated without external signing succeeds
- Hash payload includes invoice data and transaction UUID
- Signed hash submission completes invoice creation

### FR-7: Error Handling
**Requirement:** Classify and present errors clearly for developer handling.

**Details:**
- `ViettelApiError`: Base error, includes `errorCode`, `httpStatus`, `raw` response
- `ViettelAuthError`: 401/403 responses, auth-specific
- `ViettelNetworkError`: No HTTP response (timeout, DNS, etc.)
- `ViettelValidationError`: Zod validation failure, lists field paths and messages

**Acceptance Criteria:**
- Each error type is thrown in correct scenario
- Error properties (`errorCode`, `httpStatus`) populated from API response
- Validation errors list all field failures with paths
- Errors include sufficient context for logging and user messaging

### FR-8: Type Safety
**Requirement:** Export TypeScript types for all public API surfaces.

**Details:**
- Export all request/response types
- Export enum constants: `InvoiceType`, `AdjustmentType`, `AdjustmentInvoiceType`
- Export factory functions: `newGtgtDefaults()`, `newPxkDefaults()`, `newBanHangDefaults()`
- Enable strict TypeScript compilation

**Acceptance Criteria:**
- All public APIs have type definitions
- Exported enums enable IDE autocomplete
- Default factories provide partial invoice data
- No `any` types (only `unknown` in mappers)

## Non-Functional Requirements

### NFR-1: Performance
- Token refresh deduplicates concurrent requests (single auth call, multiple waiters)
- HTTP timeout configurable, defaults to 30s
- Validation synchronous, fast path (no external I/O)

### NFR-2: Reliability
- Automatic 401 retry with single attempt (prevents infinite loops)
- Network errors distinguish timeouts from server errors
- Token expiry buffer (`tokenSkewMs`) prevents edge-case 401s

### NFR-3: Testability
- Unit test coverage ≥75% branches, ≥80% functions/lines/statements
- All HTTP calls mockable via axios-mock-adapter
- Error scenarios covered with unit tests
- No hardcoded credentials in code

### NFR-4: Maintainability
- Single responsibility per service class
- Schemas source of truth for both validation and OpenAPI generation
- Experimental services isolated in separate folder, marked with `@experimental` JSDoc
- Code formatting via Prettier, linting via ESLint

### NFR-5: Security
- Credentials never logged except to custom logger (developer responsibility)
- Bearer token injected on every non-auth request
- HTTPS enforced (baseUrl validation, though user responsibility)
- No secrets in `.env.example` or repository

### NFR-6: Compatibility
- ESM-only (no CommonJS build)
- Node.js 18.18+ required
- Internal imports use `.js` extension (ES module spec)
- TypeScript strict mode enforced

## Roadmap & Status

| Feature | Status | Notes |
|---------|--------|-------|
| Invoice creation (GTGT, BanHang, PXK) | ✅ Stable | Verified with live API |
| Adjustment invoices (type=3, 5) | ✅ Stable | Cross-field validation in place |
| Invoice cancellation | ✅ Stable | Tested against API |
| Invoice search | ✅ Stable | Form-encoded query support |
| USB token signing | ✅ Stable | Two-step flow implemented |
| Token management | ✅ Stable | Auto-refresh, 401-retry, deduplication |
| Batch operations | 🔶 Experimental | Wire format inferred from Java, not verified |
| Invoice list/file retrieval | 🔶 Experimental | Endpoints not sandbox-verified |
| Payment tracking | 🔶 Experimental | Endpoint signature uncertain |
| Templates | 🔶 Experimental | Limited endpoint coverage |

## Constraints & Assumptions

### Constraints
- Viettel VinInvoice API availability (managed by Viettel)
- User must manage baseUrl, credentials, taxCode lifecycle
- Form-encoded endpoints (`cancelTransactionInvoice`, `searchInvoiceByTransactionUuid`) require `qs` for encoding
- Token TTL is ~20 minutes (1198s); SDK default 30s skew recommended

### Assumptions
- Users target Vietnamese tax authority compliance
- Credentials stored securely by consuming application
- Custom logger (if provided) does not log sensitive data
- USB token hardware drivers available on client machine (app responsibility)
- API baseUrl does not change frequently

## Success Metrics

- **Code Coverage:** ≥75% branches, ≥80% functions/lines/statements
- **Type Safety:** Zero `any` types in public APIs; `no-explicit-any` rule enforced
- **Error Handling:** All error paths tested, 100% of error types thrown in correct scenarios
- **Documentation:** All public functions, types, enums documented with JSDoc
- **Performance:** Token refresh < 200ms (network-dependent)
- **Adoption:** (Tracked by maintainers) Usage across Vietnamese business applications

## Dependencies

| Dependency | Version | Purpose |
|-----------|---------|---------|
| `axios` | ^1.7.9 | HTTP client |
| `zod` | ^3.23.8 | Input validation & schema generation |
| `qs` | ^6.13.0 | Form-encoding for two endpoints |

## Testing Strategy

- **Unit Tests:** Mock HTTP, token refresh, error mapping (1,936 LOC)
- **Integration Tests:** Live API calls (gated by `VINVOICE_LIVE=1` env var)
- **Coverage:** Jest with thresholds enforced in CI
- **Fixtures:** Real invoice payloads (GTGT sample in `test/fixtures/`)

## Version & Release

- **Current Version:** 1.0.0
- **Release Cadence:** Follows semver; breaking changes bump major
- **Pre-publish:** `npm run lint && npm test && npm run build` (enforced via `prepublishOnly`)

---

**Document Version:** 1.0 | **Last Updated:** 2026-05-02
