import SunCalc from "suncalc";
import { parseNoaaTimestamp } from "./noaaTime.js";
import { OVERKALIX } from "./locations.js";
import { distanceKm } from "./geo.js";

export { OVERKALIX };

const EARTH_RADIUS_KM = 6371;

const toRadians = (value) => (value * Math.PI) / 180;
const toDegrees = (value) => (value * 180) / Math.PI;

function asNumber(value) {
  if (value === null || value === undefined || value === "" || typeof value === "boolean") return null;
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
  return ["N", "NE", "L", "SE", "S", "SO", "O", "NO"][Math.round(bearing / 45) % 8];
}

function northernDirection(bearing) {
  if (bearing >= 337.5 || bearing < 22.5) return "N";
  return bearing < 67.5 ? "NNE" : "NNO";
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

export function buildWeatherPoints(location = OVERKALIX, allDirections = false) {
  const offsets = allDirections
    ? [0, 45, 90, 135, 180, 225, 270, 315].map(bearing => ({ bearing, distance: 75, direction: directionFromBearing(bearing) }))
    : [50, 110].flatMap(distance => [
      { bearing: 0, distance, direction: "N" },
      { bearing: 25, distance, direction: "NNE" },
      { bearing: 335, distance, direction: "NNO" },
    ]);
  return [
    { id: "local", label: location.name, ...location, distanceKm: 0, direction: "local" },
    ...offsets.map(({ bearing, distance, direction }) => ({
      id: `${bearing}-${distance}`, label: direction, ...destinationPoint(location, bearing, distance), distanceKm: distance, direction,
    })),
  ];
}

export const WEATHER_POINTS = Object.freeze(buildWeatherPoints());

function localHourKey(date, timezone = OVERKALIX.timezone) {
  const pieces = new Intl.DateTimeFormat("sv-SE", {
    timeZone: timezone,
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
  if (hourly?.time?.[index] === undefined) return null;

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

export function buildSolarAssessment({ bz, by, wind, kp, bzHistory }) {
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
    .map((record) => ({ ...record, timestamp: parseNoaaTimestamp(record.timeTag) }))
    .filter((record) => Number.isFinite(record.timestamp) && record.timestamp <= Date.now() + 60000 && asNumber(record.bz) !== null)
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
  const lastSixHours =
    newest === undefined || !historyFresh
      ? []
      : datedHistory.filter((record) => record.timestamp >= newest - 6 * 60 * 60 * 1000);
  const energizingSamples = lastSixHours.filter((record) => {
    const sampleBz = asNumber(record.bz);
    const sampleBt = asNumber(record.bt);
    return sampleBz !== null && sampleBt !== null && sampleBz <= -4 && sampleBt >= 8;
  });
  const lastEnergizingTimestamp = energizingSamples.at(-1)?.timestamp;
  const energyAgeMinutes = Number.isFinite(lastEnergizingTimestamp)
    ? Math.max(0, Math.round((newest - lastEnergizingTimestamp) / 60000))
    : null;
  const observedKp = asNumber(kp);

  let stormContext = "quiet";
  if ((observedKp !== null && observedKp >= 5) || (energyAgeMinutes !== null && energyAgeMinutes <= 180)) {
    stormContext = "high";
  } else if (
    (observedKp !== null && observedKp >= 4) ||
    (energyAgeMinutes !== null && energyAgeMinutes <= 360)
  ) {
    stormContext = "elevated";
  }

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
    historyStatus: newest === undefined ? "unavailable" : historyFresh ? "current" : "stale",
    observedKp,
    stormContext,
    energyAgeMinutes,
    energizingSampleCount: energizingSamples.length,
  };
}

export function getAuroraChance({ solar, ground, oval }) {
  const groundNow = ground?.fresh ? ground.level : null;
  if (groundNow === "high" || solar?.level === "high") return "Alta";
  if (groundNow === "elevated") return "Moderada";
  if (["high", "elevated"].includes(solar?.stormContext)) return "Moderada";
  if (solar?.level === "moderate" || solar?.sustainedSouthward) return "Moderada";
  if (oval?.outlook === "overhead" && (ground?.score ?? 0) >= 10) return "Moderada";
  return "Baixa";
}

export function buildObservationAssessment({ oval, weather, ground, location = OVERKALIX }, now = new Date()) {
  const cloud = asNumber(weather?.current?.cloud);
  if (!oval || cloud === null) return { status: "unavailable" };

  const modelTime = parseNoaaTimestamp(oval.forecastTime ?? oval.observationTime);
  if (!Number.isFinite(modelTime)) return { status: "unavailable" };
  const ageMinutes = (now.getTime() - modelTime) / 60000;
  if (ageMinutes > 45 || ageMinutes < -90) return { status: "stale" };

  const sunAltitude = toDegrees(SunCalc.getPosition(now, location.latitude, location.longitude).altitude);
  if (sunAltitude >= 0) return { status: "daylight" };
  if (sunAltitude > -6) return { status: "twilight" };

  // Reuse the weak northern signal already shown on the oval card. This is
  // an observing hint, not a calibrated probability or a substorm trigger.
  const horizonSignal = oval.northIntensity >= 8 &&
    oval.northDistanceKm >= 25 && oval.northDistanceKm <= 550;
  const viewingPosition = oval.localIntensity >= 25 ? "overhead" : horizonSignal ? "horizon" : null;
  if (cloud >= 75) {
    const groundActive = ground?.fresh && ["elevated", "high"].includes(ground.level);
    const ovalActive = viewingPosition === "overhead" || (horizonSignal && oval.northIntensity >= 15);
    if (!groundActive || !ovalActive) return { status: "cloudy" };
  }
  if (!viewingPosition) return { status: "weak" };
  return {
    status: cloud >= 75 ? "cloudy" : cloud <= 45 ? "possible" : "cloud-gaps",
    location: viewingPosition,
    direction: oval.northDirection,
    distanceKm: oval.northDistanceKm,
  };
}

export function buildGroundAssessment(payload, now = new Date()) {
  const assessment = payload?.assessment;
  const updatedAt = new Date(assessment?.updatedAt).getTime();
  if (!assessment || !Number.isFinite(updatedAt)) {
    return Array.isArray(payload?.stations)
      ? { fresh: false, level: "unavailable", stations: payload.stations, source: payload.source }
      : null;
  }
  const ageMinutes = Math.max(0, Math.round((now.getTime() - updatedAt) / 60000));
  const fresh = ageMinutes <= 10;
  return {
    ...assessment,
    level: fresh ? assessment.level : "stale",
    fresh,
    ageMinutes,
    stations: Array.isArray(payload.stations) ? payload.stations : [],
    source: payload.source ?? "IMAGE network",
  };
}

export function buildOvationAssessment(payload, location = OVERKALIX, allDirections = false) {
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
      distanceKm: distanceKm(location, point),
      bearing: bearingDegrees(location, point),
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
        (allDirections || point.bearing >= 310 || point.bearing <= 50)
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
    northDirection: north ? (allDirections ? directionFromBearing(north.bearing) : northernDirection(north.bearing)) : null,
    northDistanceKm: north ? Math.round(north.distanceKm) : null,
    outlook,
    allDirections,
    observationTime: payload["Observation Time"] ?? null,
    forecastTime: payload["Forecast Time"] ?? null,
  };
}

export function buildWeatherAssessment(payload, now = new Date(), points = WEATHER_POINTS) {
  const datasets = Array.isArray(payload) ? payload : [payload];
  const localDataset = datasets[0];
  const time = localDataset?.hourly?.time;
  if (!Array.isArray(time) || !time.length) return null;

  const unixTime = typeof time[0] === "number";
  const targetHour = unixTime ? Math.floor(now.getTime() / 3600000) * 3600 : localHourKey(now, localDataset.timezone || OVERKALIX.timezone);
  const currentIndex = time.findLastIndex(value => value <= targetHour);
  if (currentIndex < 0 || (currentIndex === time.length - 1 && time[currentIndex] < targetHour)) return null;
  const local = readWeatherHour(localDataset, points[0], currentIndex);
  if (!local) return null;
  const bestCandidates = [];

  for (let index = currentIndex; index < Math.min(currentIndex + 18, time.length); index += 1) {
    const currentTime = time[index];
    points.forEach((point, pointIndex) => {
      const dataset = datasets[pointIndex];
      // With timezone=auto, nearby points may fall on opposite sides of a
      // timezone boundary. Match instants rather than array positions.
      const matchingIndex = dataset?.hourly?.time?.indexOf(currentTime) ?? -1;
      const record = readWeatherHour(dataset, point, matchingIndex);
      const instant = unixTime ? new Date(currentTime * 1000) : null;
      const dark = !instant || toDegrees(SunCalc.getPosition(instant, point.latitude, point.longitude).altitude) <= -6;
      if (record && record.cloud <= 45 && !record.isDay && dark) bestCandidates.push({ ...record, time: currentTime });
    });
  }

  const bestWindow = bestCandidates.sort(
    (first, second) =>
      first.cloud - second.cloud ||
      first.point.distanceKm - second.point.distanceKm ||
      (unixTime ? first.time - second.time : first.time.localeCompare(second.time))
  )[0];

  return {
    current: local,
    bestWindow: bestWindow ?? null,
    timezone: localDataset.timezone || OVERKALIX.timezone,
  };
}

export function formatForecastHour(value, timezone, locale = "pt-BR") {
  if (typeof value === "number") {
    return new Intl.DateTimeFormat(locale, { timeZone: timezone || "UTC", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(value * 1000));
  }
  return typeof value === "string" ? value.slice(11, 16) : "--";
}
