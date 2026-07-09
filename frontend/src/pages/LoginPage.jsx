import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useData } from "../context/DataContext.jsx";
import { Building2, Eye, EyeOff, Lock, UserCircle2, ShieldCheck } from "lucide-react";
import { toast } from "react-toastify";
import logo from "../assests/logo 1.png";

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ 
        backgroundImage: "radial-gradient(circle at 2px 2px, #21579D 1px, transparent 0)", 
        backgroundSize: "40px 40px" 
      }} />
      
      {/* Gradient orbs */}
      <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px]" style={{ backgroundColor: 'rgba(33, 87, 157, 0.08)', borderRadius: '50%', filter: 'blur(80px)' }} />
      <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px]" style={{ backgroundColor: 'rgba(33, 87, 157, 0.06)', borderRadius: '50%', filter: 'blur(80px)' }} />

      <div className="relative w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        {/* Left branding - Logo */}
        <div className="hidden lg:flex items-center justify-center">
          <img 
            src={logo} 
            alt="Company Logo" 
            className="max-w-full max-h-[400px] object-contain"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextElementSibling.style.display = 'flex';
            }}
          />
          <div className="hidden items-center gap-3" style={{display: 'none'}}>
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/30">
              <Building2 size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">RealEstate EMS</h1>
              <p className="text-blue-300/80 text-sm font-light tracking-wider">Enterprise Management System</p>
            </div>
          </div>
        </div>

        {/* Login card */}
        <div className="bg-white rounded-3xl shadow-2xl shadow-gray-200/70 p-8 lg:p-10 border border-gray-100">
          <div className="flex items-center gap-3 mb-2 lg:hidden">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{ backgroundColor: '#21579D', boxShadow: '0 4px 12px rgba(33, 87, 157, 0.3)' }}>
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
                <UserCircle2 size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#21579D' }} />
                <input
                  type="text"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  placeholder="Enter the user ID"
                  required
                  className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm text-gray-900 placeholder-gray-400 bg-white/50 outline-none transition-all duration-200 group-hover:border-gray-300"
                  onFocus={(e) => { e.target.style.borderColor = '#21579D'; e.target.style.boxShadow = '0 0 0 4px rgba(33, 87, 157, 0.1)'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-semibold text-gray-700">Password</label>
                <button type="button" className="text-xs font-medium transition-colors" style={{ color: '#21579D' }}>
                  Forgot password?
                </button>
              </div>
              <div className="relative group">
                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#21579D' }} />
                <input
                  type={showPassword ? "text" : "password"} 
                  value={password} 
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  required
                  className="w-full border border-gray-200 rounded-xl pl-10 pr-10 py-3 text-sm text-gray-900 placeholder-gray-400 bg-white/50 outline-none transition-all duration-200 group-hover:border-gray-300"
                  onFocus={(e) => { e.target.style.borderColor = '#21579D'; e.target.style.boxShadow = '0 0 0 4px rgba(33, 87, 157, 0.1)'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
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
              className="w-full text-white font-semibold py-3.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.98]"
              style={{ backgroundColor: '#21579D', boxShadow: '0 4px 14px rgba(33, 87, 157, 0.3)' }}
              onMouseEnter={(e) => { e.target.style.backgroundColor = '#1a4680'; e.target.style.boxShadow = '0 6px 20px rgba(33, 87, 157, 0.4)'; }}
              onMouseLeave={(e) => { e.target.style.backgroundColor = '#21579D'; e.target.style.boxShadow = '0 4px 14px rgba(33, 87, 157, 0.3)'; }}
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
          <p className="text-center text-xs text-gray-400 mt-6 border-t border-gray-100 pt-6">
            Protected by industry-grade security
          </p>
        </div>
      </div>
    </div>
  );
}