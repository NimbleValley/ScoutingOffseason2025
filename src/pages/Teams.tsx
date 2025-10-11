import { useEffect, useMemo, useState } from "react";
import { useScoutingStore } from "../app/localDataStore";
import Navbar from "../components/NavBar";
import HotReloadButton from "../components/HotReload";
import CustomSelect from "../components/Select";
import { SquarePlay } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import { numericColumns, type LiveDataNumberKeysWithOPR } from "../app/types";
import VerticalBubbleChart from "../components/PercentileBarChart";
import MultiCategoryBubbleChart from "../components/PercentileBarChart";
import TeamPercentileBarChart from "../components/PercentileBarChart";
import TeamPercentileBarChartVertical from "../components/PercentileBarChart";
import SettingsButton from "../components/SettingsButton";

export default function Teams() {

    const {
        forms,
        teamInfo,
        teamStats,
        teamImages,
        loadData,
        loadTeamImages,
        loading,
        currentViewingTeam,
        setCurrentViewingTeam,
        tbaData,
        aiOverviews,
        pitForms
    } = useScoutingStore();

    useEffect(() => {
        loadTeamImages();
        loadData();
    }, []);

    const imageUrl = teamImages[currentViewingTeam];
    const [selectedField, setSelectedField] = useState<LiveDataNumberKeysWithOPR>("total_points");

    const [activeTab, setActiveTab] = useState<"comments" | "pitScout">("comments");

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

    // teamForms only computed when forms exist
    const teamForms = useMemo(() => {
        console.log(forms)
        if (!forms || forms.length === 0) return [];
        return forms
            .filter(f => Number(f.team_number) === Number(currentViewingTeam))
            .sort((a, b) => (a.match_number ?? 0) - (b.match_number ?? 0));
    }, [forms, currentViewingTeam]);


    // Prepare data for line chart
    const chartData = useMemo(() => {
        if (teamForms.length === 0) return [];
        return teamForms.map(f => ({
            match: f.match_number,
            value: Number(f[selectedField] ?? 0),
        }));
    }, [teamForms, selectedField]);

    const getPitForm = useMemo(() => {
        return pitForms.find(p => Number(p.team_number) === Number(currentViewingTeam));
    }, [currentViewingTeam, pitForms]);

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <main className="pt-20 px-4 md:px-6">
                {loading || !forms.length ? (
                    <div className="text-orange-500 text-lg font-semibold">Loading data...</div>
                ) : (
                    <div className="max-w-3xl mx-auto">
                        {/* Team selector */}
                        <div className="mb-6 fixed left-5 top-21 bg-gray-100 px-4 py-2 rounded-lg shadow-md">
                            <CustomSelect
                                view={currentViewingTeam}
                                setView={setCurrentViewingTeam}
                                label="Team: "
                                options={Object.keys(teamStats).map(Number)}
                            />
                        </div>

                        {imageUrl && (
                            <img src={imageUrl} alt={`Team ${currentViewingTeam}`} className="w-40 h-40 object-contain mb-3 relative ml-auto" />
                        )
                        }

                        {!imageUrl && (
                            <div className="mt-16"></div>
                        )
                        }

                        {/* Team stats card */}
                        <div className="bg-white shadow-md rounded-xl p-6 space-y-4">
                            <h2 className="text-2xl font-bold text-gray-800">
                                Team {currentViewingTeam} - {teamInfo[currentViewingTeam]?.nickname ?? ''}
                            </h2>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {/* Rank */}
                                <div className="bg-gray-50 p-3 rounded-lg text-center shadow-md">
                                    <p className="text-gray-500 text-sm">Rank</p>
                                    <p className="text-lg font-semibold">{tbaData?.rankings?.find(r => r.team_key === `frc${currentViewingTeam}`)?.rank ?? 'N/A'}</p>
                                </div>

                                {/* Wins / Losses */}
                                <div className="bg-gray-50 p-3 rounded-lg text-center shadow-md">
                                    <p className="text-gray-500 text-sm">Record</p>
                                    <p className="text-lg font-semibold">
                                        {tbaData?.rankings?.find(r => r.team_key === `frc${currentViewingTeam}`)?.record?.wins ?? 0}-
                                        {tbaData?.rankings?.find(r => r.team_key === `frc${currentViewingTeam}`)?.record?.losses ?? 0}-
                                        {tbaData?.rankings?.find(r => r.team_key === `frc${currentViewingTeam}`)?.record?.ties ?? 0}
                                    </p>
                                </div>

                                {/* OPR }
                                <div className="bg-gray-50 p-3 rounded-lg text-center">
                                    <p className="text-gray-500 text-sm">EPA</p>
                                    <p className="text-lg font-semibold">
                                        {String(statboticsTeams.epa?.breakdown.total_points)}
                                    </p>
                                </div>*/}

                                {/* OPR */}
                                <div className="bg-gray-50 p-3 rounded-lg text-center shadow-md">
                                    <p className="text-gray-500 text-sm">OPR</p>
                                    <p className="text-lg font-semibold">
                                        {Math.round((Number(tbaData?.oprs[`frc${currentViewingTeam}`]) ?? 0) * 10) / 10}
                                    </p>
                                </div>

                                {/* Q3 Points */}
                                <div className="bg-gray-50 p-3 rounded-lg text-center shadow-md">
                                    <p className="text-gray-500 text-sm">Quartile 3 Points</p>
                                    <p className="text-lg font-semibold">
                                        {teamStats[currentViewingTeam]['total_points'].q3 ?? 0}
                                    </p>
                                </div>

                                {/* Other stats (optional) */}
                                <div className="bg-gray-50 p-3 rounded-lg text-center shadow-md">
                                    <p className="text-gray-500 text-sm">Auto Points</p>
                                    <p className="text-lg font-semibold">
                                        {teamStats[currentViewingTeam]?.auto_points?.q3 ?? 0 * 10}
                                    </p>
                                </div>

                                <div className="bg-gray-50 p-3 rounded-lg text-center shadow-md">
                                    <p className="text-gray-500 text-sm">Tele Points</p>
                                    <p className="text-lg font-semibold">
                                        {teamStats[currentViewingTeam]?.tele_points?.q3 ?? 0 * 10}
                                    </p>
                                </div>

                                <div className="bg-gray-50 p-3 rounded-lg text-center shadow-md">
                                    <p className="text-gray-500 text-sm">Endgame Points</p>
                                    <p className="text-lg font-semibold">
                                        {teamStats[currentViewingTeam]?.endgame_points?.q3 ?? 0 * 10}
                                    </p>
                                </div>

                                <div className="bg-gray-50 p-3 rounded-lg text-center shadow-md">
                                    <p className="text-gray-500 text-sm">Total Gamepieces</p>
                                    <p className="text-lg font-semibold">
                                        {teamStats[currentViewingTeam]?.total_gamepieces?.q3 ?? 0 * 10}
                                    </p>
                                </div>

                                <div className="bg-gray-50 p-3 rounded-lg text-center shadow-md">
                                    <p className="text-gray-500 text-sm">Max Algae Net</p>
                                    <p className="text-lg font-semibold">
                                        {teamStats[currentViewingTeam]?.tele_made_net?.max ?? 0 * 10}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {aiOverviews[currentViewingTeam] &&
                            <div className="mt-8 bg-white p-6 rounded-xl shadow-md">
                                <h3 className="text-xl font-bold mb-4">CoScout Analysis</h3>
                                <h5 className="text-md mb-4">{aiOverviews[currentViewingTeam]}</h5>
                            </div>
                        }

                        {/* Line graph */}
                        <div className="mt-8 bg-white p-6 rounded-xl shadow-md">
                            <h3 className="text-xl font-bold mb-4">Consistency Graph</h3>
                            <div className="mb-4">
                                <CustomSelect view={selectedField} setView={setSelectedField} label={'Field: '} options={numericColumns.filter(c => c !== "team_number")}></CustomSelect>
                            </div>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="match" label={{ value: "Match", position: "insideBottom", offset: -5 }} />
                                    <YAxis />
                                    <Tooltip animationDuration={50} labelFormatter={(value) => `Match ${value}`} />
                                    <Line type="monotone" dataKey="value" stroke="#d8aa84ff" strokeWidth={2} animationDuration={750} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>



                        {/* Comments + Pit Scout Unified Container */}
                        <div className="mt-8 bg-white p-6 rounded-xl shadow-md">
                            {/* Pills Tabs */}
                            <div className="flex gap-2 mb-4">
                                <button
                                    onClick={() => setActiveTab("comments")}
                                    className={`px-4 py-2 rounded-full font-medium transition cursor-pointer ${activeTab === "comments"
                                        ? "bg-orange-600 text-white shadow-sm"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                        }`}
                                >
                                    Comments
                                </button>
                                <button
                                    onClick={() => setActiveTab("pitScout")}
                                    className={`px-4 py-2 rounded-full font-medium transition cursor-pointer ${activeTab === "pitScout"
                                        ? "bg-orange-600 text-white shadow-sm"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                        }`}
                                >
                                    Pit Scouting
                                </button>
                            </div>

                            {/* Content */}
                            {activeTab === "comments" && (
                                <div>
                                    <div className="max-h-64 overflow-y-auto space-y-3 border border-gray-200 rounded p-3">
                                        {teamForms.length > 0 ? (
                                            teamForms.filter(f => f.comments).map(f => (
                                                <div key={f.id} className="bg-gray-50 p-2 rounded">
                                                    <span className="font-semibold text-orange-600">Match {f.match_number}:</span>{" "}
                                                    <span className="text-gray-800">{f.comments}</span>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-gray-500">No comments available for this team.</div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === "pitScout" && (
                                getPitForm ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-gray-50 p-3 rounded-lg">
                                            <p className="text-gray-500 text-sm">Driver Experience</p>
                                            <p className="text-lg font-medium text-gray-800">
                                                {getPitForm.driver_experience || "N/A"}
                                            </p>
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded-lg">
                                            <p className="text-gray-500 text-sm">Autos</p>
                                            <p className="text-lg font-medium text-gray-800">
                                                {getPitForm.auto_description || "N/A"}
                                            </p>
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded-lg">
                                            <p className="text-gray-500 text-sm">Algae Details</p>
                                            <p className="text-lg font-medium text-gray-800">
                                                {getPitForm.algae_description || "N/A"}
                                            </p>
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded-lg">
                                            <p className="text-gray-500 text-sm">Climb Details</p>
                                            <p className="text-lg font-medium text-gray-800">
                                                {getPitForm.endgame_description || "N/A"}
                                            </p>
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded-lg">
                                            <p className="text-gray-500 text-sm">Final Comments</p>
                                            <p className="text-lg font-medium text-gray-800">
                                                {getPitForm.comments || "N/A"}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-gray-500">No pit scout data for this team.</p>
                                )
                            )}
                        </div>



                        {/* Match Stats Table */}
                        <div className="mt-8 bg-white p-6 rounded-xl shadow-md">
                            <h3 className="text-xl font-bold mb-4">Match Stats</h3>
                            <div className="overflow-x-auto">
                                <table className="min-w-full border border-gray-600 table-auto rounded-md">
                                    <thead className="bg-gray-100 shadow-md">
                                        <tr>
                                            <th className="px-2 py-1 border-y border-gray-600 font-medium text-center">Match #</th>
                                            {numericColumns.map((col) => (
                                                <th key={col} className="px-4 py-0 border-y border-gray-600 font-medium text-sm min-w-20 text-center">
                                                    {formatHeader(col)} {/* Capitalize first letter */}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {teamForms.length > 0 ? (
                                            teamForms.map((f, idx) => (
                                                <tr
                                                    key={f.id}
                                                    className={idx % 3 === 2 ? "bg-gray-100 hover:bg-gray-200" : "hover:bg-gray-100"}
                                                >
                                                    <td className="px-4 py-2 border-y border-gray-600">{f.match_number}</td>
                                                    {numericColumns.map((col) => (
                                                        <td key={col} className="px-4 py-2 border-y border-gray-600 text-center">
                                                            {f[col] ?? 0}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td
                                                    className="px-4 py-2 border text-center"
                                                    colSpan={numericColumns.length + 1}
                                                >
                                                    No match data available for this team.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>




                        <div className="mt-8 max-w-3xl mx-auto">
                            <h3 className="text-xl font-bold mb-4">Match Schedule</h3>
                            <div className="space-y-2">
                                {tbaData?.matches
                                    .filter(
                                        (match) =>
                                            match.alliances.red.team_keys.includes(`frc${currentViewingTeam}`) ||
                                            match.alliances.blue.team_keys.includes(`frc${currentViewingTeam}`)
                                    )
                                    .sort((a, b) => {
                                        const playoffLevels = ["qf", "sf", "f"];
                                        const aIsPlayoff = playoffLevels.includes(a.comp_level);
                                        const bIsPlayoff = playoffLevels.includes(b.comp_level);
                                        if (aIsPlayoff && !bIsPlayoff) return 1;
                                        if (!aIsPlayoff && bIsPlayoff) return -1;
                                        return a.match_number - b.match_number;
                                    })
                                    .map((match) => {
                                        const isRed = match.alliances.red.team_keys.includes(`frc${currentViewingTeam}`);
                                        const ourAlliance = isRed ? match.alliances.red : match.alliances.blue;
                                        const opponentAlliance = isRed ? match.alliances.blue : match.alliances.red;

                                        const ourScore = ourAlliance.score;
                                        const opponentScore = opponentAlliance.score;
                                        const winner = match.winning_alliance
                                            ? match.winning_alliance === "red"
                                                ? "Red"
                                                : match.winning_alliance === "blue"
                                                    ? "Blue"
                                                    : "Tie"
                                            : null;

                                        const playoffLabel = ["qf", "sf", "f"].includes(match.comp_level)
                                            ? match.comp_level.toUpperCase()
                                            : null;

                                        return (
                                            <div
                                                key={match.key}
                                                className={`flex flex-row sm:flex-row justify-between items-center sm:items-center px-3 py-1 rounded-lg shadow-sm 
                        ${isRed ? "bg-red-50" : "bg-blue-50"}`}
                                            >
                                                {/* Video icon */}
                                                <button
                                                    className="flex flex-row gap-3 p-3 cursor-pointer rounded-md hover:bg-gray-300 transition-bg duration-150"
                                                    onClick={() => {
                                                        if (match.videos?.length > 0) {
                                                            const video = match.videos[0];
                                                            let url = "";

                                                            if (video.type === "youtube") {
                                                                url = `https://www.youtube.com/watch?v=${video.key}`;
                                                            } else if (video.type === "tba") {
                                                                url = `https://www.thebluealliance.com/match/${video.key}`;
                                                            }

                                                            if (url) window.open(url, "_blank");
                                                        }
                                                    }}
                                                >                                                    {match.videos?.length > 0 &&
                                                    <div>
                                                        <SquarePlay color="gray" size={24}></SquarePlay>
                                                    </div>
                                                    }

                                                    {/* Match Number + Playoff Label */}
                                                    <div className="font-semibold mb-1 sm:mb-0">
                                                        {playoffLabel ? 'Match' : 'Qual'} {match.match_number}{" "}
                                                        {playoffLabel && (
                                                            <span className="ml-2 text-sm text-red-600 font-bold">
                                                                [{playoffLabel}]
                                                            </span>
                                                        )}
                                                    </div>
                                                </button>

                                                {/* Opponents */}
                                                <div className="text-gray-700 mb-1 sm:mb-0">
                                                    <div className={`${isRed ? 'bg-red-200' : 'bg-blue-200'} px-3 flex flex-row  justify-around rounded-md font-bold mb-1`}>
                                                        {ourAlliance.team_keys.map((k: string) => k.replace("frc", "")).join(", ")}
                                                    </div>
                                                    <div className={`${!isRed ? 'bg-red-200' : 'bg-blue-200'} px-3 flex flex-row  justify-around rounded-md`}>
                                                        {opponentAlliance.team_keys.map((k: string) => k.replace("frc", "")).join(", ")}
                                                    </div>
                                                </div>

                                                {/* Score / Start Time */}
                                                <div className="text-right mt-1 sm:mt-0">
                                                    {ourScore != null && opponentScore != null ? (
                                                        <div>
                                                            <div className="font-bold text-lg">{ourScore} - {opponentScore}</div>
                                                            {winner && (
                                                                <div className={`text-sm font-semibold ${winner === (isRed ? "Red" : "Blue")
                                                                    ? "text-green-600"
                                                                    : "text-red-600"
                                                                    }`}>
                                                                    {winner === (isRed ? "Red" : "Blue") ? "Win" : "Loss"}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : match.time ? (
                                                        <div className="text-sm text-gray-500">
                                                            {new Date(match.time * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                                        </div>
                                                    ) : (
                                                        <div className="text-sm text-gray-400">TBD</div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>


                        <TeamPercentileBarChartVertical categories={["total_coral", "auto_points", "tele_points", "endgame_points", "total_algae", "total_gamepieces"]} />



                        <div className="mb-30"></div>




                    </div>
                )
                }
            </main >

            <HotReloadButton />
            <SettingsButton />
        </div >
    );
}