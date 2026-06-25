import { useState } from "react";
import { useData } from "../../context/DataContext.jsx";
import DataTable from "../../components/DataTable.jsx";
import Modal from "../../components/Modal.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import { Edit2, Trash2, Plus, Eye, Users } from "lucide-react";
import toast from "react-hot-toast";

const ROLES = ["Admin", "Director", "Regional Manager", "Branch Manager", "BDM", "Sales Manager"];
const REGIONS = ["North", "South", "East", "West", "Central"];
const BRANCHES = ["Delhi HQ", "Mumbai HQ", "Bangalore Branch", "Hyderabad Branch", "Chennai Branch"];

const emptyForm = { name: "", email: "", mobile: "", role: "Sales Manager", region: "", branch: "", status: "Active" };

function FormField({ label, children }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}

export default function UserManagement() {
  const { users, addUser, updateUser, deleteUser } = useData();
  const [modal, setModal] = useState(null); // null | "add" | "edit" | "view"
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const openAdd = () => { setForm(emptyForm); setModal("add"); };
  const openEdit = (u) => { setSelected(u); setForm({ ...u }); setModal("edit"); };
  const openView = (u) => { setSelected(u); setModal("view"); };

  const handleSave = () => {
    if (!form.name || !form.email || !form.mobile) { toast.error("Fill all required fields"); return; }
    if (modal === "add") { addUser(form); toast.success("User added!"); }
    else { updateUser(selected.id, form); toast.success("User updated!"); }
    setModal(null);
  };

  const handleDelete = (u) => {
    if (window.confirm(`Delete ${u.name}?`)) { deleteUser(u.id); toast.success("User deleted"); }
  };

  const columns = [
    { key: "name", label: "Name", render: (v, row) => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-sm font-bold flex-shrink-0">{v?.charAt(0)}</div>
        <div><div className="font-semibold text-gray-800">{v}</div><div className="text-xs text-gray-400">{row.email}</div></div>
      </div>
    )},
    { key: "role", label: "Role", render: v => <StatusBadge status={v} /> },
    { key: "mobile", label: "Mobile" },
    { key: "region", label: "Region", render: v => v || "—" },
    { key: "branch", label: "Branch", render: v => v || "—" },
    { key: "status", label: "Status", render: v => <StatusBadge status={v} /> },
    { key: "joinDate", label: "Joined" },
  ];

  const F = ({ label, children }) => (
    <div><label className="label">{label}</label>{children}</div>
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2"><Users size={22} />User Management</h1>
          <p className="text-gray-400 text-sm mt-0.5">{users.length} users registered</p>
        </div>
      </div>

      {/* Role summary */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
        {ROLES.map(role => {
          const count = users.filter(u => u.role === role).length;
          return (
            <div key={role} className="card p-3 text-center">
              <div className="text-2xl font-extrabold text-blue-600">{count}</div>
              <div className="text-xs text-gray-400 mt-0.5 leading-tight">{role}</div>
            </div>
          );
        })}
      </div>

      <DataTable
        title="All Users"
        columns={columns}
        data={users}
        searchKey={["name", "email", "role", "mobile"]}
        onAdd={openAdd}
        addLabel="+ Add User"
        actions={(row) => (
          <>
            <button onClick={() => openView(row)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View"><Eye size={15} /></button>
            <button onClick={() => openEdit(row)} className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors" title="Edit"><Edit2 size={15} /></button>
            <button onClick={() => handleDelete(row)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><Trash2 size={15} /></button>
          </>
        )}
      />

      {/* Add/Edit Modal */}
      <Modal open={modal === "add" || modal === "edit"} onClose={() => setModal(null)} title={modal === "add" ? "Add New User" : "Edit User"}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Full Name *">
            <input
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              className="input-field"
              placeholder="Full name"
              autoComplete="off"
            />
          </FormField>
          <FormField label="Email *">
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              className="input-field"
              placeholder="email@company.com"
              autoComplete="off"
            />
          </FormField>
          <FormField label="Mobile *">
            <input
              value={form.mobile}
              onChange={e => setForm(p => ({ ...p, mobile: e.target.value }))}
              className="input-field"
              placeholder="10-digit mobile"
              autoComplete="off"
            />
          </FormField>
          <FormField label="Role *">
            <select
              value={form.role}
              onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
              className="input-field"
            >
              {ROLES.map(r => <option key={r}>{r}</option>)}
            </select>
          </FormField>
          <FormField label="Region">
            <select
              value={form.region}
              onChange={e => setForm(p => ({ ...p, region: e.target.value }))}
              className="input-field"
            >
              <option value="">Select Region</option>
              {REGIONS.map(r => <option key={r}>{r}</option>)}
            </select>
          </FormField>
          <FormField label="Branch">
            <select
              value={form.branch}
              onChange={e => setForm(p => ({ ...p, branch: e.target.value }))}
              className="input-field"
            >
              <option value="">Select Branch</option>
              {BRANCHES.map(b => <option key={b}>{b}</option>)}
            </select>
          </FormField>
          <FormField label="Status">
            <select
              value={form.status}
              onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
              className="input-field"
            >
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </FormField>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={handleSave} className="btn-primary flex-1 justify-center py-2.5">{modal === "add" ? "Add User" : "Save Changes"}</button>
          <button onClick={() => setModal(null)} className="btn-secondary flex-1 justify-center py-2.5">Cancel</button>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal open={modal === "view"} onClose={() => setModal(null)} title="User Details">
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
              <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-2xl font-extrabold shadow-lg">
                {selected.name?.charAt(0)}
              </div>
              <div>
                <div className="text-xl font-bold text-gray-900">{selected.name}</div>
                <StatusBadge status={selected.role} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[["Email", selected.email], ["Mobile", selected.mobile], ["Region", selected.region || "—"], ["Branch", selected.branch || "—"], ["Status", selected.status], ["Joined", selected.joinDate]].map(([k, v]) => (
                <div key={k} className="bg-gray-50 rounded-xl p-3">
                  <div className="text-xs text-gray-400 font-semibold mb-0.5">{k}</div>
                  <div className="text-sm font-semibold text-gray-800">{v}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
