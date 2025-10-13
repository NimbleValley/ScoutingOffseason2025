import { useState } from "react";
import { ChevronLeft, ChevronRight, Target, Trophy, Users, Zap } from "lucide-react";
import Navbar from "../components/NavBar";
import HotReloadButton from "../components/HotReload";
import SettingsButton from "../components/SettingsButton";

type SandboxType = "auto-viewer" | "match-prediction" | "alliance-selection" | "strategy-sim" | "ranking";

const sandboxes = [
    { id: "auto-viewer" as SandboxType, name: "Auto Position Viewer", icon: Target },
    { id: "match-prediction" as SandboxType, name: "Match Predictor", icon: Zap },
    { id: "alliance-selection" as SandboxType, name: "Alliance Selection", icon: Users },
    { id: "ranking" as SandboxType, name: "Rank Simulation", icon: Trophy },
];

export default function Sandbox() {
    const [activeSandbox, setActiveSandbox] = useState<SandboxType>("auto-viewer");
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <main className="pt-16 flex h-screen">
                {/* Sidebar */}
                <div
                    className={`bg-white border-r border-gray-200 transition-all duration-300 ${
                        sidebarCollapsed ? "w-16" : "w-64"
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
                                    className={`w-full cursor-pointer flex items-center gap-3 p-3 rounded-lg transition mb-2 ${
                                        activeSandbox === sandbox.id
                                            ? "bg-orange-100 text-orange-700 font-semibold"
                                            : "text-gray-700 hover:bg-gray-100"
                                    }`}
                                    title={sidebarCollapsed ? sandbox.name : ""}
                                >
                                    <Icon size={20} />
                                    {!sidebarCollapsed && (
                                        <span className="text-sm">{sandbox.name}</span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Main Canvas */}
                <div className="flex-1 overflow-y-auto">
                    <div className="p-6">
                        {activeSandbox === "auto-viewer" && <AutoViewer />}
                        {activeSandbox === "match-prediction" && <MatchPredictor />}
                        {activeSandbox === "alliance-selection" && <AllianceSelection />}
                        {activeSandbox === "strategy-sim" && <StrategySimulator />}
                    </div>
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
                            <span className={`px-4 py-2 rounded-full font-semibold ${
                                prediction.red > prediction.blue
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
    const [availableTeams] = useState([
        { number: 1234, rank: 1, opr: 85.2 },
        { number: 5678, rank: 2, opr: 82.1 },
        { number: 9012, rank: 3, opr: 79.5 },
        { number: 3456, rank: 4, opr: 77.8 },
        { number: 7890, rank: 5, opr: 75.3 },
        { number: 2345, rank: 6, opr: 73.9 },
        { number: 6789, rank: 7, opr: 71.2 },
        { number: 1357, rank: 8, opr: 68.5 },
    ]);
    const [selectedAlliance, setSelectedAlliance] = useState<number[]>([]);

    const addToAlliance = (team: number) => {
        if (selectedAlliance.length < 3 && !selectedAlliance.includes(team)) {
            setSelectedAlliance([...selectedAlliance, team]);
        }
    };

    const removeFromAlliance = (team: number) => {
        setSelectedAlliance(selectedAlliance.filter((t) => t !== team));
    };

    return (
        <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Users className="text-orange-500" />
                    Mock Alliance Selection
                </h2>
                <p className="text-gray-600 mb-6">
                    Simulate alliance selection and explore different team combinations
                </p>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Available Teams */}
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 mb-3">Available Teams</h3>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {availableTeams
                                .filter((team) => !selectedAlliance.includes(team.number))
                                .map((team) => (
                                    <div
                                        key={team.number}
                                        onClick={() => addToAlliance(team.number)}
                                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-orange-50 hover:border-orange-300 cursor-pointer transition"
                                    >
                                        <div>
                                            <span className="font-bold text-gray-800">
                                                Team {team.number}
                                            </span>
                                            <span className="text-sm text-gray-500 ml-2">
                                                Rank #{team.rank}
                                            </span>
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            OPR: {team.opr}
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>

                    {/* Selected Alliance */}
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 mb-3">
                            Your Alliance ({selectedAlliance.length}/3)
                        </h3>
                        <div className="space-y-2">
                            {selectedAlliance.map((teamNum, i) => {
                                const team = availableTeams.find((t) => t.number === teamNum);
                                return (
                                    <div
                                        key={teamNum}
                                        className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border-2 border-orange-300"
                                    >
                                        <div>
                                            <span className="font-bold text-orange-700">
                                                {i === 0 ? "Captain: " : `Pick ${i}: `}Team {teamNum}
                                            </span>
                                            <span className="text-sm text-gray-500 ml-2">
                                                Rank #{team?.rank}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => removeFromAlliance(teamNum)}
                                            className="px-3 py-1 bg-red-500 text-white text-sm rounded-md hover:bg-red-600 transition"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                );
                            })}
                            {selectedAlliance.length === 0 && (
                                <div className="text-center py-8 text-gray-400">
                                    Click teams to add to your alliance
                                </div>
                            )}
                        </div>

                        {selectedAlliance.length === 3 && (
                            <div className="mt-4 p-4 bg-green-50 rounded-lg border-2 border-green-300">
                                <div className="text-center">
                                    <div className="text-lg font-bold text-green-700">
                                        Alliance Complete!
                                    </div>
                                    <div className="text-sm text-gray-600 mt-2">
                                        Combined OPR:{" "}
                                        {selectedAlliance
                                            .reduce((sum, num) => {
                                                const team = availableTeams.find((t) => t.number === num);
                                                return sum + (team?.opr || 0);
                                            }, 0)
                                            .toFixed(1)}
                                    </div>
                                </div>
                            </div>
                        )}
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