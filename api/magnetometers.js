const STATIONS = [
  { id: "PEL", name: "Pello" },
  { id: "MUO", name: "Muonio" },
  { id: "RAN", name: "Ranua" },
  {
    id: "KIR",
    name: "Kiruna",
    provider: "IRF",
    url: "https://www2.irf.se/maggraphs/rt_iaga_last_hour_1min_primary.txt",
  },
];
const ROOT = "https://space.fmi.fi/image/realtime/UT";

const median = (values) => {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!sorted.length) return null;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};

const mean = (values) => {
  const valid = values.filter(Number.isFinite);
  return valid.length ? valid.reduce((sum, value) => sum + value, 0) / valid.length : null;
};

function parseStation(text, station, now = Date.now()) {
  const rawSamples = text.split(/\r?\n/).map((line) => line.trim().split(/\s+/))
    .map((parts) => {
      if (station.provider === "IRF") {
        if (parts.length < 6 || !/^\d{4}-\d{2}-\d{2}$/.test(parts[0])) return null;
        const [x, y, z] = parts.slice(3, 6).map(Number);
        return { time: Date.parse(`${parts[0]}T${parts[1]}Z`), x, y, z };
      }
      if (parts.length < 9 || !/^\d{4}$/.test(parts[0])) return null;
      const [year, month, day, hour, minute, second] = parts.slice(0, 6).map(Number);
      const [x, y, z] = parts.slice(6, 9).map(Number);
      return { time: Date.UTC(year, month - 1, day, hour, minute, second), x, y, z };
    })
    .filter((sample) => sample && Number.isFinite(sample.time) && sample.time <= now + 60000 &&
      [sample.x, sample.y, sample.z].every((value) => Number.isFinite(value) && Math.abs(value) < 99990))
    .sort((a, b) => a.time - b.time);

  // Normalize higher-frequency FMI samples to the same minute cadence as Kiruna.
  const minuteBuckets = new Map();
  for (const sample of rawSamples) {
    const minute = Math.floor(sample.time / 60000) * 60000;
    const bucket = minuteBuckets.get(minute) ?? { time: minute, x: 0, y: 0, z: 0, count: 0 };
    bucket.x += sample.x;
    bucket.y += sample.y;
    bucket.z += sample.z;
    bucket.count += 1;
    minuteBuckets.set(minute, bucket);
  }
  const samples = [...minuteBuckets.values()].map((bucket) => ({
    time: bucket.time,
    x: bucket.x / bucket.count,
    y: bucket.y / bucket.count,
    z: bucket.z / bucket.count,
  }));
  if (samples.length < 12) return { ...station, available: false };
  const latest = samples.at(-1);
  const updatedAt = new Date(latest.time).toISOString();
  if (now - latest.time > 5 * 60 * 1000) return { ...station, available: false, updatedAt };
  const recent = samples.filter((sample) => sample.time >= latest.time - 10 * 60 * 1000);
  const previous = samples.filter((sample) => sample.time >= latest.time - 40 * 60 * 1000 && sample.time < latest.time - 10 * 60 * 1000);
  const lastHour = samples.filter((sample) => sample.time >= latest.time - 60 * 60 * 1000);
  const recentX = mean(recent.map((sample) => sample.x));
  const previousX = median(previous.map((sample) => sample.x));
  const xValues = lastHour.map((sample) => sample.x);
  let maxRate = 0;
  for (let index = 1; index < lastHour.length; index += 1) {
    const minutes = (lastHour[index].time - lastHour[index - 1].time) / 60000;
    if (minutes > 0 && minutes <= 2) maxRate = Math.max(maxRate, Math.abs(lastHour[index].x - lastHour[index - 1].x) / minutes);
  }
  return {
    ...station,
    available: true,
    updatedAt,
    deltaX: Math.round(recentX !== null && previousX !== null ? recentX - previousX : 0),
    rangeX: Math.round(Math.max(...xValues) - Math.min(...xValues)),
    maxRate: Math.round(maxRate * 10) / 10,
  };
}

function assess(stations) {
  const available = stations.filter((station) => station.available);
  if (!available.length) return null;
  const westward = Math.max(0, ...available.map((station) => -station.deltaX));
  const range = Math.max(...available.map((station) => station.rangeX));
  const rate = Math.max(...available.map((station) => station.maxRate));
  const activeStationCount = available.filter(
    (station) => station.deltaX <= -30 || station.rangeX >= 90 || station.maxRate >= 8
  ).length;
  const score = Math.round(Math.min(100, Math.min(100, westward / 2.5) * 0.5 + Math.min(100, range / 4.5) * 0.3 + Math.min(100, rate / 0.4) * 0.2));
  let level = "quiet";
  if (score >= 60 || westward >= 150 || range >= 300 || rate >= 25) level = "high";
  else if (
    score >= 22 ||
    westward >= 40 ||
    range >= 100 ||
    rate >= 12 ||
    activeStationCount >= 2
  ) level = "elevated";
  return {
    score,
    level,
    westward,
    range,
    rate,
    activeStationCount,
    stationCount: available.length,
    updatedAt: available.map((station) => station.updatedAt).sort().at(-1),
  };
}

export default async function handler(_request, response) {
  try {
    const stations = await Promise.all(STATIONS.map(async ({ url, ...station }) => {
      try {
        const upstream = await fetch(url ?? `${ROOT}/${station.id}/${station.id}data_01.txt`, {
          signal: AbortSignal.timeout(8000),
          cache: "no-store",
        });
        return upstream.ok ? parseStation(await upstream.text(), station) : { ...station, available: false };
      } catch {
        return { ...station, available: false };
      }
    }));
    response.setHeader("Cache-Control", "public, s-maxage=45, stale-while-revalidate=120");
    response.status(200).json({
      assessment: assess(stations),
      stations,
      source: "IMAGE network (FMI / IRF)",
    });
  } catch {
    response.status(502).json({ error: "Magnetometer data is temporarily unavailable." });
  }
}
