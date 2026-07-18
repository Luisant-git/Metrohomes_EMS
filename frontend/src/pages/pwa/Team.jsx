import { useMemo, useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useData } from "../../context/DataContext.jsx";
import Modal from "../../components/Modal.jsx";
import { Users, Eye, TrendingUp, UserCheck, Building2, ChevronRight, Search, ChevronLeft, ChevronRight as ChevronRightIcon } from "lucide-react";

const ITEMS_PER_PAGE = 10;

const abbreviateRole = (role) => {
  const map = {
    "Sales Manager": "SM",
    "Branch Manager": "BM",
    "Regional Manager": "RM",
  };
  return map[role] || role;
};

// All roles below the logged-in user in the hierarchy - shows what they can manage
const SUB_ROLES = {
  "Regional Manager": [
    { role: "Branch Manager", icon: Building2, color: "text-cyan-600", bg: "bg-cyan-50", label: "BM Count" },
    { role: "BDM", icon: Users, color: "text-purple-600", bg: "bg-purple-50", label: "BDM Count" },
    { role: "Sales Manager", icon: UserCheck, color: "text-green-600", bg: "bg-green-50", label: "SM Count" },
  ],
  "Branch Manager": [
    { role: "BDM", icon: Users, color: "text-purple-600", bg: "bg-purple-50", label: "BDM Count" },
    { role: "Sales Manager", icon: UserCheck, color: "text-green-600", bg: "bg-green-50", label: "SM Count" },
  ],
  "BDM": [
    { role: "Sales Manager", icon: UserCheck, color: "text-green-600", bg: "bg-green-50", label: "SM Count" },
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
  const [downlinePage, setDownlinePage] = useState(1);

  useEffect(() => {
    if (selectedMember) {
      setDownlinePage(1);
    }
  }, [selectedMember]);

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
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden overflow-x-auto">
            {/* Table Header */}
            <div className="flex bg-gray-50 border-b border-gray-100 min-w-[320px]">
              <div className="flex-[2] px-1 py-1.5 text-[8px] sm:text-[9px] font-semibold text-gray-500 uppercase tracking-wider min-w-0">User ID</div>
              <div className="flex-[3] px-1 py-1.5 text-[8px] sm:text-[9px] font-semibold text-gray-500 uppercase tracking-wider min-w-0">Name</div>
              <div className="flex-[2] px-1 py-1.5 text-[8px] sm:text-[9px] font-semibold text-gray-500 uppercase tracking-wider truncate">Mobile</div>
              <div className="w-14 px-1 py-1.5 text-[8px] sm:text-[9px] font-semibold text-gray-500 uppercase tracking-wider text-center flex-shrink-0">Action</div>
            </div>
            {/* Table Rows */}
            {paginatedMembers.map((member, index) => (
              <div
                key={member.id}
                className={`flex items-center border-b border-gray-50 min-w-[320px] ${
                  index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                }`}
              >
                <div className="flex-[2] px-1 py-1.5 text-[10px] sm:text-[11px] font-mono text-gray-700 truncate">
                  {member.employeeCode || `ID:${member.id}`}
                </div>
                <div className="flex-[3] px-1 py-1.5 text-[10px] sm:text-[11px] font-medium text-gray-800 truncate">
                  {member.name}
                </div>
                <div className="flex-[2] px-1 py-1.5 text-[10px] sm:text-[11px] text-gray-600 truncate">{member.mobile}</div>
                <div className="w-14 px-1 py-1.5 text-center flex-shrink-0">
                  <button
                    onClick={() => setSelectedMember(member)}
                    className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors inline-flex items-center justify-center"
                    title="View details"
                  >
                    <Eye size={14} className="sm:hidden" />
                    <Eye size={16} className="hidden sm:inline" />
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
              <div className="flex items-start gap-3 pb-4 border-b border-gray-100">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-lg sm:text-2xl overflow-hidden flex-shrink-0">
                  {selectedMember.avatar ? (
                    <img src={selectedMember.avatar} alt={selectedMember.name} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    selectedMember.name?.charAt(0) || "U"
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm sm:text-lg font-bold text-gray-900 truncate">{selectedMember.name}</h3>
                  <p className="text-[11px] sm:text-sm text-gray-500">
                    <span className="truncate inline-block max-w-full">{selectedMember.role}</span>
                    <span className="hidden sm:inline"> · </span>
                    <span className="block sm:inline text-[10px] sm:text-sm text-gray-500 truncate">{selectedMember.employeeCode || "N/A"}</span>
                  </p>
                  <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5 truncate">{selectedMember.email}</p>
                </div>
                <span className={`text-[9px] sm:text-xs font-semibold px-2 py-1 sm:px-3 sm:py-1.5 rounded-full whitespace-nowrap flex-shrink-0 self-start ${selectedMember.status === "Active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                  {selectedMember.status || "Active"}
                </span>
              </div>

              {/* Contact Details Grid */}
              <div className="grid grid-cols-1 gap-3">
                <div className="bg-gray-50 rounded-xl p-3">
                  <div className="text-[10px] sm:text-xs text-gray-400">Mobile</div>
                  <div className="text-xs sm:text-sm font-semibold text-gray-800">{selectedMember.mobile}</div>
                </div>
              </div>

              {/* Performance Stats */}
              <div className="bg-blue-50 rounded-xl p-3 sm:p-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-[10px] sm:text-xs text-gray-500">Customers</div>
                    <div className="text-base sm:text-xl font-bold text-blue-600">{stats.customers}</div>
                  </div>
                  <div>
                    <div className="text-[10px] sm:text-xs text-gray-500">Bookings</div>
                    <div className="text-base sm:text-xl font-bold text-green-600">{stats.bookings}</div>
                  </div>
                </div>
              </div>

              {/* Downline Section */}
              {downline.length > 0 && (
                <div>
                  <h4 className="font-bold text-gray-800 text-[13px] sm:text-sm mb-3">Downline Team ({downline.length})</h4>
                  
                  {/* Downline Role Summary */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {Object.entries(downlineByRole).map(([role, count]) => (
                      <span key={role} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium">
                        {abbreviateRole(role)}: {count}
                      </span>
                    ))}
                  </div>

                  {/* Downline Table */}
                  <div className="bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
                    <div className="grid grid-cols-3 bg-gray-100 text-[9px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <div className="px-2 sm:px-3 py-1.5 sm:py-2 truncate">User ID</div>
                      <div className="px-2 sm:px-3 py-1.5 sm:py-2 truncate">Name</div>
                      <div className="px-2 sm:px-3 py-1.5 sm:py-2 text-center">Role</div>
                    </div>
                    {downline.slice((downlinePage - 1) * 5, downlinePage * 5).map((d, i) => (
                      <div
                        key={d.id}
                        className={`grid grid-cols-3 text-[11px] sm:text-sm ${i % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
                      >
                        <div className="px-2 sm:px-3 py-1.5 sm:py-2 text-gray-600 font-mono truncate">{d.employeeCode || `ID:${d.id}`}</div>
                        <div className="px-2 sm:px-3 py-1.5 sm:py-2 text-gray-800 font-medium truncate">{d.name}</div>
                        <div className="px-2 sm:px-3 py-1.5 sm:py-2 text-center">
                          <span className="text-[10px] sm:text-xs bg-blue-100 text-blue-700 px-1.5 sm:px-2 py-0.5 rounded-full font-medium truncate inline-block max-w-full">
                            {abbreviateRole(d.role)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {downline.length > 5 && (
                    <div className="flex items-center justify-between mt-3 px-1 text-sm">
                      <button
                        onClick={() => setDownlinePage(p => Math.max(1, p - 1))}
                        disabled={downlinePage === 1}
                        className={`px-3 py-1.5 rounded-lg transition-colors ${downlinePage === 1 ? "text-gray-400 bg-gray-50 cursor-not-allowed" : "text-blue-600 bg-blue-50 hover:bg-blue-100"}`}
                      >
                        Previous
                      </button>
                      <span className="text-gray-500 text-xs">
                        Page {downlinePage} of {Math.ceil(downline.length / 5)}
                      </span>
                      <button
                        onClick={() => setDownlinePage(p => Math.min(Math.ceil(downline.length / 5), p + 1))}
                        disabled={downlinePage === Math.ceil(downline.length / 5)}
                        className={`px-3 py-1.5 rounded-lg transition-colors ${downlinePage === Math.ceil(downline.length / 5) ? "text-gray-400 bg-gray-50 cursor-not-allowed" : "text-blue-600 bg-blue-50 hover:bg-blue-100"}`}
                      >
                        Next
                      </button>
                    </div>
                  )}
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