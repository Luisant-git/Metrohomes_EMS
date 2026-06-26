import { useAuth } from "../../context/AuthContext.jsx";
import { useData } from "../../context/DataContext.jsx";
import { BarChart3, TrendingUp, DollarSign, Users } from "lucide-react";

export default function BMSReport() {
  const { user, hierarchy } = useAuth();
  const { bookings, customers, users } = useData();

  const directChildren = hierarchy.getDirectChildren(users);
  const myBDMs = users.filter(u => u.role === "BDM" && directChildren.some(t => t.id === u.parentUserId));
  const myBDMIds = new Set(myBDMs.map(b => b.id));

  const myBookings = bookings.filter(b => b.salesManagerId && myBDMIds.has(b.salesManagerId));
  const myCustomers = customers.filter(c => c.salesManagerId && myBDMIds.has(c.salesManagerId));

  const totalRevenue = myBookings.reduce((sum, b) => sum + (b.plotPrice || 0), 0);
  const totalPaid = myBookings.reduce((sum, b) => sum + (b.paidAmount || 0), 0);

  return (
    <div className="pb-4">
      <div className="px-4 py-4">
        <h1 className="text-xl font-bold text-gray-900">Sales Report</h1>
        <p className="text-sm text-gray-400 mt-0.5">Team performance overview</p>
      </div>

      <div className="px-4 space-y-3">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-5 text-white">
          <div className="text-sm opacity-80 mb-1">Total Revenue</div>
          <div className="text-3xl font-extrabold">₹{(totalRevenue / 100000).toFixed(1)}L</div>
          <div className="text-blue-200 text-xs mt-2">{myBookings.length} bookings · {myCustomers.length} customers</div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <h3 className="font-bold text-gray-800 text-sm mb-3">Summary</h3>
          <div className="space-y-3">
            {[
              { label: "Total Bookings", value: myBookings.length, icon: BarChart3, color: "text-blue-600", bg: "bg-blue-50" },
              { label: "Total Customers", value: myCustomers.length, icon: Users, color: "text-green-600", bg: "bg-green-50" },
              { label: "Revenue Achieved", value: `₹${(totalPaid / 100000).toFixed(1)}L`, icon: DollarSign, color: "text-purple-600", bg: "bg-purple-50" },
              { label: "Avg. Deal Size", value: `₹${myBookings.length ? ((totalRevenue / myBookings.length) / 100000).toFixed(1) : 0}L`, icon: TrendingUp, color: "text-orange-600", bg: "bg-orange-50" },
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

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <h3 className="font-bold text-gray-800 text-sm mb-3">BDM-wise Performance</h3>
          <div className="space-y-2">
            {myBDMs.slice(0, 5).map(bdm => {
              const bdmCustomers = myCustomers.filter(c => c.salesManagerId === bdm.id);
              const bdmBookings = myBookings.filter(b => b.salesManagerId === bdm.id);
              const revenue = bdmBookings.reduce((sum, b) => sum + (b.plotPrice || 0), 0);
              return (
                <div key={bdm.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-xl">
                  <div>
                    <div className="text-sm font-semibold text-gray-800">{bdm.name}</div>
                    <div className="text-xs text-gray-400">{bdm.employeeCode}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-blue-600">{bdmCustomers.length} Customers</div>
                    <div className="text-xs text-gray-500">₹{(revenue / 100000).toFixed(1)}L Revenue</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}