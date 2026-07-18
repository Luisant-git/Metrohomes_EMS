import { useAuth } from "../../context/AuthContext.jsx";
import { useData } from "../../context/DataContext.jsx";
import { DollarSign, TrendingUp, Calendar, CheckCircle } from "lucide-react";

export default function PWABookings() {
  const { user, hierarchy } = useAuth();
  const { bookings, users } = useData();

  const directChildren = hierarchy.getDirectChildren(users);
  const directIds = new Set(directChildren.map(c => c.id));
  const myBMs = users.filter(u => u.role === "Branch Manager" && directIds.has(u.parentUserId));
  const myBMIds = new Set(myBMs.map(b => b.id));

  const myBookings = bookings.filter(b => {
    const salesManager = users.find(u => u.id === b.salesManagerId);
    return salesManager && myBMIds.has(salesManager.parentUserId);
  });

  const totalRevenue = myBookings.reduce((sum, b) => sum + (b.plotPrice || 0), 0);
  const totalPaid = myBookings.reduce((sum, b) => sum + (b.paidAmount || 0), 0);

  return (
    <div className="pb-4">
      <div className="px-4 py-4">
        <h1 className="text-xl font-bold text-gray-900">Booking Overview</h1>
        <p className="text-sm text-gray-400 mt-0.5">Team booking performance</p>
      </div>

      <div className="px-4 space-y-3">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <h3 className="font-bold text-gray-800 text-sm mb-3">Summary</h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Total Bookings", value: myBookings.length, color: "text-blue-600" },
              { label: "Total Revenue", value: `₹${(totalRevenue / 100000).toFixed(1)}L`, color: "text-green-600" },
              { label: "Amount Paid", value: `₹${(totalPaid / 100000).toFixed(1)}L`, color: "text-purple-600" },
              { label: "Pending", value: myBookings.filter(b => b.remainingAmount > 0).length, color: "text-orange-600" },
            ].map(s => (
              <div key={s.label} className="text-center p-3 bg-gray-50 rounded-xl">
                <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-gray-400">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <h3 className="font-bold text-gray-800 text-sm mb-3">Recent Bookings</h3>
          <div className="space-y-2">
            {myBookings.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No bookings found</p>
            ) : (
              myBookings.slice(0, 5).map(b => (
                <div key={b.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-700 flex-shrink-0">
                    <DollarSign size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-gray-800 truncate">{b.customerName}</div>
                    <div className="text-xs text-gray-400 truncate">{b.siteName} · {b.plotNo}</div>
                    <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                      <Calendar size={10} />{b.bookingDate}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-gray-800">₹{(b.plotPrice / 100000).toFixed(1)}L</div>
                    <div className={`text-xs font-semibold ${b.status === "Payment Done" ? "text-green-600" : "text-orange-600"}`}>{b.status}</div>
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