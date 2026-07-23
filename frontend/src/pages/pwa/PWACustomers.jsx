import { useState, useMemo } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useData } from "../../context/DataContext.jsx";
import { useNavigate } from "react-router-dom";
import { UserCheck, UserX, Eye, Search, ChevronLeft, ChevronRight } from "lucide-react";
import StatusBadge from "../../components/StatusBadge.jsx";
import Modal from "../../components/Modal.jsx";

const STATUS_FILTER_MAP = {
  All: "All",
  Interested: "Interested",
  "Visit Scheduled": "Visit Scheduled",
  "Visit Completed": "Visit Completed",
  "Ready for Booking": "Ready for Booking",
  Booked: "Booked",
  "Payment Done": "Payment Done",
  Dropped: "Dropped",
};

const ITEMS_PER_PAGE = 10;

export default function PWACustomers() {
  const { user, hierarchy } = useAuth();
  const { customers, users, updateCustomer } = useData();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState("All");
  const [roleFilter, setRoleFilter] = useState("All");
  const [viewCustomer, setViewCustomer] = useState(null);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Get all user IDs in this team's full hierarchy (self + all downline)
  const teamUserIds = useMemo(() => {
    if (!users.length || !user?.id) return [];
    const downline = hierarchy.getDownline(users);
    const allTeam = [user, ...downline].filter(Boolean);
    return allTeam.map(u => u.id);
  }, [users, user, hierarchy]);

  // Filter customers by createdById matching team members
  const myCustomers = useMemo(() => {
    return customers.filter(c => teamUserIds.includes(c.createdById));
  }, [customers, teamUserIds]);

  // Unique roles in the team for role filter
  const teamRoles = useMemo(() => {
    const roleSet = new Set();
    teamUserIds.forEach(id => {
      const u = users.find(user => user.id === id);
      if (u?.role) roleSet.add(u.role);
    });
    return ["All", ...Array.from(roleSet)];
  }, [users, teamUserIds]);

  // Helper: get role of the user who created a customer
  const getCreatorRole = (customer) => {
    const creator = users.find(u => u.id === (customer.createdById || customer.createdBy));
    return creator?.role || "";
  };

  // Search filter
  const searchedCustomers = useMemo(() => {
    if (!search.trim()) return myCustomers;
    const s = search.toLowerCase().trim();
    return myCustomers.filter(c =>
      c.name?.toLowerCase().includes(s) ||
      c.mobile?.includes(s) ||
      c.siteName?.toLowerCase().includes(s) ||
      c.salesManagerName?.toLowerCase().includes(s) ||
      String(c.createdById || c.createdBy || "").includes(s)
    );
  }, [myCustomers, search]);

  // Status filter + Role filter
  const filteredCustomers = useMemo(() => {
    let result = searchedCustomers;
    if (statusFilter !== "All") {
      result = result.filter(c => c.status === statusFilter);
    }
    if (roleFilter !== "All") {
      result = result.filter(c => getCreatorRole(c) === roleFilter);
    }
    return result;
  }, [searchedCustomers, statusFilter, roleFilter, users]);

  // Pagination
  const totalPages = Math.ceil(filteredCustomers.length / ITEMS_PER_PAGE);
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredCustomers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredCustomers, currentPage]);

  // Status counts for filter chips (based on searched results only)
  const statusCounts = useMemo(() => {
    const counts = {
      All: myCustomers.length,
      Interested: 0,
      "Visit Scheduled": 0,
      "Visit Completed": 0,
      "Ready for Booking": 0,
      Booked: 0,
      "Payment Done": 0,
      Dropped: 0,
    };
    myCustomers.forEach(c => {
      if (counts[c.status] !== undefined) counts[c.status]++;
    });
    return counts;
  }, [myCustomers]);

  const filterOptions = [
    { key: "All", label: "All", count: statusCounts.All },
    { key: "Interested", label: "Interested", count: statusCounts.Interested },
    { key: "Visit Scheduled", label: "Visit Scheduled", count: statusCounts["Visit Scheduled"] },
    { key: "Visit Completed", label: "Visit Completed", count: statusCounts["Visit Completed"] },
    { key: "Booked", label: "Booked", count: statusCounts.Booked },
    { key: "Payment Done", label: "Payment Done", count: statusCounts["Payment Done"] },
  ];

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yy = String(d.getFullYear()).slice(-2);
    return `${dd}/${mm}/${yy}`;
  };

  const handleFilterChange = (key) => {
    setStatusFilter(key);
    setCurrentPage(1);
  };

  const selected = viewCustomer;

  return (
    <div className="pb-4">
      <div className="px-4 py-4">
        <h1 className="text-xl font-bold text-gray-900">Customer Overview</h1>
        <p className="text-sm text-gray-400 mt-0.5">Team customer performance</p>
      </div>

      <div className="px-4 space-y-3">
        {/* Summary Cards */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <h3 className="font-bold text-gray-800 text-sm mb-3">Summary</h3>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Total", value: myCustomers.length, color: "text-blue-600" },
              { label: "Booked", value: statusCounts.Booked + statusCounts["Payment Done"], color: "text-green-600" },
              { label: "Dropped", value: statusCounts.Dropped, color: "text-red-600" },
            ].map(s => (
              <div key={s.label} className="text-center p-2 bg-gray-50 rounded-xl">
                <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-gray-400">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Pipeline */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <h3 className="font-bold text-gray-800 text-sm mb-3">Pipeline</h3>
          <div className="space-y-2">
          {[
            { label: "Interested", count: statusCounts.Interested, color: "bg-yellow-400" },
            { label: "Visit Scheduled", count: statusCounts["Visit Scheduled"], color: "bg-blue-400" },
            { label: "Visit Completed", count: statusCounts["Visit Completed"], color: "bg-purple-400" },
            { label: "Booked", count: statusCounts.Booked, color: "bg-green-400" },
            { label: "Payment Done", count: statusCounts["Payment Done"], color: "bg-emerald-600" },
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

        {/* Customer Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 pb-2">
            <h3 className="font-bold text-gray-800 text-sm">My Customers</h3>
          </div>

          {/* Search Bar - line 1 */}
          <div className="px-4 pb-2">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                 placeholder="Search by Name, Mobile, Site, Created By..."
                className="w-full pl-8 pr-2 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Role Filter Dropdown - line 2 */}
          <div className="px-4 pb-2">
            <select
              value={roleFilter}
              onChange={e => { setRoleFilter(e.target.value); setCurrentPage(1); }}
              className="w-full rounded-xl px-3 py-2 bg-gray-50 border border-gray-200 text-xs font-medium text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {teamRoles.map(role => (
                <option key={role} value={role}>
                  {role === "All" ? "All Roles" : role}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter Dropdown - line 3 */}
          <div className="px-4 pb-3">
            <select
              value={statusFilter}
              onChange={e => handleFilterChange(e.target.value)}
              className="w-full rounded-xl px-3 py-2 bg-gray-50 border border-gray-200 text-xs font-medium text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {filterOptions.map(opt => (
                <option key={opt.key} value={opt.key}>
                  {opt.label} ({opt.key === "Booked" ? statusCounts.Booked + statusCounts["Payment Done"] : statusCounts[opt.key] || 0})
                </option>
              ))}
            </select>
          </div>

          {/* Result count */}
          <div className="px-4 pb-2 text-xs text-gray-400">
            Showing {paginatedCustomers.length} of {filteredCustomers.length} customers
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-t border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Mobile</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Site</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Visit Date</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginatedCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-400">
                        <UserX size={32} className="mb-2" />
                        <span className="text-sm">No customers found</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedCustomers.map(c => (
                    <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-800 text-sm">{c.name}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{c.mobile}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{c.siteName || "—"}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(c.visitDate)}</td>
                      <td className="px-4 py-3">
                        {(c.createdById === user?.id || ["Admin", "Director"].includes(user?.role)) ? (
                          <select
                            value={c.status}
                            onChange={e => updateCustomer(c.id, { status: e.target.value })}
                            className={`text-xs font-semibold rounded-lg px-2 py-1 border-0 ${
                              c.status === "Interested" ? "bg-amber-50 text-amber-700" :
                              c.status === "Visit Scheduled" ? "bg-blue-50 text-blue-700" :
                              c.status === "Visit Completed" ? "bg-violet-50 text-violet-700" :
                              c.status === "Booked" || c.status === "Payment Done" ? "bg-emerald-50 text-emerald-700" :
                              "bg-gray-50 text-gray-700"
                            }`}
                          >
                            <option value="Interested">Interested</option>
                            <option value="Visit Scheduled">Visit Scheduled</option>
                            <option value="Visit Completed">Visit Completed</option>
                            <option value="Booked">Booked</option>
                            <option value="Payment Done">Payment Done</option>
                          </select>
                        ) : (
                          <StatusBadge status={c.status} />
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => setViewCustomer(c)}
                          className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye size={15} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={14} /> Prev
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-7 h-7 rounded-lg text-xs font-medium transition-all ${
                        currentPage === pageNum
                          ? "bg-blue-600 text-white"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* View Details Modal */}
      <Modal open={!!viewCustomer} onClose={() => setViewCustomer(null)} title="Customer Details" size="lg">
        {selected && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white text-base font-bold flex-shrink-0">
                {selected.name?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-gray-900 truncate">{selected.name}</h3>
                <p className="text-[11px] text-gray-500">{selected.mobile}</p>
              </div>
              <StatusBadge status={selected.status} />
            </div>

            <div className="space-y-2.5">
              {[
                ["Email", selected.email],
                ["Site", selected.siteName],
                ["Created By", (() => { const creator = users.find(u => u.id === (selected.createdById || selected.createdBy)); return creator ? `${creator.name} (${creator.employeeCode})` : (selected.salesManagerName || "—"); })()],
                [(() => { const creator = users.find(u => u.id === (selected.createdById || selected.createdBy)); return creator ? `${creator.role} Mobile` : "Mobile"; })(), (() => { const creator = users.find(u => u.id === (selected.createdById || selected.createdBy)); return creator?.mobile || "—"; })()],
                ["Visit Date", formatDate(selected.visitDate)],
                ["Visit Time", selected.visitTime ? (() => { const [h, m] = selected.visitTime.split(':'); const hour = parseInt(h, 10); const ampm = hour >= 12 ? 'PM' : 'AM'; const hour12 = hour % 12 || 12; return `${hour12}:${m} ${ampm}`; })() : '—'],
                ["Persons", selected.persons],
                ["Purchase Mode", selected.purchaseMode],
                ["Location", selected.location],
                ["Pin Code", selected.pinCode],
                ["Occupation", selected.occupation],
                ["Registered", formatDate(selected.registeredDate)],
                ["Address", selected.address],
              ].map(([k, v]) => (
                <div key={k} className="flex flex-col gap-0.5">
                  <span className="text-[11px] text-gray-400 font-medium tracking-wide">{k}</span>
                  <span className="text-sm text-gray-800 break-words">{v || "—"}</span>
                </div>
              ))}
            </div>

            {selected.notes && (
              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-500 tracking-wide mb-1">Notes</p>
                <p className="text-xs text-gray-700 leading-relaxed">{selected.notes}</p>
              </div>
            )}

            {(selected.driverName || selected.driverMobile || selected.cabNumber) && (
              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs font-semibold text-blue-600 tracking-wide mb-1">🚗 Driver Details</p>
                <div className="space-y-1">
                  {selected.driverName && (
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-gray-400">Name</span>
                      <span className="text-[11px] text-gray-800">{selected.driverName}</span>
                    </div>
                  )}
                  {selected.driverMobile && (
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-gray-400">Mobile</span>
                      <span className="text-[11px] text-gray-800">{selected.driverMobile}</span>
                    </div>
                  )}
                  {selected.cabNumber && (
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-gray-400">Cab</span>
                      <span className="text-[11px] text-gray-800">{selected.cabNumber}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}