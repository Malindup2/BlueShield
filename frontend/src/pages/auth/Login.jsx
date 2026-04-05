import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, ArrowRight, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import axios from "axios";
import toast from "react-hot-toast";

export default function Login() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await axios.post("http://localhost:5000/api/auth/login", formData);
      const data = response.data;
      
      // Save token & user to local storage
      localStorage.setItem("user", JSON.stringify(data));
      localStorage.setItem("token", data.token);
      localStorage.setItem("userRole", data.role); // Crucial for Sidebar and ProtectedRoute

      toast.success(`Welcome back, ${data.name}!`);
      
      // Role-based redirection mapping
      const roleDashboards = {
        FISHERMAN: "/dashboard/fisherman",
        OFFICER: "/dashboard/officer",
        HAZARD_ADMIN: "/dashboard/hazard-admin",
        ILLEGAL_ADMIN: "/dashboard/illegal-admin",
        SYSTEM_ADMIN: "/dashboard/system-admin",
      };

      // Redirect based on role, default to home if not found
      const dashboardPath = roleDashboards[data.role] || "/";
      navigate(dashboardPath);
    } catch (error) {
      console.error("Login error:", error);
      const message = error.response?.data?.message || "Login failed. Please check your credentials.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Left side: Hero Image / Vector */}
      <div className="hidden lg:flex w-1/2 relative bg-[#061428] items-center justify-center overflow-hidden h-screen">
        {/* Constrain max height so the user doesn't have to scroll on desktop */}
        <div className="relative w-full h-full max-h-screen p-8 flex items-center justify-center">
          <img
            src="/coast-guard-poster.jpg"
            alt="BlueShield Sentinel Guardian"
            className="max-w-full max-h-full object-contain object-center z-0 drop-shadow-2xl rounded-2xl"
          />
        </div>
      </div>

      {/* Right side: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 h-screen overflow-y-auto">
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Link to="/" className="inline-flex items-center text-sm font-semibold text-blue-600 mb-8 hover:text-blue-700 transition">
              &larr; Back to Home
            </Link>

            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Welcome back
            </h2>
            <p className="mt-2 text-slate-500 mb-8">
              Sign in to your BlueShield account to continue.
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
                    value={formData.email}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-slate-700" htmlFor="password">
                    Password
                  </label>
                  <a href="#" className="text-sm font-semibold text-blue-600 hover:text-blue-500">
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
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
                {loading ? "Signing in..." : "Sign in"}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-slate-600">
              Don't have an account?{" "}
              <Link to="/register" className="font-semibold text-blue-600 hover:text-blue-500 transition">
                Sign up
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
