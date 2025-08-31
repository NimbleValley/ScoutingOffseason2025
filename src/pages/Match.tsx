import React, { useEffect, useState } from "react";
import { useScoutingStore } from "../app/localDataStore";
import HotReloadButton from "../components/HotReload";
import Navbar from "../components/NavBar";
import SettingsButton from "../components/SettingsButton";
import { BarChart, VideoIcon } from "lucide-react";
import { ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar } from "recharts";
import TeamPercentileBarChartHorizontal from "../components/HorizontalMatchBarChart";
import TeamPercentileBarChartHorizontalStacked from "../components/HorizontalMatchBarChart";

interface Match {
    key: string;
    comp_level: string;
    match_number: number;
    alliances: {
        red: { team_keys: string[]; score: number | null };
        blue: { team_keys: string[]; score: number | null };
    };
    time?: number;
    videos?: { type: string; key: string }[];
}

export default function Match() {
    const { loadData, tbaData, eventName, aiMatches, forms } = useScoutingStore();
    const [matches, setMatches] = useState<Match[]>([]);
    const [expanded, setExpanded] = useState<string | null>(null);
    const [loadingMatches, setLoadingMatches] = useState(false);

    // Build quick lookup for team ranks if available
    const teamRanks: Record<string, number> = {};
    if (tbaData?.rankings?.rankings) {
        tbaData.rankings.rankings.forEach((r: any) => {
            teamRanks[`frc${r.team_key}`] = r.rank;
        });
    }

    useEffect(() => {
        if (!tbaData) {
            loadData();
            return;
        }
        if (tbaData.matches) {
            setLoadingMatches(true);
            const sorted = [...tbaData.matches].sort((a, b) => {
                const levels = ["qm", "ef", "qf", "sf", "f"];
                const la = levels.indexOf(a.comp_level);
                const lb = levels.indexOf(b.comp_level);
                if (la !== lb) return la - lb;
                return a.match_number - b.match_number;
            });
            setMatches(sorted);
            setLoadingMatches(false);
        }
    }, [tbaData, loadData]);

    return (
        <div className="min-h-screen bg-gray-50 p-2">
            <Navbar />
            <main className="pt-20 px-2 md:px-6 flex flex-col items-center">
                <h2 className="text-xl font-semibold mb-3">
                    Matches for Event: {eventName}
                </h2>

                {/* Matches */}
                {loadingMatches ? (
                    <div className="text-orange-500 text-center">Loading matches...</div>
                ) : (
                    <div className="flex flex-col gap-2">
                        {matches.map((match) => {
                            const { red, blue } = match.alliances;
                            const winner =
                                red.score != null && blue.score != null
                                    ? red.score > blue.score
                                        ? "red"
                                        : blue.score > red.score
                                            ? "blue"
                                            : "tie"
                                    : null;
                            const isExpanded = expanded === match.key;

                            return (
                                <div
                                    key={match.key}
                                    className="w-full max-w-xl ml-auto mr-auto p-3 rounded-lg shadow-sm bg-white border-2 border-gray-200 hover:border-gray-500 h-auto transition"

                                >

                                    <button className="w-full transition cursor-pointer" onClick={() => setExpanded(isExpanded ? null : match.key)}>

                                        {/* Alliances + Score */}
                                        <div className="flex flex-row items-center justify-between mt-1">


                                            {/* Red */}
                                            <div
                                                className={`flex flex-col items-end text-md ${winner === "red" ? "text-red-500 font-bold" : "text-red-900 font-regular"
                                                    }`}
                                            >
                                                {red.team_keys.map((t) => {
                                                    const tn = t.replace("frc", "");
                                                    return (
                                                        <div key={t} className="flex gap-1">
                                                            <span>{tn}</span>
                                                            {teamRanks[t] && (
                                                                <span className="text-gray-400">#{teamRanks[t]}</span>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {/* Score */}
                                            <div className="mx-3 flex flex-col items-center font-bold justify-center gap-2">
                                                <div className="font-medium">
                                                    {match.comp_level.toUpperCase()} {match.match_number}
                                                </div>
                                                {red.score != null && blue.score != null ? (
                                                    <>
                                                        <div
                                                            className={`px-2 py-0.5 rounded text-xl ${winner === "red"
                                                                ? "bg-red-100 text-red-700"
                                                                : winner === "blue"
                                                                    ? "bg-blue-100 text-blue-700"
                                                                    : "bg-gray-100"
                                                                }`}
                                                        >
                                                            {red.score} - {blue.score}
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="text-gray-400">Upcoming</div>
                                                )}
                                            </div>

                                            {/* Blue */}
                                            <div
                                                className={`flex flex-col items-start text-md ${winner === "blue" ? "text-blue-500 font-bold" : "text-blue-900 font-regular"
                                                    }`}
                                            >
                                                {blue.team_keys.map((t) => {
                                                    const tn = t.replace("frc", "");
                                                    return (
                                                        <div key={t} className="flex gap-1">
                                                            <span>{tn}</span>
                                                            {teamRanks[t] && (
                                                                <span className="text-gray-400">#{teamRanks[t]}</span>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </button>

                                    {/* Expanded Details */}
                                    <div className={`mt-2 border-t pt-2 text-md text-gray-600 space-y-1 overflow-y-auto transition-all duration-300 ${isExpanded ? "max-h-70 opacity-100" : "max-h-0 opacity-0"
                                        }`}>
                                        {match.time && (
                                            <div>
                                                Time:{" "}
                                                {new Date(match.time * 1000).toLocaleString([], {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}
                                            </div>
                                        )}
                                        {match.videos?.length ? (
                                            <div className="flex flex-row items-center">
                                                Videos:{" "}
                                                {match.videos.map((video) => {
                                                    const url =
                                                        video.type === "youtube"
                                                            ? `https://www.youtube.com/watch?v=${video.key}`
                                                            : `https://www.thebluealliance.com/match/${match.key}`;
                                                    return (
                                                        <button onClick={() => window.open(url, '_blank')} className="ml-2 cursor-pointer bg-gray-50 hover:bg-gray-200 transition px-2 py-1 rounded-sm">
                                                            <VideoIcon className="hover:scale-[1.25] transition" color="darkorange"></VideoIcon>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div>No videos yet</div>
                                        )}

                                        {isExpanded &&
                                            <TeamPercentileBarChartHorizontalStacked matchObject={match} />
                                        }


                                        {(aiMatches['match' + match.match_number] && match.comp_level === "qm") &&
                                            <div className="mt-0 bg-white p-2">
                                                <h3 className="text-md font-bold mb-2">CoScout Analysis</h3>
                                                <h5 className="text-sm mb-4">{aiMatches['match' + match.match_number]}</h5>
                                            </div>

                                        }
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}


                <HotReloadButton />
                <SettingsButton />
            </main>
        </div>
    );
}
