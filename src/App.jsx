import React, { useCallback, useEffect, useRef, useState } from "react";
import "./i18n";
import { useTranslation } from "react-i18next";
import DataCard from "./components/DataCard";
import BzChart from "./components/BzChart";
import LocalForecastPanel from "./components/LocalForecastPanel";
import WebcamGallery from "./components/WebcamGallery";
import {
  WEATHER_POINTS,
  buildOvationAssessment,
  buildSolarAssessment,
  buildWeatherAssessment,
} from "./utils/auroraForecast";

const NOAA_BASE_URL = "https://services.swpc.noaa.gov";
const NOAA_PROXY_URL = "https://proxy-noaa.russosec.workers.dev/";

async function fetchNoaaJson(path) {
  const targetUrl = NOAA_BASE_URL + path;
  const response = await fetch(
    NOAA_PROXY_URL + "?url=" + encodeURIComponent(targetUrl)
  );

  if (!response.ok) {
    throw new Error("NOAA respondeu com HTTP " + response.status + " para " + path);
  }

  return response.json();
}

async function fetchWeatherForecast() {
  const params = new URLSearchParams({
    latitude: WEATHER_POINTS.map((point) => point.latitude.toFixed(4)).join(","),
    longitude: WEATHER_POINTS.map((point) => point.longitude.toFixed(4)).join(","),
    hourly: "cloud_cover,cloud_cover_low,cloud_cover_mid,cloud_cover_high,visibility,is_day",
    forecast_days: "2",
    timezone: "Europe/Stockholm",
  });
  const response = await fetch("https://api.open-meteo.com/v1/forecast?" + params);

  if (!response.ok) {
    throw new Error("Previsão do tempo respondeu com HTTP " + response.status);
  }

  return response.json();
}

function numberOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function latestValidRecord(records, isValid) {
  if (!Array.isArray(records)) return null;

  return records
    .filter((record) => record && isValid(record))
    .sort((first, second) => new Date(second.time_tag) - new Date(first.time_tag))[0] ?? null;
}

function usePWANewVersion() {
  const [waitingWorker, setWaitingWorker] = useState(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return undefined;

    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => {
        registration.onupdatefound = () => {
          const newWorker = registration.installing || registration.waiting;
          if (newWorker && newWorker.state === "installed") {
            setWaitingWorker(newWorker);
            setShowBanner(true);
          }
        };
        if (registration.waiting) {
          setWaitingWorker(registration.waiting);
          setShowBanner(true);
        }
      });
    });

    return undefined;
  }, []);

  const updateApp = () => {
    if (!waitingWorker) return;
    waitingWorker.postMessage({ type: "SKIP_WAITING" });
    window.location.reload();
  };

  return showBanner ? updateApp : null;
}

function getChance(bzHistory, wind, bt) {
  if (!Array.isArray(bzHistory) || !Number.isFinite(wind) || !Number.isFinite(bt)) {
    return "Baixa";
  }

  let countBz6 = 0;
  let countBz7 = 0;
  let countBz4 = 0;
  bzHistory.forEach((item) => {
    if (item.bz <= -4) countBz4 += 1;
    if (item.bz <= -6) countBz6 += 1;
    if (item.bz <= -7) countBz7 += 1;
  });
  if ((countBz6 >= 30 && wind >= 500 && bt >= 10) || (countBz7 >= 15 && bt >= 10)) {
    return "Alta";
  }
  if ((countBz4 >= 15 && wind >= 400 && bt >= 7) || (countBz6 >= 10 && bt >= 8)) {
    return "Moderada";
  }
  return "Baixa";
}

function getColor(type, value) {
  if (!Number.isFinite(value)) return "#FFF";
  if (type === "bz") return value < -2 ? "#32FF8F" : "#FFF";
  if (type === "wind") return value > 400 ? "#32FF8F" : "#FFF";
  if (type === "kp") {
    if (value >= 6) return "#FF3232";
    if (value >= 4) return "#FFD700";
    return "#32FF8F";
  }
  if (type === "bt") {
    if (value >= 10) return "#FF3232";
    if (value >= 7) return "#FFD700";
    return "#32FF8F";
  }
  return "#32FF8F";
}

function numberDisplay(value, formatter) {
  return Number.isFinite(value) ? formatter(value) : "--";
}

export default function App() {
  const { t, i18n } = useTranslation();
  const [data, setData] = useState({
    bz: null,
    by: null,
    wind: null,
    kp: null,
    bt: null,
    bzHistory: [],
    time: null,
  });
  const [localForecast, setLocalForecast] = useState({
    oval: null,
    weather: null,
    loading: true,
    error: null,
    updatedAt: null,
  });
  const [lastUpdate, setLastUpdate] = useState("--");
  const solarIntervalRef = useRef(null);
  const localIntervalRef = useRef(null);
  const updateApp = usePWANewVersion();

  const fetchAll = useCallback(async () => {
    let bz = null;
    let by = null;
    let bt = null;
    let wind = null;
    let kp = null;
    let bzHistory = [];
    let magTime = null;

    const [kpResult, windResult, magResult, historyResult] = await Promise.allSettled([
      fetchNoaaJson("/products/noaa-planetary-k-index.json"),
      fetchNoaaJson("/products/summary/solar-wind-speed.json"),
      fetchNoaaJson("/products/summary/solar-wind-mag-field.json"),
      fetchNoaaJson("/json/rtsw/rtsw_mag_1m.json"),
    ]);

    if (kpResult.status === "fulfilled") {
      const latestKp = latestValidRecord(
        kpResult.value,
        (record) => numberOrNull(record.Kp) !== null
      );
      if (latestKp) kp = numberOrNull(latestKp.Kp);
    } else {
      console.error("Erro ao buscar Kp:", kpResult.reason);
    }

    if (windResult.status === "fulfilled") {
      const latestWind = latestValidRecord(
        windResult.value,
        (record) => numberOrNull(record.proton_speed) !== null
      );
      if (latestWind) wind = numberOrNull(latestWind.proton_speed);
    } else {
      console.error("Erro ao buscar vento solar:", windResult.reason);
    }

    if (magResult.status === "fulfilled") {
      const latestMag = latestValidRecord(
        magResult.value,
        (record) =>
          numberOrNull(record.bz_gsm) !== null &&
          numberOrNull(record.bt) !== null
      );
      if (latestMag) {
        bz = numberOrNull(latestMag.bz_gsm);
        bt = numberOrNull(latestMag.bt);
        magTime = latestMag.time_tag;
      }
    } else {
      console.error("Erro ao buscar magnetômetro:", magResult.reason);
    }

    if (historyResult.status === "fulfilled" && Array.isArray(historyResult.value)) {
      const sixHoursAgo = Date.now() - 6 * 60 * 60 * 1000;
      const history = historyResult.value
        .filter(
          (record) =>
            record?.active !== false &&
            Number.isFinite(new Date(record.time_tag).getTime()) &&
            numberOrNull(record.bz_gsm) !== null &&
            numberOrNull(record.bt) !== null
        )
        .sort((first, second) => new Date(first.time_tag) - new Date(second.time_tag));
      const lastSixHours = history.filter(
        (record) => new Date(record.time_tag).getTime() >= sixHoursAgo
      );
      const samples = lastSixHours.length > 0 ? lastSixHours : history.slice(-360);
      const latestHistoryMag = latestValidRecord(
        history,
        (record) => numberOrNull(record.by_gsm) !== null
      );

      if (latestHistoryMag) {
        by = numberOrNull(latestHistoryMag.by_gsm);
        if (bz === null) bz = numberOrNull(latestHistoryMag.bz_gsm);
        if (bt === null) bt = numberOrNull(latestHistoryMag.bt);
        if (!magTime) magTime = latestHistoryMag.time_tag;
      }

      bzHistory = samples.map((record) => ({
        time: record.time_tag.slice(11, 16),
        timeTag: record.time_tag,
        bz: numberOrNull(record.bz_gsm),
        bt: numberOrNull(record.bt),
        by: numberOrNull(record.by_gsm),
      }));
    } else if (historyResult.status === "rejected") {
      console.error("Erro ao buscar histórico do magnetômetro:", historyResult.reason);
    }

    setData({ bz, by, wind, kp, bt, bzHistory, time: magTime });
    setLastUpdate(new Date().toLocaleTimeString());
  }, []);

  const fetchLocalForecast = useCallback(async () => {
    setLocalForecast((current) => ({ ...current, loading: true, error: null }));

    const [ovalResult, weatherResult] = await Promise.allSettled([
      fetchNoaaJson("/json/ovation_aurora_latest.json"),
      fetchWeatherForecast(),
    ]);
    const errors = [];
    const oval =
      ovalResult.status === "fulfilled" ? buildOvationAssessment(ovalResult.value) : null;
    const weather =
      weatherResult.status === "fulfilled" ? buildWeatherAssessment(weatherResult.value) : null;

    if (ovalResult.status === "rejected") errors.push("Não foi possível atualizar o oval da NOAA.");
    if (weatherResult.status === "rejected") errors.push("Não foi possível atualizar a previsão de nuvens.");

    setLocalForecast({
      oval,
      weather,
      loading: false,
      error: errors.length ? errors.join(" ") : null,
      updatedAt: new Date().toLocaleTimeString(),
    });
  }, []);

  useEffect(() => {
    fetchAll();
    solarIntervalRef.current = window.setInterval(fetchAll, 60 * 1000);
    return () => window.clearInterval(solarIntervalRef.current);
  }, [fetchAll]);

  useEffect(() => {
    fetchLocalForecast();
    localIntervalRef.current = window.setInterval(fetchLocalForecast, 5 * 60 * 1000);
    return () => window.clearInterval(localIntervalRef.current);
  }, [fetchLocalForecast]);

  const handleManualUpdate = () => {
    fetchAll();
    fetchLocalForecast();
  };

  const chance = getChance(data.bzHistory, data.wind, data.bt);
  const solar = buildSolarAssessment(data);
  const portugueseSelected = i18n.language === "pt";
  const englishSelected = i18n.language === "en";

  return (
    <div
      className="min-h-screen flex flex-col items-center px-2 pb-10"
      style={{ background: "radial-gradient(ellipse at 50% 10%, #183153 0%, #0B1C24 100%)" }}
    >
      {updateApp && (
        <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-4 rounded-xl border-2 border-white bg-auroraGreen px-6 py-3 text-black shadow-xl animate-pulse">
          <span>Nova versão do app disponível.</span>
          <button
            className="rounded-lg bg-auroraPurple px-3 py-1 font-semibold text-white shadow hover:bg-[#131e28]"
            onClick={updateApp}
          >
            Atualizar agora
          </button>
        </div>
      )}

      <div className="w-full max-w-4xl pt-8 flex flex-col items-center">
        <h1 className="mb-2 select-none bg-gradient-to-r from-auroraGreen to-auroraPurple bg-clip-text text-2xl font-bold text-transparent md:text-4xl">
          {t("Monitor de Aurora")}
        </h1>
        <div className="mb-6 flex gap-2">
          <button
            type="button"
            className={[
              "flex h-9 w-9 items-center justify-center rounded-full border-2 text-2xl transition",
              portugueseSelected ? "border-auroraGreen bg-[#223944]" : "border-gray-400 bg-[#161f27]",
            ].join(" ")}
            aria-label="Trocar para Português"
            onClick={() => i18n.changeLanguage("pt")}
          >
            🇧🇷
          </button>
          <button
            type="button"
            className={[
              "flex h-9 w-9 items-center justify-center rounded-full border-2 text-2xl transition",
              englishSelected ? "border-auroraGreen bg-[#223944]" : "border-gray-400 bg-[#161f27]",
            ].join(" ")}
            aria-label="Switch to English"
            onClick={() => i18n.changeLanguage("en")}
          >
            🇬🇧
          </button>
        </div>

        <div className="mb-4 grid w-full grid-cols-1 gap-4 md:grid-cols-4">
          <DataCard
            title={t("BZ (IMF)")}
            value={numberDisplay(data.bz, (value) => value.toFixed(1))}
            unit="nT"
            color={getColor("bz", data.bz)}
          />
          <DataCard
            title={t("Vento Solar")}
            value={numberDisplay(data.wind, (value) => Math.round(value))}
            unit="km/s"
            color={getColor("wind", data.wind)}
          />
          <DataCard
            title={t("Índice Kp")}
            value={numberDisplay(data.kp, (value) => value.toFixed(1))}
            unit=""
            color={getColor("kp", data.kp)}
          />
          <DataCard
            title={t("Índice Bt")}
            value={numberDisplay(data.bt, (value) => value.toFixed(1))}
            unit="nT"
            color={getColor("bt", data.bt)}
          />
        </div>

        {chance === "Alta" && (
          <div className="mb-2 flex w-full flex-col items-center rounded-xl bg-auroraPurple/80 p-4 shadow-lg animate-pulse">
            <div className="text-xl font-bold tracking-wider text-white">{t("ALERTA!")}</div>
            <div className="font-medium text-white">{t("Alerta! Alta chance de subtempestade!")}</div>
          </div>
        )}

        <div className="mb-3 flex items-center gap-2 text-lg text-white">
          <span>{t("Chance de Subtempestade")}:</span>
          <span className="text-xl font-semibold">{t(chance)}</span>
        </div>

        <LocalForecastPanel
          solar={solar}
          oval={localForecast.oval}
          weather={localForecast.weather}
          loading={localForecast.loading}
          error={localForecast.error}
          updatedAt={localForecast.updatedAt}
        />

        <BzChart data={data.bzHistory} />
        <div className="mt-4 mb-4 flex w-full justify-center">
          <button
            className="rounded-lg border border-white bg-[#183153] px-3 py-1 text-sm text-white transition hover:bg-auroraGreen hover:text-black"
            onClick={handleManualUpdate}
          >
            {t("Atualizar agora")}
          </button>
        </div>
        <div className="mt-2 text-xs text-white">
          {t("Última atualização")}: {lastUpdate ?? "--"}
        </div>
      </div>
      <WebcamGallery />
    </div>
  );
}
