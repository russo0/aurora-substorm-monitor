// NOAA timestamps are UTC, including feeds that omit the timezone suffix.
export function parseNoaaTimestamp(value) {
  if (typeof value !== "string" || !value.trim()) return NaN;
  const timestamp = value.trim().replace(" ", "T");
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(timestamp)) return NaN;
  const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(timestamp);
  return Date.parse(hasTimezone ? timestamp : timestamp + "Z");
}
