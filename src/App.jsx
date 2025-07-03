import React, { useEffect, useState } from "react";
import "./i18n";
import { useTranslation } from "react-i18next";
import DataCard from "./components/DataCard";
import BzChart from "./components/BzChart";

function getChance(bz, wind, kp) {
  if (bz < -2 && wind > 400 && kp >= 4) return "Alta";
  if (bz < -2 && wind > 400) return "Moderada";
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
  return "#32FF8F";
}

export default function App() {
  const { t, i18n } = useTranslation();
  const [data, setData] = useState({
    bz: "--",
    wind: "--",
    kp: "--",
    bzHistory: [],
    time: "--",
  });
  const [lastUpdate, setLastUpdate] = useState("--");

useEffect(() => {
  async function fetchAll() {
    try {
      // 1. Busca BZ
      const magRes = await fetch("https://services.swpc.noaa.gov/products/solar-wind/mag-6-hour.json");
      const magArr = await magRes.json();
      console.log("MAG JSON", magArr);

      // 2. Busca Solar Wind
      const plasmaRes = await fetch("https://services.swpc.noaa.gov/products/solar-wind/plasma-6-hour.json");
      const plasmaArr = await plasmaRes.json();
      console.log("PLASMA JSON", plasmaArr);

      // 3. Busca KP
      const kpRes = await fetch("https://services.swpc.noaa.gov/json/planetary_k_index_1m.json");
      const kpArr = await kpRes.json();
      console.log("KP JSON", kpArr);

      // ... (você pode manter o restante igual)
    } catch (err) {
      setLastUpdate("erro");
      console.error("Fetch failed!", err);
    }
  }
  fetchAll();
  const interval = setInterval(fetchAll, 120000);
  return () => clearInterval(interval);
}, []);

    fetchAll();
    const interval = setInterval(fetchAll, 120000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center px-2 pb-10" style={{
      background: "radial-gradient(ellipse at 50% 10%, #183153 0%, #0B1C24 100%)",
    }}>
      <div className="w-full max-w-2xl pt-8 flex flex-col items-center">
        <h1 className="text-2xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-auroraGreen to-auroraPurple bg-clip-text text-transparent select-none">{t("Monitor de Subtempestade de Aurora")}</h1>
        <div className="flex gap-2 mb-6">
          <button
            className="text-sm bg-[#161f27] hover:bg-auroraPurple hover:text-white rounded-lg px-3 py-1 text-white border border-white"
            onClick={() => i18n.changeLanguage(i18n.language === "en" ? "pt" : "en")}
          >
            {t("Trocar idioma")}
          </button>
        </div>
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
        </div>
        {(data.bz < -2 && data.wind > 400) && (
          <div className="w-full flex flex-col items-center bg-auroraPurple/80 rounded-xl p-4 mb-2 animate-pulse shadow-lg">
            <div className="text-xl font-bold tracking-wider text-white">{t("ALERTA!")}</div>
            <div className="font-medium text-white">{t("Alerta! Alta chance de subtempestade!")}</div>
          </div>
        )}
        <div className="mb-3 text-lg flex gap-2 items-center text-white">
          <span className="text-white">{t("Chance de Subtempestade")}:</span>
          <span className="font-semibold text-xl text-white">
            {t(getChance(data.bz, data.wind, data.kp))}
          </span>
        </div>
        <BzChart data={data.bzHistory} />
        <div className="mt-2 text-xs text-white">{t("Última atualização")}: {lastUpdate ?? "--"}</div>
      </div>
    </div>
  );
}
