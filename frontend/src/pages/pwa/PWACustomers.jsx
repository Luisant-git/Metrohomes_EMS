import { useState, useMemo } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useData } from "../../context/DataContext.jsx";
import { useNavigate } from "react-router-dom";
import { UserCheck, UserX } from "lucide-react";
import StatusBadge from "../../components/StatusBadge.jsx";

export default function PWACustomers() {
  const { user, hierarchy } = useAuth();
  const { customers, users } = useData();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState("All");

  const directChildren = hierarchy.getDirectChildren(users);
  const directIds = new Set(directChildren.map(c => c.id));
  const myBMs = users.filter(u => u.role === "Branch Manager" && directIds.has(u.parentUserId));

  const myBMIds = new Set(myBMs.map(b => b.id));

  // Get all user IDs in this team's hierarchy (user's team)
  const teamUserIds = useMemo(() => {
    const allTeam = [user, ...directChildren].filter(Boolean);
    const bmIds = allTeam.filter(u => u.role === "Branch Manager").map(u => u.id);
    // Also include all users under Branch Managers
    const allInTeam = users.filter(u => u.parentUserId && bmIds.includes(u.parentUserId));
    const allIds = [...allTeam, ...allInTeam].map(u => u.id);
    return [...new Set(allIds)];
  }, [user, directChildren, users]);

  // Filter customers by createdById matching team members
  const myCustomers = customers.filter(c => {
    return teamUserIds.includes(c.createdById);
  });

  const filteredCustomers = statusFilter === "All" ? myCustomers : myCustomers.filter(c => c.status === statusFilter);

  const statusCounts = {
    All: myCustomers.length,
    Interested: myCustomers.filter(c => c.status === "Interested").length,
    Scheduled: myCustomers.filter(c => c.status === "Visit Scheduled").length,
    Completed: myCustomers.filter(c => c.status === "Visit Completed").length,
    Ready: myCustomers.filter(c => c.status === "Ready for Booking").length,
    Booked: myCustomers.filter(c => c.status === "Booked" || c.status === "Payment Done").length,
    Dropped: myCustomers.filter(c => c.status === "Dropped").length,
  };

  const filterOptions = [
    { key: "All", label: "All", count: statusCounts.All },
    { key: "Interested", label: "Interested", count: statusCounts.Interested },
    { key: "Scheduled", label: "Visit Scheduled", count: statusCounts.Scheduled },
    { key: "Completed", label: "Visit Completed", count: statusCounts.Completed },
    { key: "Ready", label: "Ready to Book", count: statusCounts.Ready },
    { key: "Booked", label: "Booked / Paid", count: statusCounts.Booked },
    { key: "Dropped", label: "Dropped", count: statusCounts.Dropped },
  ];

  return (
    <div className="pb-4">
      <div className="px-4 py-4">
        <h1 className="text-xl font-bold text-gray-900">Customer Overview</h1>
        <p className="text-sm text-gray-400 mt-0.5">Team customer performance</p>
      </div>

      <div className="px-4 space-y-3">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <h3 className="font-bold text-gray-800 text-sm mb-3">Summary</h3>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Total", value: myCustomers.length, color: "text-blue-600" },
              { label: "Booked", value: statusCounts.Booked, color: "text-green-600" },
              { label: "Dropped", value: statusCounts.Dropped, color: "text-red-600" },
            ].map(s => (
              <div key={s.label} className="text-center p-2 bg-gray-50 rounded-xl">
                <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-gray-400">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <h3 className="font-bold text-gray-800 text-sm mb-3">Pipeline</h3>
          <div className="space-y-2">
            {[
              { label: "Interested", count: statusCounts.Interested, color: "bg-yellow-400" },
              { label: "Visit Scheduled", count: statusCounts.Scheduled, color: "bg-blue-400" },
              { label: "Visit Completed", count: statusCounts.Completed, color: "bg-purple-400" },
              { label: "Ready to Book", count: statusCounts.Ready, color: "bg-orange-400" },
              { label: "Booked / Paid", count: statusCounts.Booked, color: "bg-green-400" },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${s.color}`} />
                <div className="flex-1 flex items-center justify-between">
                  <span className="text-sm text-gray-600">{s.label}</span>
                  <span className="text-sm font-bold text-gray-800">{s.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <h3 className="font-bold text-gray-800 text-sm mb-3">Recent Customers</h3>
          
          <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
            {filterOptions.map(opt => (
              <button
                key={opt.key}
                onClick={() => setStatusFilter(opt.key)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  statusFilter === opt.key
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {opt.label} ({opt.count})
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {filteredCustomers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                <UserX size={32} className="mb-2" />
                <span className="text-sm">No customers found</span>
              </div>
            ) : (
              filteredCustomers.slice(0, 5).map(c => (
                <div key={c.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50">
                  <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
                    {c.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-gray-800 truncate">{c.name}</div>
                    <div className="text-xs text-gray-400 truncate">{c.siteName}</div>
                  </div>
                  <StatusBadge status={c.status} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}