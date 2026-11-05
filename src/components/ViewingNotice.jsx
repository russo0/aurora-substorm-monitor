import React from "react";

export default function ViewingNotice({ observation, t }) {
  if (observation?.status !== "possible") return null;

  const message = observation.location === "overhead"
    ? t("Aurora possível sobre a região.")
    : observation.direction
      ? t("Aurora possível a {{direction}}.", { direction: t(observation.direction) })
      : t("Aurora possível.");

  return (
    <div role="status" className="mb-4 w-full rounded-xl border border-auroraGreen/60 bg-auroraGreen/10 px-4 py-3 text-left">
      <p className="text-lg font-bold text-auroraGreen">{t("Vale olhar agora")}</p>
      <p className="mt-0.5 text-sm text-white">{message}</p>
    </div>
  );
}
