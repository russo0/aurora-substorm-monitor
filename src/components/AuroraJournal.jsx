import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

const STORAGE_KEY = "boreal-one-aurora-observations-v1";
const MAX_ENTRIES = 500;

const OUTCOMES = ["Aurora visible", "No aurora with clear sky", "Sky too cloudy to assess"];
const VISIBILITY = ["Camera only", "Naked eye", "Both", "Not applicable"];
const DIRECTIONS = ["North", "North-east", "North-west", "Overhead", "Not applicable"];
const SKY_CONDITIONS = ["Clear", "Partly cloudy", "Cloudy"];
const INTENSITIES = ["Faint", "Moderate", "Strong", "Not applicable"];

function toLocalInputValue(date = new Date()) {
  const timezoneOffset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
}

function readEntries() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(saved) ? saved.slice(0, MAX_ENTRIES) : [];
  } catch {
    return [];
  }
}

function numericSnapshot(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function makeForm() {
  return {
    observedAt: toLocalInputValue(),
    outcome: "Aurora visible",
    visibility: "Camera only",
    direction: "North",
    sky: "Clear",
    intensity: "Faint",
    notes: "",
  };
}

function formatObservationDate(value, language) {
  if (!value || Number.isNaN(new Date(value).getTime())) return "--";
  return new Intl.DateTimeFormat(language === "pt" ? "pt-BR" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function AuroraJournal({ data }) {
  const { t, i18n } = useTranslation();
  const [entries, setEntries] = useState(() => readEntries());
  const [form, setForm] = useState(() => makeForm());
  const [notice, setNotice] = useState("");

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }, [entries]);

  const latestEntries = useMemo(() => entries.slice(0, 5), [entries]);
  const setField = (field, value) => setForm((previous) => ({ ...previous, [field]: value }));

  const saveObservation = (event) => {
    event.preventDefault();
    const observedAt = new Date(form.observedAt);
    if (!form.observedAt || Number.isNaN(observedAt.getTime())) {
      setNotice(t("Observation time required"));
      return;
    }

    const entry = {
      id: crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      observedAt: observedAt.toISOString(),
      savedAt: new Date().toISOString(),
      location: "Överkalix, Sweden",
      outcome: form.outcome,
      visibility: form.visibility,
      direction: form.direction,
      sky: form.sky,
      intensity: form.intensity,
      notes: form.notes.trim(),
      solarWindSnapshot: {
        bzGsm: numericSnapshot(data.bz),
        bt: numericSnapshot(data.bt),
        speed: numericSnapshot(data.wind),
        kp: numericSnapshot(data.kp),
        noaaTimeTag: data.time || null,
        capturedAt: new Date().toISOString(),
      },
    };

    setEntries((previous) => [entry, ...previous].slice(0, MAX_ENTRIES));
    setForm(makeForm());
    setNotice(t("Observation saved"));
  };

  const exportEntries = () => {
    const exportData = {
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      location: "Överkalix, Sweden",
      records: entries,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const downloadUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = downloadUrl;
    anchor.download = `aurora-overkalix-observations-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(downloadUrl);
  };

  return (
    <section className="w-full rounded-2xl border border-slate-600 bg-[#0b1520]/90 p-5 text-left shadow-lg" aria-labelledby="journal-heading">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-auroraGreen">{t("Local dataset")}</p>
          <h2 id="journal-heading" className="mt-1 text-xl font-semibold text-white">{t("Local observations")}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">{t("Journal description")}</p>
        </div>
        <button type="button" onClick={exportEntries} disabled={entries.length === 0} className="shrink-0 rounded-lg border border-slate-500 px-3 py-2 text-sm text-slate-100 transition hover:border-auroraGreen hover:text-auroraGreen disabled:cursor-not-allowed disabled:opacity-40">
          {t("Export JSON")}
        </button>
      </div>

      <div className="mt-4 rounded-xl border border-cyan-300/20 bg-cyan-300/5 px-4 py-3 text-sm leading-6 text-cyan-50">{t("Journal storage note")}</div>

      <form onSubmit={saveObservation} className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="text-sm font-medium text-slate-200">
          {t("When local time")}
          <input required type="datetime-local" value={form.observedAt} onChange={(event) => setField("observedAt", event.target.value)} className="mt-1 block w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-white" />
        </label>
        <label className="text-sm font-medium text-slate-200">
          {t("Outcome")}
          <select value={form.outcome} onChange={(event) => setField("outcome", event.target.value)} className="mt-1 block w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-white">
            {OUTCOMES.map((value) => <option key={value} value={value}>{t(value)}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium text-slate-200">
          {t("Visibility")}
          <select value={form.visibility} onChange={(event) => setField("visibility", event.target.value)} className="mt-1 block w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-white">
            {VISIBILITY.map((value) => <option key={value} value={value}>{t(value)}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium text-slate-200">
          {t("Direction")}
          <select value={form.direction} onChange={(event) => setField("direction", event.target.value)} className="mt-1 block w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-white">
            {DIRECTIONS.map((value) => <option key={value} value={value}>{t(value)}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium text-slate-200">
          {t("Sky")}
          <select value={form.sky} onChange={(event) => setField("sky", event.target.value)} className="mt-1 block w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-white">
            {SKY_CONDITIONS.map((value) => <option key={value} value={value}>{t(value)}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium text-slate-200">
          {t("Intensity")}
          <select value={form.intensity} onChange={(event) => setField("intensity", event.target.value)} className="mt-1 block w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-white">
            {INTENSITIES.map((value) => <option key={value} value={value}>{t(value)}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium text-slate-200 md:col-span-2">
          {t("Notes")}
          <textarea rows="3" value={form.notes} onChange={(event) => setField("notes", event.target.value)} placeholder={t("Notes placeholder")} className="mt-1 block w-full resize-y rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-white placeholder:text-slate-500" />
        </label>
        <div className="md:col-span-2">
          <button type="submit" className="rounded-lg bg-auroraGreen px-4 py-2 font-semibold text-slate-950 transition hover:bg-white">{t("Save observation")}</button>
          {notice && <span className="ml-3 text-sm text-auroraGreen">{notice}</span>}
        </div>
      </form>

      <div className="mt-7 border-t border-slate-700 pt-5">
        <h3 className="text-base font-semibold text-white">{t("Latest observations")} ({entries.length})</h3>
        {latestEntries.length === 0 ? (
          <p className="mt-3 text-sm text-slate-400">{t("No observations yet")}</p>
        ) : (
          <ul className="mt-3 grid gap-3">
            {latestEntries.map((entry) => (
              <li key={entry.id} className="rounded-xl border border-slate-700 bg-slate-950/40 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-semibold text-white">{t(entry.outcome)}</p>
                    <p className="mt-1 text-sm text-slate-400">{formatObservationDate(entry.observedAt, i18n.language)} · {t(entry.direction)} · {t(entry.visibility)}</p>
                  </div>
                  <span className="text-sm text-slate-400">{t(entry.sky)} · {t(entry.intensity)}</span>
                </div>
                {entry.notes && <p className="mt-3 text-sm leading-6 text-slate-300">{entry.notes}</p>}
                <p className="mt-3 text-xs text-slate-500">
                  {t("Snapshot")}: Bz {entry.solarWindSnapshot?.bzGsm ?? "--"} nT · Bt {entry.solarWindSnapshot?.bt ?? "--"} nT · {t("Solar wind short")} {entry.solarWindSnapshot?.speed ?? "--"} km/s · Kp {entry.solarWindSnapshot?.kp ?? "--"}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
