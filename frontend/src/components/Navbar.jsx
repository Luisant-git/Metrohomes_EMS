export default function Navbar({ activePage, setActivePage }) {
  const links = [
    { id: "home", label: "Home" },
    { id: "about", label: "About" },
    { id: "api", label: "API Demo" },
  ];

  return (
    <nav className="bg-gray-900 text-white shadow-lg">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-md">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight">
            React<span className="text-violet-400">+</span>Express
          </span>
        </div>

        {/* Nav Links */}
        <ul className="flex items-center gap-1">
          {links.map((link) => (
            <li key={link.id}>
              <button
                onClick={() => setActivePage(link.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activePage === link.id
                    ? "bg-violet-600 text-white shadow"
                    : "text-gray-300 hover:text-white hover:bg-gray-700"
                }`}
              >
                {link.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
