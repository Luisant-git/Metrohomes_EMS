import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import Modal from "../../components/Modal.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import { siteVisit } from "../../api/siteVisit.js";
import { Eye, SquarePen, Search, X, UserX } from "lucide-react";
import { toast } from "react-toastify";

const STATUSES = ["Interested", "Visit Scheduled", "Visit Completed"];

export default function PWASiteVisits() {
  const { user } = useAuth();
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [siteVisits, setSiteVisits] = useState([]);
  const [visitsLoading, setVisitsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSiteVisits();
  }, []);

  const fetchSiteVisits = async () => {
    try {
      setVisitsLoading(true);
      const res = await siteVisit.getAll();
      const list = res?.data || res || [];
      setSiteVisits(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Failed to fetch site visits:", err);
    } finally {
      setVisitsLoading(false);
    }
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

  const formatTime = (timeStr) => {
    if (!timeStr) return "—";
    const [h, m] = timeStr.split(':');
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${m} ${ampm}`;
  };

  const filteredVisits = siteVisits.filter(v => {
    if (filterStatus !== "All" && v.status !== filterStatus) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        v.customer?.name?.toLowerCase().includes(s) ||
        v.customer?.phone?.includes(s) ||
        v.siteNo?.toLowerCase().includes(s) ||
        v.projectName?.toLowerCase().includes(s)
      );
    }
    return true;
  });

  const totalPages = Math.ceil(filteredVisits.length / ITEMS_PER_PAGE);
  const paginatedVisits = filteredVisits.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const openView = (visit) => { setSelected(visit); setModal("view"); };
  const openEdit = (visit) => { setSelected(visit); setModal("edit"); };

  return (
    <div className="pb-4">
      <div className="px-4 py-4">
        <h1 className="text-xl font-bold text-gray-900">Site Visits</h1>
        <p className="text-sm text-gray-400 mt-0.5">{siteVisits.length} total visits</p>
      </div>

      <div className="px-4 space-y-3">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 pb-2">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                placeholder="Search visits..."
                className="w-full pl-8 pr-2 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400">
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          <div className="px-4 pb-2">
            <select
              value={filterStatus}
              onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1); }}
              className="w-full rounded-xl px-3 py-2 bg-gray-50 border border-gray-200 text-xs font-medium text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Status</option>
              {STATUSES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-t border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Site</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-center px-4 py-2.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {visitsLoading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center">
                      <div className="flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      </div>
                    </td>
                  </tr>
                ) : paginatedVisits.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-400">
                        <UserX size={32} className="mb-2" />
                        <span className="text-sm">No site visits found</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedVisits.map((visit) => (
                    <tr key={visit.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="min-w-0">
                          <div className="font-semibold text-gray-800 text-sm truncate block">{visit.customer?.name || "—"}</div>
                          <div className="text-xs text-gray-400">{visit.customer?.phone || ""}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-700">Site {visit.siteNo || "—"}</span>
                        {visit.projectName && <div className="text-xs text-gray-400 mt-0.5">{visit.projectName}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600">{formatDate(visit.visitDate)}</span>
                        {visit.visitTime && <span className="text-xs text-gray-400 block">{formatTime(visit.visitTime)}</span>}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={visit.status || "Interested"} />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => openView(visit)} className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors" title="View"><Eye size={15} /></button>
                          <button onClick={() => openEdit(visit)} className="p-1.5 text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors" title="Edit"><SquarePen size={15} /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
                Prev
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-7 h-7 rounded-lg text-xs font-medium transition-all ${currentPage === page ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* View Modal - Mobile optimized */}
      <Modal open={modal === "view"} onClose={() => setModal(null)} title="Visit Details" size="full">
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl bg-blue-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                {selected.customer?.name?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-gray-900 truncate">{selected.customer?.name}</h3>
                <p className="text-sm text-gray-500">{selected.customer?.phone}</p>
              </div>
              <StatusBadge status={selected.status} />
            </div>

            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              {[
                ["Project", selected.projectName],
                ["Site", `Site ${selected.siteNo}`],
                ["Visit Date", formatDate(selected.visitDate)],
                ["Visit Time", formatTime(selected.visitTime)],
                ["Persons", selected.persons],
                ["Purchase Mode", selected.purchaseMode],
                ["Pickup Location", selected.pickupLocation],
                ["Assigned To", selected.assignedToUser?.name || "—"],
                ["Notes", selected.notes],
              ].map(([k, v]) => (
                <div key={k} className="flex flex-col gap-0.5">
                  <span className="text-[11px] text-gray-400 font-medium tracking-wide uppercase">{k}</span>
                  <span className="text-sm text-gray-800 font-medium break-words">{v || "—"}</span>
                </div>
              ))}
            </div>

            {(selected.driverName || selected.driverMobile || selected.cabNumber) && (
              <div className="bg-blue-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-blue-600 tracking-wide mb-2 uppercase">Driver Details</p>
                <div className="space-y-2">
                  {selected.driverName && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Name</span>
                      <span className="text-sm text-gray-800 font-medium">{selected.driverName}</span>
                    </div>
                  )}
                  {selected.driverMobile && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Mobile</span>
                      <span className="text-sm text-gray-800 font-medium">{selected.driverMobile}</span>
                    </div>
                  )}
                  {selected.cabNumber && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Cab</span>
                      <span className="text-sm text-gray-800 font-medium">{selected.cabNumber}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Edit Status Modal - Mobile optimized */}
      <Modal open={modal === "edit"} onClose={() => setModal(null)} title="Update Visit" size="full">
        {selected && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
                  {selected.customer?.name?.charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">{selected.customer?.name}</h3>
                  <p className="text-xs text-gray-500">Site {selected.siteNo}</p>
                </div>
              </div>
            </div>

            <div>
              <label className="label">Current Status</label>
              <div className="mt-2"><StatusBadge status={selected.status} /></div>
            </div>

            <div>
              <label className="label">Update Status</label>
              <select 
                value={selected.status} 
                onChange={e => setSelected(p => ({ ...p, status: e.target.value }))}
                className="input-field mt-2"
              >
                {STATUSES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="border-t border-gray-200 pt-4 mt-4">
              <div className="text-sm font-bold text-gray-700 mb-3">Driver Details (Optional)</div>
              <div className="space-y-3">
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
                  disabled={saving}
                  onClick={async () => { 
                    try {
                      setSaving(true);
                      const hasDriver = selected.driverName || selected.driverMobile || selected.cabNumber;
                      const updates = { 
                        status: hasDriver ? "Visit Scheduled" : selected.status,
                        driverName: selected.driverName,
                        driverMobile: selected.driverMobile,
                        cabNumber: selected.cabNumber,
                      };
                      await siteVisit.update(selected.id, updates);
                      toast.success("Visit updated successfully!"); 
                      setModal(null);
                      fetchSiteVisits();
                    } catch (err) {
                      toast.error(err.message || "Failed to update visit");
                    } finally {
                      setSaving(false);
                    }
                  }}
                  className="btn-primary w-full justify-center py-3 disabled:opacity-50">
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}