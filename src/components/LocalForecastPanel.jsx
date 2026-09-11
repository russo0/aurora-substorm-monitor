import React from "react";
import { useTranslation } from "react-i18next";
import { formatForecastHour } from "../utils/auroraForecast";

function toneForLevel(level) {
  if (level === "high") return "border-auroraPurple bg-auroraPurple/15";
  if (level === "moderate") return "border-amber-300 bg-amber-300/10";
  return "border-auroraGreen bg-auroraGreen/10";
}

function levelLabel(level, t) {
  if (level === "high") return t("Alta");
  if (level === "moderate") return t("Moderada");
  return t("Baixa");
}

function ovalMessage(oval, t) {
  if (!oval) return t("Aguardando oval");
  if (oval.outlook === "overhead") return t("Sinal do oval sobre Överkalix");
  if (oval.outlook === "north") return t("Oval ativo ao norte");
  if (oval.outlook === "far-north") return t("Sinal fraco mais ao norte");
  return t("Oval fraco para esta latitude");
}

function recommendation({ solar, oval, weather }, t) {
  if (!solar || !oval || !weather?.current) return t("Coletando as fontes para a recomendação...");

  const active = solar.driver >= 35 || solar.sustainedSouthward;
  const ovalNearby = oval.localIntensity >= 20 || (oval.northIntensity ?? 0) >= 15;
  const localClear = weather.current.cloud <= 45;
  const localClosed = weather.current.cloud >= 75;
  const gap = weather.bestWindow;

  if (active && ovalNearby && localClear) {
    return t("Boa combinação: observe o céu agora, principalmente para norte.");
  }
  if (active && ovalNearby && localClosed && gap && gap.cloud <= 45) {
    return t("Atividade favorável, mas céu local fechado. Há possível abertura ao norte no horário indicado.");
  }
  if (active && ovalNearby) {
    return t("Atividade promissora; acompanhe o céu e a webcam antes de sair.");
  }
  if (weather.current.cloud > 75) {
    return t("Mesmo com atividade, o céu fechado é o principal limitador agora.");
  }
  return t("Ainda falta uma combinação melhor de atividade solar e posição do oval.");
}

function Metric({ label, value, detail }) {
  return (
    <div className="rounded-xl bg-[#0d1820]/80 p-3 border border-white/10">
      <div className="text-xs uppercase tracking-wide text-slate-300">{label}</div>
      <div className="mt-1 text-2xl font-bold text-white">{value}</div>
      {detail && <div className="mt-1 text-xs text-slate-300">{detail}</div>}
    </div>
  );
}

export default function LocalForecastPanel({ solar, oval, weather, loading, error, updatedAt }) {
  const { t } = useTranslation();
  const weatherDetail =
    weather?.current && Number.isFinite(weather.current.visibility)
      ? t("Visibilidade {{value}} km", { value: Math.round(weather.current.visibility / 1000) })
      : t("Visibilidade indisponível");
  const bzDetail =
    solar && solar.sampleCount
      ? t("{{count}} min com Bz ≤ -5 nT na última hora", { count: solar.southwardSamples })
      : t("Histórico sendo carregado");
  const northDetail =
    oval?.northIntensity !== null && oval?.northIntensity !== undefined
      ? t("{{value}}/100 a {{direction}}, ~{{distance}} km", {
          value: oval.northIntensity,
          direction: oval.northDirection,
          distance: oval.northDistanceKm,
        })
      : t("Sem sinal ao norte no modelo");
  const bestGap =
    weather?.bestWindow &&
    t("{{hour}} — {{direction}}, ~{{distance}} km: {{cloud}}% de nuvens", {
      hour: formatForecastHour(weather.bestWindow.time),
      direction: weather.bestWindow.point.direction,
      distance: weather.bestWindow.point.distanceKm,
      cloud: Math.round(weather.bestWindow.cloud),
    });

  return (
    <section className="w-full rounded-2xl border border-auroraGreen/40 bg-[#101d27]/90 p-4 md:p-5 shadow-xl">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">{t("Previsão local: Överkalix")}</h2>
          <p className="text-xs text-slate-300">{t("Leitura experimental: atividade, oval e céu são mostrados separadamente.")}</p>
        </div>
        {updatedAt && <span className="text-xs text-slate-400">{t("Oval e céu atualizados")}: {updatedAt}</span>}
      </div>

      {loading && !oval && !weather && (
        <div className="mt-4 rounded-xl bg-[#0d1820] p-4 text-sm text-slate-200">
          {t("Montando a previsão local...")}
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className={"rounded-xl border p-3 " + toneForLevel(solar?.level)}>
          <div className="text-sm font-semibold text-white">{t("Atividade solar")}</div>
          <Metric
            label={t("Driver de acoplamento")}
            value={solar ? solar.driver + "/100" : "--"}
            detail={solar ? t("Bz {{bz}} nT · By {{by}} nT · {{wind}} km/s", {
              bz: solar.latestBz.toFixed(1),
              by: solar.latestBy.toFixed(1),
              wind: Math.round(solar.latestWind),
            }) : t("Aguardando dados solares")}
          />
          <div className="mt-2 text-xs text-slate-200">
            {solar ? levelLabel(solar.level, t) + " · " + bzDetail : t("O score combina V, By, Bz e Bt transversal.")}
          </div>
        </div>

        <div className={"rounded-xl border p-3 " + (oval?.outlook === "overhead" ? "border-auroraPurple bg-auroraPurple/15" : "border-sky-300 bg-sky-300/10")}>
          <div className="text-sm font-semibold text-white">{t("Oval da NOAA")}</div>
          <Metric
            label={t("Sinal sobre Överkalix")}
            value={oval ? oval.localIntensity + "/100" : "--"}
            detail={ovalMessage(oval, t)}
          />
          <div className="mt-2 text-xs text-slate-200">
            {t("Melhor sinal ao norte")}: {northDetail}
          </div>
        </div>

        <div className="rounded-xl border border-cyan-200/50 bg-cyan-300/10 p-3">
          <div className="text-sm font-semibold text-white">{t("Céu e corredor norte")}</div>
          <Metric
            label={t("Nuvens em Överkalix")}
            value={weather?.current ? Math.round(weather.current.cloud) + "%" : "--"}
            detail={weather?.current ? weatherDetail : t("Aguardando previsão do tempo")}
          />
          <div className="mt-2 text-xs text-slate-200">
            {bestGap ? t("Melhor abertura prevista") + ": " + bestGap : t("Nenhuma abertura noturna encontrada nas próximas 18 h.")}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-white/15 bg-black/20 p-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-auroraGreen">{t("Recomendação")}</div>
        <p className="mt-1 text-sm text-white">{recommendation({ solar, oval, weather }, t)}</p>
      </div>

      {error && <p className="mt-3 text-xs text-amber-200">{error}</p>}

      <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
        {t("O driver é uma escala de orientação, não uma porcentagem de chance. O oval vem do NOAA OVATION; as nuvens são previsão horária do Open-Meteo. Confira a webcam antes de dirigir.")}
      </p>
    </section>
  );
}
