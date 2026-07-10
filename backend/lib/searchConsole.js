const axios = require("axios");
const { GoogleAuth } = require("google-auth-library");
const { getGoogleCredentials } = require("./googleCredentials");

const SEARCH_CONSOLE_BASE =
  "https://searchconsole.googleapis.com/webmasters/v3";
const SCOPES = ["https://www.googleapis.com/auth/webmasters.readonly"];

const credentials = getGoogleCredentials();

if (!process.env.SEARCH_CONSOLE_SITE_URL) {
  console.warn(
    "SEARCH_CONSOLE_SITE_URL is missing. Search Console reports need the exact property URL.",
  );
}

if (!credentials.client_email || !credentials.private_key) {
  console.warn(
    "Google service account credentials are missing. Check GOOGLE_CLIENT_EMAIL/GOOGLE_PRIVATE_KEY or GA_CLIENT_EMAIL/GA_PRIVATE_KEY.",
  );
}

const auth = new GoogleAuth({
  credentials,
  scopes: SCOPES,
});

const getAccessToken = async () => {
  const client = await auth.getClient();
  const token = await client.getAccessToken();

  return typeof token === "string" ? token : token?.token;
};

const getHeaders = async () => {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    throw new Error("Unable to create Google Search Console access token");
  }

  return {
    Authorization: `Bearer ${accessToken}`,
  };
};

const getConfiguredSiteUrl = () =>
  process.env.SEARCH_CONSOLE_SITE_URL ||
  process.env.GSC_SITE_URL ||
  process.env.FRONTEND_URL ||
  "https://bigwigmedia.in/";

const getSites = async () => {
  const response = await axios.get(`${SEARCH_CONSOLE_BASE}/sites`, {
    headers: await getHeaders(),
  });

  return response.data?.siteEntry || [];
};

const querySearchAnalytics = async ({
  siteUrl = getConfiguredSiteUrl(),
  startDate,
  endDate,
  dimensions = [],
  rowLimit = 10,
}) => {
  const encodedSiteUrl = encodeURIComponent(siteUrl);
  const response = await axios.post(
    `${SEARCH_CONSOLE_BASE}/sites/${encodedSiteUrl}/searchAnalytics/query`,
    {
      startDate,
      endDate,
      dimensions,
      rowLimit,
    },
    {
      headers: await getHeaders(),
    },
  );

  return response.data?.rows || [];
};

const formatRow = (row, keyName) => ({
  [keyName]: row.keys?.[0] || "Unknown",
  clicks: Number(row.clicks || 0),
  impressions: Number(row.impressions || 0),
  ctr: Number(row.ctr || 0),
  position: Number(row.position || 0),
});

const formatQueryPageRow = (row) => ({
  query: row.keys?.[0] || "Unknown",
  page: row.keys?.[1] || "Unknown",
  clicks: Number(row.clicks || 0),
  impressions: Number(row.impressions || 0),
  ctr: Number(row.ctr || 0),
  position: Number(row.position || 0),
});

const formatTrendRow = (row) => ({
  date: row.keys?.[0] || "",
  clicks: Number(row.clicks || 0),
  impressions: Number(row.impressions || 0),
  ctr: Number(row.ctr || 0),
  position: Number(row.position || 0),
});

const getSearchConsoleReport = async (dateRange) => {
  const siteUrl = getConfiguredSiteUrl();
  const [
    overviewRows,
    queryRows,
    opportunityRows,
    pageRows,
    trendRows,
    queryPageRows,
  ] = await Promise.all([
    querySearchAnalytics({
      siteUrl,
      ...dateRange,
      rowLimit: 1,
    }),
    querySearchAnalytics({
      siteUrl,
      ...dateRange,
      dimensions: ["query"],
      rowLimit: 10,
    }),
    querySearchAnalytics({
      siteUrl,
      ...dateRange,
      dimensions: ["query"],
      rowLimit: 50,
    }),
    querySearchAnalytics({
      siteUrl,
      ...dateRange,
      dimensions: ["page"],
      rowLimit: 10,
    }),
    querySearchAnalytics({
      siteUrl,
      ...dateRange,
      dimensions: ["date"],
      rowLimit: 25000,
    }),
    querySearchAnalytics({
      siteUrl,
      ...dateRange,
      dimensions: ["query", "page"],
      rowLimit: 20,
    }),
  ]);

  const overview = overviewRows[0] || {};
  const lowCtrOpportunities = opportunityRows
    .filter(
      (row) =>
        Number(row.impressions || 0) >= 50 && Number(row.ctr || 0) < 0.02,
    )
    .sort((a, b) => Number(b.impressions || 0) - Number(a.impressions || 0))
    .slice(0, 10)
    .map((row) => formatRow(row, "query"));

  return {
    siteUrl,
    clicks: Number(overview.clicks || 0),
    impressions: Number(overview.impressions || 0),
    ctr: Number(overview.ctr || 0),
    position: Number(overview.position || 0),
    queries: queryRows.map((row) => formatRow(row, "query")),
    pages: pageRows.map((row) => formatRow(row, "page")),
    trend: trendRows
      .map(formatTrendRow)
      .filter((row) => row.date)
      .sort((a, b) => a.date.localeCompare(b.date)),
    lowCtrOpportunities,
    queryPages: queryPageRows.map(formatQueryPageRow),
  };
};

module.exports = {
  getSearchConsoleReport,
  getSites,
};
