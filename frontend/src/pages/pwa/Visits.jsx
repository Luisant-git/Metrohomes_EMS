import { useState, useMemo } from "react";
import { useData } from "../../context/DataContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { MapPin, Calendar, CheckCircle, Clock, XCircle, ChevronLeft, ChevronRight } from "lucide-react";
import StatusBadge from "../../components/StatusBadge.jsx";
import { toast } from "react-toastify";

const ITEMS_PER_PAGE = 5;

export default function PWAVisits() {
  const { customers, updateCustomer, users } = useData();
  const { user, hierarchy } = useAuth();
  const [filter, setFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);

  const teamUserIds = useMemo(() => {
    if (!users.length || !user?.id) return [];
    const downline = hierarchy.getDownline(users);
    const allTeam = [user, ...downline].filter(Boolean);
    return allTeam.map(u => u.id);
  }, [users, user, hierarchy]);

  const myVisits = useMemo(() => {
    return customers
      .filter(c => teamUserIds.includes(c.createdById))
      .filter(c => ["Visit Scheduled", "Visit Completed", "Booked", "Payment Done"].includes(c.status))
      .map(c => ({
        ...c,
        customerName: c.name,
      }));
  }, [customers, teamUserIds]);

  const filtered = filter === "All" ? myVisits : myVisits.filter(v => v.status === filter);
  
  // Pagination calculation
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedVisits = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setCurrentPage(1);
  };

  const completeVisit = (v) => {
    updateCustomer(v.id, { status: "Visit Completed" });
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
            <button key={s} onClick={() => handleFilterChange(s)}
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
        {paginatedVisits.map(v => {
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-2 py-3">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={14} /> Prev
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-7 h-7 rounded-lg text-xs font-medium transition-all ${
                      currentPage === pageNum
                        ? "bg-blue-600 text-white"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
