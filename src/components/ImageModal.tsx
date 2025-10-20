import { useEffect, useState } from "react";
import { X, Search, ArrowLeft, ArrowRight } from "lucide-react";
import type { LiveDataRowWithOPR } from "../app/types";
import { useScoutingStore } from "../app/localDataStore";
import { useNavigate } from "react-router-dom";

export default function ImageModal({
  isOpen,
  onClose,
  teamImage
}: { isOpen: boolean, onClose: VoidFunction, teamImage: string[] }) {

  const [currentViewingImage, setCurrentViewingImage] = useState<number>(0);

  useEffect(() => {
    setCurrentViewingImage(0);
  }, [isOpen])

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/67" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl h-[85vh] overflow-hidden flex flex-col m-4 pointer-events-auto" onClick={(e) => e.stopPropagation()}>

        {/* Content Section */}
        <div className="flex flex-row flex-1 justify-around items-center gap-5 px-5">
          <ArrowLeft className="cursor-pointer hover:scale-115" size={24} onClick={() => setCurrentViewingImage(prev => prev - 1 >= 0 ? prev - 1 : teamImage.length - 1)} />
          <img src={teamImage[currentViewingImage]} alt={`Team Image`} className="h-[70vh] max-w-[80%] object-contain mb-3 select-none relative rounded-lg" />
          <ArrowRight className="cursor-pointer hover:scale-115" size={24} onClick={() => setCurrentViewingImage(prev => prev + 1 > teamImage.length - 1 ? 0 : prev + 1)} />
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-medium cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function capitalizeFirstLetter(str: string) {
  if (typeof str !== 'string' || str.length === 0) {
    return str; // Handle non-string or empty input
  }
  return str.charAt(0).toUpperCase() + str.slice(1);
}