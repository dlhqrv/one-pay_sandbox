const CryptoJS = require("crypto-js");
let MERCHANT_HASH_CODE = "EB1B7F75EBB2FAABD6763FC37A3628AF";
const axios = require("axios");
const https = require("https");
const BASE_URL = "https://mtf.onepay.vn/paygate/vpcpay.op";

function runMain1() {
  let url =
    "https://mtf.onepay.vn/paygate/vpcpay.op?AgainLink=https%3A%2F%2Fmtf.onepay.vn%2Fclient%2Fqt%2F&Title=PHP+VPC+3-Party&vpc_AccessCode=6BEB2546&vpc_Amount=10000000&vpc_CardList=VC&vpc_Command=pay&vpc_Currency=VND&vpc_Customer_Email=test%40onepay.vn&vpc_Customer_Id=test&vpc_Customer_Phone=84987654321&vpc_Locale=vn&vpc_MerchTxnRef=TEST_1706240061&vpc_Merchant=TESTONEPAY&vpc_OrderInfo=Ma+Don+Hang&vpc_ReturnURL=https%3A%2F%2Fportal.lanit.com.vn%3A4083%2FsessYBzPl9UJVn4bm2uE%2Findex.php%3Fact%3Dpayment%26process_payment%3Donepay&vpc_TicketNo=192.168.166.149&vpc_Version=2&vpc_SecureHash=11396C01BC33F204691399900DED2D34AB4F9499FF0BA1651E6F7A1F19DAFE3B";
  onePayVerifySecureHash(url, MERCHANT_HASH_CODE);
}

function runMain2() {
  makeRequest2();
}

runMain2();

function merchantSendRequestStatic() {
  let merchantParam = {
    vpc_Version: "2",
    vpc_Currency: "VND",
    vpc_Command: "pay",
    vpc_AccessCode: "6BEB2546",
    vpc_Merchant: "TESTONEPAY",
    vpc_Locale: "vn",
    vpc_ReturnURL: "https://mtf.onepay.vn/client/qt/dr/",
    vpc_MerchTxnRef: "TEST_1698291680035",
    vpc_OrderInfo: "Ma Don Hang",
    vpc_Amount: "10000000",
    vpc_TicketNo: "192.168.166.149",
    vpc_CardList: "VC",
    AgainLink: "https://mtf.onepay.vn/client/qt/",
    Title: "PHP VPC 3-Party",
    vpc_Customer_Phone: "84987654321",
    vpc_Customer_Email: "test@onepay.vn",
    vpc_Customer_Id: "test",
  };
  let sortedParam = sortObj(merchantParam);
  let stringToHash = generateStringToHash(sortedParam);
  let secureHash = genSecureHash(stringToHash, MERCHANT_HASH_CODE);
  merchantParam["vpc_SecureHash"] = secureHash;
  return merchantParam;
}

function merchantSendRequestDynamic() {
  let date = Date.now();
  let vpcMerTxnRef = "TEST_" + date;
  let merchantParam = {
    vpc_Version: "2",
    vpc_Currency: "VND",
    vpc_Command: "pay",
    vpc_AccessCode: "D51C5CD6",
    vpc_Merchant: "TESTTRAGOP",
    vpc_Locale: "vn",
    vpc_ReturnURL: "https://dev.onepay.vn/client/qt/dr/?id=1&mode=TEST_PAYGATE",
    vpc_MerchTxnRef: vpcMerTxnRef,
    vpc_OrderInfo: "Ma Don Hang",
    vpc_Amount: "1000000000",
    vpc_TicketNo: "192.168.166.149",
    vpc_CardList: "VC",
    AgainLink: "https://mtf.onepay.vn/client/qt/",
    Title: "PHP VPC 3-Party",
    vpc_Customer_Phone: "84987654321",
    vpc_Customer_Email: "test@onepay.vn",
    vpc_Customer_Id: "test",
  };
  let sortedParam = sortObj(merchantParam);
  let stringToHash = generateStringToHash(sortedParam);
  let secureHash = genSecureHash(stringToHash, MERCHANT_HASH_CODE);
  merchantParam["vpc_SecureHash"] = secureHash;
  console.log("StringToHash: " + stringToHash);
  return merchantParam;
}

function onePayVerifySecureHash(urlResponse, merHashCode) {
  let newURL = new URL(urlResponse);
  let params = new URLSearchParams(newURL.search);
  let hashFromMerchant = params.get("vpc_SecureHash");
  let paramObject = Object.fromEntries(params);
  let paramsSorted = sortObj(paramObject);
  let stringToHash = generateStringToHash(paramsSorted);
  let OnePaySign = genSecureHash(stringToHash, merHashCode);
  console.log("onepay's hash: " + OnePaySign);
  console.log("merchant's hash: " + hashFromMerchant);
  if (OnePaySign == hashFromMerchant) {
    console.log("vpc_SecureHash PASSED!!!");
  } else {
    console.error("invalid vpc_SecureHash");
  }
}

function sortObj(obj) {
  return Object.keys(obj)
    .sort()
    .reduce(function (result, key) {
      result[key] = obj[key];
      return result;
    }, {});
}

function generateStringToHash(paramSorted) {
  let stringToHash = "";
  for (const key in paramSorted) {
    let value = paramSorted[key];
    let pref4 = key.substring(0, 4);
    let pref5 = key.substring(0, 5);
    if (pref4 == "vpc_" || pref5 == "user_") {
      if (key != "vpc_SecureHash" && key != "vpc_SecureHashType") {
        if (value.length > 0) {
          if (stringToHash.length > 0) {
            stringToHash = stringToHash + "&";
          }
          stringToHash = stringToHash + key + "=" + value;
        }
      }
    }
  }
  return stringToHash;
}

function genSecureHash(stringToHash, merHashCode) {
  let merHashHex = CryptoJS.enc.Hex.parse(merHashCode);
  let keyHash = CryptoJS.HmacSHA256(stringToHash, merHashHex);
  let keyHashHex = CryptoJS.enc.Hex.stringify(keyHash).toUpperCase();
  return keyHashHex;
}

async function makeRequest() {
  const param = merchantSendRequestDynamic();
  let url = `${BASE_URL}?${new URLSearchParams(param)}`;
  const config = {
    method: "get",
    url: url,
  };

  let res = await axios(config);
  console.log(res.status);
  console.log(res.request["res"]["responseUrl"]);
  let result = res.request["res"]["responseUrl"];
  return result;
}

function makeRequest2() {
  const param = merchantSendRequestDynamic();
  let url = `${BASE_URL}?${new URLSearchParams(param)}`;
  console.log("URL: " + url);
  https
    .get(url, (response) => {
      let data = "";
      let rawHeader = response.rawHeaders;
      let locationValue = extractValueByKey("location", rawHeader);
      console.log(locationValue);
      // A chunk of data has been received.
      response.on("data", (chunk) => {
        data += chunk;
      });

      // The whole response has been received.
      response.on("end", () => {
        // Parse the data as needed
        console.log(data);
      });
    })
    .on("error", (error) => {
      console.error(`Error: ${error.message}`);
    });
}

function extractValueByKey(key, array) {
  for (let i = 0; i < array.length; i += 2) {
    if (array[i] === key) {
      return array[i + 1];
    }
  }
  return null;
}
