import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { LayoutDashboard, Building2, Users, MapPin, User, LogOut, Bell, ChevronLeft, TrendingUp, BarChart3, Target } from "lucide-react";

const ROLE_BOTTOM_NAV = {
  "Regional Manager": [
    { path: "/", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/my-team", icon: Users, label: "My Team" },
    { path: "/targets", icon: TrendingUp, label: "Targets" },
    { path: "/sales-report", icon: BarChart3, label: "Reports" },
    { path: "/profile", icon: User, label: "Profile" },
  ],
  "Branch Manager": [
    { path: "/", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/my-team", icon: Users, label: "My Team" },
    { path: "/assign-targets", icon: Target, label: "Targets" },
    { path: "/sales-report", icon: BarChart3, label: "Reports" },
    { path: "/profile", icon: User, label: "Profile" },
  ],
  "BDM": [
    { path: "/", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/my-team", icon: Users, label: "My Team" },
    { path: "/sales-targets", icon: TrendingUp, label: "Targets" },
    { path: "/customers", icon: Users, label: "Customers" },
    { path: "/profile", icon: User, label: "Profile" },
  ],
  "Sales Manager": [
    { path: "/", icon: LayoutDashboard, label: "Home" },
    { path: "/sites", icon: Building2, label: "Sites" },
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
  const title = pageTitle[location.pathname] || "PropEstate";
  const subtitle = { "Admin": "Admin", "Director": "Director", "Regional Manager": "Reg. Manager", "Branch Manager": "Branch Manager", "BDM": "Business Dev. Manager", "Sales Manager": "Sales Manager" }[user?.role] || user?.role;

  return (
    <div className="flex flex-col h-screen bg-gray-50 max-w-md mx-auto relative" style={{ boxShadow: "0 0 60px rgba(0,0,0,0.15)" }}>
      {/* Header */}
      <header className="bg-blue-600 text-white px-4 pt-10 pb-4 flex-shrink-0 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isNested ? (
              <button onClick={() => navigate(-1)} className="p-1 hover:bg-blue-500 rounded-lg transition-colors">
                <ChevronLeft size={22} />
              </button>
            ) : (
              <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                <Building2 size={18} />
              </div>
            )}
            <div>
              <div className="font-bold text-base leading-tight">{isNested ? title : "PropEstate"}</div>
              {!isNested && <div className="text-blue-200 text-xs">{subtitle} · {user?.name?.split(" ")[0]}</div>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isNested && (
              <>
                <button className="relative p-2 hover:bg-blue-500 rounded-xl transition-colors">
                  <Bell size={20} />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-400 rounded-full" />
                </button>
                <button onClick={logout} className="p-2 hover:bg-blue-500 rounded-xl transition-colors" title="Logout">
                  <LogOut size={20} />
                </button>
              </>
            )}
            {isNested && <div className="text-blue-200 text-xs font-medium">{subtitle}</div>}
          </div>
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
