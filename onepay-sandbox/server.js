const express = require('express');
const crypto = require('crypto');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ─── Sandbox credentials ───────────────────────────────────────────
const PRESETS = {
  paynow: {
    label: 'Pay Now',
    merchantId: 'TESTMERCHANT',
    accessCode: '6BEB2546',
    hashCode: '6D0870CDE5F24F34F3915FB0045120DB',
  },
  installment: {
    label: 'Installment',
    merchantId: 'TESTTRAGOP',
    accessCode: 'D51C5CD6',
    hashCode: 'EB1B7F75EBB2FAABD6763FC37A3628AF',
  },
  promotion: {
    label: 'Promotion',
    merchantId: 'TESTPR',
    accessCode: '6BEB0511',
    hashCode: '6D0870CDE5F24F34F3915FB0045120D2',
  },
  token: {
    label: 'Card Token',
    merchantId: 'TESTTOKENOP',
    accessCode: '6BEB2546',
    hashCode: '6D0870CDE5F24F34F3915FB0045120DB',
  },
};

const BASE_URL = 'https://mtf.onepay.vn/paygate/vpcpay.op';
const QUERYDR_URL = 'https://mtf.onepay.vn/msp/api/v1/vpc/invoices/queries';

// ─── Helper: generate SecureHash ──────────────────────────────────
function generateSecureHash(params, hashCode) {
  // Collect all vpc_ and user_ params, exclude vpc_SecureHash itself
  const filtered = Object.entries(params)
    .filter(([k]) => (k.startsWith('vpc_') || k.startsWith('user_')) && k !== 'vpc_SecureHash')
    .sort(([a], [b]) => a.localeCompare(b));

  const rawData = filtered.map(([k, v]) => `${k}=${v}`).join('&');
  const hash = crypto
    .createHmac('sha256', hashCode)
    .update(rawData)
    .digest('hex')
    .toUpperCase();

  return { rawData, hash };
}

// ─── Helper: verify incoming SecureHash ───────────────────────────
function verifySecureHash(params, hashCode) {
  const receivedHash = params.vpc_SecureHash;
  const { hash: computedHash, rawData } = generateSecureHash(params, hashCode);
  return {
    valid: receivedHash === computedHash,
    receivedHash,
    computedHash,
    rawData,
  };
}

// ─── API: get presets ─────────────────────────────────────────────
app.get('/api/presets', (req, res) => {
  const safe = {};
  Object.entries(PRESETS).forEach(([k, v]) => {
    safe[k] = { label: v.label, merchantId: v.merchantId, accessCode: v.accessCode };
  });
  res.json(safe);
});

// ─── API: build payment URL ───────────────────────────────────────
app.post('/api/build-payment-url', (req, res) => {
  const {
    paymentType = 'paynow',
    amount,
    orderInfo,
    merchTxnRef,
    returnUrl,
    callbackUrl,
    locale = 'en',
    currency = 'VND',
    ticketNo = '127.0.0.1',
    cardList,
  } = req.body;

  const preset = PRESETS[paymentType];
  if (!preset) return res.status(400).json({ error: 'Invalid payment type' });

  if (!amount || isNaN(amount) || Number(amount) <= 0)
    return res.status(400).json({ error: 'Invalid amount' });

  if (!merchTxnRef || !orderInfo || !returnUrl)
    return res.status(400).json({ error: 'merchTxnRef, orderInfo and returnUrl are required' });

  // Amount must be multiplied by 100
  const amountSent = String(Math.round(Number(amount) * 100));

  const params = {
    vpc_Version: '2',
    vpc_Currency: currency,
    vpc_Command: 'pay',
    vpc_AccessCode: preset.accessCode,
    vpc_Merchant: preset.merchantId,
    vpc_Locale: locale,
    vpc_ReturnURL: returnUrl,
    vpc_MerchTxnRef: merchTxnRef,
    vpc_OrderInfo: orderInfo,
    vpc_Amount: amountSent,
    vpc_TicketNo: ticketNo,
  };

  if (callbackUrl) params.vpc_CallbackURL = callbackUrl;
  if (cardList) params.vpc_CardList = cardList;

  const { rawData, hash } = generateSecureHash(params, preset.hashCode);
  params.vpc_SecureHash = hash;

  const queryString = Object.entries(params)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&');

  const paymentUrl = `${BASE_URL}?${queryString}`;

  res.json({
    paymentUrl,
    params,
    rawData,
    secureHash: hash,
    amountSent,
    preset: { merchantId: preset.merchantId, accessCode: preset.accessCode },
  });
});

// ─── API: verify SecureHash (simulate ReturnURL handler) ──────────
app.post('/api/verify-hash', (req, res) => {
  const { params, paymentType = 'paynow' } = req.body;
  const preset = PRESETS[paymentType];
  if (!preset) return res.status(400).json({ error: 'Invalid payment type' });

  const result = verifySecureHash(params, preset.hashCode);
  const responseCode = params.vpc_TxnResponseCode;

  let status = 'pending';
  if (result.valid && responseCode === '0') status = 'success';
  else if (result.valid && responseCode !== '0') status = 'failed';
  else if (!result.valid) status = 'pending'; // tampered — must use QueryDR

  res.json({ ...result, responseCode, status });
});

// ─── API: simulate QueryDR request ────────────────────────────────
app.post('/api/querydr', (req, res) => {
  const { merchTxnRef, paymentType = 'paynow' } = req.body;
  const preset = PRESETS[paymentType];
  if (!preset) return res.status(400).json({ error: 'Invalid payment type' });

  const params = {
    vpc_Command: 'queryDR',
    vpc_Version: '2',
    vpc_MerchTxnRef: merchTxnRef,
    vpc_Merchant: preset.merchantId,
    vpc_AccessCode: preset.accessCode,
    vpc_User: 'op01',
    vpc_Password: 'op123456',
  };

  const { rawData, hash } = generateSecureHash(params, preset.hashCode);
  params.vpc_SecureHash = hash;

  res.json({
    endpoint: QUERYDR_URL,
    method: 'POST',
    contentType: 'application/x-www-form-urlencoded',
    params,
    rawData,
    secureHash: hash,
    curlExample: `curl -X POST "${QUERYDR_URL}" \\\n  -H "Content-Type: application/x-www-form-urlencoded" \\\n  ${Object.entries(params).map(([k, v]) => `-d "${k}=${v}"`).join(' \\\n  ')}`,
  });
});

// ─── IPN receiver endpoint ────────────────────────────────────────
const ipnLog = [];

app.all('/ipn', (req, res) => {
  const params = { ...req.query, ...req.body };
  const paymentType = 'paynow'; // adjust if needed
  const preset = PRESETS[paymentType];
  const verification = verifySecureHash(params, preset.hashCode);
  const responseCode = params.vpc_TxnResponseCode;

  const entry = {
    timestamp: new Date().toISOString(),
    params,
    verification,
    responseCode,
    status: verification.valid && responseCode === '0' ? 'success' : 'failed',
  };
  ipnLog.unshift(entry);
  if (ipnLog.length > 20) ipnLog.pop();

  console.log('[IPN received]', entry.status, params.vpc_MerchTxnRef);

  if (verification.valid) {
    res.status(200).send('responsecode=1&desc=confirm-success');
  } else {
    res.status(200).send('responsecode=0&desc=confirm-fail');
  }
});

// ─── ReturnURL receiver ───────────────────────────────────────────
app.get('/return', (req, res) => {
  const params = req.query;
  res.redirect(`/?result=${encodeURIComponent(JSON.stringify(params))}`);
});

// ─── API: get IPN log ─────────────────────────────────────────────
app.get('/api/ipn-log', (req, res) => res.json(ipnLog));

// ─── API: generate unique MerchTxnRef ─────────────────────────────
app.get('/api/gen-txnref', (req, res) => {
  res.json({ ref: `TEST_${Date.now()}` });
});

app.listen(PORT, () => {
  console.log(`\n✅ OnePay Sandbox Server running at http://localhost:${PORT}`);
  console.log(`   Frontend  → http://localhost:${PORT}`);
  console.log(`   IPN URL   → http://localhost:${PORT}/ipn`);
  console.log(`   ReturnURL → http://localhost:${PORT}/return\n`);
});
