import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useData } from "../../context/DataContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { User, Phone, MapPin, Calendar, Building2, FileText, CheckCircle, Navigation, Users, Briefcase, IndianRupee, Clock } from "lucide-react";
import { toast } from "react-toastify";

// Success Modal Component
function SuccessModal({ isOpen, onClose, onViewCustomers }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 animate-fadeIn">
        <div className="flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle size={40} className="text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Registration Successful!</h3>
          <p className="text-sm text-gray-500 mb-6">Customer has been registered and visit scheduled successfully.</p>
          <div className="flex gap-3 w-full">
            <button onClick={onViewCustomers} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors text-sm">
              View Customers
            </button>
            <button onClick={onClose} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition-colors text-sm">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FormField({ label, icon: Icon, children, required, className }) {
  return (
    <div className={className || ""}>
      <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1.5">
        {Icon && <span className="w-5 h-5 flex items-center justify-center text-gray-400"><Icon size={14} /></span>}{label}{required && <span className="text-red-500">*</span>}
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

  const isMobile = typeof window !== "undefined" && window.innerWidth < 640;

  const prefillSite = location.state?.siteId;
  const prefillSiteName = location.state?.siteName;

  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "", mobile: "", email: "", address: "", pinCode: "",
    occupation: "",
    location: "", siteId: prefillSite || "", visitDate: "", visitTime: "09:00",
    persons: "", purchaseMode: "Own Funding",
    notes: "", status: "Interested",
  });
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [locLoading, setLocLoading] = useState(false);
  const [errors, setErrors] = useState({});

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
      setErrors({ mobile: "Enter valid 10-digit mobile number" });
      return;
    }

    // Check for duplicate mobile or email before sending OTP
    try {
      const { customer: customerApi } = await import("../../api/customer.js");
      const duplicateCheck = await customerApi.checkDuplicate(form.mobile, form.email || null);
      
      if (duplicateCheck && !duplicateCheck.success && duplicateCheck.duplicate) {
        // Reset OTP state so user can edit mobile number
        setOtpSent(false);
        setOtpVerified(false);
        setOtp("");
        
        toast.error(duplicateCheck.message || "Customer with this mobile/email already exists");
        if (duplicateCheck.message?.toLowerCase().includes('mobile')) {
          setErrors({ mobile: duplicateCheck.message });
        } else if (duplicateCheck.message?.toLowerCase().includes('email')) {
          setErrors({ email: duplicateCheck.message });
        }
        return;
      }
    } catch (err) {
      console.warn("Duplicate check failed, proceeding anyway:", err);
    }

    // Reset OTP state before sending new OTP
    setOtpSent(false);
    setOtpVerified(false);
    setOtp("");
    
    // Demo OTP
    toast.success(`Demo OTP: 1234`);
    setOtpSent(true);
    setErrors({});
  };

  const verifyOtp = () => {
    if (otp === "1234") {
      setOtpVerified(true);
      toast.success("Mobile verified!");
      setErrors({});
    } else {
      setErrors({ otp: "Invalid OTP" });
    }
  };

  const validateStep1 = () => {
    const newErrors = {};
    let errorMessages = [];

    if (!form.name) {
      newErrors.name = "Applicant name is required";
      errorMessages.push("Applicant name is required");
    }
    if (!form.mobile) {
      newErrors.mobile = "Mobile number is required";
      errorMessages.push("Mobile number is required");
    } else if (form.mobile.length !== 10) {
      newErrors.mobile = "Enter valid 10-digit mobile number";
      errorMessages.push("Enter valid 10-digit mobile number");
    }
    if (form.email && !/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = "Enter valid email address";
      errorMessages.push("Enter valid email address");
    }
    if (!form.address) {
      newErrors.address = "Address is required";
      errorMessages.push("Address is required");
    }
    if (!form.pinCode) {
      newErrors.pinCode = "Pin code is required";
      errorMessages.push("Pin code is required");
    } else if (form.pinCode.length !== 6) {
      newErrors.pinCode = "Pin code must be 6 digits";
      errorMessages.push("Pin code must be 6 digits");
    }
    if (!form.occupation) {
      newErrors.occupation = "Occupation is required";
      errorMessages.push("Occupation is required");
    }

    setErrors(newErrors);

    if (errorMessages.length > 0) {
      toast.error(errorMessages[0]);
    }

    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};
    let errorMessages = [];

    if (!form.siteId) {
      newErrors.siteId = "Please select a project";
      errorMessages.push("Please select a project");
    }
    if (!form.visitDate) {
      newErrors.visitDate = "Visit date is required";
      errorMessages.push("Visit date is required");
    }
    if (!form.visitTime) {
      newErrors.visitTime = "Visit time is required";
      errorMessages.push("Visit time is required");
    }
    if (!form.persons) {
      newErrors.persons = "Number of persons is required";
      errorMessages.push("Number of persons is required");
    } else if (Number(form.persons) < 1) {
      newErrors.persons = "At least 1 person required";
      errorMessages.push("At least 1 person required");
    }
    if (!form.purchaseMode) {
      newErrors.purchaseMode = "Purchase mode is required";
      errorMessages.push("Purchase mode is required");
    }

    setErrors(newErrors);

    if (errorMessages.length > 0) {
      toast.error(errorMessages[0]);
    }

    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    setErrors({});
    if (step === 1 && !validateStep1()) {
      return;
    }
    if (step === 2 && !validateStep2()) {
      return;
    }
    setStep(s => s + 1);
  };

  const handleSubmit = async () => {
    const step1Valid = validateStep1();
    const step2Valid = validateStep2();

    if (!step1Valid || !step2Valid) {
      return;
    }

    if (!otpVerified) {
      toast.error("Please verify OTP to continue");
      return;
    }

    try {
      await addCustomer({
        name: form.name,
        mobile: form.mobile,
        email: form.email || undefined,
        address: form.address,
        pinCode: form.pinCode,
        occupation: form.occupation,
        location: form.location,
        siteId: +form.siteId,
        visitDate: form.visitDate,
        visitTime: form.visitTime,
        persons: Number(form.persons),
        purchaseMode: form.purchaseMode,
        notes: form.notes,
        status: "Interested",
        createdBy: user?.id,
      });
      setSuccessModalOpen(true);
    } catch (err) {
      if (err.response?.data?.errors) {
        const backendErrors = err.response.data.errors;
        let firstError = "";

        backendErrors.forEach(error => {
          const message = error.message || error.msg || "Invalid value";
          if (firstError === "") firstError = message;
        });

        if (firstError) {
          toast.error(firstError);
        } else {
          toast.error("Please fix the errors below");
        }
      } else if (err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else if (err.message) {
        toast.error(err.message);
      } else {
        toast.error("Registration failed. Please try again.");
      }
    }
  };

  const F = FormField;

  return (
    <div className="pb-40 relative z-10 max-w-2xl mx-auto">
      <SuccessModal
        isOpen={successModalOpen}
        onClose={() => setSuccessModalOpen(false)}
        onViewCustomers={() => navigate("/customers")}
      />
      {/* Header */}
      <div className="px-4 pt-4">
        <h2 className="text-lg font-extrabold text-gray-900 mb-1">Customer Registration</h2>
        <p className="text-xs text-gray-400 mb-3">Register new customer and schedule site visit</p>
        <div className="flex items-center mb-3">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex-1 flex items-center">
              <div className={`flex-1 h-1 rounded-full transition-all ${s <= step ? "bg-blue-600" : "bg-gray-100"}`} />
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${s < step ? "bg-blue-600 text-white" : s === step ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-400"}`}>
                {s < step ? <CheckCircle size={10} /> : s}
              </div>
            </div>
          ))}
        </div>
        <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">
          {step === 1 ? "Personal Info & Occupation" : step === 2 ? "Visit Details" : "Review & Submit"}
        </div>
      </div>

      <div className="px-4 mt-3 space-y-4">
        {/* Step 1: Personal Info & Occupation */}
        {step === 1 && (
          <div className="space-y-4 animate-fadeIn">
            <div className="bg-blue-50 rounded-xl p-2.5 text-xs font-medium text-blue-700 flex items-center gap-1.5">
              <User size={14} /> Enter customer details
            </div>

            <div className="grid grid-cols-1 gap-4">
              <F label="Applicant Name" icon={User} required>
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  className="input-field" placeholder="Full name" />
              </F>

              <F label="Mobile Number" icon={Phone} required>
                <div className="flex gap-2 items-center">
                  <input type="tel" value={form.mobile} onChange={e => setForm(p => ({ ...p, mobile: e.target.value }))}
                    className="input-field flex-1" placeholder="10-digit number" maxLength={10} disabled={otpVerified} />
                  {!otpVerified && (
                    <button onClick={sendOtp} className="flex-shrink-0 bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors h-[46px]">
                      Get OTP
                    </button>
                  )}
                </div>
              </F>

              {otpSent && !otpVerified && (
                <F label="Enter OTP" required>
                  <div className="flex gap-2 items-center">
                    <input type="text" value={otp} onChange={e => setOtp(e.target.value)}
                      className="input-field flex-1" placeholder="Enter 4-digit OTP" maxLength={4} />
                    <button onClick={verifyOtp} className="flex-shrink-0 bg-green-100 hover:bg-green-200 text-green-700 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors h-[46px]">
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

              <F label="Email">
                <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  className={`input-field ${errors.email ? 'border-red-500 focus:ring-red-500' : ''}`} placeholder="email@example.com (optional)" />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
              </F>

              <F label="Address" icon={MapPin} required>
                <textarea value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                  className="input-field h-20 resize-none" placeholder="Full address" />
              </F>

              <F label="Pin Code" required>
                <input 
                  type="text" 
                  inputMode="numeric"
                  value={form.pinCode} 
                  onChange={e => setForm(p => ({ ...p, pinCode: e.target.value.replace(/\D/g, '') }))}
                  className="input-field" 
                  placeholder="6-digit pin code" 
                  maxLength={6} 
                />
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
            <div className="bg-green-50 rounded-xl p-2.5 text-xs font-medium text-green-700 flex items-center gap-1.5">
              <Building2 size={14} /> Visit & purchase details
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

              <F label="Purchase Mode" icon={IndianRupee} required>
                <div className="grid grid-cols-2 gap-2">
                  {["Own Funding", "Loan"].map(mode => (
                    <label key={mode} className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 cursor-pointer transition-all ${form.purchaseMode === mode ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"}`}>
                      <input type="radio" name="purchaseMode" value={mode} checked={form.purchaseMode === mode} onChange={e => setForm(p => ({ ...p, purchaseMode: e.target.value }))} className="hidden" />
                      <IndianRupee size={12} className={form.purchaseMode === mode ? "text-blue-700" : "text-gray-400"} />
                      <span className="text-xs font-semibold">{mode}</span>
                    </label>
                  ))}
                </div>
              </F>

              <div className="grid grid-cols-1 gap-3">
                <F label="Visit Date" icon={Calendar} required>
                  <input
                    type="date"
                    value={form.visitDate}
                    onChange={e => setForm(p => ({ ...p, visitDate: e.target.value }))}
                    min={(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })()}
                    className={`input-field ${errors.visitDate ? 'border-red-500' : ''}`}
                  />
                </F>

                <F label="Visit Time" icon={Clock} required>
                  <input
                    type="time"
                    value={form.visitTime}
                    onChange={e => setForm(p => ({ ...p, visitTime: e.target.value }))}
                    className={`input-field ${errors.visitTime ? 'border-red-500' : ''}`}
                  />
                </F>
              </div>

              <F label="Number of Persons" icon={Users} required>
                <input type="text" value={form.persons} onChange={e => setForm(p => ({ ...p, persons: e.target.value.replace(/[^\d]/g, '') }))}
                  className="input-field" placeholder="1" maxLength={2} />
                {form.persons === '' && <p className="text-xs text-gray-400 mt-1">Enter number of persons</p>}
              </F>

              <F label="Pickup Location (GPS)" icon={MapPin}>
                <div className="flex gap-2 items-center">
                  <input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                    className="input-field flex-1" placeholder="lat,lng or use GPS" />
                  <button onClick={getLocation} disabled={locLoading}
                    className="flex-shrink-0 bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center gap-1 h-[46px]">
                    {locLoading ? <div className="w-4 h-4 border-2 border-blue-500 border-t transparent rounded-full animate-spin" /> : <Navigation size={14} />}
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
            <div className="bg-purple-50 rounded-xl p-2.5 text-xs font-medium text-purple-700 flex items-center gap-1.5">
              <CheckCircle size={14} /> Review details before submitting
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
                ["Visit Time", form.visitTime ? (() => { const [h,m] = form.visitTime.split(':'); const hour = parseInt(h,10); const ampm = hour >= 12 ? 'PM' : 'AM'; const hour12 = hour % 12 || 12; return `${hour12}:${m} ${ampm}`; })() : '—'],
                ["Persons", form.persons],
                ["Pickup", form.location || "—"],
                ["Notes", form.notes || "—"],
                ["Created By Role", salesManager.role],
                ["Sales Manager", salesManager.name],
                ["Sales Manager Mobile", salesManager.mobile],
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
        <div className="flex gap-2 items-center">
          {step > 1 && (
            <button onClick={() => setStep(s => s - 1)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 rounded-xl transition-colors text-sm">
              ← Back
            </button>
          )}
          <button onClick={() => step < 3 ? handleNextStep() : handleSubmit()}
            className={`${step > 1 ? "flex-1" : "w-full"} bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-xl shadow-md shadow-blue-200 transition-all flex items-center justify-center text-sm`}>
            {step === 3 ? "Submit Registration" : "Continue →"}
          </button>
        </div>
      </div>
    </div>
  );
}
