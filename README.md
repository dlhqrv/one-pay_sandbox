# OnePay Payment Gateway — JavaScript Sample

Node.js sample code for integrating with the [OnePay](https://onepay.vn) payment gateway (VPC/MSP APIs). The project demonstrates how to create payment invoices, handle tokenized payments, query installment plans, verify secure hashes, and look up transaction status against the **MTF (test)** environment.

## Overview

This is a sandbox / reference implementation, not a production web server. Each script builds signed OnePay request parameters, sends HTTPS requests to the gateway, and logs responses to the console.

Supported flows:

| Flow | Module | Description |
|------|--------|-------------|
| Standard payment | `CreateInvoice.js` | Create a payment invoice and redirect to OnePay |
| Token creation | `CreateInvoiceToken.js` | Pay and save a card token for future use |
| Token payment | `CreateInvoiceToken.js` | Pay using a previously saved token |
| Installment (OnePay UI) | `CreateInvoiceInstallment.js` | Installment payment with plan selection on OnePay site |
| Installment (merchant UI) | `CreateInvoiceInstallment.js` | Installment with pre-selected bank, term, and fee |
| Installment lookup | `CreateInvoiceInstallment.js` | Query available installment plans for an amount |
| Transaction query | `QueryDr.js` | Query transaction result by merchant reference |
| Secure hash verify | `CheckHash.js` / `VerifyVpcSecureHash.js` | Validate `vpc_SecureHash` on callback URLs |

## Requirements

- Node.js (v14+ recommended)
- npm

## Installation

```bash
npm install
```

### Dependencies

| Package | Purpose |
|---------|---------|
| `crypto-js` | HMAC-SHA256 / HMAC-SHA512 signing for OnePay secure hashes |
| `axios` | HTTP client (used in `Util.js` and `CheckHash.js`) |
| `express` | Listed in `package.json` but **not used** by any project source file |

Built-in Node.js modules used: `https`, `process`.

## Project Structure

```
javascript/
├── Main.js                    # Entry point — orchestrates sample operations
├── Config.js                  # Merchant credentials and gateway URLs
├── Util.js                    # Shared crypto, HTTP, and signing utilities
├── CreateInvoice.js           # Standard invoice creation
├── CreateInvoiceToken.js      # Token create / token pay flows
├── CreateInvoiceInstallment.js # Installment payment and plan lookup
├── QueryDr.js                 # Transaction status query (queryDR)
├── CheckHash.js               # Standalone secure-hash demo (self-executing)
├── VerifyVpcSecureHash.js     # Secure-hash verification (currently empty)
├── package.json
└── README.md
```

## Configuration

Merchant credentials and environment settings live in `Config.js`:

| Constant | Description |
|----------|-------------|
| `MERCHANT_PAYNOW_ID` | Pay-now merchant ID |
| `MERCHANT_PAYNOW_ACCESS_CODE` | Pay-now access code |
| `MERCHANT_PAYNOW_HASH_CODE` | Pay-now HMAC secret (hex) |
| `MERCHANT_INSTALLMENT_ID` | Installment merchant ID |
| `MERCHANT_INSTALLMENT_ACCESS_CODE` | Installment access code |
| `MERCHANT_INSTALLMENT_HASH_CODE` | Installment HMAC secret (hex) |
| `BASE_URL` | Gateway base URL (`https://mtf.onepay.vn`) |
| `URL_PREFIX` | Payment redirect path (`/paygate/vpcpay.op?`) |
| `HOST` | Host header value for MSP API calls |

> **Note:** Credentials in `Config.js` are test/sandbox values. Do not commit production secrets.

## Secure Hash Algorithm

All VPC payment and query requests use the same signing process (implemented in `Util.js`):

1. **Sort** request parameters alphabetically by key (`sortObj`).
2. **Build string to hash** — include only keys prefixed with `vpc_` or `user_`, excluding `vpc_SecureHash` and `vpc_SecureHashType`, and skip empty values (`generateStringToHash`).
3. **Sign** with HMAC-SHA256 using the merchant hash code parsed as hex (`genSecureHash`).
4. **Append** the uppercase hex digest as `vpc_SecureHash`.

Example string format:

```
vpc_AccessCode=...&vpc_Amount=...&vpc_Command=pay&...
```

Installment plan lookup (`getInstallment`) uses a separate **HTTP Signature** scheme (`createRequestSignatureITA`) with HMAC-SHA512 over selected headers.

## Module Reference

### `Util.js`

Shared utilities exported for use across modules:

- `sortObj(obj)` — sort object keys alphabetically
- `generateStringToHash(paramSorted)` — build the VPC hash input string
- `genSecureHash(stringToHash, merHashCode)` — HMAC-SHA256 sign and return uppercase hex
- `sendHttpsGet(url)` — GET request; logs redirect `Location` header and body
- `sendHttpsPost(url, params)` — POST `application/x-www-form-urlencoded` to MSP API
- `sendHttpsGetWithHeader(url, headersRequest)` — GET with custom headers (installment API)
- `createRequestSignatureITA(...)` — HTTP Signature header for installment endpoints

### `CreateInvoice.js`

`createInvoice(merchantId, merchantAccessCode, merchantHashCode)`

Builds a standard `vpc_Command=pay` request with a unique `vpc_MerchTxnRef` (`TEST_<timestamp>`), signs it, and sends a GET to the paygate URL.

Default test amount: `1000000000` VND (smallest currency unit).

### `CreateInvoiceToken.js`

- `createInvoiceAndCreateToken(...)` — adds `vpc_CreateToken=true` to save a card token during payment.
- `createInvoiceAndPaymentWithToken(..., tokenNum, tokenExp)` — pays using `vpc_TokenNum` and `vpc_TokenExp`.

### `CreateInvoiceInstallment.js`

- `createInvoiceInstallment(...)` — installment invoice; amount must be ≥ 3,000,000 VND.
- `createInvoiceInstallmentThemIta(..., amount, cardList, itaTime, itaFeeAmount, itaBank)` — merchant-side installment with pre-selected plan (`vpc_Theme=ita`, `vpc_ItaTime`, `vpc_ItaBank`, etc.).
- `getInstallment(amount, merchantId, merchantHashCode)` — GET `/msp/api/v1/merchants/{id}/installments?amount=...` with HTTP Signature auth.

### `QueryDr.js`

`queryApiDr(merchantId, merchantAccessCode, merchantHashCode, merchTxnRef)`

Sends a `vpc_Command=queryDR` POST to:

```
POST https://mtf.onepay.vn/msp/api/v1/vpc/invoices/queries
```

Includes hardcoded query credentials (`vpc_User`, `vpc_Password`) for the test environment.

### `CheckHash.js`

Standalone script that verifies a callback URL's `vpc_SecureHash`. Contains duplicate implementations of the hash helpers (also present in `Util.js`). **Runs automatically** when executed directly (`runMain2()` is called at load time).

### `VerifyVpcSecureHash.js`

Referenced by `Main.js` for `verirySign()`, but the file is currently **empty**. Hash verification logic exists in `CheckHash.js` as `onePayVerifySecureHash()`.

## Running the Samples

### Main entry point

Edit `Main.js` to call the desired function, then run:

```bash
node Main.js
```

By default, `main()` calls `verirySign()` which requires a working `VerifyVpcSecureHash.js`.

Available functions in `Main.js`:

| Function | What it does |
|----------|--------------|
| `makeInvoice()` | Standard payment (PayNow merchant) |
| `makeInvoiceAndCreateToken()` | Payment + token creation |
| `makeInvoiceAndPaymentWithToken()` | Pay with saved token |
| `makeInvoiceInstallmentAtOnePaySite()` | Installment — plan chosen on OnePay |
| `makeInvoiceInstallmentAtMerchantSite()` | Installment — plan chosen on merchant site |
| `getInstallmentByMerchantId()` | Fetch installment options for an amount |
| `queryTransaction()` | Query a transaction by `vpc_MerchTxnRef` |
| `verirySign()` | Verify secure hash on a callback URL |

Example — switch to invoice creation:

```javascript
function main() {
  makeInvoice();
}
```

### Run individual modules

```bash
node CreateInvoice.js      # not wired — export only; use via Main.js
node CheckHash.js            # runs hash verification demo immediately
```

## API Endpoints Used

| Endpoint | Method | Used by |
|----------|--------|---------|
| `/paygate/vpcpay.op` | GET | Invoice / payment redirects |
| `/msp/api/v1/vpc/invoices/queries` | POST | `QueryDr.js` |
| `/msp/api/v1/merchants/{id}/installments` | GET | `CreateInvoiceInstallment.js` |

Environment: **MTF test** — `https://mtf.onepay.vn`

## Common VPC Parameters

| Parameter | Description |
|-----------|-------------|
| `vpc_Version` | Protocol version (`2`) |
| `vpc_Command` | `pay` or `queryDR` |
| `vpc_Merchant` | Merchant ID |
| `vpc_AccessCode` | Merchant access code |
| `vpc_MerchTxnRef` | Unique transaction reference |
| `vpc_Amount` | Amount in smallest currency unit (VND × 100) |
| `vpc_OrderInfo` | Order description |
| `vpc_ReturnURL` | Merchant callback URL after payment |
| `vpc_SecureHash` | HMAC-SHA256 signature |

## Known Issues

1. **`VerifyVpcSecureHash.js` is empty** — `Main.js` imports `onePayVerifySecureHash` from this file, but it has no implementation. Copy or refactor from `CheckHash.js` to fix `verirySign()`.
2. **`CheckHash.js` auto-executes** — calling `node CheckHash.js` immediately runs `runMain2()`; it is not import-safe.
3. **Duplicate hash logic** — `CheckHash.js` reimplements helpers that already exist in `Util.js`.
4. **Unused dependency** — `express` is installed but unused.
5. **Unused import in `Util.js`** — `const { config } = require("process")` is imported but never used.
6. **Hardcoded test values** — IP (`vpc_TicketNo`), customer info, query credentials, and token numbers are embedded in source.

## License

ISC (per `package.json`).
