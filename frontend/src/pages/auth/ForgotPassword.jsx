import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowRight, HelpCircle, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import axios from "axios";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/forgot-password`, { email });
      setSubmitted(true);
      toast.success("Reset link sent!");
    } catch (error) {
      console.error("Forgot password error:", error);
      const message = error.response?.data?.message || "Failed to send reset link.";
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
            alt="Security support"
            className="max-w-full max-h-full object-contain object-center z-0 drop-shadow-2xl rounded-2xl"
          />
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-5 sm:p-8 md:p-12 min-h-screen lg:h-screen overflow-y-auto">
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Link to="/login" className="inline-flex items-center text-sm font-semibold text-blue-600 mb-8 hover:text-blue-700 transition">
              &larr; Back to Login
            </Link>

            {submitted ? (
              <div className="text-center">
                <div className="flex justify-center mb-6">
                  <div className="bg-green-100 p-4 rounded-full">
                    <CheckCircle2 className="w-12 h-12 text-green-600" />
                  </div>
                </div>
                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  Check your inbox
                </h2>
                <p className="mt-4 text-slate-500 mb-8 leading-relaxed">
                  We've sent a password reset link to <span className="font-semibold text-slate-900">{email}</span>. 
                  Please follow the instructions in the email to reset your password.
                </p>
                <div className="space-y-4">
                  <p className="text-sm text-slate-500">
                    Didn't receive an email? Check your spam folder or
                  </p>
                  <button 
                    onClick={() => setSubmitted(false)}
                    className="w-full py-3 px-4 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition"
                  >
                    Try again
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-6 flex justify-center lg:justify-start">
                  <div className="bg-blue-100 p-3 rounded-xl">
                    <HelpCircle className="w-8 h-8 text-blue-600" />
                  </div>
                </div>
                
                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  Forgot password?
                </h2>
                <p className="mt-2 text-slate-500 mb-8 leading-relaxed">
                  Enter the email address associated with your account and we'll send you a link to reset your password.
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700" htmlFor="email">
                      Email address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-slate-400" />
                      </div>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition"
                        placeholder="you@example.com"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {loading ? "Sending..." : "Send Reset Link"}
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
