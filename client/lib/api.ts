const getApiBaseUrl = () => {
  const rawBaseUrl = import.meta.env.VITE_API_BASE_URL;

  // Case 1: nothing in env → default to localhost
  if (!rawBaseUrl) {
    return "http://localhost:3001";
  }

  // Case 2: LAN IP or localhost explicitly given
  if (
    rawBaseUrl.startsWith("http://") ||
    rawBaseUrl.startsWith("https://")
  ) {
    return rawBaseUrl; // already a full URL
  }

  // Case 3: if it's just "localhost:3001" or "192.168.x.x:3001"
  if (rawBaseUrl.includes("localhost") || rawBaseUrl.match(/^192\.168\./)) {
    return `http://${rawBaseUrl}/api`;
  }

  // Case 4: assume production domain → force https
  return `https://${rawBaseUrl}/api`;
};

export const API_BASE_URL = getApiBaseUrl();
