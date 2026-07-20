import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { Eye, EyeOff, Lock, UserRound, LogIn } from "lucide-react";
import { toast } from "react-toastify";
import logo from "../assests/logo 1.png";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await login(identifier, pin);
      if (result.success) {
        toast.success(`Welcome back, ${result.user.name}!`);
      } else {
        toast.error(result.error || "Login failed. Please check your credentials.");
      }
    } catch (err) {
      toast.error(err.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f4f7fb] px-4 py-3 sm:p-6 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-[0.05]" style={{ 
        backgroundImage: "radial-gradient(circle at 2px 2px, #6D8CB5 1px, transparent 0)", 
        backgroundSize: "40px 40px" 
      }} />

      <div className="relative w-full max-w-5xl flex items-center gap-8 lg:gap-14">
        {/* Left - Logo */}
        <div className="hidden lg:flex flex-1 items-center justify-center">
          <img 
            src={logo} 
            alt="Company Logo" 
            className="w-full max-w-[320px] xl:max-w-[380px] object-contain drop-shadow-[0_20px_45px_rgba(29,111,185,0.16)]"
          />
        </div>

        {/* Right - Login Card */}
        <div className="w-full max-w-md mx-auto lg:mx-0 lg:min-w-[400px]">
          {/* Mobile / tablet logo */}
          <div className="flex justify-center mb-3 sm:mb-5 lg:hidden">
            <img 
              src={logo} 
              alt="Logo" 
              className="h-36 sm:h-36 w-auto max-w-[80%] object-contain"
            />
          </div>

          <div className="bg-white/90 backdrop-blur-xl rounded-2xl sm:rounded-[28px] shadow-[0_25px_70px_rgba(15,23,42,0.12)] p-4 sm:p-8 md:p-10 border border-white/70">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-0.5 sm:mb-1">Welcome Back</h2>
            <p className="text-gray-500 text-[11px] sm:text-xs md:text-sm mb-3 sm:mb-5 md:mb-7">Sign in to your account to continue</p>

            <form onSubmit={handleLogin} className="space-y-3 sm:space-y-5">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2">User ID</label>
                <div className="relative">
                  <span className="absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2">
                    <UserRound size={14} style={{ color: '#6D8CB5' }} className="sm:hidden" />
                    <UserRound size={18} style={{ color: '#6D8CB5' }} className="hidden sm:block" />
                  </span>
                  <input
                    type="text"
                    value={identifier}
                    onChange={e => setIdentifier(e.target.value.toUpperCase())}
                    placeholder="Enter your User ID"
                    required
                    className="w-full border border-slate-200/80 rounded-xl sm:rounded-2xl pl-10 sm:pl-14 pr-3 sm:pr-4 py-2.5 sm:py-3.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 bg-slate-50/80 shadow-[0_8px_24px_rgba(15,23,42,0.04)] outline-none transition-all duration-200 focus:border-[#1D6FB9] focus:bg-white focus:shadow-[0_0_0_4px_rgba(29,111,185,0.16)]"
                  />
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                  <label className="block text-xs sm:text-sm font-semibold text-slate-700">PIN</label>
                  <button type="button" className="text-[10px] sm:text-xs font-medium transition-colors hover:underline" style={{ color: '#6D8CB5' }}>
                    Forgot PIN?
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2">
                    <Lock size={14} style={{ color: '#6D8CB5' }} className="sm:hidden" />
                    <Lock size={18} style={{ color: '#6D8CB5' }} className="hidden sm:block" />
                  </span>
                  <input
                    type={showPin ? "text" : "password"} 
                    value={pin} 
                    onChange={e => setPin(e.target.value)}
                    placeholder="Enter your PIN" 
                    required
                    maxLength={6}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className="w-full border border-slate-200/80 rounded-xl sm:rounded-2xl pl-10 sm:pl-14 pr-10 sm:pr-12 py-2.5 sm:py-3.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 bg-slate-50/80 shadow-[0_8px_24px_rgba(15,23,42,0.04)] outline-none transition-all duration-200 focus:border-[#1D6FB9] focus:bg-white focus:shadow-[0_0_0_4px_rgba(29,111,185,0.16)]"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPin(p => !p)} 
                    className="absolute right-3 sm:right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPin ? <EyeOff size={14} className="sm:hidden" /> : <Eye size={14} className="sm:hidden" />}
                    {showPin ? <EyeOff size={18} className="hidden sm:block" /> : <Eye size={18} className="hidden sm:block" />}
                  </button>
                </div>
              </div>
              
              <button 
                type="submit" 
                disabled={loading} 
                className="w-full text-white font-semibold py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 text-xs sm:text-sm"
                style={{ backgroundColor: '#1D6FB9', boxShadow: '0 10px 24px rgba(29, 111, 185, 0.28)' }}
                onMouseEnter={(e) => { if (!loading) { e.target.style.backgroundColor = '#165a94'; e.target.style.boxShadow = '0 12px 28px rgba(29, 111, 185, 0.34)'; }}}
                onMouseLeave={(e) => { e.target.style.backgroundColor = '#1D6FB9'; e.target.style.boxShadow = '0 10px 24px rgba(29, 111, 185, 0.28)'; }}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5 sm:h-4 sm:w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <LogIn size={14} className="sm:hidden" />
                    <LogIn size={18} className="hidden sm:block" />
                    <span>Sign In</span>
                  </>
                )}
              </button>
            </form>

            <p className="text-center text-[10px] sm:text-xs text-gray-400 mt-4 sm:mt-6 border-t border-gray-100 pt-4 sm:pt-6">
              Protected by industry-grade security
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
