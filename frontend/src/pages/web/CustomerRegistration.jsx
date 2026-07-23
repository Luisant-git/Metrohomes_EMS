import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useData } from "../../context/DataContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { customer } from "../../api/customer.js";
import { useRef } from "react";
import { User, Phone, MapPin, Calendar, Building2, FileText, CheckCircle, Navigation, Users, Briefcase, DollarSign, ArrowLeft, ArrowRight, Clock } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function SuccessModal({ isOpen, onClose, onViewCustomers }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6">
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
    <div className={(className ? className + " " : "") + "space-y-2"}>
      <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
        {Icon && <Icon size={16} className="text-gray-500" />}
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

const F = FormField;


export default function CustomerRegistration() {
  const { sites, addCustomer, refreshCustomers } = useData();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "",
    mobile: "",
    email: "",
    address: "",
    pinCode: "",
    occupation: "",
    location: "",
    siteId: "",
    visitDate: "",
    visitTime: "09:00",
    persons: "",
    purchaseMode: "Own Funding",
    notes: "",
    status: "Interested",
  });
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [errors, setErrors] = useState({});

  const approvedSites = sites.filter(s => s.status === "Active");
  const selectedSite = approvedSites.find(s => s.id === +form.siteId);

  const salesManager = {
    name: user?.name || "Sales Manager",
    role: user?.role || "Sales Manager",
    mobile: user?.mobile || "9876543210",
    id: user?.id || 6,
  };

  const sendOtp = async () => {
    if (!form.mobile || form.mobile.length !== 10) {
      toast.error("Enter valid 10-digit mobile number");
      return;
    }

    try {
      const duplicateCheck = await customer.checkDuplicate(form.mobile, form.email || null);
      if (duplicateCheck && !duplicateCheck.success && duplicateCheck.duplicate) {
        // Reset OTP state so user can edit mobile number
        setOtpSent(false);
        setOtpVerified(false);
        setOtp("");
        
        toast.error(duplicateCheck.message || "Customer with this mobile/email already exists");
        if (duplicateCheck.message?.toLowerCase().includes('mobile')) {
          setErrors((prev) => ({ ...prev, mobile: duplicateCheck.message }));
        } else if (duplicateCheck.message?.toLowerCase().includes('email')) {
          setErrors((prev) => ({ ...prev, email: duplicateCheck.message }));
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
    if (!form.pinCode) {
      newErrors.pinCode = "Pin code is required";
      errorMessages.push("Pin code is required");
    } else if (form.pinCode.length !== 6) {
      newErrors.pinCode = "Pin code must be 6 digits";
      errorMessages.push("Pin code must be 6 digits");
    }
    if (!form.address) {
      newErrors.address = "Address is required";
      errorMessages.push("Address is required");
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
    if (step === 1) {
      const isValid = validateStep1();
      if (!isValid) return;
    }
    if (step === 2) {
      const isValid = validateStep2();
      if (!isValid) return;
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
      const payload = {
        name: form.name,
        email: form.email || undefined,
        mobile: form.mobile,
        address: form.address,
        pinCode: form.pinCode,
        visitDate: form.visitDate,
        visitTime: form.visitTime,
        persons: Number(form.persons),
        location: form.location,
        notes: form.notes,
        occupation: form.occupation,
        siteId: Number(form.siteId),
        purchaseMode: form.purchaseMode,
        createdBy: user?.id,
      };
      await customer.registerCustomer(payload);
      // Refresh customers list to show the newly created customer
      await refreshCustomers();
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


  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <SuccessModal
        isOpen={successModalOpen}
        onClose={() => setSuccessModalOpen(false)}
        onViewCustomers={() => navigate("/customers")}
      />
      <div>
        <h1 className="text-2xl font-normal text-gray-900 flex items-center gap-2">
          <User size={24} /> Site Visit Registration
        </h1>
        <p className="text-gray-400 text-sm mt-1">Register new customer and schedule site visit</p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2">
        {[1, 2, 3].map(s => (
          <div key={s} className="flex-1 flex items-center gap-2">
            <div className={`flex-1 h-2 rounded-full transition-all ${s <= step ? "bg-blue-600" : "bg-gray-100"}`} />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${s <= step ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-400"}`}>
              {s <= step && step > 1 ? <CheckCircle size={16} /> : s}
            </div>
          </div>
        ))}
      </div>
      <div className="text-xs text-gray-400 font-medium uppercase tracking-wide">
        {step === 1 ? "Personal Info & Occupation" : step === 2 ? "Visit & Purchase Details" : "Review & Submit"}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        {/* Step 1: Personal Info & Occupation */}
        {step === 1 && (
          <div className="space-y-5 animate-fadeIn">
            <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-700 font-medium">
              Enter customer details and verify mobile number
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <F label="Applicant Name" icon={User} required>
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  className="input-field" placeholder="Full name" />
              </F>

              <F label="Email" icon={User}>
                <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  className="input-field" placeholder="email@example.com (optional)" />
              </F>

              <F label="Mobile Number" icon={Phone} required>
                <div className="flex gap-2">
                  <input type="tel" value={form.mobile} onChange={e => setForm(p => ({ ...p, mobile: e.target.value }))}
                    className="input-field flex-1" placeholder="10-digit number" maxLength={10} disabled={otpVerified} />
                  {!otpVerified && (
                    <button onClick={sendOtp} className="flex-shrink-0 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
                      Get OTP
                    </button>
                  )}
                </div>
              </F>

              {otpSent && !otpVerified && (
                <F label="Enter OTP" required className="md:col-span-2">
                  <div className="flex gap-2 max-w-sm">
                    <input type="text" value={otp} onChange={e => setOtp(e.target.value)}
                      className="input-field flex-1" placeholder="Enter 4-digit OTP" maxLength={4} />
                    <button onClick={verifyOtp} className="flex-shrink-0 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
                      Verify
                    </button>
                  </div>
                </F>
              )}

              {otpVerified && (
                <div className="md:col-span-2 bg-green-50 rounded-xl p-3 text-sm text-green-700 font-medium flex items-center gap-2">
                  <CheckCircle size={18} /> Mobile verified ✓
                </div>
              )}

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

              <F label="Address" icon={MapPin} required className="md:col-span-2">
                <textarea value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                  className="input-field h-24 resize-none" placeholder="Full address" />
              </F>

              <F label="Occupation" icon={Briefcase} required className="md:col-span-2">
                <div className="grid grid-cols-3 gap-3">
                  {["Self Employed", "Salaried", "Business"].map(occ => (
                    <label key={occ} className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 cursor-pointer transition-all ${form.occupation === occ ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"}`}>
                      <input type="radio" name="occupation" value={occ} checked={form.occupation === occ} onChange={e => setForm(p => ({ ...p, occupation: e.target.value }))} className="hidden" />
                      <span className="text-sm font-medium">{occ}</span>
                    </label>
                  ))}
                </div>
              </F>
            </div>
          </div>
        )}

        {/* Step 2: Visit Details */}
        {step === 2 && (
          <div className="space-y-5 animate-fadeIn">
            <div className="bg-green-50 rounded-xl p-4 text-sm text-green-700 font-medium">
              Select project and schedule visit
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ overflow: 'visible' }}>
              <F label="Select Project" icon={Building2} required className="md:col-span-2">
                <select value={form.siteId} onChange={e => setForm(p => ({ ...p, siteId: e.target.value }))} className="input-field">
                  <option value="">Choose project…</option>
                  {approvedSites.map(s => <option key={s.id} value={s.id}>{s.name} — {s.location}</option>)}
                </select>
              </F>

              {selectedSite && (
                <div className="md:col-span-2 bg-blue-50 rounded-xl p-4 flex items-center gap-4">
                  {selectedSite.images?.[0] && <img src={selectedSite.images[0]} className="w-20 h-20 rounded-xl object-cover flex-shrink-0" alt={selectedSite.name} />}
                  <div>
                    <div className="font-semibold text-gray-800">{selectedSite.name}</div>
                    <div className="text-sm text-gray-500">{selectedSite.location}</div>
                    <div className="text-sm text-blue-600 font-medium mt-1">{selectedSite.availablePlots} plots · ₹{Number(selectedSite.pricePerSqft).toLocaleString("en-IN")}/sqft</div>
                  </div>
                </div>
              )}

              <F label="Purchase Mode" icon={DollarSign} required className="md:col-span-2">
                <div className="grid grid-cols-2 gap-3 max-w-md">
                  {["Own Funding", "Loan"].map(mode => (
                    <label key={mode} className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 cursor-pointer transition-all ${form.purchaseMode === mode ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"}`}>
                      <input type="radio" name="purchaseMode" value={mode} checked={form.purchaseMode === mode} onChange={e => setForm(p => ({ ...p, purchaseMode: e.target.value }))} className="hidden" />
                      <span className="font-medium">{mode}</span>
                    </label>
                  ))}
                </div>
              </F>

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

              <F label="Number of Persons" icon={Users} required>
                <input type="text" value={form.persons} onChange={e => setForm(p => ({ ...p, persons: e.target.value.replace(/[^\d]/g, '') }))}
                  className="input-field" placeholder="1" maxLength={2} />
              </F>

              <F label="Pickup Location" icon={MapPin}>
                <div className="flex gap-2">
                  <input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                    className="input-field flex-1" placeholder="lat,lng or address" />
                  <button type="button" className="flex-shrink-0 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-medium transition-colors">
                    <Navigation size={16} />
                  </button>
                </div>
              </F>

              <F label="Notes / Requirements" icon={FileText} className="md:col-span-2">
                <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                  className="input-field h-24 resize-none" placeholder="Plot size preference, budget, etc." />
              </F>
            </div>
          </div>
        )}

        {/* Step 3: Review */}
{step === 3 && (
  <div className="space-y-5 animate-fadeIn">
    <div className="bg-purple-50 rounded-xl p-4 text-sm text-purple-700 font-medium">
      Review all details before submitting
    </div>

    <div className="bg-gray-50 rounded-xl border border-gray-200 divide-y divide-gray-200">
      {[
        ["Applicant Name", form.name],
        ["Mobile Number", form.mobile],
        ["Email", form.email || "—"],
        ["Address", form.address],
        ["Pin Code", form.pinCode],
        ["Occupation", form.occupation],
        ["Project Interested", selectedSite?.name || "—"],
        ["Purchase Mode", form.purchaseMode],
        ["Visit Date", form.visitDate],
        ["Visit Time", form.visitTime ? (() => { const [h,m] = form.visitTime.split(':'); const hour = parseInt(h,10); const ampm = hour >= 12 ? 'PM' : 'AM'; const hour12 = hour % 12 || 12; return `${hour12}:${m} ${ampm}`; })() : '—'],
        ["Number of Persons", form.persons],
        ["Pickup Location", form.location || "—"],
        ["Created By", salesManager.role], // Changed from salesManager.name to salesManager.role
        ["Sales Manager", salesManager.name], // Added new field for Sales Manager name
        ["Sales Manager Mobile", salesManager.mobile], // Added mobile number
      ].map(([k, v]) => (
        <div key={k} className="flex items-start justify-between px-5 py-3">
          <span className="text-sm text-gray-500 font-medium">{k}</span>
          <span className="text-sm font-medium text-gray-800 text-right max-w-[60%]">{v}</span>
        </div>
      ))}
    </div>

    <div className="bg-blue-50 rounded-xl p-4 text-xs text-blue-700">
      <strong>Note:</strong> Customer will be registered with status <strong>"Interested"</strong> and visit will be scheduled.
    </div>
  </div>
)}
      </div>

      {/* Navigation Buttons */}
      <div className="flex gap-3">
        {step > 1 && (
          <button onClick={() => setStep(s => s - 1)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2">
            <ArrowLeft size={18} /> Back
          </button>
        )}
        <button onClick={() => step < 3 ? handleNextStep() : handleSubmit()}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2">
          {step === 3 ? "✅ Submit Registration" : <>Continue <ArrowRight size={18} /></>}
        </button>
      </div>
    </div>
  );
}