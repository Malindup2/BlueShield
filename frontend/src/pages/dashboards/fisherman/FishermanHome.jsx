import React from "react";

export default function FishermanHome() {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-800">Welcome, Fisherman!</h2>
        <p className="text-slate-600 mt-2">
          This is your personal dashboard. From here, you can view the marine safety map, submit new incident reports, and track the status of your previous reports.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Placeholder cards for future development */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-32 flex items-center justify-center text-slate-400">
          Stat Card Placeholder
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-32 flex items-center justify-center text-slate-400">
          Stat Card Placeholder
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-32 flex items-center justify-center text-slate-400">
          Stat Card Placeholder
        </div>
      </div>
    </div>
  );
}
