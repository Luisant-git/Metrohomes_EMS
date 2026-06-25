import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useData } from "../../context/DataContext.jsx";
import DataTable from "../../components/DataTable.jsx";
import Modal from "../../components/Modal.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import { Eye, Edit2, Trash2, UserCheck, Phone, MapPin, Plus, UserPlus } from "lucide-react";
import toast from "react-hot-toast";

const STATUSES = ["Interested", "Visit Scheduled", "Visit Completed", "Ready for Booking", "Booked", "Payment Done", "Dropped"];
const emptyCustomer = { name: "", mobile: "", email: "", address: "", location: "", status: "Interested", siteId: "", salesManagerName: "", driverName: "", driverMobile: "", cabNumber: "", notes: "" };

export default function WebCustomers() {
  const navigate = useNavigate();
  const { customers, updateCustomer, deleteCustomer, addCustomer, sites } = useData();
  const [modal, setModal] = useState(null); // null | "add" | "view" | "edit"
  const [selected, setSelected] = useState(null);
  const [filterStatus, setFilterStatus] = useState("All");
  const [form, setForm] = useState(emptyCustomer);

  const filtered = filterStatus === "All" ? customers : customers.filter(c => c.status === filterStatus);

  const handleStatusChange = (id, status) => {
    updateCustomer(id, { status });
    toast.success("Status updated!");
  };

  const openAdd = () => { setForm(emptyCustomer); setModal("add"); };
  const openView = (c) => { setSelected(c); setModal("view"); };

  const handleAdd = () => {
    if (!form.name || !form.mobile) { toast.error("Name and mobile required"); return; }
    const site = sites.find(s => s.id === +form.siteId);
    addCustomer({ ...form, siteName: site?.name || "", salesManagerId: 6 });
    toast.success("Customer added!");
    setModal(null);
  };

  const handleDelete = (c) => {
    if (window.confirm(`Delete customer "${c.name}"?`)) { deleteCustomer(c.id); toast.success("Deleted"); }
  };

  const columns = [
    { key: "name", label: "Customer", render: (v, row) => (
      <div>
        <div className="font-semibold text-gray-800">{v}</div>
        <div className="text-xs text-gray-400 flex items-center gap-1"><Phone size={10} />{row.mobile}</div>
      </div>
    )},
    { key: "siteName", label: "Site" },
    { key: "salesManagerName", label: "Sales Manager" },
    { key: "visitDate", label: "Visit Date" },
    { key: "status", label: "Status", render: v => <StatusBadge status={v} /> },
    { key: "registeredDate", label: "Registered" },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2"><UserCheck size={22} />Customers</h1>
        <p className="text-gray-400 text-sm mt-0.5">{customers.length} total customers</p>
      </div>

      {/* Status filter chips */}
      <div className="flex flex-wrap gap-2">
        {["All", ...STATUSES].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${filterStatus === s ? "bg-blue-600 text-white shadow-sm" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
            {s} {s === "All" ? `(${customers.length})` : `(${customers.filter(c => c.status === s).length})`}
          </button>
        ))}
      </div>

      <DataTable title="Customer List" columns={columns} data={filtered} searchKey={["name", "mobile", "siteName", "salesManagerName", "status"]}
        onAdd={openAdd}
        addLabel="+ Add Customer"
        extraActions={
          <button onClick={() => navigate("/customer-registration")}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-blue-200">
            <UserPlus size={16} /> New Registration
          </button>
        }
        actions={(row) => (
          <>
            <button onClick={() => openView(row)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Eye size={15} /></button>
            <button onClick={() => { setSelected(row); setModal("edit"); }} className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg"><Edit2 size={15} /></button>
            <button onClick={() => handleDelete(row)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={15} /></button>
          </>
        )}
      />

      {/* Add Customer Modal */}
      <Modal open={modal === "add"} onClose={() => setModal(null)} title="Add New Customer" size="lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2"><label className="label">Full Name *</label><input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="input-field" placeholder="Customer full name" /></div>
          <div><label className="label">Mobile *</label><input value={form.mobile} onChange={e => setForm(p => ({ ...p, mobile: e.target.value }))} className="input-field" placeholder="10-digit mobile" /></div>
          <div><label className="label">Email</label><input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="input-field" placeholder="email@example.com" /></div>
          <div className="sm:col-span-2"><label className="label">Address</label><input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} className="input-field" placeholder="Full address" /></div>
          <div className="sm:col-span-2"><label className="label">Location (lat,lng)</label><input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} className="input-field" placeholder="e.g. 28.6139,77.2090" /></div>
          <div><label className="label">Site</label>
            <select value={form.siteId} onChange={e => setForm(p => ({ ...p, siteId: e.target.value }))} className="input-field">
              <option value="">Select Site</option>
              {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div><label className="label">Status</label>
            <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} className="input-field">
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2"><label className="label">Notes</label><textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} className="input-field h-20 resize-none" placeholder="Any notes..." /></div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={handleAdd} className="btn-primary flex-1 justify-center py-2.5"><Plus size={16} />Add Customer</button>
          <button onClick={() => setModal(null)} className="btn-secondary flex-1 justify-center py-2.5">Cancel</button>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal open={modal === "view"} onClose={() => setModal(null)} title="Customer Details">
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 bg-gray-50 rounded-2xl p-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-2xl font-bold">{selected.name?.charAt(0)}</div>
              <div>
                <div className="font-bold text-gray-900 text-lg">{selected.name}</div>
                <div className="text-gray-400 text-sm flex items-center gap-1"><Phone size={12} />{selected.mobile}</div>
                <div className="mt-1"><StatusBadge status={selected.status} /></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[["Site", selected.siteName], ["Sales Manager", selected.salesManagerName], ["Visit Date", selected.visitDate], ["Registered", selected.registeredDate], ["Address", selected.address], ["Location", selected.location]].map(([k, v]) => (
                <div key={k} className="bg-gray-50 rounded-xl p-3">
                  <div className="text-xs text-gray-400 font-semibold">{k}</div>
                  <div className="text-sm font-semibold text-gray-800 mt-0.5">{v || "—"}</div>
                </div>
              ))}
            </div>
            {selected.notes && <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-3"><div className="text-xs font-semibold text-yellow-700 mb-1">Notes</div><div className="text-sm text-gray-700">{selected.notes}</div></div>}
            
            {(selected.driverName || selected.driverMobile || selected.cabNumber) && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <div className="text-xs font-semibold text-blue-700 mb-2">🚗 Driver Details</div>
                <div className="grid grid-cols-2 gap-2">
                  {selected.driverName && <div><span className="text-xs text-gray-500">Driver Name:</span> <span className="text-sm font-semibold text-gray-800">{selected.driverName}</span></div>}
                  {selected.driverMobile && <div><span className="text-xs text-gray-500">Driver Mobile:</span> <span className="text-sm font-semibold text-gray-800">{selected.driverMobile}</span></div>}
                  {selected.cabNumber && <div className="col-span-2"><span className="text-xs text-gray-500">Cab Number:</span> <span className="text-sm font-semibold text-gray-800">{selected.cabNumber}</span></div>}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Edit Status Modal */}
      <Modal open={modal === "edit"} onClose={() => setModal(null)} title="Update Customer">
        {selected && (
          <div className="space-y-4">
            <div className="font-semibold text-gray-800 mb-4">{selected.name}</div>
            
            <div>
              <label className="label">Current Status</label>
              <StatusBadge status={selected.status} />
            </div>
            <div>
              <label className="label">Update Status</label>
              <select 
                value={selected.status} 
                onChange={e => { handleStatusChange(selected.id, e.target.value); setSelected(p => ({ ...p, status: e.target.value })); }}
                className="input-field mt-2"
              >
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="border-t border-gray-200 pt-4 mt-4">
              <div className="text-sm font-semibold text-gray-700 mb-3">🚗 Driver Details (Optional)</div>
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="label">Driver Name</label>
                  <input 
                    value={selected.driverName || ""} 
                    onChange={e => { setSelected(p => ({ ...p, driverName: e.target.value })); }}
                    className="input-field" 
                    placeholder="Enter driver name" 
                  />
                </div>
                <div>
                  <label className="label">Driver Mobile</label>
                  <input 
                    type="tel"
                    value={selected.driverMobile || ""} 
                    onChange={e => { setSelected(p => ({ ...p, driverMobile: e.target.value })); }}
                    className="input-field" 
                    placeholder="Driver mobile number"
                    maxLength={10}
                  />
                </div>
                <div>
                  <label className="label">Cab Number</label>
                  <input 
                    value={selected.cabNumber || ""} 
                    onChange={e => { setSelected(p => ({ ...p, cabNumber: e.target.value })); }}
                    className="input-field" 
                    placeholder="Cab/Vehicle number" 
                  />
                </div>
                <button 
                  onClick={() => { 
                    updateCustomer(selected.id, { 
                      driverName: selected.driverName, 
                      driverMobile: selected.driverMobile, 
                      cabNumber: selected.cabNumber 
                    }); 
                    toast.success("Driver details updated!"); 
                    setModal(null);
                  }}
                  className="btn-primary w-full justify-center py-2.5">
                  Save Driver Details
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
