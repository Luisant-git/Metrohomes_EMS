import { useState, useMemo } from "react";
import { Trophy, Download, Medal, Star, Crown, Calendar, Award, CheckCircle, FileSpreadsheet } from "lucide-react";
import { toast } from "react-toastify";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// ── Rich 2026 Mock Database ──
const AGENTS = [
  { id: 1, name: "Priya Sen", role: "Sales Manager", avatar: "PS" },
  { id: 2, name: "Anjali Verma", role: "Sales Manager", avatar: "AV" },
  { id: 3, name: "Neha Mishra", role: "Sales Manager", avatar: "NM" },
  { id: 4, name: "Rahul Das", role: "Sales Manager", avatar: "RD" },
  { id: 5, name: "Arun Kumar", role: "Sales Manager", avatar: "AK" },
  { id: 6, name: "Sanjay Singhal", role: "Sales Executive", avatar: "SS" },
  { id: 7, name: "Vikram Malhotra", role: "Sales Manager", avatar: "VM" },
  { id: 8, name: "Pooja Hegde", role: "Sales Executive", avatar: "PH" },
];

const SALES_RECORDS = [
  // Priya Sen (14 sales)
  { agentId: 1, date: "2026-01-15" },
  { agentId: 1, date: "2026-01-28" },
  { agentId: 1, date: "2026-02-12" },
  { agentId: 1, date: "2026-02-25" },
  { agentId: 1, date: "2026-03-10" },
  { agentId: 1, date: "2026-04-05" },
  { agentId: 1, date: "2026-04-20" },
  { agentId: 1, date: "2026-05-08" },
  { agentId: 1, date: "2026-05-22" },
  { agentId: 1, date: "2026-06-11" },
  { agentId: 1, date: "2026-06-25" },
  { agentId: 1, date: "2026-07-02" },
  { agentId: 1, date: "2026-07-14" },
  { agentId: 1, date: "2026-07-20" },

  // Anjali Verma (12 sales)
  { agentId: 2, date: "2026-01-18" },
  { agentId: 2, date: "2026-02-15" },
  { agentId: 2, date: "2026-02-28" },
  { agentId: 2, date: "2026-03-15" },
  { agentId: 2, date: "2026-03-29" },
  { agentId: 2, date: "2026-04-10" },
  { agentId: 2, date: "2026-05-05" },
  { agentId: 2, date: "2026-05-20" },
  { agentId: 2, date: "2026-06-08" },
  { agentId: 2, date: "2026-06-22" },
  { agentId: 2, date: "2026-07-05" },
  { agentId: 2, date: "2026-07-19" },

  // Neha Mishra (11 sales)
  { agentId: 3, date: "2026-01-20" },
  { agentId: 3, date: "2026-02-18" },
  { agentId: 3, date: "2026-03-12" },
  { agentId: 3, date: "2026-03-25" },
  { agentId: 3, date: "2026-04-15" },
  { agentId: 3, date: "2026-05-12" },
  { agentId: 3, date: "2026-05-28" },
  { agentId: 3, date: "2026-06-15" },
  { agentId: 3, date: "2026-06-30" },
  { agentId: 3, date: "2026-07-10" },
  { agentId: 3, date: "2026-07-18" },

  // Rahul Das (9 sales)
  { agentId: 4, date: "2026-01-25" },
  { agentId: 4, date: "2026-02-20" },
  { agentId: 4, date: "2026-03-18" },
  { agentId: 4, date: "2026-04-18" },
  { agentId: 4, date: "2026-05-15" },
  { agentId: 4, date: "2026-06-10" },
  { agentId: 4, date: "2026-06-28" },
  { agentId: 4, date: "2026-07-08" },
  { agentId: 4, date: "2026-07-16" },

  // Arun Kumar (7 sales)
  { agentId: 5, date: "2026-01-30" },
  { agentId: 5, date: "2026-02-22" },
  { agentId: 5, date: "2026-03-22" },
  { agentId: 5, date: "2026-04-22" },
  { agentId: 5, date: "2026-05-25" },
  { agentId: 5, date: "2026-06-18" },
  { agentId: 5, date: "2026-07-12" },

  // Sanjay Singhal (6 sales)
  { agentId: 6, date: "2026-01-05" },
  { agentId: 6, date: "2026-02-08" },
  { agentId: 6, date: "2026-03-12" },
  { agentId: 6, date: "2026-04-14" },
  { agentId: 6, date: "2026-05-19" },
  { agentId: 6, date: "2026-06-24" },

  // Vikram Malhotra (5 sales)
  { agentId: 7, date: "2026-02-14" },
  { agentId: 7, date: "2026-03-24" },
  { agentId: 7, date: "2026-04-28" },
  { agentId: 7, date: "2026-05-30" },
  { agentId: 7, date: "2026-07-05" },

  // Pooja Hegde (5 sales)
  { agentId: 8, date: "2026-03-01" },
  { agentId: 8, date: "2026-04-02" },
  { agentId: 8, date: "2026-05-03" },
  { agentId: 8, date: "2026-06-04" },
  { agentId: 8, date: "2026-07-05" },
];

export default function AchieversReport() {
  // ── States ──
  const [startDate, setStartDate] = useState("2026-01-01");
  const [endDate, setEndDate] = useState("2026-07-31");
  const [isExporting, setIsExporting] = useState(false);

  // ── Dynamic Filter & Aggregate Logic ──
  const calculatedAchievers = useMemo(() => {
    // 1. Filter sales records in selected date range
    const recordsInRange = SALES_RECORDS.filter(
      (r) => r.date >= startDate && r.date <= endDate
    );

    // 2. Aggregate sales count by agent
    const agentMap = {};
    AGENTS.forEach((agent) => {
      agentMap[agent.id] = {
        ...agent,
        sales: 0,
      };
    });

    recordsInRange.forEach((record) => {
      if (agentMap[record.agentId]) {
        agentMap[record.agentId].sales += 1;
      }
    });

    // 3. Convert to array and assign ranks/badges
    const rawList = Object.values(agentMap);
    
    // Sort by sales descending
    rawList.sort((a, b) => b.sales - a.sales);

    // Assign rank and badge names
    return rawList
      .map((item, idx) => {
        const rank = idx + 1;
        let badge = "✨ Rising Star";
        if (item.sales === 0) {
          badge = "💤 No Activity";
        } else if (rank === 1) {
          badge = "🥇 Gold Champion";
        } else if (rank === 2) {
          badge = "🥈 Silver Achiever";
        } else if (rank === 3) {
          badge = "🥉 Bronze Achiever";
        } else if (item.sales >= 8) {
          badge = "⭐ Star Performer";
        }

        return {
          ...item,
          rank,
          badge,
        };
      })
      .filter((a) => a.sales > 0); // Only list active agents
  }, [startDate, endDate]);

  // ── Date Preset Handler ──
  const applyPreset = (preset) => {
    switch (preset) {
      case "FY26":
        setStartDate("2026-01-01");
        setEndDate("2026-12-31");
        break;
      case "Q1":
        setStartDate("2026-01-01");
        setEndDate("2026-03-31");
        break;
      case "Q2":
        setStartDate("2026-04-01");
        setEndDate("2026-06-30");
        break;
      case "Q3":
        setStartDate("2026-07-01");
        setEndDate("2026-09-30");
        break;
      case "JULY":
        setStartDate("2026-07-01");
        setEndDate("2026-07-31");
        break;
      default:
        break;
    }
    toast.info(`Applied Preset: ${preset}`);
  };

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
  const handleDownloadPDF = async () => {
    const element = document.getElementById("achievers-report-print-area");
    if (!element) return;
    setIsExporting(true);
    const toastId = toast.loading("Generating PDF Report...");

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#f9fafb",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const formattedStart = startDate.replaceAll("-", "");
      const formattedEnd = endDate.replaceAll("-", "");
      pdf.save(`Achievers_Report_${formattedStart}_${formattedEnd}.pdf`);
      
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
    csvContent += "Rank,Name,Role,Sales,Badge\n";
    calculatedAchievers.forEach((a) => {
      csvContent += `${a.rank},"${a.name}","${a.role}",${a.sales},"${a.badge}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Achievers_Report_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV spreadsheet exported successfully! 📊");
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
            Realestate ERP Performance Dashboard • Year 2026
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

      {/* ── Interactive Date Range Filters Panel ── */}
      <div className="card p-5 bg-white border border-gray-100 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            2026 Range Presets:
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: "FY26", label: "Full Year 2026" },
              { id: "Q1", label: "Q1 (Jan-Mar)" },
              { id: "Q2", label: "Q2 (Apr-Jun)" },
              { id: "Q3", label: "Q3 (Jul-Sep)" },
              { id: "JULY", label: "July 2026" },
            ].map((p) => {
              const isSelected =
                (p.id === "FY26" && startDate === "2026-01-01" && endDate === "2026-12-31") ||
                (p.id === "Q1" && startDate === "2026-01-01" && endDate === "2026-03-31") ||
                (p.id === "Q2" && startDate === "2026-04-01" && endDate === "2026-06-30") ||
                (p.id === "Q3" && startDate === "2026-07-01" && endDate === "2026-09-30") ||
                (p.id === "JULY" && startDate === "2026-07-01" && endDate === "2026-07-31");

              return (
                <button
                  key={p.id}
                  onClick={() => applyPreset(p.id)}
                  className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${
                    isSelected
                      ? "bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-200"
                      : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom date range controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-50">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1 mb-1.5">
              <Calendar size={12} className="text-blue-500" /> Start Date
            </label>
            <input
              type="date"
              value={startDate}
              min="2026-01-01"
              max="2026-12-31"
              onChange={(e) => setStartDate(e.target.value)}
              className="input-field py-2 text-xs"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1 mb-1.5">
              <Calendar size={12} className="text-blue-500" /> End Date
            </label>
            <input
              type="date"
              value={endDate}
              min="2026-01-01"
              max="2026-12-31"
              onChange={(e) => setEndDate(e.target.value)}
              className="input-field py-2 text-xs"
            />
          </div>
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
                Showing results from {new Date(startDate).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })} to {new Date(endDate).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })}
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
              <div className="text-lg font-bold text-gray-800 mt-0.5">{summaryMetrics.totalSales} units</div>
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
                {summaryMetrics.gold ? `${summaryMetrics.gold.sales} units` : "0 units"}
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
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-slate-200 to-slate-100 border-2 border-white flex items-center justify-center font-bold text-lg text-slate-700 shadow-md transition-transform duration-300 group-hover:scale-105">
                    {summaryMetrics.silver.avatar}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-slate-300 text-slate-800 border border-white flex items-center justify-center text-xs font-black shadow-sm">
                    🥈
                  </div>
                </div>
                
                {/* Pedestal */}
                <div className="w-full h-24 bg-gradient-to-b from-slate-100 to-slate-50 border border-slate-200 border-b-0 rounded-t-2xl flex flex-col items-center justify-center p-3 shadow-[0_-4px_12px_rgba(148,163,184,0.04)]">
                  <div className="text-2xl font-black text-slate-400">2</div>
                  <div className="text-xs font-bold text-slate-700 mt-0.5">{summaryMetrics.silver.sales} units</div>
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
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-200 to-yellow-100 border-4 border-amber-300 flex items-center justify-center font-black text-2xl text-amber-800 shadow-lg transition-transform duration-300 group-hover:scale-105">
                    {summaryMetrics.gold.avatar}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-amber-400 text-white border-2 border-white flex items-center justify-center text-xs font-black shadow-md">
                    🥇
                  </div>
                </div>

                {/* Pedestal */}
                <div className="w-full h-32 bg-gradient-to-b from-amber-100 to-amber-50/50 border-2 border-amber-300 border-b-0 rounded-t-2xl flex flex-col items-center justify-center p-3 shadow-[0_-6px_20px_rgba(245,158,11,0.08)] relative">
                  <div className="text-3xl font-black text-amber-500">1</div>
                  <div className="text-sm font-bold text-amber-700 mt-0.5">{summaryMetrics.gold.sales} units</div>
                  <span className="absolute bottom-2 text-[8px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white uppercase tracking-wider scale-90">
                    {summaryMetrics.gold.badge}
                  </span>
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
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-100 to-amber-50 border-2 border-white flex items-center justify-center font-bold text-lg text-orange-950/80 shadow-md transition-transform duration-300 group-hover:scale-105">
                    {summaryMetrics.bronze.avatar}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-orange-300 text-orange-850 border border-white flex items-center justify-center text-xs font-black shadow-sm">
                    🥉
                  </div>
                </div>

                {/* Pedestal */}
                <div className="w-full h-18 bg-gradient-to-b from-orange-100/50 to-orange-50/20 border border-orange-200/60 border-b-0 rounded-t-2xl flex flex-col items-center justify-center p-3 shadow-[0_-4px_12px_rgba(234,88,12,0.02)]">
                  <div className="text-xl font-black text-orange-400/80">3</div>
                  <div className="text-xs font-bold text-orange-850/80 mt-0.5">{summaryMetrics.bronze.sales} units</div>
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

        {/* ── Complete Rankings Table (Redesigned to be Ultra Clean) ── */}
        <div className="card overflow-hidden bg-white border border-gray-100 shadow-sm rounded-2xl">
          <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-gray-800 text-sm">Leaderboard Rankings</h3>
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
                <tr className="bg-gray-50/40 border-b border-gray-100">
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider w-20">
                    Rank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Sales Manager
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-gray-400 uppercase tracking-wider w-44">
                    Sales Closed
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-gray-400 uppercase tracking-wider w-48">
                    Badge Awarded
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {calculatedAchievers.length > 0 ? (
                  calculatedAchievers.map((a) => {
                    const rankBadge =
                      a.rank === 1
                        ? "bg-amber-100 text-amber-800"
                        : a.rank === 2
                        ? "bg-slate-100 text-slate-800"
                        : a.rank === 3
                        ? "bg-orange-50 text-orange-850"
                        : "bg-gray-50 text-gray-400";

                    return (
                      <tr key={a.id} className="hover:bg-gray-50/20 transition-all">
                        {/* Rank */}
                        <td className="px-6 py-3.5">
                          <div className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${rankBadge}`}>
                            {a.rank}
                          </div>
                        </td>

                        {/* Name & Avatar */}
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold">
                              {a.avatar}
                            </div>
                            <div>
                              <div className="font-semibold text-sm text-gray-800">
                                {a.name}
                              </div>
                              <div className="text-[10px] text-gray-400">{a.role}</div>
                            </div>
                          </div>
                        </td>

                        {/* Sales units */}
                        <td className="px-6 py-3.5 text-center">
                          <span className="inline-flex items-center justify-center px-2.5 py-1 text-xs font-bold text-blue-700 bg-blue-50/70 border border-blue-100/50 rounded-lg">
                            {a.sales} units
                          </span>
                        </td>

                        {/* Badge Awarded */}
                        <td className="px-6 py-3.5 text-center">
                          <span
                            className={`inline-block text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${
                              a.rank === 1
                                ? "bg-amber-100 text-amber-800"
                                : a.rank === 2
                                ? "bg-slate-100 text-slate-800"
                                : a.rank === 3
                                ? "bg-orange-50 text-orange-800"
                                : "bg-gray-50 text-gray-500"
                            }`}
                          >
                            {a.badge}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                      No active achiever records found in selected criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}