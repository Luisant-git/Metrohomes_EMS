import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import {
  LayoutDashboard, Users, Building2, CheckSquare, BookOpen, BarChart3,
  Trophy, Coins, LogOut, Bell, Search, ChevronDown, User,
  FileText, UserCheck, Settings, UserPlus, Menu, X,
} from "lucide-react";
import logo from "../assests/logo 1.png";

const NAV_ITEMS = [
  { path: "/", icon: LayoutDashboard, label: "Dashboard", roles: ["Admin", "Director"] },
  { path: "/users", icon: Users, label: "User Management", roles: ["Admin", "Director"] },
  { path: "/sites", icon: Building2, label: "Project Master", roles: ["Admin", "Director"] },
  { path: "/customers", icon: UserCheck, label: "Project Visit", roles: ["Admin", "Director"] },
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
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const filteredNav = NAV_ITEMS.filter(item => item.roles.includes(user?.role));

  const handleLogout = () => { logout(); navigate("/"); };

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-100 flex flex-col shadow-[0_0_0_1px_rgba(0,0,0,0.03)] flex-shrink-0
        transition-transform duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        {/* Logo + Close button */}
        <div className="h-28 flex items-center justify-between px-6 border-b border-gray-100">
          <img src={logo} alt="Logo" className="h-45 w-auto max-w-[180px]" />
          <button
            onClick={closeSidebar}
            className="lg:hidden p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {filteredNav.map(item => {
            const active = location.pathname === item.path;
            return (
              <button key={item.path} onClick={() => { navigate(item.path); closeSidebar(); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-200 cursor-pointer ${active ? "bg-blue-600 text-white shadow-[0_8px_24px_rgba(29,111,185,0.35)]" : "text-gray-600 hover:bg-blue-50 hover:text-blue-600"}`}>
                <item.icon size={18} />
                <span className="truncate tracking-tight">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-gray-100">
          <button onClick={() => { handleLogout(); closeSidebar(); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer">
            <LogOut size={18} />
            <span className="tracking-tight">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-gray-100 flex items-center px-4 sm:px-6 gap-4 flex-shrink-0 shadow-sm">
          {/* Mobile Hamburger */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Menu size={20} />
          </button>

          <div className="flex-1 max-w-sm hidden sm:block">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input placeholder="Search…" className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 ml-auto">
            <button className="relative text-gray-400 hover:text-gray-700 p-2 rounded-xl hover:bg-gray-50">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            <div className="relative">
              <button onClick={() => setShowUserMenu(p => !p)}
                className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 rounded-xl px-2 sm:px-3 py-2 transition-colors">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold overflow-hidden">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    user?.name?.charAt(0)
                  )}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-sm font-semibold text-gray-800 leading-tight">{user?.name}</div>
                  <div className="text-xs text-gray-400">{user?.role}</div>
                </div>
                <ChevronDown size={14} className="text-gray-400 hidden sm:block" />
              </button>
              {showUserMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                  <button onClick={() => { navigate("/profile"); setShowUserMenu(false); closeSidebar(); }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
                    <User size={14} /> My Profile
                  </button>
                  <div className="border-t border-gray-100 my-1" />
                  <button onClick={() => { handleLogout(); setShowUserMenu(false); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50">
                    <LogOut size={14} /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 animate-fadeIn">
          {children}
        </main>
      </div>
    </div>
  );
}