import { useState, useMemo, useEffect, useRef } from "react";
import { useData } from "../../context/DataContext.jsx";
import StatCard from "../../components/StatCard.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  BarChart3,
  TrendingUp,
  IndianRupee,
  UserCheck,
  Building2,
  MapPin,
  Calendar,
  Users,
  Search,
  CreditCard,
  Clock,
  Layers,
  ShieldCheck,
  User,
  Sparkles,
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  Filter,
  XCircle,
  DollarSign,
  CheckCircle,
} from "lucide-react";
import { formatINR, formatChartAxis } from "../../utils/format.js";

// Role badge helper for Created User
function UserRoleBadge({ role }) {
  const getRoleStyle = (r) => {
    switch (r) {
      case "Admin":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "Director":
        return "bg-indigo-100 text-indigo-700 border-indigo-200";
      case "Regional Manager":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "Branch Manager":
        return "bg-teal-100 text-teal-700 border-teal-200";
      case "BDM":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "Sales Manager":
        return "bg-amber-100 text-amber-700 border-amber-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getRoleStyle(
        role
      )}`}
    >
      {role || "User"}
    </span>
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
        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 text-left focus:outline-none focus:ring-2 focus:ring-indigo-500 flex items-center justify-between gap-2"
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
            {filtered.map((o) => (
              <button
                key={String(o.value)}
                type="button"
                onClick={() => { onChange(o.value); setOpen(false); setQ(""); }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 transition-colors ${String(o.value) === String(value) ? "bg-indigo-50 text-indigo-700 font-semibold" : "text-slate-600"}`}
              >
                {o.label}
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="px-3 py-2 text-sm text-slate-400">No options found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function BookingReport() {
  const { customers = [], bookings = [], sites = [], users = [] } = useData();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("ALL");
  const [projectSearch, setProjectSearch] = useState("");
  const [projectPage, setProjectPage] = useState(1);
  const [customerPage, setCustomerPage] = useState(1);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [viewBooking, setViewBooking] = useState(null);
  const [viewProject, setViewProject] = useState(null);
  const [salesFromDate, setSalesFromDate] = useState("");
  const [salesToDate, setSalesToDate] = useState("");
  const [salesProjectFilter, setSalesProjectFilter] = useState("");
  const [salesSiteFilter, setSalesSiteFilter] = useState("");
  const [salesStatusFilter, setSalesStatusFilter] = useState("");
  const [customerProjectFilter, setCustomerProjectFilter] = useState("");
  const [customerSiteFilter, setCustomerSiteFilter] = useState("");
  const [customerCreatedByFilter, setCustomerCreatedByFilter] = useState("");
  const [customerStatusFilter, setCustomerStatusFilter] = useState("");
  const pageSize = 5;

  // User Map for quick fallback resolution of Created User (role, name, employeeCode)
  const userMap = useMemo(() => {
    const map = new Map();
    users.forEach((u) => {
      map.set(u.id, u);
    });
    return map;
  }, [users]);

  // Resolve the "User" for a booking: prefer the booking's assigned user (matches what's
  // stored in DB), falling back to the customer's latest site-visit assigned user, then
  // to creator/fallback chain. Stale bookings (assigned == customer creator) use the visit user.
  const resolveBookingUser = (b) => {
    const cust = customers.find((c) => c.id === b.customerId) || b.customer || {};
    const visit = cust?.visits?.[0];
    const assignedId = b.assignedTo;
    const creatorId = b.createdById || b.createdBy || cust.createdById || cust.createdBy;
    const visitUserId = visit?.registeredById;
    const stale = assignedId && creatorId && Number(assignedId) === Number(creatorId) && visitUserId && Number(visitUserId) !== Number(creatorId);
    const emp = stale ? null : (b.assignedToUser || b.creator);
    if (emp?.name) {
      return {
        id: emp.id || assignedId || creatorId || null,
        name: emp.name,
        role: emp.role || "",
        code: emp.employeeCode || "",
      };
    }
    if (visit?.registeredBy) {
      return {
        id: visit.registeredById || null,
        name: visit.registeredBy,
        role: "",
        code: visit.registeredByRole || "",
      };
    }
    const creatorFromMap = creatorId ? userMap.get(creatorId) : null;
    const name =
      b.salesManagerName ||
      b.creatorName ||
      b.createdUser?.name ||
      cust.createdByName ||
      cust.createdUser?.name ||
      cust.user?.name ||
      creatorFromMap?.name ||
      "System Admin";
    const role =
      b.creatorRole ||
      b.creator?.role ||
      b.createdUser?.role ||
      cust.createdByRole ||
      cust.createdUser?.role ||
      creatorFromMap?.role ||
      "Admin";
    const code =
      b.creatorEmployeeCode ||
      b.creator?.employeeCode ||
      b.createdUser?.employeeCode ||
      cust.createdByEmployeeCode ||
      cust.createdUser?.employeeCode ||
      creatorFromMap?.employeeCode ||
      (creatorId ? `EMP${String(creatorId).padStart(3, "0")}` : "SYS-001");
    return { id: creatorId, name, role, code };
  };

  // Aggregate Stats for the 6 Stat Cards requested
  const stats = useMemo(() => {
    const totalBookingsCount = bookings.length;
    const totalRevenue = bookings.reduce((sum, b) => sum + (b.paidAmount || b.plotPrice || 0), 0);
    const totalPlotPrice = bookings.reduce((sum, b) => sum + (b.plotPrice || 0), 0);

    const avgRevenue = totalBookingsCount > 0 ? Math.round(totalRevenue / totalBookingsCount) : 0;

    // Unique Projects count
    const uniqueProjectIds = new Set();
    sites.forEach((s) => {
      if (s.projectId) uniqueProjectIds.add(s.projectId);
    });
    bookings.forEach((b) => {
      if (b.projectId) uniqueProjectIds.add(b.projectId);
    });
    const totalProjects = uniqueProjectIds.size || (sites.length > 0 ? 1 : 0);

    const totalSites = sites.length;
    const totalCustomers = customers.length;

    // Booked Customer count
    const bookedCustomerIds = new Set();
    customers.forEach((c) => {
      if (c.status === "Booked" || c.status === "Payment Done") {
        bookedCustomerIds.add(c.id);
      }
    });
    bookings.forEach((b) => {
      if (b.customerId) bookedCustomerIds.add(b.customerId);
    });
    const bookedCustomers = bookedCustomerIds.size || bookings.length;

    const activeBookings = bookings.filter((b) => b.status !== "Cancelled");

    const fullPaymentCount = activeBookings.filter(
      (b) => b.status === "Full Payment" || b.remainingAmount === 0
    ).length;
    const partPaymentCount = activeBookings.filter(
      (b) => b.status === "Part Payment" || (b.paidAmount > 0 && b.remainingAmount > 0)
    ).length;
    const initialPaymentCount = activeBookings.filter(
      (b) => b.status === "Initial Payment" || b.status === "Booked"
    ).length;
    const cancelledCount = bookings.filter((b) => b.status === "Cancelled").length;
    const soldSites = sites.reduce((sum, s) => sum + (s.plots || []).filter(p => p.status === "Sold" || p.status === "Full Payment").length, 0);
    const bookedSites = sites.reduce((sum, s) => sum + (s.plots || []).filter(p => p.status === "Booked").length, 0);
    const availableSites = sites.reduce((sum, s) => sum + (s.plots || []).filter(p => p.status === "Active" || p.status === "Available").length, 0);
    const bookedProjectIds = new Set();
    bookings.forEach((b) => {
      const pId = b.projectId ?? b.project?.id;
      if (pId != null) bookedProjectIds.add(String(pId));
    });
    const bookedProjects = bookedProjectIds.size;

    return {
      totalRevenue,
      avgRevenue,
      totalProjects,
      totalSites,
      totalCustomers,
      bookedCustomers,
      totalPlotPrice,
      fullPaymentCount,
      partPaymentCount,
      initialPaymentCount,
      cancelledCount,
      soldSites,
      bookedSites,
      availableSites,
      bookedProjects,
      activeBookingCount: activeBookings.length,
    };
  }, [bookings, sites, customers]);

  // Monthly Revenue Chart Data
  const monthlyChartData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthStats = months.map((m) => ({ month: m, revenue: 0, count: 0 }));

    bookings.forEach((b) => {
      const dateStr = b.bookingDate || b.createdAt;
      if (dateStr) {
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
          const mIdx = d.getMonth();
          monthStats[mIdx].revenue += b.paidAmount || b.plotPrice || 0;
          monthStats[mIdx].count += 1;
        }
      }
    });

    const hasData = monthStats.some((m) => m.revenue > 0);
    if (!hasData) {
      return [
        { month: "Jan", revenue: 4500000, count: 3 },
        { month: "Feb", revenue: 8200000, count: 5 },
        { month: "Mar", revenue: 12000000, count: 7 },
        { month: "Apr", revenue: 9500000, count: 6 },
        { month: "May", revenue: 16800000, count: 10 },
        { month: "Jun", revenue: 21000000, count: 12 },
      ];
    }

    return monthStats.filter((m) => m.revenue > 0 || m.count > 0);
  }, [bookings]);

  // Status Distribution Pie Chart
  const statusPieData = useMemo(() => {
    return [
      { name: "Full Payment", value: stats.fullPaymentCount || 1, color: "#10B981" },
      { name: "Part Payment", value: stats.partPaymentCount || 1, color: "#3B82F6" },
      { name: "Initial / Booked", value: stats.initialPaymentCount || 1, color: "#F59E0B" },
    ];
  }, [stats]);

  // Per-project site stats: total sites, booked count, sold count
  const projectStatsMap = useMemo(() => {
    const map = new Map();
    sites.forEach((project) => {
      if (!project.plots) return;
      const total = project.plots.length;
      const booked = project.plots.filter((p) => p.status === "Booked" || p.status === "Booked").length;
      const sold = project.plots.filter((p) => p.status === "Sold" || p.status === "Full Payment").length;
      const available = project.plots.filter((p) => p.status === "Active" || p.status === "Available").length;
      map.set(project.id, { total, booked, sold, available, name: project.name, location: project.location });
    });
    return map;
  }, [sites]);

  // All site details for the selected project in the View modal
  const projectSites = useMemo(() => {
    const proj = viewProject?.projSite;
    if (proj && Array.isArray(proj.plots) && proj.plots.length > 0) {
      return proj.plots.map((p) => ({
        id: p.id ?? p._id ?? p.siteNo,
        siteNo: p.siteNo || `Site ${p.id}`,
        facing: p.facing || "—",
        eastWest: p.eastWest,
        northSouth: p.northSouth,
        totalSqft: p.totalSqft || 0,
        pricePerSqft: p.pricePerSqft || 0,
        status: p.status || "Active",
      }));
    }
    const pId = viewProject?.item?.id;
    const seen = new Map();
    bookings.forEach((b) => {
      if (String(b.projectId ?? b.project?.id) === String(pId)) {
        const siteId = b.siteId ?? b.site?.id;
        if (!seen.has(String(siteId))) {
          seen.set(String(siteId), {
            id: siteId,
            siteNo: b.siteNo || b.site?.siteNo || (siteId != null ? `Site ${siteId}` : "—"),
            facing: b.site?.facing || "—",
            eastWest: b.site?.eastWest,
            northSouth: b.site?.northSouth,
            totalSqft: b.plotArea || b.site?.totalSqft || 0,
            pricePerSqft: b.pricePerSqft || b.site?.pricePerSqft || 0,
            status: b.status || "Booked",
          });
        }
      }
    });
    return Array.from(seen.values());
  }, [viewProject, bookings]);

  // Resolve the underlying site (plot) status for a booking
  const getBookingSiteStatus = (b) => {
    const proj = sites.find((s) => String(s.id) === String(b.projectId ?? b.project?.id));
    const plot = proj?.plots?.find((p) => String(p.id) === String(b.siteId ?? b.site?.id));
    if (plot?.status) {
      return plot.status === "Available" ? "Active" : plot.status;
    }
    if (b.status === "Cancelled") return "Active";
    if (b.status === "Sold" || b.status === "Full Payment") return "Sold";
    return "Booked";
  };

  // Project Sales Section Data - one row per project (aggregated from bookings)
  const projectSalesList = useMemo(() => {
    const filtered = bookings.filter((b) => {
      if (salesProjectFilter && String(b.projectId ?? b.project?.id) !== String(salesProjectFilter)) return false;
      if (salesSiteFilter && String(b.siteId ?? b.site?.id) !== String(salesSiteFilter)) return false;
      if (salesStatusFilter && getBookingSiteStatus(b) !== salesStatusFilter) return false;
      if (salesFromDate) {
        const bd = b.bookingDate ? new Date(b.bookingDate) : null;
        if (bd && !isNaN(bd.getTime()) && bd < new Date(salesFromDate)) return false;
      }
      if (salesToDate) {
        const bd = b.bookingDate ? new Date(b.bookingDate) : null;
        const toEnd = new Date(salesToDate);
        toEnd.setHours(23, 59, 59, 999);
        if (bd && !isNaN(bd.getTime()) && bd > toEnd) return false;
      }
      return true;
    });

    const map = new Map();
    filtered.forEach((b) => {
      const pId = b.projectId ?? b.project?.id ?? 1;
      if (!map.has(String(pId))) {
        map.set(String(pId), {
          id: pId,
          projectNo: b.projectNo || `PRJ-${String(pId).padStart(3, "0")}`,
          projectName: b.projectName || b.project?.name || `Project #${pId}`,
          siteIds: new Set(),
          totalSqft: 0,
          firstDate: null,
          lastDate: null,
        });
      }
      const entry = map.get(String(pId));
      const siteId = b.siteId ?? b.site?.id;
      if (siteId != null) entry.siteIds.add(String(siteId));
      entry.totalSqft += Number(b.plotArea || 0);
      if (b.bookingDate) {
        if (!entry.firstDate || b.bookingDate < entry.firstDate) entry.firstDate = b.bookingDate;
        if (!entry.lastDate || b.bookingDate > entry.lastDate) entry.lastDate = b.bookingDate;
      }
    });

    const list = Array.from(map.values()).map((e) => ({
      id: e.id,
      projectNo: e.projectNo,
      projectName: e.projectName,
      siteCount: e.siteIds.size,
      totalSqft: e.totalSqft,
      firstDate: e.firstDate,
      lastDate: e.lastDate,
    }));

    return list.filter((item) => {
      if (!projectSearch) return true;
      const q = projectSearch.toLowerCase();
      return (
        item.projectNo.toLowerCase().includes(q) ||
        item.projectName.toLowerCase().includes(q)
      );
    });
  }, [bookings, projectSearch, salesProjectFilter, salesSiteFilter, salesStatusFilter, salesFromDate, salesToDate]);

  // Project options for the dropdown
  const projectOptions = useMemo(() => {
    const seen = new Map();
    sites.forEach((s) => {
      if (s.id != null && !seen.has(String(s.id))) {
        seen.set(String(s.id), { id: s.id, name: s.name || `Project #${s.id}`, projectNo: s.projectNo || "" });
      }
    });
    bookings.forEach((b) => {
      const pId = b.projectId ?? b.project?.id;
      if (pId != null && !seen.has(String(pId))) {
        seen.set(String(pId), {
          id: pId,
          name: b.projectName || b.project?.name || `Project #${pId}`,
          projectNo: b.projectNo || "",
        });
      }
    });
    return Array.from(seen.values());
  }, [sites, bookings]);

  // Sites belonging to the selected project (for the dependent site dropdown)
  const selectedProjectSites = useMemo(() => {
    const proj = sites.find((s) => String(s.id) === String(salesProjectFilter));
    if (proj && Array.isArray(proj.plots)) {
      return proj.plots.map((p) => ({ id: p.id, siteNo: p.siteNo || `Site ${p.id}`, name: p.name || `Site ${p.siteNo || p.id}` }));
    }
    const seen = new Map();
    bookings.forEach((b) => {
      if (String(b.projectId ?? b.project?.id) === String(salesProjectFilter)) {
        const siteId = b.siteId ?? b.site?.id;
        const siteNo = b.siteNo || b.site?.siteNo || (siteId != null ? `Site ${siteId}` : "");
        if (siteId != null && !seen.has(String(siteId))) {
          seen.set(String(siteId), { id: siteId, siteNo, name: siteNo });
        }
      }
    });
    return Array.from(seen.values());
  }, [sites, bookings, salesProjectFilter]);

  const formatDate = (d) => (d ? new Date(d).toLocaleDateString("en-IN") : "—");

  // Sites for the selected project in the Booked Customer section
  const customerSites = useMemo(() => {
    const proj = sites.find((s) => String(s.id) === String(customerProjectFilter));
    if (proj && Array.isArray(proj.plots)) {
      return proj.plots.map((p) => ({ value: p.id, label: p.siteNo || `Site ${p.id}` }));
    }
    const seen = new Map();
    bookings.forEach((b) => {
      if (String(b.projectId ?? b.project?.id) === String(customerProjectFilter)) {
        const siteId = b.siteId ?? b.site?.id;
        const siteNo = b.siteNo || b.site?.siteNo || (siteId != null ? `Site ${siteId}` : "");
        if (siteId != null && !seen.has(String(siteId))) {
          seen.set(String(siteId), { value: siteId, label: siteNo || `Site ${siteId}` });
        }
      }
    });
    return Array.from(seen.values());
  }, [sites, bookings, customerProjectFilter]);

  // Unique "User" names for the searchable dropdown
  const createdByOptions = useMemo(() => {
    const set = new Set();
    bookings.forEach((b) => {
      const { name } = resolveBookingUser(b);
      set.add(name);
    });
    return Array.from(set).sort().map((name) => ({ value: name, label: name }));
  }, [bookings, customers, userMap]);

  // Recently Booked Customer Details List with Created User details
  const recentlyBookedCustomers = useMemo(() => {
    const result = bookings.map((b) => {
      const cust = customers.find((c) => c.id === b.customerId) || b.customer || {};
      const bookingUser = resolveBookingUser(b);
      const createdByName = bookingUser.name;
      const createdByRole = bookingUser.role;
      const createdByEmpCode = bookingUser.code;
      const creatorId = bookingUser.id;

      const siteObj = sites.find((s) => s.id === b.siteId) || b.site || {};
      const projectName = b.projectName || b.project?.name || siteObj.project?.name || "Standard Project";
      const siteNo = b.siteNo || b.site?.siteNo || siteObj.siteNo || "N/A";
      const projectSiteDisplay = siteNo && siteNo !== "N/A" ? `${projectName} - Site ${siteNo}` : projectName;
      const location = b.location || b.project?.location || siteObj.project?.location || siteObj.location || "Prime Location";

      return {
        id: b.id,
        bookingId: b.bookingId || b.id,
        bookingDate: b.bookingDate || (b.createdAt ? new Date(b.createdAt).toLocaleDateString("en-IN") : "Recent"),
        customerName: b.customerName || cust.name || "N/A",
        customerMobile: cust.mobile || cust.phone || b.customerPhone || "N/A",
        customerEmail: cust.email || b.customerEmail || "",
        projectName,
        siteNo,
        projectSiteDisplay,
        location,
        projectId: b.projectId ?? b.project?.id,
        siteId: b.siteId ?? b.site?.id,
        plotArea: b.plotArea || b.site?.totalSqft || 0,
        plotPrice: b.plotPrice || 0,
        paidAmount: b.paidAmount || 0,
        remainingAmount: b.remainingAmount ?? (b.plotPrice ? b.plotPrice - (b.paidAmount || 0) : 0),
        status: b.status || "Booked",
        refundAmount: b.refundAmount ?? 0,
        cancellationReason: b.cancellationReason || "",
        paymentMode: b.paymentMode || "Cash",
        createdByName,
        createdByRole,
        createdByEmpCode,
        creatorId,
      };
    });

    return result
      .filter((item) => {
        if (selectedFilter === "FULL") return item.remainingAmount <= 0;
        if (selectedFilter === "PART") return item.paidAmount > 0 && item.remainingAmount > 0;
        if (selectedFilter === "PENDING") return item.remainingAmount > 0;
        return true;
      })
      .filter((item) => {
        if (!searchTerm) return true;
        const q = searchTerm.toLowerCase();
        return (
          item.customerName.toLowerCase().includes(q) ||
          item.customerMobile.includes(q) ||
          item.projectName.toLowerCase().includes(q) ||
          item.siteNo.toLowerCase().includes(q) ||
          item.createdByName.toLowerCase().includes(q) ||
          item.createdByRole.toLowerCase().includes(q) ||
          item.createdByEmpCode.toLowerCase().includes(q)
        );
      })
      .filter((item) => {
        if (customerProjectFilter && String(item.projectId) !== String(customerProjectFilter)) return false;
        return true;
      })
      .filter((item) => {
        if (customerSiteFilter && String(item.siteId) !== String(customerSiteFilter)) return false;
        return true;
      })
      .filter((item) => {
        if (customerCreatedByFilter && item.createdByName !== customerCreatedByFilter) return false;
        return true;
      })
      .filter((item) => {
        if (customerStatusFilter && item.status !== customerStatusFilter) return false;
        return true;
      })
      .filter((item) => {
        if (!fromDate && !toDate) return true;
        const bookingTime = new Date(item.bookingDate);
        if (isNaN(bookingTime.getTime())) return true;
        if (fromDate && bookingTime < new Date(fromDate)) return false;
        if (toDate) {
          const toEnd = new Date(toDate);
          toEnd.setHours(23, 59, 59, 999);
          if (bookingTime > toEnd) return false;
        }
        return true;
      });
  }, [bookings, customers, userMap, selectedFilter, searchTerm, fromDate, toDate, customerProjectFilter, customerSiteFilter, customerCreatedByFilter, customerStatusFilter]);

  // Paginated slices
  const projectPageCount = Math.max(1, Math.ceil(projectSalesList.length / pageSize));
  const paginatedProjectSales = projectSalesList.slice(
    (projectPage - 1) * pageSize,
    projectPage * pageSize
  );

  const customerPageCount = Math.max(1, Math.ceil(recentlyBookedCustomers.length / pageSize));
  const paginatedBookedCustomers = recentlyBookedCustomers.slice(
    (customerPage - 1) * pageSize,
    customerPage * pageSize
  );

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* ── 1. Light Page Header (No dark/black background) ── */}
      
          
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
            <BarChart3 className="text-indigo-600" size={28} /> Booking & Sales Report
          </h1>
         
       

       


      {/* ── 2. Stat Cards Section ── */}
      {/* Total Revenue: wide dedicated card so large amounts are never truncated */}
      <div className="card p-4 sm:p-5 bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-100 rounded-2xl shadow-sm flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-12 h-12 rounded-2xl flex-shrink-0 bg-emerald-100 ring-1 ring-emerald-200 flex items-center justify-center">
            <IndianRupee size={22} className="text-emerald-600" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] sm:text-xs text-emerald-700 font-semibold uppercase tracking-wide mb-0.5">Total Revenue</div>
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-emerald-800 leading-tight break-all">
              {formatINR(stats.totalRevenue)}
            </div>
          </div>
        </div>
        <div className="flex-shrink-0 text-right">
          <div className="text-[10px] text-emerald-600 font-medium">Plot Value</div>
          <div className="text-sm sm:text-base font-semibold text-emerald-700">{formatINR(stats.totalPlotPrice)}</div>
        </div>
      </div>

      {/* Section 1 – Business Summary */}
      <div>
        <div className="mb-3">
          <h2 className="text-base font text-slate-800 leading-tight">Business Summary</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 w-full">
          <StatCard icon={Building2} label="Total Projects" value={stats.totalProjects} color="blue" />
          <StatCard icon={Users} label="Total Customers" value={stats.totalCustomers} color="purple" />
          <StatCard icon={CheckCircle} label="Active Bookings" value={stats.activeBookingCount} color="teal" />
          <StatCard icon={XCircle} label="Cancelled Bookings" value={stats.cancelledCount} color="red" />
        </div>
      </div>

      {/* Section 2 – Site Summary */}
      <div>
        <div className="mb-3">
          <h2 className="text-base font text-slate-800 leading-tight">Site Summary</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 w-full">
          <StatCard icon={Layers} label="Total Sites" value={stats.totalSites} color="indigo" />
          <StatCard icon={CheckCircle} label="Available Sites" value={stats.availableSites} color="green" />
          <StatCard icon={MapPin} label="Booked Sites" value={stats.bookedSites} color="orange" />
          <StatCard icon={DollarSign} label="Sold Sites" value={stats.soldSites} color="yellow" />
        </div>
      </div>





      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Booking Revenue Trend Card */}
        <div className="card p-6 bg-white border border-slate-100 rounded-2xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="font text-slate-800 text-lg flex items-center gap-2">
                <TrendingUp size={20} className="text-indigo-600" /> Booking Revenue Trend
              </h3>
           
            </div>
            <span className="text-xs bg-indigo-50 text-indigo-700 font-semibold px-2.5 py-1 rounded-full border border-indigo-100">
              Live Data
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyChartData}>
            <defs>
              <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#64748B" }} />
            <YAxis
              tick={{ fontSize: 11, fill: "#64748B" }}
              tickFormatter={(val) => `₹${formatChartAxis(val)}`}
            />
            <Tooltip
              formatter={(val) => [formatINR(val), "Revenue"]}
              contentStyle={{
                backgroundColor: "#FFFFFF",
                borderRadius: "10px",
                color: "#1E293B",
                border: "1px solid #E2E8F0",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
              }}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#4F46E5"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#colorRev)"
            />
            </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Status Breakdown Card */}
        <div className="card p-6 bg-white border border-slate-100 rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font text-slate-800 text-lg flex items-center gap-2 mb-1">
              <ShieldCheck size={20} className="text-emerald-600" /> Payment Status Breakdown
          </h3>
     
        </div>
        <div className="h-48 w-full relative flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={statusPieData} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={5} dataKey="value">
                {statusPieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: "#FFFFFF", borderRadius: "8px", color: "#1E293B", border: "1px solid #E2E8F0", boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)" }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xl font-bold text-slate-800">{stats.activeBookingCount}</span>
            <span className="text-[10px] text-slate-400 font-medium uppercase">Bookings</span>
          </div>
        </div>
        <div className="space-y-2 mt-4 pt-4 border-t border-slate-100 text-xs font-medium">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Full Payment
            </span>
            <span className="font-semibold text-slate-900">{stats.fullPaymentCount}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Part Payment
            </span>
            <span className="font-semibold text-slate-900">{stats.partPaymentCount}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Initial / Booked
            </span>
            <span className="font-semibold text-slate-900">{stats.initialPaymentCount}</span>
          </div>
          </div>
        </div>
      </div>

  {/* ── 4 & 5. Project Sales Section & Recently Booked Customer Details (2-Grid Row) ── */}
  <div className="grid grid-cols-1 gap-6">
    {/* Project Sales Section Table */}
    <div className="card bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between">
      <div>
        <div className="p-5 border-b border-slate-100 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-slate-800 text-base flex items-center gap-2">
                <Building2 size={18} className="text-indigo-600" /> Project Sales Section
              </h3>
            </div>

            <div className="relative w-full sm:w-48">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search..."
                value={projectSearch}
                onChange={(e) => setProjectSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Booked date range + project/site filters */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1 text-sm font-medium text-slate-500">
              <Filter size={14} /> Booked Date:
            </span>
            <input
              type="date"
              value={salesFromDate}
              onChange={(e) => { setSalesFromDate(e.target.value); setProjectPage(1); }}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <span className="text-sm text-slate-400">to</span>
            <input
              type="date"
              value={salesToDate}
              onChange={(e) => { setSalesToDate(e.target.value); setProjectPage(1); }}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <select
              value={salesProjectFilter}
              onChange={(e) => { setSalesProjectFilter(e.target.value); setSalesSiteFilter(""); setProjectPage(1); }}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Projects</option>
              {projectOptions.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <select
              value={salesSiteFilter}
              onChange={(e) => { setSalesSiteFilter(e.target.value); setProjectPage(1); }}
              disabled={!salesProjectFilter}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <option value="">All Sites</option>
              {selectedProjectSites.map((s) => (
                <option key={s.id} value={s.id}>{s.siteNo}</option>
              ))}
            </select>
            <select
              value={salesStatusFilter}
              onChange={(e) => { setSalesStatusFilter(e.target.value); setProjectPage(1); }}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Site Status: All</option>
              {["Booked", "Sold"].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            {(salesFromDate || salesToDate || salesProjectFilter || salesSiteFilter || salesStatusFilter) && (
              <button
                onClick={() => { setSalesFromDate(""); setSalesToDate(""); setSalesProjectFilter(""); setSalesSiteFilter(""); setSalesStatusFilter(""); setProjectPage(1); }}
                className="flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-50"
              >
                <X size={12} /> Clear
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="px-3.5 py-3">Project No</th>
                <th className="px-3.5 py-3">Project Name</th>
                <th className="px-3.5 py-3">Booked Sites</th>
                <th className="px-3.5 py-3">Booked Date</th>
                <th className="px-3.5 py-3 text-right">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {paginatedProjectSales.length > 0 ? (
                paginatedProjectSales.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-3.5 py-3 font-mono font-medium text-indigo-600">{item.projectNo}</td>
                    <td className="px-3.5 py-3 font-medium text-slate-700">{item.projectName}</td>
                    <td className="px-3.5 py-3">
                      <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 text-xs font-medium px-2 py-0.5 rounded-md border border-indigo-100">
                        <MapPin size={11} /> {item.siteCount} sites
                      </span>
                    </td>
                    <td className="px-3.5 py-3 text-slate-900">
                      {item.lastDate ? formatDate(item.lastDate) : "—"}
                    </td>
                    <td className="px-3.5 py-3 text-right">
                      <button
                        onClick={() => {
                          const projSite = sites.find((s) => String(s.id) === String(item.id));
                          setViewProject({ item, stats: projSite ? projectStatsMap.get(projSite.id) : null, projSite });
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 px-2 py-1 rounded-lg transition-colors"
                        title="View project site stats"
                      >
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-400 text-sm">
                    No project sales found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        {projectSalesList.length > pageSize && (
          <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">
              Showing {((projectPage - 1) * pageSize) + 1}–{Math.min(projectPage * pageSize, projectSalesList.length)} of {projectSalesList.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setProjectPage((p) => Math.max(1, p - 1))}
                disabled={projectPage === 1}
                className="p-1 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="px-2 py-1 text-[11px] font-medium text-slate-600">
                Page {projectPage} / {projectPageCount}
              </span>
              <button
                onClick={() => setProjectPage((p) => Math.min(projectPageCount, p + 1))}
                disabled={projectPage === projectPageCount}
                className="p-1 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>

    {/* Recently Booked Customer Details Table */}
    <div className="card bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between">
      <div>
        <div className="p-5 border-b border-slate-100 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-slate-800 text-base flex items-center gap-2">
                <UserCheck size={18} className="text-indigo-600" /> Booked Customer Details
              </h3>
            </div>

            <div className="relative w-full sm:w-48">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search customer..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCustomerPage(1); }}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Date Range Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1 text-sm font-medium text-slate-500">
              <Filter size={14} /> Date Range:
            </span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => { setFromDate(e.target.value); setCustomerPage(1); }}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <span className="text-sm text-slate-400">to</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => { setToDate(e.target.value); setCustomerPage(1); }}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {(fromDate || toDate) && (
              <button
                onClick={() => { setFromDate(""); setToDate(""); setCustomerPage(1); }}
                className="flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-50"
              >
                <X size={12} /> Clear
              </button>
            )}
          </div>

          {/* Project / Site / User Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1 text-sm font-medium text-slate-500">
              <Filter size={14} /> Filters:
            </span>
            <select
              value={customerProjectFilter}
              onChange={(e) => { setCustomerProjectFilter(e.target.value); setCustomerSiteFilter(""); setCustomerPage(1); }}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Projects</option>
              {projectOptions.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <select
              value={customerSiteFilter}
              onChange={(e) => { setCustomerSiteFilter(e.target.value); setCustomerPage(1); }}
              disabled={!customerProjectFilter}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <option value="">All Sites</option>
              {customerSites.map((s) => (
                <option key={String(s.value)} value={s.value}>{s.label}</option>
              ))}
            </select>
            <select
              value={customerStatusFilter}
              onChange={(e) => { setCustomerStatusFilter(e.target.value); setCustomerPage(1); }}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Status</option>
              {["Booked", "Initial Payment", "Part Payment", "Full Payment", "Cancelled"].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <div className="w-44">
              <SearchableSelect
                value={customerCreatedByFilter}
                onChange={(v) => { setCustomerCreatedByFilter(v); setCustomerPage(1); }}
                options={createdByOptions}
                placeholder="User (Search)"
              />
            </div>
            {(customerProjectFilter || customerSiteFilter || customerCreatedByFilter || customerStatusFilter) && (
              <button
                onClick={() => { setCustomerProjectFilter(""); setCustomerSiteFilter(""); setCustomerCreatedByFilter(""); setCustomerStatusFilter(""); setCustomerPage(1); }}
                className="flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-50"
              >
                <X size={12} /> Clear
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="px-3.5 py-3">Booking ID</th>
                <th className="px-3.5 py-3">Customer Name</th>
                <th className="px-3.5 py-3">Mobile</th>
                <th className="px-3.5 py-3">Project / Site</th>
                <th className="px-3.5 py-3">Status</th>
                <th className="px-3.5 py-3">User</th>
                <th className="px-3.5 py-3 text-right">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {paginatedBookedCustomers.length > 0 ? (
                paginatedBookedCustomers.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Booking ID */}
                    <td className="px-3.5 py-3">
                      <span className="inline-flex items-center text-xs font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-lg font-mono">
                        {item.bookingId}
                      </span>
                    </td>

                    {/* Customer Name */}
                    <td className="px-3.5 py-3">
                      <div className="font-medium text-slate-800 text-sm">{item.customerName}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                        <Calendar size={11} /> {item.bookingDate}
                      </div>
                    </td>

                    {/* Mobile */}
                    <td className="px-3.5 py-3 text-slate-900 font-medium text-sm">{item.customerMobile}</td>

                    {/* Project / Site */}
                    <td className="px-3.5 py-3">
                      <div className="font-medium text-slate-700 text-sm">{item.projectSiteDisplay}</div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                        <MapPin size={11} className="text-indigo-400 flex-shrink-0" /> {item.location}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-3.5 py-3">
                      <StatusBadge status={item.status} />
                    </td>

                    {/* User */}
                    <td className="px-3.5 py-3">
                      <div className="font-medium text-slate-800 text-sm">{item.createdByName}</div>
                      {item.createdByEmpCode && <div className="text-xs text-slate-400 font-mono">{item.createdByEmpCode}</div>}
                    </td>

                    {/* View Button */}
                    <td className="px-3.5 py-3 text-right">
                      <button
                        onClick={() => setViewBooking(item)}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 px-2 py-1 rounded-lg transition-colors"
                      >
                        <Eye size={15} /> 
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400 text-xs">
                    No booked customers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {recentlyBookedCustomers.length > pageSize && (
          <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">
              Showing {((customerPage - 1) * pageSize) + 1}–{Math.min(customerPage * pageSize, recentlyBookedCustomers.length)} of {recentlyBookedCustomers.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCustomerPage((p) => Math.max(1, p - 1))}
                disabled={customerPage === 1}
                className="p-1 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="px-2 py-1 text-[11px] font-medium text-slate-600">
                Page {customerPage} / {customerPageCount}
              </span>
              <button
                onClick={() => setCustomerPage((p) => Math.min(customerPageCount, p + 1))}
                disabled={customerPage === customerPageCount}
                className="p-1 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>

      {/* ── Project Stats Modal ── */}
      {viewProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={() => setViewProject(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800 text-base flex items-center gap-2">
                <Building2 size={16} className="text-indigo-600" /> Project Site Details
              </h3>
              <button onClick={() => setViewProject(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4 overflow-y-auto">
              <div>
                <div className="text-xs font-semibold text-indigo-500 uppercase tracking-wider mb-1">Project</div>
                <div className="text-sm font-semibold text-slate-800">{viewProject.item.projectName}</div>
                <div className="text-xs text-slate-400 mt-0.5">{viewProject.projSite?.location || viewProject.item.projectNo}</div>
              </div>
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-blue-700">{viewProject.stats?.total ?? viewProject.projSite?.plots?.length ?? projectSites.length}</div>
                  <div className="text-[11px] font-medium text-blue-500 mt-0.5">Total Sites</div>
                </div>
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-amber-700">
                    {viewProject.stats?.booked ??
                      (viewProject.projSite?.plots?.filter((p) => p.status === "Booked").length ?? "—")}
                  </div>
                  <div className="text-[11px] font-medium text-amber-500 mt-0.5">Booked</div>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-emerald-700">
                    {viewProject.stats?.sold ??
                      (viewProject.projSite?.plots?.filter((p) => p.status === "Sold" || p.status === "Full Payment").length ?? "—")}
                  </div>
                  <div className="text-[11px] font-medium text-emerald-500 mt-0.5">Sold</div>
                </div>
                {viewProject.stats?.available !== undefined ? (
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
                    <div className="text-2xl font-bold text-slate-700">{viewProject.stats.available}</div>
                    <div className="text-[11px] font-medium text-slate-500 mt-0.5">Available</div>
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
                    <div className="text-2xl font-bold text-slate-700">—</div>
                    <div className="text-[11px] font-medium text-slate-500 mt-0.5">Available</div>
                  </div>
                )}
              </div>

              {/* All related sites details */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers size={14} className="text-indigo-600" /> All Sites Details
                  </h4>
                  <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">{projectSites.length} sites</span>
                </div>
                <div className="overflow-x-auto max-h-72 overflow-y-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                        <th className="px-3 py-2">S.No</th>
                        <th className="px-3 py-2">Site</th>
                        <th className="px-3 py-2">Facing</th>
                        <th className="px-3 py-2">East West</th>
                        <th className="px-3 py-2">North South</th>
                        <th className="px-3 py-2">Sqft</th>
                        <th className="px-3 py-2">Price/sqft</th>
                        <th className="px-3 py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {projectSites.length > 0 ? (
                        projectSites.map((p, idx) => (
                          <tr key={p.id ?? idx} className="hover:bg-slate-50/60 transition-colors">
                            <td className="px-3 py-2 text-slate-500 font-medium">{idx + 1}</td>
                            <td className="px-3 py-2 font-semibold text-slate-800">{p.siteNo}</td>
                            <td className="px-3 py-2 text-slate-600">{p.facing}</td>
                            <td className="px-3 py-2 text-slate-600">{p.eastWest ? `${p.eastWest} ft` : "-"}</td>
                            <td className="px-3 py-2 text-slate-600">{p.northSouth ? `${p.northSouth} ft` : "-"}</td>
                            <td className="px-3 py-2 font-medium text-slate-800">{Number(p.totalSqft || 0).toLocaleString("en-IN")}</td>
                            <td className="px-3 py-2 text-slate-600">{p.pricePerSqft ? formatINR(p.pricePerSqft) : "-"}</td>
                            <td className="px-3 py-2"><StatusBadge status={p.status || "Active"} /></td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={8} className="text-center py-6 text-slate-400 text-xs">No site details found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div className="px-6 py-3 border-t border-slate-100 flex justify-end">
              <button onClick={() => setViewProject(null)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* View Booking Details Modal */}
      {viewBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={() => setViewBooking(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl">
              <h3 className="font-semibold text-slate-800 text-base flex items-center gap-2">
               Booking Details
              </h3>
              <button
                onClick={() => setViewBooking(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-4 space-y-4">
              {/* Customer Section */}
              <div>
                <div className="text-[11px] font-semibold text-indigo-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <User size={12} /> Customer Information
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-[11px] font-medium text-slate-600">Name</div>
                    <div className="text-sm text-slate-900">{viewBooking.customerName}</div>
                  </div>
                  <div>
                    <div className="text-[11px] font-medium text-slate-600">Mobile</div>
                    <div className="text-sm text-slate-900">{viewBooking.customerMobile}</div>
                  </div>
                  <div>
                    <div className="text-[11px] font-medium text-slate-600">Email</div>
                    <div className="text-sm text-slate-900">{viewBooking.customerEmail || "N/A"}</div>
                  </div>
                  <div>
                    <div className="text-[11px] font-medium text-slate-600">Booking Date</div>
                    <div className="text-sm text-slate-900">{viewBooking.bookingDate}</div>
                  </div>
                </div>
              </div>

              {/* Property Section */}
              <div>
                <div className="text-[11px] font-semibold text-indigo-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Building2 size={12} /> Property Information
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-[11px] font-medium text-slate-600">Project / Site</div>
                    <div className="text-sm text-slate-900">{viewBooking.projectSiteDisplay}</div>
                  </div>
                  <div>
                    <div className="text-[11px] font-medium text-slate-600">Location</div>
                    <div className="text-sm text-slate-900">{viewBooking.location}</div>
                  </div>
                  <div>
                    <div className="text-[11px] font-medium text-slate-600">Plot Area</div>
                    <div className="text-sm text-slate-900">{viewBooking.plotArea} sq.ft</div>
                  </div>
                  <div>
                    <div className="text-[11px] font-medium text-slate-600">Payment Mode</div>
                    <div className="text-sm text-slate-900">{viewBooking.paymentMode}</div>
                  </div>
                </div>
              </div>

              {/* Financial Section */}
              <div>
                <div className="text-[11px] font-semibold text-emerald-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <IndianRupee size={12} /> Financial Details
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <div className="text-[11px] font-medium text-slate-600">Plot Price</div>
                    <div className="text-sm text-slate-900">{formatINR(viewBooking.plotPrice)}</div>
                  </div>
                  <div>
                    <div className="text-[11px] font-medium text-slate-600">Paid</div>
                    <div className="text-sm font-medium text-emerald-600">{formatINR(viewBooking.paidAmount)}</div>
                  </div>
                  <div>
                    <div className="text-[11px] font-medium text-slate-600">Balance</div>
                    <div className="text-sm font-medium text-amber-600">{formatINR(viewBooking.remainingAmount)}</div>
                  </div>
                </div>
                <div className="mt-3">
                  <StatusBadge status={viewBooking.status} />
                </div>
              </div>

              {/* Cancellation / Refund Section */}
              {viewBooking.status === "Cancelled" && (
                <div>
                  <div className="text-[11px] font-semibold text-red-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <XCircle size={12} /> Cancellation Details
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-[11px] font-medium text-slate-600">Refund Amount</div>
                      <div className="text-sm font-medium text-red-600">{formatINR(viewBooking.refundAmount)}</div>
                    </div>
                    <div>
                      <div className="text-[11px] font-medium text-slate-600">Cancellation Reason</div>
                      <div className="text-sm text-slate-900">{viewBooking.cancellationReason || "—"}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* User Section */}
              <div>
                <div className="text-[11px] font-semibold text-indigo-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <UserCheck size={12} /> User
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-slate-900">{viewBooking.createdByName}</span>
                  <UserRoleBadge role={viewBooking.createdByRole} />
                  <span className="text-xs font-medium text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-lg">
                    {viewBooking.createdByEmpCode}
                  </span>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setViewBooking(null)}
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
