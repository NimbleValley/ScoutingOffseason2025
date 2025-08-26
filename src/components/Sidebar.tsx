import { useState } from "react";
import { Menu, SquareChevronUp } from "lucide-react";

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

  return (
    <header className="bg-gray-900 fixed w-full top-0 left-0 z-50">
      <div className="max-w-7xl mx-auto px-4 flex justify-between items-center h-16">
        <div className="text-2xl font-bold text-orange-100">Scouting 2025</div>

        {/* Desktop links */}
        <nav className="hidden md:flex gap-4">
          {links.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="relative text-orange-400 px-3 py-2 rounded group overflow-hidden font-medium"
            >
              <span className="absolute inset-0 bg-orange-500 scale-y-0 origin-top group-hover:scale-y-100 transition-transform duration-300 rounded"></span>
              <span className="relative group-hover:text-white transition-colors duration-500">
                {link.name}
              </span>
            </a>
          ))}
        </nav>

        {/* Mobile hamburger */}
        <div className="md:hidden">
          <button onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <SquareChevronUp size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* Mobile full-screen menu */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 bg-gray-900 bg-opacity-95 flex flex-col items-center justify-center space-y-8 text-3xl z-40">
          {links.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="relative text-orange-500 px-6 py-3 rounded group overflow-hidden"
              onClick={() => setIsOpen(false)}
            >
              <span className="absolute inset-0 bg-orange-500 scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-300 rounded"></span>
              <span className="relative group-hover:text-white transition-colors duration-300">
                {link.name}
              </span>
            </a>
          ))}
        </div>
      )}
    </header>
  );
}
