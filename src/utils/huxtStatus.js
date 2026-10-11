export const HUXT_VIDEO_URL = "https://swxforecastlab.s3.eu-west-2.amazonaws.com/WSA_DONKI_huxt_animation_latest.mp4";
export const HUXT_FORECAST_PAGE = "https://swxforecastlab.org/forecasts.html";

// The public HUXt video has no published machine-readable forecast timestamp.
// Its object metadata is the most reliable signal available to this app.
export const HUXT_CURRENT_WINDOW_HOURS = 48;

export async function getHuxtStatus(fetchImplementation = fetch) {
  const upstream = await fetchImplementation(HUXT_VIDEO_URL, {
    method: "HEAD",
    headers: { "User-Agent": "Boreal-One-Aurora-Monitor/1.0" },
  });

  if (!upstream.ok) {
    throw new Error(`HUXt source responded with HTTP ${upstream.status}`);
  }

  const lastModifiedHeader = upstream.headers.get("last-modified");
  const lastModifiedDate = lastModifiedHeader ? new Date(lastModifiedHeader) : null;
  const lastModified = lastModifiedDate && Number.isFinite(lastModifiedDate.getTime())
    ? lastModifiedDate.toISOString()
    : null;
  const ageHours = lastModified
    ? (Date.now() - new Date(lastModified).getTime()) / (60 * 60 * 1000)
    : null;
  const version = upstream.headers.get("etag")?.replaceAll('"', "") || lastModified || "latest";

  return {
    available: true,
    sourceUrl: HUXT_VIDEO_URL,
    versionedSourceUrl: `${HUXT_VIDEO_URL}?v=${encodeURIComponent(version)}`,
    forecastPage: HUXT_FORECAST_PAGE,
    checkedAt: new Date().toISOString(),
    lastModified,
    ageHours,
    currentWindowHours: HUXT_CURRENT_WINDOW_HOURS,
    isCurrent: ageHours !== null && ageHours >= 0 && ageHours <= HUXT_CURRENT_WINDOW_HOURS,
  };
}
