import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useData } from "../../context/DataContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { User, Phone, MapPin, Calendar, Building2, FileText, CheckCircle, Navigation, Car, Users, Briefcase, DollarSign } from "lucide-react";
import toast from "react-hot-toast";

function FormField({ label, icon: Icon, children, required, className }) {
  return (
    <div className={(className ? className + " " : "") + ""}>
      <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1.5">
        {Icon && <Icon size={14} className="text-gray-400" />}{label}{required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

export default function PWAVisitRegistration() {
  const { sites, addCustomer } = useData();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const prefillSite = location.state?.siteId;
  const prefillSiteName = location.state?.siteName;

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "", mobile: "", email: "", address: "", pinCode: "",
    occupation: "",
    location: "", siteId: prefillSite || "", visitDate: "", visitTime: "",
    persons: "", purchaseMode: "Own Funding",
    driverName: "", driverMobile: "", cabNumber: "",
    notes: "", status: "Interested",
  });
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [locLoading, setLocLoading] = useState(false);

  const approvedSites = sites.filter(s => s.status === "Active");
  const selectedSite = approvedSites.find(s => s.id === +form.siteId);

  const salesManager = {
    name: "Anjali Verma",
    mobile: "9876543210",
    ...user,
  };

  const getLocation = () => {
    setLocLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          setForm(p => ({ ...p, location: `${pos.coords.latitude.toFixed(6)},${pos.coords.longitude.toFixed(6)}` }));
          setLocLoading(false);
          toast.success("Location captured!");
        },
        () => {
          setForm(p => ({ ...p, location: "28.613900,77.209000" }));
          setLocLoading(false);
          toast.success("Demo location set");
        }
      );
    } else {
      setForm(p => ({ ...p, location: "28.613900,77.209000" }));
      setLocLoading(false);
    }
  };

  const sendOtp = async () => {
    if (!form.mobile || form.mobile.length !== 10) {
      toast.error("Enter valid 10-digit mobile number");
      return;
    }
    // Demo OTP
    toast.success(`Demo OTP: 1234`);
    setOtpSent(true);
  };

  const verifyOtp = () => {
    if (otp === "1234") {
      setOtpVerified(true);
      toast.success("Mobile verified!");
    } else {
      toast.error("Invalid OTP");
    }
  };

  const handleSubmit = () => {
    if (!form.name || !form.mobile || !form.siteId || !form.visitDate || !form.visitTime || !form.persons) {
      toast.error("Please fill all required fields");
      return;
    }
    if (!otpVerified) {
      toast.error("Please verify OTP to continue");
      return;
    }
    addCustomer({
      ...form,
      siteId: +form.siteId,
      siteName: selectedSite?.name || prefillSiteName || "",
      salesManagerId: salesManager?.id || 6,
      salesManagerName: salesManager?.name || "Anjali Verma",
      salesManagerMobile: salesManager?.mobile || "9876543210",
    });
    toast.success("Customer registered & visit scheduled! 🎉");
    navigate("/customers");
  };

  const F = FormField
  return (
    <div className="pb-40 relative z-10">
      {/* Header */}
      <div className="px-4 pt-4">
        <h2 className="text-xl font-extrabold text-gray-900 mb-2">Customer Registration</h2>
        <div className="flex items-center gap-2 mb-5">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex-1 flex items-center gap-1">
              <div className={`flex-1 h-1.5 rounded-full transition-all ${s <= step ? "bg-blue-600" : "bg-gray-100"}`} />
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${s < step ? "bg-blue-600 text-white" : s === step ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-400"}`}>
                {s < step ? <CheckCircle size={12} /> : s}
              </div>
            </div>
          ))}
        </div>
        <div className="text-xs text-gray-400 font-semibold uppercase tracking-wide">
          {step === 1 ? "Personal Info & Occupation" : step === 2 ? "Visit Details" : "Review & Submit"}
        </div>
      </div>

      <div className="px-4 mt-3 space-y-4">
        {/* Step 1: Personal Info & Occupation */}
        {step === 1 && (
          <div className="space-y-4 animate-fadeIn">
            <div className="bg-blue-50 rounded-2xl p-3 text-sm text-blue-700 font-medium">
              👤 Enter customer details
            </div>

            <div className="grid grid-cols-1 gap-4">
              <F label="Applicant Name" icon={User} required>
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  className="input-field" placeholder="Full name" />
              </F>

              <F label="Mobile Number" icon={Phone} required>
                <div className="flex gap-2">
                  <input type="tel" value={form.mobile} onChange={e => setForm(p => ({ ...p, mobile: e.target.value }))}
                    className="input-field flex-1" placeholder="10-digit number" maxLength={10} disabled={otpVerified} />
                  {!otpVerified && (
                    <button onClick={sendOtp} className="flex-shrink-0 bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors">
                      Get OTP
                    </button>
                  )}
                </div>
              </F>

              {otpSent && !otpVerified && (
                <F label="Enter OTP" required>
                  <div className="flex gap-2">
                    <input type="text" value={otp} onChange={e => setOtp(e.target.value)}
                      className="input-field flex-1" placeholder="Enter 4-digit OTP" maxLength={4} />
                    <button onClick={verifyOtp} className="flex-shrink-0 bg-green-100 hover:bg-green-200 text-green-700 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors">
                      Verify
                    </button>
                  </div>
                </F>
              )}

              {otpVerified && (
                <div className="bg-green-50 rounded-xl p-2.5 text-sm text-green-700 font-medium flex items-center gap-2">
                  <CheckCircle size={16} /> Mobile verified ✓
                </div>
              )}

              <F label="Email (optional)">
                <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  className="input-field" placeholder="customer@email.com" />
              </F>

              <F label="Address" icon={MapPin} required>
                <textarea value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                  className="input-field h-20 resize-none" placeholder="Full address" />
              </F>

              <F label="Pin Code" required>
                <input type="number" value={form.pinCode} onChange={e => setForm(p => ({ ...p, pinCode: e.target.value }))}
                  className="input-field" placeholder="6-digit pin code" maxLength={6} />
              </F>

              <F label="Occupation" icon={Briefcase} required>
                <div className="grid grid-cols-3 gap-2">
                  {["Self Employed", "Salaried", "Business"].map(occ => (
                    <label key={occ} className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border-2 cursor-pointer transition-all ${form.occupation === occ ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"}`}>
                      <input type="radio" name="occupation" value={occ} checked={form.occupation === occ} onChange={e => setForm(p => ({ ...p, occupation: e.target.value }))} className="hidden" />
                      <span className="text-sm font-semibold">{occ}</span>
                    </label>
                  ))}
                </div>
              </F>
            </div>
          </div>
        )}

        {/* Step 2: Visit Details */}
        {step === 2 && (
          <div className="space-y-4 animate-fadeIn">
            <div className="bg-green-50 rounded-2xl p-3 text-sm text-green-700 font-medium">
              🏗️ Visit & purchase details
            </div>

            <div className="grid grid-cols-1 gap-4">
              <F label="Select Project" icon={Building2} required>
                <select value={form.siteId} onChange={e => setForm(p => ({ ...p, siteId: e.target.value }))} className="input-field">
                  <option value="">Choose project…</option>
                  {approvedSites.map(s => <option key={s.id} value={s.id}>{s.name} — {s.location}</option>)}
                </select>
              </F>

              {selectedSite && (
                <div className="bg-blue-50 rounded-2xl p-3 flex items-center gap-3">
                  {selectedSite.images?.[0] && <img src={selectedSite.images[0]} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" alt={selectedSite.name} />}
                  <div>
                    <div className="font-bold text-gray-800 text-sm">{selectedSite.name}</div>
                    <div className="text-xs text-gray-400">{selectedSite.location}</div>
                    <div className="text-xs text-blue-600 font-semibold mt-0.5">{selectedSite.availablePlots} plots · ₹{Number(selectedSite.pricePerSqft).toLocaleString("en-IN")}/sqft</div>
                  </div>
                </div>
              )}

              <F label="Purchase Mode" icon={DollarSign} required>
                <div className="grid grid-cols-2 gap-2">
                  {["Own Funding", "Loan"].map(mode => (
                    <label key={mode} className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border-2 cursor-pointer transition-all ${form.purchaseMode === mode ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"}`}>
                      <input type="radio" name="purchaseMode" value={mode} checked={form.purchaseMode === mode} onChange={e => setForm(p => ({ ...p, purchaseMode: e.target.value }))} className="hidden" />
                      <span className="text-sm font-semibold">{mode}</span>
                    </label>
                  ))}
                </div>
              </F>

              <div className="grid grid-cols-2 gap-3">
                <F label="Visit Date" icon={Calendar} required>
                  <input type="date" value={form.visitDate} onChange={e => setForm(p => ({ ...p, visitDate: e.target.value }))}
                    min={new Date().toISOString().split("T")[0]} className="input-field" />
                </F>

                <F label="Visit Time" required>
                  <input type="text" value={form.visitTime} onChange={e => {
                    const val = e.target.value.replace(/[^\d:]/g, '');
                    if (/^\d{0,2}:?\d{0,2}$/.test(val)) {
                      setForm(p => ({ ...p, visitTime: val }));
                    }
                  }} onBlur={e => {
                    const val = e.target.value;
                    if (val && !/^\d{2}:\d{2}$/.test(val)) {
                      toast.error("Time format: HH:MM");
                    }
                  }}
                    className="input-field" placeholder="_ _ : _ _" maxLength={5} />
                </F>
              </div>

              <F label="Number of Persons" icon={Users} required>
                <input type="text" value={form.persons} onChange={e => setForm(p => ({ ...p, persons: e.target.value.replace(/[^\d]/g, '') }))}
                  className="input-field" placeholder="1" maxLength={2} />
                {form.persons === '' && <p className="text-xs text-gray-400 mt-1">Enter number of persons</p>}
              </F>

              <F label="Pickup Location (GPS)" icon={MapPin}>
                <div className="flex gap-2">
                  <input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                    className="input-field flex-1" placeholder="lat,lng or use GPS" />
                  <button onClick={getLocation} disabled={locLoading}
                    className="flex-shrink-0 bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center gap-1">
                    {locLoading ? <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /> : <Navigation size={14} />}
                    {locLoading ? "" : "GPS"}
                  </button>
                </div>
              </F>

              <F label="Notes / Requirements" icon={FileText}>
                <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                  className="input-field h-20 resize-none" placeholder="Plot size preference, budget, etc." />
              </F>
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div className="space-y-4 animate-fadeIn">
            <div className="bg-purple-50 rounded-2xl p-3 text-sm text-purple-700 font-medium">
              ✅ Review details before submitting
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
              {[
                ["Name", form.name],
                ["Mobile", form.mobile],
                ["Email", form.email || "—"],
                ["Address", form.address],
                ["Pin Code", form.pinCode],
                ["Occupation", form.occupation],
                ["Project", selectedSite?.name || "—"],
                ["Purchase Mode", form.purchaseMode],
                ["Visit Date", form.visitDate],
                ["Visit Time", form.visitTime],
                ["Persons", form.persons],
                ["Pickup", form.location || "—"],
                ["Notes", form.notes || "—"],
              ].map(([k, v]) => (
                <div key={k} className="flex items-start justify-between px-4 py-3">
                  <span className="text-sm text-gray-400 font-medium">{k}</span>
                  <span className="text-sm font-semibold text-gray-800 text-right max-w-[55%]">{v}</span>
                </div>
              ))}
            </div>

            <div className="bg-blue-50 rounded-2xl p-3 text-xs text-blue-600">
              <strong>Note:</strong> Customer will be registered with status <strong>"Interested"</strong>. Sales manager <strong>{salesManager.name}</strong> ({salesManager.mobile}) will be assigned.
            </div>
          </div>
        )}
      </div>

      {/* Nav buttons */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-30">
        <div className="flex gap-3">
          {step > 1 && (
            <button onClick={() => setStep(s => s - 1)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-4 rounded-2xl transition-colors">
              ← Back
            </button>
          )}
          <button onClick={() => step < 3 ? setStep(s => s + 1) : handleSubmit()}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-xl shadow-blue-300 transition-all">
            {step === 3 ? "✅ Submit Registration" : "Continue →"}
          </button>
        </div>
      </div>
    </div>
  );
}