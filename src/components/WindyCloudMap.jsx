import React from "react";
import { useTranslation } from "react-i18next";

const WINDY_EMBED_URL =
  "https://embed.windy.com/embed2.html?lat=66.327&lon=22.844&detailLat=66.327&detailLon=22.844&width=650&height=450&zoom=7&level=surface&overlay=clouds&product=ecmwf&menu=&message=true&marker=true&calendar=now&pressure=&type=map&location=coordinates&detail=&metricWind=default&metricTemp=default";

const WINDY_FULL_MAP_URL =
  "https://www.windy.com/66.327/22.844?clouds,66.327,22.844,7";

export default function WindyCloudMap() {
  const { t } = useTranslation();

  return (
    <section className="mt-5 w-full overflow-hidden rounded-2xl border border-cyan-200/40 bg-[#101d27]/90 shadow-xl">
      <div className="flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">{t("Mapa de nuvens: Lapônia")}</h2>
          <p className="text-xs text-slate-300">
            {t("Use o controle de horário para procurar aberturas ao norte de Överkalix.")}
          </p>
        </div>
        <a
          className="w-fit rounded-lg border border-auroraGreen/60 px-3 py-1 text-sm text-auroraGreen transition hover:bg-auroraGreen hover:text-black"
          href={WINDY_FULL_MAP_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          {t("Abrir no Windy")}
        </a>
      </div>
      <div className="h-[340px] border-t border-white/10 md:h-[470px]">
        <iframe
          title={t("Mapa de nuvens do Windy para Överkalix")}
          src={WINDY_EMBED_URL}
          className="h-full w-full border-0"
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>
    </section>
  );
}
