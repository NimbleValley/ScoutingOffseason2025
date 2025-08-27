import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";
import Navbar from "./components/NavBar";
import { EyeOff, Settings2, X } from "lucide-react";

interface ScoutingForm {
  id?: string;
  teamNumber: number;
  matchNumber: number;
  [key: string]: any;
}

type StatRecord = {
  max: number;
  min: number;
  median: number;
  mean: number;
  q3: number;
};

type TeamStats = {
  [column: string]: StatRecord;
};

type PercentileRecord = {
  p10: number;
  p25: number;
  p75: number;
  p90: number;
};

type ColumnPercentiles = {
  [column: string]: {
    min: PercentileRecord;
    max: PercentileRecord;
    median: PercentileRecord;
    mean: PercentileRecord;
    q3: PercentileRecord;
  };
};

// Fixed column order (used for Raw table view)
const columnOrder = [
  "teamNumber",
  "matchNumber",
  "selectedStation",
  "totalPoints",
  "autoPoints",
  "telePoints",
  "endgamePoints",
  "autoCoral",
  "teleCoral",
  "totalCoral",
  "totalAlgae",
  "totalGamepieces",
  "leave",
  "autoNetCount",
  "autoMissNetCount",
  "autoProcessorCount",
  "autoL4Count",
  "autoL3Count",
  "autoL2Count",
  "autoL1Count",
  "autoMissCoralCount",
  "teleNetCount",
  "teleMissNetCount",
  "teleProcessorCount",
  "teleL4Count",
  "teleL3Count",
  "teleL2Count",
  "teleL1Count",
  "teleMissCoralCount",
  "park",
  "selectedClimb",
  "commentText",
  "lostComms",
  "selectedStartPosition",
  "driverSkill",
  "disabled",
];

const numericColumns = [
  "teamNumber",
  "totalPoints",
  "autoPoints",
  "telePoints",
  "endgamePoints",
  "autoCoral",
  "teleCoral",
  "totalCoral",
  "totalAlgae",
  "totalGamepieces",
  "autoNetCount",
  "autoMissNetCount",
  "autoProcessorCount",
  "autoL4Count",
  "autoL3Count",
  "autoL2Count",
  "autoL1Count",
  "autoMissCoralCount",
  "teleNetCount",
  "teleMissNetCount",
  "teleProcessorCount",
  "teleL4Count",
  "teleL3Count",
  "teleL2Count",
  "teleL1Count",
  "teleMissCoralCount",
];

// Columns that will get percentile-based highlighting
const percentileColumns = [
  "totalPoints",
  "autoPoints",
  "telePoints",
  "endgamePoints",
  "autoCoral",
  "teleCoral",
  "totalCoral",
  "totalAlgae",
  "totalGamepieces",
  "teleNetCount",
];

// Utility to convert camelCase to Normal Case
const formatHeader = (str: string) => {
  const result = str.replace(/([A-Z])/g, " $1");
  return result.charAt(0).toUpperCase() + result.slice(1);
};

const viewComment = (comment: string) => {
  alert(comment || "No comment");
};

// Percentile function (linear interpolation)
function getPercentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const idx = (p / 100) * (values.length - 1);
  const lower = Math.floor(idx);
  const upper = Math.ceil(idx);
  if (lower === upper) return values[lower];
  return values[lower] + (values[upper] - values[lower]) * (idx - lower);
}

// Compute stats for a single team/column
function computeStats(values: number[]): StatRecord {
  if (values.length === 0)
    return { max: 0, min: 0, median: 0, q3: 0, mean: 0 };

  const sorted = [...values].sort((a, b) => a - b);
  const max = sorted[sorted.length - 1];
  const min = sorted[0];
  const median =
    sorted.length % 2 === 0
      ? Math.round(
        ((sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2) *
        10
      ) / 10
      : sorted[Math.floor(sorted.length / 2)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  const mean =
    Math.round(
      (sorted.reduce((sum, v) => sum + v, 0) / sorted.length) * 10
    ) / 10;

  return { max, min, median, q3, mean };
}

export default function Tables() {
  const [forms, setForms] = useState<ScoutingForm[]>([]);
  const [teamStats, setTeamStats] = useState<Record<number, TeamStats>>({});
  const [loading, setLoading] = useState(true);
  const [columnPercentiles, setColumnPercentiles] = useState<ColumnPercentiles>(
    {}
  );
  const [tableType, setTableType] = useState<"Raw" | "Team">("Team");
  const [teamValueType, setTeamValueType] = useState<
    "Min" | "Max" | "Median" | "Mean" | "Q3"
  >("Median");

  const [showControls, setShowControls] = useState(true);

  // Load Firestore data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "scoutingForms"));
        let data: ScoutingForm[] = querySnapshot.docs
          .map((doc) => {
            const formData = doc.data() as ScoutingForm;
            return { id: doc.id, ...formData };
          })
          .filter((form) => form.teamNumber !== -1);

        data.sort((a, b) => (a.matchNumber || 0) - (b.matchNumber || 0));
        setForms(data);
      } catch (error) {
        console.error("Error loading Firestore data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Compute team stats & percentiles
  useEffect(() => {
    const groupedTeams: Record<number, ScoutingForm[]> = {};
    forms.forEach((form) => {
      if (!groupedTeams[form.teamNumber]) groupedTeams[form.teamNumber] = [];
      groupedTeams[form.teamNumber].push(form);
    });

    const newTeamStats: Record<number, TeamStats> = {};
    Object.entries(groupedTeams).forEach(([teamNumber, teamData]) => {
      newTeamStats[Number(teamNumber)] = {};
      numericColumns.forEach((col) => {
        const values = teamData.map((row) => Number(row[col] ?? 0));
        newTeamStats[Number(teamNumber)][col] = computeStats(values);
      });
    });
    setTeamStats(newTeamStats);

    // Compute percentiles
    const newColumnPercentiles: ColumnPercentiles = {};
    numericColumns.forEach((col) => {
      newColumnPercentiles[col] = {} as any;

      (["min", "max", "median", "mean", "q3"] as const).forEach((statType) => {
        const values: number[] = [];
        Object.values(newTeamStats).forEach((stats) => {
          const v = stats[col]?.[statType];
          if (v !== undefined) values.push(v);
        });

        values.sort((a, b) => a - b);
        newColumnPercentiles[col][statType] = {
          p10: getPercentile(values, 10),
          p25: getPercentile(values, 25),
          p75: getPercentile(values, 75),
          p90: getPercentile(values, 90),
        };
      });
    });

    setColumnPercentiles(newColumnPercentiles);
  }, [forms]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="pt-20 px-0 md:px-6">
        {loading ? (
          <div className="text-orange-500">Loading data...</div>
        ) : (
          <div className="scrollbar-thin scrollbar-thumb-orange-500 scrollbar-track-gray-200 relative">

            <button
              className={`fixed top-18 right-2 z-50 p-3 bg-orange-500 text-white rounded-full shadow-lg hover:bg-orange-600 transition duration-500 cursor-pointer ${showControls ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
              onClick={() => setShowControls(true)}
            >
              <Settings2 size={24} />
            </button>

            <div
              className={`fixed top-18 right-0 ${showControls
                ? '-translate-x-2 opacity-100'
                : 'translate-x-full opacity-0 pointer-events-none'
                } bg-gray-100 px-5 flex flex-row gap-4 items-center shadow-md w-fit rounded-lg hover:bg-gray-200 transition duration-500 z-40`}
            >
              <TableTypeSelector view={tableType} setView={setTableType} />
              {tableType === 'Team' && (
                <TeamValueTypeSelector view={teamValueType} setView={setTeamValueType} />
              )}
              <button
                className="ml-2 p-1 text-gray-600 hover:text-gray-800 transition cursor-pointer"
                onClick={() => setShowControls(false)}
              >
                <EyeOff size={24} />
              </button>
            </div>

            <table className="table-auto border-collapse border border-gray-300 w-full text-sm md:text-base mt-18 ml-0">
              <thead className="sticky top-15">
                <tr className="bg-gray-200">
                  {tableType === "Raw"
                    ? columnOrder.map((col) => (
                      <th
                        key={col}
                        className="border border-gray-300 px-3 py-2 text-center whitespace-nowrap"
                      >
                        {formatHeader(col)}
                      </th>
                    ))
                    : numericColumns.map((col) => (
                      <th
                        key={col}
                        className="border border-gray-300 px-3 py-2 text-center whitespace-nowrap"
                      >
                        {formatHeader(col)}
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody>
                {tableType === "Raw"
                  ? forms.map((form, index) => (
                    <tr
                      key={form.id}
                      className={
                        (index + 1) % 3 === 0
                          ? "bg-gray-200 hover:bg-gray-300"
                          : "hover:bg-gray-100"
                      }
                    >
                      {columnOrder.map((col) => (
                        <td
                          key={col}
                          className="border border-gray-300 px-3 py-2"
                        >
                          {col === "commentText" ? (
                            <button
                              onClick={() => viewComment(form[col])}
                              className="px-2 py-1 bg-orange-500 text-white rounded hover:bg-orange-600 transition"
                            >
                              View
                            </button>
                          ) : typeof form[col] === "boolean" ? (
                            form[col] ? "Yes" : "No"
                          ) : (
                            form[col] ?? ""
                          )}
                        </td>
                      ))}
                    </tr>
                  ))
                  : Object.entries(teamStats).map(([teamNumber, stats], index) => {
                    const statObj = stats as TeamStats;

                    return (
                      <tr
                        key={teamNumber}
                        className={
                          (index + 1) % 3 === 0
                            ? "bg-gray-200 hover:bg-gray-300"
                            : "hover:bg-gray-100"
                        }
                      >
                        {numericColumns.map((col) => {
                          const value =
                            statObj[col][
                            teamValueType.toLowerCase() as keyof StatRecord
                            ];
                          const { p10, p25, p75, p90 } =
                            columnPercentiles[col][
                            teamValueType.toLowerCase() as keyof ColumnPercentiles[string]
                            ] ?? {
                              p10: 0,
                              p25: 0,
                              p75: Infinity,
                              p90: Infinity,
                            };

                          let className = "";
                          if (percentileColumns.includes(col)) {
                            if (value <= p10)
                              className = "text-red-700 font-bold";
                            else if (value <= p25)
                              className = "text-red-500";
                            else if (value >= p90)
                              className = "text-green-700 font-bold";
                            else if (value >= p75)
                              className = "text-green-500";
                          }

                          return (
                            <td
                              key={col}
                              className="border border-gray-300 px-3 py-2"
                            >
                              <span className={className}>{value}</span>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

function TableTypeSelector({
  view,
  setView,
}: {
  view: "Raw" | "Team";
  setView: (v: "Raw" | "Team") => void;
}) {
  return (
    <div className="my-4">
      <label
        htmlFor="table-type-select"
        className="mr-2 font-medium text-gray-700"
      >
        Table Type:
      </label>
      <select
        id="table-type-select"
        value={view}
        onChange={(e) => setView(e.target.value as "Raw" | "Team")}
        className="px-3 py-1 border-2 border-gray-300 rounded hover:shadow-xl hover:border-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer transition-shadow-border duration-250"
      >
        <option value="Raw">Raw</option>
        <option value="Team">Team</option>
      </select>
    </div>
  );
}

function TeamValueTypeSelector({
  view,
  setView,
}: {
  view: "Min" | "Max" | "Median" | "Mean" | "Q3";
  setView: (v: "Min" | "Max" | "Median" | "Mean" | "Q3") => void;
}) {
  return (
    <div className="my-4 ml-5">
      <label
        htmlFor="team-value-select"
        className="mr-2 font-medium text-gray-700"
      >
        Value Type:
      </label>
      <select
        id="team-value-select"
        value={view}
        onChange={(e) =>
          setView(e.target.value as "Min" | "Max" | "Median" | "Mean" | "Q3")
        }
        className="px-3 py-1 border-2 border-gray-300 rounded hover:shadow-xl hover:border-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer transition-shadow-border duration-250"
      >
        <option value="Min">Min</option>
        <option value="Median">Median</option>
        <option value="Mean">Mean</option>
        <option value="Q3">Q3</option>
        <option value="Max">Max</option>
      </select>
    </div>
  );
}
