import React, { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from "recharts";
import { useScoutingStore } from "../app/localDataStore";

interface Props {
  categories: string[];
}

const TeamPercentileBarChartVertical: React.FC<Props> = ({ categories }) => {
  const { teamStats, columnPercentiles, currentViewingTeam } = useScoutingStore();

  // Helper to calculate percentile based on q3 vs percentiles
  const getPercentile = (value: number, p: { p10: number; p25: number; p75: number; p90: number }) => {
    if (!p) return 0;
    if (value <= p.p10) return 10 * (value / p.p10);
    if (value <= p.p25) return 10 + 15 * ((value - p.p10) / (p.p25 - p.p10));
    if (value <= p.p75) return 25 + 50 * ((value - p.p25) / (p.p75 - p.p25));
    if (value <= p.p90) return 75 + 15 * ((value - p.p75) / (p.p90 - p.p75));
    return 90 + 10 * ((value - p.p90) / (p.p90 || value)); // extend beyond p90
  };

  const data = useMemo(() => {
    return categories.map((cat) => {
      const teamValue = teamStats[currentViewingTeam]?.[cat]?.q3 ?? 0;
      const percentiles = columnPercentiles[cat]?.q3;
      const percentileRank = percentiles ? getPercentile(teamValue, percentiles) : 0;

      return {
        category: cat.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase()),
        value: Math.min(100, percentileRank), // clamp at 100
      };
    });
  }, [categories, teamStats, columnPercentiles, currentViewingTeam]);

  return (
    <div className="w-full h-102 bg-white rounded-xl p-4 shadow-md mt-5 pb-15">
      <h3 className="text-lg font-semibold mb-3">Team Percentile Comparison</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 20, bottom: 40, left: 40 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="category" angle={-25} textAnchor="end" interval={0} />
          <YAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v.toFixed(0)}%`} />
          <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} animationDuration={50} />
          <Bar dataKey="value" fill="#f69f3bff" radius={[4, 4, 0, 0]} maxBarSize={50} animationDuration={500}>
            <LabelList dataKey="value" position="top" formatter={(v: number) => `${v.toFixed(0)}%`} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TeamPercentileBarChartVertical;
