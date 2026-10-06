import { HUXT_FORECAST_PAGE, HUXT_VIDEO_URL, getHuxtStatus } from "../src/utils/huxtStatus.js";

function cacheResponse(response) {
  response.setHeader("Cache-Control", "no-store, max-age=0");
  response.setHeader("Content-Type", "application/json; charset=utf-8");
}

export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ error: "Method not allowed" });
  }

  cacheResponse(response);

  try {
    return response.status(200).json(await getHuxtStatus());
  } catch (error) {
    return response.status(502).json({
      available: false,
      sourceUrl: HUXT_VIDEO_URL,
      forecastPage: HUXT_FORECAST_PAGE,
      checkedAt: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unable to check the HUXt source",
    });
  }
}
