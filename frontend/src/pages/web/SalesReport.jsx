import { useData } from "../../context/DataContext.jsx";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { BarChart3, TrendingUp, IndianRupee, UserCheck } from "lucide-react";
import StatusBadge from "../../components/StatusBadge.jsx";

const MONTHLY = [
  { month: "Jan", sales: 4, revenue: 88000000, visits: 18, conversions: 22 },
  { month: "Feb", sales: 6, revenue: 132000000, visits: 24, conversions: 25 },
  { month: "Mar", sales: 5, revenue: 110000000, visits: 20, conversions: 25 },
  { month: "Apr", sales: 8, revenue: 176000000, visits: 32, conversions: 25 },
  { month: "May", sales: 7, revenue: 154000000, visits: 28, conversions: 25 },
  { month: "Jun", sales: 10, revenue: 220000000, visits: 38, conversions: 26 },
];

const SM_PERF = [
  { name: "Anjali Verma", sales: 12, revenue: 264000000, visits: 45, conversion: 27 },
  { name: "Rahul Das", sales: 9, revenue: 198000000, visits: 38, conversion: 24 },
  { name: "Priya Sen", sales: 14, revenue: 308000000, visits: 52, conversion: 27 },
  { name: "Arun Kumar", sales: 7, revenue: 154000000, visits: 30, conversion: 23 },
  { name: "Neha Mishra", sales: 11, revenue: 242000000, visits: 41, conversion: 27 },
];

export default function SalesReport() {
  const { customers, bookings } = useData();
  const totalRevenue = bookings.reduce((a, b) => a + (b.paidAmount || 0), 0);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2"><BarChart3 size={22} />Sales Report</h1>
        <p className="text-gray-400 text-sm mt-0.5">Comprehensive sales performance analytics</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: IndianRupee, label: "Total Revenue", value: `₹${(totalRevenue / 10000000).toFixed(1)}Cr`, color: "text-green-600", bg: "bg-green-50" },
          { icon: BarChart3, label: "Total Sales", value: bookings.length, color: "text-blue-600", bg: "bg-blue-50" },
          { icon: UserCheck, label: "Customers", value: customers.length, color: "text-purple-600", bg: "bg-purple-50" },
          { icon: TrendingUp, label: "Avg Conversion", value: "25.8%", color: "text-orange-600", bg: "bg-orange-50" },
        ].map(s => (
          <div key={s.label} className={`card p-4 ${s.bg}`}>
            <s.icon size={20} className={`${s.color} mb-2`} />
            <div className={`text-2xl font-extrabold ${s.color}`}>{s.value}</div>
            <div className="text-sm text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h3 className="font-bold text-gray-800 mb-4">Monthly Revenue (₹ Crore)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={MONTHLY}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 10000000).toFixed(0)}Cr`} />
              <Tooltip formatter={v => `₹${(v / 10000000).toFixed(1)}Cr`} />
              <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2.5} fill="url(#revGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h3 className="font-bold text-gray-800 mb-4">Sales Count & Site Visits</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={MONTHLY}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="visits" fill="#e0e7ff" radius={[4, 4, 0, 0]} name="Visits" />
              <Bar dataKey="sales" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Sales" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Sales Manager Performance Table */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-800">Sales Manager Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {["Rank", "Sales Manager", "Sales", "Revenue", "Visits", "Conversion %"].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {SM_PERF.sort((a, b) => b.sales - a.sales).map((sm, i) => (
                <tr key={sm.name} className="hover:bg-gray-50/50">
                  <td className="px-5 py-3.5">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? "bg-yellow-100 text-yellow-700" : i === 1 ? "bg-gray-100 text-gray-600" : i === 2 ? "bg-orange-100 text-orange-700" : "bg-gray-50 text-gray-400"}`}>
                      {i + 1}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 font-semibold text-sm text-gray-800">{sm.name}</td>
                  <td className="px-5 py-3.5 text-sm font-bold text-blue-600">{sm.sales}</td>
                  <td className="px-5 py-3.5 text-sm font-semibold text-green-600">₹{(sm.revenue / 10000000).toFixed(1)}Cr</td>
                  <td className="px-5 py-3.5 text-sm text-gray-700">{sm.visits}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-100 rounded-full h-1.5 w-20">
                        <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${sm.conversion}%` }} />
                      </div>
                      <span className="text-xs font-semibold text-gray-600">{sm.conversion}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Status Breakdown */}
      <div className="card p-5">
        <h3 className="font-bold text-gray-800 mb-4">Customer Status Breakdown</h3>
        <div className="flex flex-wrap gap-3">
          {["Interested", "Visit Scheduled", "Visit Completed", "Ready for Booking", "Booked", "Payment Done", "Dropped"].map(s => {
            const count = customers.filter(c => c.status === s).length;
            return (
              <div key={s} className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-2.5">
                <StatusBadge status={s} />
                <span className="font-bold text-gray-800">{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
