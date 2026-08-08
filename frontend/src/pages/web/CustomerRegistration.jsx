import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useData } from "../../context/DataContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { customer } from "../../api/customer.js";
import { siteVisit } from "../../api/siteVisit.js";
import { mapsApi } from "../../api/maps.js";
import { User, Phone, MapPin, Calendar, Building2, FileText, CheckCircle, Navigation, Users, Briefcase, DollarSign, ArrowLeft, ArrowRight, Clock, Search, Compass, Car } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const timeSlots = [
  "07:00",
  "07:30",
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
];

const formatSlot = (slot) => {
  const [hour, minute] = slot.split(":").map(Number);
  const suffix = hour === 12 ? "PM" : "AM";
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${String(displayHour).padStart(2, "0")}:${String(minute).padStart(2, "0")} ${suffix}`;
};

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
    projectId: "",
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
  const [timeLeft, setTimeLeft] = useState(0);
  const [otpTimer, setOtpTimer] = useState(null);
  const [errors, setErrors] = useState({});
  const [locLoading, setLocLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [distanceInfo, setDistanceInfo] = useState(null);
  const [distLoading, setDistLoading] = useState(false);

  const approvedSites = sites.filter(s => s.status === "Active");
  const selectedProject = approvedSites.find(s => s.id === +form.projectId);
  const availablePlots = selectedProject?.plots?.filter(p => p.status === "Active") || [];
  const selectedSite = availablePlots.find(p => p.id === +form.siteId);

  const salesManager = {
    name: user?.name ,
    role: user?.role ,
    mobile: user?.mobile,
    id: user?.id,
  };

  const handleLocationInputChange = async (val) => {
    setForm(p => ({ ...p, location: val }));
    if (val && val.trim().length > 2) {
      try {
        const res = await mapsApi.getAutocomplete(val);
        if (res?.suggestions) {
          setSuggestions(res.suggestions);
          setShowSuggestions(true);
        }
      } catch (err) {
        console.warn("Autocomplete error:", err);
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = async (sug) => {
    setForm(p => ({ ...p, location: sug.description }));
    setShowSuggestions(false);
    try {
      const geocodeRes = await mapsApi.geocode(sug.description);
      if (geocodeRes?.formatted_address) {
        setForm(p => ({ ...p, location: geocodeRes.formatted_address }));
      }
    } catch (err) {
      console.warn("Geocode error:", err);
    }
  };

  const getLocation = () => {
    setLocLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async pos => {
          const latlngStr = `${pos.coords.latitude.toFixed(6)},${pos.coords.longitude.toFixed(6)}`;
          try {
            const geoRes = await mapsApi.geocode(null, latlngStr);
            if (geoRes?.formatted_address) {
              setForm(p => ({ ...p, location: geoRes.formatted_address }));
              toast.success("Location captured & address resolved!");
            } else {
              setForm(p => ({ ...p, location: latlngStr }));
              toast.success("GPS coordinates captured!");
            }
          } catch (e) {
            setForm(p => ({ ...p, location: latlngStr }));
            toast.success("GPS coordinates captured!");
          } finally {
            setLocLoading(false);
          }
        },
        async () => {
          const demoLatlng = "12.971598,77.594566";
          try {
            const geoRes = await mapsApi.geocode(null, demoLatlng);
            setForm(p => ({ ...p, location: geoRes?.formatted_address || "MG Road, Bengaluru" }));
          } catch (e) {
            setForm(p => ({ ...p, location: "MG Road, Bengaluru" }));
          }
          setLocLoading(false);
          toast.info("Sample location set");
        }
      );
    } else {
      setForm(p => ({ ...p, location: "MG Road, Bengaluru" }));
      setLocLoading(false);
    }
  };

  // Recalculate distance whenever pickup location or selected project changes
  useEffect(() => {
    const calcDist = async () => {
      if (form.location && form.location.trim().length > 3 && selectedProject?.location) {
        setDistLoading(true);
        try {
          const res = await mapsApi.calculateDistance(form.location, selectedProject.location);
          if (res && res.success) {
            setDistanceInfo(res);
          } else {
            setDistanceInfo(null);
          }
        } catch (err) {
          console.warn("Distance calc failed:", err);
          setDistanceInfo(null);
        } finally {
          setDistLoading(false);
        }
      } else {
        setDistanceInfo(null);
      }
    };
    const timer = setTimeout(calcDist, 600);
    return () => clearTimeout(timer);
  }, [form.location, selectedProject]);

  const startOtpTimer = () => {
    if (otpTimer) clearInterval(otpTimer);
    const expiresAt = Date.now() + 300000;
    setTimeLeft(300);

    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
        setOtpTimer(null);
        setOtpSent(false);
        setOtp("");
        toast.info("OTP expired. Please request a new one.");
      }
    }, 1000);
    setOtpTimer(timer);
  };

  const sendOtp = async () => {
    if (!form.mobile || form.mobile.length !== 10) {
      toast.error("Enter valid 10-digit mobile number");
      return;
    }

    // Load existing customer details if available (but still send OTP for verification)
    try {
      const duplicateCheck = await customer.checkDuplicate(form.mobile, form.email || null);
      if (duplicateCheck && duplicateCheck.duplicate && duplicateCheck.message && duplicateCheck.message.exists) {
        const existing = duplicateCheck.message.customer;
        if (existing) {
          setForm(p => ({
            ...p,
            name: existing.name || p.name,
            email: existing.email || p.email,
            address: existing.address || p.address,
            pinCode: existing.pinCode || p.pinCode,
            occupation: existing.occupation || p.occupation,
          }));
          toast.info("Customer found. Details loaded. Sending OTP for verification...");
        }
      }
    } catch (err) {
      console.warn("Duplicate check failed, proceeding anyway:", err);
    }

    setOtpSent(false);
    setOtpVerified(false);
    setOtp("");

    try {
      await customer.requestOtp(form.mobile);
      toast.success("OTP sent to mobile via WhatsApp!");
      setOtpSent(true);
      setErrors({});
      startOtpTimer();
    } catch (err) {
      toast.error(err.message || "Failed to send OTP");
    }
  };

  const verifyOtp = async () => {
    try {
      await customer.verifyOtp(form.mobile, otp);
      setOtpVerified(true);
      toast.success("Mobile verified!");
      if (otpTimer) clearInterval(otpTimer);
    } catch (err) {
      toast.error(err.message || "Invalid OTP");
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

    if (!form.projectId) {
      newErrors.projectId = "Please select a project";
      errorMessages.push("Please select a project");
    }
    if (!form.visitDate) {
      newErrors.visitDate = "Visit date is required";
      errorMessages.push("Visit date is required");
    }
    if (!form.visitTime) {
      newErrors.visitTime = "Visit time is required";
      errorMessages.push("Visit time is required");
    } else {
      const [h, m] = form.visitTime.split(":").map(Number);
      const totalMinutes = h * 60 + m;
      if (totalMinutes > 12 * 60) {
        newErrors.visitTime = "Site visit registration is allowed only until 12:00 PM.";
        errorMessages.push("Site visit registration is allowed only until 12:00 PM.");
      }
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
      if (!otpVerified) {
        toast.error("Please verify OTP before proceeding to the next step");
        return;
      }
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
      // Step 1: Create or find customer
      const customerPayload = {
        name: form.name,
        email: form.email || undefined,
        mobile: form.mobile,
        address: form.address,
        pinCode: form.pinCode,
        occupation: form.occupation,
        createdBy: user?.id,
      };
      const customerRes = await customer.registerCustomer(customerPayload);
      const createdCustomer = customerRes.data;

      // Step 2: Create site visit for this customer
      const visitPayload = {
        customerId: createdCustomer.id,
        projectId: Number(form.projectId),
        ...(form.siteId ? { siteId: Number(form.siteId) } : {}),
        visitDate: form.visitDate,
        visitTime: form.visitTime,
        persons: Number(form.persons),
        pickupLocation: form.location,
        purchaseMode: form.purchaseMode,
        notes: form.notes,
        status: form.status,
        assignedTo: user?.id,
        driverName: form.driverName,
        driverMobile: form.driverMobile,
        cabNumber: form.cabNumber,
      };

      await siteVisit.create(visitPayload);
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
      } else {
        toast.error(err.message || "Registration failed. Please try again.");
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
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <User size={24} className="text-purple-600 flex-shrink-0" /> Site Visit Registration
        </h1>
        <p className="text-slate-500 text-sm mt-1">Register new customer and schedule site visit</p>
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
                  {timeLeft > 0 && (
                    <div className="mt-1.5 flex items-center gap-1.5 text-xs">
                      <span className={`font-medium ${timeLeft <= 30 ? "text-red-500" : "text-gray-500"}`}>
                        OTP expires in {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                      </span>
                      {timeLeft <= 30 && (
                        <span className="text-red-500 font-semibold animate-pulse ml-1">Expiring soon!</span>
                      )}
                    </div>
                  )}
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
                <select value={form.projectId} onChange={e => setForm(p => ({ ...p, projectId: e.target.value, siteId: "" }))} className={`input-field ${errors.projectId ? 'border-red-500' : ''}`}>
                  <option value="">Choose project…</option>
                  {approvedSites.map(s => <option key={s.id} value={s.id}>{s.name} — {s.location}</option>)}
                </select>
                {errors.projectId && <p className="text-xs text-red-500 mt-1">{errors.projectId}</p>}
              </F>

              {selectedProject && (
                <div className="md:col-span-2 bg-blue-50 rounded-xl p-4 flex items-center gap-4">
                  {selectedProject.images?.[0] && <img src={selectedProject.images[0]} className="w-20 h-20 rounded-xl object-cover flex-shrink-0" alt={selectedProject.name} />}
                  <div>
                    <div className="font-semibold text-gray-800">{selectedProject.name}</div>
                    <div className="text-sm text-gray-500">{selectedProject.location}</div>
                    <div className="text-sm text-blue-600 font-medium mt-1">{selectedProject.availablePlots} available · ₹{Number(selectedProject.pricePerSqft).toLocaleString("en-IN")}/sqft</div>
                  </div>
                </div>
              )}

              {form.projectId && (
                <F label="Select Site / Plot (optional)" icon={MapPin} className="md:col-span-2">
                  <select value={form.siteId} onChange={e => setForm(p => ({ ...p, siteId: e.target.value }))} className="input-field">
                    <option value="">Choose site…</option>
                    {availablePlots.map(p => <option key={p.id} value={p.id}>Site {p.siteNo} — {p.facing} — {Number(p.totalSqft).toLocaleString("en-IN")} sqft</option>)}
                  </select>
                </F>
              )}

              {selectedSite && (
                <div className="md:col-span-2 bg-green-50 rounded-xl p-4 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                    <MapPin size={24} className="text-green-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800">Site {selectedSite.siteNo}</div>
                    <div className="text-sm text-gray-500">{selectedSite.facing} · {Number(selectedSite.totalSqft).toLocaleString("en-IN")} sqft</div>
                    <div className="text-sm text-green-600 font-medium mt-1">₹{Number(selectedSite.pricePerSqft).toLocaleString("en-IN")}/sqft</div>
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
                <select
                  value={form.visitTime}
                  onChange={e => setForm(p => ({ ...p, visitTime: e.target.value }))}
                  className={`input-field ${errors.visitTime ? 'border-red-500' : ''}`}
                >
                  <option value="">Choose time…</option>
                  {timeSlots.map(slot => (
                    <option key={slot} value={slot}>{formatSlot(slot)}</option>
                  ))}
                </select>
                {errors.visitTime && <p className="text-xs text-red-500 mt-1">{errors.visitTime}</p>}
              </F>

              <F label="Number of Persons" icon={Users} required>
                <input type="text" value={form.persons} onChange={e => setForm(p => ({ ...p, persons: e.target.value.replace(/[^\d]/g, '') }))}
                  className="input-field" placeholder="1" maxLength={2} />
              </F>

              <F label="Pickup Location & Map Route" icon={MapPin} className="md:col-span-2">
                <div className="relative">
                  <div className="flex gap-2 items-center">
                    <div className="relative flex-1">
                      <input
                        value={form.location}
                        onChange={e => handleLocationInputChange(e.target.value)}
                        onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                        className="input-field w-full pr-8"
                        placeholder="Search pickup address or area…"
                      />
                      <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                    <button
                      type="button"
                      onClick={getLocation}
                      disabled={locLoading}
                      title="Use Current GPS Location"
                      className="flex-shrink-0 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center gap-1.5 h-[44px] shadow-sm shadow-blue-200"
                    >
                      {locLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Compass size={16} />}
                      {locLoading ? "" : "Detect GPS"}
                    </button>
                  </div>

                  {/* Place Autocomplete Suggestions Dropdown */}
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden divide-y divide-gray-50 max-h-56 overflow-y-auto animate-fadeIn">
                      {suggestions.map((sug, idx) => (
                        <div
                          key={sug.place_id || idx}
                          onClick={() => handleSelectSuggestion(sug)}
                          className="p-3 hover:bg-blue-50 cursor-pointer text-xs transition-colors flex items-start gap-2 text-gray-700"
                        >
                          <MapPin size={14} className="text-blue-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <div className="font-semibold text-gray-900">{sug.main_text}</div>
                            {sug.secondary_text && <div className="text-[11px] text-gray-400">{sug.secondary_text}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Distance & Travel Time Calculation */}
                {(distLoading || distanceInfo) && (
                  <div className="mt-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-3 flex items-center justify-between text-xs animate-fadeIn">
                    <div className="flex items-center gap-2 text-blue-900 font-medium">
                      <Car size={16} className="text-blue-600" />
                      <span>Route to Project Site:</span>
                    </div>
                    {distLoading ? (
                      <span className="text-blue-500 font-semibold animate-pulse text-[11px]">Calculating travel distance & duration…</span>
                    ) : distanceInfo ? (
                      <div className="flex items-center gap-3">
                        <span className="bg-blue-600 text-white px-2.5 py-1 rounded-full font-bold text-xs shadow-sm">
                          🚗 {distanceInfo.distanceText || `${distanceInfo.distanceKm} km`}
                        </span>
                        <span className="bg-indigo-600 text-white px-2.5 py-1 rounded-full font-bold text-xs shadow-sm">
                          ⏱️ {distanceInfo.durationText || `${distanceInfo.durationMins} mins`}
                        </span>
                      </div>
                    ) : null}
                  </div>
                )}

                {/* Google Map View Box */}
                {form.location && (
                  <div className="mt-3 rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-gray-50 relative group">
                    <iframe
                      title="Pickup Location Map"
                      width="100%"
                      height="220"
                      style={{ border: 0 }}
                      loading="lazy"
                      allowFullScreen
                      src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyAfUP27GUuOL0cBm_ROdjE2n6EyVKesIu8&q=${encodeURIComponent(form.location)}`}
                    />
                    <div className="p-2.5 bg-white/90 backdrop-blur-sm border-t border-gray-100 flex items-center justify-between text-xs text-gray-600">
                      <span className="truncate max-w-[80%] font-medium flex items-center gap-1.5">
                        <MapPin size={14} className="text-red-500 flex-shrink-0" /> {form.location}
                      </span>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(form.location)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 font-bold hover:underline flex-shrink-0"
                      >
                        Open Maps ↗
                      </a>
                    </div>
                  </div>
                )}
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
                ["Project", selectedProject?.name || "—"],
                ["Site / Plot", selectedSite ? `Site ${selectedSite.siteNo} (${selectedSite.facing})` : null],
                ["Purchase Mode", form.purchaseMode],
                ["Visit Date", form.visitDate],
                ["Visit Time", form.visitTime ? (() => { const [h,m] = form.visitTime.split(':'); const hour = parseInt(h,10); const ampm = hour >= 12 ? 'PM' : 'AM'; const hour12 = hour % 12 || 12; return `${hour12}:${m} ${ampm}`; })() : '—'],
                ["Number of Persons", form.persons],
                ["Pickup Location", form.location || "—"],
                ["User", (
                  <div className="text-right">
                    <div>{salesManager.name}</div>
                    {salesManager.employeeCode && <div className="text-xs text-gray-400 font-mono">{salesManager.employeeCode}</div>}
                  </div>
                )],
                ["Sales Manager Mobile", salesManager.mobile],
              ]
                .filter(([k, v]) => v !== null)
                .map(([k, v]) => (
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