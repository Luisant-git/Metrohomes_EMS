import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useData } from "../../context/DataContext.jsx";
import { Users, ArrowLeft, User, Phone, Mail, Lock, Building2, MapPin } from "lucide-react";
import { toast } from "react-toastify";

function FormField({ label, icon: Icon, children, required }) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1.5">
        {Icon && <Icon size={14} className="text-gray-400" />}
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

export default function AddBranchManager() {
  const { user } = useAuth();
  const { addUser, users } = useData();
  const navigate = useNavigate();

  const allBMs = users.filter(u => u.role === "Branch Manager");
  const employeeCode = `BM-${String(allBMs.length + 1).padStart(3, '0')}`;

  const [form, setForm] = useState({
    name: "", mobile: "", email: "", password: "", branch: "", address: ""
  });

  const handleSubmit = () => {
    if (!form.name || !form.mobile || !form.email || !form.password || !form.branch) {
      toast.error("Please fill all required fields");
      return;
    }
    addUser({
      name: form.name,
      email: form.email,
      mobile: form.mobile,
      password: form.password,
      branch: form.branch,
      address: form.address,
      role: "Branch Manager",
      parentUserId: user.id,
      createdBy: user.id,
      status: "Active",
      employeeCode,
    }, user.id);
    toast.success("Branch Manager created successfully! 🎉");
    navigate("/my-team");
  };

  const F = FormField;
  return (
    <div className="pb-40 px-4 relative z-10">
      {/* Header */}
      <div className="pt-4">
        <button type="button" onClick={() => navigate("/my-team")} className="text-gray-500 hover:text-gray-800 p-3 flex items-center gap-2 -ml-1 rounded-2xl transition-colors">
          <ArrowLeft size={20} /> Back
        </button>
        <h2 className="text-2xl font-extrabold text-gray-900 mt-2 mb-3">Add Branch Manager</h2>

        <div className="bg-blue-50 rounded-3xl p-4 text-sm text-blue-700 font-medium">
          👤 Enter Branch Manager details
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <F label="Full Name" icon={User} required>
          <input
            value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            className="input-field"
            placeholder="Enter full name"
          />
        </F>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <F label="Mobile" icon={Phone} required>
            <input
              type="tel"
              value={form.mobile}
              onChange={e => setForm(p => ({ ...p, mobile: e.target.value }))}
              className="input-field"
              placeholder="10-digit number"
              maxLength={10}
            />
          </F>
          <F label="Email" icon={Mail} required>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              className="input-field"
              placeholder="email@example.com"
            />
          </F>
        </div>

        <F label="Password" icon={Lock} required>
          <input
            type="password"
            value={form.password}
            onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
            className="input-field"
            placeholder="Create password"
          />
        </F>

        <F label="Branch" icon={Building2} required>
          <input
            value={form.branch}
            onChange={e => setForm(p => ({ ...p, branch: e.target.value }))}
            className="input-field"
            placeholder="Branch name"
          />
        </F>

        <F label="Address" icon={MapPin}>
          <textarea
            value={form.address}
            onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
            className="input-field h-24 resize-none"
            placeholder="Full address"
          />
        </F>

        <div className="bg-gray-50 rounded-3xl p-4 text-xs text-gray-500">
          <strong>Employee Code:</strong> {employeeCode}
        </div>
      </form>

      {/* Fixed bottom button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 pb-5 bg-white border-t border-gray-100 z-30 pwa-safe-bottom">
        <div className="max-w-md mx-auto">
          <button
            type="button"
            onClick={handleSubmit}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-2xl shadow-xl shadow-blue-300 transition-all"
          >
            Create Branch Manager
          </button>
        </div>
      </div>
    </div>
  );
}