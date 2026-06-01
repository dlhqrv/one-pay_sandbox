const util = require("./Util.js");
const config = require("./Config.js");

function createInvoice(merchantId, merchantAccessCode, merchantHashCode) {
  let date = Date.now();
  let vpcMerTxnRef = "TEST_" + date;
  let merchantParam = {
    vpc_Version: "2",
    vpc_Currency: "VND",
    vpc_Command: "pay",
    vpc_AccessCode: merchantAccessCode,
    vpc_Merchant: merchantId,
    vpc_Locale: "vn",
    vpc_ReturnURL: "https://mtf.onepay.vn/client/qt/dr/?id=1&mode=TEST_PAYGATE",
    vpc_MerchTxnRef: vpcMerTxnRef,
    vpc_OrderInfo: "Ma Don Hang",
    vpc_Amount: "1000000000",
    vpc_TicketNo: "192.168.166.149",
    AgainLink: "https://mtf.onepay.vn/client/qt/",
    Title: "PHP VPC 3-Party",
    vpc_Customer_Phone: "84987654321",
    vpc_Customer_Email: "test@onepay.vn",
    vpc_Customer_Id: "test",
  };
  let sortedParam = util.sortObj(merchantParam);
  let stringToHash = util.generateStringToHash(sortedParam);
  let secureHash = util.genSecureHash(stringToHash, merchantHashCode);
  merchantParam["vpc_SecureHash"] = secureHash;
  console.log("StringToHash: " + stringToHash);
  let urlRequest =
    config.BASE_URL + config.URL_PREFIX + new URLSearchParams(merchantParam);
  util.sendHttpsGet(urlRequest);
}

module.exports = {
  createInvoice,
};
