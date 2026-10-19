import React from "react";
import { useTranslation } from "react-i18next";
import { buildObservationAssessment, formatForecastHour } from "../utils/auroraForecast";

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

function groundMessage(ground, t) {
  if (!ground) return t("Aguardando magnetômetros");
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

  if (happeningNow && localClear) {
    return t("Atividade geomagnética detectada agora. Observe o céu e confira a câmera, mesmo que o Bz já tenha mudado.");
  }
  if (happeningNow && localClosed && gap && gap.cloud <= 45) {
    return t("Substorm em andamento, mas o céu local está fechado. Há possível abertura no corredor norte.");
  }
  if (observation.status === "possible" && observation.location === "horizon") {
    return t("O oval sugere aurora ao norte, possivelmente baixa no horizonte. Com o céu local favorável, vale observar e conferir a câmera, mesmo com atividade geomagnética baixa.");
  }
  if (observation.status === "possible" && observation.location === "overhead") {
    return t("O oval sugere aurora sobre a região e o céu local está favorável. Confira o céu e a câmera.");
  }
  if (observation.status === "cloud-gaps") {
    return t("Há sinal de aurora no modelo, mas as nuvens tornam a observação incerta. Confira as aberturas e a câmera.");
  }
  if (active && ovalNearby && localClear) {
    return t("Boa combinação: observe o céu agora, principalmente para norte.");
  }
  if (active && ovalNearby && localClosed && gap && gap.cloud <= 45) {
    return t("Atividade favorável, mas céu local fechado. Há possível abertura ao norte no horário indicado.");
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

export default function LocalForecastPanel({ solar, oval, weather, ground, loading, error, updatedAt }) {
  const { t } = useTranslation();
  const observation = buildObservationAssessment({ oval, weather });
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
    oval?.northIntensity !== null && oval?.northIntensity !== undefined
      ? t("{{value}}/100 a {{direction}}, ~{{distance}} km", {
          value: oval.northIntensity,
          direction: t(oval.northDirection),
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

        <div className={"rounded-xl border p-3 " + toneForLevel(ground?.level === "elevated" ? "moderate" : ground?.level)}>
          <div className="text-sm font-semibold text-white">{t("Atividade no solo")}</div>
          <Metric
            label={t("Índice geomagnético local")}
            value={ground?.fresh ? ground.score + "/100" : "--"}
            detail={groundMessage(ground, t)}
          />
          <div className="mt-2 text-xs text-slate-200">
            {ground?.fresh
              ? t("{{count}} estações · ΔX oeste {{westward}} nT · faixa {{range}} nT", {
                  count: ground.stationCount,
                  westward: ground.westward,
                  range: ground.range,
                })
              : t("Pello, Muonio, Ranua e Kiruna · rede IMAGE")}
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
        <p className="mt-1 text-base font-semibold text-white">{observationLabel(observation, t)}</p>
        <p className="mt-1 text-sm text-white">{recommendation({ solar, oval, weather, ground, observation }, t)}</p>
      </div>

      {error && <p className="mt-3 text-xs text-amber-200">{error}</p>}

      <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
        {t("O driver mede a entrada solar atual. O estado geral também considera memória da tempestade, oval NOAA OVATION e magnetômetros IMAGE de FMI e IRF. As nuvens vêm do Open-Meteo. Confira a webcam antes de dirigir.")}
      </p>
    </section>
  );
}
