import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import {
  LayoutDashboard, Users, Building2, CheckSquare, BookOpen, BarChart3,
  Trophy, Coins, LogOut, Bell, Search, Menu, X, ChevronDown, User,
  FileText, UserCheck, Settings, UserPlus,
} from "lucide-react";
import logo from "../assests/logo 1.png";

const NAV_ITEMS = [
  { path: "/", icon: LayoutDashboard, label: "Dashboard", roles: ["Admin", "Director"] },
  { path: "/users", icon: Users, label: "User Management", roles: ["Admin", "Director"] },
  { path: "/sites", icon: Building2, label: "Site Master", roles: ["Admin", "Director"] },
  { path: "/customers", icon: UserCheck, label: "Customers", roles: ["Admin", "Director"] },
  { path: "/customer-registration", icon: UserPlus, label: "Customer Registration", roles: ["Admin", "Director"] },
  { path: "/bookings", icon: BookOpen, label: "Booking Management", roles: ["Admin", "Director"] },
  { path: "/sales-report", icon: BarChart3, label: "Booking Report", roles: ["Admin", "Director"] },
  { path: "/achievers", icon: Trophy, label: "Achievers Report", roles: ["Admin", "Director"] },
  { path: "/commission", icon: Coins, label: "Commission", roles: ["Admin", "Director"] },
  { path: "/profile", icon: User, label: "Profile", roles: ["Admin", "Director"] },
];

export default function WebLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const filteredNav = NAV_ITEMS.filter(item => item.roles.includes(user?.role));

  const handleLogout = () => { logout(); navigate("/"); };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? "w-64" : "w-16"} bg-white border-r border-gray-100 flex flex-col transition-all duration-300 shadow-sm flex-shrink-0`}>
        {/* Logo */}
        <div className="h-28 flex items-center justify-center px-4 border-b border-gray-100 bg-white">
          {sidebarOpen ? (
            <img src={logo} alt="Logo" className="h-45 w-auto max-w-[220px]" />
          ) : (
            <img src={logo} alt="Logo" className="w-20 h-30" />
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {filteredNav.map(item => {
            const active = location.pathname === item.path;
            return (
              <button key={item.path} onClick={() => navigate(item.path)}
                title={!sidebarOpen ? item.label : ""}
                className={`w-full sidebar-link ${active ? "sidebar-link-active" : "sidebar-link-inactive"}`}>
                <item.icon size={18} className="flex-shrink-0" />
                {sidebarOpen && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-gray-100">
          <button onClick={handleLogout} className={`w-full sidebar-link sidebar-link-inactive text-red-500 hover:bg-red-50 hover:text-red-600`}>
            <LogOut size={18} className="flex-shrink-0" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-gray-100 flex items-center px-6 gap-4 flex-shrink-0 shadow-sm">
          <button onClick={() => setSidebarOpen(p => !p)} className="text-gray-400 hover:text-gray-700 transition-colors">
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div className="flex-1 max-w-sm">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input placeholder="Search…" className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <button className="relative text-gray-400 hover:text-gray-700 p-2 rounded-xl hover:bg-gray-50">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            <div className="relative">
              <button onClick={() => setShowUserMenu(p => !p)}
                className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 rounded-xl px-3 py-2 transition-colors">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  {user?.name?.charAt(0)}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-sm font-semibold text-gray-800 leading-tight">{user?.name}</div>
                  <div className="text-xs text-gray-400">{user?.role}</div>
                </div>
                <ChevronDown size={14} className="text-gray-400" />
              </button>
              {showUserMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                  <button onClick={() => { navigate("/profile"); setShowUserMenu(false); }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
                    <User size={14} /> My Profile
                  </button>
                  <div className="border-t border-gray-100 my-1" />
                  <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50">
                    <LogOut size={14} /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6 animate-fadeIn">
          {children}
        </main>
      </div>
    </div>
  );
}
