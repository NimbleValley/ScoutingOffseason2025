import { useEffect, useState } from "react";
import { useScoutingStore } from "../app/localDataStore";
import HotReloadButton from "../components/HotReload";
import Navbar from "../components/NavBar";
import TableWithChart from "../components/RankChart";
import CustomSelect from "../components/Select";
import SettingsButton from "../components/SettingsButton";
import { numericColumns } from "../app/types";

interface ChartRow {
    team: string;
    value: number;
}

const formatCategory = (str: string) => {
    const result = str.replace(/([A-Z])/g, " $1");
    return result.charAt(0).toUpperCase() + result.slice(1);
};

export default function Ranks() {
    const { teamStats, loading, loadData } = useScoutingStore();

    const [category, setCategory] = useState('total_points');
    const [valueType, setValueType] = useState<'min' | 'max' | 'q3' | 'mean' | 'median'>('median');
    const [showGraph, setShowGraph] = useState<boolean>(true);

    const chartData: ChartRow[] = Object.entries(teamStats).map(([teamNumber, stats]) => ({
        team: teamNumber,
        value: stats[category][valueType], // using totalPoints, change if needed
    })).sort((a, b) => b.value - a.value);

    useEffect(() => {
        loadData(); // Only fetches on first load
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 p-2">
            <Navbar />
            <main className="pt-20 px-0 md:px-6">
                {loading ? (
                    <div className="text-orange-500">Loading data...</div>
                ) : (
                    <div>
                        <div className="flex flex-col lg:flex-row gap-5">
                            <CustomSelect view={category} setView={setCategory} label={'Category:'} options={numericColumns.filter((value) => value != 'team_number')}></CustomSelect>
                            <CustomSelect view={valueType} setView={setValueType} label={'Type:'} options={['min', 'mean', 'median', 'q3', 'max',]}></CustomSelect>
                            <CustomSelect view={showGraph} setView={(v: string | boolean) => setShowGraph(v === true || v === 'true')} label={'Show graph:'} options={[true, false]}></CustomSelect>
                        </div>
                        <div className='h-10' />
                        <TableWithChart data={chartData} category={formatCategory(category)} show={showGraph} ></TableWithChart>
                    </div>
                )}
                <HotReloadButton />
                <SettingsButton/>
            </main>
        </div>
    );
}