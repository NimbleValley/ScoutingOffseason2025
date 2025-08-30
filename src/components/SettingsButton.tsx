import { RefreshCw, Settings } from "lucide-react";
import { Link } from "react-router";

export default function SettingsButton() {

    return (
        <Link
            key={'settings'}
            to={'/settings'}
            className="fixed bottom-2 left-2 p-3 bg-orange-500 text-white rounded-full shadow-lg hover:bg-orange-700 transition duration-300 z-50 cursor-pointer"
        >
            <div>
                <Settings></Settings>
            </div>
        </Link>
    );
}
