 import { TrendingUp, TrendingDown } from "lucide-react";

export default function StatCard({ icon: Icon, label, value, change, changeType = "up", color = "blue", prefix = "", suffix = "" }) {
  const colorMap = {
    blue: { bg: "bg-blue-50", icon: "text-blue-600", ring: "ring-blue-100" },
    teal: { bg: "bg-teal-50", icon: "text-teal-600", ring: "ring-teal-100" },
    green: { bg: "bg-emerald-50", icon: "text-emerald-600", ring: "ring-emerald-100" },
    purple: { bg: "bg-purple-50", icon: "text-purple-600", ring: "ring-purple-100" },
    orange: { bg: "bg-orange-50", icon: "text-orange-600", ring: "ring-orange-100" },
    red: { bg: "bg-red-50", icon: "text-red-600", ring: "ring-red-100" },
    yellow: { bg: "bg-yellow-50", icon: "text-yellow-600", ring: "ring-yellow-100" },
  };
  const c = colorMap[color] || colorMap.blue;

  return (
    <div className="card p-3 sm:p-4 lg:p-5 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between mb-2 sm:mb-3 lg:mb-4">
        <div className={`w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-xl sm:rounded-2xl flex-shrink-0 ${c.bg} ring-1 ${c.ring} flex items-center justify-center`}>
          <Icon size={16} className={c.icon} />
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-[10px] sm:text-xs font-semibold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg ${changeType === "up" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}>
            {changeType === "up" ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {change}%
          </div>
        )}
      </div>
      <div className="text-sm sm:text-lg lg:text-2xl font-semibold text-gray-900 mb-0.5 truncate">
        {prefix}{typeof value === "number" ? value.toLocaleString("en-IN") : value}{suffix}
      </div>
      <div className="text-[10px] sm:text-xs lg:text-sm text-gray-400 font-medium truncate">{label}</div>
    </div>
  );
}