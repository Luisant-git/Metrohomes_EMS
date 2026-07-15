import { useMemo } from "react";
import { useData } from "../../context/DataContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import StatCard from "../../components/StatCard.jsx";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Users, Building2, UserCheck, BookOpen, TrendingUp, IndianRupee, MapPin, Trophy } from "lucide-react";

const MONTHLY = [
  { month: "Jan", sales: 4, revenue: 88000000 },
  { month: "Feb", sales: 6, revenue: 132000000 },
  { month: "Mar", sales: 5, revenue: 110000000 },
  { month: "Apr", sales: 8, revenue: 176000000 },
  { month: "May", sales: 7, revenue: 154000000 },
  { month: "Jun", sales: 10, revenue: 220000000 },
];

export default function WebDashboard() {
  const { users, customers, sites, bookings } = useData();
  const { user, hierarchy } = useAuth();

  // Get all Sales Manager IDs in this user's hierarchy
  const teamSmIds = useMemo(() => {
    const isAdminOrDirector = ["Admin", "Director"].includes(user?.role);
    if (isAdminOrDirector) {
      return users.filter(u => u.role === "Sales Manager").map(u => u.id);
    }
    const downline = hierarchy.getDownline(users);
    const teamMembers = [user, ...downline].filter(Boolean);
    const smIds = teamMembers.filter(u => u.role === "Sales Manager").map(u => u.id);
    // Also include Sales Managers who are in the downline
    const allSmInDownline = downline.filter(u => u.role === "Sales Manager").map(u => u.id);
    return [...new Set([...smIds, ...allSmInDownline])];
  }, [users, user, hierarchy]);

  // Filter data to only show what belongs to this user's team
  const teamCustomers = useMemo(() => {
    return customers.filter(c => teamSmIds.includes(c.salesManagerId));
  }, [customers, teamSmIds]);

  const teamBookings = useMemo(() => {
    return bookings.filter(b => teamSmIds.includes(b.salesManagerId));
  }, [bookings, teamSmIds]);

  const teamUsers = useMemo(() => {
    const isAdminOrDirector = ["Admin", "Director"].includes(user?.role);
    if (isAdminOrDirector) return users;
    const downline = hierarchy.getDownline(users);
    return [user, ...downline].filter(Boolean);
  }, [users, user, hierarchy]);

  const totalRevenue = teamBookings.reduce((a, b) => a + (b.paidAmount || 0), 0);
  const activeSites = sites.filter(s => s.approved).length;
  const bookedCustomers = teamCustomers.filter(c => c.status === "Booked" || c.status === "Payment Done").length;
  const teamVisits = teamCustomers.filter(c => c.status !== "Interested").length;

  // Customer status breakdown for chart
  const statusCounts = useMemo(() => {
    const counts = {};
    teamCustomers.forEach(c => {
      counts[c.status] = (counts[c.status] || 0) + 1;
    });
    const statusColors = {
      "Booked": "#22c55e",
      "Payment Done": "#16a34a",
      "Visit Completed": "#8b5cf6",
      "Visit Scheduled": "#3b82f6",
      "Ready for Booking": "#f59e0b",
      "Interested": "#f59e0b",
      "Dropped": "#ef4444",
    };
    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
      color: statusColors[name] || "#6b7280"
    }));
  }, [teamCustomers]);

  // Top performers from this team
  const topPerformers = useMemo(() => {
    const smBookings = {};
    teamBookings.forEach(b => {
      const sm = users.find(u => u.id === b.salesManagerId);
      if (sm) {
        smBookings[sm.id] = smBookings[sm.id] || { name: sm.name, sales: 0, revenue: 0 };
        smBookings[sm.id].sales += 1;
        smBookings[sm.id].revenue += b.paidAmount || 0;
      }
    });
    return Object.values(smBookings)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5)
      .map((s, i) => ({ ...s, target: Math.round(s.sales * 1.3) }));
  }, [teamBookings, users]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Dashboard</h1>
        <p className="text-gray-400 text-sm mt-0.5">
          Welcome back, {user?.name} ({user?.role}) · {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          {!["Admin", "Director"].includes(user?.role) && (
            <span className="ml-2 text-blue-500 font-medium">· Team: {teamUsers.length} members</span>
          )}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={IndianRupee} label="Team Revenue" value={`₹${(totalRevenue / 10000000).toFixed(1)}Cr`} change={12} color="green" />
        <StatCard icon={BookOpen} label="Team Bookings" value={teamBookings.length} change={8} color="blue" />
        <StatCard icon={UserCheck} label="Team Customers" value={teamCustomers.length} change={15} color="purple" />
        <StatCard icon={Building2} label="Active Sites" value={activeSites} change={5} color="orange" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Team Members" value={teamUsers.length} color="blue" />
        <StatCard icon={MapPin} label="Site Visits" value={teamVisits} color="purple" />
        <StatCard icon={TrendingUp} label="Conversion Rate" value={teamCustomers.length > 0 ? `${Math.round((bookedCustomers / teamCustomers.length) * 100)}%` : "0%"} change={3} color="green" />
        <StatCard icon={Trophy} label="Top Performers" value={topPerformers.length} color="yellow" />
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

        {/* Customer Status Pie */}
        <div className="card p-5">
          <h3 className="font-bold text-gray-800 mb-4">Team Customer Status</h3>
          {statusCounts.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={statusCounts} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                  {statusCounts.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v) => `${v} customers`} />
                <Legend iconType="circle" iconSize={8} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[240px] text-gray-400 text-sm">
              No customer data for your team
            </div>
          )}
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Performance */}
        <div className="card p-5">
          <h3 className="font-bold text-gray-800 mb-4">Team Sales Performance</h3>
          {topPerformers.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={topPerformers} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={90} />
                <Tooltip />
                <Bar dataKey="target" fill="#e5e7eb" radius={[0, 4, 4, 0]} name="Target" />
                <Bar dataKey="sales" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Sales" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-gray-400 text-sm">
              No sales data for your team
            </div>
          )}
        </div>

        {/* Recent team bookings */}
        <div className="card p-5">
          <h3 className="font-bold text-gray-800 mb-4">Recent Team Bookings</h3>
          {teamBookings.length > 0 ? (
            <div className="space-y-3">
              {teamBookings.slice(0, 5).map((b, i) => {
                const smUser = users.find(u => u.id === b.salesManagerId);
                return (
                  <div key={b.id || i} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                    <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 font-bold text-sm overflow-hidden flex-shrink-0">
                      {smUser?.avatar ? (
                        <img src={smUser.avatar} alt={smUser.name} className="w-full h-full object-cover" />
                      ) : (
                        b.customerName?.charAt(0)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-gray-800 truncate">{b.customerName}</div>
                      <div className="text-xs text-gray-400 truncate">{b.siteName} · {b.bookingDate}</div>
                      <div className="text-[10px] text-gray-400">SM: {b.salesManagerName}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-bold text-sm text-gray-900">₹{(b.plotPrice / 100000).toFixed(0)}L</div>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${b.status === "Payment Done" ? "bg-emerald-100 text-emerald-700" : "bg-green-100 text-green-700"}`}>{b.status}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-gray-400 text-sm">
              No bookings for your team yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}