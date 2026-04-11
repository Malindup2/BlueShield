import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ShieldCheck, ArrowRight, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import API_BASE_URL from "../../config/api";

export default function VerifyOTP() {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  // Get email from navigation state
  const email = location.state?.email;

  // Countdown for resend button
  React.useEffect(() => {
    let timer;
    if (resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendTimer]);

  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="text-center max-w-md bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Invalid Access</h2>
          <p className="text-slate-600 mb-6">Please start the registration process again.</p>
          <Link to="/register" className="inline-block py-3 px-6 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition">
            Go to Register
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      return toast.error("Please enter a 6-digit code");
    }

    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/auth/verify-otp`, {
        email,
        otp,
      });

      toast.success("Account verified successfully! You can now log in.");
      navigate("/login", { state: { email } });
    } catch (error) {
      console.error("Verification error:", error);
      const message = error.response?.data?.message || "Verification failed. Please check the code.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/auth/resend-otp`, { email });
      toast("A new verification code has been sent!");
      setResendTimer(60); // 1 minute cooldown
    } catch (error) {
      const message = error.response?.data?.message || "Failed to resend code.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <div className="hidden lg:flex w-1/2 relative bg-[#061428] items-center justify-center overflow-hidden h-screen">
        <div className="relative w-full h-full max-h-screen p-8 flex items-center justify-center">
          <img
            src="/coast-guard-poster.jpg"
            alt="Security Verification"
            className="max-w-full max-h-full object-contain object-center z-0 drop-shadow-2xl rounded-2xl"
          />
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-5 sm:p-8 md:p-12 min-h-screen lg:h-screen overflow-y-auto">
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex justify-center mb-6">
              <div className="bg-blue-100 p-4 rounded-full">
                <ShieldCheck className="w-12 h-12 text-blue-600" />
              </div>
            </div>

            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight text-center">
              Verify your email
            </h2>
            <p className="mt-2 text-slate-500 mb-8 text-center px-4">
              We've sent a 6-digit code to <span className="font-semibold text-slate-900">{email}</span>.
              Enter it below to confirm your account.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 block text-center" htmlFor="otp">
                  Verification Code
                </label>
                <input
                  id="otp"
                  name="otp"
                  type="text"
                  maxLength="6"
                  required
                  autoFocus
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  className="block w-full text-center text-3xl tracking-[0.5em] font-mono py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition"
                  placeholder="000000"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-4 px-4 border border-transparent rounded-2xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? "Verifying..." : "Verify Account"}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>

            <div className="mt-8 text-center">
              <button 
                onClick={handleResend}
                disabled={resendTimer > 0 || loading}
                className={`inline-flex items-center gap-2 text-sm font-semibold transition ${
                  resendTimer > 0 ? "text-slate-400 cursor-not-allowed" : "text-blue-600 hover:text-blue-700"
                }`}
              >
                <RefreshCw className={`w-4 h-4 ${loading && "animate-spin"}`} />
                {resendTimer > 0 ? `Resend code in ${resendTimer}s` : "Resend code"}
              </button>
            </div>

            <p className="mt-8 text-center text-sm text-slate-600">
              Entered the wrong email?{" "}
              <Link to="/register" className="font-semibold text-blue-600 hover:text-blue-500 transition">
                Change email
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
