const stripWrappingQuotes = (value) => {
  const trimmed = String(value || "").trim();
  const first = trimmed[0];
  const last = trimmed[trimmed.length - 1];

  if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
};

const normalizePrivateKey = (key) =>
  stripWrappingQuotes(key)
    .replace(/\\n/g, "\n")
    .replace(/\r\n/g, "\n")
    .trim();

const parseServiceAccountJson = (value) => {
  if (!value) return null;

  const rawValue = stripWrappingQuotes(value);
  const jsonValue =
    rawValue.trim().startsWith("{")
      ? rawValue
      : Buffer.from(rawValue, "base64").toString("utf8");

  const credentials = JSON.parse(jsonValue);

  return {
    client_email: credentials.client_email,
    private_key: normalizePrivateKey(credentials.private_key),
  };
};

const getGoogleCredentials = () => {
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    return parseServiceAccountJson(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  }

  if (process.env.GA_SERVICE_ACCOUNT_JSON) {
    return parseServiceAccountJson(process.env.GA_SERVICE_ACCOUNT_JSON);
  }

  return {
    client_email: stripWrappingQuotes(
      process.env.GOOGLE_CLIENT_EMAIL || process.env.GA_CLIENT_EMAIL,
    ),
    private_key: normalizePrivateKey(
      process.env.GOOGLE_PRIVATE_KEY || process.env.GA_PRIVATE_KEY,
    ),
  };
};

module.exports = {
  getGoogleCredentials,
  normalizePrivateKey,
  parseServiceAccountJson,
  stripWrappingQuotes,
};
