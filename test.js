const axios = require("axios");
const fs = require("fs");
const urlSafeBase64 = require("urlsafe-base64");

// ... (rest of the code)

// ... (rest of the code)// Your subscription URL
const subscriptionUrl =
  "https://raw.githubusercontent.com/mahdibland/ShadowsocksAggregator/master/Eternity.txt";

// Test URL to check the proxy connectivity
const testUrl = "https://www.youtube.com";

// File to store the test results
const resultFile = "sub.txt";

// Function to fetch the subscription data
async function fetchSubscriptionData(subscriptionUrl) {
  const response = await axios.get(subscriptionUrl);
  return response.data;
}

// Function to decode a base64-encoded V2Ray subscription data
function decodeSubscriptionData(subscriptionData) {
  const subscriptions = subscriptionData.split("\n");
  const urls = subscriptions
    .filter((s) => s.startsWith("vmess://"))
    .map((s) => s.trim());
  return urls;
}

// Function to extract the proxy host and port from a V2Ray subscription URL
function extractProxy(subscriptionUrl) {
  try {
    const encoded = subscriptionUrl.replace(/^vmess:\/\/?/i, "");
    const decoded = urlSafeBase64.decode(encoded).toString("utf8");
    const config = JSON.parse(decoded);
    return `${config.add}:${config.port}`;
  } catch (error) {
    console.error(
      `Failed to decode subscription URL: ${subscriptionUrl}\nError: ${error.message}`
    );
    return null;
  }
}

// Function to test a proxy and return the test result
async function testProxy(proxy) {
  const proxyUrl = `http://${proxy}`;
  try {
    const response = await axios.get(testUrl, {
      proxy: { host: proxyUrl, port: 1080 },
    });
    return `${proxy}: OK (${response.status})`;
  } catch (error) {
    return `${proxy}: ${error.message}`;
  }
}

// Function to test all proxies and update the result file
async function testProxies() {
  const subscriptionData = await fetchSubscriptionData(subscriptionUrl);
  const proxyUrls = decodeSubscriptionData(subscriptionData).map(extractProxy);
  const results = await Promise.all(proxyUrls.map(testProxy));
  const timestamp = new Date().toISOString();
  const output = `${timestamp}\n${results.join("\n")}\n\n`;
  fs.appendFileSync(resultFile, output);
  console.log(output);
}

// Run the initial test
testProxies();

// Schedule the periodic test
setInterval(testProxies, 12 * 60 * 60 * 1000); // 12 hours
