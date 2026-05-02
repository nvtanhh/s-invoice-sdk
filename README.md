# viettel-vinvoice-sdk

> [!WARNING]
> **Đây KHÔNG phải tài liệu hay sản phẩm chính thức của Viettel.**
> Đây là dự án cá nhân, tự viết để phục vụ mục đích sử dụng riêng. Không có bất kỳ liên kết, hợp tác, hay chứng nhận nào từ phía Viettel.
>
> Tác giả **không chịu trách nhiệm** về bất kỳ sự cố, mất mát dữ liệu, hay thiệt hại nào phát sinh từ việc sử dụng thư viện này. **Dùng trên tinh thần tự chịu rủi ro.**

---

TypeScript SDK không chính thức cho Viettel VinInvoice e-invoice API. ESM-only, Node.js ≥18.18, Zod validation, token caching.

## Yêu cầu

- Node.js ≥18.18
- ESM only (`"type": "module"` trong `package.json`)

## Cài đặt

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

// Tạo hóa đơn
const invoice = await client.invoices.createInvoice({ ... })

// Tìm theo UUID
const result = await client.search.searchByTransactionUuid({
  transactionUuid: invoice.result?.transactionID
})

// Hủy hóa đơn
await client.cancel.cancelInvoice({ ... })
```

## Services

| Service | Method | Trạng thái | Mô tả |
|---------|--------|------------|-------|
| `invoices` | `createInvoice()` | Stable | Tạo hóa đơn mới / thay thế / điều chỉnh |
| `cancel` | `cancelInvoice()` | Stable | Hủy hóa đơn |
| `search` | `searchByTransactionUuid()` | Stable | Tìm hóa đơn theo UUID |
| `usbToken` | `getHash()` | Stable | Lấy hash để ký USB token |
| `usbToken` | `submitSignedHash()` | Stable | Nộp hash đã ký |
| `experimental.*` | — | Experimental | list / file / templates / payments / batch |

## Cấu hình

```typescript
const client = new ViettelInvoiceClient({
  baseUrl: string       // 'https://vinvoice.viettel.vn/api'
  taxCode: string       // Mã số thuế người bán
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
  if (err instanceof ViettelValidationError) { /* input sai */ }
  if (err instanceof ViettelAuthError)       { /* 401/403 */ }
  if (err instanceof ViettelNetworkError)    { /* timeout/no response */ }
  if (err instanceof ViettelApiError)        { /* lỗi từ API */ }
}
```

## License

MIT
