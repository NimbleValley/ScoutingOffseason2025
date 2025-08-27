import { useState } from "react";
import { Menu, SquareChevronUp } from "lucide-react";
import logoSrc from "../assets/icon.png";

const links = [
  { name: "Tables", href: "/index.html" },
  { name: "Ranks", href: "/ranks.html" },
  { name: "Teams", href: "/teams.html" },
  { name: "Graph", href: "/graph.html" },
  { name: "Pick List", href: "/picklist.html" },
  { name: "Settings", href: "/settings.html" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeScreen, setActiveScreen] = useState('Tables');

  return (
    <header className="bg-gray-900 fixed w-full top-0 left-0 z-50 select-none drop-shadow-lg">
      <div className="max-w-7xl mx-auto px-4 flex justify-between items-center h-16">
        <div className="flex items-center gap-3">
          <img src={logoSrc} alt="Logo" className="h-15 w-15 object-contain" />
          <div className="text-2xl font-bold text-orange-400 ml-5">Scouting 2025</div>
        </div>

        {/* Desktop links */}
        <nav className="hidden lg:flex gap-4">
          {links.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="relative text-orange-400 px-3 py-2 rounded group overflow-hidden font-medium text-xl"
              onClick={() => {
                setActiveScreen(link.name);
              }}
            >
              {activeScreen == link.name ?

                <span className="absolute inset-0 bg-orange-600 scale-y-100 origin-top group-hover:bg-orange-800 transition-bg duration-300 rounded"></span> :
                <span className="absolute inset-0 bg-orange-500 scale-y-0 origin-top group-hover:scale-y-100 transition-bg duration-300 rounded"></span>
              }
              {activeScreen == link.name ?
                <span className="relative text-white">
                  {link.name}
                </span> :
                <span className="relative group-hover:text-white transition-colors duration-500">
                  {link.name}
                </span>
              }
            </a>
          ))}
        </nav>

        {/* Mobile hamburger */}
        <div className="lg:hidden z-50 relative">
          <button onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <SquareChevronUp size={36} color="white" /> : <Menu size={32} color="white" />}
          </button>
        </div>
      </div>

      {/* Mobile full-screen menu */}
      <div
        className={`lg:hidden fixed inset-0 bg-gray-900 bg-opacity-95 flex flex-col items-center justify-center space-y-8 text-3xl
          transform transition-transform-opacity duration-500
          ${isOpen ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none"}
        `}
      >
        {links.map((link) => (
          <a
            key={link.name}
            href={link.href}
            className="relative text-orange-400 px-6 py-3 rounded group overflow-hidden font-medium"
            onClick={() => setIsOpen(false)}
          >
            <span className="absolute inset-0 bg-orange-500 scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-300 rounded"></span>
            <span className="relative group-hover:text-white transition-colors duration-300">
              {link.name}
            </span>
          </a>
        ))}
      </div>
    </header>
  );
}
