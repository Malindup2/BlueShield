import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogOut, Bell, User, AlertTriangle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = React.useState(new Date());
  const [showLogoutModal, setShowLogoutModal] = React.useState(false);

  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const currentRole = localStorage.getItem("userRole") || "USER";
  const formattedRole = currentRole.replace("_", " ");
  
  // Get user's actual name from stored user object
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const userName = storedUser.name || "Agent";

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 z-10 w-full relative">
      {/* 1. Session Information (Date/Time) */}
      <div className="flex items-center gap-6">
        <div className="hidden lg:flex flex-col">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Current Session</span>
          <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <span>{formatDate(currentTime)}</span>
            <span className="text-slate-300">|</span>
            <span className="text-blue-600 tracking-tight">{formatTime(currentTime)}</span>
          </div>
        </div>
      </div>

      {/* 2. User Controls & Greeting */}
      <div className="flex items-center gap-4">
        {/* User Greeting Block */}
        <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
          <div className="text-right">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Welcome back</div>
            <div className="text-sm font-bold text-[#0f172a]">
              {userName} <span className="text-blue-600 uppercase text-[10px] ml-1 px-1.5 py-0.5 bg-blue-50 rounded border border-blue-100 font-black">{formattedRole}</span>
            </div>
          </div>
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-blue-900/20 text-xs font-black">
            {userName.charAt(0).toUpperCase()}
          </div>
        </div>

        {/* Notifications */}
        <button className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition relative group">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white shadow-sm" />
        </button>
        
        {/* Logout Trigger */}
        <button 
          onClick={() => setShowLogoutModal(true)}
          className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition ml-1"
          title="Log Out"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      {/* Premium Confirmation Modal */}
      <AnimatePresence>
        {showLogoutModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Glass Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLogoutModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            
            {/* Modal Content */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="relative w-full max-w-sm bg-white rounded-3xl p-8 shadow-2xl border border-slate-200"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-6 border border-red-100">
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2">Secure Termination?</h3>
                <p className="text-slate-500 text-sm mb-8 leading-relaxed">
                  Are you sure you want to end your secure session? All unsaved intelligence data may be lost.
                </p>
                
                <div className="grid grid-cols-2 gap-3 w-full">
                  <button
                    onClick={() => setShowLogoutModal(false)}
                    className="py-3 px-4 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50 transition border border-slate-200"
                  >
                    Stay Online
                  </button>
                  <button
                    onClick={handleLogout}
                    className="py-3 px-4 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition shadow-lg shadow-red-500/20"
                  >
                    End Session
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </header>
  );
}
