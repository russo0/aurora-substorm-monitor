import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const HUXT_STATUS_URL = "/api/huxt-status";
const FALLBACK_FORECAST_PAGE = "https://swxforecastlab.org/forecasts.html";
const HUXT_AUTO_REFRESH_MS = 15 * 60 * 1000;

function huxtStatusUrl(forceRefresh = false) {
  // Cloudflare caches this custom-domain route more aggressively than its
  // origin headers. A shared 15-minute key keeps automatic checks current
  // without creating a unique cache entry for every visitor.
  const refreshKey = forceRefresh
    ? Date.now()
    : Math.floor(Date.now() / HUXT_AUTO_REFRESH_MS);
  return `${HUXT_STATUS_URL}?refresh=${refreshKey}`;
}

function formatDate(value, language) {
  if (!value || Number.isNaN(new Date(value).getTime())) return "--";

  return new Intl.DateTimeFormat(language === "pt" ? "pt-BR" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(value));
}

export default function HuxtForecast() {
  const { t, i18n } = useTranslation();
  const [status, setStatus] = useState({ loading: true, refreshing: false, data: null, error: null });

  const loadStatus = useCallback(async (forceRefresh = false) => {
    setStatus((previous) => ({
      ...previous,
      loading: !previous.data,
      refreshing: Boolean(previous.data),
      error: null,
    }));
    try {
      const response = await fetch(huxtStatusUrl(forceRefresh), { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
      setStatus({ loading: false, refreshing: false, data, error: null });
    } catch (error) {
      setStatus((previous) => ({
        loading: false,
        refreshing: false,
        data: previous.data,
        error: error instanceof Error ? error.message : "Unable to check HUXt",
      }));
    }
  }, []);

  useEffect(() => {
    loadStatus(true);
    const intervalId = window.setInterval(() => loadStatus(), HUXT_AUTO_REFRESH_MS);

    return () => window.clearInterval(intervalId);
  }, [loadStatus]);

  const sourcePage = status.data?.forecastPage || FALLBACK_FORECAST_PAGE;
  const canShowForecast = status.data?.available && status.data?.isCurrent;

  return (
    <section className="w-full rounded-2xl border border-cyan-300/30 bg-[#081521]/90 p-5 text-left shadow-lg" aria-labelledby="huxt-heading">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-auroraGreen">{t("Forecast context")}</p>
          <h2 id="huxt-heading" className="mt-1 text-xl font-semibold text-white">{t("Solar wind en route")}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">{t("HUXt description")}</p>
        </div>
        <button
          type="button"
          onClick={() => loadStatus(true)}
          disabled={status.loading || status.refreshing}
          className="shrink-0 rounded-lg border border-auroraGreen !bg-auroraGreen px-3 py-2 text-sm font-semibold !text-[#061018] transition hover:border-white hover:!bg-white disabled:cursor-wait disabled:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-auroraGreen"
        >
          {t("Check source")}
        </button>
      </div>

      {status.loading && <p className="mt-5 rounded-xl border border-slate-700 bg-slate-950/40 px-4 py-3 text-sm text-slate-300">{t("Checking official HUXt source")}</p>}
      {!status.loading && canShowForecast && (
        <div className="mt-5 overflow-hidden rounded-xl border border-slate-700 bg-black">
          <video controls preload="metadata" className="aspect-video w-full" src={status.data.versionedSourceUrl}>
            {t("Your browser cannot play this forecast video")}
          </video>
        </div>
      )}
      {!status.loading && !canShowForecast && (
        <div className="mt-5 rounded-xl border border-amber-300/30 bg-amber-300/5 px-4 py-3 text-sm leading-6 text-amber-100">
          {status.data?.available ? t("HUXt stale source", { hours: status.data.currentWindowHours }) : t("HUXt unavailable")}
        </div>
      )}

      <div className="mt-4 grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-700 bg-slate-950/30 p-3">
          <span className="block text-xs uppercase tracking-wide text-slate-500">{t("Source update")}</span>
          <span className="mt-1 block font-medium text-slate-100">{formatDate(status.data?.lastModified, i18n.language)} UTC</span>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-950/30 p-3">
          <span className="block text-xs uppercase tracking-wide text-slate-500">{t("Checked")}</span>
          <span className="mt-1 block font-medium text-slate-100">{formatDate(status.data?.checkedAt, i18n.language)} UTC</span>
        </div>
      </div>

      <p className="mt-4 text-xs leading-5 text-slate-400">
        {t("HUXt caveat")}{status.error ? ` ${t("HUXt check error")}: ${status.error}.` : ""}
      </p>
      <a href={sourcePage} target="_blank" rel="noreferrer" className="mt-3 inline-flex text-sm font-semibold text-auroraGreen hover:text-white">
        {t("Open official HUXt forecast")} ↗
      </a>
    </section>
  );
}
