import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useData } from "../../context/DataContext.jsx";
import { Search, MapPin, Home, ChevronRight, Filter, UserPlus, X, ChevronLeft, ChevronRight as ChevronRightIcon, Image as ImageIcon } from "lucide-react";
import StatusBadge from "../../components/StatusBadge.jsx";

export default function PWASites() {
  const { sites } = useData();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [selectedSite, setSelectedSite] = useState(null);
  const [imgIdx, setImgIdx] = useState(0);

  const approved = sites.filter(s => s.status === "Active");
  const filtered = approved.filter(s => {
    return !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.location.toLowerCase().includes(search.toLowerCase());
  });

  const openGallery = (site, e) => {
    e.stopPropagation();
    setSelectedSite(site);
    setImgIdx(0);
    setGalleryOpen(true);
  };

  const closeGallery = () => { setGalleryOpen(false); setSelectedSite(null); };
  const nextImg = (e) => {
    e.stopPropagation();
    if (!selectedSite?.images?.length) return;
    setImgIdx(i => (i + 1) % selectedSite.images.length);
  };
  const prevImg = (e) => {
    e.stopPropagation();
    if (!selectedSite?.images?.length) return;
    setImgIdx(i => (i - 1 + selectedSite.images.length) % selectedSite.images.length);
  };

  return (
    <div className="pb-4">
      {/* Search */}
      <div className="px-4 pt-4 space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search sites…"
            className="w-full bg-white border border-gray-200 rounded-2xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm" />
        </div>
      </div>

      {/* Site cards */}
      <div className="px-4 mt-3 space-y-4">
        {filtered.map(site => (
          <div key={site.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Image */}
            <div className="relative h-44 bg-gray-100">
              {site.images?.[0] ? (
                <img src={site.images[0]} alt={site.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  <Home size={48} />
                </div>
              )}
              <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-xl px-2.5 py-1 text-xs font-bold text-green-600">
                {site.availablePlots} available
              </div>
              {site.images?.length > 1 && (
                <button onClick={(e) => openGallery(site, e)} className="absolute bottom-3 right-3 bg-black/50 hover:bg-black/70 text-white p-2 rounded-lg backdrop-blur-sm transition-colors">
                  <ImageIcon size={18} />
                </button>
              )}
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
              {/* View More */}
              <div className="mt-3 pt-3 border-t border-gray-100">
                <button onClick={(e) => { e.stopPropagation(); setSelectedSite(site); }} className="w-full text-center text-xs font-semibold text-blue-600 hover:text-blue-700 py-2 rounded-xl hover:bg-blue-50 transition-colors">
                  View More
                </button>
              </div>
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

      {/* Gallery Modal - Clean fullscreen viewer */}
      {galleryOpen && selectedSite && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
          {/* Close button */}
          <button 
            onClick={closeGallery} 
            className="absolute top-4 right-4 z-20 text-white p-2"
          >
            <X size={28} />
          </button>
          
          
          {/* Image */}
          <div className="w-full h-full flex items-center justify-center p-4 pb-16">
            {selectedSite.images?.[imgIdx] ? (
              <img 
                src={selectedSite.images[imgIdx]} 
                alt={selectedSite.name} 
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <div className="text-white text-center">
                <Home size={64} className="mx-auto mb-3 opacity-50" />
                <div>No images available</div>
              </div>
            )}
          </div>
          
          {/* Footer with counter and navigation */}
          <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button 
                onClick={prevImg} 
                className="text-white hover:text-white/80 p-1.5 hover:bg-white/10 rounded-full transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="text-white text-xs font-semibold">
                {imgIdx + 1} / {selectedSite.images?.length || 1}
              </div>
              <button 
                onClick={nextImg} 
                className="text-white hover:text-white/80 p-1.5 hover:bg-white/10 rounded-full transition-colors"
              >
                <ChevronRightIcon size={20} />
              </button>
            </div>
            <div className="text-white/80 text-xs font-medium truncate max-w-[180px] sm:max-w-[240px]">
              {selectedSite.name}
            </div>
          </div>
        </div>
      )}

      {/* Site Details Modal */}
      {selectedSite && !galleryOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-[24px] sm:rounded-2xl w-full max-w-lg max-h-[90vh] sm:max-h-[85vh] overflow-y-auto">
            {/* Mobile drag indicator */}
            <div className="sm:hidden flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-300 rounded-full"></div>
            </div>
            <div className="sticky top-0 bg-white border-b border-gray-100 flex items-center justify-between px-5 py-4">
              <h3 className="text-lg font-bold text-gray-900">Site Details</h3>
              <button onClick={() => setSelectedSite(null)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 sm:p-6 space-y-4 pb-8">
              <div>
                <h4 className="text-xl font-bold text-gray-900">{selectedSite.name}</h4>
                <div className="flex items-center gap-1 text-gray-500 text-sm mt-1">
                  <MapPin size={14} /> {selectedSite.location}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 rounded-xl p-3">
                  <div className="text-xs text-gray-500 mb-1">Type</div>
                  <div className="font-semibold text-gray-800 text-sm"><StatusBadge status={selectedSite.type} /></div>
                </div>
                <div className="bg-green-50 rounded-xl p-3">
                  <div className="text-xs text-gray-500 mb-1">Status</div>
                  <div className="font-semibold text-gray-800 text-sm"><StatusBadge status={selectedSite.status} /></div>
                </div>
                <div className="bg-purple-50 rounded-xl p-3">
                  <div className="text-xs text-gray-500 mb-1">Total Plots</div>
                  <div className="font-bold text-gray-800 text-lg">{selectedSite.totalPlots}</div>
                </div>
                <div className="bg-orange-50 rounded-xl p-3">
                  <div className="text-xs text-gray-500 mb-1">Available</div>
                  <div className="font-bold text-gray-800 text-lg">{selectedSite.availablePlots}</div>
                </div>
                <div className="bg-indigo-50 rounded-xl p-3">
                  <div className="text-xs text-gray-500 mb-1">Price/sqft</div>
                  <div className="font-bold text-gray-800 text-sm">₹{Number(selectedSite.pricePerSqft).toLocaleString("en-IN")}</div>
                </div>
                <div className="bg-pink-50 rounded-xl p-3">
                  <div className="text-xs text-gray-500 mb-1">Area</div>
                  <div className="font-bold text-gray-800 text-sm">{selectedSite.totalArea}</div>
                </div>
              </div>
              {selectedSite.description && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="text-xs font-semibold text-gray-500 mb-2">Description</div>
                  <p className="text-sm text-gray-700">{selectedSite.description}</p>
                </div>
              )}
              {selectedSite.amenities?.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-gray-500 mb-2">Amenities</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedSite.amenities.map(a => (
                      <span key={a} className="bg-blue-50 text-blue-700 text-xs px-3 py-1 rounded-full border border-blue-100">{a}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
