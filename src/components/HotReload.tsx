import { RefreshCw } from "lucide-react";
import { useScoutingStore } from "../app/localDataStore"; // your Zustand store

export default function HotReloadButton() {
  const refetchData = useScoutingStore((state) => state.hotRefresh);

  return (
    <button
      onClick={refetchData}
      className="fixed bottom-2 right-2 p-3 bg-orange-500 text-white rounded-full shadow-lg hover:bg-orange-700 transition duration-300 z-50 cursor-pointer"
      title="Reload Data"
    >
      <RefreshCw size={24} />
    </button>
  );
}
