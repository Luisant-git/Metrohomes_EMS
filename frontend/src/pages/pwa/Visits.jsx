import { useState } from "react";
import { useData } from "../../context/DataContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { MapPin, Calendar, CheckCircle, Clock, XCircle } from "lucide-react";
import StatusBadge from "../../components/StatusBadge.jsx";
import toast from "react-hot-toast";

export default function PWAVisits() {
  const { visits, updateVisit, updateCustomer, customers } = useData();
  const { user } = useAuth();
  const [filter, setFilter] = useState("All");

  const myVisits = visits.filter(v => v.salesManagerId === user?.id || user?.id === 6);
  const filtered = filter === "All" ? myVisits : myVisits.filter(v => v.status === filter);

  const completeVisit = (v) => {
    updateVisit(v.id, { status: "Visit Completed" });
    updateCustomer(v.customerId, { status: "Visit Completed" });
    toast.success("Visit marked as completed!");
  };

  const statusIcon = { "Visit Scheduled": Clock, "Visit Completed": CheckCircle, "Cancelled": XCircle };
  const statusColor = { "Visit Scheduled": "text-blue-500", "Visit Completed": "text-green-500", "Cancelled": "text-red-400" };

  const todayStr = new Date().toISOString().split("T")[0];
  const upcoming = myVisits.filter(v => v.visitDate >= todayStr && v.status === "Visit Scheduled");
  const past = myVisits.filter(v => v.visitDate < todayStr || v.status === "Visit Completed");

  return (
    <div className="pb-4">
      <div className="px-4 pt-4 space-y-3">
        {/* Filter chips */}
        <div className="flex gap-2">
          {["All", "Visit Scheduled", "Visit Completed"].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${filter === s ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-600"}`}>
              {s === "All" ? `All (${myVisits.length})` : s.replace("Visit ", "")}
            </button>
          ))}
        </div>

        {/* Upcoming */}
        {upcoming.length > 0 && filter === "All" && (
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
            <div className="font-bold text-blue-700 text-sm mb-3 flex items-center gap-1.5"><Clock size={14} />Upcoming Visits ({upcoming.length})</div>
            <div className="space-y-2">
              {upcoming.map(v => (
                <div key={v.id} className="bg-white rounded-xl p-3 flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold">{v.customerName?.charAt(0)}</div>
                  <div className="flex-1">
                    <div className="font-semibold text-sm text-gray-800">{v.customerName}</div>
                    <div className="text-xs text-gray-400 flex items-center gap-1"><MapPin size={10} />{v.siteName}</div>
                    <div className="text-xs text-blue-600 font-semibold flex items-center gap-1 mt-0.5"><Calendar size={10} />{v.visitDate}</div>
                  </div>
                  <button onClick={() => completeVisit(v)} className="bg-green-100 hover:bg-green-200 text-green-700 text-xs font-bold px-2.5 py-1.5 rounded-xl transition-colors flex items-center gap-1">
                    <CheckCircle size={12} />Done
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* All visits */}
      <div className="px-4 mt-3 space-y-3">
        <div className="text-xs font-bold text-gray-400 uppercase tracking-wide">
          {filter === "All" ? "All Visits" : filter}
        </div>
        {filtered.map(v => {
          const Icon = statusIcon[v.status] || Clock;
          const col = statusColor[v.status] || "text-gray-400";
          return (
            <div key={v.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0`}>
                  <Icon size={20} className={col} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-gray-800 truncate">{v.customerName}</div>
                    <StatusBadge status={v.status} />
                  </div>
                  <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><MapPin size={10} />{v.siteName}</div>
                  <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><Calendar size={10} />{v.visitDate}</div>
                  {v.notes && <div className="text-xs text-gray-500 mt-1.5 bg-gray-50 rounded-lg px-2 py-1.5">📝 {v.notes}</div>}
                </div>
              </div>
              {v.status === "Visit Scheduled" && (
                <button onClick={() => completeVisit(v)}
                  className="w-full mt-3 bg-green-50 hover:bg-green-100 text-green-700 text-xs font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1.5">
                  <CheckCircle size={14} />Mark Visit as Completed
                </button>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-10 text-gray-400">
            <MapPin size={36} className="mx-auto mb-2 opacity-30" />
            <div className="font-semibold text-sm">No visits found</div>
          </div>
        )}
      </div>
    </div>
  );
}
