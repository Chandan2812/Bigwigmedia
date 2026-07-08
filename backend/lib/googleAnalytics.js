const { BetaAnalyticsDataClient } = require("@google-analytics/data");
const { getGoogleCredentials } = require("./googleCredentials");

const credentials = getGoogleCredentials();

if (!process.env.GA_PROPERTY_ID) {
  console.warn("GA_PROPERTY_ID is missing. Google Analytics reports will fail.");
}

if (!credentials.client_email || !credentials.private_key) {
  console.warn(
    "Google Analytics credentials are missing. Check GA_CLIENT_EMAIL and GA_PRIVATE_KEY.",
  );
}

const analyticsClient = new BetaAnalyticsDataClient({
  credentials,
});

module.exports = analyticsClient;
