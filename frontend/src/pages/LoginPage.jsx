import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { Building2, Eye, EyeOff, Lock, Mail, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";

const DEMO_CREDS = [
  { role: "Admin", email: "admin@realestate.com", password: "admin123", color: "bg-red-50 text-red-700 border-red-200" },
  { role: "Director", email: "director@realestate.com", password: "dir123", color: "bg-purple-50 text-purple-700 border-purple-200" },
  { role: "Regional Manager", email: "rm@realestate.com", password: "rm123", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { role: "Branch Manager", email: "bm@realestate.com", password: "bm123", color: "bg-green-50 text-green-700 border-green-200" },
  { role: "BDM", email: "bdm@realestate.com", password: "bdm123", color: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  { role: "Sales Manager", email: "sm@realestate.com", password: "sm123", color: "bg-orange-50 text-orange-700 border-orange-200" },
];

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      const res = login(email, password);
      if (!res.success) { toast.error(res.error); }
      else { toast.success(`Welcome back, ${res.user.name}!`); }
      setLoading(false);
    }, 600);
  };

  const fillCreds = (cred) => {
    setEmail(cred.email);
    setPassword(cred.password);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "40px 40px" }} />

      <div className="relative w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Left branding */}
        <div className="text-white hidden lg:block">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl">
              <Building2 size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">RealEstate EMS</h1>
              <p className="text-blue-300 text-sm">Enterprise Management System</p>
            </div>
          </div>
          <h2 className="text-4xl font-extrabold leading-tight mb-4">
            Real Estate <br /><span className="text-blue-400">Management</span><br /> at Scale
          </h2>
          <p className="text-slate-400 text-lg mb-8 leading-relaxed">
            Unified platform for Admin, Directors, Regional Managers, Branch Managers, BDMs & Sales Managers.
          </p>
          <div className="space-y-3">
            {[
              { icon: "🌐", text: "Web Platform — Admin & Directors" },
              { icon: "📱", text: "PWA Mobile — Field Teams" },
              { icon: "📡", text: "Offline-first with Auto Sync" },
              { icon: "🔐", text: "Role-based access control" },
            ].map(f => (
              <div key={f.text} className="flex items-center gap-3 text-slate-300 text-sm">
                <span className="text-lg">{f.icon}</span>
                <span>{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Login card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 animate-fadeIn">
          <div className="flex items-center gap-3 mb-2 lg:hidden">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <Building2 size={20} className="text-white" />
            </div>
            <span className="font-bold text-gray-900">RealEstate EMS</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">Sign In</h3>
          <p className="text-gray-500 text-sm mb-6">Enter your credentials to access the system</p>

          <form onSubmit={handleLogin} className="space-y-4 mb-6">
            <div>
              <label className="label">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com" required
                  className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 bg-white outline-none transition-all duration-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                />
              </div>
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" required
                  className="w-full border border-gray-200 rounded-xl pl-10 pr-10 py-2.5 text-sm text-gray-900 placeholder-gray-400 bg-white outline-none transition-all duration-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                />
                <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-md shadow-blue-200">
              {loading ? (<><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Signing in…</>) : (<><ShieldCheck size={18} />Sign In</>)}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="border-t border-gray-100 pt-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Quick Demo Login</p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_CREDS.map(c => (
                <button key={c.role} onClick={() => fillCreds(c)}
                  className={`border text-left px-3 py-2 rounded-xl text-xs font-medium transition-all hover:shadow-sm ${c.color}`}>
                  <div className="font-bold">{c.role}</div>
                  <div className="opacity-70 truncate">{c.email}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
