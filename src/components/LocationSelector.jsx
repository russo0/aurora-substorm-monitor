import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { isSupportedLocation, normalizeSearchLocation, SUGGESTED_LOCATIONS } from "../utils/locations";

export default function LocationSelector({ location, onSelect }) {
  const { t, i18n } = useTranslation();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(!location);
  const requestRef = useRef(null);
  const generation = useRef(0);

  useEffect(() => () => {
    generation.current += 1;
    requestRef.current?.abort();
  }, []);

  function choose(next) {
    generation.current += 1;
    requestRef.current?.abort();
    setBusy(false);
    setStatus("");
    setResults([]);
    setEditing(false);
    onSelect(next);
  }

  async function search(event) {
    event.preventDefault();
    const term = query.trim();
    if (term.length < 2) {
      setStatus("location.shortQuery");
      return;
    }
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    const current = ++generation.current;
    setBusy(true);
    setResults([]);
    setStatus("");
    try {
      const params = new URLSearchParams({ name: term, count: "20", language: i18n.language === "pt" ? "pt" : "en" });
      const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params}`, { signal: controller.signal });
      if (!response.ok) throw new Error("Location search failed");
      const payload = await response.json();
      if (current !== generation.current) return;
      const matches = (payload.results ?? []).map(normalizeSearchLocation).filter(Boolean);
      setResults(matches);
      if (!matches.length) setStatus("location.noResults");
    } catch (error) {
      if (error.name !== "AbortError" && current === generation.current) setStatus("location.searchError");
    } finally {
      if (current === generation.current) setBusy(false);
    }
  }

  function useDeviceLocation() {
    if (!navigator.geolocation) {
      setStatus("location.unsupported");
      return;
    }
    requestRef.current?.abort();
    const current = ++generation.current;
    setBusy(true);
    setResults([]);
    setStatus("location.locating");
    navigator.geolocation.getCurrentPosition(position => {
      if (current !== generation.current) return;
      // Around one kilometre precision is sufficient for weather/model grids.
      const next = {
        name: "", source: "device",
        latitude: Math.round(position.coords.latitude * 100) / 100,
        longitude: Math.round(position.coords.longitude * 100) / 100,
        timezone: "auto",
      };
      if (!isSupportedLocation(next)) {
        setStatus("location.outside");
        setBusy(false);
        return;
      }
      choose(next);
    }, error => {
      if (current !== generation.current) return;
      setStatus(error.code === 1 ? "location.denied" : "location.unavailable");
      setBusy(false);
    }, { enableHighAccuracy: false, timeout: 12000, maximumAge: 5 * 60 * 1000 });
  }

  return (
    <section className="mb-5 w-full rounded-2xl border border-auroraGreen/40 bg-[#101d27]/95 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-auroraGreen">{t("location.coverage")}</p>
          <h2 className="mt-1 text-xl font-bold text-white">{location ? (location.source === "device" ? t("location.yours") : location.name) : t("location.choose")}</h2>
          {location && <p className="mt-1 text-xs text-slate-300">{[location.country, `${location.latitude.toFixed(2)}°, ${location.longitude.toFixed(2)}°`].filter(Boolean).join(" · ")}</p>}
        </div>
        {location && <button type="button" onClick={() => setEditing(!editing)} className="rounded-lg border border-white/30 bg-[#183153] px-3 py-2 text-sm text-white">{t(editing ? "location.close" : "location.change")}</button>}
      </div>

      {editing && <div className="mt-4">
        <button type="button" onClick={useDeviceLocation} disabled={busy} className="w-full rounded-xl border border-auroraGreen/60 bg-auroraGreen/10 px-4 py-3 text-sm font-semibold text-auroraGreen disabled:opacity-50 sm:w-auto">{t("location.use")}</button>
        <p className="mt-2 text-xs leading-relaxed text-slate-400">{t("location.privacy")}</p>
        <form onSubmit={search} className="mt-5 flex flex-col gap-2 sm:flex-row">
          <label className="grow">
            <span className="mb-1 block text-sm font-semibold text-white">{t("location.searchLabel")}</span>
            <input value={query} onChange={event => setQuery(event.target.value)} type="search" minLength={2} maxLength={100} placeholder={t("location.placeholder")} className="w-full rounded-xl border border-white/25 bg-[#0b1822] px-3 py-3 text-base text-white placeholder:text-slate-500 focus:border-auroraGreen focus:outline-none" />
          </label>
          <button type="submit" disabled={busy} className="rounded-xl border border-white/30 bg-[#183153] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50 sm:self-end">{t(busy ? "location.working" : "location.search")}</button>
        </form>
        <p role="status" className="mt-2 text-sm text-slate-200">{status ? t(status) : ""}</p>
        {results.length > 0 && <ul aria-label={t("location.results")} className="mt-3 space-y-2">
          {results.map(result => <li key={`${result.name}-${result.latitude}-${result.longitude}`}>
            <button type="button" onClick={() => choose(result)} className="w-full rounded-xl border border-white/15 bg-[#0b1822] px-4 py-3 text-left text-sm text-white hover:border-auroraGreen/60">
              <span className="block font-semibold">{result.name}</span>
              <span className="mt-1 block text-xs text-slate-300">{[result.admin, result.country].filter(Boolean).join(", ")}</span>
            </button>
          </li>)}
        </ul>}
        <div className="mt-4 flex flex-wrap gap-2">
          {SUGGESTED_LOCATIONS.map(place => <button key={place.name} type="button" onClick={() => choose(place)} className="rounded-full border border-white/25 bg-[#0b1822] px-3 py-2 text-xs text-slate-200 hover:border-auroraGreen">{place.name}</button>)}
        </div>
        <p className="mt-4 text-[11px] text-slate-500">{t("location.searchCredit")}</p>
      </div>}
    </section>
  );
}
