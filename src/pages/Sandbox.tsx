import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Copy, Target, Trophy, Undo, Undo2, Users, Zap } from "lucide-react";
import Navbar from "../components/NavBar";
import HotReloadButton from "../components/HotReload";
import SettingsButton from "../components/SettingsButton";
import { useScoutingStore } from "../app/localDataStore";
import type { TeamStats } from "../app/types";
import TeamCommentsModal from "../components/TeamCommentModal";

type SandboxType = "auto-viewer" | "match-prediction" | "alliance-selection" | "strategy-sim" | "ranking";

interface SelectionTeamPool {
    'team_number': number;
    'rank': number;
    'total_points': number;
    'opr': number;
}

interface Alliance {
    'seed': number,
    'captain': TeamStats;
    'first_pick': TeamStats;
    'second_pick': TeamStats;
    'backup': TeamStats;
}

const sandboxes = [
    { id: "auto-viewer" as SandboxType, name: "Auto Position Viewer", icon: Target },
    { id: "match-prediction" as SandboxType, name: "Match Predictor", icon: Zap },
    { id: "alliance-selection" as SandboxType, name: "Alliance Selection", icon: Users },
    { id: "ranking" as SandboxType, name: "Rank Simulation", icon: Trophy },
];

export default function Sandbox() {
    const [activeSandbox, setActiveSandbox] = useState<SandboxType>("auto-viewer");
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    const { forms, teamStats, loading, columnPercentiles, loadData, teamInfo } = useScoutingStore();

    useEffect(() => {
        loadData(); // Only fetches on first load
    }, []);

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <main className="pt-16 flex h-screen">
                {/* Sidebar */}
                <div
                    className={`bg-white border-r border-gray-200 transition-all duration-300 ${sidebarCollapsed ? "w-16" : "w-64"
                        } flex flex-col shadow-lg`}
                >
                    {/* Sidebar Header */}
                    <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                        {!sidebarCollapsed && (
                            <h2 className="text-lg font-bold text-gray-800">Sandboxes</h2>
                        )}
                        <button
                            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition"
                        >
                            {sidebarCollapsed ? (
                                <ChevronRight size={20} className="text-gray-600" />
                            ) : (
                                <ChevronLeft size={20} className="text-gray-600" />
                            )}
                        </button>
                    </div>

                    {/* Sandbox List */}
                    <div className="flex-1 overflow-y-auto p-2">
                        {sandboxes.map((sandbox) => {
                            const Icon = sandbox.icon;
                            return (
                                <button
                                    key={sandbox.id}
                                    onClick={() => setActiveSandbox(sandbox.id)}
                                    className={`w-full cursor-pointer flex items-center gap-3 p-3 rounded-lg transition mb-2 ${activeSandbox === sandbox.id
                                        ? "bg-orange-100 text-orange-700 font-semibold"
                                        : "text-gray-700 hover:bg-gray-100"
                                        }`}
                                    title={sidebarCollapsed ? sandbox.name : ""}
                                >
                                    <Icon size={20} />
                                    {!sidebarCollapsed && (
                                        <span className="text-sm whitespace-nowrap">{sandbox.name}</span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Main Canvas */}
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="text-orange-500 m-15 text-2xl font-bold animate-bounce">Loading data...</div>
                    ) : (
                        <div className="p-6">
                            {activeSandbox === "auto-viewer" && <AutoViewer />}
                            {activeSandbox === "match-prediction" && <MatchPredictor />}
                            {activeSandbox === "alliance-selection" && <AllianceSelection />}
                            {activeSandbox === "strategy-sim" && <StrategySimulator />}
                        </div>
                    )}
                </div>
            </main>
            <HotReloadButton />
            <SettingsButton />
        </div>
    );
}

function AutoViewer() {
    const [selectedTeam, setSelectedTeam] = useState("1234");
    const [positions, setPositions] = useState([
        { x: 100, y: 100, team: "1234", label: "Start" },
        { x: 300, y: 150, team: "1234", label: "Score 1" },
        { x: 500, y: 200, team: "1234", label: "Score 2" },
    ]);

    return (
        <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Target className="text-orange-500" />
                    Auto Position Viewer
                </h2>
                <p className="text-gray-600 mb-4">
                    Visualize autonomous routines and starting positions for teams
                </p>

                {/* Team Selector */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Team Number
                    </label>
                    <input
                        type="text"
                        value={selectedTeam}
                        onChange={(e) => setSelectedTeam(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="Enter team number"
                    />
                </div>

                {/* Field Canvas */}
                <div className="relative bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border-2 border-blue-300 h-96 overflow-hidden">
                    <svg className="w-full h-full">
                        {/* Field markers */}
                        <rect x="0" y="0" width="100%" height="100%" fill="url(#fieldPattern)" opacity="0.1" />
                        <defs>
                            <pattern id="fieldPattern" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
                                <rect x="0" y="0" width="50" height="50" fill="none" stroke="#2563eb" strokeWidth="0.5" />
                            </pattern>
                        </defs>

                        {/* Auto path */}
                        {positions.map((pos, i) => (
                            <g key={i}>
                                {i > 0 && (
                                    <line
                                        x1={positions[i - 1].x}
                                        y1={positions[i - 1].y}
                                        x2={pos.x}
                                        y2={pos.y}
                                        stroke="#f97316"
                                        strokeWidth="3"
                                        strokeDasharray="5,5"
                                    />
                                )}
                                <circle
                                    cx={pos.x}
                                    cy={pos.y}
                                    r="15"
                                    fill="#f97316"
                                    stroke="white"
                                    strokeWidth="2"
                                />
                                <text
                                    x={pos.x}
                                    y={pos.y + 30}
                                    textAnchor="middle"
                                    className="text-xs font-semibold fill-gray-700"
                                >
                                    {pos.label}
                                </text>
                            </g>
                        ))}
                    </svg>
                </div>

                <div className="mt-4 text-sm text-gray-500">
                    <p>Click positions to add waypoints • Drag to reposition</p>
                </div>
            </div>
        </div>
    );
}

function MatchPredictor() {
    const [redAlliance, setRedAlliance] = useState(["1234", "5678", "9012"]);
    const [blueAlliance, setBlueAlliance] = useState(["3456", "7890", "2345"]);
    const [prediction, setPrediction] = useState({ red: 0, blue: 0, calculated: false });

    const predictMatch = () => {
        // Mock prediction logic
        const redScore = Math.floor(Math.random() * 50) + 100;
        const blueScore = Math.floor(Math.random() * 50) + 100;
        setPrediction({ red: redScore, blue: blueScore, calculated: true });
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Zap className="text-orange-500" />
                    Hypothetical Match Predictor
                </h2>
                <p className="text-gray-600 mb-6">
                    Predict match outcomes based on team statistics
                </p>

                <div className="grid md:grid-cols-2 gap-6 mb-6">
                    {/* Red Alliance */}
                    <div className="bg-red-50 rounded-lg p-4 border-2 border-red-300">
                        <h3 className="text-lg font-bold text-red-700 mb-3">Red Alliance</h3>
                        {redAlliance.map((team, i) => (
                            <input
                                key={i}
                                type="text"
                                value={team}
                                onChange={(e) => {
                                    const newAlliance = [...redAlliance];
                                    newAlliance[i] = e.target.value;
                                    setRedAlliance(newAlliance);
                                }}
                                className="w-full px-3 py-2 mb-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500"
                                placeholder={`Team ${i + 1}`}
                            />
                        ))}
                    </div>

                    {/* Blue Alliance */}
                    <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-300">
                        <h3 className="text-lg font-bold text-blue-700 mb-3">Blue Alliance</h3>
                        {blueAlliance.map((team, i) => (
                            <input
                                key={i}
                                type="text"
                                value={team}
                                onChange={(e) => {
                                    const newAlliance = [...blueAlliance];
                                    newAlliance[i] = e.target.value;
                                    setBlueAlliance(newAlliance);
                                }}
                                className="w-full px-3 py-2 mb-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder={`Team ${i + 1}`}
                            />
                        ))}
                    </div>
                </div>

                <button
                    onClick={predictMatch}
                    className="w-full bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition shadow-md"
                >
                    Predict Match Outcome
                </button>

                {prediction.calculated && (
                    <div className="mt-6 bg-gray-50 rounded-lg p-6 border-2 border-gray-300">
                        <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">
                            Predicted Score
                        </h3>
                        <div className="flex justify-around items-center">
                            <div className="text-center">
                                <div className="text-4xl font-bold text-red-600">{prediction.red}</div>
                                <div className="text-sm text-gray-600 mt-1">Red Alliance</div>
                            </div>
                            <div className="text-2xl font-bold text-gray-400">vs</div>
                            <div className="text-center">
                                <div className="text-4xl font-bold text-blue-600">{prediction.blue}</div>
                                <div className="text-sm text-gray-600 mt-1">Blue Alliance</div>
                            </div>
                        </div>
                        <div className="mt-4 text-center">
                            <span className={`px-4 py-2 rounded-full font-semibold ${prediction.red > prediction.blue
                                ? "bg-red-100 text-red-700"
                                : prediction.blue > prediction.red
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-gray-100 text-gray-700"
                                }`}>
                                {prediction.red > prediction.blue
                                    ? "Red Alliance Wins"
                                    : prediction.blue > prediction.red
                                        ? "Blue Alliance Wins"
                                        : "Tie"}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function AllianceSelection() {

    const { forms, teamStats, tbaData, teamInfo } = useScoutingStore();

    const addToAlliance = (team: SelectionTeamPool) => {

        if (!(nextPick.role == 'backup' && nextPick.seed > 8)) {
            let newAlliances = alliances;
            newAlliances[nextPick.seed - 1][nextPick.role] = teamStats[team.team_number];
            setAlliances(newAlliances);
        }

        if (nextPick.role == 'captain') {
            setNextPick((prev) => ({
                seed: prev.seed,
                role: 'first_pick',
            }));
        } else if (nextPick.role == 'first_pick') {
            if (nextPick.seed < 8) {
                setNextPick((prev) => ({
                    seed: (prev.seed + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8,
                    role: 'captain',
                }));
            } else {
                setNextPick((prev) => ({
                    seed: 8,
                    role: 'second_pick',
                }));
            }
        } else if (nextPick.role == 'second_pick') {
            if (nextPick.seed > 1) {
                setNextPick((prev) => ({
                    seed: (prev.seed - 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8,
                    role: 'second_pick',
                }));
            } else {
                setNextPick((prev) => ({
                    seed: 1,
                    role: 'backup',
                }));
            }
        } else if (nextPick.role == 'backup') {
            if (nextPick.seed < 8) {
                setNextPick((prev) => ({
                    seed: (prev.seed + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8,
                    role: 'backup',
                }));
            }
        }
    };

    function undoLastPick() {
        // Clone the alliances array immutably
        const newAlliances = [...alliances];

        // Compute which slot to undo
        let prevSeed = nextPick.seed;
        let prevRole = nextPick.role;

        // Step backwards through the same order
        if (nextPick.role === "first_pick") {
            // Go back to same seed, captain
            prevRole = "captain";
        } else if (nextPick.role === "captain") {
            // Go back to previous seed's first pick (unless we’re at seed 1)
            if (nextPick.seed > 1) {
                prevSeed = (nextPick.seed - 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
                prevRole = "first_pick";
            }
        } else if (nextPick.role === "second_pick") {
            // If going backward in the snake (8→1 direction)
            if (nextPick.seed < 8) {
                prevSeed = (nextPick.seed + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
            } else {
                // Reached end of round — switch back to captain of seed 8
                prevRole = "captain";
            }
        } else if (nextPick.role === "backup") {
            if (nextPick.seed > 1) {
                prevSeed = (nextPick.seed - 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
            } else {
                // Rewind back to end of second_pick round
                prevRole = "second_pick";
                prevSeed = 8;
            }
        }

        // Clear the previously assigned slot
        const allianceToClear = prevSeed - 1;
        newAlliances[allianceToClear][prevRole] = {} as TeamStats;

        setAlliances(newAlliances);

        // Update nextPick to the cleared slot (so the UI highlights it)
        setNextPick({
            seed: prevSeed,
            role: prevRole,
        });
    }

    function copyAlliancesToClipboard(alliances: Alliance[]) {
        // Create header row
        const header = ["Seed", "Captain", "First Pick", "Second Pick", "Backup"].join("\t");

        // Map alliances into tab-separated rows
        const rows = alliances.map(a =>
            [
                a.seed,
                a.captain?.team_number?.mean ?? "-",
                a.first_pick?.team_number?.mean ?? "-",
                a.second_pick?.team_number?.mean ?? "-",
                a.backup?.team_number?.mean ?? "-",
            ].join("\t")
        );

        // Combine into a TSV string
        const tsv = [header, ...rows].join("\n");

        // Copy to clipboard
        navigator.clipboard.writeText(tsv)
            .then(() => {
                console.log("✅ Alliances copied to clipboard (paste into Google Sheets!)");
            })
            .catch(err => {
                console.error("❌ Failed to copy alliances:", err);
            });
    }

    const [commentModalOpen, setCommentModalOpen] = useState<boolean>(false);
    const [commentModalTeam, setCommentModalTeam] = useState<number>(-1);

    const [selectedSortType, setSelectedSortType] = useState<'Rank' | 'Number' | 'OPR' | 'Points'>('Rank');

    const [teamPool, setTeamPool] = useState<SelectionTeamPool[]>([]);

    const [alliances, setAlliances] = useState<Alliance[]>([]);

    type AllianceKey = "captain" | "first_pick" | "second_pick" | "backup";

    const [nextPick, setNextPick] = useState<{ seed: (1 | 2 | 3 | 4 | 5 | 6 | 7 | 8), role: AllianceKey }>({ role: 'captain', seed: 1 });

    useEffect(() => {

        if (teamStats && forms && tbaData) {
            let tempTeamPool: SelectionTeamPool[] = [];
            Object.keys(teamStats).forEach((key) => {
                const data = teamStats[parseInt(key)];
                console.log(data);
                tempTeamPool.push({
                    'team_number': data.team_number.mean,
                    'rank': tbaData?.rankings?.find(r => r.team_key === `frc${data.team_number.mean}`)?.rank ?? -1,
                    'total_points': data.total_points.q3,
                    'opr': data.opr.q3
                })
            });

            const blankAlliances: Alliance[] = Array.from({ length: 8 }, (_, i) => ({
                seed: i + 1,
                captain: {} as TeamStats,
                first_pick: {} as TeamStats,
                second_pick: {} as TeamStats,
                backup: {} as TeamStats,
            }));

            setAlliances(blankAlliances);

            console.log(nextPick)

            setTeamPool(tempTeamPool);
        }

    }, [teamStats, tbaData]);

    return (
        <div className="max-w-6xl mx-auto">

            <TeamCommentsModal
                isOpen={commentModalOpen}
                onClose={() => setCommentModalOpen(false)}
                forms={forms}
                teamNumber={commentModalTeam}
                teamInfo={teamInfo}
            />

            <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Users className="text-orange-500" />
                    Mock Alliance Selection
                </h2>

                <div className="grid md:grid-cols-[1fr_2fr] gap-6">
                    {/* Available Teams */}
                    <div>
                        <div className="flex flex-col xl:flex-row justify-between align-center my-3 xl:gap-5">
                            <h3 className="text-lg font-bold text-gray-800 mb-3">Available Teams</h3>
                            <div className="flex flex-row justify-end align-center gap-2 py-1 h-10">
                                <button onClick={() => setSelectedSortType('Number')} className={`${selectedSortType == 'Number' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-700'} px-3 cursor-pointer hover:bg-orange-400 rounded-full`}>Number</button>
                                <button onClick={() => setSelectedSortType('Rank')} className={`${selectedSortType == 'Rank' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-700'} px-3 cursor-pointer hover:bg-orange-400 rounded-full`}>Rank</button>
                                <button onClick={() => setSelectedSortType('OPR')} className={`${selectedSortType == 'OPR' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-700'} px-3 cursor-pointer hover:bg-orange-400 rounded-full`}>OPR</button>
                                <button onClick={() => setSelectedSortType('Points')} className={`${selectedSortType == 'Points' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-700'} px-3 cursor-pointer hover:bg-orange-400 rounded-full`}>Points</button>
                            </div>
                        </div>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {teamPool
                                .filter((team) =>
                                    !alliances
                                        .flatMap((a) => [
                                            a.captain.team_number?.max ?? 0,
                                            a.first_pick.team_number?.max ?? 0,
                                            a.second_pick.team_number?.max ?? 0,
                                            a.backup.team_number?.max ?? 0,
                                        ])
                                        .includes(team.team_number)
                                )
                                .sort((a, b) => {
                                    switch (selectedSortType) {
                                        case 'Number':
                                            return a.team_number - b.team_number;
                                            break;
                                        case 'OPR':
                                            return b.opr - a.opr;
                                            break;
                                        case 'Points':
                                            return b.total_points - a.total_points;
                                            break;
                                        default:
                                            return a.rank - b.rank;
                                            break;
                                    }
                                })
                                .map((team) => (
                                    <div
                                        key={team.team_number}
                                        onClick={() => addToAlliance(team)}
                                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-orange-50 hover:border-orange-300 cursor-pointer transition"
                                    >
                                        <div>
                                            <span className="font-bold text-gray-800">
                                                Team {team.team_number}
                                            </span>
                                            <span className="text-sm text-gray-500 ml-4">
                                                Rank {team.rank}
                                            </span>
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            OPR: {team.opr}
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            Q3 Pts: {team.total_points}
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>

                    {/* Selected Alliances */}
                    <div>
                        <div className="flex flex-row justify-between align-center">
                            <h3 className="text-lg font-bold text-gray-800 mb-3">
                                Alliances:
                            </h3>
                            <div className="text-center text-gray-400 flex flex-row items-center gap-3">
                                <h3 className="select-none">Click a team to add next pick/captain.</h3>
                                <Copy onClick={() => copyAlliancesToClipboard(alliances)} className="m-2 hover:scale-115 transition rounded-md cursor-pointer" size={24} color="black" />
                                <Undo2 onClick={() => undoLastPick()} className="m-2 hover:scale-115 transition rounded-md cursor-pointer" size={24} color="black" />
                            </div>
                        </div>

                        <div className="grid grid-rows-9 w-full gap-3">
                            <div className="flex flex-row justify-between gap-5 w-full">
                                <div className="flex flex-row justify-between gap-3 flex-3 text-gray-700 text-sm">
                                    <h2>Seed</h2>
                                    <h2 className={` flex-1 rounded-lg text-center`}>Captain</h2>
                                    <h2 className={`flex-1 rounded-lg text-center`}>1st pick</h2>
                                    <h2 className={` flex-1 rounded-lg text-center`}>2nd pick</h2>
                                    <h2 className={`flex-1 rounded-lg text-center`}>Backup</h2>
                                </div>
                                <div className="flex flex-row justify-center gap-3 flex-1 text-gray-700 text-sm">
                                    <h2>Predicted score</h2>
                                </div>
                            </div>
                            {
                                alliances.map((alliance) => {
                                    return (
                                        <div className="flex flex-row justify-between gap-5 w-full">
                                            <div className="flex flex-row justify-between gap-3 flex-3 text-lg">
                                                <h2>{alliance.seed ?? '-'}</h2>
                                                <h2 onClick={alliance.captain.team_number?.mean ? () => { setCommentModalTeam(alliance.captain.team_number?.mean); setCommentModalOpen(true); } : () => { }} className={`${(nextPick.role == 'captain' && nextPick.seed == alliance.seed) ? 'bg-orange-300 animate-pulse' : ''} flex-1 rounded-lg text-center cursor-pointer hover:font-bold`}>{alliance.captain.team_number?.mean ?? '-'}</h2>
                                                <h2 onClick={alliance.first_pick.team_number?.mean ? () => { setCommentModalTeam(alliance.first_pick.team_number?.mean); setCommentModalOpen(true); } : () => { }} className={`${(nextPick.role == 'first_pick' && nextPick.seed == alliance.seed) ? 'bg-orange-300 animate-pulse' : ''} flex-1 rounded-lg text-center cursor-pointer hover:font-bold`}>{alliance.first_pick.team_number?.mean ?? '-'}</h2>
                                                <h2 onClick={alliance.second_pick.team_number?.mean ? () => { setCommentModalTeam(alliance.second_pick.team_number?.mean); setCommentModalOpen(true); } : () => { }} className={`${(nextPick.role == 'second_pick' && nextPick.seed == alliance.seed) ? 'bg-orange-300 animate-pulse' : ''} flex-1 rounded-lg text-center cursor-pointer hover:font-bold`}>{alliance.second_pick.team_number?.mean ?? '-'}</h2>
                                                <h2 onClick={alliance.backup.team_number?.mean ? () => { setCommentModalTeam(alliance.backup.team_number?.mean); setCommentModalOpen(true); } : () => { }} className={`${(nextPick.role == 'backup' && nextPick.seed == alliance.seed) ? 'bg-orange-300 animate-pulse' : ''} flex-1 rounded-lg text-center cursor-pointer hover:font-bold`}>{alliance.backup.team_number?.mean ?? '-'}</h2>
                                            </div>
                                            <div className="flex flex-row justify-center gap-3 flex-1 ">
                                                <h2>{(alliance.captain.total_points?.q3 ?? 0) + (alliance.first_pick.total_points?.q3 ?? 0) + (alliance.second_pick.total_points?.q3 ?? 0)}</h2>
                                            </div>
                                        </div>
                                    )
                                })
                            }
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}

function StrategySimulator() {
    const [gameplan, setGameplan] = useState({
        autoPoints: 20,
        telePoints: 60,
        endgamePoints: 15,
    });

    const totalPoints = gameplan.autoPoints + gameplan.telePoints + gameplan.endgamePoints;

    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Trophy className="text-orange-500" />
                    Strategy Simulator
                </h2>
                <p className="text-gray-600 mb-6">
                    Plan and simulate different match strategies
                </p>

                <div className="space-y-4 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Auto Points: {gameplan.autoPoints}
                        </label>
                        <input
                            type="range"
                            min="0"
                            max="50"
                            value={gameplan.autoPoints}
                            onChange={(e) =>
                                setGameplan({ ...gameplan, autoPoints: parseInt(e.target.value) })
                            }
                            className="w-full accent-orange-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tele Points: {gameplan.telePoints}
                        </label>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={gameplan.telePoints}
                            onChange={(e) =>
                                setGameplan({ ...gameplan, telePoints: parseInt(e.target.value) })
                            }
                            className="w-full accent-orange-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Endgame Points: {gameplan.endgamePoints}
                        </label>
                        <input
                            type="range"
                            min="0"
                            max="30"
                            value={gameplan.endgamePoints}
                            onChange={(e) =>
                                setGameplan({ ...gameplan, endgamePoints: parseInt(e.target.value) })
                            }
                            className="w-full accent-orange-500"
                        />
                    </div>
                </div>

                <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-6 border-2 border-orange-300">
                    <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">
                        Projected Score
                    </h3>
                    <div className="text-center">
                        <div className="text-6xl font-bold text-orange-600">{totalPoints}</div>
                        <div className="text-sm text-gray-600 mt-2">Total Points</div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mt-6">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-gray-700">
                                {gameplan.autoPoints}
                            </div>
                            <div className="text-xs text-gray-500">Auto</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-gray-700">
                                {gameplan.telePoints}
                            </div>
                            <div className="text-xs text-gray-500">Tele</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-gray-700">
                                {gameplan.endgamePoints}
                            </div>
                            <div className="text-xs text-gray-500">Endgame</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}