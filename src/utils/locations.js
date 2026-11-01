export const OVERKALIX = Object.freeze({
  name: "Överkalix", latitude: 66.327, longitude: 22.844, timezone: "Europe/Stockholm",
});

const EUROPEAN_COUNTRIES = new Set([
  "AL", "AD", "AT", "BY", "BE", "BA", "BG", "HR", "CY", "CZ", "DK", "EE", "FO",
  "FI", "FR", "DE", "GI", "GR", "GG", "HU", "IS", "IE", "IM", "IT", "JE", "XK",
  "LV", "LI", "LT", "LU", "MT", "MD", "MC", "ME", "NL", "MK", "NO", "PL", "PT",
  "RO", "RU", "SM", "RS", "SK", "SI", "ES", "SJ", "SE", "CH", "TR", "UA", "GB", "VA",
]);

// A deliberately bounded first release. This also limits GPS selections when
// no country is available, without sending coordinates to a reverse geocoder.
export function isSupportedLocation(location) {
  const { latitude, longitude, countryCode } = location ?? {};
  return typeof latitude === "number" && typeof longitude === "number" &&
    Number.isFinite(latitude) && Number.isFinite(longitude) &&
    latitude >= 34 && latitude <= 84 && longitude >= -32 && longitude <= 45 &&
    (!countryCode || EUROPEAN_COUNTRIES.has(countryCode));
}

export function normalizeSearchLocation(result) {
  const location = {
    name: result.name,
    country: result.country,
    countryCode: result.country_code,
    admin: result.admin1,
    latitude: result.latitude,
    longitude: result.longitude,
    timezone: result.timezone || "UTC",
    source: "city",
  };
  return isSupportedLocation(location) ? location : null;
}

export const SUGGESTED_LOCATIONS = [
  OVERKALIX,
  { name: "Kiruna", latitude: 67.8558, longitude: 20.2253, timezone: "Europe/Stockholm" },
  { name: "Tromsø", latitude: 69.6496, longitude: 18.956, timezone: "Europe/Oslo" },
  { name: "Reykjavík", latitude: 64.1466, longitude: -21.9426, timezone: "Atlantic/Reykjavik" },
];
