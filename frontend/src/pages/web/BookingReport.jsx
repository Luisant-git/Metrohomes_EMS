import { useState, useMemo } from "react";
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
  X,
  Filter,
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
  const pageSize = 5;

  // User Map for quick fallback resolution of Created User (role, name, employeeCode)
  const userMap = useMemo(() => {
    const map = new Map();
    users.forEach((u) => {
      map.set(u.id, u);
    });
    return map;
  }, [users]);

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

    const fullPaymentCount = bookings.filter(
      (b) => b.status === "Full Payment" || b.remainingAmount === 0
    ).length;
    const partPaymentCount = bookings.filter(
      (b) => b.status === "Part Payment" || (b.paidAmount > 0 && b.remainingAmount > 0)
    ).length;
    const initialPaymentCount = bookings.filter(
      (b) => b.status === "Initial Payment" || b.status === "Booked"
    ).length;

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

  // Project Sales Section Data - Booked Projects Alone (Project No, Project Name, Site No, Facing, Feet, Total Sqft)
  const projectSalesList = useMemo(() => {
    // Collect booked project sales directly from bookings & booked sites
    const list = bookings.map((b) => {
      const pId = b.projectId || 1;
      const projectNo = b.projectNo || `PRJ-${String(pId).padStart(3, "0")}`;
      const projectName = b.projectName || b.project?.name || `Project #${pId}`;
      const siteNo = b.siteNo ? `Site ${b.siteNo}` : (b.site?.siteNo ? `Site ${b.site.siteNo}` : "Site 1");

      const siteObj = sites.find((s) => s.id === b.siteId) || b.site || {};
      const facing = siteObj.facing || b.site?.facing || "East";
      const feet =
        siteObj.eastWest && siteObj.northSouth
          ? `${siteObj.eastWest} x ${siteObj.northSouth}`
          : b.site?.eastWest && b.site?.northSouth
            ? `${b.site.eastWest} x ${b.site.northSouth}`
            : "30 x 40";
      const totalSqft = b.plotArea || siteObj.totalSqft || b.site?.totalSqft || 1200;
      const status = b.status || siteObj.status || "Booked";

      return {
        id: b.id,
        projectNo,
        projectName,
        siteNo,
        facing,
        feet,
        totalSqft,
        status,
        pricePerSqft: b.pricePerSqft || siteObj.pricePerSqft || 0,
      };
    });

    // Fallback: if bookings array is empty, include non-Available (booked/sold) sites
    if (list.length === 0) {
      sites
        .filter((s) => s.status && s.status !== "Available")
        .forEach((s) => {
          const pId = s.projectId || 1;
          list.push({
            id: s.id,
            projectNo: s.projectNo || `PRJ-${String(pId).padStart(3, "0")}`,
            projectName: s.project?.name || s.projectName || `Project #${pId}`,
            siteNo: s.siteNo ? `Site ${s.siteNo}` : "Site 1",
            facing: s.facing || "N/A",
            feet:
              s.eastWest && s.northSouth
                ? `${s.eastWest} x ${s.northSouth}`
                : "N/A",
            totalSqft: s.totalSqft || 0,
            status: s.status || "Booked",
            pricePerSqft: s.pricePerSqft || 0,
          });
        });
    }

    return list.filter((item) => {
      if (!projectSearch) return true;
      const q = projectSearch.toLowerCase();
      return (
        item.projectNo.toLowerCase().includes(q) ||
        item.projectName.toLowerCase().includes(q) ||
        item.siteNo.toLowerCase().includes(q) ||
        item.facing.toLowerCase().includes(q)
      );
    });
  }, [bookings, sites, projectSearch]);

  // Recently Booked Customer Details List with Created User details
  const recentlyBookedCustomers = useMemo(() => {
    const result = bookings.map((b) => {
      const cust = customers.find((c) => c.id === b.customerId) || b.customer || {};

      const creatorId = b.createdById || b.createdBy || cust.createdById || cust.createdBy;
      const creatorFromMap = creatorId ? userMap.get(creatorId) : null;

      const createdByName =
        b.creatorName ||
        b.creator?.name ||
        b.createdUser?.name ||
        cust.createdByName ||
        cust.createdUser?.name ||
        cust.user?.name ||
        creatorFromMap?.name ||
        "System Admin";

      const createdByRole =
        b.creatorRole ||
        b.creator?.role ||
        b.createdUser?.role ||
        cust.createdByRole ||
        cust.createdUser?.role ||
        creatorFromMap?.role ||
        "Admin";

      const createdByEmpCode =
        b.creatorEmployeeCode ||
        b.creator?.employeeCode ||
        b.createdUser?.employeeCode ||
        cust.createdByEmployeeCode ||
        cust.createdByEmployeeCode ||
        cust.createdUser?.employeeCode ||
        creatorFromMap?.employeeCode ||
        (creatorId ? `EMP${String(creatorId).padStart(3, "0")}` : "SYS-001");

      const siteObj = sites.find((s) => s.id === b.siteId) || b.site || {};
      const projectName = b.projectName || b.project?.name || siteObj.project?.name || "Standard Project";
      const siteNo = b.siteNo || b.site?.siteNo || siteObj.siteNo || "N/A";
      const projectSiteDisplay = siteNo && siteNo !== "N/A" ? `${projectName} - Site ${siteNo}` : projectName;
      const location = b.location || b.project?.location || siteObj.project?.location || siteObj.location || "Prime Location";

      return {
        id: b.id,
        bookingDate: b.bookingDate || (b.createdAt ? new Date(b.createdAt).toLocaleDateString("en-IN") : "Recent"),
        customerName: b.customerName || cust.name || "N/A",
        customerMobile: cust.mobile || cust.phone || b.customerPhone || "N/A",
        customerEmail: cust.email || b.customerEmail || "",
        projectName,
        siteNo,
        projectSiteDisplay,
        location,
        plotArea: b.plotArea || b.site?.totalSqft || 0,
        plotPrice: b.plotPrice || 0,
        paidAmount: b.paidAmount || 0,
        remainingAmount: b.remainingAmount ?? (b.plotPrice ? b.plotPrice - (b.paidAmount || 0) : 0),
        status: b.status || "Booked",
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
  }, [bookings, customers, userMap, selectedFilter, searchTerm, fromDate, toDate]);

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
      
          
          <h1 className="text-2xl sm:text-3xl font- tracking-tight text-slate-800 flex items-center gap-3">
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

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 w-full">
        <StatCard
          icon={Building2}
          label="Total Project"
          value={stats.totalProjects}
          color="blue"
        />
        <StatCard
          icon={MapPin}
          label="Total Site"
          value={stats.totalSites}
          color="orange"
        />
        <StatCard
          icon={Users}
          label="Total Customer"
          value={stats.totalCustomers}
          color="purple"
        />
        <StatCard
          icon={UserCheck}
          label="Booked Customer"
          value={stats.bookedCustomers}
          color="yellow"
        />
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
            <span className="text-xl font-bold text-slate-800">{bookings.length}</span>
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
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="px-3.5 py-3">Project No</th>
                <th className="px-3.5 py-3">Project Name</th>
                <th className="px-3.5 py-3">Site No</th>
                <th className="px-3.5 py-3">Facing</th>
                <th className="px-3.5 py-3">Feet</th>
                <th className="px-3.5 py-3">Total Sqft</th>
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
                        <MapPin size={11} /> {item.siteNo}
                      </span>
                    </td>
                    <td className="px-3.5 py-3 text-slate-600">{item.facing}</td>
                    <td className="px-3.5 py-3 text-slate-500">{item.feet}</td>
                    <td className="px-3.5 py-3 font-medium text-slate-800">{item.totalSqft} sq.ft</td>
                    <td className="px-3.5 py-3 text-right">
                      <button
                        onClick={() => {
                          const projSite = sites.find((s) => s.id === item.projectId || s.name === item.projectName);
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
                  <td colSpan={8} className="text-center py-8 text-slate-400 text-sm">
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
            <span className="flex items-center gap-1 text-[11px] font-medium text-slate-500">
              <Filter size={12} /> Date Range:
            </span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => { setFromDate(e.target.value); setCustomerPage(1); }}
              className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <span className="text-[11px] text-slate-400">to</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => { setToDate(e.target.value); setCustomerPage(1); }}
              className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {(fromDate || toDate) && (
              <button
                onClick={() => { setFromDate(""); setToDate(""); setCustomerPage(1); }}
                className="flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-red-500 px-2 py-1 rounded-lg hover:bg-red-50"
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
                <th className="px-3.5 py-3">Customer Name</th>
                <th className="px-3.5 py-3">Mobile</th>
                <th className="px-3.5 py-3">Project / Site</th>
                <th className="px-3.5 py-3">Created By</th>
                <th className="px-3.5 py-3">Created ID</th>
                <th className="px-3.5 py-3 text-right">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {paginatedBookedCustomers.length > 0 ? (
                paginatedBookedCustomers.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Customer Name */}
                    <td className="px-3.5 py-3">
                      <div className="font-medium text-slate-800 text-sm">{item.customerName}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                        <Calendar size={11} /> {item.bookingDate}
                      </div>
                    </td>

                    {/* Mobile */}
                    <td className="px-3.5 py-3 text-slate-600 text-sm">{item.customerMobile}</td>

                    {/* Project / Site */}
                    <td className="px-3.5 py-3">
                      <div className="font-medium text-slate-700 text-sm">{item.projectSiteDisplay}</div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                        <MapPin size={11} className="text-indigo-400 flex-shrink-0" /> {item.location}
                      </div>
                    </td>

                    {/* Created By */}
                    <td className="px-3.5 py-3">
                      <div className="font-medium text-slate-800 text-sm">{item.createdByName}</div>
                    </td>

                    {/* Created ID */}
                    <td className="px-3.5 py-3">
                      <span className="inline-flex items-center text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-lg">
                        {item.createdByEmpCode}
                      </span>
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
                  <td colSpan={6} className="text-center py-8 text-slate-400 text-xs">
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
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800 text-base flex items-center gap-2">
                <Building2 size={16} className="text-indigo-600" /> Project Site Stats
              </h3>
              <button onClick={() => setViewProject(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <div className="text-xs font-semibold text-indigo-500 uppercase tracking-wider mb-1">Project</div>
                <div className="text-sm font-semibold text-slate-800">{viewProject.item.projectName}</div>
                <div className="text-xs text-slate-400 mt-0.5">{viewProject.projSite?.location || viewProject.item.projectNo}</div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-blue-700">{viewProject.stats?.total ?? viewProject.projSite?.plots?.length ?? "—"}</div>
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
              </div>
              {viewProject.stats?.available !== undefined && (
                <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">Available Sites</span>
                  <span className="text-sm font-bold text-slate-700">{viewProject.stats.available}</span>
                </div>
              )}
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

              {/* Created By Section */}
              <div>
                <div className="text-[11px] font-semibold text-indigo-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <UserCheck size={12} /> Created By
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
