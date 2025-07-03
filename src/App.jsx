import React, { useState } from "react";
import "./i18n";
import { useTranslation } from "react-i18next";
import DataCard from "./components/DataCard";
import BzChart from "./components/BzChart";
import { playAlertSound } from "./utils/alertSound";

function getChance(bz, wind, kp) {
  if (bz < -2 && wind > 400 && kp >= 4) return "High";
  if (bz < -2 && wind > 400) return "Moderate";
  return "Low";
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
  // *** DADOS DEMO PARA TESTE VISUAL ***
  const [data] = useState({
    bz: -5.1,
    wind: 520,
    kp: 6.2,
    bzHistory: [
      { time: "18h", bz: -1.2 },
      { time: "19h", bz: -2.5 },
      { time: "20h", bz: -3.7 },
      { time: "21h", bz: -1.9 },
      { time: "22h", bz:  1.2 },
      { time: "23h", bz:  3.5 }
    ],
    time: "--"
  });
  // *******************************
  const [lastUpdate] = useState("agora");

  return (
    <div className="min-h-screen flex flex-col items-center px-2 pb-10" style={{
      background: "radial-gradient(ellipse at 50% 10%, #183153 0%, #0B1C24 100%)",
    }}>
      <div className="w-full max-w-2xl pt-8 flex flex-col items-center">
        <h1 className="text-2xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-auroraGreen to-auroraPurple bg-clip-text text-transparent select-none">{t("Aurora Substorm Monitor")}</h1>
        <div className="flex gap-2 mb-6">
          <button
            className="text-sm bg-[#161f27] hover:bg-auroraPurple hover:text-white rounded-lg px-3 py-1 text-white border border-white"
            onClick={() => i18n.changeLanguage(i18n.language === "en" ? "pt" : "en")}
          >
            {t("Switch Language")}
          </button>
        </div>
        {/* Painel de dados */}
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <DataCard
            title={t("BZ")}
            value={data.bz}
            unit="nT"
            color={getColor("bz", data.bz)}
          />
          <DataCard
            title={t("Solar Wind")}
            value={data.wind}
            unit="km/s"
            color={getColor("wind", data.wind)}
          />
          <DataCard
            title={t("Kp Index")}
            value={data.kp}
            unit=""
            color={getColor("kp", data.kp)}
          />
        </div>
        {/* Alerta visual */}
        {(data.bz < -2 && data.wind > 400) && (
          <div className="w-full flex flex-col items-center bg-auroraPurple/80 rounded-xl p-4 mb-2 animate-pulse shadow-lg">
            <div className="text-xl font-bold tracking-wider text-white">{t("ALERT!")}</div>
            <div className="font-medium text-white">{t("Alert! High chance of substorm!")}</div>
          </div>
        )}
        {/* Chance */}
        <div className="mb-3 text-lg flex gap-2 items-center text-white">
          <span className="text-white">{t("Chance of Substorm")}:</span>
          <span className="font-semibold text-xl text-white">
            {t(getChance(data.bz, data.wind, data.kp))}
          </span>
        </div>
        {/* Gráfico Bz */}
        <BzChart data={data.bzHistory} />
        {/* Última atualização */}
        <div className="mt-2 text-xs text-white">{t("Last update")}: {lastUpdate ?? "--"}</div>
      </div>
    </div>
  );
}
