import { useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useData } from "../../context/DataContext.jsx";
import Modal from "../../components/Modal.jsx";
import { Users, Mail, Phone, Eye, TrendingUp, UserCheck, Building2 } from "lucide-react";

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
  const { user } = useAuth();
  const { users, customers, bookings } = useData();
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);

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
  const members = useMemo(() => {
    if (selectedRole) {
      return users.filter((u) => u.role === selectedRole && downlineUserIds.includes(u.id));
    }
    return directMembers;
  }, [directMembers, selectedRole, users, downlineUserIds]);

  const getMemberStats = (member) => {
    const memberCustomers = customers.filter((c) => c.salesManagerId === member.id);
    const memberBookings = bookings.filter((b) => b.salesManagerId === member.id);
    return { customers: memberCustomers.length, bookings: memberBookings.length };
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
            <button onClick={() => setSelectedRole(null)} className="text-gray-400 hover:text-gray-600 p-1">
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
                onClick={() => setSelectedRole(role)}
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
      <div className="px-4 space-y-3">
        {members.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center">
            <Users size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No {config.cardLabel.toLowerCase()} yet</p>
          </div>
        ) : (
          members.map((member) => {
            const stats = getMemberStats(member);
            return (
              <div key={member.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-lg flex-shrink-0">
                    {member.name?.charAt(0) || "U"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-800 truncate">{member.name}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{member.employeeCode || "N/A"} · {member.role} · {member.branch || "—"}</div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Mail size={12} />{member.email}</span>
                      <span className="flex items-center gap-1"><Phone size={12} />{member.mobile}</span>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${member.status === "Active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {member.status || "Active"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-gray-50">
                  <div className="text-center">
                    <div className="text-sm font-bold text-blue-600">{stats.customers}</div>
                    <div className="text-xs text-gray-400">Customers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-bold text-green-600">{stats.bookings}</div>
                    <div className="text-xs text-gray-400">Bookings</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-50">
                  <button onClick={() => setSelectedMember(member)} className="flex-1 bg-gray-50 text-gray-600 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1">
                    <Eye size={14} />View
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <Modal open={!!selectedMember} onClose={() => setSelectedMember(null)} title="Team Member Details" size="lg">
        {selectedMember && (() => {
          const stats = getMemberStats(selectedMember);
          return (
            <div className="space-y-4">
              <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-2xl">
                  {selectedMember.name?.charAt(0) || "U"}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{selectedMember.name}</h3>
                  <p className="text-sm text-gray-500">{selectedMember.role} · {selectedMember.employeeCode || "N/A"}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-3">
                  <div className="text-xs text-gray-400">Mobile</div>
                  <div className="text-sm font-semibold text-gray-800">{selectedMember.mobile}</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <div className="text-xs text-gray-400">Email</div>
                  <div className="text-sm font-semibold text-gray-800">{selectedMember.email}</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <div className="text-xs text-gray-400">Branch</div>
                  <div className="text-sm font-semibold text-gray-800">{selectedMember.branch || "—"}</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <div className="text-xs text-gray-400">Status</div>
                  <div className="text-sm font-semibold text-gray-800">{selectedMember.status || "Active"}</div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-xl p-4">
                <h4 className="font-bold text-gray-800 text-sm mb-3">Performance</h4>
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
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}