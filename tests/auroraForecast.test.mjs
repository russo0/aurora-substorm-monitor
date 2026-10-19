import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";
import {
  buildObservationAssessment,
  buildSolarAssessment,
  getAuroraChance,
} from "../src/utils/auroraForecast.js";
import { parseNoaaTimestamp } from "../src/utils/noaaTime.js";

const now = new Date("2026-10-19T22:48:00Z");
const oval = {
  localIntensity: 5,
  northIntensity: 10,
  northDirection: "NNO",
  northDistanceKm: 414,
  outlook: "far-north",
  forecastTime: now.toISOString(),
};
const weather = { current: { cloud: 2, visibility: 77000 } };
const input = { bz: 3, by: -0.2, wind: 357, kp: 1, bzHistory: [] };

test("the reported faint-horizon case gets an observing hint without a strong activity alert", () => {
  const observation = buildObservationAssessment({ oval, weather }, now);
  assert.equal(observation.status, "possible");
  assert.equal(observation.location, "horizon");
  assert.equal(observation.direction, "NNO");
  assert.equal(observation.distanceKm, 414);
  assert.equal(getAuroraChance({
    solar: buildSolarAssessment(input),
    ground: { fresh: true, level: "quiet", score: 3 },
    oval,
  }), "Baixa");
});

test("clouds and daylight limit viewing even with a northern oval signal", () => {
  assert.equal(buildObservationAssessment({ oval, weather: { current: { cloud: 80 } } }, now).status, "cloudy");
  assert.equal(buildObservationAssessment({ oval, weather: { current: { cloud: 58 } } }, now).status, "cloud-gaps");
  const midday = new Date("2026-10-20T10:00:00Z");
  assert.equal(buildObservationAssessment({ oval: { ...oval, forecastTime: midday.toISOString() }, weather }, midday).status, "daylight");
});

test("weak, out-of-range, delayed or missing model data does not produce the horizon hint", () => {
  assert.equal(buildObservationAssessment({ oval: { ...oval, northIntensity: 0 }, weather }, now).status, "weak");
  assert.equal(buildObservationAssessment({ oval: { ...oval, northDistanceKm: 800 }, weather }, now).status, "weak");
  assert.equal(buildObservationAssessment({ oval: { ...oval, forecastTime: "2026-10-19T21:00:00Z" }, weather }, now).status, "stale");
  assert.equal(buildObservationAssessment({ oval: { ...oval, forecastTime: null }, weather }, now).status, "unavailable");
  assert.equal(buildObservationAssessment({ oval, weather: { current: { cloud: null } } }, now).status, "unavailable");
  assert.equal(buildObservationAssessment({ oval: null, weather }, now).status, "unavailable");
});

test("nearby stronger oval signals can indicate overhead viewing and strong ground activity stays high", () => {
  const observation = buildObservationAssessment({ oval: { ...oval, localIntensity: 40 }, weather }, now);
  assert.equal(observation.location, "overhead");
  assert.equal(getAuroraChance({ solar: buildSolarAssessment(input), ground: { fresh: true, level: "high" }, oval }), "Alta");
});

test("NOAA timestamps have the same UTC instant in Stockholm, UTC and Los Angeles", () => {
  const parserUrl = new URL("../src/utils/noaaTime.js", import.meta.url).href;
  const script = `import { parseNoaaTimestamp } from ${JSON.stringify(parserUrl)}; console.log(parseNoaaTimestamp('2026-10-19T22:47:00'));`;
  for (const timezone of ["Europe/Stockholm", "UTC", "America/Los_Angeles"]) {
    const result = execFileSync(process.execPath, ["--input-type=module", "-e", script], { env: { ...process.env, TZ: timezone }, encoding: "utf8" });
    assert.equal(Number(result.trim()), Date.parse("2026-10-19T22:47:00Z"));
  }
  assert.equal(parseNoaaTimestamp("2026-10-19 22:47:00.000"), Date.parse("2026-10-19T22:47:00Z"));
  assert.equal(parseNoaaTimestamp("2026-10-20T00:47:00+02:00"), Date.parse("2026-10-19T22:47:00Z"));
  assert(Number.isNaN(parseNoaaTimestamp(null)));
});

test("fresh history without a timezone retains storm context; old and absent history are distinguishable", (context) => {
  context.mock.method(Date, "now", () => now.getTime());
  const fresh = buildSolarAssessment({ ...input, bzHistory: [{ timeTag: "2026-10-19T22:47:00", bz: -5, bt: 9 }] });
  assert.equal(fresh.historyAgeMinutes, 1);
  assert.equal(fresh.sampleCount, 1);
  assert.equal(fresh.historyStatus, "current");
  assert.equal(fresh.stormContext, "high");
  const stale = buildSolarAssessment({ ...input, bzHistory: [{ timeTag: "2026-10-19T21:47:00", bz: -5, bt: 9 }] });
  assert.equal(stale.historyStatus, "stale");
  assert.equal(stale.stormContext, "quiet");
  assert.equal(buildSolarAssessment(input).historyStatus, "unavailable");
});

test("missing numeric measurements are not silently treated as zero", (context) => {
  context.mock.method(Date, "now", () => now.getTime());
  assert.equal(buildSolarAssessment({ ...input, bz: null }), null);
  assert.equal(buildSolarAssessment({ ...input, by: "" }), null);
  const solar = buildSolarAssessment({ ...input, bzHistory: [{ timeTag: "2026-10-19T22:47:00", bz: null, bt: 9 }] });
  assert.equal(solar.sampleCount, 0);
  assert.equal(solar.historyStatus, "unavailable");
});
