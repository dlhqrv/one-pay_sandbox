const axios = require("axios");
const https = require("https");
const CryptoJS = require("crypto-js");
const { config } = require("process");
const appConfig = require("./Config.js");

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

function sendHttpsGetWithHeader(url, headersRequest) {
  let host = headersRequest["Host"];
  const options = {
    hostname: host,
    path: url,
    method: "GET",
    headers: headersRequest,
  };
  // Send the GET request
  const req = https.request(options, (res) => {
    console.log(`statusCode: ${res.statusCode}`);

    // Accumulate response data
    let responseData = "";
    res.on("data", (chunk) => {
      responseData += chunk;
    });

    // Process response data
    res.on("end", () => {
      console.log(responseData);
      // Process responseData as needed
    });
  });

  // Handle errors
  req.on("error", (error) => {
    console.error(error);
  });

  // End the request
  req.end();
}

function sendHttpsPost(url, params) {
  const options = {
    hostname: appConfig.HOST,
    port: 443,
    path: url,
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Content-Length": params.toString().length,
    },
  };

  // Tạo request
  const req = https.request(options, (res) => {
    console.log(`statusCode: ${res.statusCode}`);

    res.on("data", (d) => {
      process.stdout.write(d);
    });
  });

  // Xử lý lỗi
  req.on("error", (error) => {
    console.error(error);
  });

  // Gửi dữ liệu
  req.write(params.toString());
  req.end();
}

function sendHttpsGet(url) {
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

function createRequestSignatureITA(
  method,
  uri,
  httpHeaders,
  signedHeaderNames,
  merchantId,
  merchantHashCode
) {
  let created = Math.floor(new Date().getTime() / 1000);
  let lowercaseHeaders = {};
  for (let key in httpHeaders) {
    if (httpHeaders.hasOwnProperty(key)) {
      lowercaseHeaders[key.toLowerCase()] = httpHeaders[key];
    }
  }
  lowercaseHeaders["(request-target)"] = method.toLowerCase() + " " + uri;
  lowercaseHeaders["(created)"] = created;

  let signingString = "";

  let headerNames = "";
  for (const element of signedHeaderNames) {
    let headerName = element;
    if (!lowercaseHeaders.hasOwnProperty(headerName)) {
      throw "MissingRequiredHeaderException: " + headerName;
    }
    if (signingString !== "") signingString += "\n";
    signingString += headerName + ": " + lowercaseHeaders[headerName];

    if (headerNames !== "") headerNames += " ";
    headerNames += headerName;
  }

  console.log("signingString=" + signingString);

  let hmacKey = CryptoJS.enc.Hex.parse(merchantHashCode);
  let signature = CryptoJS.enc.Base64.stringify(
    CryptoJS.HmacSHA512(signingString, hmacKey)
  );
  let signingAlgorithm = "hs2019";
  return (
    'algorithm="' +
    signingAlgorithm +
    '"' +
    ', keyId="' +
    merchantId +
    '"' +
    ', headers="' +
    headerNames +
    '"' +
    ", created=" +
    created +
    ', signature="' +
    signature +
    '"'
  );
}

module.exports = {
  sortObj,
  generateStringToHash,
  genSecureHash,
  makeRequest,
  sendHttpsGet,
  sendHttpsPost,
  createRequestSignatureITA,
  sendHttpsGetWithHeader,
};
