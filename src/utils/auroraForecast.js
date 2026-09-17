export const OVERKALIX = Object.freeze({
  name: "Överkalix",
  latitude: 66.327,
  longitude: 22.844,
  timezone: "Europe/Stockholm",
});

const EARTH_RADIUS_KM = 6371;

const toRadians = (value) => (value * Math.PI) / 180;
const toDegrees = (value) => (value * 180) / Math.PI;

function asNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}

function median(values) {
  const valid = values.filter((value) => Number.isFinite(value)).sort((a, b) => a - b);
  if (!valid.length) return null;

  const middle = Math.floor(valid.length / 2);
  return valid.length % 2 ? valid[middle] : (valid[middle - 1] + valid[middle]) / 2;
}

function distanceKm(from, to) {
  const latitudeDelta = toRadians(to.latitude - from.latitude);
  const longitudeDelta = toRadians(to.longitude - from.longitude);
  const latitudeFrom = toRadians(from.latitude);
  const latitudeTo = toRadians(to.latitude);
  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(latitudeFrom) * Math.cos(latitudeTo) * Math.sin(longitudeDelta / 2) ** 2;

  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function bearingDegrees(from, to) {
  const latitudeFrom = toRadians(from.latitude);
  const latitudeTo = toRadians(to.latitude);
  const longitudeDelta = toRadians(to.longitude - from.longitude);
  const y = Math.sin(longitudeDelta) * Math.cos(latitudeTo);
  const x =
    Math.cos(latitudeFrom) * Math.sin(latitudeTo) -
    Math.sin(latitudeFrom) * Math.cos(latitudeTo) * Math.cos(longitudeDelta);

  return (toDegrees(Math.atan2(y, x)) + 360) % 360;
}

function directionFromBearing(bearing) {
  if (bearing >= 337.5 || bearing < 22.5) return "N";
  if (bearing < 67.5) return "NNE";
  if (bearing < 112.5) return "L";
  if (bearing < 157.5) return "SSE";
  if (bearing < 202.5) return "S";
  if (bearing < 247.5) return "SSO";
  if (bearing < 292.5) return "O";
  return "NNO";
}

function destinationPoint(origin, bearing, distance) {
  const angularDistance = distance / EARTH_RADIUS_KM;
  const bearingRadians = toRadians(bearing);
  const latitude = toRadians(origin.latitude);
  const longitude = toRadians(origin.longitude);
  const destinationLatitude = Math.asin(
    Math.sin(latitude) * Math.cos(angularDistance) +
      Math.cos(latitude) * Math.sin(angularDistance) * Math.cos(bearingRadians)
  );
  const destinationLongitude =
    longitude +
    Math.atan2(
      Math.sin(bearingRadians) * Math.sin(angularDistance) * Math.cos(latitude),
      Math.cos(angularDistance) - Math.sin(latitude) * Math.sin(destinationLatitude)
    );

  return {
    latitude: toDegrees(destinationLatitude),
    longitude: ((toDegrees(destinationLongitude) + 540) % 360) - 180,
  };
}

export const WEATHER_POINTS = Object.freeze([
  { id: "local", label: "Överkalix", ...OVERKALIX, distanceKm: 0, direction: "local" },
  { id: "north-50", label: "Norte", ...destinationPoint(OVERKALIX, 0, 50), distanceKm: 50, direction: "N" },
  { id: "nne-50", label: "NNE", ...destinationPoint(OVERKALIX, 25, 50), distanceKm: 50, direction: "NNE" },
  { id: "nnw-50", label: "NNO", ...destinationPoint(OVERKALIX, 335, 50), distanceKm: 50, direction: "NNO" },
  { id: "north-110", label: "Norte", ...destinationPoint(OVERKALIX, 0, 110), distanceKm: 110, direction: "N" },
  { id: "nne-110", label: "NNE", ...destinationPoint(OVERKALIX, 25, 110), distanceKm: 110, direction: "NNE" },
  { id: "nnw-110", label: "NNO", ...destinationPoint(OVERKALIX, 335, 110), distanceKm: 110, direction: "NNO" },
]);

function stockholmHourKey(date) {
  const pieces = new Intl.DateTimeFormat("sv-SE", {
    timeZone: OVERKALIX.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const valueFor = (type) => pieces.find((piece) => piece.type === type)?.value;

  return (
    valueFor("year") +
    "-" +
    valueFor("month") +
    "-" +
    valueFor("day") +
    "T" +
    valueFor("hour") +
    ":00"
  );
}

function readWeatherHour(dataset, point, index) {
  const hourly = dataset?.hourly;
  if (!hourly?.time?.[index]) return null;

  const cloud = asNumber(hourly.cloud_cover?.[index]);
  if (cloud === null) return null;

  return {
    point,
    time: hourly.time[index],
    cloud,
    lowCloud: asNumber(hourly.cloud_cover_low?.[index]),
    midCloud: asNumber(hourly.cloud_cover_mid?.[index]),
    highCloud: asNumber(hourly.cloud_cover_high?.[index]),
    visibility: asNumber(hourly.visibility?.[index]),
    isDay: Number(hourly.is_day?.[index]) === 1,
  };
}

export function buildSolarAssessment({ bz, by, wind, bzHistory }) {
  const latestBz = asNumber(bz);
  const latestBy = asNumber(by);
  const latestWind = asNumber(wind);

  if (latestBz === null || latestBy === null || latestWind === null) return null;

  const transverseBt = Math.hypot(latestBy, latestBz);
  const clockAngle = transverseBt ? Math.acos(clamp(latestBz / transverseBt, -1, 1)) : 0;
  const coupling =
    Math.pow(latestWind, 4 / 3) *
    Math.pow(transverseBt, 2 / 3) *
    Math.pow(Math.sin(clockAngle / 2), 8 / 3);
  const driver = Math.round(clamp(((coupling - 4000) / 26000) * 100, 0, 100));
  const history = Array.isArray(bzHistory) ? bzHistory : [];
  const datedHistory = history
    .map((record) => ({ ...record, timestamp: new Date(record.timeTag).getTime() }))
    .filter((record) => Number.isFinite(record.timestamp) && asNumber(record.bz) !== null)
    .sort((first, second) => first.timestamp - second.timestamp);
  const newest = datedHistory.at(-1)?.timestamp;
  const historyAgeMinutes = Number.isFinite(newest)
    ? Math.max(0, Math.round((Date.now() - newest) / 60000))
    : null;
  const historyFresh = historyAgeMinutes !== null && historyAgeMinutes <= 10;
  const lastHour =
    newest === undefined || !historyFresh
      ? []
      : datedHistory.filter((record) => record.timestamp >= newest - 60 * 60 * 1000);
  const southwardSamples = lastHour.filter((record) => record.bz <= -5).length;
  const sampleCount = lastHour.length;
  const sustainedSouthward = sampleCount >= 30 && southwardSamples / sampleCount >= 0.7;
  const medianBz = median(lastHour.map((record) => asNumber(record.bz)));

  let level = "low";
  if ((driver >= 65 && sustainedSouthward) || (driver >= 80 && latestBz <= -5)) {
    level = "high";
  } else if (driver >= 35 || (sustainedSouthward && latestWind >= 420)) {
    level = "moderate";
  }

  return {
    driver,
    level,
    coupling,
    transverseBt,
    clockAngle: Math.round(toDegrees(clockAngle)),
    latestBz,
    latestBy,
    latestWind,
    medianBz,
    southwardSamples,
    sampleCount,
    sustainedSouthward,
    historyAgeMinutes,
    historyFresh,
  };
}

export function buildGroundAssessment(payload, now = new Date()) {
  const assessment = payload?.assessment;
  const updatedAt = new Date(assessment?.updatedAt).getTime();
  if (!assessment || !Number.isFinite(updatedAt)) return null;
  const ageMinutes = Math.max(0, Math.round((now.getTime() - updatedAt) / 60000));
  const fresh = ageMinutes <= 10;
  return {
    ...assessment,
    level: fresh ? assessment.level : "stale",
    fresh,
    ageMinutes,
    stations: Array.isArray(payload.stations) ? payload.stations : [],
    source: payload.source ?? "FMI IMAGE",
  };
}

export function buildOvationAssessment(payload) {
  if (!Array.isArray(payload?.coordinates)) return null;

  const points = payload.coordinates
    .map((coordinate) => ({
      longitude: asNumber(coordinate?.[0]),
      latitude: asNumber(coordinate?.[1]),
      intensity: asNumber(coordinate?.[2]),
    }))
    .filter(
      (point) =>
        point.longitude !== null && point.latitude !== null && point.intensity !== null
    )
    .map((point) => ({
      ...point,
      distanceKm: distanceKm(OVERKALIX, point),
      bearing: bearingDegrees(OVERKALIX, point),
    }));

  if (!points.length) return null;

  const local = points.reduce((nearest, point) =>
    point.distanceKm < nearest.distanceKm ? point : nearest
  );
  const north = points
    .filter(
      (point) =>
        point.distanceKm >= 25 &&
        point.distanceKm <= 550 &&
        (point.bearing >= 310 || point.bearing <= 50)
    )
    .sort(
      (first, second) =>
        second.intensity - first.intensity || first.distanceKm - second.distanceKm
    )[0];

  let outlook = "quiet";
  if (local.intensity >= 25) {
    outlook = "overhead";
  } else if (north?.intensity >= 15) {
    outlook = "north";
  } else if (north?.intensity >= 8) {
    outlook = "far-north";
  }

  return {
    localIntensity: Math.round(local.intensity),
    northIntensity: north ? Math.round(north.intensity) : null,
    northDirection: north ? directionFromBearing(north.bearing) : null,
    northDistanceKm: north ? Math.round(north.distanceKm) : null,
    outlook,
    observationTime: payload["Observation Time"] ?? null,
    forecastTime: payload["Forecast Time"] ?? null,
  };
}

export function buildWeatherAssessment(payload, now = new Date()) {
  const datasets = Array.isArray(payload) ? payload : [payload];
  const localDataset = datasets[0];
  const time = localDataset?.hourly?.time;
  if (!Array.isArray(time) || !time.length) return null;

  const targetHour = stockholmHourKey(now);
  const currentIndex = Math.max(0, time.findIndex((value) => value >= targetHour));
  const local = readWeatherHour(localDataset, WEATHER_POINTS[0], currentIndex);
  const bestCandidates = [];

  for (let index = currentIndex; index < Math.min(currentIndex + 18, time.length); index += 1) {
    const currentTime = time[index];
    WEATHER_POINTS.slice(1).forEach((point, pointIndex) => {
      const record = readWeatherHour(datasets[pointIndex + 1], point, index);
      if (record && !record.isDay) bestCandidates.push({ ...record, time: currentTime });
    });
  }

  const bestWindow = bestCandidates.sort(
    (first, second) =>
      first.cloud - second.cloud ||
      first.point.distanceKm - second.point.distanceKm ||
      first.time.localeCompare(second.time)
  )[0];

  return {
    current: local,
    bestWindow: bestWindow ?? null,
  };
}

export function formatForecastHour(value) {
  return typeof value === "string" ? value.slice(11, 16) : "--";
}
