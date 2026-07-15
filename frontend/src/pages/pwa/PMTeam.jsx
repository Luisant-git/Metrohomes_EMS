import { useState, useMemo } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useData } from "../../context/DataContext.jsx";
import { useNavigate, useLocation } from "react-router-dom";
import Modal from "../../components/Modal.jsx";
import { Users, UserPlus, ArrowRight, ChevronDown, Mail, Phone, Target, TrendingUp, Edit3, Power, Eye, Trash2 } from "lucide-react";

export default function PMTeam() {
  const { user, hierarchy } = useAuth();
  const { users, customers, bookings, addUser, updateUser } = useData();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(location.state?.openAddForm || false);
  const [expanded, setExpanded] = useState({});
  const [selectedMember, setSelectedMember] = useState(null);

  const myBMs = useMemo(() => users.filter(u => u.role === "Branch Manager" && u.parentUserId === user?.id), [users, user]);
  
  const bmIds = useMemo(() => myBMs.map(bm => bm.id), [myBMs]);
  
  const myBDMs = useMemo(() => users.filter(u => u.role === "BDM" && bmIds.includes(u.parentUserId)), [users, bmIds]);
  
  const mySMs = useMemo(() => {
    const bdmIds = myBDMs.map(bdm => bdm.id);
    return users.filter(u => u.role === "Sales Manager" && bdmIds.includes(u.parentUserId));
  }, [users, myBDMs]);

  const toggleExpand = (userId) => setExpanded(prev => ({ ...prev, [userId]: !prev[userId] }));

  const getMemberStats = (bm) => {
    const bmCustomers = customers.filter(c => {
      const sm = users.find(u => u.id === c.salesManagerId);
      return sm && sm.parentUserId === bm.id;
    });
    const bmBookings = bookings.filter(b => {
      const sm = users.find(u => u.id === b.salesManagerId);
      return sm && sm.parentUserId === bm.id;
    });
    return { customers: bmCustomers.length, bookings: bmBookings.length };
  };

  const handleAddBM = (e) => {
    e.preventDefault();
    const form = e.target;
      const bmCount = users.filter(u => u.role === "Branch Manager").length + 1;
      const newBM = {
        name: form.name.value,
        email: form.email.value,
        mobile: form.mobile.value,
        password: form.password.value,
        branch: form.branch.value,
        role: "Branch Manager",
        parentUserId: user.id,
        createdBy: user.id,
        status: "Active",
        employeeCode: `BM-${String(bmCount).padStart(3, '0')}`,
      };
    addUser(newBM, user.id);
    setOpen(false);
    form.reset();
  };

  const toggleStatus = (bm) => {
    updateUser(bm.id, { status: bm.status === "Active" ? "Inactive" : "Active" });
  };

  return (
    <div className="pb-24">
      <div className="px-4 py-4">
        <h1 className="text-xl font-bold text-gray-900">My Team</h1>
        <p className="text-sm text-gray-400 mt-0.5">Manage Branch Managers</p>
      </div>

      {/* Summary Cards */}
      <div className="px-4 grid grid-cols-2 gap-3 mb-4">
        {[
          { label: "BM Count", value: myBMs.length, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "BDE Count", value: myBDMs.length, icon: Users, color: "text-cyan-600", bg: "bg-cyan-50" },
          { label: "Sales Managers", value: mySMs.length, icon: Users, color: "text-purple-600", bg: "bg-purple-50" },
          { label: "Total Customers", value: myBMs.reduce((sum, b) => sum + getMemberStats(b).customers, 0), icon: Users, color: "text-green-600", bg: "bg-green-50" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center mb-2`}>
              <s.icon size={20} className={s.color} />
            </div>
            <div className={`text-2xl font-extrabold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="px-4 space-y-3">
        {myBMs.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center">
            <Users size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No Branch Managers yet</p>
          </div>
        ) : (
          myBMs.map(bm => {
            const stats = getMemberStats(bm);
            const isExpanded = expanded[bm.id];
            const subTeam = users.filter(u => u.parentUserId === bm.id);
            return (
              <div key={bm.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-lg flex-shrink-0">
                      {bm.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-800 truncate">{bm.name}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{bm.employeeCode} · {bm.branch}</div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><Mail size={12} />{bm.email}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><Phone size={12} />{bm.mobile}</span>
                      </div>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${bm.status === "Active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {bm.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-50">
                    <div className="text-center">
                      <div className="text-sm font-bold text-blue-600">{stats.customers}</div>
                      <div className="text-xs text-gray-400">Customers</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-bold text-green-600">{stats.bookings}</div>
                      <div className="text-xs text-gray-400">Bookings</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-bold text-purple-600">60%</div>
                      <div className="text-xs text-gray-400">Target</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-50">
                    <button onClick={() => setSelectedMember(bm)} className="flex-1 bg-gray-50 text-gray-600 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1">
                      <Eye size={14} />View
                    </button>
                    <button className="flex-1 bg-blue-50 text-blue-600 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1">
                      <Edit3 size={14} />Edit
                    </button>
                    <button onClick={() => toggleStatus(bm)} className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 ${bm.status === "Active" ? "bg-orange-50 text-orange-600" : "bg-green-50 text-green-600"}`}>
                      <Power size={14} />{bm.status === "Active" ? "Disable" : "Enable"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {open && (
        <div className="fixed inset-0 bg-white z-50">
          <div className="px-4 pt-4">
            <div className="flex items-center justify-between mb-4">
              <button type="button" onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-700 p-2">← Back</button>
              <h2 className="text-lg font-bold text-gray-900">Add Branch Manager</h2>
              <div className="w-10"></div>
            </div>
            <div className="bg-blue-50 rounded-2xl p-3 text-sm text-blue-700 font-medium mb-4">
              👤 Enter Branch Manager details
            </div>
          </div>
          <form onSubmit={handleAddBM} className="px-4 pb-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name *</label>
              <input name="name" required className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" placeholder="Enter full name" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mobile *</label>
                <input name="mobile" required className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" placeholder="Mobile number" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email *</label>
                <input name="email" type="email" required className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" placeholder="Email" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password *</label>
              <input name="password" type="password" required className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" placeholder="Password" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Branch *</label>
              <input name="branch" required className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" placeholder="Branch name" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Address</label>
              <textarea name="address" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" rows="2" placeholder="Address"></textarea>
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-300">Create Branch Manager</button>
          </form>
        </div>
      )}

      {/* Member Details Modal */}
      <Modal open={!!selectedMember} onClose={() => setSelectedMember(null)} title="Team Member Details" size="lg">
        {selectedMember && (() => {
          const stats = getMemberStats(selectedMember);
          return (
            <div className="space-y-4">
              <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-2xl">
                  {selectedMember.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{selectedMember.name}</h3>
                  <p className="text-sm text-gray-500">{selectedMember.role} · {selectedMember.employeeCode}</p>
                  <p className="text-xs text-gray-400 mt-1">Joined: {selectedMember.joinDate || "N/A"}</p>
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
                  <div className="text-sm font-semibold text-gray-800">{selectedMember.branch}</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <div className="text-xs text-gray-400">Status</div>
                  <div className="text-sm font-semibold text-gray-800">{selectedMember.status}</div>
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
                  <div>
                    <div className="text-xs text-gray-500">Monthly Target</div>
                    <div className="text-xl font-bold text-purple-600">5</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Achievement</div>
                    <div className="text-xl font-bold text-orange-600">60%</div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button className="flex-1 bg-blue-600 text-white py-2 rounded-xl text-sm font-semibold">Generate Report</button>
                <button className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-xl text-sm font-semibold">Export PDF</button>
              </div>
            </div>
          );
        })}
      </Modal>
    </div>
  );
}