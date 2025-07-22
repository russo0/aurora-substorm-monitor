import React from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { useTranslation } from "react-i18next";

export default function BzChart({ data }) {
  const { t } = useTranslation();

  // Array de valores onde as linhas horizontais vão aparecer (exceto 0)
  const refLines = [-30, -20, -10, 10, 20, 30];

  return (
    <div className="w-full p-2 rounded-2xl bg-[#161f27] mt-4 shadow-md">
      <div className="text-sm mb-2 text-auroraGreen">{t("Bz")} ({t("Last 6h")})</div>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data}>
          <XAxis dataKey="time" fontSize={12} />
          <YAxis domain={[-30, 30]} ticks={[-30, -25, -20, -15, -10, -5, 0, 5, 10, 15, 20, 25, 30]} fontSize={12} />
          <Tooltip />
          {/* Linhas horizontais tracejadas em múltiplos de 10 (menos o zero) */}
          {refLines.map(y => (
            <ReferenceLine
              key={y}
              y={y}
              stroke="#888"
              strokeWidth={1}
              strokeDasharray="5 5"
            />
          ))}
          {/* Linha zero em roxo destacada */}
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
