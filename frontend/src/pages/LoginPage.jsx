import { useState } from "react";
import { auth } from "../api/auth.js";
import { Eye, EyeOff, Lock, UserCircle2, LogIn } from "lucide-react";
import { toast } from "react-toastify";
import logo from "../assests/logo 1.png";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await auth.login(identifier, pin);
      if (data.accessToken) {
        localStorage.setItem("authToken", data.accessToken);
      }
      if (data.user) {
        localStorage.setItem("re_user", JSON.stringify(data.user));
        toast.success(`Welcome back, ${data.user.name}!`);
      } else {
        toast.success("Login successful!");
      }
      setTimeout(() => window.location.reload(), 800);
    } catch (err) {
      toast.error(err.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 p-4 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ 
        backgroundImage: "radial-gradient(circle at 2px 2px, #6D8CB5 1px, transparent 0)", 
        backgroundSize: "40px 40px" 
      }} />
      
      {/* Gradient orbs */}
      <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px]" style={{ backgroundColor: 'rgba(109, 140, 181, 0.08)', borderRadius: '50%', filter: 'blur(80px)' }} />
      <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px]" style={{ backgroundColor: 'rgba(109, 140, 181, 0.06)', borderRadius: '50%', filter: 'blur(80px)' }} />

      <div className="relative w-full max-w-5xl flex items-center gap-12 lg:gap-16">
        {/* Left - Logo (hidden on mobile, shown on lg+) */}
        <div className="hidden lg:flex flex-1 items-center justify-center">
          <img 
            src={logo} 
            alt="Company Logo" 
            className="max-w-full max-h-[320px] object-contain"
          />
        </div>

        {/* Right - Login Card */}
        <div className="w-full max-w-md mx-auto lg:mx-0 lg:min-w-[400px]">
          {/* Mobile logo */}
          <div className="flex justify-center mb-8 lg:hidden">
            <img 
              src={logo} 
              alt="Logo" 
              className="h-14"
            />
          </div>

          <div className="bg-white rounded-3xl shadow-2xl shadow-gray-200/70 p-8 md:p-10 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome Back</h2>
            <p className="text-gray-500 text-sm mb-7">Sign in to your account to continue</p>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">User ID</label>
                <div className="relative">
                  <UserCircle2 size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#6D8CB5' }} />
                  <input
                    type="text"
                    value={identifier}
                    onChange={e => setIdentifier(e.target.value)}
                    placeholder="Enter your User ID"
                    required
                    className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm text-gray-900 placeholder-gray-400 bg-white/50 outline-none transition-all duration-200 focus:border-[#6D8CB5] focus:shadow-[0_0_0_4px_rgba(109,140,181,0.1)]"
                  />
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-semibold text-gray-700">PIN</label>
                  <button type="button" className="text-xs font-medium transition-colors hover:underline" style={{ color: '#6D8CB5' }}>
                    Forgot PIN?
                  </button>
                </div>
                <div className="relative">
                  <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#6D8CB5' }} />
                  <input
                    type={showPin ? "text" : "password"} 
                    value={pin} 
                    onChange={e => setPin(e.target.value)}
                    placeholder="Enter your PIN" 
                    required
                    maxLength={6}
                    className="w-full border border-gray-200 rounded-xl pl-10 pr-10 py-3 text-sm text-gray-900 placeholder-gray-400 bg-white/50 outline-none transition-all duration-200 focus:border-[#6D8CB5] focus:shadow-[0_0_0_4px_rgba(109,140,181,0.1)]"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPin(p => !p)} 
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              
              <button 
                type="submit" 
                disabled={loading} 
                className="w-full text-white font-semibold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                style={{ backgroundColor: '#1D6FB9', boxShadow: '0 4px 14px rgba(29, 111, 185, 0.35)' }}
                onMouseEnter={(e) => { if (!loading) { e.target.style.backgroundColor = '#165a94'; e.target.style.boxShadow = '0 6px 20px rgba(29, 111, 185, 0.45)'; }}}
                onMouseLeave={(e) => { e.target.style.backgroundColor = '#1D6FB9'; e.target.style.boxShadow = '0 4px 14px rgba(29, 111, 185, 0.35)'; }}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <LogIn size={18} />
                    <span>Sign In</span>
                  </>
                )}
              </button>
            </form>

            <p className="text-center text-xs text-gray-400 mt-6 border-t border-gray-100 pt-6">
              Protected by industry-grade security
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}