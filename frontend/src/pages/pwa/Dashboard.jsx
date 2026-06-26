import { useAuth } from "../../context/AuthContext.jsx";
import { useData } from "../../context/DataContext.jsx";
import { useNavigate } from "react-router-dom";
import { Building2, Users, MapPin, Plus, TrendingUp, CheckCircle, Clock, AlertCircle } from "lucide-react";
import StatusBadge from "../../components/StatusBadge.jsx";

export default function PWADashboard() {
  const { user } = useAuth();
  const { customers, sites, visits } = useData();
  const navigate = useNavigate();

  const myCustomers = customers.filter(c => c.salesManagerId === user?.id || user?.id === 6);
  const myVisits = visits.filter(v => v.salesManagerId === user?.id || user?.id === 6);
  const myActiveSites = sites.filter(s => s.approved);

  const statusCounts = {
    Interested: myCustomers.filter(c => c.status === "Interested").length,
    Scheduled: myCustomers.filter(c => c.status === "Visit Scheduled").length,
    Completed: myCustomers.filter(c => c.status === "Visit Completed").length,
    Ready: myCustomers.filter(c => c.status === "Ready for Booking").length,
    Booked: myCustomers.filter(c => c.status === "Booked" || c.status === "Payment Done").length,
    Dropped: myCustomers.filter(c => c.status === "Dropped").length,
  };

  const bookCompleted = myCustomers.filter(c => c.status === "Booked" || c.status === "Payment Done").length;

  const quickActions = [
    { label: "View Sites", icon: Building2, path: "/sites", color: "bg-blue-500" },
    { label: "Register Customer", icon: Plus, path: "/customers/register", color: "bg-green-500" },
    { label: "My Customers", icon: Users, path: "/customers", color: "bg-purple-500" },
    { label: "Site Visits", icon: MapPin, path: "/visits", color: "bg-orange-500" },
  ];

  return (
    <div className="pb-4">
      {/* Welcome banner */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 text-white px-4 pt-4 pb-8 -mt-0">
        <div className="text-sm opacity-80 mb-0.5">Good {new Date().getHours() < 12 ? "Morning" : new Date().getHours() < 17 ? "Afternoon" : "Evening"},</div>
        <div className="text-2xl font-extrabold">{user?.name?.split(" ")[0]} 👋</div>
        <div className="text-blue-200 text-sm mt-0.5">{user?.role} · {user?.branch || user?.region || "HQ"}</div>
      </div>

      <div className="px-4 -mt-5 space-y-4">
        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "My Customers", value: myCustomers.length, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Active Sites", value: myActiveSites.length, icon: Building2, color: "text-green-600", bg: "bg-green-50" },
            { label: "Visits Done", value: myVisits.filter(v => v.status === "Visit Completed").length, icon: CheckCircle, color: "text-purple-600", bg: "bg-purple-50" },
            { label: "Book Completed", value: bookCompleted, icon: TrendingUp, color: "text-orange-600", bg: "bg-orange-50" },
          ].map(s => (
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
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map(a => (
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

        {/* Pipeline */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <h3 className="font-bold text-gray-800 text-sm mb-3">My Sales Pipeline</h3>
          <div className="space-y-2">
            {[
              { label: "Interested", count: statusCounts.Interested, color: "bg-yellow-400", icon: AlertCircle },
              { label: "Visit Scheduled", count: statusCounts.Scheduled, color: "bg-blue-400", icon: Clock },
              { label: "Visit Completed", count: statusCounts.Completed, color: "bg-purple-400", icon: CheckCircle },
              { label: "Ready for Booking", count: statusCounts.Ready, color: "bg-orange-400", icon: TrendingUp },
              { label: "Booked / Paid", count: statusCounts.Booked, color: "bg-green-400", icon: CheckCircle },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${s.color} flex-shrink-0`} />
                <div className="flex-1 flex items-center justify-between">
                  <span className="text-sm text-gray-600">{s.label}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-100 rounded-full h-1.5">
                      <div className={`${s.color} h-1.5 rounded-full`} style={{ width: `${myCustomers.length ? (s.count / myCustomers.length) * 100 : 0}%` }} />
                    </div>
                    <span className="text-sm font-bold text-gray-800 w-5 text-right">{s.count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent customers */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-800 text-sm">Recent Customers</h3>
            <button onClick={() => navigate("/customers")} className="text-blue-600 text-xs font-semibold">See all</button>
          </div>
          <div className="space-y-2">
            {myCustomers.slice(0, 3).map(c => (
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
      </div>
    </div>
  );
}
