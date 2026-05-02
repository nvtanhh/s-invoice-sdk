# Project Roadmap & Status

## Current Release: v1.0.0

**Release Date:** 2026-05-02  
**Status:** Stable with experimental features

## Stability Matrix

### Stable APIs (Production-Ready)

All stable APIs have been verified against the live Viettel VinInvoice API. They are safe to use in production applications.

| Feature | Module | Status | Verified | Notes |
|---------|--------|--------|----------|-------|
| **Invoice Creation** | `InvoiceService` | ✅ Stable | Live API | GTGT, BanHang, PXK types supported |
| **Adjustment Invoices** | `InvoiceService` | ✅ Stable | Live API | REPLACE (type=3), ADJUST (type=5) with cross-field validation |
| **Money Adjustments** | `InvoiceService` | ✅ Stable | Live API | type=5, invoiceType=1 with isIncreaseItem validation |
| **Invoice Cancellation** | `CancelService` | ✅ Stable | Live API | Form-encoded POST to cancelTransactionInvoice |
| **Invoice Search** | `SearchService` | ✅ Stable | Live API | Query by transactionUuid, form-encoded |
| **USB Token Signing** | `UsbTokenService` | ✅ Stable | Live API | Two-step: getHash() → submitSignedHash() |
| **Token Management** | `TokenManager` | ✅ Stable | Live API | Auto-refresh, 401-retry, deduplication |
| **Error Classification** | `http/errors.ts` | ✅ Stable | Live API | ViettelApiError, ViettelAuthError, ViettelNetworkError, ViettelValidationError |
| **Input Validation** | `CreateInvoiceWSDTOSchema` | ✅ Stable | Live API | Comprehensive Zod schemas with cross-field rules |

### Experimental APIs (Wire Format Unverified)

These services exist but have not been validated against actual API responses or the Java SDK implementation. Use at your own risk.

| Feature | Module | Status | Issue |
|---------|--------|--------|-------|
| **Batch Invoice Creation** | `BatchService` | 🔶 Experimental | Endpoint signature inferred from Java DTOs, not verified against sandbox |
| **Invoice List** | `ListService` | 🔶 Experimental | Endpoint path estimated; response format uncertain |
| **File Retrieval** | `FileService` | 🔶 Experimental | Endpoint not sandbox-tested |
| **Template Management** | `TemplateService` | 🔶 Experimental | Limited endpoint coverage; request/response shapes guessed |
| **Payment Tracking** | `PaymentService` | 🔶 Experimental | Endpoint signature uncertain; no integration tests |

**Experimental Service Marker:**
```typescript
/**
 * @experimental
 * Wire format not verified against Java samples or sandbox.
 * Use at your own risk.
 */
```

All experimental services are under `ViettelInvoiceClient.experimental.*` namespace to signal their status.

## Development Status by Phase

### Phase 1: Core APIs (Completed ✅)

**Goal:** Implement stable, verified APIs for invoice creation, cancellation, and search.

| Task | Status | Date |
|------|--------|------|
| Invoice creation (GTGT, BanHang, PXK) | ✅ Done | Initial |
| Adjustment invoice support (type=3, 5) | ✅ Done | Initial |
| Money adjust validation (isIncreaseItem) | ✅ Done | Initial |
| Invoice cancellation | ✅ Done | Initial |
| Invoice search by UUID | ✅ Done | Initial |
| USB token signing (2-step) | ✅ Done | Initial |
| Token management (refresh, 401-retry) | ✅ Done | Initial |
| Zod validation schemas | ✅ Done | Initial |
| TypeScript type definitions | ✅ Done | Initial |
| Unit tests (≥80% coverage) | ✅ Done | Initial |
| Error classification | ✅ Done | Initial |
| OpenAPI spec generation | ✅ Done | Initial |

### Phase 2: Experimental APIs (Completed ✅)

**Goal:** Implement additional services based on Java SDK source (not verified).

| Task | Status | Date |
|------|--------|------|
| Batch invoice creation | ✅ Done | Initial |
| Invoice list retrieval | ✅ Done | Initial |
| File retrieval | ✅ Done | Initial |
| Template management | ✅ Done | Initial |
| Payment tracking | ✅ Done | Initial |
| Mark experimental services with JSDoc | ✅ Done | Initial |

### Phase 3: Documentation (Current)

**Goal:** Create comprehensive documentation for developers.

| Task | Status |
|------|--------|
| Project overview & PDR | ✅ Done |
| Codebase summary | ✅ Done |
| Code standards & conventions | ✅ Done |
| System architecture | ✅ Done |
| Project roadmap | ✅ Done |
| Deployment guide (npm publish) | In progress |
| API authentication (preserved) | ✅ Existing |

## Known Limitations

### Experimental Services

The following services are **not production-ready** because their API contracts are unverified:

1. **BatchService.createBatch()**
   - Endpoint: Estimated from Java code
   - Response format: Guessed from DTO naming
   - Recommendation: Test thoroughly before using in production
   - Sandbox verification needed

2. **ListService.list()**
   - Endpoint path may be incorrect
   - Query parameters uncertain
   - Response paging unknown
   - Recommendation: Compare with Java SDK output

3. **FileService.getFile()**
   - No endpoint documentation found
   - Unclear if returns PDF or metadata
   - Recommendation: Verify against live API first

4. **TemplateService.getTemplates()**
   - Limited coverage in Java source
   - Request/response shapes guessed
   - Recommendation: Not recommended for production

5. **PaymentService.getPayments()**
   - Endpoint signature uncertain
   - No sample payloads found
   - Recommendation: Not recommended for production

### Other Limitations

1. **USB Token Drivers** — Assumption that external hardware drivers are available on client machine
2. **Token Persistence** — Token lost on process restart (re-authentication required)
3. **No Retry Policies** — Only 401-specific retry; other transient errors not retried
4. **Single Base URL** — Cannot switch API endpoints per request (user must create new client)
5. **Form-Encoded Endpoints** — Only 2 endpoints use form-encoding; others JSON (documented in `src/utils/form-encode.ts`)

## Roadmap: v1.1.0 (Proposed)

**Target Date:** TBD

### PR-1: Experimental Service Verification

**Goal:** Verify and stabilize experimental services against sandbox.

| Service | Work | Estimate |
|---------|------|----------|
| BatchService | Test against sandbox, adjust schemas | 2-3 days |
| ListService | Verify endpoint, test pagination | 2 days |
| FileService | Verify endpoint, test response | 1 day |
| TemplateService | Verify endpoint, test listing | 1 day |
| PaymentService | Verify endpoint, test queries | 1 day |

**Acceptance Criteria:**
- All experimental endpoints tested against sandbox
- Response types verified and documented
- Schemas updated with correct field names/types
- All experimental markers removed once verified

### PR-2: Logging & Observability

**Goal:** Improve visibility into SDK operations.

| Feature | Details |
|---------|---------|
| Debug logging | Add optional debug output for token refresh, HTTP calls |
| Structured logging | Support structured logging (JSON) via custom logger |
| Metrics hooks | Allow consuming apps to track token refreshes, errors |

### PR-3: Error Recovery

**Goal:** Add automatic retry logic for transient failures.

| Feature | Details |
|---------|---------|
| Exponential backoff | Configurable retry on 5xx errors |
| Circuit breaker | Fail fast if API is down |
| Timeout configuration | Per-endpoint timeout overrides |

### PR-4: Token Persistence

**Goal:** Reduce authentication latency on process restart.

| Feature | Details |
|---------|---------|
| Optional token caching | Save token to disk (optional, user controls) |
| Token validation on load | Verify cached token still valid before use |
| Security considerations | Document risks (token file permissions, etc.) |

## Roadmap: v2.0.0 (Long-term, Breaking Changes)

**Target Date:** TBD (not before v1.1 stabilization)

### Potential Breaking Changes

> These are speculative and would only be implemented if there is clear user demand.

1. **Move to TypeScript Classes for DTOs** — Convert interfaces to classes for validation methods
2. **Change Response Types** — If Viettel API changes structure significantly
3. **Remove Deprecated Experimental Services** — If never used by community
4. **Require Node.js 20+** — If we want to use newer async/await patterns

### Non-Breaking Additions

1. Support for Viettel's new API versions (if released)
2. Additional invoice types (if Vietnamese tax authority introduces them)
3. Webhook/polling support for long-running operations
4. Rate limiting client-side
5. Batch operation improvements (pagination, streaming)

## Support Matrix

| Node.js Version | Status | Notes |
|-----------------|--------|-------|
| 18.18 - 18.x | ✅ Supported | Minimum version for ESM |
| 19.x | ✅ Supported | Full support |
| 20.x | ✅ Supported | Current LTS, recommended |
| 22.x | ✅ Supported | Latest |

## Testing Coverage

| Area | Coverage | Status |
|------|----------|--------|
| Schemas | High (568 LOC) | ✅ Comprehensive |
| Services | High (348 LOC invoice, 295 LOC cancel) | ✅ Comprehensive |
| HTTP layer | High (317 LOC token manager, 220 LOC errors) | ✅ Comprehensive |
| Experimental services | Low | 🔶 Minimal, needs sandbox verification |
| Integration tests | Limited (gated by VINVOICE_LIVE=1) | 🔶 Manual/nightly |

**Overall Coverage:** ≥75% branches, ≥80% functions/lines/statements (enforced)

## Dependencies Update Policy

### Regular Updates
- Dependencies checked monthly via `npm outdated`
- Security patches applied immediately
- Minor updates tested in CI before release

### Dependencies (Current)
- `axios` ^1.7.9 — Actively maintained, stable API
- `zod` ^3.23.8 — Actively maintained, new versions backward-compatible
- `qs` ^6.13.0 — Mature, rarely changes

**Note:** No major version changes planned unless blocking security issue discovered.

## Migration Guides (When Needed)

### v1.0 → v1.1

- No breaking changes planned
- Experimental services may have schemas updated (wire format fixes)
- Users of experimental services should test thoroughly

### v1.x → v2.0

- If released, migration guide will be published
- Community notice period: 6 months notice before v2.0 release
- v1.x will receive security patches for 12 months post-v2.0

## Success Metrics & KPIs

| Metric | Target | Current |
|--------|--------|---------|
| **Test Coverage** | ≥80% | ✅ Met |
| **API Documentation** | 100% of public APIs | ✅ Met |
| **Type Safety** | Zero `any` types | ✅ Met |
| **Build Time** | <30s | N/A (user responsibility) |
| **Runtime (first request)** | <1s (with auth) | Depends on Viettel latency |
| **Token Refresh** | <200ms | Depends on Viettel latency |
| **NPM Downloads** | TBD | Not yet published |
| **GitHub Stars** | TBD | Not yet open-source |

## Release Checklist

Before each release:

- [ ] All tests pass locally and in CI
- [ ] Code coverage ≥ thresholds
- [ ] No linting errors
- [ ] CHANGELOG updated
- [ ] Version bumped in package.json
- [ ] Git tag created
- [ ] `npm publish` (prepublishOnly hook runs: lint → test → build)
- [ ] GitHub release created
- [ ] Documentation reviewed and updated

## Contributing Guidelines (Future)

When this becomes open-source:

1. **Bug Reports** — Include Node.js version, SDK version, minimal reproducible example
2. **Feature Requests** — Link to Viettel API documentation if applicable
3. **Pull Requests** — Must include tests, pass linting, maintain coverage threshold
4. **Experimental Services** — Sandbox verification required before moving to stable

## Deprecation Policy

When features are deprecated:

1. Mark with `@deprecated` JSDoc comment
2. Point to replacement in documentation
3. Keep functional for at least 2 minor versions
4. Remove in next major version
5. Announce in CHANGELOG with migration guide

Example:
```typescript
/**
 * @deprecated Use `createInvoice()` instead. This method will be removed in v2.0.
 * @see createInvoice
 */
async legacyCreate(dto: unknown): Promise<CreateInvoiceResp> {
  return this.createInvoice(dto)
}
```

## Communication & Feedback

### Issue Reporting
- GitHub Issues (when open-source)
- Email for private projects

### Change Announcements
- CHANGELOG in repository
- Release notes on npm
- Major breaking changes: blog post or email notice (future)

---

**Document Version:** 1.0 | **Last Updated:** 2026-05-02  
**Next Review:** 2026-08-02 (quarterly)
