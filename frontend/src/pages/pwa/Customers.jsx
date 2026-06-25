import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useData } from "../../context/DataContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { Search, Plus, Phone, MapPin, ChevronRight, Filter, ArrowRight } from "lucide-react";
import StatusBadge from "../../components/StatusBadge.jsx";
import Modal from "../../components/Modal.jsx";
import toast from "react-hot-toast";

const STATUSES = ["All", "Interested", "Visit Scheduled", "Visit Completed", "Ready for Booking", "Booked", "Payment Done", "Dropped"];
const NEXT_STATUS = {
  "Interested": "Visit Scheduled",
  "Visit Scheduled": "Visit Completed",
  "Visit Completed": "Ready for Booking",
  "Ready for Booking": "Booked",
};

export default function PWACustomers() {
  const { customers, updateCustomer } = useData();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState(null);

  const myCustomers = customers.filter(c => c.salesManagerId === user?.id || user?.id === 6);
  const filtered = myCustomers.filter(c => {
    const matchFilter = filter === "All" || c.status === filter;
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.mobile.includes(search);
    return matchFilter && matchSearch;
  });

  const advanceStatus = (c) => {
    const next = NEXT_STATUS[c.status];
    if (!next) { toast("No further status to advance to"); return; }
    updateCustomer(c.id, { status: next });
    toast.success(`Status updated: ${next}`);
  };

  return (
    <div className="pb-4">
      <div className="px-4 pt-4 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search customers…"
            className="w-full bg-white border border-gray-200 rounded-2xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm" />
        </div>

        {/* Status filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {STATUSES.slice(0, 5).map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${filter === s ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-600"}`}>
              {s === "All" ? `All (${myCustomers.length})` : s.split(" ")[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Customer list */}
      <div className="px-4 mt-3 space-y-2">
        {filtered.map(c => (
          <div key={c.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4" onClick={() => setSelected(c)}>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg flex-shrink-0">
                {c.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-gray-900 truncate">{c.name}</div>
                <div className="flex items-center gap-1 text-gray-400 text-xs mt-0.5">
                  <Phone size={10} />{c.mobile} · {c.siteName}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <StatusBadge status={c.status} />
                <span className="text-xs text-gray-400">{c.visitDate}</span>
              </div>
            </div>
            {/* Quick advance / proceed to booking */}
            {NEXT_STATUS[c.status] && (
              <button onClick={e => { e.stopPropagation(); advanceStatus(c); }}
                className="w-full mt-3 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold py-2 rounded-xl transition-colors">
                → Mark as "{NEXT_STATUS[c.status]}"
              </button>
            )}
            {c.status === "Visit Completed" && (
              <button onClick={e => { e.stopPropagation(); updateCustomer(c.id, { status: "Ready for Booking" }); toast.success("Booking initiated! Admin notified."); }}
                className="w-full mt-2 bg-green-50 hover:bg-green-100 text-green-700 text-xs font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1.5">
                <ArrowRight size={14} />Proceed to Booking
              </button>
            )}
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <div className="text-4xl mb-2">👥</div>
            <div className="font-semibold">No customers found</div>
          </div>
        )}
      </div>

      {/* FAB */}
      <button onClick={() => navigate("/customers/register")}
        className="fixed bottom-24 right-4 w-14 h-14 bg-blue-600 rounded-full shadow-xl shadow-blue-300 flex items-center justify-center text-white hover:bg-blue-700 transition-all z-30">
        <Plus size={24} />
      </button>

      {/* Customer Detail Modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title="Customer Details" size="sm">
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-700 text-2xl font-bold">{selected.name.charAt(0)}</div>
              <div>
                <div className="font-bold text-gray-900">{selected.name}</div>
                <div className="text-sm text-gray-400">{selected.mobile}</div>
                <StatusBadge status={selected.status} />
              </div>
            </div>
            <div className="space-y-2">
              {[["Site", selected.siteName], ["Visit Date", selected.visitDate], ["Address", selected.address], ["Registered", selected.registeredDate]].map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm">
                  <span className="text-gray-400">{k}</span>
                  <span className="font-semibold text-gray-800 text-right max-w-[55%]">{v || "—"}</span>
                </div>
              ))}
            </div>
            
            {(selected.driverName || selected.driverMobile || selected.cabNumber) && (
              <div className="bg-blue-50 rounded-xl p-3">
                <div className="text-xs font-semibold text-blue-700 mb-1.5">🚗 Driver Details</div>
                <div className="space-y-1">
                  {selected.driverName && <div className="flex justify-between text-sm"><span className="text-gray-500">Driver:</span><span className="font-semibold text-gray-800">{selected.driverName}</span></div>}
                  {selected.driverMobile && <div className="flex justify-between text-sm"><span className="text-gray-500">Mobile:</span><span className="font-semibold text-gray-800">{selected.driverMobile}</span></div>}
                  {selected.cabNumber && <div className="flex justify-between text-sm"><span className="text-gray-500">Cab No:</span><span className="font-semibold text-gray-800">{selected.cabNumber}</span></div>}
                </div>
              </div>
            )}
            
            {selected.notes && <div className="bg-yellow-50 rounded-xl p-3"><div className="text-xs font-semibold text-yellow-700 mb-1">Notes</div><div className="text-sm text-gray-700">{selected.notes}</div></div>}
            {/* Status flow */}
            <div>
              <div className="text-xs font-semibold text-gray-500 mb-2">Update Status</div>
              <select 
                value={selected.status} 
                onChange={e => { updateCustomer(selected.id, { status: e.target.value }); setSelected(p => ({ ...p, status: e.target.value })); toast.success(`Status: ${e.target.value}`); }}
                className="input-field"
              >
                {["Interested", "Visit Scheduled", "Visit Completed", "Ready for Booking", "Dropped"].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

          </div>
        )}
      </Modal>
    </div>
  );
}
