import React from "react";

export default function HazardAdminHome() {
  const currentRole = localStorage.getItem("userRole")?.replace("_", " ") || "ADMIN";

  return (
    <div className="space-y-8">
      {/* Premium Admin Header */}
      <div className="relative overflow-hidden bg-[#0f172a] p-10 md:p-12 rounded-3xl border border-slate-800 shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-full bg-amber-600/5 blur-[100px] pointer-events-none" />
        <div className="relative z-10 flex flex-col gap-6">
          <div>
            <div className="flex items-center gap-3 mb-5">
               <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-400 text-[10px] font-black uppercase tracking-[0.2em]">
                 Safety Authority
               </div>
            </div>
            <h2 className="text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.2]">
              Hazard Center: <span className="text-amber-500">{currentRole}</span>
            </h2>
          </div>
          <p className="text-slate-400 text-lg lg:text-xl font-medium max-w-3xl leading-relaxed">
            Managing environmental and navigational hazards. Broadcast critical alerts, monitor exclusion zones, and coordinate recovery efforts.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between group hover:shadow-md transition text-slate-400 gap-6">
           <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center border border-amber-100 group-hover:scale-105 transition-transform">
              <div className="w-6 h-6 border-2 border-amber-200 border-t-amber-600 rounded-full animate-spin" />
           </div>
           <div>
              <p className="text-xs font-black text-slate-400 tracking-[0.2em] mb-2">Exclusion Zones</p>
              <h4 className="text-2xl font-black text-slate-800 tracking-tighter">-- Active</h4>
           </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between group hover:shadow-md transition text-slate-400 gap-6">
           <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100 group-hover:scale-105 transition-transform">
              <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
           </div>
           <div>
              <p className="text-xs font-black text-slate-400 tracking-[0.2em] mb-2">Broadcast Alerts</p>
              <h4 className="text-2xl font-black text-slate-800 tracking-tighter">-- Queueing</h4>
           </div>
        </div>

        <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-xl flex flex-col items-center justify-center text-center gap-4 group">
            <div className="w-16 h-16 bg-blue-600/10 rounded-full p-4 border border-blue-500/20 mb-2">
                <div className="w-full h-full bg-blue-600 rounded-full shadow-[0_0_20px_rgba(37,99,235,0.4)] animate-pulse" />
            </div>
            <p className="text-[10px] font-black text-blue-400 tracking-[0.3em] uppercase">Emergency Uplink</p>
            <p className="text-xs text-slate-400 font-medium leading-relaxed">SatComm is online and monitoring all regional AIS streams.</p>
        </div>
      </div>
    </div>
  );
}
