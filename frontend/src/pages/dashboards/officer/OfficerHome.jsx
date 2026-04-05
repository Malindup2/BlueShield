import React from "react";

export default function OfficerHome() {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-800">Enforcement Center</h2>
        <p className="text-slate-600 mt-2">
          Welcome Officer. Here you can view escalated illegal cases, log enforcement actions, and upload critical evidence. 
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm h-96 flex items-center justify-center text-slate-400">
        Active Caseload Table Placeholder
      </div>
    </div>
  );
}
