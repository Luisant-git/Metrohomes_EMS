import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { useData } from "../../context/DataContext.jsx";
import DataTable from "../../components/DataTable.jsx";
import Modal from "../../components/Modal.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import StatCard from "../../components/StatCard.jsx";
import { siteVisit } from "../../api/siteVisit.js";
import {
  Eye,
  SquarePen,
  Trash2,
  UserCheck,
  Phone,
  UserPlus,
  AlertTriangle,
  Search,
  X,
  Calendar,
  Users,
  Sparkles,
  CalendarCheck,
  CheckCircle2,
  BookOpen,
  Wallet,
} from "lucide-react";
import { toast } from "react-toastify";

const STATUSES = [
  "Interested",
  "Visit Scheduled",
  "Visit Completed",
  "Booked",
  "Payment Done",
];
const DIRECTOR_STATUSES = ["Interested", "Visit Scheduled", "Visit Completed"];

const statusConfig = {
  Interested: { icon: Sparkles, color: "purple" },
  "Visit Scheduled": { icon: CalendarCheck, color: "orange" },
  "Visit Completed": { icon: CheckCircle2, color: "teal" },
  Booked: { icon: BookOpen, color: "green" },
  "Payment Done": { icon: Wallet, color: "yellow" },
};

export default function WebCustomers() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { users = [] } = useData();
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [historyCustomer, setHistoryCustomer] = useState(null);
  const [filterStatus, setFilterStatus] = useState("All");
  const [roleFilter, setRoleFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [siteVisits, setSiteVisits] = useState([]);
  const [visitsLoading, setVisitsLoading] = useState(true);
  const [visitSearch, setVisitSearch] = useState("");
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

  const formatVisitDate = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yy = String(d.getFullYear()).slice(-2);
    return `${dd}/${mm}/${yy}`;
  };

  const formatVisitTime = (timeStr) => {
    if (!timeStr) return "—";
    const [h, m] = timeStr.split(":");
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${m} ${ampm}`;
  };

  const filteredVisits = siteVisits.filter((v) => {
    if (filterStatus !== "All" && v.status !== filterStatus) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        v.customer?.name?.toLowerCase().includes(s) ||
        v.customer?.phone?.includes(s) ||
        v.siteNo?.toLowerCase().includes(s) ||
        v.projectName?.toLowerCase().includes(s) ||
        v.assignedToUser?.name?.toLowerCase().includes(s)
      );
    }
    if (dateFrom) {
      const visitDate = v.visitDate
        ? new Date(v.visitDate).toISOString().split("T")[0]
        : "";
      if (visitDate < dateFrom) return false;
    }
    if (dateTo) {
      const visitDate = v.visitDate
        ? new Date(v.visitDate).toISOString().split("T")[0]
        : "";
      if (visitDate > dateTo) return false;
    }
    return true;
  });

  const teamRoles = useMemo(() => {
    const roleSet = new Set();
    users.forEach((u) => {
      if (u?.role) roleSet.add(u.role);
    });
    return ["All", ...Array.from(roleSet)];
  }, [users]);

  const openView = (visit) => {
    setSelected(visit);
    setModal("view");
  };
  const openEdit = (visit) => {
    setSelected(visit);
    setModal("edit");
  };

  const confirmDelete = async () => {
    if (deleteTarget) {
      try {
        await siteVisit.remove(deleteTarget.id);
        toast.success(`Visit deleted successfully`);
        setDeleteTarget(null);
        fetchSiteVisits();
      } catch (err) {
        toast.error(err.message || "Failed to delete visit");
      }
    }
  };

  const availableStatuses =
    user?.role === "Director" ? DIRECTOR_STATUSES : STATUSES;

  const columns = [
    {
      key: "customerName",
      label: "Customer",
      render: (v, row) => (
        <div>
          <div className="font-medium text-gray-800">
            {row.customer?.name || "—"}
          </div>
          <div className="text-xs text-gray-400 flex items-center gap-1">
            <Phone size={10} />
            {row.customer?.phone || ""}
          </div>
        </div>
      ),
    },
    {
      key: "projectName",
      label: "Interested Project",
      render: (v, row) => `Site ${row.siteNo || "—"} - ${v || "—"}`,
    },
    {
      key: "createdByName",
      label: "Created By",
      render: (v, row) => row.assignedToUser?.name || "—",
    },
    {
      key: "visitDateTime",
      label: "Scheduled Visit",
      render: (v, row) =>
        `${formatVisitDate(row.visitDate)} ${formatVisitTime(row.visitTime)}`,
    },
    {
      key: "status",
      label: "Current Status",
      render: (v) => <StatusBadge status={v} />,
    },
    {
      key: "createdAt",
      label: "Registered on",
      render: (v) => formatVisitDate(v),
    },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-normal text-gray-900 flex items-center gap-2">
          <UserCheck size={22} />
          Site Visit
        </h1>
        <p className="text-gray-400 text-sm mt-0.5">
          {siteVisits.length} total visits
        </p>
      </div>

      {/* Status stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 sm:gap-3 lg:gap-4 w-full">
        <button onClick={() => setFilterStatus("All")} className={`text-left rounded-2xl transition-all ${filterStatus === "All" ? "ring-2 ring-blue-500" : "hover:opacity-90"}`}>
          <StatCard icon={Users} label="Total Visits" value={siteVisits.length} color="blue" />
        </button>
        {availableStatuses.map((s) => {
          const config = statusConfig[s] || { icon: Users, color: "blue" };
          return (
            <button key={s} onClick={() => setFilterStatus(s)} className={`text-left rounded-2xl transition-all ${filterStatus === s ? "ring-2 ring-blue-500" : "hover:opacity-90"}`}>
              <StatCard icon={config.icon} label={s} value={siteVisits.filter((v) => v.status === s).length} color={config.color} />
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Name, Mobile, Site, Created By..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="input-field"
              placeholder="From Date"
            />
          </div>
          <div>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="input-field"
              placeholder="To Date"
            />
          </div>

          {(search || dateFrom || dateTo || filterStatus !== "All") && (
            <button
              onClick={() => {
                setSearch("");
                setDateFrom("");
                setDateTo("");
                setFilterStatus("All");
              }}
              className="px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              Clear Filters
            </button>
          )}

          <span className="text-xs text-gray-400 ml-auto">
            {filteredVisits.length} of {siteVisits.length} visits
          </span>
        </div>
      </div>

      <DataTable
        title="Site Visits"
        columns={columns}
        data={filteredVisits}
        searchKey={[]}
        hideSearch={true}
        extraActions={
          <button
            onClick={() => navigate("/customer-registration")}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-blue-200"
          >
            <UserPlus size={16} /> New Registration
          </button>
        }
        actions={(row) => {
          const isDirector = user?.role === "Director";
          const canDelete = !isDirector; // Director can edit but not delete
          return (
            <>
              <button
                onClick={() => openView(row)}
                className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                title="View"
              >
                <Eye size={15} />
              </button>
              <button
                onClick={() => openEdit(row)}
                className="p-1.5 text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
                title="Edit"
              >
                <SquarePen size={15} />
              </button>
              {canDelete && (
                <button
                  onClick={() => setDeleteTarget(row)}
                  className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                  title="Delete"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </>
          );
        }}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Visit"
        size="sm"
      >
        {deleteTarget && (
          <div className="text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <AlertTriangle size={28} className="text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Are you sure?
            </h3>
            <p className="text-sm text-gray-500 mb-1">
              You are about to delete this visit:
            </p>
            <p className="text-sm font-medium text-gray-800 mb-4">
              "{deleteTarget.customer?.name} - Site {deleteTarget.siteNo}"
              <span className="block text-xs font-normal text-gray-400 mt-1">
                {formatVisitDate(deleteTarget.visitDate)} ·{" "}
                {deleteTarget.projectName}
              </span>
            </p>

            <div className="flex gap-3">
              <button
                onClick={confirmDelete}
                className="btn-primary flex-1 justify-center py-2.5 bg-red-600 hover:bg-red-700 border-red-600"
              >
                Yes, Delete
              </button>
              <button
                onClick={() => setDeleteTarget(null)}
                className="btn-secondary flex-1 justify-center py-2.5"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* View Modal */}
      <Modal
        open={modal === "view"}
        onClose={() => setModal(null)}
        title="Visit Details"
      >
        {selected && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                {selected.customer?.name?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-extrabold text-gray-900 truncate">
                  {selected.customer?.name}
                </h3>
                <p className="text-sm text-gray-500">
                  {selected.customer?.phone}
                </p>
              </div>
              <StatusBadge status={selected.status} />
            </div>

            <div className="space-y-2.5">
              {[
                ["Project", selected.projectName],
                ["Site", `Site ${selected.siteNo}`],
                ["Visit Date", formatVisitDate(selected.visitDate)],
                ["Visit Time", formatVisitTime(selected.visitTime)],
                ["Persons", selected.persons],
                ["Purchase Mode", selected.purchaseMode],
                ["Pickup Location", selected.pickupLocation],
                ["Assigned To", selected.assignedToUser?.name || "—"],
                ["Notes", selected.notes],
              ].map(([k, v]) => (
                <div key={k} className="flex flex-col gap-0.5">
                  <span className="text-[11px] text-gray-400 font-medium tracking-wide">
                    {k}
                  </span>
                  <span className="text-sm text-gray-800 break-words">
                    {(k === "Location" || k === "Pickup Location") && v ? (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(v)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1 cursor-pointer"
                      >
                        {v} ↗
                      </a>
                    ) : (
                      v || "—"
                    )}
                  </span>
                </div>
              ))}
            </div>

            {(selected.driverName ||
              selected.driverMobile ||
              selected.cabNumber) && (
              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs font-semibold text-blue-600 tracking-wide mb-1">
                  🚗 Driver Details
                </p>
                <div className="space-y-1">
                  {selected.driverName && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Name</span>
                      <span className="text-sm text-gray-800">
                        {selected.driverName}
                      </span>
                    </div>
                  )}
                  {selected.driverMobile && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Mobile</span>
                      <span className="text-sm text-gray-800">
                        {selected.driverMobile}
                      </span>
                    </div>
                  )}
                  {selected.cabNumber && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Cab</span>
                      <span className="text-sm text-gray-800">
                        {selected.cabNumber}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Edit Status Modal */}
      <Modal
        open={modal === "edit"}
        onClose={() => setModal(null)}
        title="Update Visit"
      >
        {selected && (
          <div className="space-y-4">
            <div className="font-medium text-gray-800 mb-4">
              {selected.customer?.name} - Site {selected.siteNo}
            </div>

            <div>
              <label className="label">Current Status</label>
              <StatusBadge status={selected.status} />
            </div>
            <div>
              <label className="label">Update Status</label>
              <select
                value={selected.status}
                onChange={(e) =>
                  setSelected((p) => ({ ...p, status: e.target.value }))
                }
                className="input-field mt-2"
              >
                {availableStatuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="border-t border-gray-200 pt-4 mt-4">
              <div className="text-sm font-bold text-gray-700 mb-3">
                🚗 Driver Details (Optional)
              </div>
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="label">Driver Name</label>
                  <input
                    value={selected.driverName || ""}
                    onChange={(e) => {
                      setSelected((p) => ({
                        ...p,
                        driverName: e.target.value,
                      }));
                    }}
                    className="input-field"
                    placeholder="Enter driver name"
                  />
                </div>
                <div>
                  <label className="label">Driver Mobile</label>
                  <input
                    type="tel"
                    value={selected.driverMobile || ""}
                    onChange={(e) => {
                      setSelected((p) => ({
                        ...p,
                        driverMobile: e.target.value,
                      }));
                    }}
                    className="input-field"
                    placeholder="Driver mobile number"
                    maxLength={10}
                  />
                </div>
                <div>
                  <label className="label">Cab Number</label>
                  <input
                    value={selected.cabNumber || ""}
                    onChange={(e) => {
                      setSelected((p) => ({ ...p, cabNumber: e.target.value }));
                    }}
                    className="input-field"
                    placeholder="Cab/Vehicle number"
                  />
                </div>
                <button
                  disabled={saving}
                  onClick={async () => {
                    try {
                      setSaving(true);
                      const hasDriver =
                        selected.driverName ||
                        selected.driverMobile ||
                        selected.cabNumber;
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
                  className="btn-primary w-full justify-center py-2.5 disabled:opacity-50"
                >
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
