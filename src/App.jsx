import React, { useEffect, useState, useCallback, useRef } from "react";
import "./i18n";
import { useTranslation } from "react-i18next";
import DataCard from "./components/DataCard";
import BzChart from "./components/BzChart";
import WebcamGallery from "./components/WebcamGallery";

// Hook para detectar nova versão do app PWA
function usePWANewVersion() {
  const [waitingWorker, setWaitingWorker] = useState(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(reg => {
          reg.onupdatefound = () => {
            const newWorker = reg.installing || reg.waiting;
            if (newWorker && newWorker.state === "installed") {
              setWaitingWorker(newWorker);
              setShowBanner(true);
            }
          };
          if (reg.waiting) {
            setWaitingWorker(reg.waiting);
            setShowBanner(true);
          }
        });
      });
    }
  }, []);

  const updateApp = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  };

  return showBanner ? updateApp : null;
}

// Critério de subtempestade
function getChance(bzHistory, wind, bt) {
  let countBz6 = 0, countBz7 = 0, countBz4 = 0;
  bzHistory.forEach(item => {
    if (item.bz <= -4) countBz4++;
    if (item.bz <= -6) countBz6++;
    if (item.bz <= -7) countBz7++;
  });
  if ((countBz6 >= 30 && wind >= 500 && bt >= 10) ||
      (countBz7 >= 15 && bt >= 10)) {
    return "Alta";
  } else if ((countBz4 >= 15 && wind >= 400 && bt >= 7) ||
             (countBz6 >= 10 && bt >= 8)) {
    return "Moderada";
  }
  return "Baixa";
}

function getColor(type, value) {
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

export default function App() {
  const { t, i18n } = useTranslation();
  const [data, setData] = useState({
    bz: "--",
    wind: "--",
    kp: "--",
    bt: "--",
    bzHistory: [],
    time: "--"
  });
  const [lastUpdate, setLastUpdate] = useState("--");
  const intervalRef = useRef(null);

  const updateApp = usePWANewVersion();

  const fetchAll = useCallback(async () => {
  try {
    const PROXY = "https://proxy-noaa.russosec.workers.dev/?url=";

    // 1. BZ (IMF) + Bt
    const magRes = await fetch(`${PROXY}https://services.swpc.noaa.gov/json/dscovr/dscovr_mag_1m.json`);
    const magArr = await magRes.json();

    const validMag = magArr.filter(item => item && item.bz_gsm !== null && item.bt !== null);
    const lastMag = validMag[validMag.length - 1];

    const bz = Number(lastMag.bz_gsm);
    const bt = Number(lastMag.bt);
    const magTime = lastMag.time_tag;

    const bzHistory = validMag.slice(-360).map(row => ({
      time: row.time_tag?.slice(11, 16),
      bz: Number(row.bz_gsm),
      bt: Number(row.bt)
    }));

    // 2. Solar Wind (Updated Endpoint)
    const plasmaRes = await fetch(`${PROXY}https://services.swpc.noaa.gov/json/dscovr/dscovr_plasma_1m.json`);
    const plasmaData = await plasmaRes.json();

    let wind = "--";
    if (Array.isArray(plasmaData) && plasmaData.length > 0) {
      for (let i = plasmaData.length - 1; i >= 0; i--) {
        const val = Number(plasmaData[i].speed);
        if (!isNaN(val) && val > 0) {
          wind = val;
          break;
        }
      }
    }

    // 3. Kp Index
    const kpRes = await fetch(`${PROXY}https://services.swpc.noaa.gov/json/planetary_k_index_1m.json`);
    const kpArr = await kpRes.json();
    
    let kp = "--";
    if (Array.isArray(kpArr) && kpArr.length > 0) {
      for (let i = kpArr.length - 1; i >= 0; i--) {
        const val = Number(kpArr[i].kp_index);
        if (!isNaN(val) && val >= 0) {
          kp = val;
          break;
        }
      }
    }

    setData({
      bz,
      wind,
      kp,
      bt,
      bzHistory,
      time: magTime
    });
    setLastUpdate(new Date().toLocaleTimeString());
  } catch (err) {
    console.error("Erro ao carregar dados da NOAA:", err);
    setLastUpdate("erro");
  }
}, []);

  useEffect(() => {
    fetchAll();
    intervalRef.current = setInterval(fetchAll, 60000);
    return () => clearInterval(intervalRef.current);
  }, [fetchAll]);

  const handleManualUpdate = () => {
    fetchAll();
  };

  const chance = getChance(data.bzHistory, data.wind, data.bt);

  return (
    <div className="min-h-screen flex flex-col items-center px-2 pb-10" style={{
      background: "radial-gradient(ellipse at 50% 10%, #183153 0%, #0B1C24 100%)"
    }}>
      {updateApp && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-auroraGreen text-black px-6 py-3 rounded-xl shadow-xl border-2 border-white flex items-center gap-4 animate-pulse">
          <span>Nova versão do app disponível.</span>
          <button
            className="bg-auroraPurple text-white px-3 py-1 rounded-lg font-semibold shadow hover:bg-[#131e28]"
            onClick={updateApp}
          >
            Atualizar agora
          </button>
        </div>
      )}

      <div className="w-full max-w-2xl pt-8 flex flex-col items-center">
        <h1 className="text-2xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-auroraGreen to-auroraPurple bg-clip-text text-transparent select-none">
          {t("Monitor de Aurora")}
        </h1>
        <div className="flex gap-2 mb-6">
          <button
            type="button"
            className={`rounded-full w-9 h-9 text-2xl flex items-center justify-center border-2 ${i18n.language === "pt" ? "border-auroraGreen bg-[#223944]" : "border-gray-400 bg-[#161f27]"} transition`}
            aria-label="Trocar para Português"
            onClick={() => i18n.changeLanguage("pt")}
          >
            🇧🇷
          </button>
          <button
            type="button"
            className={`rounded-full w-9 h-9 text-2xl flex items-center justify-center border-2 ${i18n.language === "en" ? "border-auroraGreen bg-[#223944]" : "border-gray-400 bg-[#161f27]"} transition`}
            aria-label="Switch to English"
            onClick={() => i18n.changeLanguage("en")}
          >
            🇬🇧
          </button>
        </div>
        <div className="w-full grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <DataCard
            title={t("BZ (IMF)")}
            value={typeof data.bz === "number" ? data.bz.toFixed(1) : data.bz}
            unit="nT"
            color={getColor("bz", data.bz)}
          />
          <DataCard
            title={t("Vento Solar")}
            value={typeof data.wind === "number" ? Math.round(data.wind) : data.wind}
            unit="km/s"
            color={getColor("wind", data.wind)}
          />
          <DataCard
            title={t("Índice Kp")}
            value={typeof data.kp === "number" ? data.kp.toFixed(1) : data.kp}
            unit=""
            color={getColor("kp", data.kp)}
          />
          <DataCard
            title={t("Índice Bt")}
            value={typeof data.bt === "number" ? data.bt.toFixed(1) : data.bt}
            unit="nT"
            color={getColor("bt", data.bt)}
          />
        </div>
        {(chance === "Alta") && (
          <div className="w-full flex flex-col items-center bg-auroraPurple/80 rounded-xl p-4 mb-2 animate-pulse shadow-lg">
            <div className="text-xl font-bold tracking-wider text-white">{t("ALERTA!")}</div>
            <div className="font-medium text-white">{t("Alerta! Alta chance de subtempestade!")}</div>
          </div>
        )}
        <div className="mb-3 text-lg flex gap-2 items-center text-white">
          <span className="text-white">{t("Chance de Subtempestade")}:</span>
          <span className="font-semibold text-xl text-white">
            {t(chance)}
          </span>
        </div>
        <BzChart data={data.bzHistory} />
        <div className="mt-4 mb-4 w-full flex justify-center">
          <button
            className="text-sm bg-[#183153] hover:bg-auroraGreen hover:text-black rounded-lg px-3 py-1 text-white border border-white transition"
            onClick={handleManualUpdate}
          >
            {t("Atualizar agora")}
          </button>
        </div>
        <div className="mt-2 text-xs text-white">{t("Última atualização")}: {lastUpdate ?? "--"}</div>
      </div>
      <WebcamGallery />
    </div>
  );
}
