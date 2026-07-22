import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { UserRound, Send, ShieldCheck, RefreshCw, Check, ArrowLeft } from "lucide-react";
import { toast } from "react-toastify";
import logo from "../assests/logo 1.png";

const OTP_LENGTH = 4;
const OTP_EXPIRY_SECONDS = 292;
const RESEND_COOLDOWN_SECONDS = 45;

export default function LoginPage() {
  const [step, setStep] = useState("enterId");
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [expiryLeft, setExpiryLeft] = useState(OTP_EXPIRY_SECONDS);
  const [resendLeft, setResendLeft] = useState(RESEND_COOLDOWN_SECONDS);

  const { requestOtp, verifyOtp } = useAuth();
  const inputsRef = useRef([]);

  useEffect(() => {
    if (step !== "otpSent") return;
    const t = setInterval(() => {
      setExpiryLeft((v) => (v > 0 ? v - 1 : 0));
      setResendLeft((v) => (v > 0 ? v - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, [step]);

  const formatTime = (s) => {
    const m = String(Math.floor(s / 60)).padStart(2, "0");
    const sec = String(s % 60).padStart(2, "0");
    return `${m}:${sec}`;
  };

  const handleOtpChange = (i, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[i] = val;
    setOtp(next);
    if (val && i < OTP_LENGTH - 1) inputsRef.current[i + 1]?.focus();
  };

  const handleOtpKeyDown = (i, e) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) {
      inputsRef.current[i - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    const data = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!data) return;
    e.preventDefault();
    const next = Array(OTP_LENGTH).fill("");
    for (let i = 0; i < data.length; i++) next[i] = data[i];
    setOtp(next);
    inputsRef.current[Math.min(data.length, OTP_LENGTH - 1)]?.focus();
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!identifier.trim()) return;
    setLoading(true);
    try {
      const result = await requestOtp(identifier);
      if (result.success || result.message) {
        toast.success("OTP sent to your WhatsApp");
        setStep("otpSent");
        setExpiryLeft(OTP_EXPIRY_SECONDS);
        setResendLeft(RESEND_COOLDOWN_SECONDS);
        setOtp(Array(OTP_LENGTH).fill(""));
        setTimeout(() => inputsRef.current[0]?.focus(), 100);
      } else {
        toast.error(result.error || "Failed to send OTP");
      }
    } catch (err) {
      toast.error(err.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length !== OTP_LENGTH) {
      toast.error(`Please enter the ${OTP_LENGTH}-digit code`);
      return;
    }
    setLoading(true);
    try {
      const result = await verifyOtp(identifier, code);
      if (result.success || result.accessToken) {
        const name = result.user?.name ?? "";
        toast.success(`Welcome${name ? `, ${name}` : ""}!`);
      } else {
        toast.error(result.error || "Invalid OTP");
      }
    } catch (err) {
      toast.error(err.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendLeft > 0 || loading) return;
    setLoading(true);
    try {
      const result = await requestOtp(identifier);
      if (result.success || result.message) {
        toast.success("OTP resent");
        setExpiryLeft(OTP_EXPIRY_SECONDS);
        setResendLeft(RESEND_COOLDOWN_SECONDS);
        setOtp(Array(OTP_LENGTH).fill(""));
        inputsRef.current[0]?.focus();
      } else {
        toast.error(result.error || "Failed to resend OTP");
      }
    } catch (err) {
      toast.error(err.message || "Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  const goBackToEditId = () => {
    setStep("enterId");
    setOtp(Array(OTP_LENGTH).fill(""));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f4f7fb] px-4 py-6 relative overflow-hidden">
      {/* Background pattern */}
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage: "radial-gradient(circle at 2px 2px, #6D8CB5 1px, transparent 0)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative w-full max-w-4xl flex items-center gap-8 lg:gap-12">
        {/* Left - Logo (desktop) */}
        <div className="hidden lg:flex flex-1 items-center justify-center">
          <img
            src={logo}
            alt="Company Logo"
            className="w-full max-w-[280px] xl:max-w-[320px] object-contain drop-shadow-[0_20px_45px_rgba(29,111,185,0.16)]"
          />
        </div>

        {/* Right - Card */}
        <div className="w-full max-w-[340px] mx-auto lg:mx-0">
          
        {/* Mobile logo */}
<div className="flex justify-center mb-5 lg:hidden">
  <img
    src={logo}
    alt="Logo"
    className="h-32 sm:h-36 w-auto max-w-[260px] object-contain drop-shadow-[0_12px_28px_rgba(29,111,185,0.18)]"
  />
</div>

          <div className="bg-white rounded-2xl shadow-[0_15px_45px_rgba(15,23,42,0.08)] p-5 sm:p-6 border border-slate-100">
            {/* Heading with back arrow on step 2 */}
            <div className="relative text-center mb-4">
              {step === "otpSent" && (
                <button
                  type="button"
                  onClick={goBackToEditId}
                  className="absolute left-0 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-slate-500 hover:text-[#1D6FB9] hover:bg-slate-100 transition-colors"
                  aria-label="Back"
                >
                  <ArrowLeft size={16} />
                </button>
              )}
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                {step === "enterId" ? "Login" : "Verify OTP"}
              </h2>
              <p className="text-slate-500 text-[11px] mt-0.5">
                {step === "enterId"
                  ? "Sign in to continue"
                  : "Enter the code sent to your WhatsApp"}
              </p>
            </div>

            {/* Stepper */}
            <div className="flex items-center justify-center gap-1.5 mb-5">
              <div className="flex flex-col items-center">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold bg-[#1D6FB9] text-white">
                  {step === "otpSent" ? <Check size={12} /> : "1"}
                </div>
                <span
                  className={`text-[10px] mt-1 font-medium ${
                    step === "enterId" ? "text-[#1D6FB9]" : "text-slate-400"
                  }`}
                >
                  User ID
                </span>
              </div>

              <div className="flex-1 max-w-[50px] border-t border-dashed border-slate-300 -mt-4" />

              <div className="flex flex-col items-center">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold transition-all ${
                    step === "otpSent"
                      ? "bg-[#1D6FB9] text-white"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  2
                </div>
                <span
                  className={`text-[10px] mt-1 font-medium ${
                    step === "otpSent" ? "text-[#1D6FB9]" : "text-slate-400"
                  }`}
                >
                  Verify OTP
                </span>
              </div>
            </div>

            {/* STEP 1 - Enter User ID */}
            {step === "enterId" && (
              <form onSubmit={handleSendOtp} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1.5">
                    User ID
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2">
                      <UserRound size={14} className="text-slate-400" />
                    </span>
                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value.toUpperCase())}
                      placeholder="Enter your User ID"
                      required
                      className="w-full bg-white border border-slate-300 rounded-md pl-9 pr-3 py-2.5 text-xs text-slate-900 placeholder-slate-400 outline-none transition-colors focus:border-[#1D6FB9] focus:ring-2 focus:ring-[#1D6FB9]/20"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full text-white font-semibold py-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed text-xs hover:brightness-110"
                  style={{
                    background: "linear-gradient(135deg, #1D6FB9 0%, #175a97 100%)",
                    boxShadow: "0 6px 18px rgba(29, 111, 185, 0.25)",
                  }}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send size={13} />
                      <span>Get OTP</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* STEP 2 - Verify OTP */}
            {step === "otpSent" && (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                {/* OTP inputs */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[11px] font-medium text-slate-600">
                      Enter OTP
                    </label>
                    <span className="text-[10px] text-slate-500 tabular-nums">
                      {formatTime(expiryLeft)}
                    </span>
                  </div>

                  <div className="flex justify-center gap-2">
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => (inputsRef.current[i] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        onPaste={handleOtpPaste}
                        className="w-11 h-12 text-center text-lg font-semibold text-slate-800 bg-white border border-slate-300 rounded-md outline-none transition-colors focus:border-[#1D6FB9] focus:ring-2 focus:ring-[#1D6FB9]/20"
                      />
                    ))}
                  </div>
                </div>

                {/* Verify Button */}
                <button
                  type="submit"
                  disabled={loading || otp.join("").length !== OTP_LENGTH}
                  className="w-full text-white font-semibold py-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed text-xs hover:brightness-110"
                  style={{
                    background: "linear-gradient(135deg, #1D6FB9 0%, #175a97 100%)",
                    boxShadow: "0 6px 18px rgba(29, 111, 185, 0.25)",
                  }}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={13} />
                      <span>Verify OTP</span>
                    </>
                  )}
                </button>

                {/* Resend */}
                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendLeft > 0 || loading}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1D6FB9] disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
                  >
                    <RefreshCw size={10} />
                    {resendLeft > 0 ? (
                      <span>
                        Resend in{" "}
                        <span className="tabular-nums">
                          00:{String(resendLeft).padStart(2, "0")}
                        </span>
                      </span>
                    ) : (
                      <span>Resend OTP</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}