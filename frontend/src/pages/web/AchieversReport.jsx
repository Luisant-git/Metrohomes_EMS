import { useState, useMemo, useRef, useEffect } from "react";
import { Trophy, Download, Medal, Star, Crown, Calendar, CheckCircle, FileSpreadsheet, Search, X, ChevronDown, Building2, UserRound, Eye, User, MapPin, Phone, Ruler, BarChart2 } from "lucide-react";
import { toast } from "react-toastify";
import jsPDF from "jspdf";
import { toCanvas } from "html-to-image";
import { useData } from "../../context/DataContext.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import logoUrl from "../../assests/logo 1.png";
import userProfUrl from "../../assests/userprof.png";

const today = new Date();

function AvatarCircle({ person, className = "" }) {
  const { avatarUrl, name } = person;
  const isImg =
    avatarUrl &&
    (avatarUrl.startsWith("http") ||
      avatarUrl.startsWith("data:") ||
      avatarUrl.includes("/"));

  return (
    <div className={`rounded-full overflow-hidden flex items-center justify-center ${className}`}>
      <img
        src={isImg ? avatarUrl : userProfUrl}
        alt={name}
        className="w-full h-full object-cover"
      />
    </div>
  );
}

function SearchableSelect({ value, onChange, options, placeholder = "Select...", className = "" }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = options.find((o) => String(o.value) === String(value));
  const filtered = options.filter((o) => o.label.toLowerCase().includes(q.toLowerCase()));

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-between gap-2"
      >
        <span className="truncate">{selected ? selected.label : placeholder}</span>
        <ChevronDown size={14} className={`text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden flex flex-col">
          <div className="p-1 border-b border-slate-100 flex items-center gap-1">
            <Search size={14} className="text-slate-400 ml-1 flex-shrink-0" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search..."
              className="w-full py-1 px-1 text-sm text-slate-700 outline-none bg-transparent"
            />
          </div>
          <div className="overflow-y-auto max-h-48">
            {filtered.length > 0 ? (
              filtered.map((o) => (
                <button
                  key={String(o.value)}
                  type="button"
                  onClick={() => { onChange(o.value); setOpen(false); setQ(""); }}
                  className={`w-full px-3 py-2 text-sm text-left hover:bg-slate-50 ${String(o.value) === String(value) ? "bg-blue-50 text-blue-700 font-medium" : "text-slate-700"}`}
                >
                  {o.label}
                </button>
              ))
            ) : (
              <div className="px-3 py-4 text-center text-sm text-slate-400">No options found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function RoleBadge({ role }) {
  const styles = {
    Admin: "bg-purple-100 text-purple-700 border-purple-200",
    Director: "bg-indigo-100 text-indigo-700 border-indigo-200",
    "Regional Manager": "bg-blue-100 text-blue-700 border-blue-200",
    "Branch Manager": "bg-teal-100 text-teal-700 border-teal-200",
    BDM: "bg-emerald-100 text-emerald-700 border-emerald-200",
    "Sales Manager": "bg-amber-100 text-amber-700 border-amber-200",
    "Sales Executive": "bg-cyan-100 text-cyan-700 border-cyan-200",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border whitespace-nowrap ${styles[role] || "bg-gray-100 text-gray-700 border-gray-200"}`}>
      {role || "—"}
    </span>
  );
}

function getPodiumCols(n) {
  if (n <= 1) return 1;
  if (n === 2) return 2;
  if (n === 3) return 3;
  if (n === 4) return 2;
  if (n <= 6) return 3;
  if (n <= 8) return 4;
  return 5;
}

export default function AchieversReport() {
  const { users = [], bookings = [], customers = [], sites = [] } = useData();

  // ── Filter States ──
  const [searchQuery, setSearchQuery] = useState("");
  const defaultMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
  const [projectFilter, setProjectFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [viewAchiever, setViewAchiever] = useState(null);
  const pdfExportContainerRef = useRef(null);

  // ── Filter Options ──
  const projectOptions = useMemo(() => {
    const seen = new Map();
    sites.forEach((s) => {
      if (s.id != null && !seen.has(String(s.id))) {
        seen.set(String(s.id), { value: s.id, label: s.name || `Project #${s.id}` });
      }
    });
    bookings.forEach((b) => {
      const pId = b.projectId ?? b.project?.id;
      if (pId != null && !seen.has(String(pId))) {
        seen.set(String(pId), { value: pId, label: b.projectName || b.project?.name || `Project #${pId}` });
      }
    });
    return Array.from(seen.values());
  }, [sites, bookings]);

  const roleOptions = useMemo(() => {
    const set = new Set(users.map((u) => u.role).filter(Boolean));
    return Array.from(set).map((r) => ({ value: r, label: r }));
  }, [users]);

  const monthRange = useMemo(() => {
    const [y, m] = selectedMonth.split("-").map(Number);
    const from = new Date(y, m - 1, 1);
    const to = new Date(y, m, 0);
    return {
      year: y,
      month: m,
      monthName: from.toLocaleDateString("en-IN", { month: "long" }),
      fromDate: `${y}-${String(m).padStart(2, "0")}-01`,
      toDate: `${y}-${String(m).padStart(2, "0")}-${String(to.getDate()).padStart(2, "0")}`,
    };
  }, [selectedMonth]);

  const hasFilters =
    searchQuery || selectedMonth !== defaultMonth || projectFilter || roleFilter;

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedMonth(defaultMonth);
    setProjectFilter("");
    setRoleFilter("");
  };

  // ── Dynamic Filter & Aggregate Logic ──
  // The achiever of a booking = the user who actually booked it (assignedTo), falling back
  // to the customer's site-visit assigned user, then the customer creator (stale data).
  const getBookingAchieverId = (b, map) => {
    const cust = customers.find((c) => String(c.id) === String(b.customerId));
    const visit = cust?.visits?.[0];
    const visitorId = visit?.registeredById;
    const custCreatorId = cust?.createdById || cust?.createdBy;
    const stale =
      b.assignedTo &&
      custCreatorId &&
      String(b.assignedTo) === String(custCreatorId) &&
      visitorId &&
      String(visitorId) !== String(custCreatorId);
    const assignedId = stale ? null : b.assignedTo;
    return String(
      assignedId ||
        visitorId ||
        (map && map.get(String(b.customerId))) ||
        b.createdById ||
        b.createdBy ||
        ""
    );
  };

  const calculatedAchievers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    // 1. Restrict achievers pool by search + role
    const eligibleUsers = users.filter((u) => {
      if (roleFilter && u.role !== roleFilter) return false;
      if (q) {
        const name = (u.name || "").toLowerCase();
        const role = (u.role || "").toLowerCase();
        if (!name.includes(q) && !role.includes(q)) return false;
      }
      return true;
    });

    // 2. Filter bookings in selected range (exclude cancelled)
    const recordsInRange = bookings.filter((b) => {
      if (b.status === "Cancelled") return false;
      const dateStr = (b.bookingDate || b.createdAt || "").toString().split("T")[0];
      if (!dateStr) return false;
      if (dateStr < monthRange.fromDate || dateStr > monthRange.toDate) return false;
      if (projectFilter && String(b.projectId ?? b.project?.id) !== String(projectFilter)) return false;
      return true;
    });

    // 3. Aggregate booking count by the user who created/completed them
    const agentMap = new Map();
    eligibleUsers.forEach((u) => {
      const name = u.name || "Unknown";
      const avatar = name
        .split(" ")
        .map((w) => w.charAt(0))
        .join("")
        .slice(0, 2)
        .toUpperCase();
      agentMap.set(String(u.id), {
        id: u.id,
        name,
        role: u.role || "Sales Executive",
        avatarUrl: u.avatar || null,
        avatar: avatar || "U",
        mobile: u.mobile || "",
        employeeCode: u.employeeCode || "",
        parentUserId: u.parentUserId ?? u.parent?.id ?? "",
        parentName: u.parent?.name || "",
        parentCode: (u.parentUserId ?? u.parent?.id ?? "")
          ? users.find((p) => String(p.id) === String(u.parentUserId ?? u.parent?.id))?.employeeCode || ""
          : "",
        parentAvatar: (() => {
          const p = users.find((x) => String(x.id) === String(u.parentUserId ?? u.parent?.id));
          if (!p) return "";
          const pn = p.name || "?";
          return pn
            .split(" ")
            .map((w) => w.charAt(0))
            .join("")
            .slice(0, 2)
            .toUpperCase();
        })(),
        parentAvatarUrl: (() => {
          const p = users.find((x) => String(x.id) === String(u.parentUserId ?? u.parent?.id));
          return p?.avatar || null;
        })(),
        sales: 0,
      });
    });

    const customerCreatorMap = new Map(
      customers.map((c) => [String(c.id), String(c.createdById || c.createdBy || "")])
    );

    recordsInRange.forEach((b) => {
      // Achiever = the user who actually booked the plot
      const creatorId = getBookingAchieverId(b, customerCreatorMap);
      const entry = agentMap.get(String(creatorId));
      if (entry) entry.sales += 1;
    });

    // 4. Convert to array and assign ranks
    const rawList = Array.from(agentMap.values());

    // Sort by sales descending
    rawList.sort((a, b) => b.sales - a.sales);

    // Assign rank and list only achievers with completed bookings
    return rawList
      .map((item, idx) => ({
        ...item,
        rank: idx + 1,
      }))
      .filter((a) => a.sales > 0);
  }, [bookings, users, customers, sites, searchQuery, monthRange.fromDate, monthRange.toDate, projectFilter, roleFilter]);

  // ── Bookings for the selected achiever (view modal) ──
  const getProject = (b) => sites.find((s) => String(s.id) === String(b.projectId ?? b.project?.id));

  const achieverBookings = useMemo(() => {
    if (!viewAchiever) return [];
    const id = String(viewAchiever.id);
    const customerCreatorMap = new Map(
      customers.map((c) => [String(c.id), String(c.createdById || c.createdBy || "")])
    );
    return bookings
      .filter((b) => {
        if (b.status === "Cancelled") return false;
        const dateStr = (b.bookingDate || b.createdAt || "").toString().split("T")[0];
        if (!dateStr) return false;
        if (dateStr < monthRange.fromDate || dateStr > monthRange.toDate) return false;
        if (projectFilter && String(b.projectId ?? b.project?.id) !== String(projectFilter)) return false;
        const creatorId = getBookingAchieverId(b, customerCreatorMap);
        return String(creatorId) === id;
      })
      .sort((a, b) => (b.bookingDate || "").localeCompare(a.bookingDate || ""));
  }, [viewAchiever, bookings, customers, monthRange.fromDate, monthRange.toDate, projectFilter]);

  const modalStats = useMemo(() => {
    const siteNos = new Set();
    let totalSqft = 0;
    achieverBookings.forEach((b) => {
      const sn = b.siteNo || b.site?.siteNo;
      if (sn) siteNos.add(String(sn));
      totalSqft += Number(b.plotArea || 0);
    });
    return { siteCount: siteNos.size, totalSqft };
  }, [achieverBookings]);

  // ── Summary Metrics ──
  const summaryMetrics = useMemo(() => {
    let totalSales = 0;
    calculatedAchievers.forEach((a) => {
      totalSales += a.sales;
    });

    const gold = calculatedAchievers.find((a) => a.rank === 1) || null;
    const silver = calculatedAchievers.find((a) => a.rank === 2) || null;
    const bronze = calculatedAchievers.find((a) => a.rank === 3) || null;

    return {
      totalSales,
      activeAgents: calculatedAchievers.length,
      gold,
      silver,
      bronze,
    };
  }, [calculatedAchievers]);

  // ── PDF Export Routine ──
  const loadImageAsDataUrl = (url) =>
    new Promise((resolve) => {
      if (!url) return resolve(null);
      fetch(url)
        .then((res) => res.blob())
        .then(
          (blob) =>
            new Promise((res2) => {
              const reader = new FileReader();
              reader.onloadend = () => res2(reader.result);
              reader.onerror = () => res2(null);
              reader.readAsDataURL(blob);
            })
        )
        .then((dataUrl) => resolve(dataUrl))
        .catch(() => resolve(null));
    });

  const handleDownloadPDF = async () => {
    if (calculatedAchievers.length === 0) {
      toast.error("No achievers to export for the selected month");
      return;
    }
    setIsExporting(true);
    const toastId = toast.loading("Generating High-Quality PDF...");

    try {
      const container = pdfExportContainerRef.current;
      if (!container) throw new Error("PDF container missing");
      const pages = container.querySelectorAll(".pdf-page");
      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a5" });
      
      for (let i = 0; i < pages.length; i++) {
        if (i > 0) pdf.addPage("a5", "landscape");
        const canvas = await toCanvas(pages[i], { 
          pixelRatio: 3, 
          cacheBust: false,
          backgroundColor: "#F8FAFC"
        });
        const imgData = canvas.toDataURL("image/jpeg", 0.98);
        pdf.addImage(imgData, "JPEG", 0, 0, 210, 148);
      }

      const formattedMonth = `${monthRange.year}${String(monthRange.month).padStart(2, "0")}`;
      pdf.save(`Achievers_Report_${formattedMonth}.pdf`);
      toast.update(toastId, { render: "PDF report downloaded successfully!", type: "success", isLoading: false, autoClose: 3000 });
    } catch (err) {
      console.error(err);
      toast.update(toastId, { render: "Failed to download PDF report", type: "error", isLoading: false, autoClose: 3000 });
    } finally {
      setIsExporting(false);
    }
  };

  // ── CSV Export Routine ──
  const handleDownloadCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Name,Role,ID,Sales,Mobile\n";
    calculatedAchievers.forEach((a) => {
      csvContent += `"${a.name}","${a.role}","${a.employeeCode || a.id}",${a.sales},"${a.mobile || ""}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Achievers_Report_${monthRange.year}_${String(monthRange.month).padStart(2, "0")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV spreadsheet exported successfully!");
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* ── Header Area ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Trophy size={24} className="text-amber-500 flex-shrink-0" />
            Achievers Report
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Realestate ERP Performance Dashboard • {monthRange.monthName} {monthRange.year}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleDownloadCSV}
            className="btn-secondary py-2 px-3 text-xs inline-flex items-center gap-1.5"
            title="Export spreadsheet rows"
          >
            <FileSpreadsheet size={14} className="text-emerald-600" />
            Export CSV
          </button>
          <button
            onClick={handleDownloadPDF}
            disabled={isExporting}
            className="btn-primary py-2 px-3 text-xs inline-flex items-center gap-1.5 shadow-md shadow-blue-500/10"
            title="Download printable PDF Report"
          >
            <Download size={14} />
            {isExporting ? "Generating..." : "Download PDF"}
          </button>
        </div>
      </div>

      {/* ── Neat Filter Toolbar ── */}
      <div className="card bg-white border border-gray-100 shadow-sm rounded-2xl p-4">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
          <div className="flex flex-wrap items-end gap-3">
            {/* Search bar */}
            <div className="w-full sm:w-52">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5 mb-1.5">
                <Search size={13} className="text-blue-500" /> Search
              </label>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search achiever..."
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
            </div>

            {/* Month */}
            <div className="w-full sm:w-44">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5 mb-1.5">
                <Calendar size={12} className="text-blue-500" /> Month
              </label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
            </div>

            {/* Project dropdown */}
            <div className="w-full sm:w-44">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5 mb-1.5">
                <Building2 size={12} className="text-blue-500" /> Project
              </label>
              <select
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              >
                <option value="">All Projects</option>
                {projectOptions.map((p) => (
                  <option key={String(p.value)} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>

            {/* User Role searchable dropdown */}
            <div className="w-full sm:w-44">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5 mb-1.5">
                <UserRound size={12} className="text-blue-500" /> User Role
              </label>
              <SearchableSelect
                value={roleFilter}
                onChange={setRoleFilter}
                options={roleOptions}
                placeholder="All Roles"
              />
            </div>
          </div>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-red-600 bg-gray-50 hover:bg-red-50 border border-gray-200 px-3 py-2 rounded-lg transition-colors self-start lg:self-end"
            >
              <X size={13} /> Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* ── Print/Capture Container ── */}
      <div id="achievers-report-print-area" className="space-y-6 p-1">
        {/* Date Range Subheader Banner */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
          <div className="absolute right-0 bottom-0 w-32 h-32 bg-white/5 rounded-full blur-xl translate-x-12 translate-y-12" />
          <div className="absolute left-1/3 top-0 w-24 h-24 bg-white/5 rounded-full blur-lg -translate-y-12" />

          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <span className="bg-white/20 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                Active Period Recognition
              </span>
              <h2 className="text-xl font-bold">
                Performance Leaderboard
              </h2>
              <p className="text-blue-100 text-xs font-medium">
                Showing results for {monthRange.monthName} {monthRange.year}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="px-4 py-2 bg-white/10 rounded-xl backdrop-blur-sm border border-white/10 text-right">
                <div className="text-[10px] text-blue-200 font-semibold uppercase tracking-wider">Total Sales</div>
                <div className="text-lg font-bold">{summaryMetrics.totalSales}</div>
              </div>
              <div className="px-4 py-2 bg-white/10 rounded-xl backdrop-blur-sm border border-white/10 text-right">
                <div className="text-[10px] text-blue-200 font-semibold uppercase tracking-wider">Active Team</div>
                <div className="text-lg font-bold">{summaryMetrics.activeAgents}</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Dynamic KPI Metrics row ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card bg-white p-4 border border-gray-100 shadow-sm flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
              <Trophy size={18} className="text-blue-600" />
            </div>
            <div>
              <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Total Sales</div>
              <div className="text-lg font-bold text-gray-800 mt-0.5">{summaryMetrics.totalSales} sales</div>
              <div className="text-xs text-gray-400 font-medium mt-0.5">Closed deals count</div>
            </div>
          </div>

          <div className="card bg-white p-4 border border-gray-100 shadow-sm flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0">
              <CheckCircle size={18} className="text-emerald-600" />
            </div>
            <div>
              <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Active Team</div>
              <div className="text-lg font-bold text-gray-800 mt-0.5">{summaryMetrics.activeAgents} agents</div>
              <div className="text-xs text-gray-400 font-medium mt-0.5">Contributing members</div>
            </div>
          </div>

          <div className="card bg-white p-4 border border-gray-100 shadow-sm flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center flex-shrink-0">
              <Crown size={18} className="text-purple-600" />
            </div>
            <div>
              <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Lead Performer</div>
              <div className="text-lg font-bold text-gray-800 mt-0.5 truncate max-w-[150px]">
                {summaryMetrics.gold ? summaryMetrics.gold.name : "N/A"}
              </div>
              <div className="text-xs text-purple-600 font-semibold mt-0.5">Top rank champion</div>
            </div>
          </div>

          <div className="card bg-white p-4 border border-gray-100 shadow-sm flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center flex-shrink-0">
              <Star size={18} className="text-amber-500" />
            </div>
            <div>
              <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Champion Quota</div>
              <div className="text-lg font-bold text-gray-800 mt-0.5">
                {summaryMetrics.gold ? `${summaryMetrics.gold.sales} sales` : "0 sales"}
              </div>
              <div className="text-xs text-amber-600 font-semibold mt-0.5">Highest individual volume</div>
            </div>
          </div>
        </div>

        {/* ── Visual Podium Section (Award Honor Roll - Redesigned to be Premium, Modern, and Realistic) ── */}
        <div className="card bg-white p-6 border border-gray-100 shadow-sm rounded-2xl">
          <div className="flex items-center justify-between border-b border-gray-50 pb-4 mb-8">
            <div>
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-2.5 py-1 rounded-lg">
                Award Honor Roll
              </span>
              <h3 className="text-base font-bold text-gray-900 mt-1.5">Top Performer Standings</h3>
            </div>
            <Trophy size={18} className="text-amber-500 animate-pulse" />
          </div>

          <div className="flex flex-col md:flex-row items-center md:items-end justify-center gap-6 max-w-2xl mx-auto pt-16 pb-4">
            
            {/* 2ND PLACE (Left) */}
            {summaryMetrics.silver ? (
              <div className="w-44 flex flex-col items-center order-2 md:order-1">
                {/* Floating Avatar */}
                <div className="relative mb-3 group">
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-slate-400 animate-bounce">
                    <Crown size={20} className="fill-slate-400 text-slate-500" />
                  </div>
                  <AvatarCircle
                    person={summaryMetrics.silver}
                    className="w-16 h-16 border-2 border-white bg-gradient-to-br from-slate-200 to-slate-100 shadow-md transition-transform duration-300 group-hover:scale-105"
                    textClassName="font-bold text-lg text-slate-700"
                  />
                </div>
                
                {/* Pedestal */}
                <div className="w-full h-24 bg-gradient-to-b from-slate-100 to-slate-50 border border-slate-200 border-b-0 rounded-t-2xl flex flex-col items-center justify-center p-3 shadow-[0_-4px_12px_rgba(148,163,184,0.04)]">
                  <div className="text-2xl font-black text-slate-400">2</div>
                  <div className="text-xs font-bold text-slate-700 mt-0.5">{summaryMetrics.silver.sales} sales</div>
                </div>
                
                {/* Identity */}
                <div className="text-center mt-2.5">
                  <h4 className="font-bold text-gray-800 text-xs truncate max-w-[150px]">{summaryMetrics.silver.name}</h4>
                  <p className="text-[9px] text-gray-400 font-medium truncate max-w-[150px] mt-0.5">{summaryMetrics.silver.role}</p>
                </div>
              </div>
            ) : (
              <div className="w-44 h-40 hidden md:block order-2 md:order-1" />
            )}

            {/* 1ST PLACE (Center - Champion) */}
            {summaryMetrics.gold ? (
              <div className="w-48 flex flex-col items-center order-1 md:order-2">
                {/* Floating Avatar with Crown */}
                <div className="relative mb-3.5 group">
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-yellow-500 animate-bounce">
                    <Crown size={20} className="fill-amber-400 text-amber-500" />
                  </div>
                  <AvatarCircle
                    person={summaryMetrics.gold}
                    className="w-20 h-20 border-4 border-amber-300 bg-gradient-to-br from-amber-200 to-yellow-100 shadow-lg transition-transform duration-300 group-hover:scale-105"
                    textClassName="font-black text-2xl text-amber-800"
                  />
                </div>

                {/* Pedestal */}
                <div className="w-full h-32 bg-gradient-to-b from-amber-100 to-amber-50/50 border-2 border-amber-300 border-b-0 rounded-t-2xl flex flex-col items-center justify-center p-3 shadow-[0_-6px_20px_rgba(245,158,11,0.08)] relative">
                  <div className="text-3xl font-black text-amber-500">1</div>
                  <div className="text-sm font-bold text-amber-700 mt-0.5">{summaryMetrics.gold.sales} sales</div>
                </div>

                {/* Identity */}
                <div className="text-center mt-2.5">
                  <h4 className="font-bold text-gray-900 text-sm truncate max-w-[160px]">{summaryMetrics.gold.name}</h4>
                  <p className="text-[9px] text-amber-600 font-bold truncate max-w-[160px] mt-0.5 uppercase tracking-wider">{summaryMetrics.gold.role}</p>
                </div>
              </div>
            ) : (
              <div className="w-48 h-52 order-1 md:order-2" />
            )}

            {/* 3RD PLACE (Right) */}
            {summaryMetrics.bronze ? (
              <div className="w-44 flex flex-col items-center order-3">
                {/* Floating Avatar */}
                <div className="relative mb-3 group">
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-orange-400 animate-bounce">
                    <Crown size={20} className="fill-orange-400 text-orange-500" />
                  </div>
                  <AvatarCircle
                    person={summaryMetrics.bronze}
                    className="w-16 h-16 border-2 border-white bg-gradient-to-br from-orange-100 to-amber-50 shadow-md transition-transform duration-300 group-hover:scale-105"
                    textClassName="font-bold text-lg text-orange-950/80"
                  />
                </div>

                {/* Pedestal */}
                <div className="w-full h-18 bg-gradient-to-b from-orange-100/50 to-orange-50/20 border border-orange-200/60 border-b-0 rounded-t-2xl flex flex-col items-center justify-center p-3 shadow-[0_-4px_12px_rgba(234,88,12,0.02)]">
                  <div className="text-xl font-black text-orange-400/80">3</div>
                  <div className="text-xs font-bold text-orange-850/80 mt-0.5">{summaryMetrics.bronze.sales} sales</div>
                </div>

                {/* Identity */}
                <div className="text-center mt-2.5">
                  <h4 className="font-bold text-gray-800 text-xs truncate max-w-[150px]">{summaryMetrics.bronze.name}</h4>
                  <p className="text-[9px] text-gray-400 font-medium truncate max-w-[150px] mt-0.5">{summaryMetrics.bronze.role}</p>
                </div>
              </div>
            ) : (
              <div className="w-44 h-32 hidden md:block order-3" />
            )}

          </div>
        </div>

        {/* ── Complete Rankings Table ── */}
        <div className="card overflow-hidden bg-white border border-gray-100 shadow-sm rounded-2xl">
          <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-2.5 py-1 rounded-lg">
                Full Leaderboard
              </span>
              <h3 className="font-bold text-gray-900 text-sm mt-1.5">Rankings Breakdown</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Sorted by sales count performance
              </p>
            </div>
            <span className="text-[10px] font-bold text-gray-500 bg-gray-50 px-2.5 py-1.5 rounded-lg">
              {calculatedAchievers.length} Active Agents
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-3.5 text-left text-[11px] font-medium text-slate-600 uppercase tracking-widest w-20">
                    Rank
                  </th>
                  <th className="px-6 py-3.5 text-left text-[11px] font-medium text-slate-600 uppercase tracking-widest">
                    Achiever
                  </th>
                  <th className="px-6 py-3.5 text-left text-[11px] font-medium text-slate-600 uppercase tracking-widest">
                    Role
                  </th>
                  <th className="px-6 py-3.5 text-left text-[11px] font-medium text-slate-600 uppercase tracking-widest">
                    ID
                  </th>
                  <th className="px-6 py-3.5 text-center text-[11px] font-medium text-slate-600 uppercase tracking-widest w-52">
                    Sales Closed
                  </th>
                  <th className="px-6 py-3.5 text-center text-[11px] font-medium text-slate-600 uppercase tracking-widest w-20">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {calculatedAchievers.length > 0 ? (
                  calculatedAchievers.map((a) => {
                    const leader = calculatedAchievers[0]?.sales || 1;
                    const progressWidth = Math.max(Math.round((a.sales / leader) * 100), a.sales > 0 ? 8 : 0);
                    const rankChip =
                      a.rank === 1
                        ? "bg-amber-100 text-amber-800"
                        : a.rank === 2
                        ? "bg-slate-100 text-slate-800"
                        : a.rank === 3
                        ? "bg-orange-50 text-orange-800"
                        : "bg-gray-50 text-gray-400";

                    return (
                      <tr key={a.id} className="hover:bg-slate-50/60 transition-colors">
                        {/* Rank */}
                        <td className="px-6 py-4">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${rankChip}`}>
                            {a.rank}
                          </div>
                        </td>

                        {/* Name & Avatar */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <AvatarCircle
                              person={a}
                              className="w-9 h-9 bg-blue-50 border border-blue-100"
                              textClassName="text-blue-700 text-xs font-bold"
                            />
                            <div className="font-semibold text-sm text-gray-800">
                              {a.name}
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="px-6 py-4">
                          <RoleBadge role={a.role} />
                        </td>

                        {/* ID */}
                        <td className="px-6 py-4">
                          <span className="font-mono text-sm font-semibold text-slate-700">
                            {a.employeeCode || a.id}
                          </span>
                        </td>

                        {/* Sales count + progress */}
                        <td className="px-6 py-4">
                          <div className="flex flex-col items-center gap-1.5">
                            <span className="inline-flex items-center justify-center px-2.5 py-1 text-xs font-bold text-blue-700 bg-blue-50/70 border border-blue-100/50 rounded-lg tabular-nums">
                              {a.sales} sales
                            </span>
                            <div className="w-24 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
                                style={{ width: `${progressWidth}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* View action */}
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => setViewAchiever(a)}
                            className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                            title="View booked sites & customers"
                          >
                            <Eye size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Trophy size={28} className="text-gray-300" />
                        <span className="text-sm text-gray-400">No active achiever records found in selected criteria.</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Achiever Details Modal ── */}
      {viewAchiever && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
          onClick={() => setViewAchiever(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3.5">
                <AvatarCircle
                  person={viewAchiever}
                  className="w-12 h-12 ring-2 ring-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 shadow-sm"
                  textClassName="text-blue-700 text-sm font-bold"
                />
                <div>
                  <h3 className="font-bold text-slate-900 text-lg leading-tight">
                    {viewAchiever.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-[11px] font-semibold">
                      {viewAchiever.role}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 font-mono">
                      <Phone size={11} className="text-slate-400" /> {viewAchiever.mobile || "—"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold shadow-sm shadow-amber-500/30">
                  <Trophy size={13} /> {viewAchiever.sales} sales
                </span>
                <button
                  onClick={() => setViewAchiever(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="px-6 py-4">
              {/* Summary stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                <div className="rounded-2xl border border-slate-100 bg-white shadow-sm p-4 text-center">
                  <div className="w-9 h-9 mx-auto rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md shadow-blue-500/20 flex items-center justify-center mb-2">
                    <Calendar size={16} className="text-white" />
                  </div>
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Total Bookings</div>
                  <div className="text-xl font-bold text-slate-800 mt-0.5 tabular-nums">{achieverBookings.length}</div>
                </div>
                
                <div className="rounded-2xl border border-slate-100 bg-white shadow-sm p-4 text-center">
                  <div className="w-9 h-9 mx-auto rounded-lg bg-gradient-to-br from-purple-500 to-fuchsia-600 shadow-md shadow-purple-500/20 flex items-center justify-center mb-2">
                    <Ruler size={16} className="text-white" />
                  </div>
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Total Sq.ft</div>
                  <div className="text-xl font-bold text-slate-800 mt-0.5 tabular-nums">{modalStats.totalSqft.toLocaleString()}</div>
                </div>
              </div>

              {/* Referred By */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 mb-6 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <UserRound size={12} /> Referred By
                </div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <AvatarCircle
                    person={{
                      name: viewAchiever.parentName || "?",
                      avatar: viewAchiever.parentAvatar,
                      avatarUrl: viewAchiever.parentAvatarUrl,
                    }}
                    className="w-8 h-8 ring-1 ring-slate-200 bg-gradient-to-br from-indigo-500 to-purple-600"
                    textClassName="text-white text-[10px] font-bold"
                  />
                  <span className="text-sm font-semibold text-slate-800">{viewAchiever.parentName || "—"}</span>
                  <span className="font-mono text-[11px] font-semibold text-slate-500">{viewAchiever.parentCode || "—"}</span>
                </div>
              </div>

              {/* Bookings table */}
              <div className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-indigo-50 flex items-center justify-center">
                  <Building2 size={12} className="text-indigo-600" />
                </span>
                Booked Sites & Customers
              </div>

              {achieverBookings.length > 0 ? (
                <div className="overflow-x-auto border border-slate-100 rounded-xl">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="px-3 py-2.5 text-left text-[10px] font-medium text-slate-600 uppercase tracking-wider">Booking ID</th>
                        <th className="px-3 py-2.5 text-left text-[10px] font-medium text-slate-600 uppercase tracking-wider">Customer</th>
                        <th className="px-3 py-2.5 text-left text-[10px] font-medium text-slate-600 uppercase tracking-wider">Project</th>
                        <th className="px-3 py-2.5 text-left text-[10px] font-medium text-slate-600 uppercase tracking-wider">Site</th>
                        <th className="px-3 py-2.5 text-left text-[10px] font-medium text-slate-600 uppercase tracking-wider">Booking Date</th>
                        <th className="px-3 py-2.5 text-center text-[10px] font-medium text-slate-600 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {achieverBookings.map((b) => {
                        const proj = getProject(b);
                        const projectName = b.projectName || b.project?.name || proj?.name || "—";
                        const projectNo = b.projectNo || proj?.projectNo || "";
                        const siteNo = b.siteNo || b.site?.siteNo || "—";
                        return (
                          <tr key={b.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="px-3 py-3">
                              <span className="inline-flex items-center font-mono text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-lg">
                                {b.bookingId || b.id}
                              </span>
                            </td>
                            <td className="px-3 py-3">
                              <div className="flex items-center gap-2">
                              
                                <div>
                                  <div className="font-medium text-slate-800">{b.customerName || "—"}</div>
                                  <div className="text-[11px] text-slate-400">{b.customerMobile || b.mobile || ""}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-3">
                              <div className="text-slate-800">{projectName}</div>
                              <div className="text-[11px] text-slate-400">{projectNo}</div>
                            </td>
                            <td className="px-3 py-3">
                              <div className="flex items-center gap-1.5 text-slate-700">
                                <MapPin size={12} className="text-slate-400 flex-shrink-0" />
                                {siteNo}
                              </div>
                              <div className="text-[11px] text-slate-400">
                                {b.plotArea ? `${Number(b.plotArea).toLocaleString()} sq.ft` : ""}
                              </div>
                            </td>
                            <td className="px-3 py-3 text-slate-900 font-medium">{b.bookingDate || "—"}</td>
                            <td className="px-3 py-3 text-center">
                              <StatusBadge status={b.status} />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center text-sm text-slate-400 py-8">
                  No bookings found for this achiever in the selected criteria.
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/40 flex justify-end">
              <button
                onClick={() => setViewAchiever(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

{/* ── Hidden PDF Export Template ── */}
<div className="absolute top-[-9999px] left-[-9999px] pointer-events-none opacity-0" aria-hidden="true" ref={pdfExportContainerRef}>
  {Array.from({ length: Math.max(1, Math.ceil(calculatedAchievers.length / 10)) }).map((_, pageIdx) => {
    const batch = calculatedAchievers.slice(pageIdx * 10, (pageIdx + 1) * 10);
    const cols = getPodiumCols(batch.length);
    const cardWidth = Math.min(Math.floor((970 - (cols - 1) * 20) / cols), 340);
    return (
      <div key={pageIdx} className="pdf-page w-[1050px] h-[742px] relative flex flex-col font-sans box-border" style={{ overflow: "hidden", background: "#FFFFFF" }}>
        
        {/* Decorative background circles */}
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full" style={{ background: "radial-gradient(circle, rgba(191,219,254,0.25) 0%, transparent 70%)" }}></div>
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full" style={{ background: "radial-gradient(circle, rgba(191,219,254,0.25) 0%, transparent 70%)" }}></div>
        
        {/* Decorative dots */}
        <div className="absolute top-[120px] left-[80px] w-2 h-2 rounded-full bg-blue-200/60"></div>
        <div className="absolute top-[180px] right-[100px] w-2 h-2 rounded-full bg-blue-200/60"></div>
        <div className="absolute bottom-[200px] left-[60px] w-1.5 h-1.5 rounded-full bg-blue-300/50"></div>
        <div className="absolute bottom-[280px] right-[70px] w-1.5 h-1.5 rounded-full bg-blue-300/50"></div>

        {/* Logo top-left - LARGER */}
        <div className="absolute top-6 left-10 z-20">
          <img src={logoUrl} alt="Logo" className="h-32" crossOrigin="anonymous" />
        </div>

        {/* Header Section */}
        <div className="w-full text-center mt-4 z-10 flex flex-col items-center relative">
          {/* Stars above title */}
          <div className="flex items-center gap-2 mb-2">
            <Star className="text-amber-400 fill-amber-400 w-3 h-3" />
            <Star className="text-amber-400 fill-amber-400 w-4 h-4" />
            <Star className="text-amber-400 fill-amber-400 w-3 h-3" />
          </div>
          
  <h1 
  className="text-[38px] font-medium text-slate-800 m-0 leading-tight"
  style={{ 
    letterSpacing: "-0.01em",
    fontFamily: "'Inter', 'Helvetica Neue', sans-serif"
  }}
>
  Achievers of the Month
</h1>
          {/* Month pill with decorative lines */}
          <div className="flex items-center gap-3 mt-3">
            <div className="h-px w-16 bg-blue-300"></div>
          <div className="text-white font-bold px-8 py-2 rounded-full text-[17px] tracking-wide" style={{ background: "linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%)", boxShadow: "0 4px 12px rgba(59,130,246,0.3)" }}>
  {monthRange.monthName} {monthRange.year}
</div>
            <div className="h-px w-16 bg-blue-300"></div>
          </div>
        </div>

      {/* Achievers Grid - PREMIUM CORPORATE DESIGN */}
<div className="flex-1 mt-8 w-full z-10 flex flex-wrap justify-center content-start gap-x-5 gap-y-10 px-10">
  {batch.map((a) => {
    const r = a.rank;
    const isGold = r === 1;
    const isSilver = r === 2;
    const isBronze = r === 3;

    // Premium metallic color palettes
    const badgeTheme = isGold 
      ? { 
          light: '#FFE066',
          main: '#F4B400', 
          deep: '#D89A00',
          shadow: '#8B6508',
          text: '#FFFFFF',
          glowColor: 'rgba(244,180,0,0.4)'
        }
      : isSilver 
      ? { 
          light: '#F1F5F9',
          main: '#CBD5E1', 
          deep: '#94A3B8',
          shadow: '#475569',
          text: '#FFFFFF',
          glowColor: 'rgba(148,163,184,0.3)'
        }
      : isBronze 
      ? { 
          light: '#E8A87C',
          main: '#CD7F32', 
          deep: '#9C5B1A',
          shadow: '#5C3810',
          text: '#FFFFFF',
          glowColor: 'rgba(205,127,50,0.3)'
        }
      : { 
          light: '#3B5BB8',
          main: '#1E3A8A', 
          deep: '#152C6B',
          shadow: '#0A163B',
          text: '#FFFFFF',
          glowColor: 'rgba(30,58,138,0.25)'
        };

    return (
      <div 
        key={a.id} 
        className="rounded-2xl relative flex flex-col items-center pt-9 pb-4 px-3 bg-white flex-shrink-0"
        style={{ 
          width: `${cardWidth}px`,
          border: '1px solid #E5E7EB',
          boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(15,23,42,0.06)",
          height: "230px"
        }}
      >
    {/* AWARD ROSETTE RIBBON BADGE */}
<div 
  className="absolute -top-4 -left-2 z-20"
  style={{ 
    filter: isGold 
      ? `drop-shadow(0 0 10px ${badgeTheme.glowColor}) drop-shadow(0 4px 8px rgba(0,0,0,0.18))`
      : `drop-shadow(0 4px 8px rgba(0,0,0,0.15))`
  }}
>
  <svg width="52" height="66" viewBox="0 0 52 66">
    <defs>
      {/* Circle medal gradient */}
      <radialGradient id={`medalGrad-${a.id}`} cx="35%" cy="30%" r="75%">
        <stop offset="0%" stopColor={badgeTheme.light} />
        <stop offset="55%" stopColor={badgeTheme.main} />
        <stop offset="100%" stopColor={badgeTheme.deep} />
      </radialGradient>
      
      {/* Ribbon tail gradient - left */}
      <linearGradient id={`tailL-${a.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor={badgeTheme.deep} />
        <stop offset="60%" stopColor={badgeTheme.main} />
        <stop offset="100%" stopColor={badgeTheme.deep} />
      </linearGradient>
      
      {/* Ribbon tail gradient - right */}
      <linearGradient id={`tailR-${a.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor={badgeTheme.deep} />
        <stop offset="40%" stopColor={badgeTheme.main} />
        <stop offset="100%" stopColor={badgeTheme.deep} />
      </linearGradient>
      
      {/* Border ring gradient */}
      <linearGradient id={`ring-${a.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor={badgeTheme.main} />
        <stop offset="100%" stopColor={badgeTheme.shadow} />
      </linearGradient>
    </defs>
    
    {/* ==== RIBBON TAILS (behind medal) ==== */}
    {/* Left ribbon tail */}
    <path 
      d="M 15 32 
         L 9 62 
         L 16 57 
         L 23 64 
         L 25 38 Z" 
      fill={`url(#tailL-${a.id})`}
      stroke={badgeTheme.shadow}
      strokeWidth="0.4"
    />
    
    {/* Right ribbon tail */}
    <path 
      d="M 37 32 
         L 43 62 
         L 36 57 
         L 29 64 
         L 27 38 Z" 
      fill={`url(#tailR-${a.id})`}
      stroke={badgeTheme.shadow}
      strokeWidth="0.4"
    />
    
    {/* Fold shadow on tails */}
    <path 
      d="M 15 32 L 25 38 L 23 44 L 14 38 Z" 
      fill="rgba(0,0,0,0.2)"
    />
    <path 
      d="M 37 32 L 27 38 L 29 44 L 38 38 Z" 
      fill="rgba(0,0,0,0.2)"
    />
    
    {/* ==== MEDAL CIRCLE (on top) - LARGER ==== */}
    {/* Outer ring border */}
    <circle 
      cx="26" cy="23" r="21" 
      fill={`url(#ring-${a.id})`}
    />
    
    {/* Main medal body - BIGGER */}
    <circle 
      cx="26" cy="23" r="19" 
      fill={`url(#medalGrad-${a.id})`}
    />
    
    {/* Inner decorative ring */}
    <circle 
      cx="26" cy="23" r="16.5" 
      fill="none"
      stroke="rgba(255,255,255,0.4)"
      strokeWidth="0.7"
    />
    
    {/* Glass shine highlight (top-left) - smaller so number is clear */}
    <ellipse 
      cx="19" cy="15" rx="5" ry="3" 
      fill="white" 
      opacity="0.35"
    />
    <ellipse 
      cx="17.5" cy="14" rx="1.8" ry="1" 
      fill="white" 
      opacity="0.7"
    />
    
    {/* Crown for Rank 1 only */}
    {isGold && (
      <g transform="translate(26, 8)">
        <path 
          d="M -5 2 L -5 -2 L -2.5 0 L 0 -3 L 2.5 0 L 5 -2 L 5 2 Z" 
          fill="#FFFFFF"
          stroke={badgeTheme.shadow}
          strokeWidth="0.3"
        />
        <circle cx="-5" cy="-2" r="0.7" fill="#FFFFFF" stroke={badgeTheme.shadow} strokeWidth="0.2"/>
        <circle cx="0" cy="-3" r="0.7" fill="#FFFFFF" stroke={badgeTheme.shadow} strokeWidth="0.2"/>
        <circle cx="5" cy="-2" r="0.7" fill="#FFFFFF" stroke={badgeTheme.shadow} strokeWidth="0.2"/>
      </g>
    )}
    
    {/* Rank number - BIG BOLD WHITE with dark shadow for pop */}
    {/* Shadow layer for depth */}
    <text 
      x="26.5" 
      y={isGold ? "31.5" : "30.5"}
      textAnchor="middle" 
      fontSize={r >= 10 ? "17" : "22"}
      fontWeight="900" 
      fill={badgeTheme.shadow}
      fontFamily="'Inter', 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif"
      style={{ letterSpacing: "-0.03em" }}
      opacity="0.5"
    >
      {r}
    </text>
    
    {/* Main white number - LARGE & BOLD */}
    <text 
      x="26" 
      y={isGold ? "31" : "30"}
      textAnchor="middle" 
      fontSize={r >= 10 ? "17" : "22"}
      fontWeight="900" 
      fill="#FFFFFF"
      fontFamily="'Inter', 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif"
      style={{ letterSpacing: "-0.03em" }}
    >
      {r}
    </text>
  </svg>
</div>

        {/* Avatar */}
        <div className="relative flex justify-center items-center w-full mt-3">
          <div 
            className="w-[76px] h-[76px] rounded-full z-10 bg-white overflow-hidden"
            style={{ 
              border: '3px solid #F1F5F9',
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
            }}
          >
            <img 
              src={a.avatarUrl || userProfUrl} 
              className="w-full h-full object-cover" 
              crossOrigin="anonymous"
              alt={a.name}
            />
          </div>
        </div>

        {/* Name */}
        <p className="mt-3 font-extrabold text-slate-900 text-[15px] truncate w-full text-center px-1 leading-tight">
          {a.name}
        </p>
        
        {/* Role */}
        <p 
          className="text-[12px] font-bold mt-1 truncate w-full text-center text-slate-600"
          style={{ letterSpacing: "0.01em" }}
        >
          {a.role}
        </p>

        {/* Sales pill */}
        <div 
          className="mt-auto rounded-lg py-1.5 px-4 w-full text-center text-[13px] font-bold flex items-center justify-center gap-1.5"
          style={{ 
            background: '#EFF6FF', 
            border: '1px solid #DBEAFE', 
            color: '#1D4ED8' 
          }}
        >
          <BarChart2 className="w-3.5 h-3.5" strokeWidth={2.5} />
          {a.sales} Sales
        </div>
      </div>
    );
  })}
</div>

        {/* Bottom Banner */}
       <div
  className="w-full flex items-center justify-center gap-2 py-3 z-10"
  style={{ background: "linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)" }}
>
  <Trophy className="w-4 h-4 text-yellow-300 fill-yellow-300" />
  <span className="text-white text-sm font-medium">
    Celebrating Outstanding Performance
  </span>
</div>
      </div>
    );
  })}
</div>
    </div>
  );
}