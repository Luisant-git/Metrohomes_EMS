import { useAuth } from "../../context/AuthContext.jsx";
import { useData } from "../../context/DataContext.jsx";
import { Trophy, TrendingUp } from "lucide-react";

export default function BDMPerf() {
  const { user, hierarchy } = useAuth();
  const { bookings, customers, users } = useData();

  const directChildren = hierarchy.getDirectChildren(users);
  const mySMs = users.filter(u => u.role === "Sales Manager" && directChildren.some(t => t.id === u.parentUserId));
  const mySMIds = new Set(mySMs.map(s => s.id));

  const smPerformance = mySMs.map(sm => {
    const smCustomers = customers.filter(c => c.salesManagerId === sm.id);
    const smBookings = bookings.filter(b => b.salesManagerId === sm.id);
    const revenue = smBookings.reduce((sum, b) => sum + (b.plotPrice || 0), 0);
    return { ...sm, customerCount: smCustomers.length, bookingCount: smBookings.length, revenue };
  }).sort((a, b) => b.revenue - a.revenue);

  return (
    <div className="pb-4">
      <div className="px-4 py-4">
        <h1 className="text-xl font-bold text-gray-900">Performance</h1>
        <p className="text-sm text-gray-400 mt-0.5">Sales Manager rankings</p>
      </div>

      <div className="px-4 space-y-3">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <h3 className="font-bold text-gray-800 text-sm mb-3">🏆 Top Performers</h3>
          <div className="space-y-2">
            {smPerformance.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No data available</p>
            ) : (
              smPerformance.map((sm, idx) => (
                <div key={sm.id} className={`flex items-center gap-3 p-3 rounded-xl ${idx === 0 ? "bg-yellow-50 border border-yellow-200" : "bg-gray-50"}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                    idx === 0 ? "bg-yellow-400 text-white" : idx === 1 ? "bg-gray-300 text-white" : idx === 2 ? "bg-orange-300 text-white" : "bg-gray-200 text-gray-600"
                  }`}>
                    {idx + 1}
                  </div>
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
                    {sm.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-gray-800 truncate">{sm.name}</div>
                    <div className="text-xs text-gray-400">{sm.employeeCode}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-blue-600">₹{(sm.revenue / 100000).toFixed(1)}L</div>
                    <div className="text-xs text-gray-500">{sm.bookingCount} bookings</div>
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