import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useData } from "../../context/DataContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { MapPin, FileText, Share2, ChevronLeft, ChevronRight, Home, CheckCircle, UserPlus, Lock } from "lucide-react";
import StatusBadge from "../../components/StatusBadge.jsx";
import { toast } from "react-toastify";

export default function PWASiteDetail() {
  const { id } = useParams();
  const { sites, visits, customers } = useData();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [imgIdx, setImgIdx] = useState(0);
  const [isRestricted, setIsRestricted] = useState(true);

  const site = sites.find(s => s.id === +id);
  if (!site) return <div className="p-4 text-gray-400 text-center mt-8">Site not found</div>;

  useEffect(() => {
    const hasVisit = visits.some(v => v.siteId === site.id && v.salesManagerId === user?.id);
    const hasCustomer = customers.some(c => c.siteId === site.id && c.salesManagerId === user?.id && (c.status === "Visit Scheduled" || c.status === "Visit Completed" || c.status === "Ready for Booking" || c.status === "Booked" || c.status === "Payment Done"));
    setIsRestricted(!(hasVisit || hasCustomer));
  }, [site.id, visits, customers, user?.id]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: site.name, text: site.description, url: window.location.href });
    } else {
      toast.success("Link copied to clipboard!");
    }
  };

  const handleRegister = () => {
    navigate("/customers/register", { state: { siteId: site.id, siteName: site.name } });
  };

  return (
    <div className="pb-28">
      {/* Image carousel */}
      {!isRestricted ? (
        <div className="relative h-64 bg-gray-200">
          {site.images?.[imgIdx] ? (
            <img src={site.images[imgIdx]} alt={site.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300"><Home size={64} /></div>
          )}
          {site.images?.length > 1 && (
            <>
              <button onClick={() => setImgIdx(i => Math.max(0, i - 1))} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center shadow">
                <ChevronLeft size={18} />
              </button>
              <button onClick={() => setImgIdx(i => Math.min(site.images.length - 1, i + 1))} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center shadow">
                <ChevronRight size={18} />
              </button>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {site.images.map((_, i) => (
                  <div key={i} className={`h-1.5 rounded-full transition-all ${i === imgIdx ? "w-5 bg-white" : "w-1.5 bg-white/50"}`} />
                ))}
              </div>
            </>
          )}
          <div className="absolute top-3 right-3">
            <button onClick={handleShare} className="w-9 h-9 bg-white/90 rounded-full flex items-center justify-center shadow">
              <Share2 size={16} className="text-gray-600" />
            </button>
          </div>
          <div className="absolute bottom-3 right-3">
            <div className="bg-white/90 backdrop-blur rounded-xl px-2.5 py-1 text-xs font-bold text-blue-600">
              {imgIdx + 1}/{site.images?.length || 1}
            </div>
          </div>
        </div>
      ) : (
        <div className="relative h-64 bg-gray-300">
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <Lock size={64} className="mx-auto mb-3 text-gray-500" />
              <div className="text-white text-lg font-bold">Restricted Access</div>
              <div className="text-gray-200 text-sm mt-1">Register customer to view site details</div>
            </div>
          </div>
        </div>
      )}

      <div className="px-4 pt-4 space-y-4">
        {/* Header */}
        <div>
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-gray-900">{site.name}</h2>
              <div className="flex items-center gap-1 text-gray-400 text-sm mt-0.5"><MapPin size={13} />{site.location}</div>
            </div>
            <StatusBadge status={site.status || "Active"} />
          </div>
          {!isRestricted ? (
            <div className="mt-2">
              <span className="text-2xl font-extrabold text-blue-600">₹{Number(site.pricePerSqft).toLocaleString("en-IN")}</span>
              <span className="text-gray-400 text-sm">/sqft</span>
            </div>
          ) : (
            <div className="mt-2 text-sm text-gray-400 font-medium">🔒 Register customer first to view pricing</div>
          )}
        </div>

        {/* Stats */}
        {!isRestricted ? (
          <div className="grid grid-cols-2 gap-2">
            {[["Total Plots", site.totalPlots], ["Available", site.availablePlots]].map(([k, v]) => (
              <div key={k} className="bg-gray-50 rounded-2xl p-3 text-center">
                <div className="font-extrabold text-gray-900">{v}</div>
                <div className="text-xs text-gray-400 mt-0.5">{k}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 rounded-2xl p-4 flex items-center gap-3">
            <Lock size={20} className="text-gray-400" />
            <div className="text-sm text-gray-500 font-medium">Complete customer registration to view site statistics</div>
          </div>
        )}

        {/* Description */}
        <div className={`rounded-2xl border p-4 ${isRestricted ? "bg-gray-50 border-gray-100" : "bg-white border-gray-100"}`}>
          <h3 className="font-bold text-sm mb-2 text-gray-800">About This Property</h3>
          {isRestricted ? (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Lock size={14} />Restricted - Register to view
            </div>
          ) : (
            <p className="text-gray-500 text-sm leading-relaxed">{site.description}</p>
          )}
        </div>

        {/* Amenities */}
        <div className={`rounded-2xl border p-4 ${isRestricted ? "bg-gray-50 border-gray-100" : "bg-white border-gray-100"}`}>
          <h3 className="font-bold text-sm mb-3 text-gray-800">Amenities</h3>
          {isRestricted ? (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Lock size={14} />Restricted - Register to view
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {site.amenities?.map(a => (
                <div key={a} className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                  {a}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Map placeholder */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-3 border-b border-gray-100 flex items-center gap-2">
            <MapPin size={15} className="text-blue-600" />
            <span className="font-semibold text-sm text-gray-800">Location</span>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 h-36 flex flex-col items-center justify-center text-gray-400">
            <MapPin size={32} className="text-blue-300 mb-2" />
            <div className="text-sm font-medium text-gray-500">{site.location}</div>
            <div className="text-xs text-gray-400 mt-1">Lat: {site.lat} · Lng: {site.lng}</div>
          </div>
        </div>

        {/* Brochure */}
        <button onClick={() => isRestricted ? toast.error("Register customer first to download brochure") : toast.success("Brochure downloading…")} className={`w-full flex items-center justify-center gap-2 font-semibold py-3 rounded-2xl transition-colors ${isRestricted ? "bg-gray-50 border border-gray-200 text-gray-400" : "bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-700"}`}>
          <FileText size={18} />{isRestricted ? "🔒 Brochure Locked" : "Download Brochure (PDF)"}
        </button>
      </div>

      {/* Sticky bottom CTA */}
      <div className="fixed bottom-16 left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-30">
        <button
          onClick={handleRegister}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-xl shadow-blue-300 flex items-center justify-center gap-2 transition-all">
          <UserPlus size={20} />{isRestricted ? "Register Customer & Visit" : "Register Another Customer"}
        </button>
      </div>
    </div>
  );
}