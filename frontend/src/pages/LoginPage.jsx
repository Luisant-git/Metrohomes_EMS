import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useData } from "../context/DataContext.jsx";
import { Building2, Eye, EyeOff, Lock, UserCircle2, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";

export default function LoginPage() {
  const { login } = useAuth();
  const { users } = useData();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      const res = login(identifier, password, users);
      if (!res.success) { toast.error(res.error); }
      else { toast.success(`Welcome back, ${res.user.name}!`); }
      setLoading(false);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-[0.04]" style={{ 
        backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", 
        backgroundSize: "40px 40px" 
      }} />
      
      {/* Gradient orbs */}
      <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-3xl" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-3xl" />

      <div className="relative w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        {/* Left branding */}
        <div className="text-white hidden lg:block">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/30">
              <Building2 size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">RealEstate EMS</h1>
              <p className="text-blue-300/80 text-sm font-light tracking-wider">Enterprise Management System</p>
            </div>
          </div>
          
       <h2 className="text-4xl xl:text-4xl font-extrabold leading-[1.2] tracking-tight whitespace-nowrap">
  Real Estate <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Management</span>
</h2>
          <div className="h-px w-20 bg-gradient-to-r from-blue-500/50 to-transparent mb-6" />
          
          <p className="text-slate-400 text-lg leading-relaxed max-w-sm">
            Unified platform for <span className="text-slate-300 font-medium">Admin</span>, 
            <span className="text-slate-300 font-medium"> Directors</span>, 
            <span className="text-slate-300 font-medium"> Regional Managers</span>, 
            <span className="text-slate-300 font-medium"> Branch Managers</span>, 
            <span className="text-slate-300 font-medium"> BDMs</span> & 
            <span className="text-slate-300 font-medium"> Sales Managers</span>.
          </p>
          
          {/* Decorative role badges */}
          <div className="flex flex-wrap gap-2 mt-6">
            {['Admin', 'Director', 'Regional', 'Branch', 'BDM', 'Sales'].map((role) => (
              <span key={role} className="px-3 py-1 text-xs font-medium text-blue-300/60 bg-white/5 rounded-full border border-white/5 backdrop-blur-sm">
                {role}
              </span>
            ))}
          </div>
        </div>

        {/* Login card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl shadow-black/30 p-8 lg:p-10 border border-white/20">
          <div className="flex items-center gap-3 mb-2 lg:hidden">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Building2 size={20} className="text-white" />
            </div>
            <span className="font-bold text-gray-900 text-lg">RealEstate EMS</span>
          </div>
          
          <h3 className="text-2xl font-bold text-gray-900 mb-1">Welcome Back</h3>
          <p className="text-gray-500 text-sm mb-7">Sign in to your account to continue</p>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">User ID</label>
              <div className="relative group">
                <UserCircle2 size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="text"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  placeholder="Enter the user ID"
                  required
                  className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm text-gray-900 placeholder-gray-400 bg-white/50 outline-none transition-all duration-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-100/50 group-hover:border-gray-300"
                />
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-semibold text-gray-700">Password</label>
                <button type="button" className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors">
                  Forgot password?
                </button>
              </div>
              <div className="relative group">
                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type={showPassword ? "text" : "password"} 
                  value={password} 
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  required
                  className="w-full border border-gray-200 rounded-xl pl-10 pr-10 py-3 text-sm text-gray-900 placeholder-gray-400 bg-white/50 outline-none transition-all duration-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-100/50 group-hover:border-gray-300"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(p => !p)} 
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            
            <button 
              type="submit" 
              disabled={loading} 
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.01] active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Signing in…</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={18} />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          {/* Footer note */}
          <p className="text-center text-xs text-gray-400 mt-6">
            Protected by industry-grade security
          </p>
        </div>
      </div>
    </div>
  );
}