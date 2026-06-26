import { useAuth } from "../../context/AuthContext.jsx";
import { useData } from "../../context/DataContext.jsx";
import { useNavigate } from "react-router-dom";
import { Users, TrendingUp, Building2, Calendar, ArrowRight, DollarSign, UserCheck, BarChart3, UserPlus } from "lucide-react";

export default function BMDashboard() {
  const { user, hierarchy } = useAuth();
  const { users, customers, visits, bookings, sites } = useData();
  const navigate = useNavigate();

  const directChildren = hierarchy.getDirectChildren(users);
  const myBDMs = users.filter(u => u.role === "BDM" && directChildren.some(t => t.id === u.parentUserId));
  
  const myCustomers = customers.filter(c => c.salesManagerId && myBDMs.some(bdm => bdm.id === c.salesManagerId));
  const myVisits = visits.filter(v => v.salesManagerId && myBDMs.some(bdm => bdm.id === v.salesManagerId));
  const myBookings = bookings.filter(b => b.salesManagerId && myBDMs.some(bdm => bdm.id === b.salesManagerId));
  
  const totalRevenue = myBookings.reduce((sum, b) => sum + (b.plotPrice || 0), 0);

  const quickActions = [
    { label: "My Team", icon: Users, path: "/my-team", color: "bg-blue-500" },
    { label: "Assign Targets", icon: TrendingUp, path: "/assign-targets", color: "bg-purple-500" },
    { label: "Customers", icon: UserCheck, path: "/customers", color: "bg-green-500" },
    { label: "Reports", icon: BarChart3, path: "/sales-report", color: "bg-orange-500" },
  ];

  return (
    <div className="pb-4">
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 text-white px-4 pt-4 pb-8">
        <div className="text-sm opacity-80 mb-0.5">Good {new Date().getHours() < 12 ? "Morning" : new Date().getHours() < 17 ? "Afternoon" : "Evening"},</div>
        <div className="text-2xl font-extrabold">{user?.name?.split(" ")[0]} 👋</div>
        <div className="text-blue-200 text-sm mt-0.5">Branch Manager · {user?.branch}</div>
      </div>

      <div className="px-4 -mt-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "BDM Count", value: myBDMs.length, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "My Customers", value: myCustomers.length, icon: UserCheck, color: "text-green-600", bg: "bg-green-50" },
            { label: "Total Revenue", value: `₹${(totalRevenue / 100000).toFixed(1)}L`, icon: DollarSign, color: "text-purple-600", bg: "bg-purple-50" },
            { label: "Total Bookings", value: myBookings.length, icon: TrendingUp, color: "text-orange-600", bg: "bg-orange-50" },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center mb-2`}>
                <s.icon size={20} className={s.color} />
              </div>
              <div className={`text-2xl font-extrabold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <h3 className="font-bold text-gray-800 text-sm mb-3">Quick Actions</h3>
          <div className="grid grid-cols-1 gap-2">
            <button onClick={() => navigate("/add-bdm")}
              className="flex items-center gap-3 p-3 rounded-xl border-2 border-dashed border-blue-200 bg-blue-50/50 hover:border-blue-400 hover:bg-blue-50 transition-all text-left w-full">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <UserPlus size={20} className="text-white" />
              </div>
              <span className="text-sm font-bold text-blue-700">Add BDM</span>
            </button>
            {quickActions.map(a => (
              <button key={a.label} onClick={() => navigate(a.path)}
                className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all text-left w-full">
                <div className={`w-10 h-10 ${a.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <a.icon size={20} className="text-white" />
                </div>
                <span className="text-sm font-semibold text-gray-700">{a.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-800 text-sm">My BDMs</h3>
            <button onClick={() => navigate("/my-team")} className="text-blue-600 text-xs font-semibold">View All</button>
          </div>
          <div className="space-y-2">
            {myBDMs.length === 0 ? (
              <div className="text-sm text-gray-400 text-center py-4">No BDMs assigned</div>
            ) : (
              myBDMs.slice(0, 3).map(bdm => (
                <div key={bdm.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-sm flex-shrink-0">{bdm.name.charAt(0)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-gray-800 truncate">{bdm.name}</div>
                    <div className="text-xs text-gray-400 truncate">{bdm.employeeCode}</div>
                  </div>
                  <ArrowRight size={16} className="text-gray-400" />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}