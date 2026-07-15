import { useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useData } from "../../context/DataContext.jsx";
import Modal from "../../components/Modal.jsx";
import { Users, Eye, TrendingUp, UserCheck, Building2, ChevronRight, Search, ChevronLeft, ChevronRight as ChevronRightIcon } from "lucide-react";

const ITEMS_PER_PAGE = 10;

// All roles below the logged-in user in the hierarchy - shows what they can manage
const SUB_ROLES = {
  "Regional Manager": [
    { role: "Branch Manager", icon: Building2, color: "text-cyan-600", bg: "bg-cyan-50", label: "BM Count" },
    { role: "BDM", icon: Users, color: "text-purple-600", bg: "bg-purple-50", label: "BDM Count" },
    { role: "Sales Manager", icon: UserCheck, color: "text-green-600", bg: "bg-green-50", label: "Sales Managers" },
  ],
  "Branch Manager": [
    { role: "BDM", icon: Users, color: "text-purple-600", bg: "bg-purple-50", label: "BDM Count" },
    { role: "Sales Manager", icon: UserCheck, color: "text-green-600", bg: "bg-green-50", label: "Sales Managers" },
  ],
  "BDM": [
    { role: "Sales Manager", icon: UserCheck, color: "text-green-600", bg: "bg-green-50", label: "Sales Managers" },
  ],
  "Sales Manager": [],
};

const TEAM_CONFIG = {
  "Regional Manager": {
    role: "Branch Manager",
    title: "My Team",
    subtitle: "Manage Branch Managers",
    cardLabel: "Branch Managers",
  },
  "Branch Manager": {
    role: "BDM",
    title: "My Team",
    subtitle: "Manage BDMs",
    cardLabel: "BDMs",
  },
  "BDM": {
    role: "Sales Manager",
    title: "My Team",
    subtitle: "Manage Sales Managers",
    cardLabel: "Sales Managers",
  },
};

export default function TeamPage() {
  const { user: authUser, hierarchy } = useAuth();
  const { users, customers, bookings } = useData();
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Find the real user from the API-fetched users array that matches the logged-in user
  const user = useMemo(() => {
    if (!authUser?.id || !users.length) return authUser;
    // Try to match by employeeCode or email
    const match = users.find(
      (u) => u.employeeCode === authUser.employeeCode || u.email === authUser.email
    );
    return match || authUser;
  }, [authUser, users]);

  const config = TEAM_CONFIG[user?.role] || TEAM_CONFIG["BDM"];

  // Get all downline user IDs (recursive)
  const downlineUserIds = useMemo(() => {
    if (!user?.id) return [];
    const ids = [];
    const queue = users.filter((u) => u.parentUserId === user.id).map((u) => u.id);
    while (queue.length > 0) {
      const id = queue.shift();
      ids.push(id);
      const children = users.filter((u) => u.parentUserId === id).map((u) => u.id);
      queue.push(...children);
    }
    return ids;
  }, [users, user?.id]);

  // Get the roles below the current user in the hierarchy
  const subRoles = useMemo(() => {
    return SUB_ROLES[user?.role] || [];
  }, [user?.role]);

  // Count each sub-role in the entire downline
  const roleCounts = useMemo(() => {
    return subRoles.map(({ role }) => ({
      role,
      count: users.filter((u) => u.role === role && downlineUserIds.includes(u.id)).length,
    }));
  }, [users, downlineUserIds, subRoles]);

  // Direct children only (for default team view)
  const directMembers = useMemo(() => {
    if (!user?.id) return [];
    return users.filter((u) => u.role === config.role && u.parentUserId === user.id);
  }, [users, user?.id, config.role]);

  // Show all downline users of the selected role, or direct members by default
  const allMembers = useMemo(() => {
    if (selectedRole) {
      return users.filter((u) => u.role === selectedRole && downlineUserIds.includes(u.id));
    }
    return directMembers;
  }, [directMembers, selectedRole, users, downlineUserIds]);

  // Filtered members based on search
  const filteredMembers = useMemo(() => {
    if (!searchTerm.trim()) return allMembers;
    const term = searchTerm.toLowerCase().trim();
    return allMembers.filter((m) => {
      const code = (m.employeeCode || `ID:${m.id}`).toLowerCase();
      const name = (m.name || "").toLowerCase();
      const mobile = (m.mobile || "").toLowerCase();
      return code.includes(term) || name.includes(term) || mobile.includes(term);
    });
  }, [allMembers, searchTerm]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredMembers.length / ITEMS_PER_PAGE));
  const paginatedMembers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredMembers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredMembers, currentPage]);

  // Reset to page 1 when search or role changes
  const handleSearch = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleRoleClick = (role) => {
    setSelectedRole(role);
    setSearchTerm("");
    setCurrentPage(1);
  };

  const handleBack = () => {
    setSelectedRole(null);
    setSearchTerm("");
    setCurrentPage(1);
  };

  const getMemberStats = (member) => {
    const memberCustomers = customers.filter((c) => c.salesManagerId === member.id);
    const memberBookings = bookings.filter((b) => b.salesManagerId === member.id);
    return { customers: memberCustomers.length, bookings: memberBookings.length };
  };

  // Get downline of a specific member
  const getMemberDownline = (member) => {
    if (!member?.id) return [];
    const result = [];
    const queue = users.filter((u) => u.parentUserId === member.id).map((u) => u.id);
    while (queue.length > 0) {
      const id = queue.shift();
      const u = users.find((x) => x.id === id);
      if (u) {
        result.push(u);
        const children = users.filter((x) => x.parentUserId === id).map((x) => x.id);
        queue.push(...children);
      }
    }
    return result;
  };

  // Total customers and bookings across entire downline
  const summary = useMemo(() => {
    const downlineUsers = users.filter((u) => downlineUserIds.includes(u.id));
    const customersCount = downlineUsers.reduce((sum, u) => {
      return sum + customers.filter((c) => c.salesManagerId === u.id).length;
    }, 0);
    const bookingsCount = downlineUsers.reduce((sum, u) => {
      return sum + bookings.filter((b) => b.salesManagerId === u.id).length;
    }, 0);
    return { customers: customersCount, bookings: bookingsCount };
  }, [users, downlineUserIds, customers, bookings]);

  return (
    <div className="pb-24">
      <div className="px-4 py-4">
        <div className="flex items-center gap-2">
          {selectedRole && (
            <button onClick={handleBack} className="text-gray-400 hover:text-gray-600 p-1">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            </button>
          )}
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {selectedRole ? `${selectedRole}s` : config.title}
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {selectedRole ? `Showing ${selectedRole}s` : config.subtitle}
            </p>
          </div>
        </div>
      </div>

      {/* Downline Role Count Cards - shows roles below the user */}
      {!selectedRole && roleCounts.length > 0 && (
        <div className={`px-4 grid ${roleCounts.length === 1 ? "grid-cols-1" : "grid-cols-3"} gap-3 mb-4`}>
          {roleCounts.map(({ role, count }) => {
            const cfg = subRoles.find((r) => r.role === role) || { icon: Users, color: "text-gray-600", bg: "bg-gray-50", label: role };
            return (
              <button
                key={role}
                onClick={() => handleRoleClick(role)}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-left active:scale-[0.98] transition-all hover:border-blue-200"
              >
                <div className={`w-9 h-9 ${cfg.bg} rounded-xl flex items-center justify-center mb-2`}>
                  <cfg.icon size={18} className={cfg.color} />
                </div>
                <div className={`text-xl font-bold ${cfg.color}`}>{count}</div>
                <div className="text-[10px] text-gray-400 mt-0.5">{cfg.label}</div>
              </button>
            );
          })}
        </div>
      )}

      {/* Total Customers & Total Bookings summary */}
      {!selectedRole && (
        <div className="px-4 grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="w-9 h-9 bg-purple-50 rounded-xl flex items-center justify-center mb-2">
              <Users size={18} className="text-purple-600" />
            </div>
            <div className="text-xl font-bold text-purple-600">{summary.customers}</div>
            <div className="text-[10px] text-gray-400 mt-0.5">Total Customers</div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="w-9 h-9 bg-orange-50 rounded-xl flex items-center justify-center mb-2">
              <TrendingUp size={18} className="text-orange-600" />
            </div>
            <div className="text-xl font-bold text-orange-600">{summary.bookings}</div>
            <div className="text-[10px] text-gray-400 mt-0.5">Total Bookings</div>
          </div>
        </div>
      )}

      {/* Search Bar */}
      {filteredMembers.length > 0 && (
        <div className="px-4 mb-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by User ID, Name, or Mobile..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
            />
          </div>
        </div>
      )}

      {/* Table View */}
      {filteredMembers.length === 0 ? (
        <div className="px-4">
          <div className="bg-white rounded-2xl p-8 text-center">
            <Users size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">
              {searchTerm ? "No members match your search" : `No ${config.cardLabel.toLowerCase()} yet`}
            </p>
          </div>
        </div>
      ) : (
        <div className="px-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-4 bg-gray-50 border-b border-gray-100">
              <div className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">User ID</div>
              <div className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</div>
              <div className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Mobile</div>
              <div className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Action</div>
            </div>
            {/* Table Rows */}
            {paginatedMembers.map((member, index) => (
              <div
                key={member.id}
                className={`grid grid-cols-4 items-center border-b border-gray-50 ${
                  index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                }`}
              >
                <div className="px-4 py-3 text-sm font-mono text-gray-700">
                  {member.employeeCode || `ID:${member.id}`}
                </div>
                <div className="px-4 py-3 text-sm font-medium text-gray-800">
                  {member.name}
                </div>
                <div className="px-4 py-3 text-sm text-gray-600">{member.mobile}</div>
                <div className="px-4 py-3 text-right">
                  <button
                    onClick={() => setSelectedMember(member)}
                    className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                    title="View details"
                  >
                    <Eye size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-3 px-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={`p-2 rounded-lg transition-colors ${
                  currentPage === 1
                    ? "text-gray-300 cursor-not-allowed"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <ChevronLeft size={18} />
              </button>
              <div className="flex items-center gap-1.5">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === page
                        ? "bg-blue-600 text-white"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className={`p-2 rounded-lg transition-colors ${
                  currentPage === totalPages
                    ? "text-gray-300 cursor-not-allowed"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <ChevronRightIcon size={18} />
              </button>
            </div>
          )}
          <div className="text-center text-xs text-gray-400 mt-2">
            Showing {paginatedMembers.length} of {filteredMembers.length} members
          </div>
        </div>
      )}

      {/* Member Detail Modal with Downline */}
      <Modal open={!!selectedMember} onClose={() => setSelectedMember(null)} title="Team Member Details" size="lg">
        {selectedMember && (() => {
          const stats = getMemberStats(selectedMember);
          const downline = getMemberDownline(selectedMember);
          const downlineByRole = {};
          downline.forEach((u) => {
            if (u.role) {
              downlineByRole[u.role] = (downlineByRole[u.role] || 0) + 1;
            }
          });
          return (
            <div className="space-y-5">
              {/* Member Info Header */}
              <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-2xl">
                  {selectedMember.name?.charAt(0) || "U"}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900">{selectedMember.name}</h3>
                  <p className="text-sm text-gray-500">{selectedMember.role} · {selectedMember.employeeCode || "N/A"}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{selectedMember.email}</p>
                </div>
                <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${selectedMember.status === "Active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                  {selectedMember.status || "Active"}
                </span>
              </div>

              {/* Contact Details Grid */}
              <div className="grid grid-cols-1 gap-3">
                <div className="bg-gray-50 rounded-xl p-3">
                  <div className="text-xs text-gray-400">Mobile</div>
                  <div className="text-sm font-semibold text-gray-800">{selectedMember.mobile}</div>
                </div>
              </div>

              {/* Performance Stats */}
              <div className="bg-blue-50 rounded-xl p-4">
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-gray-500">Customers</div>
                    <div className="text-xl font-bold text-blue-600">{stats.customers}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Bookings</div>
                    <div className="text-xl font-bold text-green-600">{stats.bookings}</div>
                  </div>
                </div>
              </div>

              {/* Downline Section */}
              {downline.length > 0 && (
                <div>
                  <h4 className="font-bold text-gray-800 text-sm mb-3">Downline Team ({downline.length})</h4>
                  
                  {/* Downline Role Summary */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {Object.entries(downlineByRole).map(([role, count]) => (
                      <span key={role} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium">
                        {role}: {count}
                      </span>
                    ))}
                  </div>

                  {/* Downline Table */}
                  <div className="bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
                    <div className="grid grid-cols-3 bg-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <div className="px-3 py-2">User ID</div>
                      <div className="px-3 py-2">Name</div>
                      <div className="px-3 py-2">Role</div>
                    </div>
                    {downline.map((d, i) => (
                      <div
                        key={d.id}
                        className={`grid grid-cols-3 text-sm ${i % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
                      >
                        <div className="px-3 py-2 text-gray-600 font-mono">{d.employeeCode || `ID:${d.id}`}</div>
                        <div className="px-3 py-2 text-gray-800 font-medium">{d.name}</div>
                        <div className="px-3 py-2">
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                            {d.role}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {downline.length === 0 && (
                <div className="text-center py-4 text-gray-400 text-sm">
                  No downline members
                </div>
              )}
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}