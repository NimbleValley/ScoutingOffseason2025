import { useEffect, useState } from "react";
import Navbar from "../components/NavBar";
import { EyeOff, Highlighter, Settings2, ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { useScoutingStore } from "../app/localDataStore";
import { type StatRecord, type TeamStats, type ColumnPercentiles, type LiveDataRowWithOPR, numericColumns, type LiveDataKeyWithOPR, columnOrder } from "../app/types";
import HotReloadButton from "../components/HotReload";
import SettingsButton from "../components/SettingsButton";
import type { Database } from "../supabasetypes";
import TeamCommentsModal from "../components/TeamCommentModal";

type LiveDataRow = Database["public"]["Tables"]["Live Data"]["Row"];

// Columns that will get percentile-based highlighting
const percentileColumns: LiveDataKeyWithOPR[] = [
    "opr",
    "total_points",
    "auto_points",
    "tele_points",
    "endgame_points",
    "total_coral",
    "total_algae",
    "total_gamepieces",
    "tele_made_net",
];

// Utility to convert camelCase to Normal Case
const formatHeader = (str: string) => {
    // Replace underscores with spaces
    let result = str.replace(/_/g, " ");
    // Add space before uppercase letters (optional, in case of camelCase too)
    result = result.replace(/([A-Z])/g, " $1");
    // Capitalize first letter of the string
    result = result.charAt(0).toUpperCase() + result.slice(1);
    // Replace multiple spaces with a single space
    return result.replace(/\s+/g, " ").trim();
};

const viewComment = (comment: string) => {
    alert(comment || "No comment");
};

const VALUE_TYPE_KEY = 'tableTeamValueType';

export default function Tables() {

    const { forms, teamStats, loading, columnPercentiles, loadData, teamInfo } = useScoutingStore();

    useEffect(() => {
        loadData(); // Only fetches on first load
    }, []);

    const [isCommentModalOpen, setIsCommentModalOpen] = useState<boolean>(false);
    const [selectedTeamNumber, setSelectedTeamNumber] = useState<number>(-1);

    const [tableType, setTableType] = useState<"Raw" | "Team">("Team");
    const [teamValueType, setTeamValueType] = useState<
        "Min" | "Max" | "Median" | "Mean" | "Q3"
    >(sessionStorage.getItem(VALUE_TYPE_KEY) as "Min" | "Max" | "Median" | "Mean" | "Q3" ?? "Median");

    const [showHighlight, setShowHighlight] = useState<boolean>(true);
    const [showControls, setShowControls] = useState<boolean>(true);
    const [rowHighlightTeam, setRowHighlightTeam] = useState<number>(-1);

    const [selectedTeam, setSelectedTeam] = useState<number>(-1);

    const [sortConfig, setSortConfig] = useState<{ column: string | null; direction: 'asc' | 'desc' | null }>({
        column: null,
        direction: null,
    });

    useEffect(() => {
        sessionStorage.setItem(VALUE_TYPE_KEY, teamValueType)
    }, [teamValueType]);

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

    // Get sort icon for Raw table
    const getSortIcon = (columnKey: string) => {
        if (sortConfig.column !== columnKey) {
            return <ArrowUpDown size={14} className="inline ml-1 text-gray-600" />;
        }
        if (sortConfig.direction === 'desc') {
            return <ArrowDown size={14} className="inline ml-1 text-orange-600" />;
        }
        return <ArrowUp size={14} className="inline ml-1 text-orange-600" />;
    };

    // Sort helper
    function applyRawSorting<T extends Record<string, any>>(rows: T[], config: typeof sortConfig): T[] {
        if (!config.column || !config.direction) return rows;

        return [...rows].sort((a, b) => {
            let valA = a[config.column ?? 0] ?? 0;
            let valB = b[config.column ?? 0] ?? 0;

            // Force numeric sort for teamNumber and matchNumber
            if (config.column === "team_number" || config.column === "match_number") {
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
            <TeamCommentsModal
                isOpen={isCommentModalOpen}
                onClose={() => setIsCommentModalOpen(false)}
                forms={forms}
                teamNumber={selectedTeamNumber}
                teamInfo={teamInfo}
            />
            <main className="pt-20 px-0 md:px-6 pr-10">
                {loading ? (
                    <div className="text-orange-500 m-15 text-2xl font-bold animate-bounce">Loading data...</div>
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
                            {tableType === 'Raw' && (
                                <TeamNumberSelector view={selectedTeam} setView={setSelectedTeam} teamStats={teamStats} />
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

                        <table className={`table-auto border-collapse w-full text-sm md:text-base mt-18 ml-0 mb-15 ${tableType === "Raw" ? "shadow-lg rounded-lg overflow-hidden" : "border border-gray-300"}`}>
                            <thead className="sticky top-0 transition-top duration-250">
                                <tr className={tableType === "Raw" ? "bg-gradient-to-r from-orange-50 to-orange-100" : "bg-gray-200 shadow-lg"}>
                                    {(tableType === "Raw" ? columnOrder.filter((c) => c != 'opr') : numericColumns).map((col) => (
                                        <th
                                            key={col}
                                            onClick={() => { handleSort(col); }}
                                            className={`${tableType === "Raw"
                                                ? "border-b-2 border-orange-300 px-3 py-2 font-semibold text-gray-900"
                                                : "border-t-1 border-b-1 border-gray-300 px-3 py-2"} text-center whitespace-nowrap cursor-pointer select-none hover:bg-orange-200 transition duration-250 ${sortConfig.column === col ? (tableType === "Raw" ? 'bg-orange-300' : 'bg-orange-400') : ''}`}
                                        >
                                            <div className="flex items-center justify-center gap-1">
                                                {formatHeader(col)}
                                                {tableType === "Raw" ? (
                                                    getSortIcon(col)
                                                ) : (
                                                    sortConfig.column === col && (
                                                        <span className="text-xs font-bold text-orange-600">
                                                            {sortConfig.direction === "desc" ? "▼" : sortConfig.direction === "asc" ? "▲" : ""}
                                                        </span>
                                                    )
                                                )}
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {tableType === "Raw"
                                    ? applyRawSorting(forms, sortConfig).filter((f) => selectedTeam == -1 || f.team_number == selectedTeam).map((form, index) => (
                                        <tr
                                            key={form.id}
                                            className={
                                                index % 3 !== 0
                                                    ? "bg-white hover:bg-gray-50 transition-colors"
                                                    : "bg-gray-50 hover:bg-gray-100 transition-colors"
                                            }
                                        >
                                            {columnOrder.filter((c) => c != 'opr').map((col) => (
                                                <td
                                                    key={col}
                                                    className="border-y border-gray-200 px-3 py-2 text-center"
                                                >
                                                    {col === "comments" ? (
                                                        <button
                                                            onClick={() => viewComment(form[col])}
                                                            className="px-3 py-1.5 bg-orange-500 text-white text-sm font-medium rounded-md hover:bg-orange-600 transition shadow-sm"
                                                        >
                                                            View
                                                        </button>
                                                    ) : typeof form[col] === "boolean" ? (
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${form[col] ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                                            {form[col] ? "Yes" : "No"}
                                                        </span>
                                                    ) : (
                                                        col == 'match_number' ? (
                                                            <span className="font-medium text-gray-800">
                                                                {form.match_type == 'match' ? form[col] ?? "" : form.match_type.toUpperCase() ?? ""}
                                                            </span>
                                                        ) :
                                                            <span className="text-gray-700">{form[col] ?? ""}</span>

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
                                                    `${(index + 1) % 3 === 0 && rowHighlightTeam !== statObj['team_number'][teamValueType.toLowerCase() as keyof StatRecord]
                                                        ? "bg-gray-200 hover:bg-gray-300"
                                                        : "hover:bg-gray-100"} ${rowHighlightTeam == statObj['team_number'][teamValueType.toLowerCase() as keyof StatRecord] ? "bg-orange-300 hover:bg-orange-400" : ""} transition duration-250`
                                                }
                                                onClick={
                                                    () => setRowHighlightTeam(prev => prev === statObj['team_number'][teamValueType.toLowerCase() as keyof StatRecord] ? -1 : statObj['team_number'][teamValueType.toLowerCase() as keyof StatRecord])
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
                                                            className = className.concat(" bg-red-500/95 font-bold shadow-sm ");
                                                        else if (value <= p25)
                                                            className = className.concat(" bg-red-200/95 shadow-sm ");
                                                        else if (value >= p90)
                                                            className = className.concat(" bg-blue-300/95 font-bold shadow-sm ");
                                                        else if (value >= p75)
                                                            className = className.concat(" bg-green-200/95 shadow-sm ");
                                                    }

                                                    return (
                                                        <td
                                                            key={col}
                                                            className={`cursor-${col == 'team_number' ? 'pointer' : 'arrow'} ${col == 'team_number' ? 'hover:font-bold' : ''} transition border-t-1 border-b-1 border-y-gray-500 px-3 py-3 text-center ${sortConfig.column === col ? 'border-x-orange-400 border-x-3' : ''}`}
                                                            onClick={col == 'team_number' ? () => { setSelectedTeamNumber(value); setIsCommentModalOpen(true); } : () => { }}
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

function TeamNumberSelector({
    view,
    setView,
    teamStats
}: {
    view: number;
    setView: (v: number) => void;
    teamStats: Record<any, TeamStats>[]
}) {
    return (
        <div className="my-0 ml-2">
            <label
                htmlFor="team-value-select"
                className="mr-2 font-medium text-gray-700"
            >
                Team:
            </label>
            <select
                id="team-value-select"
                value={view}
                onChange={(e) =>
                    setView(parseInt(e.target.value))
                }
                className="px-3 py-1 border-2 border-gray-300 rounded hover:shadow-xl hover:border-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer transition-shadow-border duration-250"
            >
                <option value={-1}>ANY</option>
                {
                    Object.keys(teamStats).map((key) => {
                        return <option value={teamStats[key].team_number.max}>{teamStats[key].team_number.max}</option>
                    })
                }
            </select>
        </div>
    );
}

function capitalizeFirstLetter(str: string) {
    if (typeof str !== 'string' || str.length === 0) {
        return str; // Handle non-string or empty input
    }
    return str.charAt(0).toUpperCase() + str.slice(1);
}