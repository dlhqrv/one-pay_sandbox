const config = require("./Config");
const util = require("./Util");

function queryApiDr(
  merchantId,
  merchantAccessCode,
  merchantHashCode,
  merchTxnRef
) {
  let merchantParam = {
    vpc_Version: "2",
    vpc_Command: "queryDR",
    vpc_AccessCode: merchantAccessCode,
    vpc_Merchant: merchantId,
    vpc_Password: "admin@123456",
    vpc_User: "Administrator",
    vpc_MerchTxnRef: merchTxnRef,
  };
  let sortedParam = util.sortObj(merchantParam);
  let stringToHash = util.generateStringToHash(sortedParam);
  let secureHash = util.genSecureHash(stringToHash, merchantHashCode);
  merchantParam["vpc_SecureHash"] = secureHash;
  console.log("StringToHash: " + stringToHash);

  let params = new URLSearchParams(merchantParam);
  console.log("PARAMS: " + params);
  let urlRequest = config.BASE_URL + "/msp/api/v1/vpc/invoices/queries";
  util.sendHttpsPost(urlRequest, params);
}

module.exports = {
  queryApiDr,
};
