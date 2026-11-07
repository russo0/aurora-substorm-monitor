import React from "react";

export default function ViewingNotice({ observation, t }) {
  const cloudy = observation?.status === "cloudy" && Boolean(observation.location);
  if (observation?.status !== "possible" && !cloudy) return null;

  const message = observation.location === "overhead"
    ? t("Aurora possível sobre a região.")
    : observation.direction
      ? t("Aurora possível a {{direction}}.", { direction: t(observation.direction) })
      : t("Aurora possível.");

  return (
    <div role="status" className="mb-4 w-full rounded-xl border border-auroraGreen/60 bg-auroraGreen/10 px-4 py-3 text-left">
      <p className="text-lg font-bold text-auroraGreen">
        {t(cloudy ? "Sinal de aurora na região" : "Vale olhar agora")}
      </p>
      <p className="mt-0.5 text-sm text-white">{message}</p>
      {cloudy && (
        <p className="mt-1 text-sm text-white/80">
          {t("Céu previsto encoberto. Confira a câmera e procure aberturas nas nuvens.")}
        </p>
      )}
    </div>
  );
}
