import { useEffect, useMemo, useState } from "react";
import { useScoutingStore } from "../app/localDataStore";
import HotReloadButton from "../components/HotReload"
import Navbar from "../components/NavBar"
import SettingsButton from "../components/SettingsButton"
import CustomSelect from "../components/Select";

const Compare = () => {

    const { teamStats, loading, loadData } = useScoutingStore();

    useEffect(() => {
        loadData(); // Only fetches on first load
    }, []);

    const [team1, setTeam1] = useState<number>(-1);
    const [team2, setTeam2] = useState<number>(-1);
    const [team3, setTeam3] = useState<number>(-1);

    const [teamList, setTeamList] = useState<number[]>([]);

    useEffect(() => {
        setTeamList(Object.keys(teamStats)
            .map((t) => teamStats[parseInt(t)].team_number.max));
    }, [teamStats]);

    return (
        <div className="min-h-screen bg-gray-50 p-2">
            <Navbar />
            <main className="pt-20 px-0 md:px-6">
                {loading ? (
                    <div className="text-orange-500 m-15 text-2xl font-bold animate-bounce">Loading data...</div>
                ) : (
                    <div>

                        <div className=" bg-white shadow-md rounded-lg px-10 py-6 flex gap-10">
                            <h1 className="text-xl font-semibold">Team Comparison</h1>
                            <CustomSelect view={team1} setView={setTeam1} options={[-1, ...teamList]} label={'Team 1:'} />
                            <CustomSelect view={team2} setView={setTeam2} options={[-1, ...teamList]} label={'Team 2:'} />
                            <CustomSelect view={team3} setView={setTeam3} options={[-1, ...teamList]} label={'Team 3:'} />
                        </div>

                    </div>
                )}
                <HotReloadButton />
                <SettingsButton />
            </main>
        </div>
    )
}

export default Compare;