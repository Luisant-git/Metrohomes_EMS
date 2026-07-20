import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useData } from "../../context/DataContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { User, Phone, MapPin, Calendar, Building2, FileText, CheckCircle, Navigation, Users, Briefcase, DollarSign, ArrowLeft, ArrowRight, Car } from "lucide-react";
import toast from "react-hot-toast";

function FormField({ label, icon: Icon, children, required, className }) {
  return (
    <div className={(className ? className + " " : "") + "space-y-2"}>
      <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
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
  const { sites, addCustomer } = useData();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "", mobile: "", email: "", address: "", pinCode: "",
    occupation: "",
    location: "", siteId: "", visitDate: "", visitTime: "",
    persons: "", purchaseMode: "Own Funding",
    notes: "", status: "Interested",
  });
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);

  const approvedSites = sites.filter(s => s.status === "Active");
  const selectedSite = approvedSites.find(s => s.id === +form.siteId);

  const salesManager = {
    name: user?.name || "Sales Manager",
    mobile: "9876543210",
    id: user?.id || 6,
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
      siteName: selectedSite?.name || "",
      salesManagerId: salesManager.id,
      salesManagerName: salesManager.name,
      salesManagerMobile: salesManager.mobile,
    });
    toast.success("Customer registered & visit scheduled! 🎉");
    navigate("/customers");
  };



  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
          <User size={24} /> Customer Registration
        </h1>
        <p className="text-gray-400 text-sm mt-1">Register new customer and schedule site visit</p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2">
        {[1, 2, 3].map(s => (
          <div key={s} className="flex-1 flex items-center gap-2">
            <div className={`flex-1 h-2 rounded-full transition-all ${s <= step ? "bg-blue-600" : "bg-gray-100"}`} />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${s <= step ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-400"}`}>
              {s <= step && step > 1 ? <CheckCircle size={16} /> : s}
            </div>
          </div>
        ))}
      </div>
      <div className="text-xs text-gray-400 font-semibold uppercase tracking-wide">
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

              <F label="Mobile Number" icon={Phone} required>
                <div className="flex gap-2">
                  <input type="tel" value={form.mobile} onChange={e => setForm(p => ({ ...p, mobile: e.target.value }))}
                    className="input-field flex-1" placeholder="10-digit number" maxLength={10} disabled={otpVerified} />
                  {!otpVerified && (
                    <button onClick={sendOtp} className="flex-shrink-0 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
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
                    <button onClick={verifyOtp} className="flex-shrink-0 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
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

              <F label="Email (optional)">
                <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  className="input-field" placeholder="customer@email.com" />
              </F>

              <F label="Pin Code" required>
                <input type="number" value={form.pinCode} onChange={e => setForm(p => ({ ...p, pinCode: e.target.value }))}
                  className="input-field" placeholder="6-digit pin code" maxLength={6} />
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
          <div className="space-y-5 animate-fadeIn">
            <div className="bg-green-50 rounded-xl p-4 text-sm text-green-700 font-medium">
              Select project and schedule visit
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <div className="font-bold text-gray-800">{selectedSite.name}</div>
                    <div className="text-sm text-gray-500">{selectedSite.location}</div>
                    <div className="text-sm text-blue-600 font-semibold mt-1">{selectedSite.availablePlots} plots · ₹{Number(selectedSite.pricePerSqft).toLocaleString("en-IN")}/sqft</div>
                  </div>
                </div>
              )}

              <F label="Purchase Mode" icon={DollarSign} required className="md:col-span-2">
                <div className="grid grid-cols-2 gap-3 max-w-md">
                  {["Own Funding", "Loan"].map(mode => (
                    <label key={mode} className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 cursor-pointer transition-all ${form.purchaseMode === mode ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"}`}>
                      <input type="radio" name="purchaseMode" value={mode} checked={form.purchaseMode === mode} onChange={e => setForm(p => ({ ...p, purchaseMode: e.target.value }))} className="hidden" />
                      <span className="font-semibold">{mode}</span>
                    </label>
                  ))}
                </div>
              </F>

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

              <F label="Number of Persons" icon={Users} required>
                <input type="text" value={form.persons} onChange={e => setForm(p => ({ ...p, persons: e.target.value.replace(/[^\d]/g, '') }))}
                  className="input-field" placeholder="1" maxLength={2} />

              </F>

              <F label="Pickup Location" icon={MapPin}>
                <div className="flex gap-2">
                  <input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                    className="input-field flex-1" placeholder="lat,lng or address" />
                  <button type="button" className="flex-shrink-0 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
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
                ["Visit Time", form.visitTime],
                ["Number of Persons", form.persons],
                ["Pickup Location", form.location || "—"],
                ["Sales Manager", salesManager.name],
                ["Sales Manager Mobile", salesManager.mobile],
              ].map(([k, v]) => (
                <div key={k} className="flex items-start justify-between px-5 py-3">
                  <span className="text-sm text-gray-500 font-medium">{k}</span>
                  <span className="text-sm font-semibold text-gray-800 text-right max-w-[60%]">{v}</span>
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
          <button onClick={() => setStep(s => s - 1)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2">
            <ArrowLeft size={18} /> Back
          </button>
        )}
        <button onClick={() => step < 3 ? setStep(s => s + 1) : handleSubmit()}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2">
          {step === 3 ? "✅ Submit Registration" : <>Continue <ArrowRight size={18} /></>}
        </button>
      </div>
    </div>
  );
}