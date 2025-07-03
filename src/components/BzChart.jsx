import React from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { useTranslation } from "react-i18next";

export default function BzChart({ data }) {
  const { t } = useTranslation();

  return (
    <div className="w-full p-2 rounded-2xl bg-[#161f27] mt-4 shadow-md">
      <div className="text-sm mb-2 text-auroraGreen">{t("BZ")} ({t("Last 6h")})</div>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data}>
          <XAxis dataKey="time" fontSize={12} />
          <YAxis domain={[-10, 10]} ticks={[-10, -5, 0, 5, 10]} fontSize={12} />
          <Tooltip />
          <ReferenceLine y={0} stroke="#9D00FF" strokeWidth={2} strokeDasharray="6 4" />
          <Line
            type="monotone"
            dataKey="bz"
            stroke="#32FF8F"
            strokeWidth={2.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
