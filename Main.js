const createInvoice = require("./CreateInvoice.js");
const createInvoiceToken = require("./CreateInvoiceToken.js");
const createInvoiceInstallment = require("./CreateInvoiceInstallment.js");
const queryDR = require("./QueryDr.js");
const config = require("./Config.js");
const appVerify = require("./VerifyVpcSecureHash.js");

function main() {
  verirySign();
}

function makeInvoice() {
  let merchantId = config.MERCHANT_PAYNOW_ID;
  let merchantAccessCode = config.MERCHANT_PAYNOW_ACCESS_CODE;
  let merchantHashCode = config.MERCHANT_PAYNOW_HASH_CODE;
  createInvoice.createInvoice(merchantId, merchantAccessCode, merchantHashCode);
}

function makeInvoiceAndCreateToken() {
  let merchantId = config.MERCHANT_PAYNOW_ID;
  let merchantAccessCode = config.MERCHANT_PAYNOW_ACCESS_CODE;
  let merchantHashCode = config.MERCHANT_PAYNOW_HASH_CODE;
  createInvoiceToken.createInvoiceAndCreateToken(
    merchantId,
    merchantAccessCode,
    merchantHashCode
  );
}

function makeInvoiceAndPaymentWithToken() {
  let merchantId = config.MERCHANT_PAYNOW_ID;
  let merchantAccessCode = config.MERCHANT_PAYNOW_ACCESS_CODE;
  let merchantHashCode = config.MERCHANT_PAYNOW_HASH_CODE;
  let tokenNum = "5123451517076481";
  let tokenExp = "1225";
  createInvoiceToken.createInvoiceAndPaymentWithToken(
    merchantId,
    merchantAccessCode,
    merchantHashCode,
    tokenNum,
    tokenExp
  );
}

function makeInvoiceInstallmentAtOnePaySite() {
  let merchantId = config.MERCHANT_INSTALLMENT_ID;
  let merchantAccessCode = config.MERCHANT_INSTALLMENT_ACCESS_CODE;
  let merchantHashCode = config.MERCHANT_INSTALLMENT_HASH_CODE;
  createInvoiceInstallment.createInvoiceInstallment(
    merchantId,
    merchantAccessCode,
    merchantHashCode
  );
}

function makeInvoiceInstallmentAtMerchantSite() {
  let merchantId = config.MERCHANT_INSTALLMENT_ID;
  let merchantAccessCode = config.MERCHANT_INSTALLMENT_ACCESS_CODE;
  let merchantHashCode = config.MERCHANT_INSTALLMENT_HASH_CODE;
  let cardList = "VC";
  let itaTime = "3";
  let itaBankSwiftCode = "BFTVVNVX";
  let amount = "1000000000";
  let itaFeeAmount = "20000200";
  createInvoiceInstallment.createInvoiceInstallmentThemIta(
    merchantId,
    merchantAccessCode,
    merchantHashCode,
    amount,
    cardList,
    itaTime,
    itaFeeAmount,
    itaBankSwiftCode
  );
}

function getInstallmentByMerchantId() {
  let merchantId = config.MERCHANT_INSTALLMENT_ID;
  let merchantHashCode = config.MERCHANT_INSTALLMENT_HASH_CODE;
  let amount = "3000000";
  createInvoiceInstallment.getInstallment(amount, merchantId, merchantHashCode);
}

function queryTransaction() {
  let merchantId = config.MERCHANT_PAYNOW_ID;
  let merchantAccessCode = config.MERCHANT_PAYNOW_ACCESS_CODE;
  let merchantHashCode = config.MERCHANT_PAYNOW_HASH_CODE;
  let merchTxnRef = "TEST_638466347228355308";
  queryDR.queryApiDr(
    merchantId,
    merchantAccessCode,
    merchantHashCode,
    merchTxnRef
  );
}

function verirySign() {
  let url =
    "https://webhook.site/6ddd97bd-d51c-4c36-b16b-7755ce68a010?vpc_Amount=10000000&vpc_Command=pay&vpc_MerchTxnRef=TEST_1711444940129917200&vpc_Merchant=DUONGTT&vpc_Message=Canceled&vpc_OrderInfo=Ma+Don+Hang&vpc_TxnResponseCode=99&vpc_Version=2&vpc_SecureHash=E083AFF7100E679678A68E6FDCB4751A75C2775EB42A5D24209E42B7665313D0";
  let merchantHashCode = config.MERCHANT_PAYNOW_HASH_CODE;
  appVerify.onePayVerifySecureHash(url, merchantHashCode);
}

main();
