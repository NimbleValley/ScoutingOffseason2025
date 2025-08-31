import { useState } from "react";
import { BotMessageSquare, Menu, SquareChevronUp } from "lucide-react";
import { Link, useLocation } from "react-router"; // React Router 7.8.2
import logoSrc from "../assets/icon.png";

const links = [
  { name: "Tables", path: "/" },
  { name: "Ranks", path: "/ranks" },
  { name: "Teams", path: "/teams" },
  { name: "Compare", path: "/compare" },
  { name: "Match", path: "/match" },
  { name: "Pick List", path: "/picklist" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  return (
    <header className="bg-gray-900 fixed w-full top-0 left-0 z-50 select-none drop-shadow-lg">
      <div className="max-w-7xl mx-auto px-4 flex justify-between items-center h-16">
        {/* Logo + Title */}
        <div className="flex items-center gap-3">
          <img src={logoSrc} alt="Logo" className="h-15 w-15 object-contain" />
          <div className="text-2xl font-bold text-orange-400 ml-5">
            Scouting 2025
          </div>
        </div>

        {/* Desktop links */}
        <nav className="hidden lg:flex gap-4">
          {links.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.name}
                to={link.path}
                className="relative text-orange-400 px-3 py-2 rounded group overflow-hidden font-medium text-xl"
              >
                {isActive ? (
                  <span className="absolute inset-0 bg-orange-600 group-hover:bg-orange-800 transition duration-300 rounded"></span>
                ) : (
                  <span className="absolute inset-0 bg-orange-600 scale-y-0 origin-top group-hover:scale-y-100 transition duration-300 rounded"></span>
                )}
                <span
                  className={`relative ${
                    isActive
                      ? "text-white"
                      : "group-hover:text-white transition-colors duration-500"
                  }`}
                >
                  {link.name}
                </span>
              </Link>
            );
          })}
          {/* Coscout button */}
          <Link
            to="/coscout"
            className="relative text-orange-400 px-3 py-2 rounded group overflow-hidden font-medium text-xl"
          >
            <span className="absolute inset-0 bg-gray-500 scale-y-0 origin-top group-hover:scale-y-100 transition duration-300 rounded"></span>
            <BotMessageSquare
              color="orange"
              size={28}
              className="relative"
            />
          </Link>
        </nav>

        {/* Mobile hamburger */}
        <div className="lg:hidden z-50 relative">
          <button onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? (
              <SquareChevronUp size={36} color="white" />
            ) : (
              <Menu size={32} color="white" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile full-screen menu */}
      <div
        className={`lg:hidden fixed inset-0 bg-gray-900 bg-opacity-95 flex flex-col items-center justify-center space-y-8 text-3xl
          transform transition-transform-opacity duration-500
          ${
            isOpen
              ? "translate-y-0 opacity-100"
              : "-translate-y-full opacity-0 pointer-events-none"
          }
        `}
      >
        {links.map((link) => {
          const isActive = location.pathname === link.path;
          return (
            <Link
              key={link.name}
              to={link.path}
              className="relative text-orange-400 px-6 py-3 rounded group overflow-hidden font-medium"
              onClick={() => setIsOpen(false)}
            >
              {isActive && (
                <span className="absolute inset-0 bg-orange-600 rounded"></span>
              )}
              <span
                className={`relative ${
                  isActive
                    ? "text-white"
                    : "group-hover:text-white transition-colors duration-300"
                }`}
              >
                {link.name}
              </span>
            </Link>
          );
        })}
      </div>
    </header>
  );
}
