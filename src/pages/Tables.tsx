import { useEffect, useState } from "react";
import Navbar from "../components/NavBar";
import { EyeOff, Highlighter, Settings2 } from "lucide-react";
import { useScoutingStore } from "../app/localDataStore";
import { type StatRecord, type TeamStats, type ColumnPercentiles, numericColumns } from "../app/types";
import HotReloadButton from "../components/HotReload";
import SettingsButton from "../components/SettingsButton";

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

// Columns that will get percentile-based highlighting
const percentileColumns = [
    "opr",
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

const VALUE_TYPE_KEY = 'tableTeamValueType';

export default function Tables() {

    const { forms, teamStats, loading, columnPercentiles, loadData } = useScoutingStore();

    useEffect(() => {
        loadData(); // Only fetches on first load
    }, []);

    const [tableType, setTableType] = useState<"Raw" | "Team">("Team");
    const [teamValueType, setTeamValueType] = useState<
        "Min" | "Max" | "Median" | "Mean" | "Q3"
    >(sessionStorage.getItem(VALUE_TYPE_KEY) as "Min" | "Max" | "Median" | "Mean" | "Q3" ?? "Median");

    const [showHighlight, setShowHighlight] = useState<Boolean>(true);
    const [showControls, setShowControls] = useState<Boolean>(true);
    const [rowHighlightTeam, setRowHighlightTeam] = useState<Number>(-1);

    const [sortConfig, setSortConfig] = useState<{ column: string | null; direction: 'asc' | 'desc' | null }>({
        column: null,
        direction: null,
    });

    useEffect(() => {
        sessionStorage.setItem(VALUE_TYPE_KEY, teamValueType)
    }, [teamValueType])

    const handleSort = (column: string) => {
        setSortConfig((prev) => {
            if (prev.column === column) {
                if (prev.direction === 'desc') return { column, direction: 'asc' };
                if (prev.direction === 'asc') return { column: null, direction: null }; // reset
                return { column, direction: 'desc' };
            }
            return { column, direction: 'desc' };
        });
    };

    // Sort helper
    function applyRawSorting<T extends Record<string, any>>(rows: T[], config: typeof sortConfig): T[] {
        if (config.column || !config.direction) return rows;

        return [...rows].sort((a, b) => {
            let valA = a[config.column ?? 0] ?? 0;
            let valB = b[config.column ?? 0] ?? 0;

            // Force numeric sort for teamNumber and matchNumber
            if (config.column === "teamNumber" || config.column === "matchNumber") {
                valA = Number(valA);
                valB = Number(valB);
            }

            if (typeof valA === "number" && typeof valB === "number" && !isNaN(valA) && !isNaN(valB)) {
                return config.direction === "asc" ? valA - valB : valB - valA;
            }

            // Fallback for strings
            return config.direction === "asc"
                ? String(valA).localeCompare(String(valB))
                : String(valB).localeCompare(String(valA));
        });
    }

    function applyTeamSorting<T extends Record<string, any>>(rows: T[], config: typeof sortConfig, valueType: "min" | "max" | "median" | "mean" | "q3"): T[] {
        if (!config.column || !config.direction) return rows;

        return [...rows].sort((a, b) => {
            const valA = a.stats[config.column ?? 0][valueType] ?? 0;
            const valB = b.stats[config.column ?? 0][valueType] ?? 0;

            if (typeof valA === "number" && typeof valB === "number") {
                return config.direction === "asc" ? valA - valB : valB - valA;
            }
            // Fallback for strings
            return config.direction === "asc"
                ? String(valA).localeCompare(String(valB))
                : String(valB).localeCompare(String(valA));
        });
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <main className="pt-20 px-0 md:px-6 pr-10">
                {loading ? (
                    <div className="text-orange-500">Loading data...</div>
                ) : (
                    <div className="scrollbar-thin scrollbar-thumb-orange-500 scrollbar-track-gray-200 relative ">

                        <button
                            className={`fixed top-22 right-2 z-50 p-3 bg-orange-500 text-white rounded-full shadow-lg hover:bg-orange-600 transition duration-500 cursor-pointer ${showControls ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                            onClick={() => setShowControls(true)}
                        >
                            <Settings2 size={24} />
                        </button>

                        <div
                            className={`fixed top-18 right-0 ${showControls
                                ? '-translate-x-2 opacity-100'
                                : 'translate-x-full opacity-0 pointer-events-none'
                                } bg-gray-100 py-1.5 px-5 flex flex-row gap-4 items-center shadow-md w-fit rounded-lg hover:bg-gray-200 transition duration-500 z-40`}
                        >
                            <TableTypeSelector view={tableType} setView={setTableType} />
                            {tableType === 'Team' && (
                                <TeamValueTypeSelector view={teamValueType} setView={setTeamValueType} />
                            )}
                            <button
                                className="ml-0 p-1 text-gray-600 hover:text-gray-800 transition cursor-pointer"
                                onClick={() => setShowHighlight(prev => !prev)}
                            >
                                <Highlighter size={24} color={showHighlight ? 'darkorange' : 'currentColor'} />
                            </button>
                            <button
                                className="ml-0 p-1 text-gray-600 hover:text-gray-800 transition cursor-pointer"
                                onClick={() => setShowControls(false)}
                            >
                                <EyeOff size={24} />
                            </button>
                        </div>

                        <table className="table-auto border-collapse border border-gray-300 w-full text-sm md:text-base mt-18 ml-0 mb-15">
                            <thead className="sticky top-15 transition-top duration-250">
                                <tr className="bg-gray-200 shadow-lg ">
                                    {(tableType === "Raw" ? columnOrder : numericColumns).map((col) => (
                                        <th
                                            key={col}
                                            onClick={() => {  handleSort(col); }}
                                            className={` border-t-1 border-b-1 border-gray-300 px-3 py-2 text-center whitespace-nowrap cursor-pointer select-none hover:bg-gray-300 transition duration-250 ${sortConfig.column === col ? 'bg-orange-400' : ''}`}
                                        >
                                            {formatHeader(col)}
                                            {sortConfig.column === col && (
                                                <span className="ml-1 text-xs">
                                                    {sortConfig.direction === "desc" ? "▼" : sortConfig.direction === "asc" ? "▲" : ""}
                                                </span>
                                            )}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {tableType === "Raw"
                                    ? applyRawSorting(forms, sortConfig).map((form, index) => (
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
                                    : applyTeamSorting(
                                        Object.entries(teamStats).map(([teamNumber, stats]) => ({ teamNumber, stats })),
                                        sortConfig,
                                        teamValueType.toLowerCase() as keyof StatRecord
                                    ).map(({ teamNumber, stats }, index) => {
                                        const statObj = stats as TeamStats;

                                        return (
                                            <tr
                                                key={teamNumber}
                                                className={
                                                    `${(index + 1) % 3 === 0 && rowHighlightTeam !== statObj['teamNumber'][teamValueType.toLowerCase() as keyof StatRecord]
                                                        ? "bg-gray-200 hover:bg-gray-300"
                                                        : "hover:bg-gray-100"} ${rowHighlightTeam == statObj['teamNumber'][teamValueType.toLowerCase() as keyof StatRecord] ? "bg-orange-300 hover:bg-orange-400" : ""} transition duration-250`
                                                }
                                                onClick={
                                                    () => setRowHighlightTeam(prev => prev === statObj['teamNumber'][teamValueType.toLowerCase() as keyof StatRecord] ? -1 : statObj['teamNumber'][teamValueType.toLowerCase() as keyof StatRecord])
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

                                                    let className = ` rounded-md px-4 py-1 transition duration-250 `;
                                                    if (percentileColumns.includes(col) && showHighlight) {
                                                        if (value <= p10)
                                                            className = className.concat(" bg-red-500 font-bold shadow-md ");
                                                        else if (value <= p25)
                                                            className = className.concat(" bg-red-200 shadow-md ");
                                                        else if (value >= p90)
                                                            className = className.concat(" bg-blue-300 font-bold shadow-md ");
                                                        else if (value >= p75)
                                                            className = className.concat(" bg-green-200 shadow-md ");
                                                    }

                                                    return (
                                                        <td
                                                            key={col}
                                                            className={`border-t-1 border-b-1 border-y-gray-500 px-3 py-2 text-center ${sortConfig.column === col ? 'border-x-orange-400 border-x-3' : ''}`}
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

                <HotReloadButton />
                <SettingsButton />

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
        <div className="my-0">
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
        <div className="my-0 ml-2">
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
                <option value="Max">Max</option>
                <option value="Q3">Q3</option>
                <option value="Median">Median</option>
                <option value="Mean">Mean</option>
                <option value="Min">Min</option>
            </select>
        </div>
    );
}
