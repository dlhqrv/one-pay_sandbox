# OnePay Sandbox Tester

A Node.js + Express app to test the OnePay payment gateway sandbox (MTF environment).

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Start the server
npm start

# 3. Open in browser
http://localhost:3000
```

For auto-reload during development:
```bash
npm run dev
```

---

## What's inside

### Frontend pages (http://localhost:3000)
| Page | What it does |
|------|-------------|
| Build URL | Generates signed payment URL — click "Open in browser" to test |
| Verify Hash | Paste ReturnURL params to verify SecureHash + transaction status |
| QueryDR API | Generates a signed QueryDR request with curl command |
| IPN Log | Live log of all IPN callbacks received (auto-refreshes) |
| Test Cards | All sandbox card numbers in one place |
| Test Cases | Checklist of all 28 official OnePay test cases |
| Response Codes | Full vpc_TxnResponseCode reference |

### Backend endpoints
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `POST /api/build-payment-url` | POST | Build + sign payment URL |
| `POST /api/verify-hash` | POST | Verify returned SecureHash |
| `POST /api/querydr` | POST | Generate QueryDR signed request |
| `GET  /api/ipn-log` | GET  | View received IPN callbacks |
| `GET  /api/gen-txnref` | GET  | Generate unique MerchTxnRef |
| `GET/POST /ipn` | ANY  | IPN receiver (give this URL to OnePay) |
| `GET /return` | GET  | ReturnURL handler (redirects to frontend with result) |

---

## Sandbox credentials

| Type | Merchant ID | Access Code | HashCode |
|------|-------------|-------------|----------|
| Pay Now | TESTMERCHANT | 6BEB2546 | 6D0870CDE5F24F34F3915FB0045120DB |
| Installment | TESTTRAGOP | D51C5CD6 | EB1B7F75EBB2FAABD6763FC37A3628AF |
| Promotion | TESTPR | 6BEB0511 | 6D0870CDE5F24F34F3915FB0045120D2 |
| Token | TESTTOKENOP | 6BEB2546 | 6D0870CDE5F24F34F3915FB0045120DB |

## Test cards
| Type | Card Number | Expiry | OTP/CVV |
|------|-------------|--------|---------|
| VCB ATM | 9704360000000000002 | 01/13 | 123456 |
| Visa | 4000000000001091 | 05/2028 | 123 |
| Mastercard | 5123450000000008 | 05/2028 | 123 |

---

## Testing IPN locally

OnePay cannot call `localhost` — use [ngrok](https://ngrok.com) to expose your local server:

```bash
# Install ngrok, then:
ngrok http 3000

# Copy the https URL, e.g.:
# https://abc123.ngrok.io

# Set vpc_CallbackURL to:
https://abc123.ngrok.io/ipn

# Set vpc_ReturnURL to:
https://abc123.ngrok.io/return
```

---

## SecureHash algorithm

1. Collect all `vpc_*` and `user_*` params (exclude `vpc_SecureHash` itself)
2. Sort keys alphabetically (case-sensitive)
3. Join as `key=value&key=value&...`
4. HMAC-SHA256 with your HashCode
5. Convert to uppercase hex

Implemented in `server.js` → `generateSecureHash()`
