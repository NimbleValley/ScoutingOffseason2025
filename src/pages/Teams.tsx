import { useEffect, useMemo, useState } from "react";
import { useScoutingStore } from "../app/localDataStore";
import Navbar from "../components/NavBar";
import HotReloadButton from "../components/HotReload";
import CustomSelect from "../components/Select";
import { SquarePlay } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import { numericColumns } from "../app/types";

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
    } = useScoutingStore();

    useEffect(() => {
        loadTeamImages();
        loadData();
    }, []);

    const imageUrl = teamImages[currentViewingTeam];
    const [selectedField, setSelectedField] = useState("totalPoints");

    // teamForms only computed when forms exist
    const teamForms = useMemo(() => {
        if (!forms || forms.length === 0) return [];
        return forms
            .filter(f => Number(f.teamNumber) === Number(currentViewingTeam))
            .sort((a, b) => (a.matchNumber ?? 0) - (b.matchNumber ?? 0));
    }, [forms, currentViewingTeam]);


    // Prepare data for line chart
    const chartData = useMemo(() => {
        console.log(teamForms)
        if (teamForms.length === 0) return [];
        return teamForms.map(f => ({
            match: f.matchNumber,
            value: Number(f[selectedField] ?? 0),
        }));
    }, [teamForms, selectedField]);

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
                            <img src={imageUrl} alt={`Team ${currentViewingTeam}`} className="w-40 h-40 object-contain mb-3" />
                        )
                        }

                        {!imageUrl && (
                            <div className="mt-16"></div>
                        )
                        }

                        {/* Team stats card */}
                        <div className="bg-white shadow-md rounded-xl p-6 space-y-4">
                            <h2 className="text-2xl font-bold text-gray-800">
                                Team {currentViewingTeam} - {teamInfo[currentViewingTeam].nickname ?? ''}
                            </h2>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {/* Rank */}
                                <div className="bg-gray-50 p-3 rounded-lg text-center">
                                    <p className="text-gray-500 text-sm">Rank</p>
                                    <p className="text-lg font-semibold">{tbaData?.rankings?.find(r => r.team_key === `frc${currentViewingTeam}`)?.rank ?? 'N/A'}</p>
                                </div>

                                {/* Wins / Losses */}
                                <div className="bg-gray-50 p-3 rounded-lg text-center">
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

                                {/* EPA */}
                                <div className="bg-gray-50 p-3 rounded-lg text-center">
                                    <p className="text-gray-500 text-sm">OPR</p>
                                    <p className="text-lg font-semibold">
                                        {Math.round((Number(tbaData?.oprs[`frc${currentViewingTeam}`]) ?? 0) * 10) / 10}
                                    </p>
                                </div>

                                {/* Q3 Points */}
                                <div className="bg-gray-50 p-3 rounded-lg text-center">
                                    <p className="text-gray-500 text-sm">Quartile 3 Points</p>
                                    <p className="text-lg font-semibold">
                                        {teamStats[currentViewingTeam]?.totalPoints?.q3 ?? 0}
                                    </p>
                                </div>

                                {/* Other stats (optional) */}
                                <div className="bg-gray-50 p-3 rounded-lg text-center">
                                    <p className="text-gray-500 text-sm">Auto Points</p>
                                    <p className="text-lg font-semibold">
                                        {teamStats[currentViewingTeam]?.autoPoints?.mean ?? 0 * 10}
                                    </p>
                                </div>

                                <div className="bg-gray-50 p-3 rounded-lg text-center">
                                    <p className="text-gray-500 text-sm">Tele Points</p>
                                    <p className="text-lg font-semibold">
                                        {teamStats[currentViewingTeam]?.telePoints?.mean ?? 0 * 10}
                                    </p>
                                </div>
                            </div>
                        </div>


                        {/* Line graph */}
                        <div className="mt-8 bg-white p-6 rounded-xl shadow-md">
                            <h3 className="text-xl font-bold mb-4">Consistency Graph</h3>
                            <div className="mb-4">
                                <CustomSelect view={selectedField} setView={setSelectedField} label={'Field: '} options={numericColumns.filter(c => c !== "teamNumber")}></CustomSelect>
                            </div>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="match" label={{ value: "Match", position: "insideBottom", offset: -5 }} />
                                    <YAxis />
                                    <Tooltip animationDuration={50} />
                                    <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>



                        {/* Comments Section */}
                        <div className="mt-8 bg-white p-6 rounded-xl shadow-md">
                            <h3 className="text-xl font-bold mb-4">Team Comments</h3>
                            <div className="max-h-64 overflow-y-auto space-y-3 border border-gray-200 rounded p-3">
                                {teamForms.length > 0 ? (
                                    teamForms.filter(f => f.commentText).map(f => (
                                        <div key={f.id} className="bg-gray-50 p-2 rounded">
                                            <span className="font-semibold text-orange-600">Match {f.matchNumber}:</span>{" "}
                                            <span className="text-gray-800">{f.commentText}</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-gray-500">No comments available for this team.</div>
                                )}
                            </div>
                        </div>



                        {/* Match Stats Table */}
                        <div className="mt-8 bg-white p-6 rounded-xl shadow-md">
                            <h3 className="text-xl font-bold mb-4">Match Stats</h3>
                            <div className="overflow-x-auto">
                                <table className="min-w-full border border-gray-200 table-auto">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="px-4 py-2 border font-medium text-left">Match #</th>
                                            {numericColumns.map((col) => (
                                                <th key={col} className="px-4 py-2 border font-medium text-left">
                                                    {col
                                                        .replace(/([A-Z])/g, " $1") // split camelCase
                                                        .replace(/^./, (str) => str.toUpperCase())} {/* Capitalize first letter */}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {teamForms.length > 0 ? (
                                            teamForms.map((f, idx) => (
                                                <tr
                                                    key={f.id}
                                                    className={idx % 2 === 0 ? "bg-gray-50 hover:bg-gray-100" : "hover:bg-gray-100"}
                                                >
                                                    <td className="px-4 py-2 border">{f.matchNumber}</td>
                                                    {numericColumns.map((col) => (
                                                        <td key={col} className="px-4 py-2 border text-center">
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










                    </div>
                )
                }
            </main >

            <HotReloadButton />
        </div >
    );
}