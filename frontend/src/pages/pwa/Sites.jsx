import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useData } from "../../context/DataContext.jsx";
import { Search, MapPin, Home, ChevronRight, Filter, UserPlus } from "lucide-react";
import StatusBadge from "../../components/StatusBadge.jsx";

export default function PWASites() {
  const { sites } = useData();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");

  const approved = sites.filter(s => s.approved);
  const types = ["All", ...new Set(approved.map(s => s.type))];
  const filtered = approved.filter(s => {
    const matchType = typeFilter === "All" || s.type === typeFilter;
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.location.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  return (
    <div className="pb-4">
      {/* Search */}
      <div className="px-4 pt-4 space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search sites…"
            className="w-full bg-white border border-gray-200 rounded-2xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm" />
        </div>
        {/* Type filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {types.map(t => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${typeFilter === t ? "bg-blue-600 text-white shadow-sm" : "bg-white border border-gray-200 text-gray-600"}`}>
              {t} {t === "All" ? `(${approved.length})` : `(${approved.filter(s => s.type === t).length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Site cards */}
      <div className="px-4 mt-3 space-y-4">
        {filtered.map(site => (
          <div key={site.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden" onClick={() => navigate("/customers/register", { state: { siteId: site.id, siteName: site.name } })}>
            {/* Image */}
            <div className="relative h-44 bg-gray-100">
              {site.images?.[0] ? (
                <img src={site.images[0]} alt={site.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  <Home size={48} />
                </div>
              )}
              <div className="absolute top-3 left-3">
                <StatusBadge status={site.type} />
              </div>
              <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-xl px-2.5 py-1 text-xs font-bold text-green-600">
                {site.availablePlots} available
              </div>
            </div>
            {/* Info */}
            <div className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-gray-900">{site.name}</h3>
                  <div className="flex items-center gap-1 text-gray-400 text-xs mt-0.5">
                    <MapPin size={11} />{site.location}
                  </div>
                </div>
                <UserPlus size={18} className="text-blue-400 mt-1" />
              </div>
              <div className="flex items-center justify-between mt-3">
                <div>
                  <span className="text-lg font-extrabold text-blue-600">₹{Number(site.pricePerSqft).toLocaleString("en-IN")}</span>
                  <span className="text-xs text-gray-400">/sqft</span>
                </div>
                <div className="text-xs text-gray-400">{site.totalArea}</div>
              </div>
              {/* Amenities preview */}
              {site.amenities?.length > 0 && (
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  {site.amenities.slice(0, 3).map(a => (
                    <span key={a} className="bg-gray-50 border border-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full">{a}</span>
                  ))}
                  {site.amenities.length > 3 && <span className="text-gray-400 text-xs">+{site.amenities.length - 3} more</span>}
                </div>
              )}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Home size={48} className="mx-auto mb-3 opacity-30" />
            <div className="font-semibold">No sites found</div>
          </div>
        )}
      </div>
    </div>
  );
}
