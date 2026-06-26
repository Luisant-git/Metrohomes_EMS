import { useAuth } from "../../context/AuthContext.jsx";
import { useData } from "../../context/DataContext.jsx";
import { useNavigate } from "react-router-dom";
import { Target, TrendingUp, TrendingDown } from "lucide-react";

export default function BMTargets() {
  const { user, hierarchy } = useAuth();
  const { users } = useData();
  const navigate = useNavigate();

  const directChildren = hierarchy.getDirectChildren(users);
  const myBDMs = users.filter(u => u.role === "BDM" && directChildren.some(t => t.id === u.parentUserId));

  return (
    <div className="pb-4">
      <div className="px-4 py-4">
        <h1 className="text-xl font-bold text-gray-900">Assign Targets</h1>
        <p className="text-sm text-gray-400 mt-0.5">Targets for BDMs</p>
      </div>

      <div className="px-4 space-y-3">
        {myBDMs.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center">
            <Target size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No BDMs assigned</p>
          </div>
        ) : (
          myBDMs.map(bdm => (
            <div key={bdm.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-lg">
                  {bdm.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-800">{bdm.name}</div>
                  <div className="text-xs text-gray-400">{bdm.employeeCode} · {bdm.branch}</div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-50">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Monthly Target</span>
                  <span className="font-bold text-blue-600">4 Customers</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-gray-500">Achieved</span>
                  <span className="font-bold text-green-600">2 Customers</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 mt-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: "50%" }} />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}