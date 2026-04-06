import React from "react";

export default function SystemAdminHome() {
  const currentRole = localStorage.getItem("userRole")?.replace("_", " ") || "ADMIN";

  return (
    <div className="space-y-8">
      {/* Premium Admin Header */}
      <div className="relative overflow-hidden bg-[#0f172a] p-10 md:p-12 rounded-3xl border border-slate-800 shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-full bg-blue-600/10 blur-[100px] pointer-events-none" />
        <div className="relative z-10 flex flex-col gap-6">
          <div>
            <div className="flex items-center gap-3 mb-5">
               <div className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-[10px] font-black uppercase tracking-[0.2em]">
                 Platform Authority
               </div>
            </div>
            <h2 className="text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.2]">
              Welcome, <span className="text-blue-500">{currentRole}</span>
            </h2>
          </div>
          <p className="text-slate-400 text-lg lg:text-xl font-medium max-w-3xl leading-relaxed">
            Global system oversight enabled. Monitor platform health, manage sensitive user roles, and audit automated enforcement logs.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-64 flex flex-col items-center justify-center text-slate-400 gap-4">
           <div className="w-12 h-12 bg-slate-50 rounded-full border border-slate-100 flex items-center justify-center">
             <div className="w-6 h-6 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
           </div>
           <p className="font-bold text-sm tracking-widest uppercase">User Roles Management</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-64 flex flex-col items-center justify-center text-slate-400 gap-4">
           <div className="w-12 h-12 bg-slate-50 rounded-full border border-slate-100 flex items-center justify-center">
             <div className="w-6 h-6 border-2 border-slate-200 border-t-red-500 rounded-full animate-spin" />
           </div>
           <p className="font-bold text-sm tracking-widest uppercase">System Health Logs</p>
        </div>
      </div>
    </div>
  );
}
