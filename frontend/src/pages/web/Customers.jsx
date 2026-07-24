import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { useData } from "../../context/DataContext.jsx";
import DataTable from "../../components/DataTable.jsx";
import Modal from "../../components/Modal.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import { Eye, SquarePen, Trash2, UserCheck, Phone, UserPlus, AlertTriangle, Search, X, Clock, Users, IndianRupee, CheckCircle } from "lucide-react";
import { toast } from "react-toastify";

const STATUSES = ["Interested", "Visit Scheduled", "Visit Completed", "Booked", "Payment Done"];

export default function WebCustomers() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { customers = [], updateCustomer, deleteCustomer, sites = [], users = [] } = useData();
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [historyCustomer, setHistoryCustomer] = useState(null);
  const [filterStatus, setFilterStatus] = useState("All");
  const [roleFilter, setRoleFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const teamRoles = useMemo(() => {
    const roleSet = new Set();
    users.forEach(u => {
      if (u?.role) roleSet.add(u.role);
    });
    return ["All", ...Array.from(roleSet)];
  }, [users]);

  const getCreatorRole = (customer) => {
    const creator = users.find(u => u.id === (customer.createdById || customer.createdBy) || u.name === customer.salesManagerName);
    return creator?.role || "";
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yy = String(d.getFullYear()).slice(-2);
    return `${dd}/${mm}/${yy}`;
  };

  const filtered = customers.filter(c => {
    if (filterStatus !== "All" && c.status !== filterStatus) return false;
    if (roleFilter !== "All" && getCreatorRole(c) !== roleFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      const match = c.name?.toLowerCase().includes(s) ||
        c.mobile?.includes(s) ||
        c.siteName?.toLowerCase().includes(s) ||
        c.salesManagerName?.toLowerCase().includes(s) ||
        c.status?.toLowerCase().includes(s);
      if (!match) return false;
    }
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      const regDate = new Date(c.registeredDate);
      if (regDate < fromDate) return false;
    }
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      const regDate = new Date(c.registeredDate);
      if (regDate > toDate) return false;
    }
    return true;
  });

  const handleStatusChange = (id, status) => {
    updateCustomer(id, { status });
    toast.success("Status updated!");
  };

  const openView = (c) => { setSelected(c); setModal("view"); };
  const openEdit = (c) => { setSelected(c); setModal("edit"); };

  const confirmDelete = () => {
    if (deleteTarget) {
      deleteCustomer(deleteTarget.id);
      toast.success(`Customer "${deleteTarget.name}" deleted`);
      setDeleteTarget(null);
    }
  };

  const columns = [
    { key: "name", label: "Customer", render: (v, row) => (
      <div>
        <div className="font-medium text-gray-800">{v}</div>
        <div className="text-xs text-gray-400 flex items-center gap-1"><Phone size={10} />{row.mobile}</div>
      </div>
    )},
    { key: "siteName", label: "Last Site", render: v => v || "—" },
    { key: "salesManagerName", label: "Created By", render: v => v || "—" },
    { key: "visitDate", label: "Last Visit", render: (v) => formatDate(v) },
    { key: "status", label: "Status", render: v => <StatusBadge status={v} /> },
    { key: "registeredDate", label: "Registered", render: (v) => formatDate(v) },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-normal text-gray-900 flex items-center gap-2"><UserCheck size={22} />Site Visit</h1>
        <p className="text-gray-400 text-sm mt-0.5">{customers.length} total visits</p>
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

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
               placeholder="Search by Name, Mobile, Site, Created By..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            )}
          </div>

          <div>
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-sm"
            >
              {teamRoles.map(role => (
                <option key={role} value={role}>
                  {role === "All" ? "All Roles" : role}
                </option>
              ))}
            </select>
          </div>

          <div>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="input-field" placeholder="From Date" />
          </div>
          <div>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="input-field" placeholder="To Date" />
          </div>

          {(search || dateFrom || dateTo || roleFilter !== "All") && (
            <button onClick={() => { setSearch(""); setDateFrom(""); setDateTo(""); setRoleFilter("All"); }} className="px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors">
              Clear Filters
            </button>
          )}

          <span className="text-xs text-gray-400 ml-auto">{filtered.length} of {customers.length} customers</span>
        </div>
      </div>

      <DataTable title="Project Visit List" columns={columns} data={filtered} searchKey={[]} hideSearch={true}
        extraActions={
          <button onClick={() => navigate("/customer-registration")}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-blue-200">
            <UserPlus size={16} /> New Registration
          </button>
        }
        actions={(row) => (
          <>
            <button onClick={() => openView(row)} className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors" title="View"><Eye size={15} /></button>
            <button onClick={() => openEdit(row)} className="p-1.5 text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors" title="Edit"><SquarePen size={15} /></button>
            <button onClick={() => setHistoryCustomer(row)} className="p-1.5 text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors" title="Visit History"><Clock size={15} /></button>
            <button onClick={() => setDeleteTarget(row)} className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors" title="Delete"><Trash2 size={15} /></button>
          </>
        )}
      />

      {/* Delete Confirmation Modal */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Customer" size="sm">
        {deleteTarget && (
          <div className="text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <AlertTriangle size={28} className="text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Are you sure?</h3>
            <p className="text-sm text-gray-500 mb-1">
              You are about to delete this customer:
            </p>
            <p className="text-sm font-medium text-gray-800 mb-4">
              "{deleteTarget.name}"
              <span className="block text-xs font-normal text-gray-400 mt-1">
                {deleteTarget.mobile} · {deleteTarget.siteName}
              </span>
            </p>

            <div className="flex gap-3">
              <button onClick={confirmDelete} className="btn-primary flex-1 justify-center py-2.5 bg-red-600 hover:bg-red-700 border-red-600">
                Yes, Delete
              </button>
              <button onClick={() => setDeleteTarget(null)} className="btn-secondary flex-1 justify-center py-2.5">
                Cancel
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* View Modal */}
      <Modal open={modal === "view"} onClose={() => setModal(null)} title="Customer Details">
        {selected && (
            <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                {selected.name?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-extrabold text-gray-900 truncate">{selected.name}</h3>
                <p className="text-sm text-gray-500">{selected.mobile}</p>
              </div>
              <StatusBadge status={selected.status} />
            </div>

            <div className="space-y-2.5">
              {[
                ["Email", selected.email],
                ["Project", selected.siteName],
                ["Created By", (() => { const creator = users.find(u => u.id === selected.createdById); return creator ? `${creator.name} (${creator.employeeCode})` : (selected.salesManagerName || "—"); })()],
                [(() => { const creator = users.find(u => u.id === selected.createdById); return creator ? `${creator.role} Mobile` : "Mobile"; })(), (() => { const creator = users.find(u => u.id === selected.createdById); return creator ? creator.mobile : "—"; })()],
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
                <p className="text-sm text-gray-700 leading-relaxed">{selected.notes}</p>
              </div>
            )}

            {(selected.driverName || selected.driverMobile || selected.cabNumber) && (
              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs font-semibold text-blue-600 tracking-wide mb-1">🚗 Driver Details</p>
                <div className="space-y-1">
                  {selected.driverName && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Name</span>
                      <span className="text-sm text-gray-800">{selected.driverName}</span>
                    </div>
                  )}
                  {selected.driverMobile && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Mobile</span>
                      <span className="text-sm text-gray-800">{selected.driverMobile}</span>
                    </div>
                  )}
                  {selected.cabNumber && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Cab</span>
                      <span className="text-sm text-gray-800">{selected.cabNumber}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Visit History Modal */}
      <Modal open={!!historyCustomer} onClose={() => setHistoryCustomer(null)} title="Visit History" size="lg">
        {historyCustomer && (
          <div className="space-y-0">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center text-white text-base font-bold flex-shrink-0">
                {historyCustomer.name?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-gray-900 truncate">{historyCustomer.name}</h3>
                <p className="text-[11px] text-gray-500">{historyCustomer.mobile}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-purple-700 bg-purple-100 border border-purple-200 px-3 py-1.5 rounded-full">
                  {historyCustomer.visitCount || historyCustomer.visits?.length || 0} visits
                </span>
                <StatusBadge status={historyCustomer.status} />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-100">
              {historyCustomer.visits && historyCustomer.visits.length > 0 ? (
                historyCustomer.visits.map((visit, idx) => {
                  const statusColors = {
                    'Interested': 'bg-blue-100 text-blue-700',
                    'Visit Scheduled': 'bg-yellow-100 text-yellow-700',
                    'Visit Completed': 'bg-green-100 text-green-700',
                    'Booked': 'bg-emerald-100 text-emerald-700',
                    'Payment Done': 'bg-green-100 text-green-700',
                    'Follow-up': 'bg-orange-100 text-orange-700',
                  };
                  const iconColors = ['bg-green-100 text-green-700', 'bg-yellow-100 text-yellow-700', 'bg-blue-100 text-blue-700'];
                  const iconColor = iconColors[idx % iconColors.length];
                  const visitDate = formatDate(visit.visitDate);
                  const displayDate = visitDate === '—' ? '—' : visitDate;

                  return (
                    <div key={visit.id} className="px-4 py-4">
                      <div className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="text-[10px] text-gray-400 font-medium leading-tight">
                            {displayDate !== '—' ? (() => { const d = new Date(visit.visitDate); return `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`; })() : '—'}
                          </div>
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center mt-1 ${iconColor}`}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="text-sm font-bold text-gray-900">{visit.siteName || `Visit #${historyCustomer.visitCount - idx}`}</h4>
                            <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${statusColors[visit.status] || 'bg-gray-100 text-gray-700'}`}>{visit.status}</span>
                          </div>

                          <div className="text-[11px] text-gray-400 mb-2">
                            {visit.visitDate && !visit.visitDate.includes('T') ? visit.visitDate : ''} {visit.visitTime ? (() => { const [h,m] = visit.visitTime.split(':'); const hour = parseInt(h,10); const ampm = hour >= 12 ? 'PM' : 'AM'; const hour12 = hour % 12 || 12; return `${hour12}:${m} ${ampm}`; })() : ''}
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-600 mb-2">
                            <span className="flex items-center gap-1"><Users size={12} /> {visit.persons} Persons</span>
                            <span className="flex items-center gap-1"><IndianRupee size={12} /> {visit.purchaseMode}</span>
                          </div>

                          {visit.registeredBy && (
                            <div className="text-[10px] text-gray-500 mb-2">
                              Assigned To <span className="font-semibold text-gray-700">{visit.registeredBy}</span> <span className="text-gray-400">{visit.registeredByRole ? `(${visit.registeredByRole})` : ''}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="px-4 py-6 text-center text-gray-400 text-sm">No visit history available</div>
              )}
            </div>

            {historyCustomer.visits && historyCustomer.visits.length > 1 && (
              <div className="text-center py-2">
                <p className="text-[10px] text-gray-400">Showing all {historyCustomer.visits.length} visits · Latest visit at the top</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Edit Status Modal */}
      <Modal open={modal === "edit"} onClose={() => setModal(null)} title="Update Customer">
        {selected && (
          <div className="space-y-4">
            <div className="font-medium text-gray-800 mb-4">{selected.name}</div>
            
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
                {STATUSES.filter(s => !["Dropped", "Payment Done", "Booked"].includes(s)).map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="border-t border-gray-200 pt-4 mt-4">
              <div className="text-sm font-bold text-gray-700 mb-3">🚗 Driver Details (Optional)</div>
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