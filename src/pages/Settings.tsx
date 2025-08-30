import { useEffect } from "react";
import { useScoutingStore } from "../app/localDataStore";
import Navbar from "../components/NavBar";
import CustomSelect from "../components/Select";
import HotReloadButton from "../components/HotReload";

export default function Settings() {

    const { loading, loadData, eventName, setEventName, eventKeys, usePracticeData, setUsePracticeData } = useScoutingStore();

    useEffect(() => {
        loadData();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <main className="pt-20 px-0 md:px-6 pr-10">
                {loading ? (
                    <div className="text-orange-500">Loading data...</div>
                ) : (
                    <div className="flex flex-col items-center gap-2">
                    <CustomSelect view={eventName} setView={setEventName} label={'Event Name: '} options={eventKeys}></CustomSelect>
                    <CustomSelect view={usePracticeData} setView={setUsePracticeData} label={'Use practice data '} options={[true, false]}></CustomSelect>
                    </div>
                )}
            </main>

            <HotReloadButton/>
        </div>
    );
}