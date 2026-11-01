import assert from "node:assert/strict";
import test from "node:test";
import { buildObservationAssessment, buildOvationAssessment, buildWeatherAssessment, buildWeatherPoints, formatForecastHour } from "../src/utils/auroraForecast.js";
import { OVERKALIX, SUGGESTED_LOCATIONS, isSupportedLocation, normalizeSearchLocation } from "../src/utils/locations.js";
import { selectMagnetometers } from "../src/utils/magnetometerStations.js";
import handler, { assess, parseStation } from "../api/magnetometers.js";

const reykjavik = SUGGESTED_LOCATIONS.find(place => place.name === "Reykjavík");
const tromso = SUGGESTED_LOCATIONS.find(place => place.name === "Tromsø");

test("each region uses its own oval cell and can find aurora south of the observer", () => {
  const payload = { coordinates: [[22.8, 66.3, 2], [338.05, 64.15, 4], [338.05, 61.5, 30], [22.8, 69, 50]] };
  const iceland = buildOvationAssessment(payload, reykjavik, true);
  const sweden = buildOvationAssessment(payload);
  assert.equal(iceland.localIntensity, 4);
  assert.equal(iceland.northDirection, "S");
  assert.equal(iceland.northIntensity, 30);
  assert.equal(sweden.localIntensity, 2);
  assert.equal(sweden.northDirection, "N");
  assert.equal(sweden.northIntensity, 50);
});

test("sunlight is evaluated at the selected place, not at Överkalix", () => {
  const now = new Date("2026-11-01T15:00:00Z");
  const oval = { localIntensity: 35, forecastTime: now.toISOString() };
  const weather = { current: { cloud: 2 } };
  assert.equal(buildObservationAssessment({ oval, weather, location: reykjavik }, now).status, "daylight");
  assert.notEqual(buildObservationAssessment({ oval, weather, location: OVERKALIX }, now).status, "daylight");
});

test("Nordic magnetic activity is never passed off as Icelandic or western European activity", () => {
  assert.equal(selectMagnetometers(reykjavik).length, 0);
  assert.equal(selectMagnetometers({ latitude: 52.52, longitude: 13.41 }).length, 0);
  const northern = selectMagnetometers(tromso);
  assert(northern.some(station => station.id === "KIL"));
  assert(northern.every(station => station.distanceKm <= 550));
  assert.notDeepEqual(northern.map(station => station.id), selectMagnetometers(OVERKALIX).map(station => station.id));
});

test("weather windows use actual instants across the end of daylight saving time", () => {
  const points = buildWeatherPoints(reykjavik, true);
  assert.equal(points[0].longitude, reykjavik.longitude);
  assert(points.some(point => point.direction === "S" && point.latitude < reykjavik.latitude));
  const times = [Date.parse("2026-10-25T00:00:00Z") / 1000, Date.parse("2026-10-25T01:00:00Z") / 1000];
  const datasets = points.map(() => ({ timezone: "Atlantic/Reykjavik", hourly: {
    time: times, cloud_cover: [80, 5], visibility: [10000, 40000], is_day: [0, 0],
  } }));
  const weather = buildWeatherAssessment(datasets, new Date("2026-10-25T01:45:00Z"), points);
  assert.equal(weather.current.cloud, 5);
  assert.equal(weather.bestWindow.time, times[1]);
  assert.match(formatForecastHour(times[1], "Atlantic/Reykjavik"), /01:00/);
  assert.match(formatForecastHour(times[1], "Europe/Stockholm"), /02:00/);
  assert.equal(buildWeatherAssessment(datasets, new Date("2026-10-26T01:45:00Z"), points), null);
  const cloudyDatasets = datasets.map(dataset => ({ ...dataset, hourly: { ...dataset.hourly, cloud_cover: [80, 70] } }));
  assert.equal(buildWeatherAssessment(cloudyDatasets, new Date("2026-10-25T01:45:00Z"), points).bestWindow, null);
  const crossingZone = [cloudyDatasets[0], { timezone: "Europe/Stockholm", hourly: {
    time: [times[1], times[1] + 3600], cloud_cover: [90, 5], is_day: [0, 0],
  } }];
  assert.equal(buildWeatherAssessment(crossingZone, new Date("2026-10-25T01:45:00Z"), points.slice(0, 2)).bestWindow, null);
});

test("locations outside the first release's area are rejected instead of silently using Sweden", () => {
  assert(isSupportedLocation(reykjavik));
  assert(!isSupportedLocation({ latitude: 64.8, longitude: -147.7 }));
  assert(!isSupportedLocation({ latitude: null, longitude: 22 }));
  assert(!isSupportedLocation({ latitude: 61, longitude: NaN }));
  assert.equal(normalizeSearchLocation({ name: "Portland", latitude: 45.52, longitude: -122.67, country_code: "US" }), null);
});

test("magnetometer station IDs are an allowlist, not arbitrary upstream URLs", async context => {
  let fetched = false;
  context.mock.method(globalThis, "fetch", () => { fetched = true; throw new Error("Unexpected fetch"); });
  let code;
  let body;
  await handler({ url: "/api/magnetometers?stations=LRV,https://example.com" }, {
    status(value) { code = value; return this; }, json(value) { body = value; },
  });
  assert.equal(code, 400);
  assert.equal(fetched, false);
  assert(body.error);
});

test("old magnetometer files and empty measurements do not become a calm current reading", () => {
  const now = Date.parse("2026-11-01T01:00:00Z");
  const lines = Array.from({ length: 40 }, (_, index) => {
    const time = new Date(now - (40 - index) * 60000);
    return `${time.toISOString().slice(0, 10)} ${time.toISOString().slice(11, 23)} 305 ${10000 - index} 200 50000`;
  }).join("\n");
  const station = { id: "KIR", provider: "IRF" };
  assert.equal(parseStation(lines, station, now).available, true);
  assert.equal(parseStation(lines, station, now + 12 * 60000).available, false);
  assert.equal(assess([parseStation("", station, now)]), null);
});
