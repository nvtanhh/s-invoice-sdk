# Auth API — Verified from Browser Network Tab

## Login

```
POST https://vinvoice.viettel.vn/api/auth/login
Content-Type: application/json
```

### Request body

```json
{
  "username": "091178018476",
  "password": "...",
  "rememberMe": false,
  "captcha": ""
}
```

| Field | Required | Notes |
|-------|----------|-------|
| `username` | ✓ | Số điện thoại / tài khoản Viettel |
| `password` | ✓ | |
| `rememberMe` | optional | `false` bình thường |
| `captcha` | optional | `""` khi không có captcha |

### Response

```json
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "refresh_token": "eyJ...",
  "expires_in": 1198,
  "scope": "openid",
  "iat": 1777546119,
  "invoice_cluster": "cluster2",
  "type": 1,
  "jti": "05847c79-9627-4c19-8e79-0b97f8601f8f"
}
```

| Field | Notes |
|-------|-------|
| `access_token` | JWT dùng cho `Authorization: Bearer <token>` |
| `token_type` | `"bearer"` |
| `refresh_token` | TTL ~7 ngày (từ JWT `exp`) |
| `expires_in` | Giây — thực tế **1198s (~20 phút)**, không phải 300s như SDK default |
| `invoice_cluster` | `"cluster2"` — routing internal của Viettel |

> **SDK note:** `TokenManager` default `expires_in` là 300 nếu field thiếu. Thực tế là 1198s — token tự expire đúng lúc.

## Postman Pre-request Script (đúng)

```javascript
pm.sendRequest({
  url: 'https://vinvoice.viettel.vn/api/auth/login',
  method: 'POST',
  header: { 'Content-Type': 'application/json' },
  body: {
    mode: 'raw',
    raw: JSON.stringify({
      username: pm.environment.get('username'),
      password: pm.environment.get('password'),
      rememberMe: false,
      captcha: ''
    })
  }
}, (err, res) => {
  if (err) { console.error(err); return }
  pm.environment.set('token', res.json().access_token)
})
```

## Postman Environment Variables

| Variable | Value |
|----------|-------|
| `baseUrl` | `https://vinvoice.viettel.vn/api` |
| `username` | số điện thoại tài khoản |
| `password` | mật khẩu |
| `taxCode` | mã số thuế supplier |
| `token` | *(để trống, script tự fill)* |

## Notes

- Base URL đúng là `https://vinvoice.viettel.vn/api` (xác nhận từ network tab)
- Full API path = `baseUrl` + `/services/einvoiceapplication/api/InvoiceAPI/...`
- `captcha` field có trong body nhưng có thể để `""` với tài khoản API
