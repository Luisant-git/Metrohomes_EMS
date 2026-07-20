import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useData } from "../../context/DataContext.jsx";
import { useNavigate } from "react-router-dom";
import { 
  Building2, Users, MapPin, TrendingUp, CheckCircle, Clock, AlertCircle, 
  UserCheck, BarChart3, DollarSign, ArrowRight, UserPlus, Award 
} from "lucide-react";
import StatusBadge from "../../components/StatusBadge.jsx";
import PWAInstallPrompt from "../../components/PWAInstallPrompt.jsx";
import { dashboard, getDownlineRoleCounts } from "../../api/dashboard.js";

export default function PWADashboard() {
  const { user: authUser, hierarchy } = useAuth();
  const { users, customers, sites, visits, bookings } = useData();
  const navigate = useNavigate();
  const [downlineRoleCounts, setDownlineRoleCounts] = useState([]);

  const user = useMemo(() => {
    if (!authUser?.id || !users.length) return authUser;
    const match = users.find(
      (u) => u.employeeCode === authUser.employeeCode || u.email === authUser.email
    );
    return match || authUser;
  }, [authUser, users]);

  useEffect(() => {
    async function fetchDownlineRoleCounts() {
      try {
        const data = await dashboard.getDownlineRoleCounts();
        if (Array.isArray(data)) {
          setDownlineRoleCounts(data);
          return;
        }
      } catch (err) {
        console.warn("Dashboard API unavailable, using local data", err);
      }
      setDownlineRoleCounts(getDownlineRoleCounts(users, user?.id));
    }
    fetchDownlineRoleCounts();
  }, [users, user?.id]);

  const role = user?.role;

  const getDownline = () => {
    if (!users.length || typeof hierarchy?.getDownline !== "function") return [];
    return hierarchy.getDownline(users);
  };

  const downline = getDownline();

  const getRoleData = () => {
    switch (role) {
      case "Regional Manager": {
        const myBMs = users.filter((u) => u.role === "Branch Manager" && u.parentUserId === user?.id);
        const bmIds = myBMs.map((bm) => bm.id);
        const myBDMs = users.filter((u) => u.role === "BDM" && bmIds.includes(u.parentUserId));
        const mySMs = users.filter((u) => u.role === "Sales Manager" && myBDMs.some((bdm) => bdm.id === u.parentUserId));
        const myCustomers = customers.filter((c) =>
          mySMs.some((sm) => sm.id === c.createdById) || myBDMs.some((bdm) => bdm.id === c.createdById)
        );
        const myBookings = bookings.filter((b) =>
          mySMs.some((sm) => sm.id === b.createdById) || myBDMs.some((bdm) => bdm.id === b.createdById)
        );
        return {
          stats: [
            { label: "BM Count", value: myBMs.length, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "BDM Count", value: myBDMs.length, icon: Users, color: "text-cyan-600", bg: "bg-cyan-50" },
            { label: "SM", value: mySMs.length, icon: Users, color: "text-purple-600", bg: "bg-purple-50" },
            { label: "Downline Roles", value: downlineRoleCounts.length, icon: Users, color: "text-indigo-600", bg: "bg-indigo-50" },
            { label: "Total Customers", value: myCustomers.length, icon: UserCheck, color: "text-green-600", bg: "bg-green-50" },
            { label: "Total Bookings", value: myBookings.length, icon: TrendingUp, color: "text-orange-600", bg: "bg-orange-50" },
          ],
          teamTitle: null, teamList: null, teamEmpty: null, teamPath: null,
          quickActions: [
            { label: "My Team", icon: Users, path: "/my-team", color: "bg-blue-500" },
            { label: "Customers", icon: UserCheck, path: "/customers", color: "bg-green-500" },
            { label: "Reports", icon: BarChart3, path: "/sales-report", color: "bg-orange-500" },
          ],
          showPipeline: false,
        };
      }

      case "Branch Manager": {
        const myBDMs = users.filter((u) => u.role === "BDM" && u.parentUserId === user?.id);
        const bdmIds = myBDMs.map((bdm) => bdm.id);
        const mySMs = users.filter((u) => u.role === "Sales Manager" && bdmIds.includes(u.parentUserId));
        const smIds = mySMs.map((sm) => sm.id);
        const myCustomers = customers.filter((c) => bdmIds.includes(c.createdById) || smIds.includes(c.createdById));
        const myBookings = bookings.filter((b) => bdmIds.includes(b.createdById) || smIds.includes(b.createdById));
        return {
          stats: [
            { label: "BDM Count", value: myBDMs.length, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "SM", value: mySMs.length, icon: UserCheck, color: "text-purple-600", bg: "bg-purple-50" },
            { label: "My Customers", value: myCustomers.length, icon: UserCheck, color: "text-green-600", bg: "bg-green-50" },
            { label: "Total Bookings", value: myBookings.length, icon: TrendingUp, color: "text-orange-600", bg: "bg-orange-50" },
          ],
          teamTitle: "My BDMs", teamList: myBDMs, teamEmpty: "No BDMs assigned", teamPath: "/my-team",
          quickActions: [
            { label: "My Team", icon: Users, path: "/my-team", color: "bg-blue-500" },
            { label: "Customers", icon: UserCheck, path: "/customers", color: "bg-green-500" },
            { label: "Reports", icon: BarChart3, path: "/sales-report", color: "bg-orange-500" },
          ],
          showPipeline: false,
        };
      }

      case "BDM": {
        const mySMs = users.filter((u) => u.role === "Sales Manager" && u.parentUserId === user?.id);
        const myCustomers = customers.filter((c) => mySMs.some((sm) => sm.id === c.createdById));
        const myBookings = bookings.filter((b) => mySMs.some((sm) => sm.id === b.createdById));
        return {
          stats: [
            { label: "SM", value: mySMs.length, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Downline Roles", value: downlineRoleCounts.length, icon: Users, color: "text-indigo-600", bg: "bg-indigo-50" },
            { label: "My Customers", value: myCustomers.length, icon: UserCheck, color: "text-green-600", bg: "bg-green-50" },
            { label: "Total Bookings", value: myBookings.length, icon: TrendingUp, color: "text-orange-600", bg: "bg-orange-50" },
          ],
          teamTitle: "My Sales Managers", teamList: mySMs, teamEmpty: "No Sales Managers assigned", teamPath: "/my-team",
          quickActions: [
            { label: "My Team", icon: Users, path: "/my-team", color: "bg-blue-500" },
            { label: "Sales Targets", icon: TrendingUp, path: "/sales-targets", color: "bg-purple-500" },
            { label: "Customers", icon: UserCheck, path: "/customers", color: "bg-green-500" },
            { label: "Reports", icon: BarChart3, path: "/sales-report", color: "bg-orange-500" },
          ],
          showPipeline: false,
        };
      }

      default: {
        const myCustomers = customers.filter((c) => c.createdById === user?.id);
        const myVisits = visits.filter((v) => v.createdById === user?.id);
        const myActiveSites = sites.filter((s) => s.status === "Active");
        const bookCompleted = myCustomers.filter((c) => c.status === "Booked" || c.status === "Payment Done").length;
        const statusCounts = {
          Interested: myCustomers.filter((c) => c.status === "Interested").length,
          Scheduled: myCustomers.filter((c) => c.status === "Visit Scheduled").length,
          Completed: myCustomers.filter((c) => c.status === "Visit Completed").length,
          Ready: myCustomers.filter((c) => c.status === "Ready for Booking").length,
          Booked: myCustomers.filter((c) => c.status === "Booked" || c.status === "Payment Done").length,
        };
        return {
          stats: [
            { label: "My Customers", value: myCustomers.length, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Active Sites", value: myActiveSites.length, icon: Building2, color: "text-green-600", bg: "bg-green-50" },
            { label: "Visits Done", value: myVisits.filter((v) => v.status === "Visit Completed").length, icon: CheckCircle, color: "text-purple-600", bg: "bg-purple-50" },
            { label: "Book Completed", value: bookCompleted, icon: TrendingUp, color: "text-orange-600", bg: "bg-orange-50" },
          ],
          teamTitle: null, teamList: null, teamEmpty: null, teamPath: null,
          quickActions: [
            { label: "Customer Registration", icon: UserPlus, path: "/customer-registration", color: "bg-blue-500" },
            { label: "View Sites", icon: Building2, path: "/sites", color: "bg-purple-500" },
            { label: "My Customers", icon: Users, path: "/customers", color: "bg-orange-500" },
            { label: "Site Visits", icon: MapPin, path: "/visits", color: "bg-emerald-500" },
          ],
          showPipeline: true, statusCounts, myCustomers,
        };
      }
    }
  };

  const data = getRoleData() || {
    stats: [], quickActions: [], showPipeline: false,
    teamTitle: null, teamList: null, teamEmpty: null, teamPath: null,
    statusCounts: {}, myCustomers: [],
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Morning";
    if (hour < 17) return "Afternoon";
    return "Evening";
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-8">
      {/* Welcome Banner with Profile Image */}
      <div className="relative bg-blue-600 text-white pt-5 pb-20 px-5 rounded-b-[32px] shadow-xl overflow-hidden">
        <div className="absolute right-0 bottom-0 pointer-events-none select-none overflow-hidden opacity-35">
          <svg className="w-[300px] h-[220px] translate-y-3" viewBox="0 0 450 260" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="skylineGrad1" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#1E3A8A" stopOpacity="0.1" />
              </linearGradient>
              <linearGradient id="skylineGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#93C5FD" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#1D4ED8" stopOpacity="0.15" />
              </linearGradient>
              <linearGradient id="skylineGrad3" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#BFDBFE" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#1E40AF" stopOpacity="0.2" />
              </linearGradient>
            </defs>
            <rect x="360" y="40" width="65" height="220" rx="3" fill="url(#skylineGrad2)" />
            <path d="M360 40 L392.5 15 L425 40 Z" fill="#93C5FD" fillOpacity="0.6" />
            <rect x="270" y="55" width="75" height="205" rx="4" fill="url(#skylineGrad1)" />
            <polygon points="270,55 345,35 345,55" fill="#60A5FA" fillOpacity="0.8" />
            <rect x="195" y="90" width="60" height="170" rx="3" fill="url(#skylineGrad3)" />
            <rect x="210" y="75" width="30" height="15" fill="url(#skylineGrad3)" />
            <line x1="225" y1="50" x2="225" y2="75" stroke="#BFDBFE" strokeWidth="2" strokeOpacity="0.8" />
            <rect x="140" y="135" width="45" height="125" rx="2" fill="#3B82F6" fillOpacity="0.25" />
            <rect x="345" y="115" width="15" height="145" fill="#2563EB" fillOpacity="0.3" />
          </svg>
        </div>

        <div className="absolute top-0 right-1/4 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-48 h-48 bg-cyan-400/10 rounded-full blur-2xl pointer-events-none" />

        {/* Greeting & User Identity */}
        <div className="relative z-10 flex items-center justify-between gap-6">
          <div className="flex-1 max-w-xl">
            <div className="flex items-center gap-2 text-blue-100 text-sm font-medium tracking-wide">
              <span>Good {getGreeting()},</span>
              <span className="inline-block animate-bounce text-base">👋</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight mt-1 drop-shadow-sm">
              {user?.name ? user.name.split(" ")[0] : "User"}
            </h1>
            <p className="text-blue-100/90 text-sm font-medium mt-1.5 flex items-center gap-2">
              <span>{role}</span>
            </p>
          </div>

          {/* Circular Profile Image */}
          <div className="relative inline-block">
            <div className="w-24 h-24 rounded-full bg-white/20 border-4 border-white/30 flex items-center justify-center overflow-hidden shadow-xl">
              {user?.avatar ? (
                <img src={user.avatar} alt={user?.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl font-extrabold text-white">{user?.name?.charAt(0)}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats content area */}
      <div className="px-4 -mt-10 space-y-4">
        {/* Stats Grid */}
        <div className={`grid ${data.stats.length === 3 ? "grid-cols-3" : "grid-cols-2"} gap-3`}>
          {data.stats.map((s, index) => (
            <div key={s.label} className="group bg-white rounded-3xl p-5 shadow-xl border border-slate-200 transition-all duration-300 -translate-y-1">
              <div className={`w-10 h-10 ${s.bg} rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                <s.icon size={20} className={s.color} />
              </div>
              <div className={`text-2xl font-bold tracking-tighter ${s.color}`}>{s.value}</div>
              <div className="text-xs font-medium text-slate-500 mt-0.5 tracking-wide">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <h3 className="font-semibold text-sm text-slate-900 mb-3 flex items-center gap-2">
            <Award className="text-[#1D6FB9]" size={16} />
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 gap-2">
            {data.quickActions.map((a) => (
              <button key={a.label} onClick={() => navigate(a.path)} className="group flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-[#1D6FB9]/30 hover:bg-gradient-to-r hover:from-[#1D6FB9]/5 hover:to-transparent active:scale-[0.985] transition-all duration-200">
                <div className={`w-9 h-9 rounded-xl ${a.color} flex items-center justify-center shadow-inner transition-transform group-hover:scale-110`}>
                  <a.icon size={16} className="text-white" />
                </div>
                <div>
                  <span className="font-semibold text-slate-800 text-sm">{a.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Sales Pipeline - Sales Manager Only */}
        {data.showPipeline && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <h3 className="font-semibold text-sm text-slate-900 mb-3">Sales Pipeline</h3>
            <div className="space-y-3">
              {[
                { label: "Interested", count: data.statusCounts.Interested, color: "bg-amber-500" },
                { label: "Visit Scheduled", count: data.statusCounts.Scheduled, color: "bg-blue-500" },
                { label: "Visit Completed", count: data.statusCounts.Completed, color: "bg-violet-500" },
                { label: "Ready for Booking", count: data.statusCounts.Ready, color: "bg-orange-500" },
                { label: "Booked / Paid", count: data.statusCounts.Booked, color: "bg-emerald-500" },
              ].map((stage) => {
                const percentage = data.myCustomers.length ? Math.round((stage.count / data.myCustomers.length) * 100) : 0;
                return (
                  <div key={stage.label} className="flex items-center gap-3">
                    <div className="w-24 text-xs font-medium text-slate-600">{stage.label}</div>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full ${stage.color} rounded-full transition-all duration-500`} style={{ width: `${percentage}%` }} />
                    </div>
                    <div className="font-bold text-sm w-10 text-right text-slate-800">{stage.count}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Team Section */}
        {data.teamTitle && data.teamList && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm text-slate-900">{data.teamTitle}</h3>
              <button onClick={() => navigate(data.teamPath)} className="text-[#1D6FB9] hover:text-[#1D6FB9]/80 font-medium text-xs flex items-center gap-1">
                View All <ArrowRight size={14} />
              </button>
            </div>
            <div className="space-y-2">
              {data.teamList.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">{data.teamEmpty}</div>
              ) : (
                data.teamList.slice(0, 3).map((member) => (
                  <div key={member.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="w-9 h-9 bg-gradient-to-br from-indigo-100 to-blue-100 rounded-xl flex items-center justify-center text-indigo-700 font-bold text-sm overflow-hidden flex-shrink-0">
                      {member.avatar ? (
                        <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                      ) : (
                        member.name?.charAt(0)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-slate-900">{member.name}</div>
                      <div className="text-[10px] text-slate-500 truncate">{member.employeeCode} • {member.branch || "Field"}</div>
                    </div>
                    <ArrowRight className="text-slate-300" size={14} />
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Recent Customers - Sales Manager Only */}
        {data.showPipeline && data.myCustomers?.length > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm text-slate-900">Recent Customers</h3>
              <button onClick={() => navigate("/customers")} className="text-[#1D6FB9] hover:text-[#1D6FB9]/80 font-medium text-xs flex items-center gap-1">
                See All <ArrowRight size={14} />
              </button>
            </div>
            <div className="space-y-2">
              {data.myCustomers.slice(0, 4).map((c) => (
                <div key={c.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-all group">
                  <div className="w-9 h-9 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl flex items-center justify-center text-blue-700 font-bold text-sm overflow-hidden flex-shrink-0">
                    {c.avatar ? (
                      <img src={c.avatar} alt={c.name} className="w-full h-full object-cover" />
                    ) : (
                      c.name?.charAt(0)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-slate-900 truncate">{c.name}</div>
                    <div className="text-xs text-slate-500 truncate">{c.siteName}</div>
                  </div>
                  <StatusBadge status={c.status} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
    </div>
  );
}
