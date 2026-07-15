import { useAuth } from "../../context/AuthContext.jsx";
import { useData } from "../../context/DataContext.jsx";
import { useNavigate } from "react-router-dom";
import { 
  Building2, Users, MapPin, TrendingUp, CheckCircle, Clock, AlertCircle, 
  UserCheck, BarChart3, DollarSign, ArrowRight, UserPlus 
} from "lucide-react";
import StatusBadge from "../../components/StatusBadge.jsx";

export default function PWADashboard() {
  const { user, hierarchy } = useAuth();
  const { users, customers, sites, visits, bookings } = useData();
  const navigate = useNavigate();

  const role = user?.role;

  // Get downline based on role
  const getDownline = () => {
    if (!users.length) return [];
    return hierarchy.getDownline(users);
  };

  const downline = getDownline();

  // Role-specific data
  const getRoleData = () => {
    switch (role) {
      case "Regional Manager": {
        const myBMs = users.filter(u => u.role === "Branch Manager" && u.parentUserId === user?.id);
        const bmIds = myBMs.map(bm => bm.id);
        const allDownlineIds = new Set([user?.id, ...bmIds]);
        
        const myBDMs = users.filter(u => u.role === "BDM" && bmIds.includes(u.parentUserId));
        const mySMs = users.filter(u => u.role === "Sales Manager" && myBDMs.some(bdm => bdm.id === u.parentUserId));
        
        const myCustomers = customers.filter(c => 
          mySMs.some(sm => sm.id === c.salesManagerId) || myBDMs.some(bdm => bdm.id === c.salesManagerId)
        );
        const myVisits = visits.filter(v => 
          mySMs.some(sm => sm.id === v.salesManagerId) || myBDMs.some(bdm => bdm.id === v.salesManagerId)
        );
        const myBookings = bookings.filter(b => 
          mySMs.some(sm => sm.id === b.salesManagerId) || myBDMs.some(bdm => bdm.id === b.salesManagerId)
        );

        return {
          stats: [
            { label: "BM Count", value: myBMs.length, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "BDE Count", value: myBDMs.length, icon: Users, color: "text-cyan-600", bg: "bg-cyan-50" },
            { label: "Sales Managers", value: mySMs.length, icon: Users, color: "text-purple-600", bg: "bg-purple-50" },
            { label: "Total Customers", value: myCustomers.length, icon: UserCheck, color: "text-green-600", bg: "bg-green-50" },
            { label: "Total Bookings", value: myBookings.length, icon: TrendingUp, color: "text-orange-600", bg: "bg-orange-50" },
          ],
          teamTitle: null,
          teamList: null,
          teamEmpty: null,
          teamPath: null,
          quickActions: [
            { label: "My Team", icon: Users, path: "/my-team", color: "bg-blue-500" },
            { label: "Customers", icon: UserCheck, path: "/customers", color: "bg-green-500" },
            { label: "Reports", icon: BarChart3, path: "/sales-report", color: "bg-orange-500" },
          ],
          showPipeline: false,
        };
      }

      case "Branch Manager": {
        const myBDMs = users.filter(u => u.role === "BDM" && u.parentUserId === user?.id);
        const myCustomers = customers.filter(c => myBDMs.some(bdm => bdm.id === c.salesManagerId));
        const myBookings = bookings.filter(b => myBDMs.some(bdm => bdm.id === b.salesManagerId));

        return {
          stats: [
            { label: "BDM Count", value: myBDMs.length, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "My Customers", value: myCustomers.length, icon: UserCheck, color: "text-green-600", bg: "bg-green-50" },
            { label: "Total Bookings", value: myBookings.length, icon: TrendingUp, color: "text-orange-600", bg: "bg-orange-50" },
          ],
          teamTitle: null,
          teamList: null,
          teamEmpty: null,
          teamPath: null,
          quickActions: [
            { label: "My Team", icon: Users, path: "/my-team", color: "bg-blue-500" },
            { label: "Customers", icon: UserCheck, path: "/customers", color: "bg-green-500" },
            { label: "Reports", icon: BarChart3, path: "/sales-report", color: "bg-orange-500" },
          ],
          showPipeline: false,
        };
      }

      case "BDM": {
        const mySMs = users.filter(u => u.role === "Sales Manager" && u.parentUserId === user?.id);
        const myCustomers = customers.filter(c => mySMs.some(sm => sm.id === c.salesManagerId));
        const myBookings = bookings.filter(b => mySMs.some(sm => sm.id === b.salesManagerId));

        return {
          stats: [
            { label: "Sales Managers", value: mySMs.length, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "My Customers", value: myCustomers.length, icon: UserCheck, color: "text-green-600", bg: "bg-green-50" },
            { label: "Total Bookings", value: myBookings.length, icon: TrendingUp, color: "text-orange-600", bg: "bg-orange-50" },
          ],
          teamTitle: "My Sales Managers",
          teamList: mySMs,
          teamEmpty: "No Sales Managers assigned",
          teamPath: "/my-team",
          quickActions: [
            { label: "My Team", icon: Users, path: "/my-team", color: "bg-blue-500" },
            { label: "Sales Targets", icon: TrendingUp, path: "/sales-targets", color: "bg-purple-500" },
            { label: "Customers", icon: UserCheck, path: "/customers", color: "bg-green-500" },
            { label: "Reports", icon: BarChart3, path: "/sales-report", color: "bg-orange-500" },
          ],
          showPipeline: false,
        };
      }

      default: { // Sales Manager
        const myCustomers = customers.filter(c => c.salesManagerId === user?.id || user?.id === 6);
        const myVisits = visits.filter(v => v.salesManagerId === user?.id || user?.id === 6);
        const myActiveSites = sites.filter(s => s.approved);
        const bookCompleted = myCustomers.filter(c => c.status === "Booked" || c.status === "Payment Done").length;

        const statusCounts = {
          Interested: myCustomers.filter(c => c.status === "Interested").length,
          Scheduled: myCustomers.filter(c => c.status === "Visit Scheduled").length,
          Completed: myCustomers.filter(c => c.status === "Visit Completed").length,
          Ready: myCustomers.filter(c => c.status === "Ready for Booking").length,
          Booked: myCustomers.filter(c => c.status === "Booked" || c.status === "Payment Done").length,
        };

        return {
          stats: [
            { label: "My Customers", value: myCustomers.length, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Active Sites", value: myActiveSites.length, icon: Building2, color: "text-green-600", bg: "bg-green-50" },
            { label: "Visits Done", value: myVisits.filter(v => v.status === "Visit Completed").length, icon: CheckCircle, color: "text-purple-600", bg: "bg-purple-50" },
            { label: "Book Completed", value: bookCompleted, icon: TrendingUp, color: "text-orange-600", bg: "bg-orange-50" },
          ],
          teamTitle: null,
          teamList: null,
          teamEmpty: null,
          teamPath: null,
          quickActions: [
            { label: "View Sites", icon: Building2, path: "/sites", color: "bg-blue-500" },
            { label: "My Customers", icon: Users, path: "/customers", color: "bg-purple-500" },
            { label: "Site Visits", icon: MapPin, path: "/visits", color: "bg-orange-500" },
          ],
          showPipeline: true,
          statusCounts,
          myCustomers,
        };
      }
    }
  };

  const data = getRoleData();

  return (
    <div className="pb-4">
      {/* Welcome banner */}
      <div className="rounded-[24px] border border-blue-100 bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-4 text-white shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-blue-100">
              Welcome back
            </div>
            <div className="mt-1 text-[1.1rem] font-bold leading-tight">
              {user?.name?.split(" ")[0]}
            </div>
            <div className="mt-1 text-sm text-blue-50">
              {role} · {user?.branch || user?.region || "HQ"}
            </div>
          </div>
          <div className="rounded-2xl bg-white/15 px-3 py-2 text-right">
            <div className="text-[10px] uppercase tracking-[0.2em] text-blue-100">Today</div>
            <div className="text-sm font-semibold">
              {new Date().toLocaleDateString("en", { month: "short", day: "numeric" })}
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-5 space-y-4">
        {/* Stats Grid */}
        <div className={`grid ${data.stats.length === 3 ? "grid-cols-3" : "grid-cols-2"} gap-3`}>
          {data.stats.map(s => (
            <div key={s.label} className={`bg-white rounded-2xl p-4 shadow-sm border border-gray-100`}>
              <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center mb-2`}>
                <s.icon size={20} className={s.color} />
              </div>
              <div className={`text-2xl font-extrabold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <h3 className="font-bold text-gray-800 text-sm mb-3">Quick Actions</h3>
          <div className={`grid ${data.quickActions.length === 4 ? "grid-cols-2" : "grid-cols-1"} gap-2`}>
            {data.quickActions.map(a => (
              <button key={a.label} onClick={() => navigate(a.path)}
                className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all text-left">
                <div className={`w-9 h-9 ${a.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <a.icon size={18} className="text-white" />
                </div>
                <span className="text-sm font-semibold text-gray-700">{a.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Pipeline - Only for Sales Manager */}
        {data.showPipeline && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <h3 className="font-bold text-gray-800 text-sm mb-3">My Sales Pipeline</h3>
            <div className="space-y-2">
              {[
                { label: "Interested", count: data.statusCounts.Interested, color: "bg-yellow-400" },
                { label: "Visit Scheduled", count: data.statusCounts.Scheduled, color: "bg-blue-400" },
                { label: "Visit Completed", count: data.statusCounts.Completed, color: "bg-purple-400" },
                { label: "Ready for Booking", count: data.statusCounts.Ready, color: "bg-orange-400" },
                { label: "Booked / Paid", count: data.statusCounts.Booked, color: "bg-green-400" },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${s.color} flex-shrink-0`} />
                  <div className="flex-1 flex items-center justify-between">
                    <span className="text-sm text-gray-600">{s.label}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-100 rounded-full h-1.5">
                        <div className={`${s.color} h-1.5 rounded-full`} style={{ width: `${data.myCustomers.length ? (s.count / data.myCustomers.length) * 100 : 0}%` }} />
                      </div>
                      <span className="text-sm font-bold text-gray-800 w-5 text-right">{s.count}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Team List */}
        {data.teamTitle && data.teamList && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-800 text-sm">{data.teamTitle}</h3>
              <button onClick={() => navigate(data.teamPath)} className="text-blue-600 text-xs font-semibold">View All</button>
            </div>
            <div className="space-y-2">
              {data.teamList.length === 0 ? (
                <div className="text-sm text-gray-400 text-center py-4">{data.teamEmpty}</div>
              ) : (
                data.teamList.slice(0, 3).map(member => (
                  <div key={member.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-sm flex-shrink-0">
                      {member.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-gray-800 truncate">{member.name}</div>
                      <div className="text-xs text-gray-400 truncate">
                        {member.employeeCode}{member.branch ? ` · ${member.branch}` : ""}
                      </div>
                    </div>
                    <ArrowRight size={16} className="text-gray-400" />
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Recent Customers - Only for Sales Manager */}
        {data.showPipeline && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-800 text-sm">Recent Customers</h3>
              <button onClick={() => navigate("/customers")} className="text-blue-600 text-xs font-semibold">See all</button>
            </div>
            <div className="space-y-2">
              {data.myCustomers.slice(0, 3).map(c => (
                <div key={c.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">{c.name.charAt(0)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-gray-800 truncate">{c.name}</div>
                    <div className="text-xs text-gray-400 truncate">{c.siteName}</div>
                  </div>
                  <StatusBadge status={c.status} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
