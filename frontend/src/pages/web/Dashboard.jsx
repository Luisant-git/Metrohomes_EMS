import { useData } from "../../context/DataContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import StatCard from "../../components/StatCard.jsx";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Users, Building2, UserCheck, BookOpen, TrendingUp, IndianRupee, MapPin, Trophy } from "lucide-react";

const MONTHLY = [
  { month: "Jan", sales: 4, revenue: 88000000 },
  { month: "Feb", sales: 6, revenue: 132000000 },
  { month: "Mar", sales: 5, revenue: 110000000 },
  { month: "Apr", sales: 8, revenue: 176000000 },
  { month: "May", sales: 7, revenue: 154000000 },
  { month: "Jun", sales: 10, revenue: 220000000 },
];

const PERF = [
  { name: "Anjali Verma", sales: 12, target: 15 },
  { name: "Rahul Das", sales: 9, target: 10 },
  { name: "Priya Sen", sales: 14, target: 12 },
  { name: "Arun K", sales: 7, target: 10 },
  { name: "Neha M", sales: 11, target: 11 },
];

const PIE_DATA = [
  { name: "Booked", value: 35, color: "#22c55e" },
  { name: "Visit Done", value: 25, color: "#8b5cf6" },
  { name: "Interested", value: 20, color: "#f59e0b" },
  { name: "Dropped", value: 20, color: "#ef4444" },
];

export default function WebDashboard() {
  const { users, customers, sites, bookings } = useData();
  const { user } = useAuth();

  const totalRevenue = bookings.reduce((a, b) => a + (b.paidAmount || 0), 0);
  const activeSites = sites.filter(s => s.approved).length;
  const bookedCustomers = customers.filter(c => c.status === "Booked" || c.status === "Payment Done").length;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Dashboard</h1>
        <p className="text-gray-400 text-sm mt-0.5">Welcome back, {user?.name} · {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={IndianRupee} label="Total Revenue" value={`₹${(totalRevenue / 10000000).toFixed(1)}Cr`} change={12} color="green" />
        <StatCard icon={BookOpen} label="Total Bookings" value={bookings.length} change={8} color="blue" />
        <StatCard icon={UserCheck} label="Active Customers" value={customers.length} change={15} color="purple" />
        <StatCard icon={Building2} label="Active Sites" value={activeSites} change={5} color="orange" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Users" value={users.length} color="blue" />
        <StatCard icon={MapPin} label="Site Visits" value={customers.filter(c => c.status !== "Interested").length} color="purple" />
        <StatCard icon={TrendingUp} label="Conversion Rate" value="34%" change={3} color="green" />
        <StatCard icon={Trophy} label="Top Performers" value={5} color="yellow" />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Revenue */}
        <div className="lg:col-span-2 card p-5">
          <h3 className="font-bold text-gray-800 mb-4">Monthly Revenue & Sales</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={MONTHLY}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 10000000).toFixed(0)}Cr`} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v, name) => name === "revenue" ? `₹${(v / 10000000).toFixed(1)}Cr` : v} />
              <Bar yAxisId="left" dataKey="revenue" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Revenue" />
              <Bar yAxisId="right" dataKey="sales" fill="#8b5cf6" radius={[6, 6, 0, 0]} name="Sales" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie */}
        <div className="card p-5">
          <h3 className="font-bold text-gray-800 mb-4">Customer Status</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={PIE_DATA} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                {PIE_DATA.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(v) => `${v}%`} />
              <Legend iconType="circle" iconSize={8} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance */}
        <div className="card p-5">
          <h3 className="font-bold text-gray-800 mb-4">Sales Performance vs Target</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={PERF} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={80} />
              <Tooltip />
              <Bar dataKey="target" fill="#e5e7eb" radius={[0, 4, 4, 0]} name="Target" />
              <Bar dataKey="sales" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Sales" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly trend */}
        <div className="card p-5">
          <h3 className="font-bold text-gray-800 mb-4">Sales Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={MONTHLY}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={2.5} dot={{ fill: "#3b82f6", r: 4 }} name="Sales" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent activity */}
      <div className="card p-5">
        <h3 className="font-bold text-gray-800 mb-4">Recent Bookings</h3>
        <div className="space-y-3">
          {[
            { name: "Ramesh Gupta", site: "Green Valley Residency", amount: "₹1.1 Cr", date: "Apr 12", status: "Booked" },
            { name: "Pooja Mehrotra", site: "Emerald Heights", amount: "₹76 L", date: "Mar 18", status: "Payment Done" },
          ].map((b, i) => (
            <div key={i} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
              <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 font-bold text-sm">
                {b.name.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-sm text-gray-800">{b.name}</div>
                <div className="text-xs text-gray-400">{b.site} · {b.date}</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-sm text-gray-900">{b.amount}</div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${b.status === "Payment Done" ? "bg-emerald-100 text-emerald-700" : "bg-green-100 text-green-700"}`}>{b.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
