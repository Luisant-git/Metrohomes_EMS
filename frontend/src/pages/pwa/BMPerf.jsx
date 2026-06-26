import { useAuth } from "../../context/AuthContext.jsx";
import { useData } from "../../context/DataContext.jsx";
import { Trophy, TrendingUp } from "lucide-react";

export default function BMPerf() {
  const { user, hierarchy } = useAuth();
  const { bookings, customers, users } = useData();

  const directChildren = hierarchy.getDirectChildren(users);
  const myBDMs = users.filter(u => u.role === "BDM" && directChildren.some(t => t.id === u.parentUserId));
  const myBDMIds = new Set(myBDMs.map(b => b.id));

  const bdmPerformance = myBDMs.map(bdm => {
    const bdmCustomers = customers.filter(c => c.salesManagerId === bdm.id);
    const bdmBookings = bookings.filter(b => b.salesManagerId === bdm.id);
    const revenue = bdmBookings.reduce((sum, b) => sum + (b.plotPrice || 0), 0);
    return { ...bdm, customerCount: bdmCustomers.length, bookingCount: bdmBookings.length, revenue };
  }).sort((a, b) => b.revenue - a.revenue);

  return (
    <div className="pb-4">
      <div className="px-4 py-4">
        <h1 className="text-xl font-bold text-gray-900">Performance Report</h1>
        <p className="text-sm text-gray-400 mt-0.5">BDM rankings</p>
      </div>

      <div className="px-4 space-y-3">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <h3 className="font-bold text-gray-800 text-sm mb-3">🏆 Top Performers</h3>
          <div className="space-y-2">
            {bdmPerformance.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No data available</p>
            ) : (
              bdmPerformance.map((bdm, idx) => (
                <div key={bdm.id} className={`flex items-center gap-3 p-3 rounded-xl ${idx === 0 ? "bg-yellow-50 border border-yellow-200" : "bg-gray-50"}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                    idx === 0 ? "bg-yellow-400 text-white" : idx === 1 ? "bg-gray-300 text-white" : idx === 2 ? "bg-orange-300 text-white" : "bg-gray-200 text-gray-600"
                  }`}>
                    {idx + 1}
                  </div>
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
                    {bdm.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-gray-800 truncate">{bdm.name}</div>
                    <div className="text-xs text-gray-400">{bdm.employeeCode}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-blue-600">₹{(bdm.revenue / 100000).toFixed(1)}L</div>
                    <div className="text-xs text-gray-500">{bdm.bookingCount} bookings</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}