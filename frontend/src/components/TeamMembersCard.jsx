import { Users } from "lucide-react";

export default function TeamMembersCard({ totalTeam, roleCounts }) {
  const colorMap = {
    bg: "bg-indigo-50",
    icon: "text-indigo-600",
    ring: "ring-indigo-100",
  };

  return (
    <div className="card p-5 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-2xl ${colorMap.bg} ring-1 ${colorMap.ring} flex items-center justify-center`}>
          <Users size={22} className={colorMap.icon} />
        </div>
      </div>
      <div className="text-xl font-semibold text-gray-700 mb-0.5">
        {totalTeam.toLocaleString("en-IN")}
      </div>
      <div className="text-sm text-gray-400 font-medium mb-2">Active Team Members</div>
      <div className="text-xs text-gray-500 font-medium">
        <span className="text-blue-600">D: {roleCounts.D}</span>
        <span className="mx-1">|</span>
        <span className="text-green-600">RM: {roleCounts.RM}</span>
        <span className="mx-1">|</span>
        <span className="text-orange-600">BM: {roleCounts.BM}</span>
        <span className="mx-1">|</span>
        <span className="text-purple-600">BDM: {roleCounts.BDM}</span>
        <span className="mx-1">|</span>
        <span className="text-pink-600">SM: {roleCounts.SM}</span>
      </div>
    </div>
  );
}