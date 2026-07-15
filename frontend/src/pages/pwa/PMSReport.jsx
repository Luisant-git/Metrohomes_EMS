import { useAuth } from "../../context/AuthContext.jsx";
import { useData } from "../../context/DataContext.jsx";
import { BarChart3, Building2, Users, TrendingUp } from "lucide-react";

export default function PMSReport() {
  const { user, hierarchy } = useAuth();
  const { bookings, customers, users, sites } = useData();

  const directChildren = hierarchy.getDirectChildren(users);
  const directIds = new Set(directChildren.map(c => c.id));
  const myBMs = users.filter(u => u.role === "Branch Manager" && directIds.has(u.parentUserId));
  const myBMIds = new Set(myBMs.map(b => b.id));

  const myBookings = bookings.filter(b => {
    const sm = users.find(u => u.id === b.salesManagerId);
    return sm && myBMIds.has(sm.parentUserId);
  });

  const myCustomers = customers.filter(c => {
    const sm = users.find(u => u.id === c.salesManagerId);
    return sm && myBMIds.has(sm.parentUserId);
  });

  const activeSites = sites.filter(s => s.approved).length;

  return (
    <div className="pb-4">
      <div className="px-4 py-4">
        <h1 className="text-xl font-bold text-gray-900">Sales Report</h1>
        <p className="text-sm text-gray-400 mt-0.5">Team performance overview</p>
      </div>

      <div className="px-4 space-y-3">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <h3 className="font-bold text-gray-800 text-sm mb-3">Summary</h3>
          <div className="space-y-3">
            {[
              { label: "Total Bookings", value: myBookings.length, icon: BarChart3, color: "text-blue-600", bg: "bg-blue-50" },
              { label: "Total Customers", value: myCustomers.length, icon: Users, color: "text-green-600", bg: "bg-green-50" },
              { label: "No of Sites Achieved", value: activeSites, icon: Building2, color: "text-purple-600", bg: "bg-purple-50" },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-3">
                <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <s.icon size={18} className={s.color} />
                </div>
                <div className="flex-1">
                  <div className="text-xs text-gray-400">{s.label}</div>
                  <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}