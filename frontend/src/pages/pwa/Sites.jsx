import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useData } from "../../context/DataContext.jsx";
import { Search, MapPin, Home, ChevronRight, Filter, UserPlus, X, ChevronLeft, ChevronRight as ChevronRightIcon, Image as ImageIcon, LayoutGrid, FileText, Download } from "lucide-react";
import StatusBadge from "../../components/StatusBadge.jsx";

const ITEMS_PER_PAGE = 5;

export default function PWASites() {
  const { sites } = useData();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState("All");
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [selectedSite, setSelectedSite] = useState(null);
  const [imgIdx, setImgIdx] = useState(0);

  const approved = sites.filter(p => p.status === "Active");
  const filtered = approved.filter(p => {
    return !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.location.toLowerCase().includes(search.toLowerCase());
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedSites = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleSearch = (val) => {
    setSearch(val);
    setCurrentPage(1);
  };

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
          <input value={search} onChange={e => handleSearch(e.target.value)} placeholder="Search sites…"
            className="w-full bg-white border border-gray-200 rounded-2xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm" />
        </div>
      </div>

      {/* Site cards */}
      <div className="px-4 mt-3 space-y-4">
        {paginatedSites.map(project => (
          <div key={project.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Image */}
            <div className="relative h-44 bg-gray-100">
              {project.images?.[0] ? (
                <img src={project.images[0]} alt={project.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  <Home size={48} />
                </div>
              )}
              <button onClick={(e) => { e.stopPropagation(); setSelectedSite(project); }} className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-xl px-2.5 py-1 text-xs font-bold text-green-600 hover:bg-white transition-colors">
                {project.availablePlots} available
              </button>
              {project.images?.length > 1 && (
                <button onClick={(e) => openGallery(project, e)} className="absolute bottom-3 right-3 bg-black/50 hover:bg-black/70 text-white p-2 rounded-lg backdrop-blur-sm transition-colors">
                  <ImageIcon size={18} />
                </button>
              )}
            </div>
            {/* Info */}
            <div className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-gray-900">{project.name}</h3>
                  <div className="flex items-center gap-1 text-gray-400 text-xs mt-0.5">
                    <MapPin size={11} />{project.location}
                  </div>
                </div>
                <UserPlus size={18} className="text-blue-400 mt-1" />
              </div>
              {project.pricePerSqft > 0 && (
                <div className="flex items-center justify-between mt-3">
                  <div>
                    <span className="text-lg font-extrabold text-blue-600">₹{Number(project.pricePerSqft).toLocaleString("en-IN")}</span>
                    <span className="text-xs text-gray-400">/sqft</span>
                  </div>
                </div>
              )}
              {/* Plots summary */}
              <div className="flex gap-3 mt-2 text-xs text-gray-500">
                <span>Total: <strong className="text-gray-700">{project.totalPlots}</strong></span>
                <span>Available: <strong className="text-green-600">{project.availablePlots}</strong></span>
              </div>
              {/* View More */}
              <div className="mt-3 pt-3 border-t border-gray-100">
                <button onClick={(e) => { e.stopPropagation(); setSelectedSite(project); }} className="w-full text-center text-xs font-semibold text-blue-600 hover:text-blue-700 py-2 rounded-xl hover:bg-blue-50 transition-colors">
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between py-3 border-t border-gray-100 mt-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={14} /> Prev
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-7 h-7 rounded-lg text-xs font-medium transition-all ${
                      currentPage === pageNum
                        ? "bg-blue-600 text-white"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next <ChevronRightIcon size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Gallery Modal */}
      {galleryOpen && selectedSite && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
          <button onClick={closeGallery} className="absolute top-4 right-4 z-20 text-white p-2">
            <X size={28} />
          </button>
          <div className="w-full h-full flex items-center justify-center p-4 pb-16">
            {selectedSite.images?.[imgIdx] ? (
              <img src={selectedSite.images[imgIdx]} alt={selectedSite.name} className="max-w-full max-h-full object-contain" />
            ) : (
              <div className="text-white text-center">
                <Home size={64} className="mx-auto mb-3 opacity-50" />
                <div>No images available</div>
              </div>
            )}
          </div>
          <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={prevImg} className="text-white hover:text-white/80 p-1.5 hover:bg-white/10 rounded-full transition-colors">
                <ChevronLeft size={20} />
              </button>
              <div className="text-white text-xs font-semibold">
                {imgIdx + 1} / {selectedSite.images?.length || 1}
              </div>
              <button onClick={nextImg} className="text-white hover:text-white/80 p-1.5 hover:bg-white/10 rounded-full transition-colors">
                <ChevronRightIcon size={20} />
              </button>
            </div>
            <div className="text-white/80 text-xs font-medium truncate max-w-[180px] sm:max-w-[240px]">
              {selectedSite.name}
            </div>
          </div>
        </div>
      )}

      {/* Project Details Modal */}
      {selectedSite && !galleryOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-[24px] sm:rounded-2xl w-full max-w-lg max-h-[90vh] sm:max-h-[85vh] overflow-y-auto">
            <div className="sm:hidden flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-300 rounded-full"></div>
            </div>
            <div className="sticky top-0 bg-white border-b border-gray-100 flex items-center justify-between px-5 py-4">
              <h3 className="text-lg font-bold text-gray-900">Project Overview & Details</h3>
              <button onClick={() => setSelectedSite(null)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 sm:p-6 space-y-5 pb-8">
              {/* Image Gallery */}
              {selectedSite.images?.length > 0 && (
                <div className="relative rounded-xl overflow-hidden bg-gray-100">
                  <div className="relative h-56 w-full">
                    <img src={selectedSite.images[imgIdx]} alt={selectedSite.name} className="w-full h-full object-cover" />
                    {selectedSite.images.length > 1 && (
                      <>
                        <button onClick={() => setImgIdx((prev) => (prev === 0 ? selectedSite.images.length - 1 : prev - 1))} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-all">
                          <ChevronLeft size={18} />
                        </button>
                        <button onClick={() => setImgIdx((prev) => (prev === selectedSite.images.length - 1 ? 0 : prev + 1))} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-all">
                          <ChevronRight size={18} />
                        </button>
                        <div className="absolute bottom-2 right-2 px-3 py-1 bg-black/60 text-white text-xs font-medium rounded-full">
                          {imgIdx + 1} / {selectedSite.images.length}
                        </div>
                      </>
                    )}
                  </div>
                  {selectedSite.images.length > 1 && (
                    <div className="flex gap-2 p-2 bg-white border-t overflow-x-auto">
                      {selectedSite.images.map((img, i) => (
                        <button key={i} onClick={() => setImgIdx(i)} className={`relative h-12 w-16 flex-shrink-0 rounded-md overflow-hidden border-2 transition-all ${i === imgIdx ? "border-blue-500" : "border-transparent opacity-60 hover:opacity-100"}`}>
                          <img src={img} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Header */}
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-gray-200">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <StatusBadge status={selectedSite.status} />
                  </div>
                  <h2 className="text-xl sm:text-2xl text-gray-800">{selectedSite.name}</h2>
                  <p className="text-xs sm:text-sm text-gray-500 flex items-center gap-1.5 mt-1">
                    <MapPin size={14} className="text-blue-500 flex-shrink-0" />
                    {selectedSite.location}
                  </p>
                </div>
              </div>

              {/* Key Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-blue-50 rounded-xl p-3 sm:p-4 border border-blue-100">
                  <p className="text-[10px] sm:text-xs font-medium text-blue-600 uppercase tracking-wider">Total Sites</p>
                  <p className="text-lg sm:text-xl font-bold text-gray-900 mt-1">{selectedSite.totalPlots || 0}</p>
                </div>
                <div className="bg-green-50 rounded-xl p-3 sm:p-4 border border-green-100">
                  <p className="text-[10px] sm:text-xs font-medium text-green-600 uppercase tracking-wider">Available</p>
                  <p className="text-lg sm:text-xl font-bold text-gray-900 mt-1">{selectedSite.availablePlots || 0}</p>
                </div>
                <div className="bg-amber-50 rounded-xl p-3 sm:p-4 border border-amber-100">
                  <p className="text-[10px] sm:text-xs font-medium text-amber-600 uppercase tracking-wider">Booked</p>
                  <p className="text-lg sm:text-xl font-bold text-gray-900 mt-1">{(selectedSite.plots || []).filter(p => p.status === "Booked").length}</p>
                </div>
                <div className="bg-rose-50 rounded-xl p-3 sm:p-4 border border-rose-100">
                  <p className="text-[10px] sm:text-xs font-medium text-rose-600 uppercase tracking-wider">Sold</p>
                  <p className="text-lg sm:text-xl font-bold text-gray-900 mt-1">{(selectedSite.plots || []).filter(p => p.status === "Sold").length}</p>
                </div>
              </div>

              {/* Available Plots Table */}
              {selectedSite.plots?.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <h4 className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                      <LayoutGrid size={14} className="text-blue-600" />
                      Available Plots
                    </h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="text-left px-3 sm:px-4 py-2 text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">S.No</th>
                          <th className="text-left px-3 sm:px-4 py-2 text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Site</th>
                          <th className="text-left px-3 sm:px-4 py-2 text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Facing</th>
                          <th className="text-left px-3 sm:px-4 py-2 text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">East-West</th>
                          <th className="text-left px-3 sm:px-4 py-2 text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">North-South</th>
                          <th className="text-left px-3 sm:px-4 py-2 text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Total Sqft</th>
                          <th className="text-left px-3 sm:px-4 py-2 text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Price/sqft</th>
                          <th className="text-left px-3 sm:px-4 py-2 text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {selectedSite.plots.map((pl, idx) => (
                          <tr key={pl.id} className="hover:bg-gray-50/50">
                            <td className="px-3 sm:px-4 py-2 text-gray-500 font-medium text-xs">{idx + 1}</td>
                            <td className="px-3 sm:px-4 py-2 text-gray-800 font-medium text-xs sm:text-sm">{pl.siteNo}</td>
                            <td className="px-3 sm:px-4 py-2">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium ${
                                pl.facing === "East" ? "bg-amber-50 text-amber-700" :
                                pl.facing === "West" ? "bg-indigo-50 text-indigo-700" :
                                pl.facing === "North" ? "bg-blue-50 text-blue-700" :
                                pl.facing === "South" ? "bg-rose-50 text-rose-700" :
                                "bg-gray-50 text-gray-600"
                              }`}>
                                {pl.facing}
                              </span>
                            </td>
                            <td className="px-3 sm:px-4 py-2 text-gray-700 text-xs sm:text-sm">{pl.eastWest ? `${pl.eastWest} ft` : "-"}</td>
                            <td className="px-3 sm:px-4 py-2 text-gray-700 text-xs sm:text-sm">{pl.northSouth ? `${pl.northSouth} ft` : "-"}</td>
                            <td className="px-3 sm:px-4 py-2 text-gray-800 font-medium text-xs sm:text-sm">{Number(pl.totalSqft).toLocaleString("en-IN")}</td>
                            <td className="px-3 sm:px-4 py-2 text-gray-800 font-medium text-xs sm:text-sm">₹{Number(pl.pricePerSqft).toLocaleString("en-IN")}</td>
                            <td className="px-3 sm:px-4 py-2">
                              <StatusBadge status={pl.status || "Active"} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Brochure Download */}
              {selectedSite.brochure && (
                <div className="bg-emerald-50 rounded-xl p-3 sm:p-4 border border-emerald-200">
                  <h4 className="text-[10px] sm:text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2 sm:mb-3 flex items-center gap-1.5">
                    <FileText size={14} />
                    Project Brochure
                  </h4>
                  <a href={selectedSite.brochure} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors">
                    <Download size={16} />
                    Download Brochure
                  </a>
                </div>
              )}

              {/* Documents & Attachments */}
              {selectedSite.documents?.length > 0 && (
                <div className="bg-white rounded-xl p-3 sm:p-4 border border-gray-200">
                  <h4 className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 sm:mb-3 flex items-center gap-1.5">
                    <FileText size={14} className="text-purple-600" />
                    Documents & Attachments
                  </h4>
                  <div className="space-y-2">
                    {selectedSite.documents.map((doc, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-purple-600 text-white flex items-center justify-center flex-shrink-0">
                            <FileText size={14} className="sm:hidden" />
                            <FileText size={18} className="hidden sm:block" />
                          </div>
                          <div>
                            <p className="text-xs sm:text-sm font-medium text-gray-900">Document #{idx + 1}</p>
                            <p className="text-[10px] sm:text-xs text-gray-500">Attachment File</p>
                          </div>
                        </div>
                        <a href={typeof doc === 'string' ? doc : doc} target="_blank" rel="noopener noreferrer" className="p-1.5 sm:p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors" title="View Document">
                          <Download size={14} className="sm:hidden" />
                          <Download size={16} className="hidden sm:block" />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              {selectedSite.description && (
                <div className="bg-gray-50 rounded-xl p-3 sm:p-4 border border-gray-200">
                  <h4 className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <FileText size={14} className="text-blue-600" />
                    Description
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-700 leading-relaxed whitespace-pre-line">{selectedSite.description}</p>
                </div>
              )}

              {/* Close Button */}
              <div className="flex justify-end pt-3 border-t border-gray-100">
                <button type="button" onClick={() => setSelectedSite(null)} className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all active:scale-95">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}