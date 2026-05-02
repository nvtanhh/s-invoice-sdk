# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run build          # compile TypeScript → dist/ (tsconfig.build.json)
npm test               # jest unit tests
npm run test:int       # integration tests against live API (requires VINVOICE_LIVE=1)
npx jest test/unit/invoice-service.spec.ts   # run a single test file
npm run lint           # eslint src test
npm run format         # prettier --write .
npm run openapi        # regenerate openapi.yaml from Zod schemas
```

## Architecture

**ESM-only TypeScript SDK** for the Viettel VinInvoice e-invoice API (Node.js ≥18.18).

### Entry point
`src/index.ts` re-exports `ViettelInvoiceClient` (main class), public types, error classes, and factory helpers.

### Layer structure

```
src/
  client.ts          ← ViettelInvoiceClient: composes all services, takes ClientConfig
  config.ts          ← ClientConfig + Logger interfaces
  http/
    http-client.ts   ← HttpClient: Axios wrapper with auto-auth + 401-retry-once
    token-manager.ts ← Bearer token cache with in-flight deduplication
    errors.ts        ← Error hierarchy: ViettelApiError, ViettelAuthError,
                       ViettelNetworkError, ViettelValidationError
    paths.ts         ← All API URL path constants/factories
  services/
    invoice-service.ts   ← createInvoice (stable)
    cancel-service.ts    ← cancelInvoice (stable, form-encoded)
    search-service.ts    ← searchByTransactionUuid (stable, form-encoded)
    usb-token-service.ts ← USB token signing: getHash + submitSignedHash
    experimental/        ← list/file/templates/payments/batch — wire format unverified
  schemas/
    invoice-input.schema.ts  ← Zod schemas (source of truth for validation + OpenAPI)
  types/
    invoice-input.ts   ← Plain TypeScript interfaces (mirror of schemas)
    invoice-output.ts  ← Response interfaces
    common.ts          ← Const enums: InvoiceType, AdjustmentType, etc.
  factories/
    invoice-defaults.ts  ← newGtgtDefaults / newPxkDefaults / newBanHangDefaults
  utils/
    date.ts            ← toEpochMs, toDmy (dd/MM/yyyy), fromDmy
    form-encode.ts     ← Documents which endpoints use form-encoding vs JSON
```

### Key design decisions

**Dual schema + type representation**: Zod schemas in `src/schemas/` are used for runtime validation and OpenAPI generation. Plain TypeScript interfaces in `src/types/` mirror the same shapes for consumer-facing typings. Keep them in sync when adding fields.

**Import extension rule**: All internal imports must use `.js` extensions (NodeNext module resolution), e.g. `import { Foo } from './foo.js'`.

**Encoding split**: `createInvoice` and USB token endpoints use `application/json`; `cancelInvoice` and `searchByTransactionUuid` use `application/x-www-form-urlencoded` (verified from Java samples — see `src/utils/form-encode.ts`).

**Adjustments validation**: `CreateInvoiceWSDTOSchema` has `superRefine` logic that enforces cross-field requirements for `adjustmentType` values `'3'` (replace) and `'5'` (adjust). Modification requires matching both the Zod schema and the `CreateInvoiceWSDTO` interface.

**Error flow**: `HttpClient` catches Axios errors and calls `mapError()` which converts them into the SDK error hierarchy. Services validate input with `safeParse` and throw `ViettelValidationError` before the HTTP call.

**Token lifecycle**: `TokenManager` caches the Bearer token, deduplicates concurrent refresh calls (inflight promise), subtracts `tokenSkewMs` before expiry. On 401, `HttpClient` invalidates the cache and retries once.

### Tests

- Unit tests: `test/unit/*.spec.ts` — use `axios-mock-adapter`
- Integration tests: `test/integration/` — require `VINVOICE_LIVE=1`, hit live API
- Fixtures: `test/fixtures/create-invoice.gtgt.json`
- Coverage thresholds enforced in `jest.config.ts`: 75% branches, 80% functions/lines/statements
