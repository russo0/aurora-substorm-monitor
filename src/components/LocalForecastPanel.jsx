import React from "react";
import { useTranslation } from "react-i18next";
import { buildObservationAssessment, formatForecastHour } from "../utils/auroraForecast";
import { OVERKALIX } from "../utils/locations";
import { isIceland } from "../utils/magnetometerStations";

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
  if (oval.allDirections) {
    if (oval.outlook === "overhead") return t("forecast.ovalOverhead");
    if (["north", "far-north"].includes(oval.outlook)) return t("forecast.ovalDirection", { direction: t(oval.northDirection) });
    return t("Oval fraco para esta latitude");
  }
  if (oval.outlook === "overhead") return t("Sinal do oval sobre Överkalix");
  if (oval.outlook === "north") return t("Oval ativo ao norte");
  if (oval.outlook === "far-north") return t("Sinal fraco mais ao norte");
  return t("Oval fraco para esta latitude");
}

function groundMessage(ground, t) {
  if (!ground) return t("Aguardando magnetômetros");
  if (ground.level === "unavailable") return t("forecast.noRecentGround");
  if (!ground.fresh) return t("Dados terrestres atrasados");
  if (ground.level === "high") return t("Substorm detectada na região");
  if (ground.level === "elevated") return t("Magnetosfera reagindo agora");
  return t("Campo geomagnético calmo");
}

function observationLabel(observation, t) {
  if (observation.status === "possible") {
    return observation.location === "horizon"
      ? t("Possível no horizonte a {{direction}}", { direction: t(observation.direction) })
      : t("Possível sobre a região");
  }
  const labels = {
    "cloud-gaps": "Visibilidade incerta entre nuvens",
    cloudy: "Visibilidade prejudicada por nuvens",
    daylight: "Luz do dia limita a observação",
    twilight: "Crepúsculo limita a observação",
    stale: "Oval desatualizado",
    unavailable: "Aguardando dados para avaliar a observação",
    weak: "Pouco sinal no modelo",
  };
  return t(labels[observation.status]);
}

function recommendation({ solar, oval, weather, ground, observation }, t) {
  if (!solar || !oval || !weather?.current) return t("Coletando as fontes para a recomendação...");
  if (observation.status === "unavailable") return t("Coletando as fontes para a recomendação...");
  if (observation.status === "stale") return t("O oval está atrasado. Confira o céu e a câmera enquanto aguardamos dados atualizados.");
  if (["daylight", "twilight"].includes(observation.status)) {
    return t("A claridade dificulta observar aurora fraca. Acompanhe as condições quando o céu escurecer.");
  }

  const happeningNow = ground?.fresh && ["elevated", "high"].includes(ground.level);
  const stormActive = ["elevated", "high"].includes(solar.stormContext);
  const active = solar.driver >= 35 || solar.sustainedSouthward || stormActive || happeningNow;
  const ovalNearby = oval.localIntensity >= 20 || (oval.northIntensity ?? 0) >= 15;
  const localClear = weather.current.cloud <= 45;
  const localClosed = weather.current.cloud >= 75;
  const gap = weather.bestWindow;

  if (happeningNow && localClear && (!oval.allDirections || ovalNearby)) {
    return t("Atividade geomagnética detectada agora. Observe o céu e confira a câmera, mesmo que o Bz já tenha mudado.");
  }
  if (happeningNow && localClosed && gap && gap.cloud <= 45) {
    return t("forecast.cloudGap");
  }
  if (observation.status === "possible" && observation.location === "horizon") {
    return t("forecast.horizonRecommendation", { direction: t(observation.direction) });
  }
  if (observation.status === "possible" && observation.location === "overhead") {
    return t("O oval sugere aurora sobre a região e o céu local está favorável. Confira o céu e a câmera.");
  }
  if (observation.status === "cloud-gaps") {
    return t("Há sinal de aurora no modelo, mas as nuvens tornam a observação incerta. Confira as aberturas e a câmera.");
  }
  if (active && ovalNearby && localClear) {
    return t("forecast.lookRecommendation", { direction: t(oval.northDirection || "N") });
  }
  if (active && ovalNearby && localClosed && gap && gap.cloud <= 45) {
    return t("forecast.cloudGap");
  }
  if (active && ovalNearby) {
    return t("Atividade promissora; acompanhe o céu e a webcam antes de sair.");
  }
  if (weather.current.cloud >= 75) {
    return t("Mesmo com atividade, o céu fechado é o principal limitador agora.");
  }
  return t("O modelo mostra pouco sinal agora. Aurora fraca ainda pode escapar da previsão; confira o céu e a câmera se estiver limpo.");
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

export default function LocalForecastPanel({ solar, oval, weather, ground, loading, error, updatedAt, location = OVERKALIX, isLocalPage = false, stations = null }) {
  const { t, i18n } = useTranslation();
  const observation = buildObservationAssessment({ oval, weather, location });
  const name = location.source === "device" ? t("location.yours") : location.name;
  const noCoverage = isLocalPage && stations?.length === 0;
  const stationDetails = ground?.stations ?? stations ?? [];
  const timezone = weather?.timezone || (location.timezone !== "auto" ? location.timezone : "UTC");
  const checkedTime = updatedAt && new Intl.DateTimeFormat(undefined, { timeZone: timezone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(updatedAt));
  const weatherDetail =
    weather?.current && Number.isFinite(weather.current.visibility)
      ? t("Visibilidade {{value}} km", { value: Math.round(weather.current.visibility / 1000) })
      : t("Visibilidade indisponível");
  const bzDetail = solar?.historyStatus === "stale"
    ? t("Histórico solar atrasado: {{count}} min", { count: solar.historyAgeMinutes })
    : solar?.historyStatus === "unavailable"
      ? t("Histórico solar indisponível")
      : solar?.sampleCount
        ? t("{{count}} amostras com Bz ≤ -5 nT na última hora", { count: solar.southwardSamples })
        : t("Histórico sendo carregado");
  const stormDetail =
    solar?.stormContext === "high"
      ? t("Magnetosfera ainda energizada após atividade forte")
      : solar?.stormContext === "elevated"
        ? t("Atividade residual: novas expansões continuam possíveis")
        : null;
  const northDetail =
    oval?.northIntensity > 0
      ? t("{{value}}/100 a {{direction}}, ~{{distance}} km", {
          value: oval.northIntensity,
          direction: t(oval.northDirection),
          distance: oval.northDistanceKm,
        })
      : t(isLocalPage ? "forecast.noNearbySignal" : "Sem sinal ao norte no modelo");
  const bestGap =
    weather?.bestWindow &&
    t("forecast.gapDetail", {
      hour: formatForecastHour(weather.bestWindow.time, timezone, i18n.language === "pt" ? "pt-BR" : "en-GB"),
      direction: t(weather.bestWindow.point.direction),
      distance: weather.bestWindow.point.distanceKm,
      cloud: Math.round(weather.bestWindow.cloud),
    });

  return (
    <section className="w-full rounded-2xl border border-auroraGreen/40 bg-[#101d27]/90 p-4 md:p-5 shadow-xl">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">{t("forecast.title", { name })}</h2>
          <p className="text-xs text-slate-300">{t("Leitura experimental: atividade, oval e céu são mostrados separadamente.")}</p>
        </div>
        {checkedTime && <span className="text-xs text-slate-400">{t("forecast.checked", { time: checkedTime, timezone })}</span>}
      </div>

      {loading && !oval && !weather && (
        <div className="mt-4 rounded-xl bg-[#0d1820] p-4 text-sm text-slate-200">
          {t("Montando a previsão local...")}
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
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
            {solar
              ? levelLabel(solar.level, t) + " · " + bzDetail + (stormDetail ? " · " + stormDetail : "")
              : t("O score combina V, By, Bz e Bt transversal.")}
          </div>
        </div>

        <div className={"rounded-xl border p-3 " + (ground?.fresh ? toneForLevel(ground?.level === "elevated" ? "moderate" : ground?.level) : "border-slate-500/50 bg-slate-500/10")}>
          <div className="text-sm font-semibold text-white">{t("Atividade no solo")}</div>
          <Metric
            label={t("forecast.groundLabel")}
            value={ground?.fresh ? ground.score + "/100" : "--"}
            detail={noCoverage ? t("forecast.noGroundCoverage") : groundMessage(ground, t)}
          />
          <div className="mt-2 text-xs text-slate-200">
            {ground?.fresh
              ? t("{{count}} estações · ΔX oeste {{westward}} nT · faixa {{range}} nT", {
                  count: ground.stationCount,
                  westward: ground.westward,
                  range: ground.range,
                })
              : noCoverage ? t(isIceland(location) ? "forecast.icelandGround" : "forecast.noGroundExplanation") : t("forecast.waitingGround")}
          </div>
          {stationDetails.length > 0 && <ul className="mt-2 space-y-1 text-[11px] text-slate-300">
            {stationDetails.map(station => <li key={station.id} className="flex flex-wrap justify-between gap-x-2">
              <span>{station.name}</span>
              <span className={station.available && ground?.fresh ? "text-auroraGreen" : "text-slate-400"}>{t(station.available && ground?.fresh ? "forecast.stationRecent" : loading ? "forecast.stationChecking" : "forecast.stationUnavailable")}</span>
            </li>)}
          </ul>}
          {isLocalPage && stations?.length > 0 && <p className="mt-2 text-[11px] text-slate-400">{t("forecast.regionalCaveat")}</p>}
          {noCoverage && isIceland(location) && <a className="mt-2 inline-block text-xs !text-auroraGreen underline" href="https://en.vedur.is/weather/articles/nr/2549" target="_blank" rel="noreferrer">{t("forecast.icelandSource")}</a>}
        </div>

        <div className={"rounded-xl border p-3 " + (oval?.outlook === "overhead" ? "border-auroraPurple bg-auroraPurple/15" : "border-sky-300 bg-sky-300/10")}>
          <div className="text-sm font-semibold text-white">{t("Oval da NOAA")}</div>
          <Metric
            label={t("forecast.signalAt", { name })}
            value={oval ? oval.localIntensity + "/100" : "--"}
            detail={ovalMessage(oval, t)}
          />
          <div className="mt-2 text-xs text-slate-200">
            {t(isLocalPage ? "forecast.nearbySignal" : "Melhor sinal ao norte")}: {northDetail}
          </div>
        </div>

        <div className="rounded-xl border border-cyan-200/50 bg-cyan-300/10 p-3">
          <div className="text-sm font-semibold text-white">{t(isLocalPage ? "forecast.skyAround" : "Céu e corredor norte")}</div>
          <Metric
            label={t("forecast.cloudsAt", { name })}
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
        <p className="mt-1 text-base font-semibold text-white">{observationLabel(observation, t)}</p>
        <p className="mt-1 text-sm text-white">{recommendation({ solar, oval, weather, ground, observation }, t)}</p>
      </div>

      {error?.length > 0 && <p role="status" className="mt-3 text-xs text-amber-200">{Array.isArray(error) ? error.map(key => t(key)).join(" ") : error}</p>}

      <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
        {t("forecast.sources")}
        {" "}<a className="!text-slate-300 underline" href="https://space.fmi.fi/image/realtime/UT/" target="_blank" rel="noreferrer">FMI IMAGE (CC BY 4.0)</a>
        {" · "}<a className="!text-slate-300 underline" href="https://www2.irf.se/maggraphs/" target="_blank" rel="noreferrer">IRF</a>
        {" · "}<a className="!text-slate-300 underline" href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo</a>
      </p>
    </section>
  );
}
