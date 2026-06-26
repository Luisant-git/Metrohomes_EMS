import { useAuth } from "../../context/AuthContext.jsx";
import { useData } from "../../context/DataContext.jsx";
import { useNavigate } from "react-router-dom";
import { Users, TrendingUp, Building2, Calendar, ArrowRight, DollarSign, UserCheck, BarChart3, UserPlus } from "lucide-react";

export default function PMDashboard() {
  const { user, hierarchy } = useAuth();
  const { users, customers, visits, bookings, sites } = useData();
  const navigate = useNavigate();

  const myBMs = users.filter(u => u.role === "Branch Manager" && u.parentUserId === user?.id);
  
  // Get all team members (BDMs and SMs under this PM's BMs)
  const myTeamUserIds = new Set();
  myBMs.forEach(bm => {
    const bmTeam = users.filter(u => u.parentUserId === bm.id);
    bmTeam.forEach(member => myTeamUserIds.add(member.id));
  });
  
  const customerStats = myTeamUserIds.size > 0 ? customers.filter(c => 
    myTeamUserIds.has(c.salesManagerId)
  ) : [];
  
  const visitStats = myTeamUserIds.size > 0 ? visits.filter(v => 
    myTeamUserIds.has(v.salesManagerId)
  ) : [];
  
  const bookingStats = myTeamUserIds.size > 0 ? bookings.filter(b => 
    myTeamUserIds.has(b.salesManagerId)
  ) : [];
  
  const totalRevenue = bookingStats.reduce((sum, b) => sum + (b.plotPrice || 0), 0);
  const activeSites = sites.filter(s => s.approved);

  const quickActions = [
    { label: "My Team", icon: Users, path: "/my-team", color: "bg-blue-500" },
    { label: "Targets", icon: TrendingUp, path: "/targets", color: "bg-purple-500" },
    { label: "Customers", icon: UserCheck, path: "/customers", color: "bg-green-500" },
    { label: "Reports", icon: BarChart3, path: "/sales-report", color: "bg-orange-500" },
  ];

  return (
    <div className="pb-4">
      <div className="bg-gradient-to-br from-indigo-600 via-blue-700 to-purple-700 text-white px-4 pt-4 pb-8">
        <div className="text-sm opacity-80 mb-0.5">Good {new Date().getHours() < 12 ? "Morning" : new Date().getHours() < 17 ? "Afternoon" : "Evening"},</div>
        <div className="text-2xl font-extrabold">{user?.name?.split(" ")[0]} 👋</div>
        <div className="text-blue-200 text-sm mt-0.5">Regional Manager · {user?.region}</div>
      </div>

      <div className="px-4 -mt-5 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "BDE", value: users.filter(u => u.role === "BDM" && myTeamUserIds.has(u.parentUserId)).length, icon: Users, color: "text-cyan-600", bg: "bg-cyan-50" },
            { label: "Sales Managers", value: users.filter(u => u.role === "Sales Manager" && myTeamUserIds.has(u.parentUserId)).length, icon: Users, color: "text-purple-600", bg: "bg-purple-50" },
            { label: "Total Customers", value: customerStats.length, icon: UserCheck, color: "text-green-600", bg: "bg-green-50" },
            { label: "Total Revenue", value: `₹${(totalRevenue / 100000).toFixed(1)}L`, icon: DollarSign, color: "text-orange-600", bg: "bg-orange-50" },
            { label: "Total Bookings", value: bookingStats.length, icon: TrendingUp, color: "text-red-600", bg: "bg-red-50" },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center mb-2`}>
                <s.icon size={20} className={s.color} />
              </div>
              <div className={`text-xl font-extrabold ${s.color} leading-tight`}>{s.value}</div>
              <div className="text-[10px] text-gray-500 mt-0.5 leading-tight">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <h3 className="font-bold text-gray-800 text-sm mb-3">Quick Actions</h3>
          <div className="grid grid-cols-1 gap-2">
            <button onClick={() => navigate("/add-branch-manager")}
              className="flex items-center gap-3 p-3 rounded-xl border-2 border-dashed border-blue-200 bg-blue-50/50 hover:border-blue-400 hover:bg-blue-50 transition-all text-left w-full">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <UserPlus size={20} className="text-white" />
              </div>
              <span className="text-sm font-bold text-blue-700">Add Branch Manager</span>
            </button>
            <button onClick={() => navigate("/add-bdm")}
              className="flex items-center gap-3 p-3 rounded-xl border-2 border-dashed border-purple-200 bg-purple-50/50 hover:border-purple-400 hover:bg-purple-50 transition-all text-left w-full">
              <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <UserPlus size={20} className="text-white" />
              </div>
              <span className="text-sm font-bold text-purple-700">Add BDM</span>
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
            <h3 className="font-bold text-gray-800 text-sm">My Branch Managers</h3>
            <button onClick={() => navigate("/my-team")} className="text-blue-600 text-xs font-semibold">View All</button>
          </div>
          <div className="space-y-2">
            {myBMs.length === 0 ? (
              <div className="text-sm text-gray-400 text-center py-4">No branch managers assigned</div>
            ) : (
              myBMs.slice(0, 3).map(bm => (
                <div key={bm.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-sm flex-shrink-0">
                    {bm.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-gray-800 truncate">{bm.name}</div>
                    <div className="text-xs text-gray-400 truncate">{bm.employeeCode} · {bm.branch}</div>
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