import { useState, useMemo } from "react";
import { useData } from "../../context/DataContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import DataTable from "../../components/DataTable.jsx";
import Modal from "../../components/Modal.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import StatCard from "../../components/StatCard.jsx";
import {
  Edit2, Trash2, Eye, Users, ChevronDown, ChevronRight, UserPlus,
  Search, Filter, Building2, Users as UsersIcon, UserCheck, TrendingUp,
  X, ChevronsDown, Shield, Crown, Globe, Briefcase, Target
} from "lucide-react";
import toast from "react-hot-toast";

const REGIONS = ["North", "South", "East", "West", "Central", "Head Office"];
const BRANCHES = ["Delhi HQ", "Mumbai HQ", "Bangalore Branch", "Hyderabad Branch", "Chennai Branch", "Noida Branch", "Gurgaon Branch"];

const emptyForm = { name: "", email: "", mobile: "", role: "Sales Manager", region: "", branch: "", status: "Active", password: "" };

function FormField({ label, children }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}

// ─── Node Stats Badge ────────────────────────────────────────────────────────
function NodeStat({ icon: Icon, label, value, color = "blue" }) {
  const colorMap = { blue: "bg-blue-50 text-blue-700", green: "bg-green-50 text-green-700", purple: "bg-purple-50 text-purple-700", orange: "bg-orange-50 text-orange-700" };
  return (
    <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${colorMap[color]}`}>
      <Icon size={10} />
      <span>{value}</span>
    </div>
  );
}

// ─── Hierarchy TreeNode Component ────────────────────────────────────────────
function TreeNode({ node, users, customers, bookings, depth = 0, onViewTeam }) {
  const [expanded, setExpanded] = useState(true);
  const children = users.filter(u => u.parentUserId === node.id);
  const downline = [];

  // Calculate downline
  const queue = [...children];
  while (queue.length > 0) {
    const c = queue.shift();
    downline.push(c);
    queue.push(...users.filter(u => u.parentUserId === c.id));
  }

  // Get all sales manager IDs in this user's downline (for counting customers/bookings)
  const allSmIds = [];
  const smQueue = [node, ...downline];
  while (smQueue.length > 0) {
    const u = smQueue.shift();
    if (u.role === "Sales Manager") allSmIds.push(u.id);
    smQueue.push(...users.filter(x => x.parentUserId === u.id));
  }

  const activeCustomers = customers.filter(c => allSmIds.includes(c.salesManagerId)).length;
  const totalSales = bookings
    .filter(b => allSmIds.includes(b.salesManagerId))
    .reduce((sum, b) => sum + (b.paidAmount || 0), 0);

  const teamCount = children.length;
  const totalDownline = downline.length;

  return (
    <div>
      <div
        className="flex items-center gap-2 py-2 px-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group border border-transparent hover:border-gray-100"
        style={{ paddingLeft: `${depth * 28 + 12}px` }}
        onClick={() => children.length > 0 && setExpanded(p => !p)}
      >
        {/* Expand/Collapse */}
        {children.length > 0 ? (
          <span className="text-gray-400 flex-shrink-0 transition-transform duration-200">
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
        ) : (
          <span className="w-[14px] flex-shrink-0" />
        )}

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm">
          {node.name?.charAt(0)}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-gray-800 truncate">{node.name}</span>
            <StatusBadge status={node.role} />
            <span className="text-[10px] text-gray-400 font-mono">{node.employeeCode}</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-gray-400">
            {node.email && <span>{node.email}</span>}
            {node.mobile && <span>· {node.mobile}</span>}
            {node.branch && <span>· {node.branch}</span>}
            {node.region && <span>· {node.region}</span>}
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-1.5 flex-shrink-0 opacity-70 group-hover:opacity-100 transition-opacity">
          {teamCount > 0 && <NodeStat icon={UsersIcon} label="Direct" value={teamCount} color="blue" />}
          {totalDownline > 0 && <NodeStat icon={ChevronsDown} label="Team" value={totalDownline} color="purple" />}
          {activeCustomers > 0 && <NodeStat icon={UserCheck} label="Customers" value={activeCustomers} color="green" />}
          {totalSales > 0 && <NodeStat icon={TrendingUp} label="Sales" value={`₹${(totalSales / 100000).toFixed(0)}L`} color="orange" />}
        </div>

        {/* View Team button */}
        {children.length > 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); onViewTeam && onViewTeam(node); }}
            className="text-[10px] font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-lg transition-colors flex-shrink-0"
            title={`View ${node.name}'s team`}
          >
            Team
          </button>
        )}
      </div>

      {/* Children */}
      {expanded && children.length > 0 && (
        <div>
          {children.map(child => (
            <TreeNode
              key={child.id}
              node={child}
              users={users}
              customers={customers}
              bookings={bookings}
              depth={depth + 1}
              onViewTeam={onViewTeam}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function UserManagement() {
  const { users, customers, bookings, addUser, updateUser, deleteUser } = useData();
  const { user, hierarchy } = useAuth();
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [showTree, setShowTree] = useState(false); // default to table view
  const [treeSearch, setTreeSearch] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [viewingTeamId, setViewingTeamId] = useState(null);

  const creatableRoles = useMemo(() => hierarchy.getCreatableRoles(), [hierarchy]);

  // Get team members for a specific user
  const getTeamMembers = (userId) => {
    const teamMembers = [];
    const queue = [userId];
    const visited = new Set();
    
    while (queue.length > 0) {
      const currentId = queue.shift();
      if (visited.has(currentId)) continue;
      visited.add(currentId);
      
      const children = users.filter(u => u.parentUserId === currentId);
      teamMembers.push(...children.map(u => u.id));
      queue.push(...children.map(u => u.id));
    }
    
    return teamMembers;
  };

  // Visible users to logged-in user
  const visibleUsers = useMemo(() => {
    const isAdminOrDirector = ["Admin", "Director"].includes(user?.role);
    if (isAdminOrDirector) return users;
    const myTeam = hierarchy.getDownline(users);
    const myself = users.find(u => u.id === user?.id);
    return myself ? [myself, ...myTeam] : myTeam;
  }, [users, user, hierarchy]);

  // Filtered users based on search/filter/team view
  const filteredUsers = useMemo(() => {
    let result = visibleUsers;
    
    // If viewing a specific team, filter to only show that team
    if (viewingTeamId) {
      const teamMemberIds = getTeamMembers(viewingTeamId);
      result = result.filter(u => u.id === viewingTeamId || teamMemberIds.includes(u.id));
    }
    
    if (treeSearch) {
      const s = treeSearch.toLowerCase();
      result = result.filter(u =>
        u.name?.toLowerCase().includes(s) ||
        u.employeeCode?.toLowerCase().includes(s) ||
        u.mobile?.includes(s) ||
        u.email?.toLowerCase().includes(s) ||
        u.role?.toLowerCase().includes(s) ||
        u.branch?.toLowerCase().includes(s) ||
        u.region?.toLowerCase().includes(s)
      );
    }
    if (filterRole) {
      result = result.filter(u => u.role === filterRole);
    }
    return result;
  }, [visibleUsers, treeSearch, filterRole, viewingTeamId, users]);

  // Tree roots
  const treeRoots = useMemo(() => {
    return users.filter(u => !u.parentUserId).sort((a, b) => {
      const order = ["Admin", "Director", "Regional Manager", "Branch Manager", "BDM", "Sales Manager"];
      return order.indexOf(a.role) - order.indexOf(b.role);
    });
  }, [users]);

  const openAdd = () => {
    setForm({
      ...emptyForm,
      role: creatableRoles[0] || "Sales Manager",
      region: user?.region || "",
      branch: user?.branch || "",
    });
    setModal("add");
  };

  const openEdit = (u) => {
    setSelected(u);
    setForm({ ...u });
    setModal("edit");
  };

  const openView = (u) => {
    setSelected(u);
    setModal("view");
  };

  const roleCode = (role) => ({
    "Branch Manager": "BM",
    "BDM": "BDM",
    "Sales Manager": "SM",
    "Regional Manager": "RM",
    "Director": "DIR",
    "Admin": "ADM",
  }[role] || "EMP");

  const handleSave = () => {
    if (!form.name || !form.mobile) {
      toast.error("Full Name and Mobile are required");
      return;
    }
    if (modal === "add") {
      const code = roleCode(form.role);
      const existingCount = users.filter(u => u.role === form.role).length;
      const employeeCode = `${code}-${String(existingCount + 1).padStart(3, "0")}`;
      // Note: This uses total count of role in system, which is correct
      addUser({
        ...form,
        parentUserId: user?.id,
        createdBy: user?.id,
        employeeCode,
      }, user?.id);
      toast.success(`${form.role} created and linked to you automatically!`);
    } else {
      updateUser(selected.id, form);
      toast.success("User updated!");
    }
    setModal(null);
  };

  const handleDelete = (u) => {
    const hasChildren = users.some(child => child.parentUserId === u.id);
    const msg = hasChildren
      ? `Delete ${u.name}? This user has ${users.filter(c => c.parentUserId === u.id).length} team member(s) reporting to them. They will become orphaned.`
      : `Delete ${u.name}?`;
    if (window.confirm(msg)) {
      deleteUser(u.id);
      toast.success("User deleted");
    }
  };

  const columns = [
    { key: "employeeCode", label: "Code", render: v => <span className="font-mono text-xs text-gray-500">{v || "—"}</span> },
    {
      key: "name", label: "Name", render: (v, row) => (
        <div>
          <div className="font-semibold text-gray-800">{v}</div>
          <div className="text-xs text-gray-400">{row.email}</div>
        </div>
      )
    },
    { key: "role", label: "Role", render: v => <StatusBadge status={v} /> },
    { key: "mobile", label: "Mobile" },
    {
      key: "parentUserId", label: "Reports To", render: (v) => {
        const parent = users.find(u => u.id === v);
        return parent ? (
          <span className="text-sm text-gray-600">{parent.name}</span>
        ) : (
          <span className="text-sm text-gray-400">—</span>
        );
      }
    },
    { key: "region", label: "Region", render: v => v || "—" },
    { key: "branch", label: "Branch", render: v => v || "—" },
    { key: "status", label: "Status", render: v => <StatusBadge status={v} /> },
  ];

  // View specific team
  const handleViewTeam = (node) => {
    setViewingTeamId(node.id);
    setShowTree(false); // Switch to table view
    toast.success(`Showing ${node.name}'s team`, { duration: 2000 });
  };

  // Clear team filter
  const clearTeamFilter = () => {
    setViewingTeamId(null);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
            <Users size={22} /> User Management
          </h1>
     
        </div>
      <div className="flex items-center gap-2">
        {viewingTeamId && (
          <button onClick={clearTeamFilter} className="btn-secondary text-sm">
            <X size={14} /> Clear Filter
          </button>
        )}
        <button
          onClick={() => setShowTree(p => !p)}
          className={`${showTree ? "btn-primary" : "btn-secondary"} text-sm`}
        >
          {showTree ? <Users size={14} /> : <Users size={14} />} {showTree ? "Tree View" : "Table View"}
        </button>
        {hierarchy.canCreateUser() && (
          <button onClick={openAdd} className="btn-primary">
            <UserPlus size={16} /> Add User
          </button>
        )}
      </div>
      </div>

      {/* Role summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { role: "Admin", icon: Shield, color: "indigo" },
          { role: "Director", icon: Crown, color: "blue" },
          { role: "Regional Manager", icon: Globe, color: "purple" },
          { role: "Branch Manager", icon: Building2, color: "cyan" },
          { role: "BDM", icon: Briefcase, color: "orange" },
          { role: "Sales Manager", icon: Target, color: "green" },
        ].map(({ role, icon: Icon, color }) => {
          const count = visibleUsers.filter(u => u.role === role).length;
          const isActive = filterRole === role;
          const colorClasses = {
            indigo: "text-indigo-600",
            blue: "text-blue-600",
            purple: "text-purple-600",
            cyan: "text-cyan-600",
            orange: "text-orange-600",
            green: "text-green-600",
          };
          return (
            <div key={role} onClick={() => setFilterRole(prev => prev === role ? "" : role)} className="min-w-[180px]">
              <div className="card p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-12 h-12 rounded-2xl bg-${color}-50 ring-1 ring-${color}-100 flex items-center justify-center`}>
                    <Icon size={22} className={`text-${color}-600`} />
                  </div>
                </div>
                <div className="text-2xl font-extrabold text-gray-900 tabular-nums mb-0.5">
                  {count}
                </div>
                <div className={`text-xs ${isActive ? `font-bold ${colorClasses[color]}` : "font-medium text-gray-500"}`}>
                  {role}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Reporting info card */}
      <div className="card p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-sm">
          {user?.name?.charAt(0)}
        </div>
        <div className="flex-1">
          <div className="text-sm font-bold text-gray-800">
            {user?.name} · <StatusBadge status={user?.role} /> · <span className="font-mono text-gray-500 font-normal">{user?.employeeCode}</span>
          </div>
          <div className="text-xs text-gray-400 mt-0.5">
            {user?.parentUserId ? (
              (() => {
               const manager = users.find(u => u.id === user.parentUserId);
                return manager ? (
                  <>Reports to: <span className="font-medium text-gray-600">{manager.name} ({manager.role})</span></>
                ) : null;
              })()
            ) : (
              <>Top-level user · Full organization access</>
            )}
            {user?.branch && <> · Branch: <span className="font-medium text-gray-600">{user.branch}</span></>}
            {user?.region && <> · Region: <span className="font-medium text-gray-600">{user.region}</span></>}
          </div>
        </div>
       
      </div>

      {/* Team filter indicator */}
      {viewingTeamId && !showTree && (
        <div className="flex items-center gap-2 bg-blue-50 text-blue-700 text-sm font-semibold px-4 py-2.5 rounded-xl">
          <Users size={16} />
          <span>Viewing Team: {users.find(u => u.id === viewingTeamId)?.name}</span>
          <button onClick={clearTeamFilter} className="ml-auto hover:text-blue-900">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Search & Filter Bar (for tree view) */}
      {showTree && (
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={treeSearch}
              onChange={e => setTreeSearch(e.target.value)}
              placeholder="Search by Name, Code, Mobile, Role, Branch, Region..."
              className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {treeSearch && (
              <button onClick={() => setTreeSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
            )}
          </div>
          {viewingTeamId && (
            <div className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-xs font-semibold px-3 py-2 rounded-xl">
              <Users size={12} />
              Team View
              <button onClick={clearTeamFilter} className="ml-1 hover:text-indigo-900"><X size={12} /></button>
            </div>
          )}
          {filterRole && !viewingTeamId && (
            <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-2 rounded-xl">
              <Filter size={12} />
              {filterRole}
              <button onClick={() => setFilterRole("")} className="ml-1 hover:text-blue-900"><X size={12} /></button>
            </div>
          )}
          <div className="text-xs text-gray-400">
            {filteredUsers.length} of {visibleUsers.length} shown
          </div>
        </div>
      )}

      {/* Tree View */}
      {showTree ? (
        <div className="card p-5">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Building2 size={16} /> Organization Hierarchy
            <span className="text-xs font-normal text-gray-400 ml-1">
              ({users.length} total · {treeRoots.length} top-level)
            </span>
          </h3>

          {filteredUsers.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">
              {treeSearch ? "No users match your search" : "No users in your hierarchy"}
            </div>
          ) : (
            <div className="space-y-1">
              {treeRoots.map(root => (
                <TreeNode
                  key={root.id}
                  node={root}
                  users={users}
                  customers={customers}
                  bookings={bookings}
                  depth={0}
                  onViewTeam={handleViewTeam}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Table View */
        <DataTable
          title="Team Members"
          columns={columns}
          data={filteredUsers}
          searchKey={["name", "email", "role", "mobile", "employeeCode", "region", "branch"]}
          onAdd={hierarchy.canCreateUser() ? openAdd : undefined}
          addLabel={hierarchy.canCreateUser() ? `+ Add ${creatableRoles[0] || "User"}` : undefined}
          actions={(row) => (
            <>
              <button onClick={() => openView(row)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View">
                <Eye size={15} />
              </button>
              <button onClick={() => openEdit(row)} className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors" title="Edit">
                <Edit2 size={15} />
              </button>
              <button onClick={() => handleDelete(row)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                <Trash2 size={15} />
              </button>
            </>
          )}
        />
      )}

      {/* Add Modal */}
      <Modal open={modal === "add"} onClose={() => setModal(null)} title="Create New User">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Full Name *">
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="input-field" placeholder="Full name" autoComplete="off" />
          </FormField>
          <FormField label="Email">
            <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="input-field" placeholder="email@company.com (optional)" autoComplete="off" />
          </FormField>
          <FormField label="Mobile *">
            <input value={form.mobile} onChange={e => setForm(p => ({ ...p, mobile: e.target.value }))} className="input-field" placeholder="10-digit mobile" autoComplete="off" />
          </FormField>
          <FormField label="Role *">
            <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} className="input-field">
              {creatableRoles.map(r => <option key={r}>{r}</option>)}
            </select>
            
          </FormField>
          <FormField label="Region">
            <select value={form.region} onChange={e => setForm(p => ({ ...p, region: e.target.value }))} className="input-field">
              <option value="">{user?.region || "Select Region"}</option>
              {REGIONS.filter(r => r !== form.region).map(r => <option key={r}>{r}</option>)}
            </select>
          </FormField>
          <FormField label="Branch">
            <select value={form.branch} onChange={e => setForm(p => ({ ...p, branch: e.target.value }))} className="input-field">
              <option value="">{user?.branch || "Select Branch"}</option>
              {BRANCHES.filter(b => b !== form.branch).map(b => <option key={b}>{b}</option>)}
            </select>
          </FormField>
          <FormField label="Password">
            <input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} className="input-field" placeholder="Set password" autoComplete="off" />
          </FormField>
          <FormField label="Status">
            <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} className="input-field">
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </FormField>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={handleSave} className="btn-primary flex-1 justify-center py-2.5">Create {form.role}</button>
          <button onClick={() => setModal(null)} className="btn-secondary flex-1 justify-center py-2.5">Cancel</button>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal open={modal === "edit"} onClose={() => setModal(null)} title="Edit User">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Full Name *">
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="input-field" placeholder="Full name" autoComplete="off" />
          </FormField>
          <FormField label="Email *">
            <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="input-field" placeholder="email@company.com" autoComplete="off" />
          </FormField>
          <FormField label="Mobile *">
            <input value={form.mobile} onChange={e => setForm(p => ({ ...p, mobile: e.target.value }))} className="input-field" placeholder="10-digit mobile" autoComplete="off" />
          </FormField>
          <FormField label="Role">
            <input value={form.role} className="input-field bg-gray-50" disabled />
          </FormField>
          <FormField label="Employee Code">
            <input value={form.employeeCode || ""} className="input-field bg-gray-50" disabled />
          </FormField>
          <FormField label="Reports To">
            <input value={(() => { const p = users.find(u => u.id === form.parentUserId); return p ? `${p.name} (${p.role})` : "—"; })()} className="input-field bg-gray-50" disabled />
          </FormField>
          <FormField label="Region">
            <select value={form.region} onChange={e => setForm(p => ({ ...p, region: e.target.value }))} className="input-field">
              <option value="">Select Region</option>
              {REGIONS.map(r => <option key={r}>{r}</option>)}
            </select>
          </FormField>
          <FormField label="Branch">
            <select value={form.branch} onChange={e => setForm(p => ({ ...p, branch: e.target.value }))} className="input-field">
              <option value="">Select Branch</option>
              {BRANCHES.map(b => <option key={b}>{b}</option>)}
            </select>
          </FormField>
          <FormField label="Status">
            <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} className="input-field">
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </FormField>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={handleSave} className="btn-primary flex-1 justify-center py-2.5">Save Changes</button>
          <button onClick={() => setModal(null)} className="btn-secondary flex-1 justify-center py-2.5">Cancel</button>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal open={modal === "view"} onClose={() => setModal(null)} title="User Details">
        {selected && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 pb-5 border-b border-gray-100">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-2xl font-extrabold shadow-lg">
                {selected.name?.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="text-xl font-bold text-gray-900">{selected.name}</div>
                <div className="flex items-center gap-2 mt-1.5">
                  <StatusBadge status={selected.role} />
                  <span className="text-xs text-gray-500 font-mono">{selected.employeeCode}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {[
                ["Email", selected.email],
                ["Mobile", selected.mobile],
                ["Region", selected.region || "—"],
                ["Branch", selected.branch || "—"],
                ["Status", selected.status],
                ["Joined", selected.joinDate],
                ["Employee Code", selected.employeeCode || "—"],
                ["Reports To", (() => { const p = users.find(u => u.id === selected.parentUserId); return p ? `${p.name} (${p.role})` : "—"; })()],
                ["Created By", (() => { const c = users.find(u => u.id === selected.createdBy); return c ? c.name : "—"; })()],
                ["Direct Team", users.filter(u => u.parentUserId === selected.id).length],
                ["Total Downline", (() => { const d = []; const q = [...users.filter(u => u.parentUserId === selected.id)]; while (q.length) { const c = q.shift(); d.push(c); q.push(...users.filter(u => u.parentUserId === c.id)); } return d.length; })()],
              ].map(([k, v]) => {
                if (k === "Status") {
                  return (
                    <div key={k} className="flex items-center justify-between py-2">
                      <span className="text-sm text-gray-500">{k}</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        selected.status === "Active" 
                          ? "bg-green-50 text-green-700" 
                          : "bg-gray-100 text-gray-600"
                      }`}>
                        {v}
                      </span>
                    </div>
                  );
                }
                return (
                  <div key={k} className="flex items-center justify-between py-2">
                    <span className="text-sm text-gray-500">{k}</span>
                    <span className="text-sm font-semibold text-gray-900">{String(v)}</span>
                  </div>
                );
              })}
            </div>

            {(() => {
              const reports = users.filter(u => u.parentUserId === selected.id);
              if (reports.length === 0) return null;
              return (
                <div className="pt-4 border-t border-gray-100">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Direct Reports ({reports.length})</div>
                  <div className="space-y-2">
                    {reports.map(r => (
                      <div key={r.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                          {r.name?.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-gray-900 truncate">{r.name}</div>
                          <div className="flex items-center gap-1.5">
                            <StatusBadge status={r.role} />
                            <span className="text-[10px] text-gray-400 font-mono">{r.employeeCode}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </Modal>
    </div>
  );
}