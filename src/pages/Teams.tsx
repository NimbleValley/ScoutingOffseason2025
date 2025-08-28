import { useEffect } from "react";
import { useScoutingStore } from "../app/localDataStore";
import Navbar from "../components/NavBar";
import HotReloadButton from "../components/HotReload";
import CustomSelect from "../components/Select";

export default function Teams() {

    const { tbaData, loadData, loadStatbotics, loading, currentViewingTeam, setCurrentViewingTeam, teamStats, statboticsTeams } = useScoutingStore();

    console.log(statboticsTeams);

    useEffect(() => {
        loadData();
        loadStatbotics();
    }, []);


    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <main className="pt-20 px-4 md:px-6">
                {loading ? (
                    <div className="text-orange-500 text-lg font-semibold">Loading data...</div>
                ) : (
                    <div className="max-w-3xl mx-auto">
                        {/* Team selector */}
                        <div className="mb-6">
                            <CustomSelect
                                view={currentViewingTeam}
                                setView={setCurrentViewingTeam}
                                label="Team: "
                                options={Object.keys(teamStats).map(Number)}
                            />
                        </div>

                        {/* Team stats card */}
                        <div className="bg-white shadow-md rounded-xl p-6 space-y-4">
                            <h2 className="text-2xl font-bold text-gray-800">
                                Team {currentViewingTeam}
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
                                        {tbaData?.rankings?.find(r => r.team_key === `frc${currentViewingTeam}`)?.record?.wins ?? 0} -
                                        {tbaData?.rankings?.find(r => r.team_key === `frc${currentViewingTeam}`)?.record?.losses ?? 0} -
                                        {tbaData?.rankings?.find(r => r.team_key === `frc${currentViewingTeam}`)?.record?.ties ?? 0}
                                    </p>
                                </div>

                                {/* OPR */}
                                <div className="bg-gray-50 p-3 rounded-lg text-center">
                                    <p className="text-gray-500 text-sm">EPA</p>
                                    <p className="text-lg font-semibold">
                                        {String(statboticsTeams.epa?.breakdown.total_points)}
                                    </p>
                                </div>

                                {/*
          {/* EPA }
          <div className="bg-gray-50 p-3 rounded-lg text-center">
            <p className="text-gray-500 text-sm">OPR</p>
            <p className="text-lg font-semibold">
              {Math.round((Number(tbaData?.oprs[`frc${currentViewingTeam}`]) ?? 0) * 10) / 10}
            </p>
          </div> */}

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
                                                className={`flex flex-row sm:flex-row justify-between items-center sm:items-center p-3 rounded-lg shadow-sm 
                        ${isRed ? "bg-red-50" : "bg-blue-50"}`}
                                            >
                                                {/* Match Number + Playoff Label */}
                                                <div className="font-semibold mb-1 sm:mb-0">
                                                    {playoffLabel ? 'Match' : 'Qual'} {match.match_number}{" "}
                                                    {playoffLabel && (
                                                        <span className="ml-2 text-sm text-red-600 font-bold">
                                                            [{playoffLabel}]
                                                        </span>
                                                    )}
                                                </div>

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
                )}
            </main>

            <HotReloadButton />
        </div>
    );
}