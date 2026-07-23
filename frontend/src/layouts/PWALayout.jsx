import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { LayoutDashboard, Building2, Users, MapPin, User, LogOut, Bell, ChevronLeft, BarChart3 } from "lucide-react";
import logo from "../assests/logo 1.png";

const ROLE_BOTTOM_NAV = {
  "Regional Manager": [
    { path: "/", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/sites", icon: Building2, label: "Projects" },
    { path: "/my-team", icon: Users, label: "My Team" },
    { path: "/sales-report", icon: BarChart3, label: "Reports" },
    { path: "/profile", icon: User, label: "Profile" },
  ],
  "Branch Manager": [
    { path: "/", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/sites", icon: Building2, label: "Projects" },
    { path: "/my-team", icon: Users, label: "My Team" },
    { path: "/sales-report", icon: BarChart3, label: "Reports" },
    { path: "/profile", icon: User, label: "Profile" },
  ],
  "BDM": [
    { path: "/", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/sites", icon: Building2, label: "Projects" },
    { path: "/my-team", icon: Users, label: "My Team" },
    { path: "/customers", icon: Users, label: "Customers" },
    { path: "/profile", icon: User, label: "Profile" },
  ],
  "Sales Manager": [
    { path: "/", icon: LayoutDashboard, label: "Home" },
    { path: "/sites", icon: Building2, label: "Projects" },
    { path: "/customers", icon: Users, label: "Customers" },
    { path: "/visits", icon: MapPin, label: "Visits" },
    { path: "/profile", icon: User, label: "Profile" },
  ],
};

export default function PWALayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isNested = ["/sites/", "/customers/register"].some(p => location.pathname.startsWith(p) && location.pathname !== p.slice(0, -1));
  const pageTitle = {
    "/": "Dashboard", "/sites": "Sites", "/customers": "Customers",
    "/visits": "Site Visits", "/profile": "Profile",
    "/customers/register": "Register Customer",
  };
  const title = pageTitle[location.pathname] || "Metrohomes";
  const subtitle = { "Admin": "Admin", "Director": "Director", "Regional Manager": "Reg. Manager", "Branch Manager": "Branch Manager", "BDM": "Business Dev. Manager", "Sales Manager": "Sales Manager" }[user?.role] || user?.role;

  return (
    <div className="flex flex-col h-screen bg-gray-50 max-w-md mx-auto relative" style={{ boxShadow: "0 0 60px rgba(0,0,0,0.15)" }}>
      {/* Header */}
      <header className="bg-blue-600 text-white px-4 pt-4 pb-3 flex-shrink-0 shadow-lg">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {isNested ? (
              <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/20 rounded-xl transition-colors flex-shrink-0">
                <ChevronLeft size={22} />
              </button>
            ) : (
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                <img src={logo} alt="Metrohomes" className="h-8 w-auto" />
              </div>
            )}
            {!isNested && (
              <div className="flex-1 min-w-0">
                <div className="font-bold text-lg leading-tight">Metrohomes</div>
                <div className="text-blue-100 text-xs font-medium">{subtitle} · {user?.name?.split(" ")[0]}</div>
              </div>
            )}
          </div>
          {!isNested && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <button className="relative p-2 hover:bg-white/20 rounded-xl transition-colors">
                <Bell size={20} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-400 rounded-full animate-pulse" />
              </button>
              <button onClick={logout} className="p-2 hover:bg-white/20 rounded-xl transition-colors" title="Logout">
                <LogOut size={20} />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto animate-fadeIn">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-white border-t border-gray-100 flex-shrink-0 shadow-xl pwa-safe-bottom">
        <div className="flex items-stretch">
          {(ROLE_BOTTOM_NAV[user?.role] || ROLE_BOTTOM_NAV["Sales Manager"]).map(item => {
            const active = location.pathname === item.path;
            return (
              <button key={item.path} onClick={() => navigate(item.path)}
                className={`flex-1 flex flex-col items-center justify-center py-3 gap-0.5 transition-all duration-200 ${active ? "text-blue-600" : "text-gray-400 hover:text-gray-600"}`}>
                <div className={`p-1.5 rounded-xl transition-all ${active ? "bg-blue-50" : ""}`}>
                  <item.icon size={active ? 22 : 20} strokeWidth={active ? 2.5 : 1.5} />
                </div>
                <span className={`text-xs font-medium ${active ? "text-blue-600" : ""}`}>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
