import { useEffect, useState } from "react";
import { useScoutingStore } from "../app/localDataStore";
import HotReloadButton from "../components/HotReload";
import Navbar from "../components/NavBar";
import TableWithChart from "../components/RankChart";
import CustomSelect from "../components/Select";
import { numericColumns } from "../app/types";
import SettingsButton from "../components/SettingsButton";

export default function Picklist() {
    const { teamStats, loading, loadData } = useScoutingStore();

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
                        
                    </div>
                )}
                <HotReloadButton />
                <SettingsButton/>
            </main>
        </div>
    );
}