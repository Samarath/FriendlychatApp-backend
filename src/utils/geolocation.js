// Base URL for the IP-API service
const GEO_API_BASE_URL = "http://ip-api.com/json/";

/**
 * Fetches the country name for a given IP address using the IP-API service.
 * @param {string} ip - The IP address to look up.
 * @returns {Promise<string>} - The country name or 'Unknown' if the lookup fails.
 */

async function getCountryFromIP(ip) {
  try {
    const apiUrl = `${GEO_API_BASE_URL}${ip}`;
    console.log("checking ip ", ip, apiUrl);

    //Fetching the data
    const response = await fetch(apiUrl);
    const data = await response.json();

    console.log(data, "final data checking");

    if (data?.status === "success") {
      console.log(`[GeoLocation] IP ${ip} resolved: ${data}`);
      return data;
    } else {
      console.warn(
        `[GeoLocation] Failed to resolve IP ${ip}. Reason: ${
          data.message || "Unknown error"
        }`
      );
      return "Unknown";
    }
  } catch (error) {
    console.error(
      `[GeoLocation] Error fetching data for IP ${ip}:`,
      error.message
    );
    return "Unknown";
  }
}

module.exports = {
  getCountryFromIP,
};
