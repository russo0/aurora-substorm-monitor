import { distanceKm } from "./geo.js";

// Only public numerical feeds whose formats have been checked are integrated.
// FMI: IMAGE CC BY 4.0. Kiruna: IRF's official provisional one-minute feed.
export const MAGNETOMETER_STATIONS = [
  { id: "KEV", name: "Kevo", latitude: 69.76, longitude: 27.01, provider: "FMI" },
  { id: "MAS", name: "Masi", latitude: 69.46, longitude: 23.70, provider: "FMI" },
  { id: "KIL", name: "Kilpisjärvi", latitude: 69.06, longitude: 20.77, provider: "FMI" },
  { id: "IVA", name: "Ivalo", latitude: 68.56, longitude: 27.29, provider: "FMI" },
  { id: "MUO", name: "Muonio", latitude: 68.02, longitude: 23.53, provider: "FMI" },
  { id: "KIR", name: "Kiruna", latitude: 67.84, longitude: 20.42, provider: "IRF" },
  { id: "PEL", name: "Pello", latitude: 66.90, longitude: 24.08, provider: "FMI" },
  { id: "RAN", name: "Ranua", latitude: 65.90, longitude: 26.41, provider: "FMI" },
  { id: "OUJ", name: "Oulujärvi", latitude: 64.52, longitude: 27.23, provider: "FMI" },
  { id: "MEK", name: "Mekrijärvi", latitude: 62.77, longitude: 30.97, provider: "FMI" },
  { id: "HAN", name: "Hankasalmi", latitude: 62.25, longitude: 26.60, provider: "FMI" },
  { id: "NUR", name: "Nurmijärvi", latitude: 60.50, longitude: 24.65, provider: "FMI" },
  { id: "TAR", name: "Tartu", latitude: 58.26, longitude: 26.46, provider: "FMI" },
];

export const DEFAULT_STATION_IDS = ["PEL", "MUO", "RAN", "KIR"];

export function selectMagnetometers(location) {
  if (!location) return [];
  // Proximity is an approximate coverage rule, not a claim of calibration.
  // Reject distant longitude sectors so Nordic activity never becomes a
  // local Icelandic or western European signal.
  return MAGNETOMETER_STATIONS
    .map(station => ({ ...station, distanceKm: Math.round(distanceKm(location, station)) }))
    .filter(station => station.distanceKm <= 550 &&
      Math.abs(station.longitude - location.longitude) <= 12 &&
      Math.abs(station.latitude - location.latitude) <= 5)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, 4);
}

export function isIceland(location) {
  return location && location.latitude >= 63 && location.latitude <= 67.5 &&
    location.longitude >= -25 && location.longitude <= -12;
}
