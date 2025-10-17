import { useEffect, useState, useMemo } from "react";
import { useScoutingStore } from "../app/localDataStore";
import Navbar from "../components/NavBar";
import HotReloadButton from "../components/HotReload";
import SettingsButton from "../components/SettingsButton";
import CustomSelect from "../components/Select";
import { 
    RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    LineChart, Line
} from "recharts";
import { ArrowRight, TrendingUp, Target, Zap } from "lucide-react";
import { numericColumns } from "../app/types";

export default function Comparison() {
    const {
        forms,
        teamInfo,
        teamStats,
        teamImages,
        loadData,
        loadTeamImages,
        loading,
        tbaData,
        aiOverviews
    } = useScoutingStore();

    useEffect(() => {
        loadTeamImages();
        loadData();
    }, []);

    const [team1, setTeam1] = useState<number>(0);
    const [team2, setTeam2] = useState<number>(0);

    const availableTeams = useMemo(() => {
        return Object.keys(teamStats).map(Number).sort((a, b) => a - b);
    }, [teamStats]);

    useEffect(() => {
        if (availableTeams.length >= 2 && team1 === 0 && team2 === 0) {
            setTeam1(availableTeams[0]);
            setTeam2(availableTeams[1]);
        }
    }, [availableTeams]);

    // Get forms for each team
    const team1Forms = useMemo(() => {
        return forms
            .filter(f => Number(f.team_number) === team1)
            .sort((a, b) => (a.match_number ?? 0) - (b.match_number ?? 0));
    }, [forms, team1]);

    const team2Forms = useMemo(() => {
        return forms
            .filter(f => Number(f.team_number) === team2)
            .sort((a, b) => (a.match_number ?? 0) - (b.match_number ?? 0));
    }, [forms, team2]);

    // Calculate standard deviation for consistency
    const calculateStdDev = (values: number[]) => {
        if (values.length === 0) return 0;
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        return Math.sqrt(variance);
    };

    // Radar chart data
    const radarData = useMemo(() => {
        const metrics = [
            { key: 'total_points', label: 'Total Points' },
            { key: 'auto_points', label: 'Auto' },
            { key: 'tele_points', label: 'Tele' },
            { key: 'endgame_points', label: 'Endgame' },
            { key: 'total_coral', label: 'Coral' },
            { key: 'total_algae', label: 'Algae' },
        ];

        return metrics.map(metric => ({
            metric: metric.label,
            team1: teamStats[team1]?.[metric.key]?.median ?? 0,
            team2: teamStats[team2]?.[metric.key]?.median ?? 0,
        }));
    }, [team1, team2, teamStats]);

    // Consistency data (standard deviation - lower is better/more consistent)
    const consistencyData = useMemo(() => {
        const metrics = ['total_points', 'auto_points', 'tele_points', 'endgame_points'];
        
        return metrics.map(metric => {
            const team1Values = team1Forms.map(f => Number(f[metric] ?? 0));
            const team2Values = team2Forms.map(f => Number(f[metric] ?? 0));
            
            return {
                metric: metric.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                team1: calculateStdDev(team1Values),
                team2: calculateStdDev(team2Values),
            };
        });
    }, [team1Forms, team2Forms]);

    // Performance over time
    const performanceData = useMemo(() => {
        const maxMatches = Math.max(team1Forms.length, team2Forms.length);
        const data = [];
        
        for (let i = 0; i < maxMatches; i++) {
            data.push({
                match: i + 1,
                team1: team1Forms[i] ? Number(team1Forms[i].total_points ?? 0) : null,
                team2: team2Forms[i] ? Number(team2Forms[i].total_points ?? 0) : null,
            });
        }
        
        return data;
    }, [team1Forms, team2Forms]);

    // Head to head comparison stats
    const comparisonStats = useMemo(() => {
        const stats = [
            { key: 'total_points', label: 'Total Points' },
            { key: 'auto_points', label: 'Auto Points' },
            { key: 'tele_points', label: 'Tele Points' },
            { key: 'endgame_points', label: 'Endgame Points' },
            { key: 'total_coral', label: 'Total Coral' },
            { key: 'total_algae', label: 'Total Algae' },
            { key: 'total_gamepieces', label: 'Total Gamepieces' },
        ];

        return stats.map(stat => ({
            label: stat.label,
            team1: {
                median: teamStats[team1]?.[stat.key]?.median ?? 0,
                max: teamStats[team1]?.[stat.key]?.max ?? 0,
                q3: teamStats[team1]?.[stat.key]?.q3 ?? 0,
            },
            team2: {
                median: teamStats[team2]?.[stat.key]?.median ?? 0,
                max: teamStats[team2]?.[stat.key]?.max ?? 0,
                q3: teamStats[team2]?.[stat.key]?.q3 ?? 0,
            },
        }));
    }, [team1, team2, teamStats]);

    if (loading || !forms.length) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <main className="pt-20 px-4 md:px-6">
                    <div className="text-orange-500 text-lg font-semibold">Loading data...</div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <main className="pt-20 px-4 md:px-6 pb-10">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">Team Comparison</h1>
                        <p className="text-gray-600">Compare two teams head-to-head with detailed statistics and visualizations</p>
                    </div>

                    {/* Team Selectors */}
                    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                        <div className="grid md:grid-cols-3 gap-6 items-center">
                            {/* Team 1 */}
                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border-2 border-blue-300">
                                <CustomSelect
                                    view={team1}
                                    setView={setTeam1}
                                    label="Team 1: "
                                    options={availableTeams}
                                />
                                {teamImages[team1] && (
                                    <img src={teamImages[team1]} alt={`Team ${team1}`} className="w-24 h-24 object-contain mx-auto mt-3" />
                                )}
                                <div className="text-center mt-2">
                                    <p className="font-bold text-blue-700">{teamInfo[team1]?.nickname ?? ''}</p>
                                    <p className="text-sm text-gray-600">Rank: {tbaData?.rankings?.find(r => r.team_key === `frc${team1}`)?.rank ?? 'N/A'}</p>
                                </div>
                            </div>

                            {/* VS */}
                            <div className="text-center">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-500 rounded-full">
                                    <span className="text-2xl font-bold text-white">VS</span>
                                </div>
                            </div>

                            {/* Team 2 */}
                            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border-2 border-red-300">
                                <CustomSelect
                                    view={team2}
                                    setView={setTeam2}
                                    label="Team 2: "
                                    options={availableTeams}
                                />
                                {teamImages[team2] && (
                                    <img src={teamImages[team2]} alt={`Team ${team2}`} className="w-24 h-24 object-contain mx-auto mt-3" />
                                )}
                                <div className="text-center mt-2">
                                    <p className="font-bold text-red-700">{teamInfo[team2]?.nickname ?? ''}</p>
                                    <p className="text-sm text-gray-600">Rank: {tbaData?.rankings?.find(r => r.team_key === `frc${team2}`)?.rank ?? 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats Comparison */}
                    <div className="grid md:grid-cols-2 gap-6 mb-8">
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <Target className="text-orange-500" />
                                Key Statistics
                            </h2>
                            <div className="space-y-3">
                                {comparisonStats.slice(0, 4).map((stat, idx) => (
                                    <div key={idx} className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-gray-700">{stat.label}</span>
                                        <div className="flex items-center gap-4">
                                            <span className={`font-bold ${stat.team1.median > stat.team2.median ? 'text-green-600' : 'text-gray-600'}`}>
                                                {stat.team1.median}
                                            </span>
                                            <ArrowRight size={16} className="text-gray-400" />
                                            <span className={`font-bold ${stat.team2.median > stat.team1.median ? 'text-green-600' : 'text-gray-600'}`}>
                                                {stat.team2.median}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <TrendingUp className="text-orange-500" />
                                Consistency (Std Dev - Lower is Better)
                            </h2>
                            <div className="space-y-3">
                                {consistencyData.map((stat, idx) => (
                                    <div key={idx} className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-gray-700">{stat.metric}</span>
                                        <div className="flex items-center gap-4">
                                            <span className={`font-bold ${stat.team1 < stat.team2 ? 'text-green-600' : 'text-gray-600'}`}>
                                                {stat.team1.toFixed(1)}
                                            </span>
                                            <ArrowRight size={16} className="text-gray-400" />
                                            <span className={`font-bold ${stat.team2 < stat.team1 ? 'text-green-600' : 'text-gray-600'}`}>
                                                {stat.team2.toFixed(1)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Radar Chart */}
                    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">Performance Radar</h2>
                        <ResponsiveContainer width="100%" height={400}>
                            <RadarChart data={radarData}>
                                <PolarGrid stroke="#e5e7eb" />
                                <PolarAngleAxis dataKey="metric" tick={{ fill: '#374151', fontSize: 12 }} />
                                <PolarRadiusAxis />
                                <Radar name={`Team ${team1}`} dataKey="team1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.5} />
                                <Radar name={`Team ${team2}`} dataKey="team2" stroke="#ef4444" fill="#ef4444" fillOpacity={0.5} />
                                <Legend />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Performance Over Time */}
                    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">Performance Over Time</h2>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={performanceData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="match" label={{ value: "Match", position: "insideBottom", offset: -5 }} />
                                <YAxis label={{ value: "Total Points", angle: -90, position: "insideLeft" }} />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="team1" stroke="#3b82f6" strokeWidth={2} name={`Team ${team1}`} connectNulls />
                                <Line type="monotone" dataKey="team2" stroke="#ef4444" strokeWidth={2} name={`Team ${team2}`} connectNulls />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Consistency Comparison Bar Chart */}
                    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">Consistency Comparison (Lower is Better)</h2>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={consistencyData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="metric" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="team1" fill="#3b82f6" name={`Team ${team1}`} />
                                <Bar dataKey="team2" fill="#ef4444" name={`Team ${team2}`} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* AI Overviews Comparison */}
                    {(aiOverviews[team1] || aiOverviews[team2]) && (
                        <div className="grid md:grid-cols-2 gap-6 mb-8">
                            {/* Team 1 AI Overview */}
                            {aiOverviews[team1] && (
                                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
                                    <h3 className="text-lg font-bold text-blue-700 mb-4">Team {team1} - CoScout Analysis</h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="bg-gray-50 p-2 rounded">
                                            <span className="font-semibold text-orange-600">Auto:</span>{" "}
                                            <span className="text-gray-700">{aiOverviews[team1].auto}</span>
                                        </div>
                                        <div className="bg-gray-50 p-2 rounded">
                                            <span className="font-semibold text-orange-600">Coral:</span>{" "}
                                            <span className="text-gray-700">{aiOverviews[team1].coral}</span>
                                        </div>
                                        <div className="bg-gray-50 p-2 rounded">
                                            <span className="font-semibold text-orange-600">Algae:</span>{" "}
                                            <span className="text-gray-700">{aiOverviews[team1].algae}</span>
                                        </div>
                                        <div className="bg-gray-50 p-2 rounded">
                                            <span className="font-semibold text-orange-600">Endgame:</span>{" "}
                                            <span className="text-gray-700">{aiOverviews[team1].endgame}</span>
                                        </div>
                                        <div className="bg-gray-50 p-2 rounded">
                                            <span className="font-semibold text-orange-600">Strengths:</span>{" "}
                                            <span className="text-gray-700">{aiOverviews[team1].strengths}</span>
                                        </div>
                                        <div className="bg-red-50 p-2 rounded border border-red-200">
                                            <span className="font-semibold text-red-600">Concerns:</span>{" "}
                                            <span className="text-gray-700">{aiOverviews[team1].concerns}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Team 2 AI Overview */}
                            {aiOverviews[team2] && (
                                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
                                    <h3 className="text-lg font-bold text-red-700 mb-4">Team {team2} - CoScout Analysis</h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="bg-gray-50 p-2 rounded">
                                            <span className="font-semibold text-orange-600">Auto:</span>{" "}
                                            <span className="text-gray-700">{aiOverviews[team2].auto}</span>
                                        </div>
                                        <div className="bg-gray-50 p-2 rounded">
                                            <span className="font-semibold text-orange-600">Coral:</span>{" "}
                                            <span className="text-gray-700">{aiOverviews[team2].coral}</span>
                                        </div>
                                        <div className="bg-gray-50 p-2 rounded">
                                            <span className="font-semibold text-orange-600">Algae:</span>{" "}
                                            <span className="text-gray-700">{aiOverviews[team2].algae}</span>
                                        </div>
                                        <div className="bg-gray-50 p-2 rounded">
                                            <span className="font-semibold text-orange-600">Endgame:</span>{" "}
                                            <span className="text-gray-700">{aiOverviews[team2].endgame}</span>
                                        </div>
                                        <div className="bg-gray-50 p-2 rounded">
                                            <span className="font-semibold text-orange-600">Strengths:</span>{" "}
                                            <span className="text-gray-700">{aiOverviews[team2].strengths}</span>
                                        </div>
                                        <div className="bg-red-50 p-2 rounded border border-red-200">
                                            <span className="font-semibold text-red-600">Concerns:</span>{" "}
                                            <span className="text-gray-700">{aiOverviews[team2].concerns}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Detailed Stats Table */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">Detailed Statistics Comparison</h2>
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead className="bg-gradient-to-r from-orange-50 to-orange-100">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-700 border-b-2 border-orange-300">Statistic</th>
                                        <th className="px-4 py-3 text-center font-semibold text-blue-700 border-b-2 border-orange-300">Team {team1}</th>
                                        <th className="px-4 py-3 text-center font-semibold text-red-700 border-b-2 border-orange-300">Team {team2}</th>
                                        <th className="px-4 py-3 text-center font-semibold text-gray-700 border-b-2 border-orange-300">Advantage</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {comparisonStats.map((stat, idx) => (
                                        <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                                            <td className="px-4 py-3 font-medium text-gray-800">{stat.label}</td>
                                            <td className="px-4 py-3 text-center">
                                                <div className="text-sm">
                                                    <div className="font-bold text-blue-700">M: {stat.team1.median}</div>
                                                    <div className="text-xs text-gray-600">Max: {stat.team1.max}</div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <div className="text-sm">
                                                    <div className="font-bold text-red-700">M: {stat.team2.median}</div>
                                                    <div className="text-xs text-gray-600">Max: {stat.team2.max}</div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {stat.team1.median > stat.team2.median ? (
                                                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                                                        Team {team1}
                                                    </span>
                                                ) : stat.team2.median > stat.team1.median ? (
                                                    <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                                                        Team {team2}
                                                    </span>
                                                ) : (
                                                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">
                                                        Tie
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>
            <HotReloadButton />
            <SettingsButton />
        </div>
    );
}