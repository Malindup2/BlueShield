import React, { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Lock, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import axios from "axios";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { token } = useParams();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      return toast.error("Passwords do not match");
    }
    
    if (password.length < 8) {
      return toast.error("Password must be at least 8 characters");
    }

    setLoading(true);
    
    try {
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/reset-password/${token}`, { password });
      setSuccess(true);
      toast.success("Password reset successfully!");
      setTimeout(() => navigate("/login"), 3000);
    } catch (error) {
      console.error("Reset password error:", error);
      const message = error.response?.data?.message || "Failed to reset password.";
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
            alt="Security guard"
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
            {success ? (
              <div className="text-center">
                <div className="flex justify-center mb-6">
                  <div className="bg-green-100 p-4 rounded-full">
                    <CheckCircle2 className="w-12 h-12 text-green-600" />
                  </div>
                </div>
                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  Password updated
                </h2>
                <p className="mt-4 text-slate-500 mb-8 leading-relaxed">
                  Your password has been reset successfully. You will be redirected to the login page shortly.
                </p>
                <Link 
                  to="/login"
                  className="w-full inline-flex justify-center items-center py-3 px-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition"
                >
                  Go to Login Now
                </Link>
              </div>
            ) : (
              <>
                <div className="mb-6 flex justify-center lg:justify-start">
                  <div className="bg-blue-100 p-3 rounded-xl">
                    <ShieldCheck className="w-8 h-8 text-blue-600" />
                  </div>
                </div>
                
                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  Create new password
                </h2>
                <p className="mt-2 text-slate-500 mb-8 leading-relaxed">
                  Your new password must be different from previous used passwords.
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700" htmlFor="password">
                      New Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-slate-400" />
                      </div>
                      <input
                        id="password"
                        name="password"
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700" htmlFor="confirmPassword">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-slate-400" />
                      </div>
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {loading ? "Updating..." : "Reset Password"}
                    {!loading && <ArrowRight className="w-4 h-4" />}
                  </button>
                </form>
              </>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
