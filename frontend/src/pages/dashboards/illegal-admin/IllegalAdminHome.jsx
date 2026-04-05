import React from "react";

export default function IllegalAdminHome() {
  const currentRole = localStorage.getItem("userRole")?.replace("_", " ") || "ADMIN";

  return (
    <div className="space-y-8">
      {/* Premium Admin Header */}
      <div className="relative overflow-hidden bg-[#0f172a] p-10 md:p-12 rounded-3xl border border-slate-800 shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-full bg-red-600/5 blur-[100px] pointer-events-none" />
        <div className="relative z-10 flex flex-col gap-6">
          <div>
            <div className="flex items-center gap-3 mb-5">
               <div className="px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full text-red-400 text-[10px] font-black uppercase tracking-[0.2em]">
                 Enforcement Authority
               </div>
            </div>
            <h2 className="text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.2]">
              Case Control: <span className="text-red-500">{currentRole}</span>
            </h2>
          </div>
          <p className="text-slate-400 text-lg lg:text-xl font-medium max-w-3xl leading-relaxed">
            Overseeing maritime legal workflows. Review evidence, authorize enforcement actions, and maintain regional jurisdiction logs.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm min-h-[300px] flex flex-col justify-center items-center text-slate-400">
           <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 border border-slate-100">
              <div className="w-8 h-8 border-4 border-slate-200 border-t-red-600 rounded-full animate-spin" />
           </div>
           <p className="text-sm font-bold uppercase tracking-[0.2em]">Active Violations Queue</p>
           <p className="text-xs mt-2 text-slate-300">Synchronizing with Coast Guard Database...</p>
        </div>
        <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 shadow-inner flex flex-col justify-between">
           <div>
             <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest mb-4">Quick Stats</h3>
             <div className="space-y-4">
               <div>
                 <p className="text-[10px] font-bold text-slate-400 uppercase">Open Cases</p>
                 <p className="text-2xl font-black text-slate-900 tracking-tighter">--</p>
               </div>
               <div className="h-px bg-slate-200 w-full" />
               <div>
                 <p className="text-[10px] font-bold text-slate-400 uppercase">Resolved 24h</p>
                 <p className="text-2xl font-black text-slate-900 tracking-tighter">--</p>
               </div>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}
