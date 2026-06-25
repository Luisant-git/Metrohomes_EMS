import { useState } from "react";
import { Trophy, Download, Medal, Star, Crown } from "lucide-react";
import toast from "react-hot-toast";

const ACHIEVERS = [
  { rank: 1, name: "Priya Sen", role: "Sales Manager", branch: "Mumbai HQ", sales: 14, revenue: 308000000, points: 1400, credits: 28000, badge: "🥇 Gold Achiever" },
  { rank: 2, name: "Anjali Verma", role: "Sales Manager", branch: "Delhi HQ", sales: 12, revenue: 264000000, points: 1200, credits: 24000, badge: "🥈 Silver Achiever" },
  { rank: 3, name: "Neha Mishra", role: "Sales Manager", branch: "Bangalore", sales: 11, revenue: 242000000, points: 1100, credits: 22000, badge: "🥉 Bronze Achiever" },
  { rank: 4, name: "Rahul Das", role: "Sales Manager", branch: "Hyderabad", sales: 9, revenue: 198000000, points: 900, credits: 18000, badge: "⭐ Star Performer" },
  { rank: 5, name: "Arun Kumar", role: "Sales Manager", branch: "Chennai", sales: 7, revenue: 154000000, points: 700, credits: 14000, badge: "✨ Rising Star" },
];

const MONTHS = ["January 2024", "February 2024", "March 2024", "April 2024", "May 2024", "June 2024"];

export default function AchieversReport() {
  const [month, setMonth] = useState("April 2024");

  const handleDownloadPDF = () => {
    toast.success("Achievers Report PDF downloaded! 📄");
  };

  const top3 = ACHIEVERS.slice(0, 3);
  const rest = ACHIEVERS.slice(3);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2"><Trophy size={22} className="text-yellow-500" />Achievers Report</h1>
          <p className="text-gray-400 text-sm mt-0.5">Monthly performance ranking & rewards</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={month} onChange={e => setMonth(e.target.value)} className="input-field w-44">
            {MONTHS.map(m => <option key={m}>{m}</option>)}
          </select>
          <button onClick={handleDownloadPDF} className="btn-primary">
            <Download size={16} />Download PDF
          </button>
        </div>
      </div>

      {/* Month banner */}
      <div className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 rounded-2xl p-6 text-white text-center shadow-lg">
        <div className="mb-2"><Trophy size={40} className="text-white drop-shadow" /></div>
        <h2 className="text-2xl font-extrabold">{month} Achievers</h2>
        <p className="text-yellow-100 text-sm mt-1">Top performers recognition & rewards</p>
      </div>

      {/* Podium */}
      <div className="grid grid-cols-3 gap-4">
        {/* 2nd place */}
        <div className="card p-5 text-center border-2 border-gray-200 relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gray-300 text-gray-700 rounded-full px-3 py-0.5 text-xs font-bold">2nd</div>
          <div className="text-4xl mb-2">🥈</div>
          <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xl font-bold mx-auto mb-2">{top3[1].name.charAt(0)}</div>
          <div className="font-bold text-gray-800">{top3[1].name}</div>
          <div className="text-xs text-gray-400">{top3[1].branch}</div>
          <div className="mt-3 space-y-1">
            <div className="text-lg font-extrabold text-blue-600">{top3[1].sales} Sales</div>
            <div className="text-xs text-gray-500">{top3[1].points} pts · {top3[1].credits.toLocaleString("en-IN")} credits</div>
          </div>
        </div>

        {/* 1st place */}
        <div className="card p-5 text-center border-2 border-yellow-400 relative bg-gradient-to-b from-yellow-50 to-white shadow-lg">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-400 text-white rounded-full px-4 py-1 text-xs font-bold flex items-center gap-1"><Crown size={12} />Champion</div>
          <div className="text-5xl mb-2">🥇</div>
          <div className="w-16 h-16 rounded-full bg-yellow-200 flex items-center justify-center text-yellow-700 text-2xl font-bold mx-auto mb-2">{top3[0].name.charAt(0)}</div>
          <div className="font-extrabold text-gray-900 text-lg">{top3[0].name}</div>
          <div className="text-xs text-gray-400">{top3[0].branch}</div>
          <div className="mt-3 space-y-1">
            <div className="text-2xl font-extrabold text-yellow-600">{top3[0].sales} Sales</div>
            <div className="text-sm font-semibold text-green-600">₹{(top3[0].revenue / 10000000).toFixed(1)} Cr</div>
            <div className="text-xs text-gray-500">{top3[0].points} pts · {top3[0].credits.toLocaleString("en-IN")} credits</div>
          </div>
          <span className="inline-block mt-2 bg-yellow-100 text-yellow-700 text-xs font-bold px-2.5 py-1 rounded-full">{top3[0].badge}</span>
        </div>

        {/* 3rd place */}
        <div className="card p-5 text-center border-2 border-orange-200 relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-300 text-orange-800 rounded-full px-3 py-0.5 text-xs font-bold">3rd</div>
          <div className="text-4xl mb-2">🥉</div>
          <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 text-xl font-bold mx-auto mb-2">{top3[2].name.charAt(0)}</div>
          <div className="font-bold text-gray-800">{top3[2].name}</div>
          <div className="text-xs text-gray-400">{top3[2].branch}</div>
          <div className="mt-3 space-y-1">
            <div className="text-lg font-extrabold text-orange-600">{top3[2].sales} Sales</div>
            <div className="text-xs text-gray-500">{top3[2].points} pts · {top3[2].credits.toLocaleString("en-IN")} credits</div>
          </div>
        </div>
      </div>

      {/* Full ranking table */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-800">Complete Rankings</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {["Rank", "Sales Manager", "Branch", "Sales", "Revenue", "Points", "Credits", "Badge"].map(h => (
                <th key={h} className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {ACHIEVERS.map(a => (
              <tr key={a.rank} className={`hover:bg-gray-50/50 ${a.rank <= 3 ? "bg-yellow-50/30" : ""}`}>
                <td className="px-5 py-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-extrabold ${a.rank === 1 ? "bg-yellow-100 text-yellow-700" : a.rank === 2 ? "bg-gray-100 text-gray-600" : a.rank === 3 ? "bg-orange-100 text-orange-700" : "bg-gray-50 text-gray-400"}`}>
                    {a.rank}
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-sm font-bold">{a.name.charAt(0)}</div>
                    <div className="font-semibold text-sm text-gray-800">{a.name}</div>
                  </div>
                </td>
                <td className="px-5 py-4 text-sm text-gray-500">{a.branch}</td>
                <td className="px-5 py-4 text-sm font-bold text-blue-600">{a.sales}</td>
                <td className="px-5 py-4 text-sm font-semibold text-green-600">₹{(a.revenue / 10000000).toFixed(1)}Cr</td>
                <td className="px-5 py-4 text-sm font-bold text-purple-600">{a.points}</td>
                <td className="px-5 py-4 text-sm text-gray-700">{a.credits.toLocaleString("en-IN")}</td>
                <td className="px-5 py-4 text-xs font-semibold">{a.badge}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Points system */}
      <div className="card p-5">
        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Star size={18} className="text-yellow-500" />Points & Credits System</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { action: "Per Sale Closed", points: 100, credits: 2000 },
            { action: "Monthly Target Met", points: 200, credits: 5000 },
            { action: "Site Visit Done", points: 10, credits: 200 },
            { action: "Customer Registered", points: 20, credits: 500 },
          ].map(p => (
            <div key={p.action} className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-3 text-center">
              <div className="text-sm font-semibold text-gray-700 mb-2">{p.action}</div>
              <div className="text-lg font-extrabold text-blue-600">+{p.points} pts</div>
              <div className="text-xs text-purple-600 font-semibold">+{p.credits.toLocaleString("en-IN")} credits</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
