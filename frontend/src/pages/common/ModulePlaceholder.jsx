import React from "react";

export default function ModulePlaceholder({ title = "Module", note = "This section will be implemented by the team." }) {
  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 p-8 shadow-xl">
        <div className="absolute -top-16 -right-8 h-48 w-48 rounded-full bg-blue-400/20 blur-3xl" />
        <div className="absolute -bottom-12 -left-8 h-48 w-48 rounded-full bg-cyan-300/10 blur-3xl" />

        <div className="relative z-10">
          <p className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-blue-100">
            Pending Module
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-white">{title}</h2>
          <p className="text-slate-200 mt-2 max-w-2xl">{note}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <p className="text-sm font-semibold text-slate-600">
          This page is intentionally left as a placeholder while the feature is under development.
        </p>
      </div>
    </div>
  );
}
