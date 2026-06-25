import { useState } from "react";
import { useData } from "../../context/DataContext.jsx";
import { Coins, Calculator, ChevronDown, IndianRupee } from "lucide-react";

const ROLE_ORDER = ["Director", "Regional Manager", "Branch Manager", "BDM", "Sales Manager"];

export default function CommissionManagement() {
  const { bookings, commissionRates } = useData();
  const [plotPrice, setPlotPrice] = useState(20000000);
  const [customRates, setCustomRates] = useState({ ...commissionRates });

  const totalCommission = ROLE_ORDER.reduce((a, r) => a + (plotPrice * customRates[r]) / 100, 0);

  const calcCommission = (price, rate) => (price * rate) / 100;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2"><Coins size={22} />Commission Management</h1>
        <p className="text-gray-400 text-sm mt-0.5">Auto-calculated role-wise commission breakdown</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calculator */}
        <div className="card p-6 space-y-5">
          <h3 className="font-bold text-gray-800 flex items-center gap-2"><Calculator size={18} />Commission Calculator</h3>

          <div>
            <label className="label">Plot Price (₹)</label>
            <div className="relative">
              <IndianRupee size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="number" value={plotPrice} onChange={e => setPlotPrice(+e.target.value)} className="input-field pl-10 text-lg font-bold" />
            </div>
            <div className="text-sm text-gray-400 mt-1">= ₹{(plotPrice / 10000000).toFixed(2)} Crore</div>
          </div>

          <div className="bg-blue-50 rounded-2xl p-4 space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-blue-100">
              <span className="text-sm font-bold text-gray-700">Role</span>
              <div className="flex items-center gap-4 text-sm font-bold text-gray-700">
                <span>Rate %</span>
                <span>Amount</span>
              </div>
            </div>
            {ROLE_ORDER.map(role => {
              const rate = customRates[role] || 0;
              const amount = calcCommission(plotPrice, rate);
              const roleColors = { "Director": "bg-purple-100 text-purple-700", "Regional Manager": "bg-blue-100 text-blue-700", "Branch Manager": "bg-green-100 text-green-700", "BDM": "bg-yellow-100 text-yellow-700", "Sales Manager": "bg-orange-100 text-orange-700" };
              return (
                <div key={role} className="flex items-center justify-between">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${roleColors[role]}`}>{role}</span>
                  <div className="flex items-center gap-4">
                    <input type="number" step="0.1" value={rate} onChange={e => setCustomRates(p => ({ ...p, [role]: +e.target.value }))}
                      className="w-16 border border-blue-200 rounded-lg px-2 py-1 text-sm text-center bg-white focus:outline-none focus:ring-2 focus:ring-blue-400" />
                    <span className="text-sm font-bold text-green-600 w-28 text-right">₹{Math.round(amount).toLocaleString("en-IN")}</span>
                  </div>
                </div>
              );
            })}
            <div className="flex justify-between items-center pt-2 border-t border-blue-200 font-bold">
              <span className="text-gray-800">Total Commission</span>
              <span className="text-blue-600 text-lg">₹{Math.round(totalCommission).toLocaleString("en-IN")}</span>
            </div>
            <div className="text-xs text-gray-400 text-right">({((totalCommission / plotPrice) * 100).toFixed(2)}% of plot price)</div>
          </div>
        </div>

        {/* Per-booking commissions */}
        <div className="card p-6">
          <h3 className="font-bold text-gray-800 mb-5">Commission Per Booking</h3>
          <div className="space-y-4">
            {bookings.map(b => (
              <div key={b.id} className="border border-gray-100 rounded-2xl p-4 hover:border-blue-200 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="font-bold text-gray-800">{b.customerName}</div>
                    <div className="text-xs text-gray-400">{b.siteName} · Plot {b.plotNo}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-extrabold text-gray-900">₹{Number(b.plotPrice).toLocaleString("en-IN")}</div>
                    <div className="text-xs text-gray-400">{b.bookingDate}</div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  {ROLE_ORDER.map(role => {
                    const amt = calcCommission(b.plotPrice, customRates[role] || 0);
                    return (
                      <div key={role} className="flex justify-between items-center text-xs">
                        <span className="text-gray-500">{role} ({customRates[role]}%)</span>
                        <span className="font-semibold text-green-600">₹{Math.round(amt).toLocaleString("en-IN")}</span>
                      </div>
                    );
                  })}
                  <div className="flex justify-between items-center text-xs font-bold pt-1 border-t border-gray-100">
                    <span>Total Commission</span>
                    <span className="text-blue-600">₹{Math.round(ROLE_ORDER.reduce((a, r) => a + calcCommission(b.plotPrice, customRates[r] || 0), 0)).toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Commission summary by role */}
      <div className="card p-6">
        <h3 className="font-bold text-gray-800 mb-4">Total Commission Earned (All Bookings)</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {ROLE_ORDER.map(role => {
            const total = bookings.reduce((a, b) => a + calcCommission(b.plotPrice, customRates[role] || 0), 0);
            const roleColors = { "Director": "from-purple-500 to-purple-700", "Regional Manager": "from-blue-500 to-blue-700", "Branch Manager": "from-green-500 to-green-700", "BDM": "from-yellow-500 to-yellow-600", "Sales Manager": "from-orange-500 to-orange-600" };
            return (
              <div key={role} className={`bg-gradient-to-br ${roleColors[role]} rounded-2xl p-4 text-white text-center`}>
                <div className="text-xs font-semibold opacity-80 mb-1">{role}</div>
                <div className="text-xl font-extrabold">₹{(total / 100000).toFixed(1)}L</div>
                <div className="text-xs opacity-70 mt-0.5">{customRates[role]}% rate</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
