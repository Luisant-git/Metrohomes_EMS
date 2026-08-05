import { useState, useMemo, useRef, useEffect } from "react";
import { Trophy, Download, Medal, Star, Crown, Calendar, CheckCircle, FileSpreadsheet, Search, X, ChevronDown, Building2, UserRound, Eye, User, MapPin, Phone, Ruler } from "lucide-react";
import { toast } from "react-toastify";
import jsPDF from "jspdf";
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
      // Achiever = the user who created the booking's customer
      const creatorId =
        customerCreatorMap.get(String(b.customerId)) ||
        b.createdById ||
        b.createdBy ||
        b.assignedTo;
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
        const creatorId =
          customerCreatorMap.get(String(b.customerId)) ||
          b.createdById ||
          b.createdBy ||
          b.assignedTo;
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
    const toastId = toast.loading("Generating PDF Report...");

    try {
      const logoData = await loadImageAsDataUrl(logoUrl);
      const userProfData = await loadImageAsDataUrl(userProfUrl);

      const avatarCache = new Map();
      const avatarUrls = [
        ...new Set(calculatedAchievers.map((a) => a.avatarUrl || userProfUrl).filter(Boolean)),
      ];
      await Promise.all(
        avatarUrls.map(async (u) => {
          avatarCache.set(u, await loadImageAsDataUrl(u));
        })
      );

      // 15-inch landscape poster sheet (381mm x 279mm)
      const PDF_W = 381;
      const PDF_H = 279;
      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: [PDF_W, PDF_H] });

      const margin = 15;
      const contentW = PDF_W - margin * 2;
      const rowH = 13;

      const colDefs = [
        { key: "rank", label: "Rank", x: margin, w: 26 },
        { key: "name", label: "Achiever", x: margin + 26, w: 155 },
        { key: "role", label: "Role", x: margin + 181, w: 90 },
        { key: "id", label: "ID", x: margin + 271, w: 50 },
        { key: "sales", label: "Sales", x: margin + 321, w: 30 },
      ];

      const renderHeader = (pageNumber) => {
        if (logoData) {
          pdf.addImage(logoData, "PNG", margin, margin, 34, 26, undefined, "FAST");
        }
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(32);
        pdf.setTextColor(17, 24, 39);
        pdf.text("Achievers of the Month", PDF_W / 2, margin + 17, { align: "center" });
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(16);
        pdf.setTextColor(29, 111, 185);
        pdf.text(`${monthRange.monthName} ${monthRange.year}`, PDF_W / 2, margin + 30, { align: "center" });
        pdf.setFontSize(10);
        pdf.setTextColor(107, 114, 128);
        pdf.text(
          `Total Sales: ${summaryMetrics.totalSales}   |   Achievers: ${calculatedAchievers.length}`,
          PDF_W / 2,
          margin + 40,
          { align: "center" }
        );
        pdf.setDrawColor(29, 111, 185);
        pdf.setLineWidth(0.9);
        pdf.line(margin, margin + 46, PDF_W - margin, margin + 46);
        if (pageNumber > 1) {
          pdf.setFontSize(9);
          pdf.setTextColor(150, 150, 150);
          pdf.text(`Page ${pageNumber}`, PDF_W - margin, PDF_H - 8, { align: "right" });
        }
      };

      const drawTableHeader = (top) => {
        pdf.setFillColor(29, 111, 185);
        pdf.rect(margin, top, contentW, rowH, "F");
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(11);
        pdf.setTextColor(255, 255, 255);
        colDefs.forEach((c) => {
          const centered = c.key === "rank" || c.key === "sales";
          const tx = centered ? c.x + c.w / 2 : c.x + (c.key === "name" ? 14 : 4);
          pdf.text(c.label, tx, top + rowH / 2 + 1.2, centered ? { align: "center" } : undefined);
        });
      };

      const drawRow = (a, top, idx) => {
        pdf.setFillColor(idx % 2 === 0 ? 248 : 255, idx % 2 === 0 ? 250 : 255, idx % 2 === 0 ? 252 : 255);
        pdf.rect(margin, top, contentW, rowH, "F");

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(12);
        pdf.setTextColor(30, 64, 175);
        pdf.text(String(a.rank), colDefs[0].x + colDefs[0].w / 2, top + rowH / 2 + 1.2, { align: "center" });

        const avatarData = avatarCache.get(a.avatarUrl || userProfUrl);
        const imgSize = 9;
        if (avatarData) {
          pdf.addImage(
            avatarData,
            "PNG",
            colDefs[1].x + 2,
            top + (rowH - imgSize) / 2,
            imgSize,
            imgSize,
            undefined,
            "FAST"
          );
        }
        pdf.setTextColor(17, 24, 39);
        pdf.text(a.name, colDefs[1].x + 14, top + rowH / 2 + 1.2);

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(11);
        pdf.setTextColor(71, 85, 105);
        pdf.text(a.role, colDefs[2].x + 4, top + rowH / 2 + 1.2);

        pdf.setFont("courier", "normal");
        pdf.setTextColor(100, 116, 139);
        pdf.text(String(a.employeeCode || a.id), colDefs[3].x + 4, top + rowH / 2 + 1.2);

        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(29, 111, 185);
        pdf.text(String(a.sales), colDefs[4].x + colDefs[4].w / 2, top + rowH / 2 + 1.2, { align: "center" });
      };

      renderHeader(1);
      const tableTop = margin + 52;
      drawTableHeader(tableTop);
      let y = tableTop + rowH;
      let page = 1;

      calculatedAchievers.forEach((a, idx) => {
        if (y + rowH > PDF_H - 12) {
          pdf.addPage([PDF_W, PDF_H], "landscape");
          page += 1;
          renderHeader(page);
          drawTableHeader(tableTop);
          y = tableTop + rowH;
        }
        drawRow(a, y, idx);
        y += rowH;
      });

      const formattedMonth = `${monthRange.year}${String(monthRange.month).padStart(2, "0")}`;
      pdf.save(`Achievers_Report_${formattedMonth}.pdf`);

      toast.update(toastId, {
        render: "PDF report downloaded successfully! 📄",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
    } catch (err) {
      console.error(err);
      toast.update(toastId, {
        render: "Failed to download PDF report",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    } finally {
      setIsExporting(false);
    }
  };

  // ── CSV Export Routine ──
  const handleDownloadCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Rank,Name,Role,Sales\n";
    calculatedAchievers.forEach((a) => {
      csvContent += `${a.rank},"${a.name}","${a.role}",${a.sales}\n`;
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
          <h1 className="text-2xl font-normal text-gray-900 flex items-center gap-2">
            <Trophy size={24} className="text-amber-500 flex-shrink-0" />
            Achievers Report
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">
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
                  <AvatarCircle
                    person={summaryMetrics.silver}
                    className="w-16 h-16 border-2 border-white bg-gradient-to-br from-slate-200 to-slate-100 shadow-md transition-transform duration-300 group-hover:scale-105"
                    textClassName="font-bold text-lg text-slate-700"
                  />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-slate-300 text-slate-800 border border-white flex items-center justify-center text-xs font-black shadow-sm">
                    🥈
                  </div>
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
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-amber-400 text-white border-2 border-white flex items-center justify-center text-xs font-black shadow-md">
                    🥇
                  </div>
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
                  <AvatarCircle
                    person={summaryMetrics.bronze}
                    className="w-16 h-16 border-2 border-white bg-gradient-to-br from-orange-100 to-amber-50 shadow-md transition-transform duration-300 group-hover:scale-105"
                    textClassName="font-bold text-lg text-orange-950/80"
                  />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-orange-300 text-orange-850 border border-white flex items-center justify-center text-xs font-black shadow-sm">
                    🥉
                  </div>
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
                          {a.rank <= 3 ? (
                            <span className="text-lg leading-none">
                              {a.rank === 1 ? "🥇" : a.rank === 2 ? "🥈" : "🥉"}
                            </span>
                          ) : (
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${rankChip}`}>
                              {a.rank}
                            </div>
                          )}
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
                            <td className="px-3 py-3 text-slate-600">{b.bookingDate || "—"}</td>
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
    </div>
  );
}