import { useAuth } from "../../context/AuthContext.jsx";
import { useData } from "../../context/DataContext.jsx";
import { MapPin, Calendar } from "lucide-react";

export default function BDMVisits() {
  const { user, hierarchy } = useAuth();
  const { visits, users } = useData();

  const directChildren = hierarchy.getDirectChildren(users);
  const mySMs = users.filter(u => u.role === "Sales Manager" && directChildren.some(t => t.id === u.parentUserId));
  const mySMIds = new Set(mySMs.map(s => s.id));

  const myVisits = visits.filter(v => v.salesManagerId && mySMIds.has(v.salesManagerId));

  return (
    <div className="pb-4">
      <div className="px-4 py-4">
        <h1 className="text-xl font-bold text-gray-900">Site Visit Tracking</h1>
        <p className="text-sm text-gray-400 mt-0.5">Team visit activity</p>
      </div>

      <div className="px-4 space-y-3">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <h3 className="font-bold text-gray-800 text-sm mb-3">Summary</h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Total Visits", value: myVisits.length, color: "text-blue-600" },
              { label: "Completed", value: myVisits.filter(v => v.status === "Visit Completed").length, color: "text-green-600" },
            ].map(s => (
              <div key={s.label} className="text-center p-3 bg-gray-50 rounded-xl">
                <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-gray-400">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <h3 className="font-bold text-gray-800 text-sm mb-3">Recent Visits</h3>
          <div className="space-y-2">
            {myVisits.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No visits found</p>
            ) : (
              myVisits.slice(0, 5).map(v => (
                <div key={v.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 flex-shrink-0">
                    <MapPin size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-gray-800 truncate">{v.customerName}</div>
                    <div className="text-xs text-gray-400 truncate">{v.siteName}</div>
                    <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                      <Calendar size={10} />{v.visitDate}
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    v.status === "Visit Completed" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                  }`}>
                    {v.status.replace("Visit ", "")}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}