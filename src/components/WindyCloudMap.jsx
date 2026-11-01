import React from "react";
import { useTranslation } from "react-i18next";
import { OVERKALIX } from "../utils/locations";

export default function WindyCloudMap({ location = OVERKALIX, isLocalPage = false }) {
  const { t } = useTranslation();
  const name = location.source === "device" ? t("location.yours") : location.name;
  const latitude = location.latitude.toFixed(3);
  const longitude = location.longitude.toFixed(3);
  const params = new URLSearchParams({ lat: latitude, lon: longitude, detailLat: latitude, detailLon: longitude,
    width: "650", height: "450", zoom: "7", level: "surface", overlay: "clouds", product: "ecmwf",
    marker: "true", calendar: "now", location: "coordinates" });
  const embedUrl = `https://embed.windy.com/embed2.html?${params}`;
  const fullMapUrl = `https://www.windy.com/${latitude}/${longitude}?clouds,${latitude},${longitude},7`;

  return (
    <section className="mt-5 w-full overflow-hidden rounded-2xl border border-cyan-200/40 bg-[#101d27]/90 shadow-xl">
      <div className="flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">{isLocalPage ? t("forecast.mapTitle", { name }) : t("Mapa de nuvens: Lapônia")}</h2>
          <p className="text-xs text-slate-300">
            {t(isLocalPage ? "forecast.mapDescription" : "Use o controle de horário para procurar aberturas ao norte de Överkalix.")}
          </p>
        </div>
        <a
          className="w-fit rounded-lg border border-auroraGreen/60 px-3 py-1 text-sm text-auroraGreen transition hover:bg-auroraGreen hover:text-black"
          href={fullMapUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          {t("Abrir no Windy")}
        </a>
      </div>
      <div className="h-[340px] border-t border-white/10 md:h-[470px]">
        <iframe
          title={t("forecast.mapTitle", { name })}
          src={embedUrl}
          className="h-full w-full border-0"
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>
    </section>
  );
}
